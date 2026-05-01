const { Discount, ComboDeal, Entity } = require('../models');
const { Op } = require('sequelize');

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
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (req.user?.role === 'Entity') {
      const ent = await Entity.findOne({ where: { entity_user_id: req.user.id } });
      if (ent) where.property_id = ent.id;
    }
    const discounts = await Discount.findAll({ where, order: [['created_at', 'DESC']] });
    res.json({ success: true, data: discounts });
  } catch (err) { next(err); }
};

const createDiscount = async (req, res, next) => {
  try {
    const hasAccess = await checkAccess(req.body.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });
    const discount = await Discount.create(req.body);
    res.status(201).json({ success: true, message: 'Discount created.', data: discount });
  } catch (err) { next(err); }
};

const updateDiscount = async (req, res, next) => {
  try {
    const discount = await Discount.findByPk(req.params.id);
    if (!discount) return res.status(404).json({ success: false, message: 'Discount not found.' });
    const hasAccess = await checkAccess(discount.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });
    await discount.update(req.body);
    res.json({ success: true, message: 'Discount updated.', data: discount });
  } catch (err) { next(err); }
};

const deleteDiscount = async (req, res, next) => {
  try {
    const discount = await Discount.findByPk(req.params.id);
    if (!discount) return res.status(404).json({ success: false, message: 'Discount not found.' });
    const hasAccess = await checkAccess(discount.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });
    await discount.update({ is_active: false });
    res.json({ success: true, message: 'Discount deactivated.' });
  } catch (err) { next(err); }
};

// ─── COMBO DEALS ─────────────────────────────────────────────

const getCombos = async (req, res, next) => {
  try {
    const { property_id, is_active } = req.query;
    const where = {};
    if (property_id) where.property_id = property_id;
    if (is_active !== undefined) where.is_active = is_active === 'true';
    else where.is_active = true;
    if (req.user?.role === 'Entity') {
      const ent = await Entity.findOne({ where: { entity_user_id: req.user.id } });
      if (ent) where.property_id = ent.id;
    }
    const combos = await ComboDeal.findAll({ where, order: [['created_at', 'DESC']] });
    res.json({ success: true, data: combos });
  } catch (err) { next(err); }
};

const createCombo = async (req, res, next) => {
  try {
    const hasAccess = await checkAccess(req.body.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });
    if (req.file) req.body.image = `/uploads/combos/${req.file.filename}`;
    const combo = await ComboDeal.create(req.body);
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
    await combo.update(req.body);
    res.json({ success: true, message: 'Combo updated.', data: combo });
  } catch (err) { next(err); }
};

const deleteCombo = async (req, res, next) => {
  try {
    const combo = await ComboDeal.findByPk(req.params.id);
    if (!combo) return res.status(404).json({ success: false, message: 'Combo not found.' });
    const hasAccess = await checkAccess(combo.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });
    await combo.update({ is_active: false });
    res.json({ success: true, message: 'Combo deactivated.' });
  } catch (err) { next(err); }
};

module.exports = { getDiscounts, createDiscount, updateDiscount, deleteDiscount, getCombos, createCombo, updateCombo, deleteCombo };
