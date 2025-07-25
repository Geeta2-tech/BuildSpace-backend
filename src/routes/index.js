const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const profileRouter = require('./profile.route');
const workspaceRoutes = require('./workspace.routes');
const pageRoutes = require('./page.routes');

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API is up and running' });
});

router.use('/auth', authRoutes);
router.use('/profile', profileRouter);
router.use('/workspace', workspaceRoutes);
router.use('/page', pageRoutes);

module.exports = router;
