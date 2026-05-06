const { EntitySlot, Entity, AuditLog, User } = require('../models');
const { getAvailability } = require('../services/capacityManager');
const { Op } = require('sequelize');
const moment = require('moment');
const { getFormattedHistory } = require('../utils/historyHelper');

const checkAccess = async (propertyId, user) => {
  if (['Super Admin', 'Admin'].includes(user.role)) return true;
  const ent = await Entity.findByPk(propertyId);
  return ent && ent.entity_user_id === user.id;
};

const getAll = async (req, res, next) => {
  try {
    const { property_id, date, slot_type, page = 1, limit = 50, include_inactive } = req.query;
    
    // Auto-inactivate past slots
    const now = moment();
    const today = now.format('YYYY-MM-DD');
    const currentTime = now.format('HH:mm:ss');

    await EntitySlot.update(
      { is_active: false },
      {
        where: {
          is_active: true,
          [Op.or]: [
            { slot_date: { [Op.lt]: today } },
            { 
              [Op.and]: [
                { slot_date: today },
                { end_time: { [Op.lt]: currentTime } }
              ] 
            }
          ]
        }
      }
    );

    const where = {};
    if (!include_inactive || include_inactive === 'false') {
      where.is_active = true;
    }
    
    if (property_id) where.property_id = property_id;
    if (date) where.slot_date = date;
    if (slot_type) where.slot_type = slot_type;
    
    if (req.user?.role === 'Entity') {
      const ent = await Entity.findOne({ where: { entity_user_id: req.user.id } });
      if (ent) where.property_id = ent.id;
    }
    
    const offset = (page - 1) * limit;
    const { rows, count } = await EntitySlot.findAndCountAll({
      where, limit: parseInt(limit), offset: parseInt(offset),
      include: [{ model: Entity, as: 'entity', attributes: ['id','name','city'] }],
      order: [['slot_date', 'ASC'], ['start_time', 'ASC']]
    });
    res.json({ success: true, data: rows, meta: { total: count, page, limit } });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const slot = await EntitySlot.findByPk(req.params.id, {
      include: [{ model: Entity, as: 'entity' }]
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
    
    if (req.file) req.body.image = `/uploads/slots/${req.file.filename}`;
    const slot = await EntitySlot.create(req.body);

    await AuditLog.create({
      user_id: req.user.id, action: 'CREATE_SLOT', entity_type: 'Slot',
      entity_id: slot.id, new_values: slot.toJSON(),
      ip_address: req.ip, user_agent: req.headers['user-agent']
    });

    res.status(201).json({ success: true, message: 'Slot created.', data: slot });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const slot = await EntitySlot.findByPk(req.params.id);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found.' });
    const hasAccess = await checkAccess(slot.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });
    
    const oldValues = slot.toJSON();
    if (req.file) req.body.image = `/uploads/slots/${req.file.filename}`;
    await slot.update(req.body);

    await AuditLog.create({
      user_id: req.user.id, action: 'UPDATE_SLOT', entity_type: 'Slot',
      entity_id: slot.id, old_values: oldValues, new_values: req.body,
      ip_address: req.ip, user_agent: req.headers['user-agent']
    });

    res.json({ success: true, message: 'Slot updated.', data: slot });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const slot = await EntitySlot.findByPk(req.params.id);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found.' });
    const hasAccess = await checkAccess(slot.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });
    
    const oldValues = slot.toJSON();
    await slot.update({ is_active: false });

    await AuditLog.create({
      user_id: req.user.id, action: 'DEACTIVATE_SLOT', entity_type: 'Slot',
      entity_id: slot.id, old_values: oldValues, new_values: { is_active: false },
      ip_address: req.ip, user_agent: req.headers['user-agent']
    });

    res.json({ success: true, message: 'Slot deactivated.' });
  } catch (err) { next(err); }
};

const getHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const logs = await AuditLog.findAll({
      where: { entity_type: 'Slot', entity_id: id },
      include: [{ model: User, as: 'user', attributes: ['username', 'first_name'] }],
      order: [['createdAt', 'DESC']]
    });

    const history = await getFormattedHistory(logs);
    res.json({ success: true, data: history });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove, getHistory };
