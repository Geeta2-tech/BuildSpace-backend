const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const WorkspaceMember = sequelize.define(
  'WorkspaceMember',
  {
    role: {
      type: DataTypes.ENUM('owner', 'editor', 'viewer'),
      defaultValue: 'editor',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = WorkspaceMember;
