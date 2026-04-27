const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BookingItem = sequelize.define('BookingItem', {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  booking_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'bookings', key: 'id' } },
  item_type:  { type: DataTypes.ENUM('menu_item','combo_deal','event_ticket','slot'), allowNull: false },
  item_id:    { type: DataTypes.UUID, allowNull: false },
  item_name:  { type: DataTypes.STRING(150), allowNull: false },
  quantity:   { type: DataTypes.INTEGER, defaultValue: 1 },
  unit_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  total_price:{ type: DataTypes.DECIMAL(10, 2), allowNull: false }
}, { tableName: 'booking_items' });

module.exports = BookingItem;
