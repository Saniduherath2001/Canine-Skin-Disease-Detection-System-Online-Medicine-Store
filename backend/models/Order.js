const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String },
  customerInfo: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    province: { type: String, required: true },
  },
  items: [{
    productId: { type: String },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
  }],
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paymentMethod: { type: String, default: 'cod' },
  status: { type: String, enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
});

orderSchema.pre('save', async function() {
  if (!this.orderId) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderId = `ORD_${String(count).padStart(3, '0')}`;
  }
});

module.exports = mongoose.model('Order', orderSchema);
