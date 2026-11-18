const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String },
  orderCode: { type: String },

  customerInfo: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [100, 'First name too long'],
    },
    lastName: {
      type: String,
      default: '',
      trim: true,
      maxlength: [100, 'Last name too long'],
    },
    email: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[0-9+\-\s]{7,15}$/, 'Please enter a valid phone number'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [300, 'Address too long'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City too long'],
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required'],
      trim: true,
      match: [/^[0-9]{5}$/, 'Postal code must be exactly 5 digits'],
    },
    province: {
      type: String,
      default: '',
      trim: true,
      maxlength: [100, 'Province too long'],
    },
  },

  items: {
    type: [
      {
        productId: { type: String, default: '' },
        name:      { type: String, required: [true, 'Item name is required'], trim: true },
        price:     { type: Number, required: [true, 'Item price is required'], min: [0, 'Price cannot be negative'] },
        quantity:  { type: Number, required: [true, 'Item quantity is required'], min: [1, 'Quantity must be at least 1'] },
      },
    ],
    validate: {
      validator: (arr) => arr.length > 0,
      message: 'Order must contain at least one item',
    },
  },

  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative'],
  },
  deliveryFee: {
    type: Number,
    required: [true, 'Delivery fee is required'],
    min: [0, 'Delivery fee cannot be negative'],
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative'],
  },

  paymentMethod: {
    type: String,
    enum: { values: ['cod', 'card', 'stripe', 'bank'], message: 'Payment method must be cod, card, stripe, or bank' },
    default: 'cod',
  },
  paymentStatus: {
    type: String,
    enum: { values: ['Pending', 'Paid', 'Failed'], message: 'Invalid payment status' },
    default: 'Pending',
  },
  status: {
    type: String,
    enum: {
      values: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      message: 'Invalid order status',
    },
    default: 'Pending',
  },

  createdAt: { type: Date, default: Date.now },
});

orderSchema.pre('save', async function () {
  if (!this.orderId) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderId = `ORD_${String(count).padStart(3, '0')}`;
  }
});

module.exports = mongoose.model('Order', orderSchema);
