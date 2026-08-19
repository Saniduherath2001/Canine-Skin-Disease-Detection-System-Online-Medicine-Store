const express = require('express');
const authRoutes = require('./authRoutes');
const detectRoutes = require('./detectRoutes');
const adminRoutes = require('./adminRoutes');

const router = express.Router();

router.use(authRoutes);
router.use('/detect', detectRoutes);
router.use('/admin', adminRoutes);

const itemRoutes = require('./itemRoutes');
router.use('/items', itemRoutes);

const orderRoutes = require('./orderRoutes');
router.use('/orders', orderRoutes);

const reviewRoutes = require('./reviewRoutes');
router.use('/reviews', reviewRoutes);

const messageRoutes = require('./messageRoutes');
router.use('/messages', messageRoutes);

const cartRoutes = require('./cartRoutes');
router.use('/cart', cartRoutes);

module.exports = router;
