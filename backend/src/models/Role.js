const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Role = sequelize.define('Role', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  status: { type: DataTypes.ENUM('Active', 'Inactive'), defaultValue: 'Active' },
  description: { type: DataTypes.STRING(255), allowNull: true },
  is_system: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'roles' });

module.exports = Role;
