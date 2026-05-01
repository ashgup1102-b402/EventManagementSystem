const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Entity = sequelize.define('Entity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name:        { type: DataTypes.STRING(150), allowNull: false, unique: true },
  entity_type: { 
    type: DataTypes.ENUM('Organization', 'Individual'), 
    defaultValue: 'Organization',
    allowNull: false
  },
  entity_code: { type: DataTypes.STRING(8), allowNull: false, unique: true },
  unique_number: { type: DataTypes.STRING(20), allowNull: false, unique: true },
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
  category_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'categories', key: 'id' }
  },
  cover_image: { type: DataTypes.STRING, allowNull: true },
  profile_photo: { type: DataTypes.STRING, allowNull: true },
  gallery:     { type: DataTypes.JSON, defaultValue: [] },
  admin_user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  entity_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  pan_number: { type: DataTypes.STRING(10), allowNull: true },
  aadhar_number: { type: DataTypes.STRING(12), allowNull: true },
  gst_number: { type: DataTypes.STRING(15), allowNull: true },
  pan_attachment: { type: DataTypes.STRING, allowNull: true },
  aadhar_attachment: { type: DataTypes.STRING, allowNull: true },
  mobile_1: { type: DataTypes.STRING(20), allowNull: false },
  mobile_2: { type: DataTypes.STRING(20), allowNull: true },
  email:               { type: DataTypes.STRING(150), allowNull: true },
  website:             { type: DataTypes.STRING, allowNull: true },
  opening_time:        { type: DataTypes.TIME, allowNull: true },
  closing_time:        { type: DataTypes.TIME, allowNull: true },
  cuisine_types:       { type: DataTypes.JSON, defaultValue: [] },
  amenities:           { type: DataTypes.JSON, defaultValue: [] },
  tags:                { type: DataTypes.JSON, defaultValue: [] },
  rating:              { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 },
  total_reviews:       { type: DataTypes.INTEGER, defaultValue: 0 },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active'
  },
  is_featured:         { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'entities'
});

module.exports = Entity;
