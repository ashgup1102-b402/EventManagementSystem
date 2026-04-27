const { SystemConfig } = require('../models');
const { AuditLog } = require('../models');

// GET /api/config
const getConfig = async (req, res, next) => {
  try {
    let config = await SystemConfig.findByPk(1);
    if (!config) {
      config = await SystemConfig.create({ id: 1 });
    }
    // Hide sensitive fields for non-super-admin
    const data = config.toJSON();
    if (req.user?.role !== 'super_admin') {
      delete data.smtp_pass;
      delete data.payment_secret;
      delete data.portal_whatsapp_session;
    }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// PUT /api/config  (super_admin only)
const updateConfig = async (req, res, next) => {
  try {
    let config = await SystemConfig.findByPk(1);
    if (!config) config = await SystemConfig.create({ id: 1 });

    const oldValues = config.toJSON();
    await config.update(req.body);

    await AuditLog.create({
      user_id: req.user.id, action: 'UPDATE_SYSTEM_CONFIG',
      entity_type: 'SystemConfig', entity_id: null,
      old_values: oldValues, new_values: req.body
    });

    res.json({ success: true, message: 'System configuration updated.', data: config });
  } catch (err) { next(err); }
};

// GET /api/config/public  (no auth - for frontend initial load)
const getPublicConfig = async (req, res, next) => {
  try {
    const config = await SystemConfig.findByPk(1);
    res.json({
      success: true,
      data: {
        site_name: config?.site_name || 'Event Portal',
        site_logo: config?.site_logo || null,
        site_tagline: config?.site_tagline || null,
        maintenance_mode: config?.maintenance_mode || false
      }
    });
  } catch (err) { next(err); }
};

module.exports = { getConfig, updateConfig, getPublicConfig };
