const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Page = sequelize.define(
  'Page',
  {
    title: {
      type: DataTypes.STRING,
      allowNull: true,  // Title can be nullable
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,  // createdBy can be nullable
    },
    parentPageId: {
      type: DataTypes.INTEGER,
      allowNull: true,  // Parent page can be nullable
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Page;
