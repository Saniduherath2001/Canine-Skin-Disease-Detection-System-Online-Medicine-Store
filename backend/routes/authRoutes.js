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
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/send-register-code', sendRegisterCode);
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-code', verifyCode);
router.post('/reset-password', resetPassword);
router.get('/me', authMiddleware, getProfile);
router.put('/profile', updateProfile);

module.exports = router;
