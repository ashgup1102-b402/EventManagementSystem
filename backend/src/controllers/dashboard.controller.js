const { Booking, Property, Event, User, AuditLog, Discount, sequelize } = require('../models');
const { fn, col, literal, Op } = require('sequelize');
const moment = require('moment');

// GET /api/dashboard/property  (property role)
const propertyDashboard = async (req, res, next) => {
  try {
    const prop = await Property.findOne({ where: { property_user_id: req.user.id } });
    if (!prop) return res.status(404).json({ success: false, message: 'No property assigned.' });

    const propertyId = prop.id;
    const today = moment().format('YYYY-MM-DD');
    const monthStart = moment().startOf('month').format('YYYY-MM-DD');

    const [totalBookings, thisMonthBookings, totalRevenue, thisMonthRevenue, recentBookings, guestList, upcomingEvents] = await Promise.all([
      Booking.count({ where: { property_id: propertyId, booking_status: { [Op.ne]: 'cancelled' } } }),
      Booking.count({ where: { property_id: propertyId, booking_status: { [Op.ne]: 'cancelled' }, booking_date: { [Op.gte]: monthStart } } }),
      Booking.sum('total_amount', { where: { property_id: propertyId, booking_status: { [Op.ne]: 'cancelled' } } }),
      Booking.sum('total_amount', { where: { property_id: propertyId, booking_status: { [Op.ne]: 'cancelled' }, booking_date: { [Op.gte]: monthStart } } }),
      Booking.findAll({
        where: { property_id: propertyId },
        include: [
          { model: User, as: 'user', attributes: ['id','username','first_name','last_name','phone','email'] },
          { model: Event, as: 'event', attributes: ['id','name','type'], required: false }
        ],
        order: [['created_at', 'DESC']], limit: 10
      }),
      Booking.findAll({
        where: { property_id: propertyId, booking_status: 'confirmed', booking_date: { [Op.gte]: today } },
        include: [{ model: User, as: 'user', attributes: ['id','username','first_name','last_name','phone','email'] }],
        order: [['booking_date', 'ASC']], limit: 50
      }),
      Event.findAll({
        where: { property_id: propertyId, is_active: true, event_date: { [Op.gte]: today } },
        order: [['event_date', 'ASC']], limit: 5
      })
    ]);

    // Revenue by month (last 6 months)
    const revenueByMonth = await Booking.findAll({
      where: {
        property_id: propertyId,
        booking_status: { [Op.ne]: 'cancelled' },
        booking_date: { [Op.gte]: moment().subtract(5, 'months').startOf('month').format('YYYY-MM-DD') }
      },
      attributes: [
        [fn('DATE_TRUNC', 'month', col('booking_date')), 'month'],
        [fn('SUM', col('total_amount')), 'revenue'],
        [fn('COUNT', col('id')), 'bookings']
      ],
      group: [literal("DATE_TRUNC('month', booking_date)")],
      order: [[literal("DATE_TRUNC('month', booking_date)"), 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      data: {
        property: prop,
        stats: {
          total_bookings: totalBookings,
          this_month_bookings: thisMonthBookings,
          total_revenue: parseFloat(totalRevenue || 0).toFixed(2),
          this_month_revenue: parseFloat(thisMonthRevenue || 0).toFixed(2),
          commission_percent: prop.portal_commission_percent,
          commission_this_month: ((parseFloat(thisMonthRevenue || 0) * parseFloat(prop.portal_commission_percent)) / 100).toFixed(2)
        },
        recent_bookings: recentBookings,
        guest_list: guestList,
        upcoming_events: upcomingEvents,
        revenue_chart: revenueByMonth
      }
    });
  } catch (err) { next(err); }
};

// GET /api/dashboard/admin
const adminDashboard = async (req, res, next) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    const monthStart = moment().startOf('month').format('YYYY-MM-DD');

    const [totalProperties, totalUsers, totalBookings, totalRevenue, monthRevenue, recentBookings, topProperties] = await Promise.all([
      Property.count({ where: { is_active: true } }),
      User.count({ where: { is_active: true, role: 'end_user' } }),
      Booking.count({ where: { booking_status: { [Op.ne]: 'cancelled' } } }),
      Booking.sum('total_amount', { where: { booking_status: { [Op.ne]: 'cancelled' } } }),
      Booking.sum('total_amount', { where: { booking_status: { [Op.ne]: 'cancelled' }, booking_date: { [Op.gte]: monthStart } } }),
      Booking.findAll({
        include: [
          { model: User, as: 'user', attributes: ['id','username','first_name','last_name'] },
          { model: Property, as: 'property', attributes: ['id','name','city'] }
        ],
        order: [['created_at', 'DESC']], limit: 10
      }),
      Booking.findAll({
        where: { booking_status: { [Op.ne]: 'cancelled' } },
        attributes: ['property_id', [fn('COUNT', col('Booking.id')), 'bookings'], [fn('SUM', col('total_amount')), 'revenue']],
        include: [{ model: Property, as: 'property', attributes: ['id','name','city'] }],
        group: ['property_id', 'property.id'],
        order: [[literal('revenue'), 'DESC']],
        limit: 5,
        raw: false
      })
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          total_properties: totalProperties,
          total_users: totalUsers,
          total_bookings: totalBookings,
          total_revenue: parseFloat(totalRevenue || 0).toFixed(2),
          month_revenue: parseFloat(monthRevenue || 0).toFixed(2)
        },
        recent_bookings: recentBookings,
        top_properties: topProperties
      }
    });
  } catch (err) { next(err); }
};

