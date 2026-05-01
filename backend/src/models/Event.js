const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Event = sequelize.define('Event', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  property_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'entities', key: 'id' } },
  name:        { type: DataTypes.STRING(150), allowNull: false },
  type: {
    type: DataTypes.ENUM('singer','comedy','group_troup','dj','live_band','stand_up','dance','theatre','sports','other'),
    allowNull: false
  },
  description:     { type: DataTypes.TEXT, allowNull: true },
  event_date:      { type: DataTypes.DATEONLY, allowNull: false },
  start_time:      { type: DataTypes.TIME, allowNull: false },
  end_time:        { type: DataTypes.TIME, allowNull: true },
  ticket_price:    { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total_capacity:  { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 },
  booked_count:    { type: DataTypes.INTEGER, defaultValue: 0 },
  image:           { type: DataTypes.STRING, allowNull: true },
  gallery:         { type: DataTypes.JSON, defaultValue: [] },
  performer_name:  { type: DataTypes.STRING(150), allowNull: true },
  tags:            { type: DataTypes.JSON, defaultValue: [] },
  is_active:       { type: DataTypes.BOOLEAN, defaultValue: true },
  is_featured:     { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'events' });

module.exports = Event;
