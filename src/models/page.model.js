const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Page = sequelize.define(
  'Page',
  {
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Page;
