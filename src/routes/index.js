const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const profileRouter = require('./profile.route');

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API is up and running' });
});

router.use('/auth', authRoutes);
router.use('/profile', profileRouter);

module.exports = router;
