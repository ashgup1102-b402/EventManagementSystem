const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MenuItem = sequelize.define('MenuItem', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  property_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'properties', key: 'id' } },
  name:        { type: DataTypes.STRING(150), allowNull: false },
  category: {
    type: DataTypes.ENUM('starter','main_course','dessert','beverage','cocktail','mocktail','snack','bread','soup','salad','other'),
    allowNull: false
  },
  cuisine_type:  { type: DataTypes.STRING(80), allowNull: true },
  description:   { type: DataTypes.TEXT, allowNull: true },
  price:         { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  image:         { type: DataTypes.STRING, allowNull: true },
  is_veg:        { type: DataTypes.BOOLEAN, defaultValue: true },
  is_available:  { type: DataTypes.BOOLEAN, defaultValue: true },
  is_featured:   { type: DataTypes.BOOLEAN, defaultValue: false },
  spice_level:   { type: DataTypes.ENUM('mild','medium','spicy','extra_spicy'), defaultValue: 'mild' },
  allergens:     { type: DataTypes.JSON, defaultValue: [] },
  preparation_time: { type: DataTypes.INTEGER, allowNull: true, comment: 'Minutes' }
}, { tableName: 'menu_items' });

module.exports = MenuItem;
