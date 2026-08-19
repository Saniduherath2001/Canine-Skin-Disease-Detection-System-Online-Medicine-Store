const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');

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

    const qtyToAdd = Number(item.quantity) || 1;
    const itemPrice = Number(item.price) || 0;
    const itemImg = item.image || item.imageUrl || '';

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += qtyToAdd;
    } else {
      cart.items.push({
        productId: item._id ? String(item._id) : (item.productId || ''),
        name: item.name,
        price: itemPrice,
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

    cart.items = items.map((i) => ({
      productId: i.productId || (i._id ? String(i._id) : ''),
      name: i.name,
      price: Number(i.price) || 0,
      quantity: Number(i.quantity) || 1,
      image: i.image || i.imageUrl || '',
      description: i.description || ''
    }));

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
