const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EventType = sequelize.define('EventType', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active'
  }
}, {
  tableName: 'event_types',
  timestamps: true,
  underscored: true
});

module.exports = EventType;
