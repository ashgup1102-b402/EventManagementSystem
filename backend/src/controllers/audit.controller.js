const { AuditLog, User } = require('../models');
const { Op } = require('sequelize');

// GET /api/audit
const getAuditLogs = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      user_id, 
      action, 
      entity_type, 
      startDate, 
      endDate 
    } = req.query;

    const where = {};
    if (user_id) where.user_id = user_id;
    if (action) where.action = { [Op.iLike]: `%${action}%` };
    if (entity_type) where.entity_type = entity_type;
    
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) where.created_at[Op.lte] = new Date(endDate);
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'role'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (err) { next(err); }
};

// GET /api/audit/actions (for filters)
const getAuditActions = async (req, res, next) => {
  try {
    const actions = await AuditLog.findAll({
      attributes: [[AuditLog.sequelize.fn('DISTINCT', AuditLog.sequelize.col('action')), 'action']],
      raw: true
    });
    res.json({ success: true, data: actions.map(a => a.action) });
  } catch (err) { next(err); }
};

module.exports = { getAuditLogs, getAuditActions };
