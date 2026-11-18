const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId:   { type: String, default: '' },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name too long'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  deliveryFee: {
    type: Number,
    default: 0,
    min: [0, 'Delivery fee cannot be negative'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    default: 1,
    min: [1, 'Quantity must be at least 1'],
    max: [1000, 'Quantity cannot exceed 1000'],
  },
  image:       { type: String, default: '' },
  description: { type: String, default: '', maxlength: [1000, 'Description too long'] },
});

const cartSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: [true, 'User email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  items:     { type: [cartItemSchema], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Cart', cartSchema);
