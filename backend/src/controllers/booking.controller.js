const { Booking, BookingItem, Entity, Event, EntitySlot, User, Discount, sequelize } = require('../models');
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
    const { entity_id, user_id, status, booking_type, date_from, date_to, page = 1, limit = 20 } = req.query;
    const where = {};

    if (req.user.role === 'End_User') {
      where.user_id = req.user.id;
    } else if (req.user.role === 'Entity') {
      const entity = await Entity.findOne({ where: { entity_user_id: req.user.id } });
      if (entity) where.property_id = entity.id;
    } else {
      if (entity_id) where.property_id = entity_id;
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
        { model: Entity, as: 'entity', attributes: ['id','name','city','mobile_1','email'] },
        { model: Event, as: 'event', attributes: ['id','name','type','event_date'], required: false },
        { model: EntitySlot, as: 'slot', attributes: ['id','slot_name','slot_date','start_time'], required: false },
        { model: BookingItem, as: 'items' }
      ],
      order: [['createdAt', 'DESC']]
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
        { model: Entity, as: 'entity' },
        { model: Event, as: 'event', required: false },
        { model: EntitySlot, as: 'slot', required: false },
        { model: BookingItem, as: 'items' },
        { model: Discount, as: 'discount', required: false }
      ]
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    if (req.user.role === 'End_User' && booking.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
};

// POST /api/bookings
const create = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { entity_id, booking_type, event_id, slot_id, booking_date, num_guests, items = [], special_requests, promo_code, guest_name, guest_email, guest_phone } = req.body;

    if (!entity_id || !booking_type || !booking_date || !num_guests) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Missing required booking fields.' });
    }

    if (!req.user && (!guest_name || !guest_email || !guest_phone)) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Guest details required for unauthenticated bookings.' });
    }

    const entity = await Entity.findByPk(entity_id, { transaction: t });
    if (!entity || entity.status !== 'Active') {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Entity not found or inactive.' });
    }

    const resourceId = booking_type === 'event_ticket' ? event_id : slot_id;
    if (resourceId) {
      await checkAndReserve(booking_type, resourceId, parseInt(num_guests), t);
    }

    let subtotal = 0;
    const bookingItems = [];

    if (booking_type === 'event_ticket' && event_id) {
      const event = await Event.findByPk(event_id, { transaction: t });
      if (!event || event.status !== 'Active') {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'This event is no longer active for booking.' });
      }
      const lineTotal = parseFloat(event.ticket_price) * parseInt(num_guests);
      subtotal += lineTotal;
      bookingItems.push({ item_type: 'event_ticket', item_id: event.id, item_name: event.name, quantity: parseInt(num_guests), unit_price: event.ticket_price, total_price: lineTotal });
    } else if (booking_type === 'table_reservation' && slot_id) {
      const slot = await EntitySlot.findByPk(slot_id, { transaction: t });
      if (!slot || !slot.is_active) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'This slot is no longer active for booking.' });
      }
      if (slot && slot.price_per_head > 0) {
        const lineTotal = parseFloat(slot.price_per_head) * parseInt(num_guests);
        subtotal += lineTotal;
        bookingItems.push({ item_type: 'slot', item_id: slot.id, item_name: slot.slot_name, quantity: parseInt(num_guests), unit_price: slot.price_per_head, total_price: lineTotal });
      }
    }

    const { MenuItem, ComboDeal } = require('../models');
    for (const item of items) {
      // Check if item is active (Menu Item or Combo)
      if (item.item_type === 'menu_item') {
        const mItem = await MenuItem.findByPk(item.item_id, { transaction: t });
        if (!mItem || mItem.status !== 'Active') {
          await t.rollback();
          return res.status(400).json({ success: false, message: `Menu item "${item.item_name}" is no longer active.` });
        }
      } else if (item.item_type === 'combo_deal') {
        const combo = await ComboDeal.findByPk(item.item_id, { transaction: t });
        if (!combo || !combo.is_active) {
          await t.rollback();
          return res.status(400).json({ success: false, message: `Combo deal "${item.item_name}" is no longer active.` });
        }
      }

      const lineTotal = parseFloat(item.unit_price) * parseInt(item.quantity);
      subtotal += lineTotal;
      bookingItems.push({ ...item, total_price: lineTotal });
    }

    const commissionPercent = 10; // Default
    const commissionAmount = (subtotal * commissionPercent) / 100;

    const { discount_amount, discount_id } = await calculateDiscount(entity_id, {
      subtotal, booking_type, event_id, slot_id, items: bookingItems, promo_code
    });

    const totalAmount = Math.max(0, subtotal - discount_amount);

    const booking_ref = generateRef();
    const booking = await Booking.create({
      booking_ref, user_id: req.user ? req.user.id : null,
      guest_name: req.user ? null : guest_name,
      guest_email: req.user ? null : guest_email,
      guest_phone: req.user ? null : guest_phone,
      property_id: entity_id, booking_type,
      event_id: event_id || null, slot_id: slot_id || null,
      booking_date, num_guests, subtotal_amount: subtotal,
      discount_amount, total_amount: totalAmount,
      commission_amount: commissionAmount,
      discount_id: discount_id || null, promo_code: promo_code || null,
      payment_status: 'pending', booking_status: 'open',
      special_requests: special_requests || null
    }, { transaction: t });

    if (bookingItems.length > 0) {
      await BookingItem.bulkCreate(bookingItems.map(i => ({ ...i, booking_id: booking.id })), { transaction: t });
    }

    if (discount_id) {
      await Discount.increment('used_count', { where: { id: discount_id }, transaction: t });
    }

    await t.commit();

    const userOrGuest = req.user 
      ? await User.findByPk(req.user.id) 
      : { email: guest_email, first_name: guest_name };
      
    const event = event_id ? await Event.findByPk(event_id) : null;
    sendBookingConfirmation(userOrGuest, booking, entity, event).catch(console.error);

    res.status(201).json({ success: true, message: 'Booking created!', data: booking });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

