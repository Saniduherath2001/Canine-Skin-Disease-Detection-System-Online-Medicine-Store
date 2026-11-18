const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Order = require('../models/Order');
const Item = require('../models/Item');
const Setting = require('../models/Setting');
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

    const parsePrice = (val) => {
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      if (!val) return 0;
      const cleaned = String(val).replace(/[^0-9.-]+/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const cleanItems = [];
    for (const item of items) {
      const dbItem = await findItemByOrderItem(item);
      const requestedQty = Math.max(1, parseInt(item.quantity, 10) || 1);

      if (dbItem && typeof dbItem.stock === 'number' && requestedQty > dbItem.stock) {
        return res.status(400).json({
          message: dbItem.stock <= 0
            ? `"${dbItem.name}" is out of stock.`
            : `Insufficient stock for "${dbItem.name}". Only ${dbItem.stock} available.`
        });
      }

      const verifiedPrice = (dbItem && typeof dbItem.price === 'number' && dbItem.price > 0)
        ? dbItem.price
        : parsePrice(item.price);

      cleanItems.push({
        productId: dbItem ? String(dbItem._id) : (item.productId || (item._id ? String(item._id) : (item.id || ''))),
        name: dbItem ? dbItem.name : item.name,
        price: verifiedPrice,
        quantity: requestedQty
      });
    }

    const calculatedSubtotal = cleanItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const globalDeliveryFee = await Setting.getGlobalDeliveryFee();
    const parsedDeliveryFee = cleanItems.length > 0 ? globalDeliveryFee : 0;
    const parsedDiscount = Number(discount) || 0;
    const calculatedTotal = Math.max(0, calculatedSubtotal + parsedDeliveryFee - parsedDiscount);

    const count = await Order.countDocuments();
    const orderCode = `ORD_${String(count).padStart(3, '0')}`;

    const initialPaymentStatus = req.body.paymentStatus || 'Pending';
    const initialOrderStatus = 'Pending';

    const newOrder = new Order({
      orderCode,
      customerInfo,
      items: cleanItems,
      subtotal: calculatedSubtotal,
      deliveryFee: parsedDeliveryFee,
      discount: parsedDiscount,
      total: calculatedTotal,
      paymentMethod,
      paymentStatus: initialPaymentStatus,
      status: initialOrderStatus
    });

    const savedOrder = await newOrder.save();

    // Deduct stock for each item ordered according to ordered quantity
    for (const orderItem of cleanItems) {
      try {
        const dbItem = await findItemByOrderItem(orderItem);
        if (dbItem) {
          const qty = orderItem.quantity;
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

    let payhereData = null;

    if (paymentMethod === 'card' && initialPaymentStatus !== 'Paid') {
      // For Card payments awaiting external gateway: Generate PayHere hash
      const merchantId = process.env.PAYHERE_MERCHANT_ID || '1211149';
      const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || '4MTY4NTM4MzgxMzQyNDAzMTMxMzA=';
      const currency = 'LKR';
      const isSandbox = process.env.PAYHERE_SANDBOX !== 'false';
      const orderIdentifier = savedOrder.orderCode || savedOrder._id.toString();

      const amountFormatted = Number(calculatedTotal).toLocaleString('en-us', { minimumFractionDigits: 2 }).replaceAll(',', '');
      const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
      const hash = crypto.createHash('md5')
        .update(merchantId + orderIdentifier + amountFormatted + currency + hashedSecret)
        .digest('hex')
        .toUpperCase();

      payhereData = {
        merchantId,
        hash,
        amountFormatted,
        currency,
        sandbox: isSandbox,
        orderId: orderIdentifier
      };
    } else {
      // Send confirmation email immediately if paid or if COD/Bank Transfer
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
    }

    res.status(201).json({
      ...savedOrder.toObject(),
      payhereData
    });
  } catch (error) {
    console.error('Error placing order:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: messages });
    }
    res.status(500).json({ message: error.message || 'Server error while placing order' });
  }
});

// PUT /api/orders/:id/cancel - Allow customer to cancel their own order within 2 hours
router.put('/:id/cancel', async (req, res) => {
  try {
    const { email } = req.body || {};
    const existingOrder = await Order.findById(req.params.id);
    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (
      email &&
      existingOrder.customerInfo?.email &&
      existingOrder.customerInfo.email.toLowerCase() !== String(email).trim().toLowerCase()
    ) {
      return res.status(403).json({ message: 'You are not authorized to cancel this order.' });
    }

    if (existingOrder.status === 'Delivered') {
      return res.status(400).json({ message: 'Delivered orders cannot be cancelled.' });
    }
    if (existingOrder.status === 'Cancelled') {
      return res.status(400).json({ message: 'This order is already cancelled.' });
    }

    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    const createdTime = new Date(existingOrder.createdAt).getTime();
    if (isNaN(createdTime) || Date.now() - createdTime > TWO_HOURS_MS) {
      return res.status(400).json({
        message: 'Cancellation window expired. Orders can only be cancelled within 2 hours of placing the order.'
      });
    }

    existingOrder.status = 'Cancelled';
    const savedOrder = await existingOrder.save();

    // Restore stock for each item in the cancelled order
    for (const orderItem of savedOrder.items) {
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
          console.log(`📦 Restored ${qty} stock on customer cancel for ${dbItem.name}. New stock: ${dbItem.stock}`);
        }
      } catch (itemErr) {
        console.error('Failed to restore stock on customer cancel:', itemErr);
      }
    }

    res.json({ message: 'Order cancelled successfully.', order: savedOrder });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Server error while cancelling order' });
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
    if (previousStatus === 'Delivered') {
      return res.status(400).json({ message: 'This order is already Delivered and its status cannot be changed.' });
    }
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

// POST /api/orders/payhere-hash - Generate PayHere MD5 hash for client-side checkout
router.post('/payhere-hash', (req, res) => {
  try {
    const { orderId, amount } = req.body;
    if (!orderId || amount === undefined) {
      return res.status(400).json({ message: 'orderId and amount are required.' });
    }

    const merchantId = process.env.PAYHERE_MERCHANT_ID || '1211149';
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || '4MTY4NTM4MzgxMzQyNDAzMTMxMzA=';
    const currency = 'LKR';
    const isSandbox = process.env.PAYHERE_SANDBOX !== 'false';

    // Format amount to 2 decimal places e.g. "1500.00"
    const amountFormatted = Number(amount).toLocaleString('en-us', { minimumFractionDigits: 2 }).replaceAll(',', '');

    // Hash formula: UPPERCASE(MD5(merchant_id + order_id + amountFormatted + currency + UPPERCASE(MD5(merchant_secret))))
    const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
    const hash = crypto.createHash('md5')
      .update(merchantId + orderId + amountFormatted + currency + hashedSecret)
      .digest('hex')
      .toUpperCase();

    res.json({
      merchantId,
      hash,
      amountFormatted,
      currency,
      sandbox: isSandbox
    });
  } catch (err) {
    console.error('Error generating PayHere hash:', err);
    res.status(500).json({ message: 'Error generating payment hash' });
  }
});

// PUT /api/orders/:id/payment-complete - Complete payment from frontend onCompleted callback
router.put('/:id/payment-complete', async (req, res) => {
  try {
    const query = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { _id: req.params.id }
      : { orderCode: req.params.id };

    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.paymentStatus = 'Paid';
    order.status = 'Pending';
    await order.save();

    console.log(`💳 Payment successfully verified for Order ${order.orderCode || order._id}`);

    // Send order confirmation email now that payment has succeeded
    const customerName = `${order.customerInfo.firstName} ${order.customerInfo.lastName}`;
    sendOrderConfirmationEmail(order.customerInfo.email, customerName, order)
      .then(result => {
        if (!result.devMode) {
          console.log(`✅ Order confirmation email sent to ${order.customerInfo.email} after successful payment.`);
        }
      })
      .catch(err => console.error('Failed to send order confirmation email post-payment:', err));

    res.json({ message: 'Payment successfully marked as Paid', order });
  } catch (err) {
    console.error('Error updating payment completion:', err);
    res.status(500).json({ message: 'Server error marking payment complete' });
  }
});

// POST /api/orders/payhere-notify - PayHere Server-to-Server IPN notification webhook
router.post('/payhere-notify', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig
    } = req.body;

    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || '4MTY4NTM4MzgxMzQyNDAzMTMxMzA=';
    const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
    const localMd5 = crypto.createHash('md5')
      .update(merchant_id + order_id + payhere_amount + payhere_currency + status_code + hashedSecret)
      .digest('hex')
      .toUpperCase();

    if (localMd5 === md5sig) {
      if (status_code === '2') {
        // Status 2 = Success in PayHere
        const query = mongoose.Types.ObjectId.isValid(order_id)
          ? { _id: order_id }
          : { orderCode: order_id };

        const order = await Order.findOne(query);
        if (order) {
          order.paymentStatus = 'Paid';
          order.status = 'Pending';
          await order.save();
          console.log(`🔔 PayHere IPN: Order ${order_id} marked as Paid.`);
        }
      }
    } else {
      console.warn('⚠️ PayHere IPN Signature mismatch!');
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('PayHere IPN Error:', err);
    res.sendStatus(500);
  }
});

// POST /api/orders/create-stripe-session - Create Stripe Checkout Session
router.post('/create-stripe-session', async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required' });
    }

    const query = mongoose.Types.ObjectId.isValid(orderId) ? { _id: orderId } : { orderCode: orderId };
    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || stripeKey.includes('placeholder')) {
      return res.status(400).json({
        message: 'Stripe Secret Key is missing or invalid. Please set STRIPE_SECRET_KEY in backend/.env'
      });
    }

    const stripe = require('stripe')(stripeKey);

    // Build line items for Stripe Checkout
    const line_items = order.items.map(item => ({
      price_data: {
        currency: 'lkr',
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(Number(item.price) * 100),
      },
      quantity: item.quantity,
    }));

    // Add delivery fee if any
    if (order.deliveryFee && order.deliveryFee > 0) {
      line_items.push({
        price_data: {
          currency: 'lkr',
          product_data: {
            name: 'Delivery Fee',
          },
          unit_amount: Math.round(Number(order.deliveryFee) * 100),
        },
        quantity: 1,
      });
    }

    const clientOrigin = req.body.origin || req.headers.origin || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      customer_email: order.customerInfo?.email,
      client_reference_id: order._id.toString(),
      metadata: {
        orderId: order._id.toString(),
        orderCode: order.orderCode || '',
      },
      success_url: `${clientOrigin}/checkout?session_id={CHECKOUT_SESSION_ID}&order_id=${order._id}`,
      cancel_url: `${clientOrigin}/checkout?cancel=true&order_id=${order._id}`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Error creating Stripe session:', err);
    res.status(500).json({ message: err.message || 'Failed to create Stripe session' });
  }
});

