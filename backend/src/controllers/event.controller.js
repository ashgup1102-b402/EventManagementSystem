const { Event, Entity } = require('../models');
const { Op } = require('sequelize');

const checkPropertyAccess = async (propertyId, user) => {
  if (['Super Admin', 'Admin'].includes(user.role)) return true;
  const ent = await Entity.findByPk(propertyId);
  return ent && ent.entity_user_id === user.id;
};

const getAll = async (req, res, next) => {
  try {
    const { property_id, type, date_from, date_to, page = 1, limit = 20 } = req.query;
    const where = { is_active: true };
    if (property_id) where.property_id = property_id;
    if (type) where.type = type;
    if (req.user?.role === 'Entity') {
      const ent = await Entity.findOne({ where: { entity_user_id: req.user.id } });
      if (ent) where.property_id = ent.id;
    }
    if (date_from && date_to) where.event_date = { [Op.between]: [date_from, date_to] };
    else if (date_from) where.event_date = { [Op.gte]: date_from };
    const offset = (page - 1) * limit;
    const { rows, count } = await Event.findAndCountAll({
      where, limit: parseInt(limit), offset: parseInt(offset),
      include: [{ model: Entity, as: 'entity', attributes: ['id','name','city'] }],
      order: [['event_date', 'ASC']]
    });
    res.json({ success: true, data: rows, meta: { total: count, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [{ model: Entity, as: 'entity' }]
    });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { property_id } = req.body;
    const hasAccess = await checkPropertyAccess(property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied to this property.' });
    if (req.file) req.body.image = `/uploads/events/${req.file.filename}`;
    const event = await Event.create(req.body);
    res.status(201).json({ success: true, message: 'Event created.', data: event });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    const hasAccess = await checkPropertyAccess(event.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });
    if (req.file) req.body.image = `/uploads/events/${req.file.filename}`;
    await event.update(req.body);
    res.json({ success: true, message: 'Event updated.', data: event });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    const hasAccess = await checkPropertyAccess(event.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });
    await event.update({ is_active: false });
    res.json({ success: true, message: 'Event deactivated.' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };
