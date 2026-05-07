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
    const data = { ...req.body };
    Object.keys(data).forEach(k => { 
      if (data[k] === '' || data[k] === 'null' || data[k] === 'undefined') data[k] = null; 
    });
    delete data.cover_image;
    delete data.profile_photo;

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

    if (req.file) data.cover_image = `/uploads/properties/${req.file.filename}`;

    // Parse JSON fields from strings (needed for FormData)
    ['cuisine_types', 'amenities', 'tags', 'gallery'].forEach(key => {
      if (typeof data[key] === 'string') {
        try {
          data[key] = JSON.parse(data[key]);
        } catch (e) {
          if (data[key].includes(',')) {
            data[key] = data[key].split(',').map(s => s.trim());
          } else if (data[key]) {
            data[key] = [data[key]];
          } else {
            data[key] = [];
          }
        }
      }
    });
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
      entity_id: entity.id, new_values: { name: entity.name, unique_number },
      ip_address: req.ip, user_agent: req.headers['user-agent']
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

    // Clean body: remove nested objects and internal fields
    const updateData = { ...req.body };
    Object.keys(updateData).forEach(k => { 
      if (updateData[k] === '' || updateData[k] === 'null' || updateData[k] === 'undefined') updateData[k] = null; 
    });

    const fs = require('fs');
    fs.appendFileSync('debug_log.txt', `[DEBUG] ${new Date().toISOString()}\n`);
    fs.appendFileSync('debug_log.txt', `HEADERS: ${JSON.stringify(req.headers)}\n`);
    fs.appendFileSync('debug_log.txt', `BODY: ${JSON.stringify(req.body)}\n`);
    fs.appendFileSync('debug_log.txt', `FILES: ${JSON.stringify(req.files)}\n`);
    fs.appendFileSync('debug_log.txt', `FILE: ${JSON.stringify(req.file)}\n\n`);

    // CRITICAL: Only delete if it's a string path from the body, 
    // to prevent it from overwriting the file-based update later.
    // However, if no file is uploaded, we want to KEEP the current DB value, 
    // so we should remove it from updateData entirely.
    delete updateData.cover_image;
    delete updateData.profile_photo;
    
    delete updateData.admin;
    delete updateData.entity_category;
    delete updateData.events;
    delete updateData.menu_items;
    delete updateData.unique_number;

    // Parse JSON fields from strings (needed for FormData)
    ['cuisine_types', 'amenities', 'tags', 'gallery'].forEach(key => {
      if (typeof updateData[key] === 'string') {
        try {
          updateData[key] = JSON.parse(updateData[key]);
        } catch (e) {
          if (updateData[key].includes(',')) {
            updateData[key] = updateData[key].split(',').map(s => s.trim());
          } else if (updateData[key]) {
            updateData[key] = [updateData[key]];
          } else {
            updateData[key] = [];
          }
        }
      }
    });

    if (req.body.entity_code && req.body.entity_code !== entity.entity_code) {
      if (req.body.entity_code.length !== 8) {
        return res.status(400).json({ success: false, message: 'Entity Code must be 8 characters.' });
      }
      const existing = await Entity.findOne({ where: { entity_code: req.body.entity_code, id: { [Op.ne]: entity.id } } });
      if (existing) return res.status(400).json({ success: false, message: 'Entity Code already in use.' });
      
      const dateStr = new Date(entity.createdAt).toISOString().slice(0,10).replace(/-/g, '');
      updateData.unique_number = `${dateStr}${req.body.entity_code}`;
      updateData.entity_code = req.body.entity_code;
    } else {
      delete updateData.entity_code;
    }

    // Handle file uploads (upload.any returns an array)
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(f => {
        if (f.fieldname === 'cover_image') {
          updateData.cover_image = `/uploads/properties/${f.filename}`;
        }
        if (f.fieldname === 'profile_photo') {
          updateData.profile_photo = `/uploads/properties/${f.filename}`;
        }
      });
    }
    // Fallback for single file upload if used
    if (req.file) {
      updateData.cover_image = `/uploads/properties/${req.file.filename}`;
    }

    fs.appendFileSync('debug_log.txt', `FINAL UPDATEDATA: ${JSON.stringify(updateData)}\n`);

    const oldValues = entity.toJSON();
    try {
      await entity.update(updateData);
    } catch (dbErr) {
      fs.appendFileSync('debug_log.txt', `DB ERROR: ${dbErr.name} - ${dbErr.message}\n`);
      if (dbErr.errors) fs.appendFileSync('debug_log.txt', `DB ERRORS: ${JSON.stringify(dbErr.errors)}\n`);
      throw dbErr;
    }

    // Track changes for Audit Log
    const changes = {};
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== oldValues[key]) {
        changes[key] = { old: oldValues[key], new: updateData[key] };
      }
    });

    // Synchronize changes to the associated User account
    if (entity.entity_user_id) {
      const userUpdate = {};
      if (updateData.unique_number) userUpdate.username = updateData.unique_number;
      if (updateData.name) userUpdate.first_name = updateData.name;
      
      if (Object.keys(userUpdate).length > 0) {
        await User.update(userUpdate, { where: { id: entity.entity_user_id } });
      }
    }

    // Track changes for Audit Log
    const { hasChanges, extractDeltas } = require('../utils/historyHelper');
    if (hasChanges(oldValues, updateData)) {
      const deltas = extractDeltas(oldValues, updateData);
      await AuditLog.create({
        user_id: req.user.id, action: 'UPDATE_ENTITY', entity_type: 'Entity',
        entity_id: entity.id, old_values: oldValues, new_values: deltas,
        ip_address: req.ip, user_agent: req.headers['user-agent']
      });
    }

    // Re-fetch to get associations
    const updatedEntity = await Entity.findByPk(entity.id, {
      include: [
        { model: User, as: 'admin', attributes: ['id','username','email'] },
        { model: Category, as: 'entity_category', attributes: ['id','name'] }
      ]
    });

    res.json({ success: true, message: 'Entity updated.', data: updatedEntity });
  } catch (err) { next(err); }
};