// POST /api/orders/verify-stripe-session - Verify payment after Stripe redirect
router.post('/verify-stripe-session', async (req, res) => {
  try {
    const { sessionId, orderId } = req.body;
    if (!sessionId || !orderId) {
      return res.status(400).json({ message: 'sessionId and orderId are required' });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || stripeKey.includes('placeholder')) {
      return res.status(400).json({ message: 'STRIPE_SECRET_KEY is missing' });
    }

    const stripe = require('stripe')(stripeKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      const query = mongoose.Types.ObjectId.isValid(orderId) ? { _id: orderId } : { orderCode: orderId };
      const order = await Order.findOne(query);

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (order.paymentStatus !== 'Paid') {
        order.paymentStatus = 'Paid';
        order.status = 'Pending';
        await order.save();

        // Send confirmation email
        const customerName = `${order.customerInfo.firstName} ${order.customerInfo.lastName}`;
        sendOrderConfirmationEmail(order.customerInfo.email, customerName, order)
          .then(result => {
            if (!result.devMode) {
              console.log(`✅ Order confirmation email sent to ${order.customerInfo.email} via Stripe.`);
            }
          })
          .catch(err => console.error('Failed to send confirmation email post-Stripe:', err));
      }

      return res.json({ success: true, order });
    } else {
      return res.status(400).json({ success: false, message: 'Payment not completed on Stripe' });
    }
  } catch (err) {
    console.error('Error verifying Stripe session:', err);
    res.status(500).json({ message: err.message || 'Error verifying Stripe session' });
  }
});

module.exports = router;

