const { Event, Entity, AuditLog, EventType, Performer, User } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

const checkPropertyAccess = async (propertyId, user) => {
  if (['Super Admin', 'Admin'].includes(user.role)) return true;
  const ent = await Entity.findByPk(propertyId);
  return ent && ent.entity_user_id === user.id;
};

const getAll = async (req, res, next) => {
  try {
    const { property_id, event_type_id, performer_id, status, date_from, date_to, page = 1, limit = 20 } = req.query;
    
    // Auto-deactivate expired events
    const today = moment().format('YYYY-MM-DD');
    await Event.update(
      { status: 'Inactive' },
      { 
        where: { 
          status: 'Active',
          [Op.or]: [
            { end_date: { [Op.lt]: today } },
            { [Op.and]: [{ end_date: null }, { event_date: { [Op.lt]: today } }] }
          ]
        } 
      }
    );

    const where = {};
    if (status && status !== 'all') where.status = status;
    if (property_id) where.property_id = property_id;
    if (event_type_id) where.event_type_id = event_type_id;
    if (performer_id) where.performer_id = performer_id;

    if (req.user?.role === 'Entity') {
      const ent = await Entity.findOne({ where: { entity_user_id: req.user.id } });
      if (ent) where.property_id = ent.id;
    } else if (!req.user || req.user.role === 'End_User') {
      where.status = 'Active';
    }

    if (date_from && date_to) where.event_date = { [Op.between]: [date_from, date_to] };
    else if (date_from) where.event_date = { [Op.gte]: date_from };

    const offset = (page - 1) * limit;
    const { rows, count } = await Event.findAndCountAll({
      where, limit: parseInt(limit), offset: parseInt(offset),
      include: [
        { model: Entity, as: 'entity', attributes: ['id','name','city'] },
        { model: EventType, as: 'event_type_ref', attributes: ['id', 'name'] },
        { model: Performer, as: 'performer_ref', attributes: ['id', 'name'] }
      ],
      order: [['event_date', 'ASC']]
    });
    res.json({ success: true, data: rows, meta: { total: count, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [
        { model: Entity, as: 'entity' },
        { model: EventType, as: 'event_type_ref' },
        { model: Performer, as: 'performer_ref' }
      ]
    });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { property_id, name, event_date, end_date, start_time, end_time, ticket_price, total_capacity } = req.body;
    
    const hasAccess = await checkPropertyAccess(property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied to this property.' });

    // Validations
    if (moment(event_date).isBefore(moment(), 'day')) {
      return res.status(400).json({ success: false, message: 'Event date cannot be in the past.' });
    }
    if (end_time && start_time && (!end_date || end_date === event_date)) {
      if (end_time <= start_time) return res.status(400).json({ success: false, message: 'End time must be after start time.' });
    }
    if (ticket_price < 0 || total_capacity < 0) {
      return res.status(400).json({ success: false, message: 'Price and capacity cannot be negative.' });
    }

    // Unique Name among Active
    const existing = await Event.findOne({ where: { name, property_id, status: 'Active' } });
    if (existing) return res.status(400).json({ success: false, message: 'An active event with this name already exists at this property.' });

    if (req.file) req.body.image = `/uploads/events/${req.file.filename}`;
    req.body.status = 'Active';

    const event = await Event.create(req.body);
    
    await AuditLog.create({
      user_id: req.user.id, action: 'CREATE_EVENT', entity_type: 'Event',
      entity_id: event.id, new_values: event.toJSON(),
      ip_address: req.ip, user_agent: req.headers['user-agent']
    });

    res.status(201).json({ success: true, message: 'Event created.', data: event });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    
    const hasAccess = await checkPropertyAccess(event.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });

    const { name, event_date, end_date, start_time, end_time, ticket_price, total_capacity, status } = req.body;

    // Validations
    if (event_date && moment(event_date).isBefore(moment(), 'day') && event_date !== event.event_date) {
      return res.status(400).json({ success: false, message: 'Event date cannot be in the past.' });
    }
    if (ticket_price !== undefined && ticket_price < 0) return res.status(400).json({ success: false, message: 'Price cannot be negative.' });
    if (total_capacity !== undefined && total_capacity < 0) return res.status(400).json({ success: false, message: 'Capacity cannot be negative.' });

    if (name && name !== event.name && status !== 'Inactive') {
      const existing = await Event.findOne({ where: { name, property_id: event.property_id, status: 'Active', id: { [Op.ne]: event.id } } });
      if (existing) return res.status(400).json({ success: false, message: 'An active event with this name already exists.' });
    }

    const oldValues = event.toJSON();
    if (req.file) req.body.image = `/uploads/events/${req.file.filename}`;
    
    await event.update(req.body);

    const { hasChanges, extractDeltas } = require('../utils/historyHelper');
    if (hasChanges(oldValues, req.body)) {
      const deltas = extractDeltas(oldValues, req.body);
      await AuditLog.create({
        user_id: req.user.id, action: 'UPDATE_EVENT', entity_type: 'Event',
        entity_id: event.id, old_values: oldValues, new_values: deltas,
        ip_address: req.ip, user_agent: req.headers['user-agent']
      });
    }

    res.json({ success: true, message: 'Event updated.', data: event });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    const hasAccess = await checkPropertyAccess(event.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });
    
    const oldValues = event.toJSON();
    await event.update({ status: 'Inactive' });

    await AuditLog.create({
      user_id: req.user.id, action: 'DEACTIVATE_EVENT', entity_type: 'Event',
      entity_id: event.id, old_values: oldValues, new_values: { status: 'Inactive' },
      ip_address: req.ip, user_agent: req.headers['user-agent']
    });

    res.json({ success: true, message: 'Event deactivated.' });
  } catch (err) { next(err); }
};

const { getFormattedHistory } = require('../utils/historyHelper');

const getHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const logs = await AuditLog.findAll({
      where: { entity_type: 'Event', entity_id: id },
      include: [{ model: User, as: 'user', attributes: ['username', 'first_name'] }],
      order: [['createdAt', 'DESC']]
    });

    const history = await getFormattedHistory(logs);
    res.json({ success: true, data: history });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove, getHistory };
