const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/constants');

// Seed default admin if missing
const seedDefaultAdmin = async () => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const defaultEmail = 'saniduherath2001@gmail.com';
      const defaultPassword = '12345678';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      await Admin.create({
        email: defaultEmail,
        password: hashedPassword,
        name: 'System Admin',
      });
      console.log('👑 Default Admin account created in MongoDB.');
    }
  } catch (err) {
    console.error('Error seeding default admin:', err.message);
  }
};


// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Ensure default admin exists in DB
    await seedDefaultAdmin();

    // Find admin in database
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid admin credentials.' });
    }

    // Check password (supports hashed or plain for backwards compatibility)
    let isMatch = false;
    if (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, admin.password);
    } else {
      isMatch = admin.password === password;
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials.' });
    }

    // Generate JWT token for admin
    const token = jwt.sign(
      { id: admin._id, role: 'admin', email: admin.email },
      JWT_SECRET || 'doggo_care_secret_key',
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      message: 'Admin login successful.',
      token,
      admin: { id: admin._id, email: admin.email, name: admin.name, role: 'admin' },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ message: 'Server error during login.' });
  }
});

// GET /api/admin/users - Get all real registered users from MongoDB
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// PUT /api/admin/users/:id/status - Toggle user active/blocked status
router.put('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Server error updating user status' });
  }
});

// DELETE /api/admin/users/:id - Delete a user
router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

module.exports = router;

