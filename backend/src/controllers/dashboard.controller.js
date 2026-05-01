const { Booking, Entity, Event, User, AuditLog, Discount, MenuItem, EntitySlot, WhatsappLog, ComboDeal, sequelize } = require('../models');
const { fn, col, literal, Op } = require('sequelize');
const moment = require('moment');

// GET /api/dashboard/property  (property role)
const propertyDashboard = async (req, res, next) => {
  try {
    const ent = await Entity.findOne({ where: { entity_user_id: req.user.id } });
    if (!ent) return res.status(404).json({ success: false, message: 'No entity assigned.' });

    const entityId = ent.id;
    const today = moment().format('YYYY-MM-DD');
    const monthStart = moment().startOf('month').format('YYYY-MM-DD');

    const [
      bookingStatuses,
      financialsTotal,
      financialsMonth,
      menuStats,
      eventStats,
      slotStats,
      discountStats,
      comboStats,
      promoStats,
      recentBookings,
      guestList,
      upcomingEvents
    ] = await Promise.all([
      // Row 1: Booking Status
      Booking.findAll({
        where: { property_id: entityId },
        attributes: ['booking_status', [fn('COUNT', col('id')), 'count']],
        group: ['booking_status'],
        raw: true
      }),
      // Row 2: Financial/Usage (Totals)
      Booking.findOne({
        where: { property_id: entityId, booking_status: { [Op.ne]: 'cancelled' } },
        attributes: [
          [fn('SUM', col('num_guests')), 'total_guests'],
          [fn('SUM', col('total_amount')), 'total_revenue'],
          [fn('SUM', col('commission_amount')), 'total_commission']
        ],
        raw: true
      }),
      // Row 2: Financial/Usage (Monthly)
      Booking.findOne({
        where: { 
          property_id: entityId, 
          booking_status: { [Op.ne]: 'cancelled' },
          booking_date: { [Op.gte]: monthStart }
        },
        attributes: [
          [fn('SUM', col('total_amount')), 'monthly_revenue'],
          [fn('SUM', col('commission_amount')), 'monthly_commission']
        ],
        raw: true
      }),
      // Row 3: Module Health
      MenuItem.findAll({ where: { property_id: entityId }, attributes: ['is_available', [fn('COUNT', col('id')), 'count']], group: ['is_available'], raw: true }),
      Event.findAll({ where: { property_id: entityId }, attributes: ['is_active', [fn('COUNT', col('id')), 'count']], group: ['is_active'], raw: true }),
      EntitySlot.findAll({ where: { property_id: entityId }, attributes: ['is_active', [fn('COUNT', col('id')), 'count']], group: ['is_active'], raw: true }),
      Discount.findAll({ where: { property_id: entityId }, attributes: ['is_active', [fn('COUNT', col('id')), 'count']], group: ['is_active'], raw: true }),
      ComboDeal.findAll({ where: { property_id: entityId }, attributes: ['is_active', [fn('COUNT', col('id')), 'count']], group: ['is_active'], raw: true }),
      WhatsappLog.findAll({ where: { property_id: entityId }, attributes: ['status', [fn('COUNT', col('id')), 'count']], group: ['status'], raw: true }),
      
      // Detailed Lists
      Booking.findAll({
        where: { property_id: entityId },
        include: [
          { model: User, as: 'user', attributes: ['id','username','first_name','last_name','phone','email'] },
          { model: Event, as: 'event', attributes: ['id','name','type'], required: false }
        ],
        order: [['createdAt', 'DESC']], limit: 10
      }),
      Booking.findAll({
        where: { property_id: entityId, booking_status: 'confirmed', booking_date: { [Op.gte]: today } },
        include: [{ model: User, as: 'user', attributes: ['id','username','first_name','last_name','phone','email'] }],
        order: [['booking_date', 'ASC']], limit: 50
      }),
      Event.findAll({
        where: { property_id: entityId, is_active: true, event_date: { [Op.gte]: today } },
        order: [['event_date', 'ASC']], limit: 5
      })
    ]);

    // Format stats for frontend
    const bookingCounts = { open: 0, completed: 0, on_hold: 0, cancelled: 0 };
    bookingStatuses.forEach(s => {
      if (['open', 'confirmed'].includes(s.booking_status)) bookingCounts.open += parseInt(s.count);
      else if (s.booking_status === 'completed') bookingCounts.completed += parseInt(s.count);
      else if (s.booking_status === 'on_hold') bookingCounts.on_hold += parseInt(s.count);
      else if (s.booking_status === 'cancelled') bookingCounts.cancelled += parseInt(s.count);
    });

    const formatModule = (rows, key) => {
      let active = 0, inactive = 0;
      rows.forEach(r => {
        if (r[key] === true || r[key] === 'sent' || r[key] === 'delivered') active += parseInt(r.count);
        else inactive += parseInt(r.count);
      });
      return { active, inactive };
    };

    // Revenue by month (last 6 months)
    const revenueByMonth = await Booking.findAll({
      where: {
        property_id: entityId,
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
        entity: ent,
        row1: bookingCounts,
        row2: {
          total_guests: parseInt(financialsTotal.total_guests || 0),
          total_revenue: parseFloat(financialsTotal.total_revenue || 0).toFixed(2),
          monthly_revenue: parseFloat(financialsMonth.monthly_revenue || 0).toFixed(2),
          platform_commission: parseFloat(financialsTotal.total_commission || 0).toFixed(2),
          monthly_commission: parseFloat(financialsMonth.monthly_commission || 0).toFixed(2)
        },
        row3: {
          menu: formatModule(menuStats, 'is_available'),
          events: formatModule(eventStats, 'is_active'),
          slots: formatModule(slotStats, 'is_active'),
          discounts: formatModule([...discountStats, ...comboStats], 'is_active'),
          promotions: formatModule(promoStats, 'status')
        },
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
    const { from_date, to_date } = req.query;
    const where = {};
    if (from_date && to_date) {
      where.createdAt = { [Op.between]: [new Date(from_date), new Date(to_date)] };
    }

    const [
      totalEntities, activeEntities, inactiveEntities,
      totalUsers, activeUsers, inactiveUsers,
      totalBookings, totalAmount, openBookings, cancelledBookings, onHoldBookings, completedBookings,
      entityList, bookingList
    ] = await Promise.all([
      Entity.count({ where }),
      Entity.count({ where: { ...where, status: 'Active' } }),
      Entity.count({ where: { ...where, status: 'Inactive' } }),
      User.count({ where }),
      User.count({ where: { ...where, status: 'Active' } }),
      User.count({ where: { ...where, status: 'Inactive' } }),
      Booking.count({ where }),
      Booking.sum('total_amount', { where }),
      Booking.count({ where: { ...where, booking_status: 'open' } }),
      Booking.count({ where: { ...where, booking_status: 'cancelled' } }),
      Booking.count({ where: { ...where, booking_status: 'on_hold' } }),
      Booking.count({ where: { ...where, booking_status: 'completed' } }),
      Entity.findAll({
        where,
        order: [
          [literal("CASE WHEN status = 'Active' THEN 0 ELSE 1 END"), 'ASC'],
          ['createdAt', 'DESC']
        ],
        limit: 10
      }),
      Booking.findAll({
        where,
        include: [
          { model: Entity, as: 'entity', attributes: ['id', 'name'] },
          { model: User, as: 'user', attributes: ['id', 'username'] }
        ],
        order: [
          [literal("CASE WHEN booking_status = 'open' THEN 0 WHEN booking_status = 'on_hold' THEN 1 WHEN booking_status = 'cancelled' THEN 2 WHEN booking_status = 'completed' THEN 3 ELSE 4 END"), 'ASC'],
          ['booking_date', 'ASC']
        ],
        limit: 10
      })
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          entities: { total: totalEntities, active: activeEntities, inactive: inactiveEntities },
          users: { total: totalUsers, active: activeUsers, inactive: inactiveUsers },
          bookings: { 
            total: totalBookings, 
            amount: parseFloat(totalAmount || 0).toFixed(2),
            open: openBookings,
            cancelled: cancelledBookings,
            on_hold: onHoldBookings,
            completed: completedBookings
          }
        },
        entity_panel: entityList,
        booking_panel: bookingList
      }
    });
  } catch (err) { next(err); }
};

// GET /api/dashboard/superadmin
const superAdminDashboard = async (req, res, next) => {
  try {
    const { from_date, to_date } = req.query;
    const where = {};
    if (from_date && to_date) {
      where.createdAt = { [Op.between]: [new Date(from_date), new Date(to_date)] };
    }

    const [
      totalEntities, activeEntities, inactiveEntities,
      totalUsers, activeUsers, inactiveUsers,
      totalBookings, totalAmount, openBookings, cancelledBookings, onHoldBookings, completedBookings,
      entityList, bookingList
    ] = await Promise.all([
      Entity.count({ where }),
      Entity.count({ where: { ...where, status: 'Active' } }),
      Entity.count({ where: { ...where, status: 'Inactive' } }),
      User.count({ where }),
      User.count({ where: { ...where, status: 'Active' } }),
      User.count({ where: { ...where, status: 'Inactive' } }),
      Booking.count({ where }),
      Booking.sum('total_amount', { where }),
      Booking.count({ where: { ...where, booking_status: 'open' } }),
      Booking.count({ where: { ...where, booking_status: 'cancelled' } }),
      Booking.count({ where: { ...where, booking_status: 'on_hold' } }),
      Booking.count({ where: { ...where, booking_status: 'completed' } }),
      Entity.findAll({
        where,
        order: [
          [literal("CASE WHEN status = 'Active' THEN 0 ELSE 1 END"), 'ASC'],
          ['createdAt', 'DESC']
        ],
        limit: 10
      }),
      Booking.findAll({
        where,
        include: [
          { model: Entity, as: 'entity', attributes: ['id', 'name'] },
          { model: User, as: 'user', attributes: ['id', 'username'] }
        ],
        order: [
          [literal("CASE WHEN booking_status = 'open' THEN 0 WHEN booking_status = 'on_hold' THEN 1 WHEN booking_status = 'cancelled' THEN 2 WHEN booking_status = 'completed' THEN 3 ELSE 4 END"), 'ASC'],
          ['booking_date', 'ASC']
        ],
        limit: 10
      })
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          entities: { total: totalEntities, active: activeEntities, inactive: inactiveEntities },
          users: { total: totalUsers, active: activeUsers, inactive: inactiveUsers },
          bookings: { 
            total: totalBookings, 
            amount: parseFloat(totalAmount || 0).toFixed(2),
            open: openBookings,
            cancelled: cancelledBookings,
            on_hold: onHoldBookings,
            completed: completedBookings
          }
        },
        entity_panel: entityList,
        booking_panel: bookingList
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
          { model: Entity, as: 'entity', attributes: ['id','name','city','cover_image'] },
          { model: Event, as: 'event', attributes: ['id','name','type','event_date'], required: false }
        ],
        order: [['createdAt', 'DESC']], limit: 10
      }),
      Booking.findAll({
        where: { user_id: req.user.id, booking_status: 'confirmed', booking_date: { [Op.gte]: moment().format('YYYY-MM-DD') } },
        include: [{ model: Entity, as: 'entity', attributes: ['id','name','city'] }],
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

// POST /api/dashboard/audit/purge
const purgeAuditLogs = async (req, res, next) => {
  try {
    const { from_date, to_date, dry_run } = req.body;
    if (!from_date || !to_date) return res.status(400).json({ success: false, message: 'Please provide from_date and to_date.' });

    const where = {
      createdAt: {
        [Op.between]: [moment(from_date).startOf('day').toDate(), moment(to_date).endOf('day').toDate()]
      }
    };

    const count = await AuditLog.count({ where });

    if (dry_run) {
      return res.json({ success: true, data: { count } });
    }

    if (count > 0) {
      const XLSX = require('xlsx');
      const fs = require('fs');
      const path = require('path');

      const logs = await AuditLog.findAll({ where, include: [{ model: User, as: 'user', attributes: ['username', 'role'] }] });
      
      const data = logs.map(l => ({
        ID: l.id,
        Date: moment(l.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        User: l.user?.username || 'System',
        Role: l.user?.role || 'N/A',
        Action: l.action,
        Entity: l.entity_type,
        EntityID: l.entity_id,
        OldValues: JSON.stringify(l.old_values),
        NewValues: JSON.stringify(l.new_values),
        IP: l.ip_address,
        UserAgent: l.user_agent
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'AuditLogs');

      const purgesDir = path.join(__dirname, '../../uploads/purges');
      if (!fs.existsSync(purgesDir)) fs.mkdirSync(purgesDir, { recursive: true });

      const fileName = `purge_${from_date.replace(/-/g,'')}_to_${to_date.replace(/-/g,'')}_${Date.now()}.xlsx`;
      const filePath = path.join(purgesDir, fileName);
      XLSX.writeFile(wb, filePath);

      await AuditLog.destroy({ where });
    }

    res.json({ success: true, message: `Successfully purged ${count} audit logs. Exported to Excel.`, data: { count } });
  } catch (err) { next(err); }
};

const getPurgeHistory = async (req, res, next) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const purgesDir = path.join(__dirname, '../../uploads/purges');
    if (!fs.existsSync(purgesDir)) return res.json({ success: true, data: [] });

    const files = fs.readdirSync(purgesDir).map(file => {
      const stats = fs.statSync(path.join(purgesDir, file));
      return { name: file, size: stats.size, date: stats.mtime, url: `/uploads/purges/${file}` };
    }).sort((a, b) => b.date - a.date);

    res.json({ success: true, data: files });
  } catch (err) { next(err); }
};

module.exports = { propertyDashboard, adminDashboard, superAdminDashboard, userDashboard, purgeAuditLogs, getPurgeHistory };
