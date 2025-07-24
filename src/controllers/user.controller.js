const userServices = require('../services/user.service');

module.exports = {
  getUserProfileById: async (req, res) => {
    try {
      const userId = req.query.userId;
      const result = await userServices.getUserProfileById(userId);
      if (!result) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  uploadAvatar: async (req, res) => {
    try {
      const userId = req.query.userId;
      const avatarPath = req.file ? `/uploads/${req.file.filename}` : null;
      const updatedUser = await userServices.updateUserAvatar(
        userId,
        avatarPath
      );

      res
        .status(200)
        .json({ message: 'Profile picture updated', data: updatedUser });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
  updateUserName: async (req, res) => {
    try {
      const userId = req.query.userId;
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Name is required' });
      }

      const updatedUser = await userServices.updateUserName(userId, name);

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ message: 'Username updated', data: updatedUser });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
};
