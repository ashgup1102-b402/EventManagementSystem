const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Performer = sequelize.define('Performer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  event_type_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'event_types',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active'
  }
}, {
  tableName: 'performers',
  timestamps: true,
  underscored: true
});

module.exports = Performer;
