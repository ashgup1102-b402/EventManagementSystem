const { Discount, ComboDeal, Entity, AuditLog, User } = require('../models');
const { Op } = require('sequelize');
const { getFormattedHistory } = require('../utils/historyHelper');

const checkAccess = async (propertyId, user) => {
  if (['Super Admin', 'Admin'].includes(user.role)) return true;
  const ent = await Entity.findByPk(propertyId);
  return ent && ent.entity_user_id === user.id;
};

// ─── DISCOUNTS ────────────────────────────────────────────────

const getDiscounts = async (req, res, next) => {
  try {
    const { property_id, is_active } = req.query;
    const where = {};
    if (property_id) where.property_id = property_id;
    if (is_active !== undefined && is_active !== 'all') {
      where.is_active = is_active === 'true';
    } else if (!req.user || req.user.role === 'End_User') {
      where.is_active = true;
    }

    if (req.user?.role === 'Entity') {
      const ent = await Entity.findOne({ where: { entity_user_id: req.user.id } });
      if (ent) where.property_id = ent.id;
    }
    const discounts = await Discount.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: discounts });
  } catch (err) { next(err); }
};

const createDiscount = async (req, res, next) => {
  try {
    const hasAccess = await checkAccess(req.body.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });
    if (req.file) req.body.image = `/uploads/discounts/${req.file.filename}`;
    const discount = await Discount.create(req.body);

    await AuditLog.create({
      user_id: req.user.id, action: 'CREATE_DISCOUNT', entity_type: 'Discount',
      entity_id: discount.id, new_values: discount.toJSON(),
      ip_address: req.ip, user_agent: req.headers['user-agent']
    });

    res.status(201).json({ success: true, message: 'Discount created.', data: discount });
  } catch (err) { next(err); }
};

const updateDiscount = async (req, res, next) => {
  try {
    const discount = await Discount.findByPk(req.params.id);
    if (!discount) return res.status(404).json({ success: false, message: 'Discount not found.' });
    const hasAccess = await checkAccess(discount.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });
    
    const oldValues = discount.toJSON();
    if (req.file) req.body.image = `/uploads/discounts/${req.file.filename}`;
    await discount.update(req.body);

    const { hasChanges, extractDeltas } = require('../utils/historyHelper');
    if (hasChanges(oldValues, req.body)) {
      const deltas = extractDeltas(oldValues, req.body);
      await AuditLog.create({
        user_id: req.user.id, action: 'UPDATE_DISCOUNT', entity_type: 'Discount',
        entity_id: discount.id, old_values: oldValues, new_values: deltas,
        ip_address: req.ip, user_agent: req.headers['user-agent']
      });
    }

    res.json({ success: true, message: 'Discount updated.', data: discount });
  } catch (err) { next(err); }
};

const deleteDiscount = async (req, res, next) => {
  try {
    const discount = await Discount.findByPk(req.params.id);
    if (!discount) return res.status(404).json({ success: false, message: 'Discount not found.' });
    const hasAccess = await checkAccess(discount.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });
    
    const oldValues = discount.toJSON();
    await discount.update({ is_active: false });

    await AuditLog.create({
      user_id: req.user.id, action: 'DEACTIVATE_DISCOUNT', entity_type: 'Discount',
      entity_id: discount.id, old_values: oldValues, new_values: { is_active: false },
      ip_address: req.ip, user_agent: req.headers['user-agent']
    });

    res.json({ success: true, message: 'Discount deactivated.' });
  } catch (err) { next(err); }
};

// ─── COMBO DEALS ─────────────────────────────────────────────

const getCombos = async (req, res, next) => {
  try {
    const { property_id, is_active } = req.query;
    const where = {};
    if (property_id) where.property_id = property_id;
    if (is_active !== undefined && is_active !== 'all') {
      where.is_active = is_active === 'true';
    } else if (!req.user || req.user.role === 'End_User') {
      where.is_active = true;
    }

    if (req.user?.role === 'Entity') {
      const ent = await Entity.findOne({ where: { entity_user_id: req.user.id } });
      if (ent) where.property_id = ent.id;
    }
    const combos = await ComboDeal.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: combos });
  } catch (err) { next(err); }
};

const createCombo = async (req, res, next) => {
  try {
    const hasAccess = await checkAccess(req.body.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });
    if (req.file) req.body.image = `/uploads/combos/${req.file.filename}`;
    const combo = await ComboDeal.create(req.body);

    await AuditLog.create({
      user_id: req.user.id, action: 'CREATE_COMBO', entity_type: 'ComboDeal',
      entity_id: combo.id, new_values: combo.toJSON(),
      ip_address: req.ip, user_agent: req.headers['user-agent']
    });

    res.status(201).json({ success: true, message: 'Combo deal created.', data: combo });
  } catch (err) { next(err); }
};

const updateCombo = async (req, res, next) => {
  try {
    const combo = await ComboDeal.findByPk(req.params.id);
    if (!combo) return res.status(404).json({ success: false, message: 'Combo deal not found.' });
    const hasAccess = await checkAccess(combo.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });
    if (req.file) req.body.image = `/uploads/combos/${req.file.filename}`;
    
    const oldValues = combo.toJSON();
    await combo.update(req.body);

    const { hasChanges, extractDeltas } = require('../utils/historyHelper');
    if (hasChanges(oldValues, req.body)) {
      const deltas = extractDeltas(oldValues, req.body);
      await AuditLog.create({
        user_id: req.user.id, action: 'UPDATE_COMBO', entity_type: 'ComboDeal',
        entity_id: combo.id, old_values: oldValues, new_values: deltas,
        ip_address: req.ip, user_agent: req.headers['user-agent']
      });
    }

    res.json({ success: true, message: 'Combo updated.', data: combo });
  } catch (err) { next(err); }
};

const deleteCombo = async (req, res, next) => {
  try {
    const combo = await ComboDeal.findByPk(req.params.id);
    if (!combo) return res.status(404).json({ success: false, message: 'Combo not found.' });
    const hasAccess = await checkAccess(combo.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });
    
    const oldValues = combo.toJSON();
    await combo.update({ is_active: false });

    await AuditLog.create({
      user_id: req.user.id, action: 'DEACTIVATE_COMBO', entity_type: 'ComboDeal',
      entity_id: combo.id, old_values: oldValues, new_values: { is_active: false },
      ip_address: req.ip, user_agent: req.headers['user-agent']
    });

    res.json({ success: true, message: 'Combo deactivated.' });
  } catch (err) { next(err); }
};

const getHistory = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const entityType = type === 'discount' ? 'Discount' : 'ComboDeal';
    const logs = await AuditLog.findAll({
      where: { entity_type: entityType, entity_id: id },
      include: [{ model: User, as: 'user', attributes: ['username', 'first_name'] }],
      order: [['createdAt', 'DESC']]
    });

    const history = await getFormattedHistory(logs);
    res.json({ success: true, data: history });
  } catch (err) { next(err); }
};

module.exports = { getDiscounts, createDiscount, updateDiscount, deleteDiscount, getCombos, createCombo, updateCombo, deleteCombo, getHistory };
