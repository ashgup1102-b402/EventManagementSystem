const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WhatsappLog = sequelize.define('WhatsappLog', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  property_id:  { type: DataTypes.UUID, allowNull: true, references: { model: 'entities', key: 'id' } },
  sender_type:  { type: DataTypes.ENUM('property','portal'), defaultValue: 'property' },
  message:      { type: DataTypes.TEXT, allowNull: false },
  recipient_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  recipient_list:  { type: DataTypes.JSON, defaultValue: [] },
  sent_by:      { type: DataTypes.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
  status:       { type: DataTypes.ENUM('pending','sent','partial','failed'), defaultValue: 'pending' },
  error_log:    { type: DataTypes.JSON, defaultValue: [] },
  sent_at:      { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'whatsapp_logs' });

module.exports = WhatsappLog;
