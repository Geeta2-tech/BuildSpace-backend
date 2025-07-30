const express = require('express');
const router = express.Router();
const blockController = require('../controllers/block.controller');

// Block routes (new)

router.post('/block-create', blockController.createBlock);
router.get('/block-get-all/', blockController.getAllBlocks);
router.put('/block-update/', blockController.updateBlock);
router.delete('/block-delete/', blockController.deleteBlock);

module.exports = router;