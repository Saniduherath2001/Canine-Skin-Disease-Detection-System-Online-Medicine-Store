const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  itemId: { type: String },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    minlength: [2, 'Item name must be at least 2 characters'],
    maxlength: [200, 'Item name cannot exceed 200 characters'],
  },
  category: {
    type: String,
    trim: true,
    default: 'General',
    maxlength: [100, 'Category too long'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    max: [1000000, 'Price cannot exceed Rs. 1,000,000'],
  },
  deliveryFee: {
    type: Number,
    default: 0,
    min: [0, 'Delivery fee cannot be negative'],
    max: [100000, 'Delivery fee cannot exceed Rs. 100,000'],
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative'],
    max: [100000, 'Stock value too large'],
  },
  description: {
    type: String,
    trim: true,
    default: '',
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  status: {
    type: String,
    enum: {
      values: ['Available', 'Low Stock', 'Out of Stock'],
      message: 'Status must be Available, Low Stock, or Out of Stock',
    },
    default: 'Available',
  },
  imageUrl:         { type: String, default: '' },
  additionalImages: [{ type: String }],
  createdAt:        { type: Date, default: Date.now },
});

itemSchema.pre('save', async function () {
  if (!this.itemId) {
    const count = await mongoose.model('Item').countDocuments();
    this.itemId = `ITM_${String(count).padStart(3, '0')}`;
  }
  // Auto-update status based on stock
  if (this.stock === 0) {
    this.status = 'Out of Stock';
  } else if (this.stock <= 5) {
    this.status = 'Low Stock';
  } else {
    this.status = 'Available';
  }
});

module.exports = mongoose.model('Item', itemSchema);
