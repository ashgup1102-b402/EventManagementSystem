const jwt = require('jsonwebtoken');
const { User, Role, AuditLog, SystemConfig } = require('../models');

const generateToken = (user) => jwt.sign(
  { id: user.id, role: user.role, username: user.username },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    
    // Check account status
    if (!user.is_active || user.status === 'Inactive') {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
    }

    // Check Role status
    const roleRecord = await Role.findOne({ where: { name: user.role } });
    if (roleRecord && roleRecord.status === 'Inactive') {
      return res.status(403).json({ success: false, message: 'Your assigned role is currently inactive. Please contact administrator.' });
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    await user.update({ last_login: new Date() });

    // Log audit
    await AuditLog.create({
      user_id: user.id, action: 'LOGIN', entity_type: 'User', entity_id: user.id,
      ip_address: req.ip, user_agent: req.headers['user-agent']
    });

    const token = generateToken(user);
    res.json({
      success: true,
      message: 'Login successful.',
      data: { token, user: user.toJSON() }
    });
  } catch (err) { next(err); }
};

// POST /api/auth/register  (self-registration for end_users only)
const register = async (req, res, next) => {
  try {
    const { username, email, password, first_name, last_name, phone } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email, and password are required.' });
    }

    const existing = await User.findOne({ where: { username } });
    if (existing) return res.status(409).json({ success: false, message: 'Username already taken.' });

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) return res.status(409).json({ success: false, message: 'Email already registered.' });

    const user = await User.create({
      username, email, password_hash: password,
      first_name, last_name, phone, role: 'End_User'
    });

    const token = generateToken(user);
    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: { token, user: user.toJSON() }
    });
  } catch (err) { next(err); }
};

// GET /api/auth/me
const me = async (req, res) => {
  res.json({ success: true, data: req.user.toJSON() });
};

// PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }
    const user = await User.findByPk(req.user.id);
    const isValid = await user.validatePassword(current_password);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    await user.update({ password_hash: new_password });
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) { next(err); }
};

// PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const { first_name, last_name, phone, email } = req.body;
    const user = await User.findByPk(req.user.id);
    await user.update({ first_name, last_name, phone, email });
    res.json({ success: true, message: 'Profile updated.', data: user.toJSON() });
  } catch (err) { next(err); }
};

module.exports = { login, register, me, changePassword, updateProfile };
