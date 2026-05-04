const { EventType, Performer, MenuCategory, CuisineType } = require('../models');
const { Op } = require('sequelize');

const createMasterController = (Model, include = []) => ({
  getAll: async (req, res, next) => {
    try {
      const { status, search } = req.query;
      const where = {};
      if (status) where.status = status;
      if (search) where.name = { [Op.iLike]: `%${search}%` };
      
      const rows = await Model.findAll({ 
        where, 
        include,
        order: [['name', 'ASC']] 
      });
      res.json({ success: true, data: rows });
    } catch (err) { next(err); }
  },

  getOne: async (req, res, next) => {
    try {
      const row = await Model.findByPk(req.params.id, { include });
      if (!row) return res.status(404).json({ success: false, message: 'Not found.' });
      res.json({ success: true, data: row });
    } catch (err) { next(err); }
  },

  create: async (req, res, next) => {
    try {
      const data = { ...req.body };
      Object.keys(data).forEach(k => { 
        if (data[k] === '' || data[k] === 'null' || data[k] === 'undefined') data[k] = null; 
      });
      if (req.file) {
        data.image = `/uploads/${req.uploadFolder || 'general'}/${req.file.filename}`;
      }
      const row = await Model.create(data);
      res.status(201).json({ success: true, data: row });
    } catch (err) { next(err); }
  },

  update: async (req, res, next) => {
    try {
      const row = await Model.findByPk(req.params.id);
      if (!row) return res.status(404).json({ success: false, message: 'Not found.' });
      
      const data = { ...req.body };
      Object.keys(data).forEach(k => { 
        if (data[k] === '' || data[k] === 'null' || data[k] === 'undefined') data[k] = null; 
      });
      if (req.file) {
        data.image = `/uploads/${req.uploadFolder || 'general'}/${req.file.filename}`;
      }
      
      await row.update(data);
      res.json({ success: true, data: row });
    } catch (err) { next(err); }
  },

  remove: async (req, res, next) => {
    try {
      const row = await Model.findByPk(req.params.id);
      if (!row) return res.status(404).json({ success: false, message: 'Not found.' });
      // Logic for deactivation instead of deletion could be added here if needed,
      // but for masters, usually we just delete or set status.
      // User said "Cannot delete once create, it can only be inactivate" for Menu Manager,
      // and "should follow same structure as Category management".
      // Category remove sets status to Inactive or deletes? Let's check category.controller.
      await row.update({ status: 'Inactive' });
      res.json({ success: true, message: 'Deactivated successfully.' });
    } catch (err) { next(err); }
  }
});

module.exports = {
  eventTypes: createMasterController(EventType),
  performers: createMasterController(Performer, [{ model: EventType, as: 'event_type' }]),
  menuCategories: createMasterController(MenuCategory),
  cuisineTypes: createMasterController(CuisineType)
};
