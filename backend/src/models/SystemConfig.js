const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SystemConfig = sequelize.define('SystemConfig', {
  id: { type: DataTypes.INTEGER, primaryKey: true, defaultValue: 1 },
  site_name:       { type: DataTypes.STRING(150), defaultValue: 'Event Portal' },
  site_logo:       { type: DataTypes.STRING, allowNull: true },
  site_tagline:    { type: DataTypes.STRING(255), allowNull: true },
  portal_default_commission_percent: { type: DataTypes.DECIMAL(5, 2), defaultValue: 10.00 },
  whatsapp_mode:   { type: DataTypes.ENUM('property','portal'), defaultValue: 'property' },
  portal_whatsapp_number:  { type: DataTypes.STRING(20), allowNull: true },
  portal_whatsapp_session: { type: DataTypes.STRING, allowNull: true },
  smtp_host:   { type: DataTypes.STRING, allowNull: true },
  smtp_port:   { type: DataTypes.INTEGER, defaultValue: 587 },
  smtp_secure: { type: DataTypes.BOOLEAN, defaultValue: false },
  smtp_user:   { type: DataTypes.STRING, allowNull: true },
  smtp_pass:   { type: DataTypes.STRING, allowNull: true },
  from_email:  { type: DataTypes.STRING, allowNull: true },
  from_name:   { type: DataTypes.STRING, allowNull: true },
  maintenance_mode: { type: DataTypes.BOOLEAN, defaultValue: false },
  payment_enabled:  { type: DataTypes.BOOLEAN, defaultValue: false },
  payment_gateway:  { type: DataTypes.STRING(50), allowNull: true },
  payment_key:      { type: DataTypes.STRING, allowNull: true },
  payment_secret:   { type: DataTypes.STRING, allowNull: true },
  max_booking_days_ahead: { type: DataTypes.INTEGER, defaultValue: 30 },
  cancellation_policy:    { type: DataTypes.TEXT, allowNull: true },
  terms_and_conditions:   { type: DataTypes.TEXT, allowNull: true },
  privacy_policy:         { type: DataTypes.TEXT, allowNull: true }
}, { tableName: 'system_config' });

module.exports = SystemConfig;
