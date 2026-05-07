const { Promotion, Entity, AuditLog, User } = require('../models');
const { getFormattedHistory } = require('../utils/historyHelper');

const checkAccess = async (propertyId, user) => {
  if (['Super Admin', 'Admin'].includes(user.role)) return true;
  const ent = await Entity.findByPk(propertyId);
  return ent && ent.entity_user_id === user.id;
};

const getAll = async (req, res, next) => {
  try {
    const { property_id, is_active } = req.query;
    const where = {};
    if (property_id) where.property_id = property_id;
    if (is_active !== undefined && is_active !== 'all') {
      where.is_active = is_active === 'true';
    } else if (!is_active && (!req.user || req.user.role === 'End_User')) {
      where.is_active = true;
    }

    if (req.user?.role === 'Entity') {
      const ent = await Entity.findOne({ where: { entity_user_id: req.user.id } });
      if (ent) where.property_id = ent.id;
    }

    const promos = await Promotion.findAll({ 
      where, 
      include: [{ model: Entity, as: 'entity', attributes: ['id', 'name', 'city'] }],
      order: [['display_order', 'ASC'], ['createdAt', 'DESC']] 
    });
    res.json({ success: true, data: promos });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const hasAccess = await checkAccess(req.body.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });
    
    if (req.file) req.body.image = `/uploads/promotions/${req.file.filename}`;
    const promo = await Promotion.create(req.body);

    await AuditLog.create({
      user_id: req.user.id, action: 'CREATE_PROMOTION', entity_type: 'Promotion',
      entity_id: promo.id, new_values: promo.toJSON(),
      ip_address: req.ip, user_agent: req.headers['user-agent']
    });

    res.status(201).json({ success: true, message: 'Promotion created.', data: promo });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const promo = await Promotion.findByPk(req.params.id);
    if (!promo) return res.status(404).json({ success: false, message: 'Promotion not found.' });
    
    const hasAccess = await checkAccess(promo.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });

    const oldValues = promo.toJSON();
    if (req.file) req.body.image = `/uploads/promotions/${req.file.filename}`;
    
    await promo.update(req.body);

    const { hasChanges, extractDeltas } = require('../utils/historyHelper');
    if (hasChanges(oldValues, req.body)) {
      const deltas = extractDeltas(oldValues, req.body);
      await AuditLog.create({
        user_id: req.user.id, action: 'UPDATE_PROMOTION', entity_type: 'Promotion',
        entity_id: promo.id, old_values: oldValues, new_values: deltas,
        ip_address: req.ip, user_agent: req.headers['user-agent']
      });
    }

    res.json({ success: true, message: 'Promotion updated.', data: promo });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const promo = await Promotion.findByPk(req.params.id);
    if (!promo) return res.status(404).json({ success: false, message: 'Promotion not found.' });
    
    const hasAccess = await checkAccess(promo.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });

    const oldValues = promo.toJSON();
    await promo.update({ is_active: false });

    await AuditLog.create({
      user_id: req.user.id, action: 'DEACTIVATE_PROMOTION', entity_type: 'Promotion',
      entity_id: promo.id, old_values: oldValues, new_values: { is_active: false },
      ip_address: req.ip, user_agent: req.headers['user-agent']
    });

    res.json({ success: true, message: 'Promotion deactivated.' });
  } catch (err) { next(err); }
};

const getHistory = async (req, res, next) => {
  try {
    const logs = await AuditLog.findAll({
      where: { entity_type: 'Promotion', entity_id: req.params.id },
      include: [{ model: User, as: 'user', attributes: ['username'] }],
      order: [['createdAt', 'DESC']]
    });
    const history = await getFormattedHistory(logs);
    res.json({ success: true, data: history });
  } catch (err) { next(err); }
};

module.exports = { getAll, create, update, remove, getHistory };