// DELETE /api/entities/:id
const remove = async (req, res, next) => {
  try {
    const entity = await Entity.findByPk(req.params.id);
    if (!entity) return res.status(404).json({ success: false, message: 'Entity not found.' });
    const oldValues = entity.toJSON();
    await entity.update({ status: 'Inactive' });
    
    await AuditLog.create({
      user_id: req.user.id, action: 'DEACTIVATE_ENTITY', entity_type: 'Entity',
      entity_id: entity.id, old_values: oldValues, new_values: { status: 'Inactive' },
      ip_address: req.ip, user_agent: req.headers['user-agent']
    });
    
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

const updateMyEntity = async (req, res, next) => {
  try {
    const entity = await Entity.findOne({ where: { entity_user_id: req.user.id } });
    if (!entity) return res.status(404).json({ success: false, message: 'Entity not found.' });

    // Restricted fields allowed for self-service update
    const allowed = ['mobile_1', 'email', 'pan_number', 'aadhar_number', 'gst_number', 'address', 'city', 'state', 'country'];
    const updateData = {};
    allowed.forEach(key => {
      if (req.body[key] !== undefined) updateData[key] = req.body[key];
    });

    const oldValues = {};
    allowed.forEach(key => { oldValues[key] = entity[key]; });

    await entity.update(updateData);

    // Create Audit Log
    await AuditLog.create({
      user_id: req.user.id, action: 'UPDATE_ENTITY_SELF', entity_type: 'Entity',
      entity_id: entity.id, old_values: oldValues, new_values: updateData,
      ip_address: req.ip, user_agent: req.headers['user-agent']
    });

    res.json({ success: true, message: 'Entity details updated.', data: entity });
  } catch (err) { next(err); }
};

const { getFormattedHistory } = require('../utils/historyHelper');

const getEntityHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query; // Increase limit for history
    
    const logs = await AuditLog.findAll({
      where: { entity_type: 'Entity', entity_id: id },
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'first_name'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    const history = await getFormattedHistory(logs);
    res.json({ success: true, data: history, meta: { page, limit } });
  } catch (err) { 
    next(err); 
  }
};

module.exports = { getAll, getOne, create, update, remove, getMyEntity, updateMyEntity, getEntityHistory };
