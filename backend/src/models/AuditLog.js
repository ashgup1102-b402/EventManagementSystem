const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id:     { type: DataTypes.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
  action:      { type: DataTypes.STRING(100), allowNull: false },
  entity_type: { type: DataTypes.STRING(80), allowNull: false },
  entity_id:   { type: DataTypes.UUID, allowNull: true },
  old_values:  { type: DataTypes.JSON, allowNull: true },
  new_values:  { type: DataTypes.JSON, allowNull: true },
  ip_address:  { type: DataTypes.STRING(45), allowNull: true },
  user_agent:  { type: DataTypes.STRING(255), allowNull: true }
}, { tableName: 'audit_logs', updatedAt: false });

module.exports = AuditLog;
