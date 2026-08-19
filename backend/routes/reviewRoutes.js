const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Review = require('../models/Review');
const Order = require('../models/Order');

const JWT_SECRET = process.env.JWT_SECRET || 'doggo_care_secret_key';

// POST /api/reviews — Submit a review using a token from the delivery email OR direct customer feedback
router.post('/', async (req, res) => {
  try {
    const { token, reviews, customerName, productName, productId, rating, comment } = req.body;

    // Handle token-based review submission from delivery email
    if (token) {
      if (!reviews || reviews.length === 0) {
        return res.status(400).json({ message: 'Reviews list is required when using a token.' });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return res.status(401).json({ message: 'Review link has expired or is invalid.' });
      }

      const { orderId } = decoded;
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found.' });
      }

      const existing = await Review.findOne({ orderId });
      if (existing) {
        return res.status(409).json({ message: 'You have already submitted a review for this order.' });
      }

      const orderCustomerName = `${order.customerInfo.firstName} ${order.customerInfo.lastName}`;

      const saved = await Review.insertMany(
        reviews.map(r => ({
          orderId,
          productId:   r.productId || 'general',
          productName: r.productName || 'General Item',
          customerName: orderCustomerName,
          rating:  r.rating || 5,
          comment: r.comment || '',
        }))
      );

      return res.status(201).json({ message: 'Reviews submitted successfully!', saved });
    }

    // Direct Feedback / Review Submission without token
    if (!customerName || !rating) {
      return res.status(400).json({ message: 'Customer name and rating are required.' });
    }

    const newReview = await Review.create({
      productId: productId || 'general',
      productName: productName || 'General Feedback',
      customerName,
      rating: Number(rating) || 5,
      comment: comment || '',
    });

    return res.status(201).json({ message: 'Feedback submitted successfully!', review: newReview });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/reviews — Fetch reviews (all or by productId / itemId / name)
router.get('/', async (req, res) => {
  try {
    const { productId, itemId, name } = req.query;
    let filter = {};
    const matchCriteria = [];

    const addSearchTerm = (term) => {
      if (!term || typeof term !== 'string' || !term.trim()) return;
      const cleanTerm = term.trim();
      const escaped = cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      matchCriteria.push({ productId: cleanTerm });
      matchCriteria.push({ productName: new RegExp(escaped, 'i') });
    };

    if (Array.isArray(productId)) {
      productId.forEach(addSearchTerm);
    } else if (productId) {
      addSearchTerm(productId);
    }

    if (Array.isArray(itemId)) {
      itemId.forEach(addSearchTerm);
    } else if (itemId) {
      addSearchTerm(itemId);
    }

    if (Array.isArray(name)) {
      name.forEach(addSearchTerm);
    } else if (name) {
      addSearchTerm(name);
    }

    if (matchCriteria.length > 0) {
      filter = { $or: matchCriteria };
    }

    const reviews = await Review.find(filter).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/reviews/:id — Delete a review by ID
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Review.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Review not found.' });
    }
    res.json({ message: 'Review deleted successfully.' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Server error deleting review' });
  }
});


// GET /api/reviews/order-info?token=<jwt> — Decode token and return order items (used by review page)
router.get('/order-info', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'Token required.' });

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Review link has expired or is invalid.' });
    }

    const order = await Order.findById(decoded.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    // Check if already reviewed
    const existing = await Review.findOne({ orderId: decoded.orderId });
    if (existing) {
      return res.status(409).json({ message: 'You have already submitted a review for this order.' });
    }

    res.json({
      orderId: order._id,
      customerName: `${order.customerInfo.firstName} ${order.customerInfo.lastName}`,
      items: order.items,
    });
  } catch (error) {
    console.error('Error fetching order info for review:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
