const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const EmailVerificationToken = sequelize.define('EmailVerificationToken', {
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

module.exports = EmailVerificationToken;
