const User = require('../models/user.model');

module.exports = {
  getUserProfileById: async (userId) => {
    return await User.findOne({ where: { id: userId } });
  },

  updateUserAvatar: async (userId, avatarPath) => {
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }
    user.avatar = avatarPath;
    await user.save();
    return user;
  },
  updateUserName: async (userId, newName) => {
    const user = await User.findByPk(userId);
    if (!user) return null;

    user.name = newName;
    await user.save();

    return user;
  },
};
