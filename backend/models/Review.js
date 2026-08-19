const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  orderId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: false },
  productId:   { type: String, default: 'general' },
  productName: { type: String, default: 'General Feedback' },
  customerName:{ type: String, required: true },
  rating:      { type: Number, min: 1, max: 5, required: true },
  comment:     { type: String, default: '' },
  createdAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('Review', reviewSchema);

