const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'store_settings',
  },
  deliveryFee: {
    type: Number,
    default: 350,
    min: [0, 'Delivery fee cannot be negative'],
    max: [100000, 'Delivery fee cannot exceed Rs. 100,000'],
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

settingSchema.statics.getGlobalDeliveryFee = async function () {
  let setting = await this.findOne({ key: 'store_settings' });
  if (!setting) {
    setting = await this.create({ key: 'store_settings', deliveryFee: 350 });
  }
  return typeof setting.deliveryFee === 'number' ? setting.deliveryFee : 350;
};

module.exports = mongoose.model('Setting', settingSchema);
