const router = require('express').Router();
const userController = require('../controllers/user.controller');
const upload = require('../middlewares/upload');

router.get('/get-user-profile', userController.getUserProfileById);
router.put('/update-username', userController.updateUserName);
router.post(
  '/upload-avatar',
  upload.single('avatar'),
  userController.uploadAvatar
); // New route

module.exports = router;
