const express = require('express');
const {
  sendRegisterCode,
  register,
  login,
  forgotPassword,
  verifyCode,
  resetPassword,
  getProfile,
  updateProfile,
  uploadAvatar,
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { optionalAuth } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/send-register-code', sendRegisterCode);
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-code', verifyCode);
router.post('/reset-password', resetPassword);
router.get('/me', authMiddleware, getProfile);
router.get('/profile', optionalAuth, getProfile);
router.put('/profile', optionalAuth, updateProfile);
router.post('/profile/avatar', optionalAuth, upload.single('avatar'), uploadAvatar);

module.exports = router;
