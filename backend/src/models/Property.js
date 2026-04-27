const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Property = sequelize.define('Property', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name:        { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  address:     { type: DataTypes.STRING(255), allowNull: false },
  city:        { type: DataTypes.STRING(100), allowNull: false },
  state:       { type: DataTypes.STRING(100), allowNull: false },
  country:     { type: DataTypes.STRING(100), defaultValue: 'India' },
  pincode:     { type: DataTypes.STRING(10), allowNull: true },
  latitude:    { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  longitude:   { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  category: {
    type: DataTypes.ENUM('restaurant', 'club', 'banquet_hall', 'bar', 'lounge', 'rooftop', 'resort', 'other'),
    defaultValue: 'restaurant'
  },
  cover_image: { type: DataTypes.STRING, allowNull: true },
  gallery:     { type: DataTypes.JSON, defaultValue: [] },
  admin_user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  property_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  portal_commission_percent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 10.00
  },
  whatsapp_mode: {
    type: DataTypes.ENUM('property', 'portal'),
    defaultValue: 'property'
  },
  whatsapp_session_id: { type: DataTypes.STRING, allowNull: true },
  whatsapp_number:     { type: DataTypes.STRING(20), allowNull: true },
  email:               { type: DataTypes.STRING(150), allowNull: true },
  phone:               { type: DataTypes.STRING(20), allowNull: true },
  website:             { type: DataTypes.STRING, allowNull: true },
  opening_time:        { type: DataTypes.TIME, allowNull: true },
  closing_time:        { type: DataTypes.TIME, allowNull: true },
  cuisine_types:       { type: DataTypes.JSON, defaultValue: [] },
  amenities:           { type: DataTypes.JSON, defaultValue: [] },
  tags:                { type: DataTypes.JSON, defaultValue: [] },
  rating:              { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 },
  total_reviews:       { type: DataTypes.INTEGER, defaultValue: 0 },
  is_active:           { type: DataTypes.BOOLEAN, defaultValue: true },
  is_featured:         { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'properties'
});

module.exports = Property;