// PATCH /api/bookings/:id/status
const changeStatus = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { status, reason, comment } = req.body;
    if (!status || !reason || !comment) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Status, reason, and comment are mandatory.' });
    }

    const booking = await Booking.findByPk(req.params.id, { transaction: t });
    if (!booking) { await t.rollback(); return res.status(404).json({ success: false, message: 'Booking not found.' }); }

    // Role check: Only Admin or Super Admin
    if (!['Admin', 'Super Admin'].includes(req.user.role)) {
      await t.rollback();
      return res.status(403).json({ success: false, message: 'Only Admins can change booking status.' });
    }

    const oldStatus = booking.booking_status;
    
    // If status changes to cancelled, release seats
    if (status === 'cancelled' && oldStatus !== 'cancelled') {
      const resourceId = booking.booking_type === 'event_ticket' ? booking.event_id : booking.slot_id;
      await releaseSeats(booking.booking_type, resourceId, booking.num_guests, t);
    }

    await booking.update({
      booking_status: status,
      status_change_reason: reason,
      status_change_comment: comment,
      cancelled_at: status === 'cancelled' ? new Date() : booking.cancelled_at
    }, { transaction: t });

    await t.commit();
    res.json({ success: true, message: `Booking status changed to ${status}.`, data: booking });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

const cancel = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const booking = await Booking.findByPk(req.params.id, { transaction: t });
    if (!booking) { await t.rollback(); return res.status(404).json({ success: false, message: 'Booking not found.' }); }

    if (req.user.role === 'End_User' && booking.user_id !== req.user.id) {
      await t.rollback(); return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    
    if (booking.booking_status === 'cancelled') {
      await t.rollback(); return res.status(400).json({ success: false, message: 'Booking is already cancelled.' });
    }

    const resourceId = booking.booking_type === 'event_ticket' ? booking.event_id : booking.slot_id;
    await releaseSeats(booking.booking_type, resourceId, booking.num_guests, t);

    await booking.update({
      booking_status: 'cancelled',
      cancellation_reason: req.body.reason || 'User cancelled',
      cancelled_at: new Date()
    }, { transaction: t });

    await t.commit();
    res.json({ success: true, message: 'Booking cancelled.', data: booking });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

const getGuestList = async (req, res, next) => {
  try {
    const entity = await Entity.findOne({ where: { entity_user_id: req.user.id } });
    if (!entity) return res.status(404).json({ success: false, message: 'Entity not found.' });

    // Grouping by user_id OR guest_email for unauthenticated bookings
    // Using a raw query for complex aggregation or manual grouping
    const bookings = await Booking.findAll({
      where: { property_id: entity.id },
      include: [
        { model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'username'] },
        { model: Event, as: 'event', attributes: ['name'] },
        { model: EntitySlot, as: 'slot', attributes: ['slot_name'] }
      ],
      order: [['booking_date', 'DESC']]
    });

    // Manual aggregation to handle both registered users and guest bookings
    const guestsMap = {};

    bookings.forEach(b => {
      const key = b.user_id ? `u_${b.user_id}` : `g_${b.guest_email}`;
      if (!guestsMap[key]) {
        guestsMap[key] = {
          id: key,
          name: b.user ? `${b.user.first_name} ${b.user.last_name}`.trim() || b.user.username : b.guest_name,
          email: b.user ? b.user.email : b.guest_email,
          phone: b.user ? b.user.phone : b.guest_phone,
          is_registered: !!b.user_id,
          total_bookings: 0,
          total_spend: 0,
          last_booking_date: b.booking_date,
          last_booking_type: b.booking_type,
          last_booking_ref: b.booking_ref,
          last_booking_target: b.event?.name || b.slot?.slot_name || 'General'
        };
      }
      guestsMap[key].total_bookings += 1;
      guestsMap[key].total_spend += parseFloat(b.total_amount || 0);
    });

    const guestList = Object.values(guestsMap).sort((a, b) => b.total_spend - a.total_spend);

    res.json({ success: true, data: guestList });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, changeStatus, cancel, getGuestList };
