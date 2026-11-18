const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const Item = require('../models/Item');

// GET /api/settings/delivery-fee - Get global delivery fee
router.get('/delivery-fee', async (req, res) => {
  try {
    const deliveryFee = await Setting.getGlobalDeliveryFee();
    res.json({ deliveryFee });
  } catch (error) {
    console.error('Error fetching global delivery fee:', error);
    res.status(500).json({ message: 'Server error while fetching delivery fee' });
  }
});

// GET /api/settings - Get all store settings
router.get('/', async (req, res) => {
  try {
    const deliveryFee = await Setting.getGlobalDeliveryFee();
    res.json({ deliveryFee });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Server error while fetching settings' });
  }
});

// PUT /api/settings/delivery-fee - Update global delivery fee for all items (Admin)
router.put('/delivery-fee', async (req, res) => {
  try {
    const { deliveryFee } = req.body;
    if (deliveryFee === undefined || deliveryFee === null || deliveryFee === '') {
      return res.status(400).json({ message: 'Delivery fee value is required' });
    }

    const cleaned = typeof deliveryFee === 'string'
      ? deliveryFee.replace(/[^0-9.-]+/g, '')
      : deliveryFee;
    const parsedFee = parseFloat(cleaned);

    if (isNaN(parsedFee) || parsedFee < 0 || parsedFee > 100000) {
      return res.status(400).json({ message: 'Delivery fee must be a valid amount between 0 and 100,000' });
    }

    const updatedSetting = await Setting.findOneAndUpdate(
      { key: 'store_settings' },
      { deliveryFee: parsedFee, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    // Synchronize all existing items in DB with the new global delivery fee
    await Item.updateMany({}, { $set: { deliveryFee: parsedFee } });

    console.log(`🚚 Updated Global Delivery Fee to Rs. ${parsedFee} for all items`);
    res.json({
      deliveryFee: updatedSetting.deliveryFee,
      message: `Global delivery fee updated to Rs. ${updatedSetting.deliveryFee} for all items`,
    });
  } catch (error) {
    console.error('Error updating global delivery fee:', error);
    res.status(500).json({ message: 'Server error while updating delivery fee' });
  }
});

module.exports = router;
