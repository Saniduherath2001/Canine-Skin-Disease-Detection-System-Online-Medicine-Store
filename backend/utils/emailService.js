const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');

let transporter = null;

function getTransporter() {
  if (!emailConfig.isConfigured()) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: emailConfig.SMTP_HOST,
      port: emailConfig.SMTP_PORT,
      secure: emailConfig.SMTP_PORT === 465,
      auth: {
        user: emailConfig.SMTP_USER,
        pass: emailConfig.SMTP_PASS,
      },
    });
  }

  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  const mailTransporter = getTransporter();
  if (!mailTransporter) {
    console.log(`[DEV EMAIL] To: ${to} | Subject: ${subject}`);
    return { sent: false, devMode: true };
  }
  await mailTransporter.sendMail({ from: emailConfig.EMAIL_FROM, to, subject, text, html });
  return { sent: true, devMode: false };
}

// ─── Verification Email ───────────────────────────────────────────────────────
async function sendVerificationEmail(email, code, username) {
  const subject = 'Pet Zone - Email Verification Code';
  const text = `Hello ${username},\n\nYour Pet Zone verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #FF6B00;">Pet Zone Email Verification</h2>
      <p>Hello <strong>${username}</strong>,</p>
      <p>Use the code below to confirm your account:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #FF6B00; padding: 16px 0;">
        ${code}
      </div>
      <p style="color: #666;">This code expires in 10 minutes.</p>
      <p style="color: #999; font-size: 12px;">If you did not request this, please ignore this email.</p>
    </div>
  `;
  return sendMail({ to: email, subject, text, html });
}

// ─── Order Confirmation Email ─────────────────────────────────────────────────
async function sendOrderConfirmationEmail(email, customerName, order) {
  const subject = '🐾 Doggocare – Order Confirmed!';

  const itemRows = order.items.map(item => `
    <tr>
      <td style="padding:8px 12px; border-bottom:1px solid #f0f0f0;">${item.name}</td>
      <td style="padding:8px 12px; border-bottom:1px solid #f0f0f0; text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px; border-bottom:1px solid #f0f0f0; text-align:right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background:#fff;">
      <div style="text-align:center; margin-bottom:28px;">
        <h1 style="color:#FA9132; margin:0; font-size:26px;">🐾 Doggocare</h1>
        <p style="color:#888; margin:4px 0 0; font-size:13px;">Your trusted pet care store</p>
      </div>

      <h2 style="color:#1a1a1a; font-size:20px; margin-bottom:4px;">Order Confirmed ✅</h2>
      <p style="color:#555; font-size:14px; margin-bottom:24px;">
        Hi <strong>${customerName}</strong>, thank you for your order! We've received it and will start processing it soon.
      </p>

      <div style="background:#FFF7F0; border-radius:12px; padding:16px 20px; margin-bottom:24px;">
        <p style="margin:0 0 4px; font-size:12px; color:#999; text-transform:uppercase; letter-spacing:1px;">Order ID</p>
        <p style="margin:0; font-size:14px; font-weight:bold; color:#FA9132;">#${order.orderCode || order._id}</p>
      </div>

      <table style="width:100%; border-collapse:collapse; font-size:14px; margin-bottom:20px;">
        <thead>
          <tr style="background:#FFF7F0;">
            <th style="padding:10px 12px; text-align:left; color:#FA9132; font-weight:600;">Item</th>
            <th style="padding:10px 12px; text-align:center; color:#FA9132; font-weight:600;">Qty</th>
            <th style="padding:10px 12px; text-align:right; color:#FA9132; font-weight:600;">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div style="text-align:right; font-size:14px; color:#555; margin-bottom:24px;">
        <div>Subtotal: <strong>$${order.subtotal.toFixed(2)}</strong></div>
        <div>Delivery: <strong>$${order.deliveryFee.toFixed(2)}</strong></div>
        ${order.discount > 0 ? `<div>Discount: <strong>-$${order.discount.toFixed(2)}</strong></div>` : ''}
        <div style="font-size:16px; color:#1a1a1a; margin-top:8px;">Total: <strong style="color:#FA9132;">$${order.total.toFixed(2)}</strong></div>
      </div>

      <div style="background:#f9f9f9; border-radius:12px; padding:16px 20px; font-size:13px; color:#555;">
        <strong>Delivery Address:</strong><br/>
        ${order.customerInfo.address}, ${order.customerInfo.city}, ${order.customerInfo.province} ${order.customerInfo.postalCode}
      </div>

      <p style="margin-top:28px; font-size:13px; color:#aaa; text-align:center;">
        Questions? Contact us — we're happy to help! 🐶
      </p>
    </div>
  `;

  const text = `Hi ${customerName}, your Doggocare order #${order.orderCode || order._id} has been confirmed! Total: $${order.total.toFixed(2)}. We'll notify you when it's on the way.`;
  return sendMail({ to: email, subject, text, html });
}

// ─── Delivery + Review Link Email ─────────────────────────────────────────────
async function sendDeliveryEmail(email, customerName, order, reviewToken) {
  const subject = '🎉 Your Doggocare order has been delivered!';
  const reviewUrl = `http://localhost:5173/review?token=${reviewToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background:#fff;">
      <div style="text-align:center; margin-bottom:28px;">
        <h1 style="color:#FA9132; margin:0; font-size:26px;">🐾 Doggocare</h1>
        <p style="color:#888; margin:4px 0 0; font-size:13px;">Your trusted pet care store</p>
      </div>

      <h2 style="color:#1a1a1a; font-size:20px; margin-bottom:4px;">Your Order Has Been Delivered! 🎉</h2>
      <p style="color:#555; font-size:14px; margin-bottom:24px;">
        Hi <strong>${customerName}</strong>, your order <strong>#${order.orderCode || order._id}</strong> has been successfully delivered. We hope your furry friend loves it! 🐕
      </p>

      <div style="background:#FFF7F0; border-radius:16px; padding:24px; text-align:center; margin-bottom:28px;">
        <p style="margin:0 0 8px; color:#555; font-size:14px;">How was your experience? We'd love to hear from you!</p>
        <a href="${reviewUrl}"
           style="display:inline-block; background:#FA9132; color:#fff; text-decoration:none; font-weight:bold; font-size:15px; padding:14px 32px; border-radius:12px; margin-top:8px;">
          ⭐ Leave a Review
        </a>
        <p style="margin:12px 0 0; color:#aaa; font-size:11px;">This link is valid for 7 days.</p>
      </div>

      <p style="font-size:13px; color:#888; text-align:center;">
        Thank you for shopping with Doggocare. Your feedback helps us improve! 🐾
      </p>
    </div>
  `;

  const text = `Hi ${customerName}, your Doggocare order #${order.orderCode || order._id} has been delivered! Leave a review here: ${reviewUrl}`;
  return sendMail({ to: email, subject, text, html });
}

module.exports = { sendVerificationEmail, sendOrderConfirmationEmail, sendDeliveryEmail };
