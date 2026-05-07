const { MenuItem, Entity, AuditLog, MenuCategory, CuisineType, User } = require('../models');
const { Op } = require('sequelize');

const checkAccess = async (propertyId, user) => {
  if (['Super Admin', 'Admin'].includes(user.role)) return true;
  const ent = await Entity.findByPk(propertyId);
  return ent && ent.entity_user_id === user.id;
};

const getAll = async (req, res, next) => {
  try {
    const { property_id, menu_category_id, cuisine_type_id, status, is_veg, is_available, search, page = 1, limit = 50 } = req.query;
    const where = {};
    if (status && status !== 'all') where.status = status;
    if (property_id) where.property_id = property_id;
    if (menu_category_id) where.menu_category_id = menu_category_id;
    if (cuisine_type_id) where.cuisine_type_id = cuisine_type_id;
    if (is_veg !== undefined) where.is_veg = is_veg === 'true';
    
    if (is_available !== undefined && is_available !== '') {
      where.is_available = is_available === 'true';
    }

    if (search) where.name = { [Op.iLike]: `%${search}%` };
    
    if (req.user?.role === 'Entity') {
      const ent = await Entity.findOne({ where: { entity_user_id: req.user.id } });
      if (ent) where.property_id = ent.id;
    } else if (!req.user || req.user.role === 'End_User') {
      where.status = 'Active';
      where.is_available = true;
    }

    const offset = (page - 1) * limit;
    const { rows, count } = await MenuItem.findAndCountAll({
      where, limit: parseInt(limit), offset: parseInt(offset),
      include: [
        { model: Entity, as: 'entity', attributes: ['id','name'] },
        { model: MenuCategory, as: 'menu_category_ref', attributes: ['id', 'name'] },
        { model: CuisineType, as: 'cuisine_type_ref', attributes: ['id', 'name'] }
      ],
      order: [['name', 'ASC']]
    });
    res.json({ success: true, data: rows, meta: { total: count, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const item = await MenuItem.findByPk(req.params.id, {
      include: [
        { model: MenuCategory, as: 'menu_category_ref' },
        { model: CuisineType, as: 'cuisine_type_ref' }
      ]
    });
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found.' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { property_id, name, price } = req.body;
    const hasAccess = await checkAccess(property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });

    if (price < 0) return res.status(400).json({ success: false, message: 'Price cannot be negative.' });

    const existing = await MenuItem.findOne({ where: { name, property_id, status: 'Active' } });
    if (existing) return res.status(400).json({ success: false, message: 'An active menu item with this name already exists.' });

    if (req.file) req.body.image = `/uploads/menu/${req.file.filename}`;
    req.body.status = 'Active';

    const item = await MenuItem.create(req.body);

    await AuditLog.create({
      user_id: req.user.id, action: 'CREATE_MENU_ITEM', entity_type: 'MenuItem',
      entity_id: item.id, new_values: item.toJSON(),
      ip_address: req.ip, user_agent: req.headers['user-agent']
    });

    res.status(201).json({ success: true, message: 'Menu item created.', data: item });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found.' });
    const hasAccess = await checkAccess(item.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });

    const { name, price, status } = req.body;
    if (price !== undefined && price < 0) return res.status(400).json({ success: false, message: 'Price cannot be negative.' });

    if (name && name !== item.name && status !== 'Inactive') {
      const existing = await MenuItem.findOne({ where: { name, property_id: item.property_id, status: 'Active', id: { [Op.ne]: item.id } } });
      if (existing) return res.status(400).json({ success: false, message: 'An active menu item with this name already exists.' });
    }

    const oldValues = item.toJSON();
    if (req.file) req.body.image = `/uploads/menu/${req.file.filename}`;
    
    await item.update(req.body);

    const { hasChanges, extractDeltas } = require('../utils/historyHelper');
    if (hasChanges(oldValues, req.body)) {
      const deltas = extractDeltas(oldValues, req.body);
      await AuditLog.create({
        user_id: req.user.id, action: 'UPDATE_MENU_ITEM', entity_type: 'MenuItem',
        entity_id: item.id, old_values: oldValues, new_values: deltas,
        ip_address: req.ip, user_agent: req.headers['user-agent']
      });
    }

    res.json({ success: true, message: 'Menu item updated.', data: item });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found.' });
    const hasAccess = await checkAccess(item.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });
    
    const oldValues = item.toJSON();
    await item.update({ status: 'Inactive' });

    await AuditLog.create({
      user_id: req.user.id, action: 'DEACTIVATE_MENU_ITEM', entity_type: 'MenuItem',
      entity_id: item.id, old_values: oldValues, new_values: { status: 'Inactive' },
      ip_address: req.ip, user_agent: req.headers['user-agent']
    });

    res.json({ success: true, message: 'Menu item deactivated.' });
  } catch (err) { next(err); }
};

const { getFormattedHistory } = require('../utils/historyHelper');

const getHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const logs = await AuditLog.findAll({
      where: { entity_type: 'MenuItem', entity_id: id },
      include: [{ model: User, as: 'user', attributes: ['username', 'first_name'] }],
      order: [['createdAt', 'DESC']]
    });

    const history = await getFormattedHistory(logs);
    res.json({ success: true, data: history });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove, getHistory };
