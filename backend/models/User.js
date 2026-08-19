const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    province: { type: String, default: '' },
  },
  bankDetails: {
    accountHolderName: { type: String, default: '' },
    bankName: { type: String, default: '' },
    branchName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
  },
  profilePic: { type: String, default: '' },
  status: { type: String, default: 'Active' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
