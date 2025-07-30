// controllers/blockController.js

const Block = require('../models/block.model'); // Sequelize Block model
const Page = require('../models/page.model');   // Sequelize Page model

// Create a new block for a page
exports.createBlock = async (req, res) => {
  try {
    const { pageId, type, data } = req.body;

    console.log(`Received request to create block for pageId: ${pageId}`);

    // Check if the page exists
    const page = await Page.findOne({ where: { id: pageId } });
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    // Create a new block
    const block = await Block.create({ pageId, type, data });
    res.status(201).json({ message: 'Block created successfully', block });
  } catch (error) {
    console.log('Error creating block:', error);
    res.status(500).json({ message: 'Error creating block', error });
  }
};

// Get all blocks for a specific page
exports.getAllBlocks = async (req, res) => {
  try {
    const pageId = req.query.pageId;
    
    // Fetch blocks for the page
    const blocks = await Block.findAll({ where: { pageId } });
    if (!blocks.length) {
      return res.status(404).json({ message: 'No blocks found for this page' });
    }

    res.status(200).json(blocks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blocks', error });
  }
};

// Update a block's data
exports.updateBlock = async (req, res) => {
  try {
    const  id  = req.query.id;
    const { data } = req.body;
    
    // Find the block by ID
    const block = await Block.findByPk(id);
    if (!block) {
      return res.status(404).json({ message: 'Block not found' });
    }

    // Update the block data
    block.data = data;
    await block.save();

    res.status(200).json({ message: 'Block updated successfully', block });
  } catch (error) {
    res.status(500).json({ message: 'Error updating block', error });
  }
};

// Delete a block
exports.deleteBlock = async (req, res) => {
  try {
    const { blockId } = req.params;
    
    // Find the block by ID
    const block = await Block.findByPk(blockId);
    if (!block) {
      return res.status(404).json({ message: 'Block not found' });
    }

    // Delete the block
    await block.destroy();
    res.status(200).json({ message: 'Block deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting block', error });
  }
};
