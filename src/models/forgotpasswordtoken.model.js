const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ForgotPasswordToken = sequelize.define('ForgotPasswordToken', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
});

module.exports = ForgotPasswordToken;
