const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  userName: { type: String, default: 'Customer' },
  sender: { type: String, enum: ['user', 'admin'], required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
