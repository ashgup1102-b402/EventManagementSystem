const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ComboDeal = sequelize.define('ComboDeal', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  property_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'properties', key: 'id' } },
  name:          { type: DataTypes.STRING(150), allowNull: false },
  description:   { type: DataTypes.TEXT, allowNull: true },
  items:         { type: DataTypes.JSON, defaultValue: [], comment: '[{type:"menu_item"|"event", id, quantity, name, unit_price}]' },
  original_price:{ type: DataTypes.DECIMAL(10, 2), allowNull: false },
  deal_price:    { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  image:         { type: DataTypes.STRING, allowNull: true },
  valid_from:    { type: DataTypes.DATEONLY, allowNull: true },
  valid_to:      { type: DataTypes.DATEONLY, allowNull: true },
  min_guests:    { type: DataTypes.INTEGER, defaultValue: 1 },
  is_active:     { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'combo_deals' });

module.exports = ComboDeal;
