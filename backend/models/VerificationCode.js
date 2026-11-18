const mongoose = require('mongoose');

const verificationCodeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  username: {
    type: String,
    trim: true,
    required: false,
    maxlength: [30, 'Username too long'],
  },
  passwordHash: {
    type: String,
    required: false,
  },
  codeHash: {
    type: String,
    required: [true, 'Verification code hash is required'],
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiry date is required'],
    validate: {
      validator: (val) => val > new Date(),
      message: 'Expiry date must be in the future',
    },
  },
});

// Auto-delete document after expiresAt (MongoDB TTL index)
verificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('VerificationCode', verificationCodeSchema);
