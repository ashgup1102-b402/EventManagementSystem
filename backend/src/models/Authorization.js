const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Authorization = sequelize.define('Authorization', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  role_name: { type: DataTypes.STRING(50), allowNull: false },
  screen_name: { type: DataTypes.STRING(100), allowNull: false },
  permission: {
    type: DataTypes.ENUM('None', 'Read Only', 'Read and Edit', 'Full Access'),
    defaultValue: 'None'
  }
}, { 
  tableName: 'authorizations',
  indexes: [
    { unique: true, fields: ['role_name', 'screen_name'] }
  ]
});

module.exports = Authorization;
