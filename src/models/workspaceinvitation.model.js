const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const WorkspaceInvitation = sequelize.define(
  'WorkspaceInvitation',
  {
    workspaceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    role: {
      type: DataTypes.ENUM('viewer', 'editor'),
      defaultValue: 'viewer',
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
  },
  {
    timestamps: true,
  }
);

module.exports = WorkspaceInvitation;
