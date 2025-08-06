// const express = require('express');
// const router = express.Router();
// const blockController = require('../controllers/block.controller');

// // Block routes (new)

// router.post('/block-create', blockController.createBlock);
// router.get('/block-get-all/', blockController.getAllBlocks);
// router.put('/block-update/', blockController.updateBlock);
// router.delete('/block-delete/', blockController.deleteBlock);

// module.exports = router;

// routes/blockRoutes.js

const express = require('express');
const router = express.Router();
const blockController = require('../controllers/block.controller');

// Create a new block
router.post('/blocks', blockController.createBlock);

// Get all blocks for a specific page
router.get('/blocks', blockController.getAllBlocks);

// Get a specific block by ID
router.get('/blocks/:blockId', blockController.getBlock);

// Update a block
router.put('/blocks/:blockId', blockController.updateBlock);

// Bulk update multiple blocks
router.put('/blocks/bulk', blockController.bulkUpdateBlocks);

// Create or update a block (upsert)
router.post('/blocks/upsert', blockController.upsertBlock);

// Delete a block
router.delete('/blocks/:blockId', blockController.deleteBlock);

// Get the latest block for a page
router.get('/pages/:pageId/latest-block', blockController.getLatestBlock);

module.exports = router;

/*
Usage in your main app.js:

const blockRoutes = require('./routes/blockRoutes');
app.use('/api', blockRoutes);

Example API endpoints:
- POST /api/blocks - Create new block
- GET /api/blocks?pageId=123 - Get all blocks for page 123
- GET /api/blocks/456 - Get specific block with ID 456
- PUT /api/blocks/456 - Update block with ID 456
- POST /api/blocks/upsert - Create or update block
- DELETE /api/blocks/456 - Delete block with ID 456
- GET /api/pages/123/latest-block - Get latest block for page 123
*/
