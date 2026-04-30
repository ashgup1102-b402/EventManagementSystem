const nodemailer = require('nodemailer');
const { SystemConfig } = require('../models');

let transporter = null;

const getTransporter = async () => {
  // Always reload config from DB for live updates
  const config = await SystemConfig.findByPk(1);
  const smtpConfig = config ? {
    host: config.smtp_host || process.env.SMTP_HOST,
    port: config.smtp_port || parseInt(process.env.SMTP_PORT) || 587,
    secure: config.smtp_secure || process.env.SMTP_SECURE === 'true',
    auth: {
      user: config.smtp_user || process.env.SMTP_USER,
      pass: config.smtp_pass || process.env.SMTP_PASS
    }
  } : {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  };

  return nodemailer.createTransport(smtpConfig);
};

const getFromAddress = async () => {
  const config = await SystemConfig.findByPk(1);
  return {
    name: config?.from_name || process.env.FROM_NAME || 'Event Portal',
    email: config?.from_email || process.env.FROM_EMAIL || 'noreply@eventportal.com'
  };
};

const sendMail = async ({ to, subject, html, text }) => {
  try {
    const transport = await getTransporter();
    const from = await getFromAddress();
    const info = await transport.sendMail({
      from: `"${from.name}" <${from.email}>`,
      to, subject, html, text
    });
    console.log('📧 Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('📧 Email error:', err.message);
    return { success: false, error: err.message };
  }
};

// ─── Email Templates ───────────────────────────────────────────

const sendBookingConfirmation = async (user, booking, property, event) => {
  const subject = `Booking Confirmed — ${booking.booking_ref}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px;">
      <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:30px;border-radius:12px;text-align:center;margin-bottom:20px;">
        <h1 style="color:white;margin:0;">Booking Confirmed! 🎉</h1>
      </div>
      <div style="background:white;padding:25px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
        <p style="color:#333;font-size:16px;">Hi <strong>${user.first_name || user.username || 'Guest'}</strong>,</p>
        <p>Your booking has been confirmed. Here are your details:</p>
        <table style="width:100%;border-collapse:collapse;margin:15px 0;">
          <tr style="background:#f0f4ff;"><td style="padding:10px;font-weight:bold;width:40%;">Booking Ref</td><td style="padding:10px;color:#667eea;font-weight:bold;">${booking.booking_ref}</td></tr>
          <tr><td style="padding:10px;font-weight:bold;">Property</td><td style="padding:10px;">${property.name}</td></tr>
          ${event ? `<tr style="background:#f0f4ff;"><td style="padding:10px;font-weight:bold;">Event</td><td style="padding:10px;">${event.name}</td></tr>` : ''}
          <tr ${event ? '' : 'style="background:#f0f4ff;"'}><td style="padding:10px;font-weight:bold;">Date</td><td style="padding:10px;">${booking.booking_date}</td></tr>
          <tr style="background:#f0f4ff;"><td style="padding:10px;font-weight:bold;">Guests</td><td style="padding:10px;">${booking.num_guests}</td></tr>
          <tr><td style="padding:10px;font-weight:bold;">Total Amount</td><td style="padding:10px;color:#22c55e;font-weight:bold;">₹${booking.total_amount}</td></tr>
          <tr style="background:#f0f4ff;"><td style="padding:10px;font-weight:bold;">Status</td><td style="padding:10px;"><span style="background:#d1fae5;color:#065f46;padding:3px 10px;border-radius:20px;">${booking.booking_status.toUpperCase()}</span></td></tr>
        </table>
        <p style="color:#666;font-size:14px;">Please show this email or your booking reference at the venue.</p>
      </div>
      <p style="text-align:center;color:#999;font-size:12px;margin-top:20px;">© ${new Date().getFullYear()} Event Portal</p>
    </div>
  `;
  return sendMail({ to: user.email, subject, html });
};

const sendPromotionEmail = async ({ recipients, subject, message, propertyName }) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px;">
      <div style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:30px;border-radius:12px;text-align:center;margin-bottom:20px;">
        <h1 style="color:white;margin:0;">🎊 Special Offer!</h1>
        <p style="color:rgba(255,255,255,0.9);">from ${propertyName}</p>
      </div>
      <div style="background:white;padding:25px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
        <div style="color:#333;font-size:16px;line-height:1.6;">${message.replace(/\n/g, '<br>')}</div>
      </div>
      <p style="text-align:center;color:#999;font-size:12px;margin-top:20px;">© ${new Date().getFullYear()} Event Portal</p>
    </div>
  `;
  const results = await Promise.allSettled(
    recipients.map(email => sendMail({ to: email, subject, html }))
  );
  return results;
};

module.exports = { sendMail, sendBookingConfirmation, sendPromotionEmail };
