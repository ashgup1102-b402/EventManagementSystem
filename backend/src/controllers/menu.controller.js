const { MenuItem, Property } = require('../models');
const { Op } = require('sequelize');

const checkAccess = async (propertyId, user) => {
  if (['super_admin', 'admin'].includes(user.role)) return true;
  const prop = await Property.findByPk(propertyId);
  return prop && prop.property_user_id === user.id;
};

const getAll = async (req, res, next) => {
  try {
    const { property_id, category, is_veg, is_available, search, page = 1, limit = 50 } = req.query;
    const where = {};
    if (property_id) where.property_id = property_id;
    if (category) where.category = category;
    if (is_veg !== undefined) where.is_veg = is_veg === 'true';
    if (is_available !== undefined && is_available !== '') {
      where.is_available = is_available === 'true';
    } else if (is_available === undefined) {
      where.is_available = true;
    }
    if (search) where.name = { [Op.iLike]: `%${search}%` };
    if (req.user?.role === 'property') {
      const prop = await Property.findOne({ where: { property_user_id: req.user.id } });
      if (prop) where.property_id = prop.id;
    }
    const offset = (page - 1) * limit;
    const { rows, count } = await MenuItem.findAndCountAll({
      where, limit: parseInt(limit), offset: parseInt(offset),
      include: [{ model: Property, as: 'property', attributes: ['id','name'] }],
      order: [['category', 'ASC'], ['name', 'ASC']]
    });
    res.json({ success: true, data: rows, meta: { total: count, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found.' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { property_id } = req.body;
    const hasAccess = await checkAccess(property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });
    if (req.file) req.body.image = `/uploads/menu/${req.file.filename}`;
    const item = await MenuItem.create(req.body);
    res.status(201).json({ success: true, message: 'Menu item created.', data: item });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found.' });
    const hasAccess = await checkAccess(item.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });
    if (req.file) req.body.image = `/uploads/menu/${req.file.filename}`;
    await item.update(req.body);
    res.json({ success: true, message: 'Menu item updated.', data: item });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found.' });
    const hasAccess = await checkAccess(item.property_id, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });
    await item.destroy();
    res.json({ success: true, message: 'Menu item deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };
