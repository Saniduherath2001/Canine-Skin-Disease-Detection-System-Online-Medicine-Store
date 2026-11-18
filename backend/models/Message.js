const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: [true, 'User email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  userName: {
    type: String,
    trim: true,
    default: 'Customer',
    maxlength: [100, 'User name too long'],
  },
  sender: {
    type: String,
    required: [true, 'Sender is required'],
    enum: { values: ['user', 'admin'], message: 'Sender must be user or admin' },
  },
  message: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    minlength: [1, 'Message cannot be empty'],
    maxlength: [2000, 'Message cannot exceed 2000 characters'],
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Message', messageSchema);
