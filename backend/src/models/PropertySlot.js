const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PropertySlot = sequelize.define('PropertySlot', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  property_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'properties', key: 'id' } },
  slot_name:   { type: DataTypes.STRING(100), allowNull: false },
  slot_date:   { type: DataTypes.DATEONLY, allowNull: false },
  start_time:  { type: DataTypes.TIME, allowNull: false },
  end_time:    { type: DataTypes.TIME, allowNull: false },
  slot_type: {
    type: DataTypes.ENUM('table', 'hall', 'rooftop', 'private_room', 'outdoor'),
    defaultValue: 'table'
  },
  total_capacity:  { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
  booked_count:    { type: DataTypes.INTEGER, defaultValue: 0 },
  price_per_head:  { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  min_guests:      { type: DataTypes.INTEGER, defaultValue: 1 },
  max_guests:      { type: DataTypes.INTEGER, defaultValue: 10 },
  description:     { type: DataTypes.TEXT, allowNull: true },
  is_active:       { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'property_slots' });

module.exports = PropertySlot;
