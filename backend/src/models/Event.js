const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Event = sequelize.define('Event', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  property_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'entities', key: 'id' } },
  name:        { type: DataTypes.STRING(150), allowNull: false },
  event_type_id: { type: DataTypes.UUID, allowNull: true, references: { model: 'event_types', key: 'id' } },
  performer_id:  { type: DataTypes.UUID, allowNull: true, references: { model: 'performers', key: 'id' } },
  type: {
    type: DataTypes.STRING(50), // Changed from ENUM to STRING for transition
    allowNull: true
  },
  description:     { type: DataTypes.TEXT, allowNull: true },
  event_date:      { type: DataTypes.DATEONLY, allowNull: false },
  end_date:        { type: DataTypes.DATEONLY, allowNull: true },
  start_time:      { type: DataTypes.TIME, allowNull: false },
  end_time:        { type: DataTypes.TIME, allowNull: true },
  ticket_price:    { 
    type: DataTypes.DECIMAL(10, 2), 
    defaultValue: 0,
    validate: { min: 0 }
  },
  total_capacity:  { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    defaultValue: 100,
    validate: { min: 0 }
  },
  booked_count:    { type: DataTypes.INTEGER, defaultValue: 0 },
  image:           { type: DataTypes.STRING, allowNull: true },
  gallery:         { type: DataTypes.JSON, defaultValue: [] },
  performer_name:  { type: DataTypes.STRING(150), allowNull: true },
  tags:            { type: DataTypes.JSON, defaultValue: [] },
  is_active:       { type: DataTypes.BOOLEAN, defaultValue: true },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active'
  },
  is_featured:     { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'events' });

module.exports = Event;
