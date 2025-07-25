const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Workspace = sequelize.define(
  'Workspace',
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Workspace;
