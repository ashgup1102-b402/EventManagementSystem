const { Property, Event, MenuItem, Booking, User } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

// GET /api/search
const search = async (req, res, next) => {
  try {
    const { q, city, state, event_type, food_category, is_veg, date, min_price, max_price, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    // Search properties
    const propWhere = { is_active: true };
    if (city) propWhere.city = { [Op.iLike]: `%${city}%` };
    if (state) propWhere.state = { [Op.iLike]: `%${state}%` };
    if (q) {
      propWhere[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
        { city: { [Op.iLike]: `%${q}%` } },
        literal(`"Property"."tags"::text ILIKE '%${q}%'`)
      ];
    }

    // Search events
    const eventWhere = { is_active: true };
    if (event_type) eventWhere.type = event_type;
    if (date) eventWhere.event_date = { [Op.gte]: date };
    if (min_price) eventWhere.ticket_price = { [Op.gte]: parseFloat(min_price) };
    if (max_price) {
      eventWhere.ticket_price = { ...eventWhere.ticket_price, [Op.lte]: parseFloat(max_price) };
    }
    if (q) {
      eventWhere[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
        { performer_name: { [Op.iLike]: `%${q}%` } }
      ];
    }

    // Search menu items
    const menuWhere = { is_available: true };
    if (food_category) menuWhere.category = food_category;
    if (is_veg !== undefined) menuWhere.is_veg = is_veg === 'true';
    if (q) menuWhere.name = { [Op.iLike]: `%${q}%` };

    const [properties, events, menuItems] = await Promise.all([
      Property.findAndCountAll({
        where: propWhere, limit: parseInt(limit), offset,
        attributes: ['id','name','description','city','state','category','cover_image','rating','total_reviews','cuisine_types','is_featured'],
        order: [['is_featured','DESC'],['rating','DESC']]
      }),
      Event.findAndCountAll({
        where: eventWhere, limit: parseInt(limit), offset,
        include: [{ model: Property, as: 'property', attributes: ['id','name','city','cover_image'] }],
        order: [['event_date','ASC']]
      }),
      MenuItem.findAndCountAll({
        where: menuWhere, limit: parseInt(limit), offset,
        include: [{ model: Property, as: 'property', attributes: ['id','name','city','cover_image'] }],
        order: [['is_featured','DESC'],['name','ASC']]
      })
    ]);

    res.json({
      success: true,
      data: {
        properties: { rows: properties.rows, total: properties.count },
        events: { rows: events.rows, total: events.count },
        menu_items: { rows: menuItems.rows, total: menuItems.count }
      },
      meta: { query: q, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) { next(err); }
};

// GET /api/search/cities
const getCities = async (req, res, next) => {
  try {
    const cities = await Property.findAll({
      where: { is_active: true },
      attributes: ['city', 'state'],
      group: ['city', 'state'],
      order: [['city', 'ASC']]
    });
    res.json({ success: true, data: cities });
  } catch (err) { next(err); }
};

module.exports = { search, getCities };
