const { Entity, User, Event, MenuItem, Booking, AuditLog, Category, sequelize } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// Helper to generate 8-char alphanumeric code
const generateEntityCode = async () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  let isUnique = false;
  while (!isUnique) {
    code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await Entity.findOne({ where: { entity_code: code } });
    if (!existing) isUnique = true;
  }
  return code;
};

// GET /api/entities
const getAll = async (req, res, next) => {
  try {
    const { city, category_id, status, search, from_date, to_date, page = 1, limit = 20 } = req.query;
    const where = {};
    if (city) where.city = { [Op.iLike]: `%${city}%` };
    if (category_id) where.category_id = category_id;
    if (status) where.status = status;
    
    if (from_date && to_date) {
      where.createdAt = {
        [Op.between]: [new Date(from_date), new Date(to_date)]
      };
    }

    if (search) where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { city: { [Op.iLike]: `%${search}%` } },
      { entity_code: { [Op.iLike]: `%${search}%` } },
      { unique_number: { [Op.iLike]: `%${search}%` } }
    ];

    // Non-super-admin entity users only see their own
    if (req.user?.role === 'Entity') {
      where.entity_user_id = req.user.id;
    }

    const offset = (page - 1) * limit;
    const { rows, count } = await Entity.findAndCountAll({
      where, limit: parseInt(limit), offset: parseInt(offset),
      include: [
        { model: User, as: 'admin', attributes: ['id','username','email'] },
        { model: Category, as: 'entity_category', attributes: ['id','name'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: rows, meta: { total: count, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
};

// GET /api/entities/:id
const getOne = async (req, res, next) => {
  try {
    const entity = await Entity.findByPk(req.params.id, {
      include: [
        { model: User, as: 'admin', attributes: ['id','username','email','phone'] },
        { model: Category, as: 'entity_category', attributes: ['id','name'] },
        { model: Event, as: 'events', required: false },
        { model: MenuItem, as: 'menu_items', required: false }
      ]
    });
    if (!entity) return res.status(404).json({ success: false, message: 'Entity not found.' });
    res.json({ success: true, data: entity });
  } catch (err) { next(err); }
};

// POST /api/entities
const create = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const data = req.body;
    if (!data.admin_user_id) data.admin_user_id = req.user.id;

    // Manual or Random Entity Code
    let entity_code = data.entity_code;
    if (!entity_code || entity_code.length !== 8) {
      entity_code = await generateEntityCode();
    } else {
      const existing = await Entity.findOne({ where: { entity_code } });
      if (existing) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Entity Code already in use.' });
      }
    }

    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
    const unique_number = `${dateStr}${entity_code}`;
    
    data.entity_code = entity_code;
    data.unique_number = unique_number;

    // ... rest same ...
    const newUser = await User.create({
      username: unique_number,
      password_hash: 'Entity123',
      email: data.email || `${unique_number}@system.local`,
      role: 'Entity',
      status: 'Active',
      mobile_1: data.mobile_1,
      first_name: data.name
    }, { transaction: t });

    data.entity_user_id = newUser.id;
    const entity = await Entity.create(data, { transaction: t });

    await AuditLog.create({
      user_id: req.user.id, action: 'CREATE_ENTITY', entity_type: 'Entity',
      entity_id: entity.id, new_values: { name: entity.name, unique_number }
    }, { transaction: t });

    await t.commit();
    res.status(201).json({ success: true, message: 'Entity created.', data: entity });
  } catch (err) { 
    await t.rollback();
    next(err); 
  }
};

// PUT /api/entities/:id
const update = async (req, res, next) => {
  try {
    const entity = await Entity.findByPk(req.params.id);
    if (!entity) return res.status(404).json({ success: false, message: 'Entity not found.' });

    if (req.user.role === 'Entity' && entity.entity_user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Clean body: remove nested objects that might crash update
    const updateData = { ...req.body };
    delete updateData.admin;
    delete updateData.entity_category;
    delete updateData.events;
    delete updateData.menu_items;
    delete updateData.unique_number; // recalculate below if code changes

    if (req.body.entity_code && req.body.entity_code !== entity.entity_code) {
      if (req.body.entity_code.length !== 8) {
        return res.status(400).json({ success: false, message: 'Entity Code must be 8 characters.' });
      }
      const existing = await Entity.findOne({ where: { entity_code: req.body.entity_code, id: { [Op.ne]: entity.id } } });
      if (existing) return res.status(400).json({ success: false, message: 'Entity Code already in use.' });
      
      // Recalculate unique_number using original creation date
      const dateStr = new Date(entity.createdAt).toISOString().slice(0,10).replace(/-/g, '');
      updateData.unique_number = `${dateStr}${req.body.entity_code}`;
      updateData.entity_code = req.body.entity_code;
    } else {
      delete updateData.entity_code;
    }

    if (req.file) {
      updateData.cover_image = `/uploads/properties/${req.file.filename}`;
    }

    const oldValues = entity.toJSON();
    await entity.update(updateData);

    // Synchronize changes to the associated User account
    if (entity.entity_user_id) {
      const userUpdate = {};
      if (updateData.unique_number) userUpdate.username = updateData.unique_number;
      if (updateData.name) userUpdate.first_name = updateData.name;
      
      if (Object.keys(userUpdate).length > 0) {
        await User.update(userUpdate, { where: { id: entity.entity_user_id } });
      }
    }

    await AuditLog.create({
      user_id: req.user.id, action: 'UPDATE_ENTITY', entity_type: 'Entity',
      entity_id: entity.id, old_values: oldValues, new_values: updateData
    });
    res.json({ success: true, message: 'Entity updated.', data: entity });
  } catch (err) { next(err); }
};

// DELETE /api/entities/:id
const remove = async (req, res, next) => {
  try {
    const entity = await Entity.findByPk(req.params.id);
    if (!entity) return res.status(404).json({ success: false, message: 'Entity not found.' });
    await entity.update({ status: 'Inactive' });
    res.json({ success: true, message: 'Entity deactivated.' });
  } catch (err) { next(err); }
};

const getMyEntity = async (req, res, next) => {
  try {
    const entity = await Entity.findOne({
      where: { entity_user_id: req.user.id },
      include: [{ model: User, as: 'admin', attributes: ['id','username','email'] }]
    });
    if (!entity) return res.status(404).json({ success: false, message: 'No entity assigned to your account.' });
    res.json({ success: true, data: entity });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove, getMyEntity };
