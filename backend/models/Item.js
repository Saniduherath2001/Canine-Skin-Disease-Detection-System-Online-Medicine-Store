const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  itemId: { type: String },
  name: { type: String, required: true },
  category: { type: String, default: 'General' },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  description: { type: String, default: '' },
  status: { type: String, enum: ['Available', 'Low Stock', 'Out of Stock'], default: 'Available' },
  imageUrl: { type: String, default: '' },
  additionalImages: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

itemSchema.pre('save', async function() {
  if (!this.itemId) {
    const count = await mongoose.model('Item').countDocuments();
    this.itemId = `ITM_${String(count).padStart(3, '0')}`;
  }
});

module.exports = mongoose.model('Item', itemSchema);
