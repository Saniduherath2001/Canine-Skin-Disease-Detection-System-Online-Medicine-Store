const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  fullName: {
    type: String,
    trim: true,
    default: '',
    maxlength: [100, 'Full name cannot exceed 100 characters'],
  },
  phone: {
    type: String,
    trim: true,
    default: '',
    match: [/^[0-9+\-\s]{7,15}$|^$/, 'Please enter a valid phone number'],
  },
  address: {
    street:     { type: String, trim: true, default: '', maxlength: [200, 'Street too long'] },
    city:       { type: String, trim: true, default: '', maxlength: [100, 'City too long'] },
    postalCode: { type: String, trim: true, default: '', match: [/^[0-9]{5}$|^$/, 'Postal code must be exactly 5 digits'] },
    province:   { type: String, trim: true, default: '', maxlength: [100, 'Province too long'] },
  },
  cardDetails: {
    cardHolderName: { type: String, trim: true, default: '', maxlength: [100, 'Cardholder name too long'] },
    cardNumber:     { type: String, trim: true, default: '', match: [/^[0-9\s]{0,19}$/, 'Card number must contain digits only'] },
    expiryDate:     { type: String, trim: true, default: '', match: [/^(0[1-9]|1[0-2])\/[0-9]{2}$|^$/, 'Expiry date must be in MM/YY format'] },
    cardType:       { type: String, trim: true, default: '', maxlength: [30, 'Card type too long'] },
  },
  bankDetails: {
    accountHolderName: { type: String, trim: true, default: '', maxlength: [100, 'Name too long'] },
    bankName:          { type: String, trim: true, default: '', maxlength: [100, 'Bank name too long'] },
    branchName:        { type: String, trim: true, default: '', maxlength: [100, 'Branch name too long'] },
    accountNumber:     { type: String, trim: true, default: '', match: [/^[0-9]{0,20}$/, 'Account number must be digits only'] },
  },
  profilePic: { type: String, default: '' },
  status: {
    type: String,
    enum: { values: ['Active', 'Inactive', 'Banned'], message: 'Status must be Active, Inactive, or Banned' },
    default: 'Active',
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
