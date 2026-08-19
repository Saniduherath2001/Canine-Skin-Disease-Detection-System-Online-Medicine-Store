const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const upload = require('../middleware/upload');

// GET /api/items - Get all items
router.get('/', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: 1 });
    // Ensure every item has an itemId (e.g. ITM_000, ITM_001)
    const formattedItems = items.map((item, index) => {
      const doc = item.toObject();
      if (!doc.itemId) {
        doc.itemId = `ITM_${String(index).padStart(3, '0')}`;
      }
      return doc;
    });
    res.json(formattedItems);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/items/:id - Get a specific item by ID or itemId
router.get('/:id', async (req, res) => {
  try {
    let item;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      item = await Item.findById(req.params.id);
    } else {
      item = await Item.findOne({ itemId: req.params.id });
    }

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    const doc = item.toObject();
    if (!doc.itemId) {
      const allCount = await Item.countDocuments({ createdAt: { $lt: item.createdAt } });
      doc.itemId = `ITM_${String(allCount).padStart(3, '0')}`;
    }
    res.json(doc);
  } catch (error) {
    console.error('Error fetching item details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/items - Create a new item (Admin only)
router.post('/', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'additionalImages', maxCount: 5 }
]), async (req, res) => {
  try {
    const { name, category, price, stock, description } = req.body;
    
    // Parse price if it comes with $ sign or as string
    let parsedPrice = 0;
    if (price) {
      if (typeof price === 'number') {
        parsedPrice = price;
      } else if (typeof price === 'string') {
        const cleaned = price.replace(/[^0-9.-]+/g,"");
        parsedPrice = parseFloat(cleaned) || 0;
      }
    }

    let finalImageUrl = '';
    if (req.files && req.files['image'] && req.files['image'][0]) {
      finalImageUrl = `http://localhost:5001/uploads/${req.files['image'][0].filename}`;
    }

    let additionalImageUrls = [];
    if (req.files && req.files['additionalImages']) {
      additionalImageUrls = req.files['additionalImages'].map(file => `http://localhost:5001/uploads/${file.filename}`);
    }

    const count = await Item.countDocuments();
    const newItem = new Item({
      itemId: `ITM_${String(count).padStart(3, '0')}`,
      name,
      category,
      price: parsedPrice,
      stock: stock || 0,
      description,
      imageUrl: finalImageUrl,
      additionalImages: additionalImageUrls,
      status: stock < 10 ? 'Low Stock' : 'Available'
    });

    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ message: 'Server error while creating item' });
  }
});

module.exports = router;
