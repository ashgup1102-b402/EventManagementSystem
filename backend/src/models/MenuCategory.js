const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MenuCategory = sequelize.define('MenuCategory', {
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
  tableName: 'menu_categories',
  timestamps: true,
  underscored: true
});

module.exports = MenuCategory;