// GET /api/dashboard/superadmin
const superAdminDashboard = async (req, res, next) => {
  try {
    const auditLogs = await AuditLog.findAll({
      include: [{ model: User, as: 'user', attributes: ['id','username','role'] }],
      order: [['created_at', 'DESC']], limit: 20
    });
    // Reuse admin dashboard data
    req.user.role = 'admin'; // temporary
    // Call admin dashboard and append audit logs
    const monthStart = moment().startOf('month').format('YYYY-MM-DD');
    const [totalProperties, totalUsers, totalBookings, totalRevenue, totalCommission] = await Promise.all([
      Property.count(),
      User.count(),
      Booking.count({ where: { booking_status: { [Op.ne]: 'cancelled' } } }),
      Booking.sum('total_amount', { where: { booking_status: { [Op.ne]: 'cancelled' } } }),
      Booking.sum('commission_amount', { where: { booking_status: { [Op.ne]: 'cancelled' } } })
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          total_properties: totalProperties,
          total_users: totalUsers,
          total_bookings: totalBookings,
          total_revenue: parseFloat(totalRevenue || 0).toFixed(2),
          total_commission: parseFloat(totalCommission || 0).toFixed(2)
        },
        audit_logs: auditLogs
      }
    });
  } catch (err) { next(err); }
};

// GET /api/dashboard/user
const userDashboard = async (req, res, next) => {
  try {
    const [myBookings, upcomingBookings] = await Promise.all([
      Booking.findAll({
        where: { user_id: req.user.id },
        include: [
          { model: Property, as: 'property', attributes: ['id','name','city','cover_image'] },
          { model: Event, as: 'event', attributes: ['id','name','type','event_date'], required: false }
        ],
        order: [['created_at', 'DESC']], limit: 10
      }),
      Booking.findAll({
        where: { user_id: req.user.id, booking_status: 'confirmed', booking_date: { [Op.gte]: moment().format('YYYY-MM-DD') } },
        include: [{ model: Property, as: 'property', attributes: ['id','name','city'] }],
        order: [['booking_date', 'ASC']]
      })
    ]);

    res.json({
      success: true,
      data: {
        stats: { total_bookings: myBookings.length, upcoming: upcomingBookings.length },
        recent_bookings: myBookings,
        upcoming_bookings: upcomingBookings
      }
    });
  } catch (err) { next(err); }
};

module.exports = { propertyDashboard, adminDashboard, superAdminDashboard, userDashboard };
