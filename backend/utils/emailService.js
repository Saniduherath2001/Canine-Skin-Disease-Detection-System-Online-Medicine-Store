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
      <td style="padding:8px 12px; border-bottom:1px solid #f0f0f0; text-align:right;">Rs. ${(item.price * item.quantity).toLocaleString()}</td>
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
        <div>Subtotal: <strong>Rs. ${order.subtotal ? order.subtotal.toLocaleString() : '0'}</strong></div>
        <div>Delivery: <strong>Rs. ${order.deliveryFee ? order.deliveryFee.toLocaleString() : '0'}</strong></div>
        ${order.discount > 0 ? `<div>Discount: <strong>-Rs. ${order.discount.toLocaleString()}</strong></div>` : ''}
        <div style="font-size:16px; color:#1a1a1a; margin-top:8px;">Total: <strong style="color:#FA9132;">Rs. ${order.total ? order.total.toLocaleString() : '0'}</strong></div>
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

  const text = `Hi ${customerName}, your Doggocare order #${order.orderCode || order._id} has been confirmed! Total: Rs. ${order.total ? order.total.toLocaleString() : '0'}. We'll notify you when it's on the way.`;
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

// ─── Diagnosis Report Email ──────────────────────────────────────────────────
async function sendDiagnosisReportEmail(email, reportData) {
  const { petName, age, gender, disease, confidence, careGuidelines, diagnosisId } = reportData;
  const isHealthy = (disease || '').toLowerCase() === 'healthy';
  const confidencePercent = typeof confidence === 'number'
    ? (confidence > 1 ? confidence : confidence * 100).toFixed(1)
    : '90.0';

  const subject = isHealthy
    ? `🐾 Doggocare Report: ${petName || 'Buddy'}'s Skin Analysis – Healthy! ✅`
    : `🐾 Doggocare Report: ${petName || 'Buddy'}'s Skin Analysis – ${disease} Result 📋`;

  const guidelinesList = (careGuidelines && careGuidelines.length > 0)
    ? careGuidelines
    : [
        'Keep the infected/affected area clean and dry.',
        'Prevent your dog from scratching or biting the affected area.',
        'Use gentle, hypoallergenic or veterinarian-prescribed shampoos.',
        'Consult a certified veterinarian for clinical diagnosis and prescription medication.',
        'Wash and sanitize bedding, collars, and grooming brushes frequently.'
      ];

  const guidelinesHtml = guidelinesList
    .map((g, idx) => `
      <li style="margin-bottom: 10px; color: #374151; font-size: 14px; line-height: 1.6;">
        <strong style="color: #FA9132;">${idx + 1}.</strong> ${g}
      </li>
    `)
    .join('');

  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #f0f0f0; border-radius: 16px;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 28px; border-bottom: 2px solid #FFF3E6; padding-bottom: 20px;">
        <h1 style="color: #FA9132; margin: 0 0 4px; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">🐾 Doggocare</h1>
        <p style="color: #888; margin: 0; font-size: 13px; font-weight: 500;">Canine Skin Health Diagnostic Report</p>
      </div>

      <!-- Report Greeting & Date -->
      <div style="margin-bottom: 20px; font-size: 13px; color: #6b7280; display: flex; justify-content: space-between;">
        <span><strong>Report Date:</strong> ${formattedDate}</span>
        ${diagnosisId ? `<span style="color: #9ca3af; float: right;">Report ID: #${String(diagnosisId).slice(-6)}</span>` : ''}
      </div>

      <!-- Pet Profile Card -->
      <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; font-weight: bold;">
          Pet Information
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 4px 0; color: #6b7280; width: 33%;"><strong>Name:</strong> <span style="color: #111827;">${petName || 'Buddy'}</span></td>
            <td style="padding: 4px 0; color: #6b7280; width: 33%;"><strong>Age:</strong> <span style="color: #111827;">${age || 'Unknown'}</span></td>
            <td style="padding: 4px 0; color: #6b7280; width: 33%;"><strong>Gender:</strong> <span style="color: #111827;">${gender || 'Unknown'}</span></td>
          </tr>
        </table>
      </div>

      <!-- Result Card -->
      <div style="background: ${isHealthy ? '#ECFDF5' : '#FFF7ED'}; border: 2px solid ${isHealthy ? '#10B981' : '#FA9132'}; border-radius: 14px; padding: 22px 20px; margin-bottom: 26px;">
        <div style="margin-bottom: 8px;">
          <span style="float: right; background: ${isHealthy ? '#10B981' : '#FA9132'}; color: #fff; font-weight: bold; font-size: 12px; padding: 4px 10px; border-radius: 20px;">
            ${confidencePercent}% Confidence
          </span>
          <h2 style="margin: 0; font-size: 20px; color: ${isHealthy ? '#065F46' : '#9A3412'}; font-weight: 800;">
            ${isHealthy ? '✅ Healthy Canine Skin' : `⚠️ Detected Condition: ${disease}`}
          </h2>
        </div>
        <div style="clear: both;"></div>
        <p style="margin: 10px 0 0; color: ${isHealthy ? '#047857' : '#7C2D12'}; font-size: 14px; line-height: 1.5;">
          ${isHealthy
            ? `Good news! The uploaded image indicates that <strong>${petName || 'your dog'}</strong>'s skin appears healthy with no signs of active Ringworm, Dermatitis, or Demodicosis.`
            : `The image analysis and symptom evaluation indicate that <strong>${petName || 'your dog'}</strong> is likely affected by <strong>${disease}</strong>. We recommend consulting a veterinarian to confirm and begin treatment.`
          }
        </p>
      </div>

      <!-- Care Guidelines -->
      <div style="margin-bottom: 26px;">
        <h3 style="color: #111827; font-size: 16px; margin: 0 0 12px; font-weight: 700; border-left: 4px solid #FA9132; padding-left: 10px;">
          🩺 Recommended Care Guidelines
        </h3>
        <ul style="margin: 0; padding-left: 6px; list-style-type: none;">
          ${guidelinesHtml}
        </ul>
      </div>

      <!-- Action Box: Visit Store -->
      <div style="background: #FFF8F0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <p style="margin: 0 0 12px; color: #4b5563; font-size: 14px; font-weight: 500;">
          Need veterinarian-approved soothing shampoos, anti-parasitic sprays, or nutrition products?
        </p>
        <a href="http://localhost:5173/store"
           style="display: inline-block; background: #FA9132; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px;">
          🛍️ Browse Doggocare Store
        </a>
      </div>

      <!-- Disclaimer -->
      <div style="background: #F3F4F6; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px; font-size: 12px; color: #6b7280; line-height: 1.5;">
        <strong>⚠️ Medical Disclaimer:</strong> This report is generated by an automated AI computer-vision screening tool for educational and preliminary screening purposes. It does not replace a clinical examination, skin scrape, or prescription diagnosis by a licensed veterinarian.
      </div>

      <!-- Footer -->
      <div style="text-align: center; border-top: 1px solid #E5E7EB; padding-top: 18px; font-size: 12px; color: #9ca3af;">
        <p style="margin: 0 0 4px;">🐾 Doggocare – Caring for your furry family</p>
        <p style="margin: 0;">Need assistance? Contact us at support@doggocare.com</p>
      </div>
    </div>
  `;

  const text = `Doggocare Skin Diagnosis Report for ${petName} (${age}, ${gender}):
Result: ${disease} (${confidencePercent}% confidence)
Date: ${formattedDate}

Care Guidelines:
${guidelinesList.map((g, i) => `${i + 1}. ${g}`).join('\n')}

Visit our store: http://localhost:5173/store

Disclaimer: This report is for informational purposes and does not replace a veterinary consultation.`;

  return sendMail({ to: email, subject, text, html });
}

module.exports = {
  sendVerificationEmail,
  sendOrderConfirmationEmail,
  sendDeliveryEmail,
  sendDiagnosisReportEmail
};
