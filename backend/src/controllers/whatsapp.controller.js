const whatsappService = require('../services/whatsapp');
const { sendPromotionEmail } = require('../services/mailer');
const { Booking, User, Entity, WhatsappLog } = require('../models');
const { Op } = require('sequelize');

// POST /api/whatsapp/init-session  (property/admin)
const initSession = async (req, res, next) => {
  try {
    const { session_id } = req.body;
    if (!session_id) return res.status(400).json({ success: false, message: 'session_id required.' });
    
    // Start session asynchronously
    whatsappService.getSession(session_id).catch(console.error);

    res.json({ success: true, message: 'Session initialization started. Poll /api/whatsapp/qr for QR code.' });
  } catch (err) { next(err); }
};

// GET /api/whatsapp/qr/:session_id
const getQR = async (req, res, next) => {
  try {
    const { session_id } = req.params;
    const qr = whatsappService.getQRCode(session_id);
    const status = whatsappService.getSessionStatus(session_id);
    res.json({ success: true, data: { qr, status } });
  } catch (err) { next(err); }
};

// POST /api/whatsapp/send-promotion
const sendPromotion = async (req, res, next) => {
  try {
    const { property_id, message, recipient_type, event_id, send_email, email_subject } = req.body;

    // Get entity
    const entity = await Entity.findByPk(property_id);
    if (!entity) return res.status(404).json({ success: false, message: 'Entity not found.' });

    // Check access
    if (req.user.role === 'property' && entity.entity_user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Get guest list
    let bookingWhere = { property_id, booking_status: 'confirmed' };
    if (event_id) bookingWhere.event_id = event_id;
    if (recipient_type === 'this_month') {
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      bookingWhere.booking_date = { [Op.gte]: monthStart };
    }

    const bookings = await Booking.findAll({
      where: bookingWhere,
      include: [{ model: User, as: 'user', attributes: ['phone','email','first_name'] }]
    });

    const phoneNumbers = [...new Set(bookings.map(b => b.user?.phone).filter(Boolean))];
    const emailAddresses = [...new Set(bookings.map(b => b.user?.email).filter(Boolean))];

    const results = { whatsapp: null, email: null };

    // Send WhatsApp
    if (phoneNumbers.length > 0) {
      results.whatsapp = await whatsappService.sendBulkPromotion(property_id, message, phoneNumbers, req.user.id);
    }

    // Send Email if requested
    if (send_email && emailAddresses.length > 0) {
      await sendPromotionEmail({
        recipients: emailAddresses,
        subject: email_subject || `Special offer from ${entity.name}`,
        message,
        propertyName: entity.name
      });
      results.email = { sent: emailAddresses.length };
    }

    res.json({
      success: true,
      message: 'Promotion dispatch started.',
      data: {
        whatsapp_recipients: phoneNumbers.length,
        email_recipients: emailAddresses.length,
        results
      }
    });
  } catch (err) { next(err); }
};

// GET /api/whatsapp/logs
const getLogs = async (req, res, next) => {
  try {
    const { property_id } = req.query;
    const where = {};
    if (req.user.role === 'property') {
      const ent = await Entity.findOne({ where: { entity_user_id: req.user.id } });
      if (ent) where.property_id = ent.id;
    } else if (property_id) {
      where.property_id = property_id;
    }
    const logs = await WhatsappLog.findAll({ where, order: [['created_at', 'DESC']], limit: 50 });
    res.json({ success: true, data: logs });
  } catch (err) { next(err); }
};

module.exports = { initSession, getQR, sendPromotion, getLogs };
