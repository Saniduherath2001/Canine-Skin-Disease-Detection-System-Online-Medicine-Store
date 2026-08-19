const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const VerificationCode = require('../models/VerificationCode');
const { sendVerificationEmail } = require('../utils/emailService');
const { JWT_SECRET } = require('../config/constants');

function isValidPassword(password) {
  return password.length >= 8 && /[A-Z]/.test(password) && /[!@#$%^&*]/.test(password);
}

// 0. Request Registration Verification Code
exports.sendRegisterCode = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    const finalUsername = email ? email.split('@')[0] : '';

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        error: 'Password must contain at least 8 characters, one uppercase letter, and one special character',
      });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username: finalUsername }] });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email or username already exists' });
    }

    // Generate random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await VerificationCode.findOneAndDelete({ email });
    await VerificationCode.create({
      email,
      username: fullName || finalUsername,
      codeHash,
      expiresAt,
    });

    const mailResult = await sendVerificationEmail(email, code, fullName || finalUsername);

    res.json({
      message: 'Verification code sent to your email.',
      devMode: mailResult.devMode,
      devCode: mailResult.devMode ? code : undefined,
    });
  } catch (error) {
    console.error('Send Register Code Error:', error.message);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
};

// 1. Complete Registration with OTP Code
exports.register = async (req, res) => {
  try {
    const { username, email, password, fullName, phone, code } = req.body;

    const finalUsername = username || (email ? email.split('@')[0] : '');

    if (!finalUsername || !email || !password || !code) {
      return res.status(400).json({ error: 'Email, password, and 6-digit code are required' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        error: 'Password must contain at least 8 characters, one uppercase letter, and one special character',
      });
    }

    // Verify OTP Code
    const record = await VerificationCode.findOne({ email });
    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired verification code. Please request a new code.' });
    }

    if (new Date() > record.expiresAt) {
      await VerificationCode.deleteOne({ _id: record._id });
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    const isCodeMatch = await bcrypt.compare(code, record.codeHash);
    if (!isCodeMatch) {
      return res.status(400).json({ error: 'Incorrect 6-digit verification code' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username: finalUsername }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: finalUsername,
      email,
      password: hashedPassword,
      fullName: fullName || '',
      phone: phone || '',
    });

    await VerificationCode.deleteOne({ _id: record._id });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Register Error:', error.message);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// 2. Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName || user.username,
        phone: user.phone || '',
      },
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ error: 'Login failed' });
  }
};

// 3. Request Password Reset Code
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Return success to avoid email enumeration
      return res.json({ message: 'If an account exists with this email, a verification code has been sent.' });
    }

    // Generate random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await VerificationCode.findOneAndDelete({ email });
    await VerificationCode.create({
      email,
      username: user.username,
      codeHash,
      expiresAt,
    });

    const mailResult = await sendVerificationEmail(email, code, user.username);

    res.json({
      message: 'Verification code sent to your email.',
      devMode: mailResult.devMode,
      devCode: mailResult.devMode ? code : undefined,
    });
  } catch (error) {
    console.error('Forgot Password Error:', error.message);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
};

// 4. Verify Password Reset Code
exports.verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const record = await VerificationCode.findOne({ email });
    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    if (new Date() > record.expiresAt) {
      await VerificationCode.deleteOne({ _id: record._id });
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    const isMatch = await bcrypt.compare(code, record.codeHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    res.json({ message: 'Verification code verified successfully' });
  } catch (error) {
    console.error('Verify Code Error:', error.message);
    res.status(500).json({ error: 'Verification failed' });
  }
};

// 5. Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and new password are required' });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        error: 'Password must contain at least 8 characters, one uppercase letter, and one special character',
      });
    }

    const record = await VerificationCode.findOne({ email });
    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const isMatch = await bcrypt.compare(code, record.codeHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email }, { password: hashedPassword });
    await VerificationCode.deleteOne({ _id: record._id });

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Reset Password Error:', error.message);
    res.status(500).json({ error: 'Password reset failed' });
  }
};

// 6. Get Current User Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Get Profile Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

// 7. Update User Profile
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phone, email, _id } = req.body;

    let user;
    if (req.userId) {
      user = await User.findById(req.userId).catch(() => null);
    }
    if (!user && _id) {
      user = await User.findById(_id).catch(() => null);
    }
    if (!user && email) {
      user = await User.findOne({ email: { $regex: new RegExp(`^${email.trim()}$`, 'i') } });
    }

    if (!user) {
      user = new User({
        username: email ? email.split('@')[0] : `user_${Date.now()}`,
        email: email || 'user@example.com',
        password: 'Password123!',
        fullName: fullName || '',
        phone: phone || ''
      });
    } else {
      if (fullName !== undefined) user.fullName = fullName;
      if (phone !== undefined) user.phone = phone;
    }

    await user.save();
    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update Profile Error:', error.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

