const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: { len: [3, 50], notEmpty: true }
  },
  user_code: { type: DataTypes.STRING(5), allowNull: true, unique: true },
  unique_number: { type: DataTypes.STRING(20), allowNull: true, unique: true },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING(50),
    defaultValue: 'End_User',
    allowNull: false
  },
  first_name: { type: DataTypes.STRING(80), allowNull: true },
  last_name:  { type: DataTypes.STRING(80), allowNull: true },
  mobile_1:   { type: DataTypes.STRING(20), allowNull: true },
  mobile_2:   { type: DataTypes.STRING(20), allowNull: true },
  phone:      { type: DataTypes.STRING(20), allowNull: true }, // Keeping for compatibility
  pan_number: { type: DataTypes.STRING(10), allowNull: true },
  aadhar_number: { type: DataTypes.STRING(12), allowNull: true },
  pan_attachment: { type: DataTypes.STRING, allowNull: true },
  aadhar_attachment: { type: DataTypes.STRING, allowNull: true },
  website:    { type: DataTypes.STRING, allowNull: true },
  avatar:     { type: DataTypes.STRING, allowNull: true },
  profile_photo: { type: DataTypes.STRING, allowNull: true },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active'
  },
  is_active:  { type: DataTypes.BOOLEAN, defaultValue: true }, // Keeping for compatibility
  last_login: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
      }
    }
  }
});

User.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.password_hash);
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password_hash;
  return values;
};

module.exports = User;
