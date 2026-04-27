const { PropertySlot, Property } = require('../models');
const { getAvailability } = require('../services/capacityManager');
const { Op } = require('sequelize');

const checkAccess = async (propertyId, user) => {
  if (['super_admin', 'admin'].includes(user.role)) return true;
  const prop = await Property.findByPk(propertyId);
  return prop && prop.property_user_id === user.id;
};

const getAll = async (req, res, next) => {
  try {
    const { property_id, date, slot_type, page = 1, limit = 20 } = req.query;
    const where = { is_active: true };
    if (property_id) where.property_id = property_id;
    if (date) where.slot_date = date;
    if (slot_type) where.slot_type = slot_type;
    if (req.user?.role === 'property') {
      const prop = await Property.findOne({ where: { property_user_id: req.user.id } });
      if (prop) where.property_id = prop.id;
    }
    const offset = (page - 1) * limit;
    const { rows, count } = await PropertySlot.findAndCountAll({
      where, limit: parseInt(limit), offset: parseInt(offset),
      include: [{ model: Property, as: 'property', attributes: ['id','name','city'] }],
      order: [['slot_date', 'ASC'], ['start_time', 'ASC']]
    });
    res.json({ success: true, data: rows, meta: { total: count } });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const slot = await PropertySlot.findByPk(req.params.id, {
      include: [{ model: Property, as: 'property' }]
    });
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found.' });
    const availability = await getAvailability('slot', slot.id);
    res.json({ success: true, data: { ...slot.toJSON(), availability } });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const hasAccess = await checkAccess(req.body.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });
    const slot = await PropertySlot.create(req.body);
    res.status(201).json({ success: true, message: 'Slot created.', data: slot });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const slot = await PropertySlot.findByPk(req.params.id);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found.' });
    const hasAccess = await checkAccess(slot.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });
    await slot.update(req.body);
    res.json({ success: true, message: 'Slot updated.', data: slot });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const slot = await PropertySlot.findByPk(req.params.id);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found.' });
    const hasAccess = await checkAccess(slot.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });
    await slot.update({ is_active: false });
    res.json({ success: true, message: 'Slot deactivated.' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };
