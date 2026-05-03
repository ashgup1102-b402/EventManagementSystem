const { User, Entity, AuditLog } = require('../models');
const { Op } = require('sequelize');

// Helper to generate 5-char alphanumeric code for users
const generateUserCode = async () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  let isUnique = false;
  while (!isUnique) {
    code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await User.findOne({ where: { user_code: code } });
    if (!existing) isUnique = true;
  }
  return code;
};

// GET /api/users
const getAll = async (req, res, next) => {
  try {
    const { role, status, search, from_date, to_date, page = 1, limit = 20 } = req.query;
    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;
    
    if (from_date && to_date) {
      where.createdAt = {
        [Op.between]: [new Date(from_date), new Date(to_date)]
      };
    }

    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { user_code: { [Op.iLike]: `%${search}%` } },
        { unique_number: { [Op.iLike]: `%${search}%` } }
      ];
    }
    const offset = (page - 1) * limit;
    const { rows, count } = await User.findAndCountAll({
      where, limit: parseInt(limit), offset: parseInt(offset),
      order: [
        ['status', 'ASC'],
        ['username', 'ASC'],
        ['role', 'ASC']
      ],
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

// POST /api/users
const create = async (req, res, next) => {
  try {
    const { email, role, first_name, last_name, mobile_1, pan_number, aadhar_number, entity_id } = req.body;
    
    if (req.user.role === 'Admin' && ['Admin', 'Super Admin'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Admins cannot create admin-level users.' });
    }

    if (role === 'Entity' && !entity_id) {
      return res.status(400).json({ success: false, message: 'Users with role "Entity" must be mapped to an Entity.' });
    }

    // Generate codes
    const user_code = await generateUserCode();
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
    const unique_number = `${dateStr}${user_code}`;

    const user = await User.create({
      username: unique_number,
      user_code,
      unique_number,
      email,
      password_hash: req.body.password || 'User123',
      role,
      first_name,
      last_name,
      mobile_1,
      pan_number,
      aadhar_number,
      status: 'Active'
    });

    // Link to Entity if role is Entity
    if (role === 'Entity' && entity_id) {
      await Entity.update({ entity_user_id: user.id }, { where: { id: entity_id } });
    }

    await AuditLog.create({
      user_id: req.user.id, action: 'CREATE_USER', entity_type: 'User',
      entity_id: user.id, new_values: { username: unique_number, role, entity_id }
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
    const { first_name, last_name, mobile_1, email, status, role, password, entity_id } = req.body;
    
    const updateData = { first_name, last_name, mobile_1, email, status };
    if (req.user.role === 'Super Admin' && role) updateData.role = role;
    if (req.user.role === 'Super Admin' && password) updateData.password_hash = password;
    
    if (updateData.role === 'Entity' && !entity_id) {
       // Check if already mapped
       const mapped = await Entity.findOne({ where: { entity_user_id: user.id } });
       if (!mapped && status === 'Active') {
         return res.status(400).json({ success: false, message: 'Users with role "Entity" must be mapped to an Entity before being activated.' });
       }
    }

    // Validation: Only one active user per entity
    if ((role === 'Entity' || user.role === 'Entity') && status === 'Active') {
      const targetEntityId = entity_id || (await Entity.findOne({ where: { entity_user_id: user.id } }))?.id;
      if (targetEntityId) {
        const otherActiveUser = await User.findOne({
          where: {
            role: 'Entity',
            status: 'Active',
            id: { [Op.ne]: user.id }
          },
          include: [{
            model: Entity,
            as: 'mapped_entity', // I need to make sure this association exists or query Entity
            where: { id: targetEntityId }
          }]
        });
        
        // Alternative query since association might not be bi-directional in all directions
        const ent = await Entity.findByPk(targetEntityId);
        const existingActiveUser = await User.findOne({
          where: {
            id: ent.entity_user_id,
            status: 'Active',
            role: 'Entity'
          }
        });

        if (existingActiveUser && existingActiveUser.id !== user.id) {
          return res.status(400).json({ success: false, message: 'This Entity already has an active user assigned.' });
        }
      }
    }

    // Admin cannot edit Super Admin
    if (user.role === 'Super Admin' && req.user.role !== 'Super Admin') {
      return res.status(403).json({ success: false, message: 'Only Super Admin can modify a Super Admin user.' });
    }
    
    await user.update(updateData);

    // Update Entity mapping if provided
    if (entity_id && (role === 'Entity' || user.role === 'Entity')) {
       // Remove old mapping
       await Entity.update({ entity_user_id: null }, { where: { entity_user_id: user.id } });
       // Set new mapping
       await Entity.update({ entity_user_id: user.id }, { where: { id: entity_id } });
    }

    await AuditLog.create({
      user_id: req.user.id, action: 'UPDATE_USER', entity_type: 'User',
      entity_id: user.id, old_values: oldValues, new_values: updateData
    });
    res.json({ success: true, message: 'User updated.', data: user.toJSON() });
  } catch (err) { next(err); }
};

// DELETE /api/users/:id
const remove = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    
    // Admins and Super Admins cannot be deleted at all
    if (['Admin', 'Super Admin'].includes(user.role)) {
       return res.status(403).json({ success: false, message: 'Administrative accounts cannot be deleted; they can only be deactivated.' });
    }

    // Entity and End_User can only be deleted if they are Inactive
    if (user.status === 'Active') {
      return res.status(400).json({ success: false, message: 'User must be deactivated before they can be completely deleted.' });
    }

    // Unlink from Entity if mapped to prevent FK constraints
    await Entity.update({ entity_user_id: null }, { where: { entity_user_id: user.id } });

    await user.destroy();
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) { next(err); }
};

const updateMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const { first_name, last_name, email, mobile_1, preferences } = req.body;
    const updateData = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (email !== undefined) updateData.email = email;
    if (mobile_1 !== undefined) updateData.mobile_1 = mobile_1;

    if (preferences) {
      try {
        updateData.preferences = typeof preferences === 'string' ? JSON.parse(preferences) : preferences;
      } catch (e) {
        console.error('Error parsing preferences:', e);
      }
    }

    if (req.file) {
      updateData.profile_photo = `/uploads/users/${req.file.filename}`;
    }

    console.log('UPDATING PROFILE for user:', req.user.id, updateData);
    await user.update(updateData);

    await AuditLog.create({
      user_id: req.user.id, action: 'UPDATE_PROFILE',
      entity_type: 'User', entity_id: user.id,
      old_values: { first_name: user.first_name, last_name: user.last_name, email: user.email },
      new_values: updateData
    });

    res.json({ success: true, message: 'Profile updated successfully.', data: user });
  } catch (err) { 
    console.error('PROFILE UPDATE ERROR:', err);
    next(err); 
  }
};

module.exports = { getAll, getOne, create, update, remove, updateMe };
