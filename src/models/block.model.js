// models/Block.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Page = require('./page.model');

const Block = sequelize.define('Block', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,  // type of block (e.g., paragraph, image, etc.)
  },
  data: {
    type: DataTypes.JSON,
    allowNull: false,  // data content for the block (could be rich text, image URLs, etc.)
  },
});

// Relationships
Page.hasMany(Block, { foreignKey: 'pageId' });
Block.belongsTo(Page, { foreignKey: 'pageId' });

module.exports = Block;
