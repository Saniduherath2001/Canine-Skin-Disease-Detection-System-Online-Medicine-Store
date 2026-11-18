const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const Setting = require('../models/Setting');
const upload = require('../middleware/upload');

// GET /api/items - Get all items
router.get('/', async (req, res) => {
  try {
    const [items, globalDeliveryFee] = await Promise.all([
      Item.find().sort({ createdAt: 1 }),
      Setting.getGlobalDeliveryFee(),
    ]);
    // Ensure every item has an itemId (e.g. ITM_000, ITM_001) and the common global deliveryFee
    const formattedItems = items.map((item, index) => {
      const doc = item.toObject();
      if (!doc.itemId) {
        doc.itemId = `ITM_${String(index).padStart(3, '0')}`;
      }
      doc.deliveryFee = globalDeliveryFee;
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
    doc.deliveryFee = await Setting.getGlobalDeliveryFee();
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
    if (price !== undefined && price !== null && price !== '') {
      if (typeof price === 'number') {
        parsedPrice = price;
      } else if (typeof price === 'string') {
        const cleaned = price.replace(/[^0-9.-]+/g,"");
        parsedPrice = parseFloat(cleaned);
      }
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ message: 'Price must be greater than 0' });
    }

    const parsedStock = stock !== undefined && stock !== '' ? parseInt(stock, 10) : 0;
    if (isNaN(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ message: 'Stock quantity cannot be negative (minimum 0)' });
    }

    const globalDeliveryFee = await Setting.getGlobalDeliveryFee();

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
      deliveryFee: globalDeliveryFee,
      stock: parsedStock,
      description,
      imageUrl: finalImageUrl,
      additionalImages: additionalImageUrls,
      status: parsedStock === 0 ? 'Out of Stock' : (parsedStock < 10 ? 'Low Stock' : 'Available')
    });

    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ message: 'Server error while creating item' });
  }
});

// PUT /api/items/:id - Update an existing item (Admin only)
router.put('/:id', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'additionalImages', maxCount: 5 }
]), async (req, res) => {
  try {
    const { name, category, price, stock, description } = req.body;
    let query = req.params.id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: req.params.id }
      : { itemId: req.params.id };

    const item = await Item.findOne(query);
    if (!item) {
      return res.status(404).json({ message: 'Item not found in database' });
    }

    if (name) item.name = name;
    if (category) item.category = category;
    if (description !== undefined) item.description = description;
    if (stock !== undefined) {
      const parsedStock = parseInt(stock, 10);
      if (isNaN(parsedStock) || parsedStock < 0) {
        return res.status(400).json({ message: 'Stock quantity cannot be negative (minimum 0)' });
      }
      item.stock = parsedStock;
      item.status = item.stock === 0 ? 'Out of Stock' : (item.stock < 10 ? 'Low Stock' : 'Available');
    }
    if (price !== undefined) {
      const cleaned = typeof price === 'string' ? price.replace(/[^0-9.-]+/g, "") : price;
      const parsedPrice = parseFloat(cleaned);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({ message: 'Price must be greater than 0' });
      }
      item.price = parsedPrice;
    }
    item.deliveryFee = await Setting.getGlobalDeliveryFee();

    if (req.files && req.files['image'] && req.files['image'][0]) {
      item.imageUrl = `http://localhost:5001/uploads/${req.files['image'][0].filename}`;
    }

    if (req.files && req.files['additionalImages'] && req.files['additionalImages'].length > 0) {
      item.additionalImages = req.files['additionalImages'].map(file => `http://localhost:5001/uploads/${file.filename}`);
    }

    const updatedItem = await item.save();
    console.log(`✏️ Updated item: ${updatedItem.name} (${updatedItem._id})`);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ message: 'Server error while updating item' });
  }
});

// DELETE /api/items/:id - Delete an item permanently from database (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    let deletedItem;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      deletedItem = await Item.findByIdAndDelete(req.params.id);
    } else {
      deletedItem = await Item.findOneAndDelete({ itemId: req.params.id });
    }

    if (!deletedItem) {
      return res.status(404).json({ message: 'Item not found in database' });
    }

    console.log(`🗑️ Permanently deleted item from DB: ${deletedItem.name} (${deletedItem._id})`);
    res.json({ message: 'Item deleted successfully from database', id: deletedItem._id });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Server error while deleting item' });
  }
});

module.exports = router;
