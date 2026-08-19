const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const Item = require('../models/Item');
const { sendOrderConfirmationEmail, sendDeliveryEmail } = require('../utils/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'doggo_care_secret_key';

// Helper function to locate item in DB by ID, itemId code, or name
const findItemByOrderItem = async (orderItem) => {
  if (!orderItem) return null;
  if (orderItem.productId) {
    if (mongoose.Types.ObjectId.isValid(orderItem.productId)) {
      const dbItem = await Item.findById(orderItem.productId);
      if (dbItem) return dbItem;
    }
    const dbItemByCode = await Item.findOne({ itemId: orderItem.productId });
    if (dbItemByCode) return dbItemByCode;
  }
  if (orderItem.name) {
    const dbItemByName = await Item.findOne({ name: orderItem.name });
    if (dbItemByName) return dbItemByName;
  }
  return null;
};

// GET /api/orders - Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: 1 });
    const formattedOrders = orders.map((order, index) => {
      const doc = order.toObject();
      if (!doc.orderCode) {
        doc.orderCode = `ORD_${String(index).padStart(3, '0')}`;
      }
      return doc;
    });
    // Return in reverse chronological order for UI display
    res.json(formattedOrders.reverse());
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/orders - Place a new order
router.post('/', async (req, res) => {
  try {
    const { customerInfo, items, subtotal, deliveryFee, discount, total, paymentMethod } = req.body;

    if (!customerInfo || !items || items.length === 0) {
      return res.status(400).json({ message: 'Missing customer info or cart items' });
    }

    const count = await Order.countDocuments();
    const orderCode = `ORD_${String(count).padStart(3, '0')}`;

    const newOrder = new Order({
      orderCode,
      customerInfo,
      items,
      subtotal,
      deliveryFee,
      discount,
      total,
      paymentMethod
    });

    const savedOrder = await newOrder.save();

    // Deduct stock for each item ordered according to ordered quantity
    for (const orderItem of items) {
      try {
        const dbItem = await findItemByOrderItem(orderItem);
        if (dbItem) {
          const qty = Number(orderItem.quantity) || 1;
          dbItem.stock = Math.max(0, dbItem.stock - qty);
          if (dbItem.stock === 0) {
            dbItem.status = 'Out of Stock';
          } else if (dbItem.stock < 10) {
            dbItem.status = 'Low Stock';
          } else {
            dbItem.status = 'Available';
          }
          await dbItem.save();
          console.log(`📉 Deducted ${qty} stock for ${dbItem.name}. Remaining stock: ${dbItem.stock}`);
        }
      } catch (itemErr) {
        console.error(`Failed to update stock for item:`, itemErr);
      }
    }

    // Send order confirmation email (non-blocking)
    const customerName = `${customerInfo.firstName} ${customerInfo.lastName}`;
    sendOrderConfirmationEmail(customerInfo.email, customerName, savedOrder)
      .then(result => {
        if (result.devMode) {
          console.log(`[DEV] Order confirmation email skipped for ${customerInfo.email}`);
        } else {
          console.log(`✅ Order confirmation email sent to ${customerInfo.email}`);
        }
      })
      .catch(err => console.error('Failed to send order confirmation email:', err));

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Server error while placing order' });
  }
});

// PUT /api/orders/:id - Update order status
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const existingOrder = await Order.findById(req.params.id);
    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const previousStatus = existingOrder.status;
    existingOrder.status = status;
    const order = await existingOrder.save();

    // If order was cancelled (and wasn't already cancelled) -> RESTORE STOCK
    if (status === 'Cancelled' && previousStatus !== 'Cancelled') {
      for (const orderItem of order.items) {
        try {
          const dbItem = await findItemByOrderItem(orderItem);
          if (dbItem) {
            const qty = Number(orderItem.quantity) || 1;
            dbItem.stock = dbItem.stock + qty;
            if (dbItem.stock >= 10) {
              dbItem.status = 'Available';
            } else if (dbItem.stock > 0) {
              dbItem.status = 'Low Stock';
            }
            await dbItem.save();
            console.log(`📦 Restored ${qty} stock for item ${dbItem.name}. New stock: ${dbItem.stock}`);
          }
        } catch (itemErr) {
          console.error(`Failed to restore stock for item:`, itemErr);
        }
      }
    }

    // If order status changes FROM Cancelled to active status -> REDUCT STOCK
    if (previousStatus === 'Cancelled' && status !== 'Cancelled') {
      for (const orderItem of order.items) {
        try {
          const dbItem = await findItemByOrderItem(orderItem);
          if (dbItem) {
            const qty = Number(orderItem.quantity) || 1;
            dbItem.stock = Math.max(0, dbItem.stock - qty);
            if (dbItem.stock === 0) {
              dbItem.status = 'Out of Stock';
            } else if (dbItem.stock < 10) {
              dbItem.status = 'Low Stock';
            } else {
              dbItem.status = 'Available';
            }
            await dbItem.save();
            console.log(`📉 Re-deducted ${qty} stock for ${dbItem.name}. Remaining: ${dbItem.stock}`);
          }
        } catch (itemErr) {
          console.error(`Failed to re-deduct stock for item:`, itemErr);
        }
      }
    }

    // When order is marked as Delivered → send delivery + review link email
    if (status === 'Delivered') {
      try {
        const reviewToken = jwt.sign(
          { orderId: order._id.toString() },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        const customerName = `${order.customerInfo.firstName} ${order.customerInfo.lastName}`;
        sendDeliveryEmail(order.customerInfo.email, customerName, order, reviewToken)
          .then(result => {
            if (result.devMode) {
              console.log(`[DEV] Delivery email skipped for ${order.customerInfo.email}`);
            } else {
              console.log(`✅ Delivery + review email sent to ${order.customerInfo.email}`);
            }
          })
          .catch(err => console.error('Failed to send delivery email:', err));
      } catch (emailErr) {
        console.error('Error generating review token:', emailErr);
      }
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/orders/:id - Delete an order
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // If order was active (not cancelled), restore stock before deleting
    if (order.status !== 'Cancelled') {
      for (const orderItem of order.items) {
        try {
          const dbItem = await findItemByOrderItem(orderItem);
          if (dbItem) {
            const qty = Number(orderItem.quantity) || 1;
            dbItem.stock = dbItem.stock + qty;
            if (dbItem.stock >= 10) {
              dbItem.status = 'Available';
            } else if (dbItem.stock > 0) {
              dbItem.status = 'Low Stock';
            }
            await dbItem.save();
            console.log(`📦 Restored ${qty} stock on order delete for ${dbItem.name}. New stock: ${dbItem.stock}`);
          }
        } catch (err) {
          console.error('Failed to restore stock on order delete:', err);
        }
      }
    }

    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

