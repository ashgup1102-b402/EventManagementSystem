const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Discount = sequelize.define('Discount', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  property_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'entities', key: 'id' } },
  name:        { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  discount_type: {
    type: DataTypes.ENUM('percentage', 'flat'),
    allowNull: false
  },
  discount_value: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  applicable_on: {
    type: DataTypes.ENUM('menu_item','event','combo_deal','all_menu','all_events','slot','total'),
    allowNull: false
  },
  applicable_id:       { type: DataTypes.UUID, allowNull: true, comment: 'specific item ID if not "all"' },
  min_booking_amount:  { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  max_discount_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  valid_from:          { type: DataTypes.DATEONLY, allowNull: true },
  valid_to:            { type: DataTypes.DATEONLY, allowNull: true },
  usage_limit:         { type: DataTypes.INTEGER, allowNull: true },
  used_count:          { type: DataTypes.INTEGER, defaultValue: 0 },
  promo_code:          { type: DataTypes.STRING(30), allowNull: true },
  image:               { type: DataTypes.STRING, allowNull: true },
  is_stackable:        { type: DataTypes.BOOLEAN, defaultValue: false },
  is_active:           { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'discounts' });

module.exports = Discount;
