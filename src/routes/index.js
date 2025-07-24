const express = require('express');
const router = express.Router();
const profileRouter = require('./profile.route');

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API is up and running' });
});

router.use('/profile', profileRouter);
module.exports = router;
