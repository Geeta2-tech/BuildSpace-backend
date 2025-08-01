// controllers/blockController.js

const Block = require('../models/block.model'); // Sequelize Block model
const Page = require('../models/page.model'); // Sequelize Page model

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
    const blocks = await Block.findAll({ 
      where: { pageId },
      order: [['createdAt', 'ASC']] // Order by creation time
    });
    
    if (!blocks.length) {
      return res.status(404).json({ message: 'No blocks found for this page' });
    }

    res.status(200).json(blocks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blocks', error });
  }
};

// Get a specific block by ID
exports.getBlock = async (req, res) => {
  try {
    const { blockId } = req.params;

    const block = await Block.findByPk(blockId);
    if (!block) {
      return res.status(404).json({ message: 'Block not found' });
    }

    res.status(200).json(block);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching block', error });
  }
};

// Update a block's data
exports.updateBlock = async (req, res) => {
  try {
    const id = req.query.id || req.params.blockId;
    const { data, type } = req.body;

    // Find the block by ID
    const block = await Block.findByPk(id);
    if (!block) {
      return res.status(404).json({ message: 'Block not found' });
    }

    // Update the block data
    if (data !== undefined) block.data = data;
    if (type !== undefined) block.type = type;
    
    await block.save();

    res.status(200).json({ message: 'Block updated successfully', block });
  } catch (error) {
    res.status(500).json({ message: 'Error updating block', error });
  }
};

// Bulk update multiple blocks (useful for real-time collaboration)
exports.bulkUpdateBlocks = async (req, res) => {
  try {
    const { updates } = req.body; // Array of {id, data, type}

    if (!Array.isArray(updates)) {
      return res.status(400).json({ message: 'Updates must be an array' });
    }

    const results = [];
    
    for (const update of updates) {
      try {
        const block = await Block.findByPk(update.id);
        if (block) {
          if (update.data !== undefined) block.data = update.data;
          if (update.type !== undefined) block.type = update.type;
          await block.save();
          results.push({ id: update.id, success: true, block });
        } else {
          results.push({ id: update.id, success: false, error: 'Block not found' });
        }
      } catch (error) {
        results.push({ id: update.id, success: false, error: error.message });
      }
    }

    res.status(200).json({ message: 'Bulk update completed', results });
  } catch (error) {
    res.status(500).json({ message: 'Error performing bulk update', error });
  }
};

// Create or update a block (upsert operation)
exports.upsertBlock = async (req, res) => {
  try {
    const { pageId, blockId, type, data } = req.body;

    let block;
    
    if (blockId) {
      // Try to update existing block
      block = await Block.findByPk(blockId);
      if (block) {
        if (data !== undefined) block.data = data;
        if (type !== undefined) block.type = type;
        await block.save();
      } else {
        return res.status(404).json({ message: 'Block not found' });
      }
    } else {
      // Create new block
      const page = await Page.findOne({ where: { id: pageId } });
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }
      
      block = await Block.create({ pageId, type: type || 'text', data });
    }

    res.status(200).json({ 
      message: blockId ? 'Block updated successfully' : 'Block created successfully', 
      block 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error upserting block', error });
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

// Get the latest block for a page (useful for real-time editor initialization)
exports.getLatestBlock = async (req, res) => {
  try {
    const { pageId } = req.params;

    const block = await Block.findOne({
      where: { pageId },
      order: [['updatedAt', 'DESC']]
    });

    if (!block) {
      return res.status(404).json({ message: 'No blocks found for this page' });
    }

    res.status(200).json(block);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching latest block', error });
  }
};