const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Booking = sequelize.define('Booking', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  booking_ref:  { type: DataTypes.STRING(20), allowNull: false, unique: true },
  user_id:      { type: DataTypes.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
  guest_name:   { type: DataTypes.STRING(100), allowNull: true },
  guest_email:  { type: DataTypes.STRING(100), allowNull: true },
  guest_phone:  { type: DataTypes.STRING(20), allowNull: true },
  property_id:  { type: DataTypes.UUID, allowNull: false, references: { model: 'entities', key: 'id' } },
  booking_type: { type: DataTypes.ENUM('event_ticket','table_reservation','combo'), allowNull: false },
  event_id:     { type: DataTypes.UUID, allowNull: true, references: { model: 'events', key: 'id' } },
  slot_id:      { type: DataTypes.UUID, allowNull: true, references: { model: 'property_slots', key: 'id' } },
  booking_date:    { type: DataTypes.DATEONLY, allowNull: false },
  num_guests:      { type: DataTypes.INTEGER, defaultValue: 1 },
  subtotal_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  discount_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  tax_amount:      { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total_amount:    { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  commission_amount:    { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  payment_status: {
    type: DataTypes.ENUM('pending','paid','refunded','partially_refunded'),
    defaultValue: 'pending'
  },
  payment_method: { type: DataTypes.STRING(50), allowNull: true, comment: 'For future: upi, card, etc.' },
  payment_ref:    { type: DataTypes.STRING(100), allowNull: true },
  booking_status: {
    type: DataTypes.ENUM('open','confirmed','cancelled','on_hold','completed','no_show'),
    defaultValue: 'open'
  },
  status_change_reason: { type: DataTypes.STRING, allowNull: true },
  status_change_comment: { type: DataTypes.TEXT, allowNull: true },
  discount_id:   { type: DataTypes.UUID, allowNull: true, references: { model: 'discounts', key: 'id' } },
  promo_code:    { type: DataTypes.STRING(30), allowNull: true },
  special_requests: { type: DataTypes.TEXT, allowNull: true },
  cancellation_reason: { type: DataTypes.TEXT, allowNull: true },
  cancelled_at:  { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'bookings' });

module.exports = Booking;
