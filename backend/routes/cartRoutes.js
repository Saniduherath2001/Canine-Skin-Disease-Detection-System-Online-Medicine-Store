const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Item = require('../models/Item');
const Setting = require('../models/Setting');

// Safe price parser to handle numeric, raw strings, and currency formatted strings
const parsePrice = (val) => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

// GET /api/cart?email=<userEmail> - Get user's cart from MongoDB
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email query param required' });
    }

    let cart = await Cart.findOne({ userEmail: email.toLowerCase() });
    if (!cart) {
      cart = await Cart.create({ userEmail: email.toLowerCase(), items: [] });
    }

    // Always synchronize cart prices & common delivery fee with authoritative DB values
    if (cart.items && cart.items.length > 0) {
      const globalDeliveryFee = await Setting.getGlobalDeliveryFee();
      let changed = false;
      for (const cartItem of cart.items) {
        let dbItem = null;
        if (cartItem.productId && mongoose.Types.ObjectId.isValid(cartItem.productId)) {
          dbItem = await Item.findById(cartItem.productId);
        }
        if (!dbItem && cartItem.name) {
          dbItem = await Item.findOne({ name: cartItem.name });
        }
        if (dbItem && typeof dbItem.price === 'number' && dbItem.price > 0) {
          if (cartItem.price !== dbItem.price) {
            cartItem.price = dbItem.price;
            changed = true;
          }
        }
        if (cartItem.deliveryFee !== globalDeliveryFee) {
          cartItem.deliveryFee = globalDeliveryFee;
          changed = true;
        }
      }
      if (changed) {
        await cart.save();
      }
    }

    res.json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Server error fetching cart' });
  }
});

// POST /api/cart - Add item to cart in MongoDB
router.post('/', async (req, res) => {
  try {
    const { userEmail, item } = req.body;
    if (!userEmail || !item || !item.name) {
      return res.status(400).json({ message: 'userEmail and item details are required' });
    }

    const email = userEmail.toLowerCase();
    let cart = await Cart.findOne({ userEmail: email });
    if (!cart) {
      cart = new Cart({ userEmail: email, items: [] });
    }

    // Check if item already in cart
    const existingIndex = cart.items.findIndex(
      (i) => (i.productId && item._id && i.productId === String(item._id)) || i.name === item.name
    );

    // Look up authoritative item from DB
    const lookupId = item._id || item.productId || item.id;
    let dbItem = null;
    if (lookupId && mongoose.Types.ObjectId.isValid(lookupId)) {
      dbItem = await Item.findById(lookupId);
    }
    if (!dbItem && item.name) {
      dbItem = await Item.findOne({ name: item.name });
    }

    let authoritativePrice = parsePrice(item.price);
    if (dbItem && typeof dbItem.price === 'number' && dbItem.price > 0) {
      authoritativePrice = dbItem.price;
    }

    const authoritativeDeliveryFee = await Setting.getGlobalDeliveryFee();

    const qtyToAdd = Math.max(1, parseInt(item.quantity, 10) || 1);
    const itemImg = item.image || item.imageUrl || (dbItem ? dbItem.imageUrl : '');
    const maxStock = dbItem && typeof dbItem.stock === 'number' ? dbItem.stock : null;

    if (maxStock !== null && maxStock <= 0) {
      return res.status(400).json({ message: `"${dbItem.name}" is currently out of stock.`, maxStock: 0 });
    }

    if (existingIndex > -1) {
      const currentQty = parseInt(cart.items[existingIndex].quantity, 10) || 1;
      const desiredQty = currentQty + qtyToAdd;
      if (maxStock !== null && desiredQty > maxStock) {
        return res.status(400).json({
          message: `Only ${maxStock} available in stock for "${dbItem.name}".`,
          maxStock,
        });
      }
      cart.items[existingIndex].quantity = desiredQty;
      cart.items[existingIndex].price = authoritativePrice;
      cart.items[existingIndex].deliveryFee = authoritativeDeliveryFee;
    } else {
      if (maxStock !== null && qtyToAdd > maxStock) {
        return res.status(400).json({
          message: `Only ${maxStock} available in stock for "${dbItem.name}".`,
          maxStock,
        });
      }
      cart.items.push({
        productId: dbItem ? String(dbItem._id) : (lookupId ? String(lookupId) : ''),
        name: dbItem ? dbItem.name : item.name,
        price: authoritativePrice,
        deliveryFee: authoritativeDeliveryFee,
        quantity: qtyToAdd,
        image: itemImg,
        description: item.description || ''
      });
    }

    cart.updatedAt = new Date();
    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Server error adding to cart' });
  }
});

// PUT /api/cart - Update full cart items array in MongoDB
router.put('/', async (req, res) => {
  try {
    const { userEmail, items } = req.body;
    if (!userEmail || !Array.isArray(items)) {
      return res.status(400).json({ message: 'userEmail and items array required' });
    }

    const email = userEmail.toLowerCase();
    let cart = await Cart.findOne({ userEmail: email });
    if (!cart) {
      cart = new Cart({ userEmail: email, items: [] });
    }

    const globalDeliveryFee = await Setting.getGlobalDeliveryFee();
    const updatedItems = [];
    for (const i of items) {
      const lookupId = i.productId || (i._id ? String(i._id) : (i.id || ''));
      let dbItem = null;
      if (lookupId && mongoose.Types.ObjectId.isValid(lookupId)) {
        dbItem = await Item.findById(lookupId);
      }
      if (!dbItem && i.name) {
        dbItem = await Item.findOne({ name: i.name });
      }

      let authoritativePrice = parsePrice(i.price);
      if (dbItem && typeof dbItem.price === 'number' && dbItem.price > 0) {
        authoritativePrice = dbItem.price;
      }

      const authoritativeDeliveryFee = globalDeliveryFee;
      const requestedQty = Math.max(1, parseInt(i.quantity, 10) || 1);
      const clampedQty = (dbItem && typeof dbItem.stock === 'number' && dbItem.stock > 0)
        ? Math.min(requestedQty, dbItem.stock)
        : requestedQty;

      updatedItems.push({
        productId: dbItem ? String(dbItem._id) : lookupId,
        name: dbItem ? dbItem.name : i.name,
        price: authoritativePrice,
        deliveryFee: authoritativeDeliveryFee,
        quantity: clampedQty,
        image: i.image || i.imageUrl || (dbItem ? dbItem.imageUrl : ''),
        description: i.description || ''
      });
    }

    cart.items = updatedItems;
    cart.updatedAt = new Date();
    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ message: 'Server error updating cart' });
  }
});

// DELETE /api/cart/item - Delete single item from cart in MongoDB
router.delete('/item', async (req, res) => {
  try {
    const { email, name, productId } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email query param required' });
    }

    const userEmail = email.toLowerCase();
    let cart = await Cart.findOne({ userEmail });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter((i) => {
      if (productId && i.productId) {
        return i.productId !== String(productId);
      }
      return i.name !== name;
    });

    cart.updatedAt = new Date();
    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error('Error deleting item from cart:', error);
    res.status(500).json({ message: 'Server error deleting item from cart' });
  }
});

// DELETE /api/cart - Clear whole cart for user in MongoDB
router.delete('/', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email query param required' });
    }

    const userEmail = email.toLowerCase();
    let cart = await Cart.findOne({ userEmail });
    if (cart) {
      cart.items = [];
      cart.updatedAt = new Date();
      await cart.save();
    }
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Server error clearing cart' });
  }
});

module.exports = router;
