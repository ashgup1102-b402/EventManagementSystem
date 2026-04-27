const { Booking, BookingItem, Property, Event, PropertySlot, User, Discount, sequelize } = require('../models');
const { calculateDiscount } = require('../services/discountEngine');
const { checkAndReserve, releaseSeats } = require('../services/capacityManager');
const { sendBookingConfirmation } = require('../services/mailer');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

const generateRef = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return 'BK' + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// GET /api/bookings
const getAll = async (req, res, next) => {
  try {
    const { property_id, user_id, status, booking_type, date_from, date_to, page = 1, limit = 20 } = req.query;
    const where = {};

    if (req.user.role === 'end_user') {
      where.user_id = req.user.id;
    } else if (req.user.role === 'property') {
      const prop = await Property.findOne({ where: { property_user_id: req.user.id } });
      if (prop) where.property_id = prop.id;
    } else {
      if (property_id) where.property_id = property_id;
      if (user_id) where.user_id = user_id;
    }

    if (status) where.booking_status = status;
    if (booking_type) where.booking_type = booking_type;
    if (date_from && date_to) where.booking_date = { [Op.between]: [date_from, date_to] };

    const offset = (page - 1) * limit;
    const { rows, count } = await Booking.findAndCountAll({
      where, limit: parseInt(limit), offset: parseInt(offset),
      include: [
        { model: User, as: 'user', attributes: ['id','username','first_name','last_name','email','phone'] },
        { model: Property, as: 'property', attributes: ['id','name','city','phone','email'] },
        { model: Event, as: 'event', attributes: ['id','name','type','event_date'], required: false },
        { model: PropertySlot, as: 'slot', attributes: ['id','slot_name','slot_date','start_time'], required: false },
        { model: BookingItem, as: 'items' }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: rows, meta: { total: count, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
};

// GET /api/bookings/:id
const getOne = async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['id','username','first_name','last_name','email','phone'] },
        { model: Property, as: 'property' },
        { model: Event, as: 'event', required: false },
        { model: PropertySlot, as: 'slot', required: false },
        { model: BookingItem, as: 'items' },
        { model: Discount, as: 'discount', required: false }
      ]
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    // Access check
    if (req.user.role === 'end_user' && booking.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
};

// POST /api/bookings
const create = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { property_id, booking_type, event_id, slot_id, booking_date, num_guests, items = [], special_requests, promo_code } = req.body;

    if (!property_id || !booking_type || !booking_date || !num_guests) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Missing required booking fields.' });
    }

    const property = await Property.findByPk(property_id, { transaction: t });
    if (!property || !property.is_active) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Property not found or inactive.' });
    }

    // Capacity check & reserve (atomic within transaction)
    const resourceId = booking_type === 'event_ticket' ? event_id : slot_id;
    if (resourceId) {
      await checkAndReserve(booking_type, resourceId, parseInt(num_guests), t);
    }

    // Calculate subtotal
    let subtotal = 0;
    const bookingItems = [];

    if (booking_type === 'event_ticket' && event_id) {
      const event = await Event.findByPk(event_id, { transaction: t });
      if (event) {
        const lineTotal = parseFloat(event.ticket_price) * parseInt(num_guests);
        subtotal += lineTotal;
        bookingItems.push({ item_type: 'event_ticket', item_id: event.id, item_name: event.name, quantity: parseInt(num_guests), unit_price: event.ticket_price, total_price: lineTotal });
      }
    } else if (booking_type === 'table_reservation' && slot_id) {
      const slot = await PropertySlot.findByPk(slot_id, { transaction: t });
      if (slot && slot.price_per_head > 0) {
        const lineTotal = parseFloat(slot.price_per_head) * parseInt(num_guests);
        subtotal += lineTotal;
        bookingItems.push({ item_type: 'slot', item_id: slot.id, item_name: slot.slot_name, quantity: parseInt(num_guests), unit_price: slot.price_per_head, total_price: lineTotal });
      }
    }

    // Additional items (menu/combo add-ons)
    for (const item of items) {
      const lineTotal = parseFloat(item.unit_price) * parseInt(item.quantity);
      subtotal += lineTotal;
      bookingItems.push({ ...item, total_price: lineTotal });
    }

    // Calculate commission
    const commissionPercent = parseFloat(property.portal_commission_percent) || 10;
    const commissionAmount = (subtotal * commissionPercent) / 100;

    // Apply discount
    const { discount_amount, discount_id } = await calculateDiscount(property_id, {
      subtotal, booking_type, event_id, slot_id, items: bookingItems, promo_code
    });

    const totalAmount = Math.max(0, subtotal - discount_amount);

    // Create booking
    const booking_ref = generateRef();
    const booking = await Booking.create({
      booking_ref, user_id: req.user.id, property_id, booking_type,
      event_id: event_id || null, slot_id: slot_id || null,
      booking_date, num_guests, subtotal_amount: subtotal,
      discount_amount, total_amount: totalAmount,
      commission_amount: commissionAmount,
      discount_id: discount_id || null, promo_code: promo_code || null,
      payment_status: 'pending', booking_status: 'confirmed',
      special_requests: special_requests || null
    }, { transaction: t });

    // Create booking items
    if (bookingItems.length > 0) {
      await BookingItem.bulkCreate(bookingItems.map(i => ({ ...i, booking_id: booking.id })), { transaction: t });
    }

    // Update discount usage
    if (discount_id) {
      await Discount.increment('used_count', { where: { id: discount_id }, transaction: t });
    }

    await t.commit();

    // Send confirmation email (async, non-blocking)
    const user = await User.findByPk(req.user.id);
    const event = event_id ? await Event.findByPk(event_id) : null;
    sendBookingConfirmation(user, booking, property, event).catch(console.error);

    res.status(201).json({ success: true, message: 'Booking confirmed!', data: booking });
  } catch (err) {
    await t.rollback();
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// PATCH /api/bookings/:id/cancel
const cancel = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const booking = await Booking.findByPk(req.params.id, { transaction: t });
    if (!booking) { await t.rollback(); return res.status(404).json({ success: false, message: 'Booking not found.' }); }

    if (req.user.role === 'end_user' && booking.user_id !== req.user.id) {
      await t.rollback(); return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (booking.booking_status === 'cancelled') {
      await t.rollback(); return res.status(400).json({ success: false, message: 'Booking is already cancelled.' });
    }

    // Release capacity
    const resourceId = booking.booking_type === 'event_ticket' ? booking.event_id : booking.slot_id;
    await releaseSeats(booking.booking_type, resourceId, booking.num_guests, t);

    await booking.update({
      booking_status: 'cancelled',
      cancellation_reason: req.body.reason || null,
      cancelled_at: new Date()
    }, { transaction: t });

    await t.commit();
    res.json({ success: true, message: 'Booking cancelled.', data: booking });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

module.exports = { getAll, getOne, create, cancel };
