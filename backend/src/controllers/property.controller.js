const { Property, User, Event, MenuItem, Booking, AuditLog } = require('../models');
const { Op } = require('sequelize');
const path = require('path');

// GET /api/properties
const getAll = async (req, res, next) => {
  try {
    const { city, category, is_active, search, page = 1, limit = 20 } = req.query;
    const where = {};
    if (city) where.city = { [Op.iLike]: `%${city}%` };
    if (category) where.category = category;
    if (is_active !== undefined) where.is_active = is_active === 'true';
    else where.is_active = true;
    if (search) where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { city: { [Op.iLike]: `%${search}%` } }
    ];
    // Non-super-admin property users only see their own
    if (req.user?.role === 'property') {
      where.property_user_id = req.user.id;
    }
    const offset = (page - 1) * limit;
    const { rows, count } = await Property.findAndCountAll({
      where, limit: parseInt(limit), offset: parseInt(offset),
      include: [{ model: User, as: 'admin', attributes: ['id','username','email'] }],
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: rows, meta: { total: count, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
};

// GET /api/properties/:id
const getOne = async (req, res, next) => {
  try {
    const property = await Property.findByPk(req.params.id, {
      include: [
        { model: User, as: 'admin', attributes: ['id','username','email','phone'] },
        { model: Event, as: 'events', where: { is_active: true }, required: false },
        { model: MenuItem, as: 'menu_items', where: { is_available: true }, required: false }
      ]
    });
    if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });
    res.json({ success: true, data: property });
  } catch (err) { next(err); }
};

// POST /api/properties
const create = async (req, res, next) => {
  try {
    const data = req.body;
    if (!data.admin_user_id) data.admin_user_id = req.user.id;
    // Set commission from system config default if not provided
    const property = await Property.create(data);
    await AuditLog.create({
      user_id: req.user.id, action: 'CREATE_PROPERTY', entity_type: 'Property',
      entity_id: property.id, new_values: { name: property.name }
    });
    res.status(201).json({ success: true, message: 'Property created.', data: property });
  } catch (err) { next(err); }
};

// PUT /api/properties/:id
const update = async (req, res, next) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });

    // Property role can only edit own property
    if (req.user.role === 'property' && property.property_user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Handle file upload
    if (req.file) {
      req.body.cover_image = `/uploads/properties/${req.file.filename}`;
    }

    const oldValues = property.toJSON();
    await property.update(req.body);
    await AuditLog.create({
      user_id: req.user.id, action: 'UPDATE_PROPERTY', entity_type: 'Property',
      entity_id: property.id, old_values: oldValues, new_values: req.body
    });
    res.json({ success: true, message: 'Property updated.', data: property });
  } catch (err) { next(err); }
};

// DELETE /api/properties/:id (admin+)
const remove = async (req, res, next) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });
    await property.update({ is_active: false });
    res.json({ success: true, message: 'Property deactivated.' });
  } catch (err) { next(err); }
};

// GET /api/properties/my  (for property role)
const getMyProperty = async (req, res, next) => {
  try {
    const property = await Property.findOne({
      where: { property_user_id: req.user.id },
      include: [{ model: User, as: 'admin', attributes: ['id','username','email'] }]
    });
    if (!property) return res.status(404).json({ success: false, message: 'No property assigned to your account.' });
    res.json({ success: true, data: property });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove, getMyProperty };
