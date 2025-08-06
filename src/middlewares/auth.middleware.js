const { tokenUtils } = require('../utils/encryption');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header

    const token = req.cookies.accessToken;
    const decoded = tokenUtils.verifyAccessToken(token);

    // Optional: fetch full user from DB
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      email_verified: user.email_verified,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: err.message || 'Unauthorized' });
  }
};

module.exports = authMiddleware;
