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
    if (req.user?.role !== 'Super Admin') {
      delete data.smtp_pass;
      delete data.payment_secret;
      delete data.portal_whatsapp_session;
    }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// PUT /api/config  (Super Admin only)
const updateConfig = async (req, res, next) => {
  try {
    let config = await SystemConfig.findByPk(1);
    if (!config) config = await SystemConfig.create({ id: 1 });

    const oldValues = config.toJSON();
    
    // Pick allowed fields and handle boolean casting from FormData strings
    const { 
      site_name, site_tagline, cancellation_policy, maintenance_mode,
      portal_default_commission_percent, whatsapp_mode, payment_enabled,
      payment_secret, smtp_host, smtp_port, smtp_secure, smtp_user, 
      smtp_pass, from_name, from_email 
    } = req.body;

    const updateData = {};
    if (site_name !== undefined) updateData.site_name = site_name;
    if (site_tagline !== undefined) updateData.site_tagline = site_tagline;
    if (cancellation_policy !== undefined) updateData.cancellation_policy = cancellation_policy;
    if (maintenance_mode !== undefined) updateData.maintenance_mode = maintenance_mode === 'true' || maintenance_mode === true;
    if (portal_default_commission_percent !== undefined) updateData.portal_default_commission_percent = portal_default_commission_percent;
    if (whatsapp_mode !== undefined) updateData.whatsapp_mode = whatsapp_mode;
    if (payment_enabled !== undefined) updateData.payment_enabled = payment_enabled === 'true' || payment_enabled === true;
    if (payment_secret !== undefined) updateData.payment_secret = payment_secret;
    if (smtp_host !== undefined) updateData.smtp_host = smtp_host;
    if (smtp_port !== undefined) updateData.smtp_port = smtp_port;
    if (smtp_secure !== undefined) updateData.smtp_secure = smtp_secure === 'true' || smtp_secure === true;
    if (smtp_user !== undefined) updateData.smtp_user = smtp_user;
    if (smtp_pass !== undefined) updateData.smtp_pass = smtp_pass;
    if (from_name !== undefined) updateData.from_name = from_name;
    if (from_email !== undefined) updateData.from_email = from_email;

    if (req.file) {
      updateData.site_logo = `/uploads/config/${req.file.filename}`;
    }

    console.log('UPDATING CONFIG:', updateData);
    await config.update(updateData);

    await AuditLog.create({
      user_id: req.user.id, action: 'UPDATE_SYSTEM_CONFIG',
      entity_type: 'SystemConfig', entity_id: null,
      old_values: oldValues, new_values: updateData
    });

    res.json({ success: true, message: 'System configuration updated.', data: config });
  } catch (err) { 
    console.error('CONFIG UPDATE ERROR:', err);
    next(err); 
  }
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
