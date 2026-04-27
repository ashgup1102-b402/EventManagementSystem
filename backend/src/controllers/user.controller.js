const { User, Property, AuditLog } = require('../models');
const { Op } = require('sequelize');

// GET /api/users  (admin+)
const getAll = async (req, res, next) => {
  try {
    const { role, is_active, search, page = 1, limit = 20 } = req.query;
    const where = {};
    if (role) where.role = role;
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } }
      ];
    }
    const offset = (page - 1) * limit;
    const { rows, count } = await User.findAndCountAll({
      where, limit: parseInt(limit), offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['password_hash'] }
    });
    res.json({ success: true, data: rows, meta: { total: count, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
};

// GET /api/users/:id
const getOne = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password_hash'] } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// POST /api/users  (admin creates property/admin users)
const create = async (req, res, next) => {
  try {
    const { username, email, password, role, first_name, last_name, phone } = req.body;
    // Super admin can create any role; admin can only create property/end_user
    if (req.user.role === 'admin' && ['admin', 'super_admin'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Admins cannot create admin-level users.' });
    }
    const user = await User.create({ username, email, password_hash: password, role, first_name, last_name, phone });
    await AuditLog.create({
      user_id: req.user.id, action: 'CREATE_USER', entity_type: 'User',
      entity_id: user.id, new_values: { username, role }
    });
    res.status(201).json({ success: true, message: 'User created.', data: user.toJSON() });
  } catch (err) { next(err); }
};

// PUT /api/users/:id
const update = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const oldValues = user.toJSON();
    const { first_name, last_name, phone, email, is_active, role, password } = req.body;
    const updateData = { first_name, last_name, phone, email, is_active };
    if (req.user.role === 'super_admin' && role) updateData.role = role;
    if (req.user.role === 'super_admin' && password) updateData.password_hash = password;
    await user.update(updateData);
    await AuditLog.create({
      user_id: req.user.id, action: 'UPDATE_USER', entity_type: 'User',
      entity_id: user.id, old_values: oldValues, new_values: updateData
    });
    res.json({ success: true, message: 'User updated.', data: user.toJSON() });
  } catch (err) { next(err); }
};

// DELETE /api/users/:id (super_admin only - soft delete)
const remove = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    await user.update({ is_active: false });
    res.json({ success: true, message: 'User deactivated.' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };
