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
    indexes: [
      {
        unique: true,
        fields: ['userId', 'workspaceId'], // Use the column names Sequelize generates for foreign keys
      },
    ],
  }
);

module.exports = WorkspaceMember;
