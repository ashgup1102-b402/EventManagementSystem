const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Promotion = sequelize.define('Promotion', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  property_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'entities', key: 'id' } },
  title:       { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  image:       { type: DataTypes.STRING, allowNull: true },
  valid_from:  { type: DataTypes.DATEONLY, allowNull: true },
  valid_to:    { type: DataTypes.DATEONLY, allowNull: true },
  is_active:   { type: DataTypes.BOOLEAN, defaultValue: true },
  display_order: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'promotions' });

module.exports = Promotion;
