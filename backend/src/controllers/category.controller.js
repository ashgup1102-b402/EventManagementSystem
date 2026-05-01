const { Category, AuditLog } = require('../models');
const { Op } = require('sequelize');

const getAll = async (req, res, next) => {
  try {
    const { status, q } = req.query;
    const where = {};
    if (status) where.status = status;
    if (q) where.name = { [Op.iLike]: `%${q}%` };

    const categories = await Category.findAll({ 
      where, 
      order: [['name', 'ASC']] 
    });
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, data: category });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { name, description, status } = req.body;
    const category = await Category.create({ name, description, status });
    
    await AuditLog.create({
      user_id: req.user.id,
      action: 'CREATE',
      entity_type: 'Category',
      entity_id: category.id,
      new_values: category,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.status(201).json({ success: true, message: 'Category created.', data: category });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });

    const oldValues = category.toJSON();
    await category.update(req.body);

    await AuditLog.create({
      user_id: req.user.id,
      action: 'UPDATE',
      entity_type: 'Category',
      entity_id: category.id,
      old_values: oldValues,
      new_values: category,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.json({ success: true, message: 'Category updated.', data: category });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });

    // Optional: Check if any entities are using this category
    const oldValues = category.toJSON();
    await category.destroy();

    await AuditLog.create({
      user_id: req.user.id,
      action: 'DELETE',
      entity_type: 'Category',
      entity_id: category.id,
      old_values: oldValues,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.json({ success: true, message: 'Category deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };
