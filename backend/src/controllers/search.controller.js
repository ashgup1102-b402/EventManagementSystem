const { Entity, Event, MenuItem, Booking, User, EventType, Performer, MenuCategory, CuisineType, EntitySlot, Discount, ComboDeal, Promotion } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

// GET /api/search
const search = async (req, res, next) => {
  try {
    const { 
      q, city, state, date, 
      event_type_ids, performer_ids, 
      menu_category_ids, cuisine_type_ids,
      is_veg, min_price, max_price, 
      page = 1, limit = 12 
    } = req.query;
    const offset = (page - 1) * limit;

    // Helper to handle single value or array for multi-select
    const toArray = (val) => {
      if (!val) return [];
      return Array.isArray(val) ? val : [val];
    };

    const etIds = toArray(event_type_ids);
    const pIds = toArray(performer_ids);
    const mcIds = toArray(menu_category_ids);
    const ctIds = toArray(cuisine_type_ids);

    // Search entities
    const propWhere = { status: 'Active' };
    if (city) propWhere.city = { [Op.iLike]: `%${city}%` };
    if (state) propWhere.state = { [Op.iLike]: `%${state}%` };
    if (q) {
      propWhere[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
        { city: { [Op.iLike]: `%${q}%` } },
        literal(`"Entity"."tags"::text ILIKE '%${q}%'`)
      ];
    }

    // Search events
    const eventWhere = { is_active: true, status: 'Active' };
    if (etIds.length > 0) eventWhere.event_type_id = { [Op.in]: etIds };
    if (pIds.length > 0) eventWhere.performer_id = { [Op.in]: pIds };
    if (date && date !== '') eventWhere.event_date = date;
    if (min_price && !isNaN(min_price)) eventWhere.ticket_price = { [Op.gte]: parseFloat(min_price) };
    if (max_price && !isNaN(max_price)) {
      eventWhere.ticket_price = { ...(eventWhere.ticket_price || {}), [Op.lte]: parseFloat(max_price) };
    }
    if (q) {
      eventWhere[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
        { performer_name: { [Op.iLike]: `%${q}%` } }
      ];
    }

    // Include entity filter for events and menu items if city is provided
    const entityIncludeWhere = {};
    if (city) entityIncludeWhere.city = { [Op.iLike]: `%${city}%` };

    // Search menu items
    const menuWhere = { is_available: true, status: 'Active' };
    if (mcIds.length > 0) menuWhere.menu_category_id = { [Op.in]: mcIds };
    if (ctIds.length > 0) menuWhere.cuisine_type_id = { [Op.in]: ctIds };
    if (is_veg !== undefined && is_veg !== '') menuWhere.is_veg = is_veg === 'true';
    if (q) menuWhere.name = { [Op.iLike]: `%${q}%` };

    const [entities, events, menuItems, slots, discounts, combos, promos] = await Promise.all([
      Entity.findAndCountAll({
        where: propWhere, limit: parseInt(limit), offset,
        attributes: ['id','name','description','city','state','category','cover_image','rating','total_reviews','cuisine_types','is_featured'],
        order: [['is_featured','DESC'],['rating','DESC']]
      }),
      Event.findAndCountAll({
        where: {
          ...eventWhere,
          [Op.and]: [
            { '$event_type_ref.status$': { [Op.or]: [{ [Op.eq]: null }, 'Active'] } },
            { '$performer_ref.status$': { [Op.or]: [{ [Op.eq]: null }, 'Active'] } }
          ]
        },
        limit: parseInt(limit), offset,
        include: [
          { 
            model: Entity, as: 'entity', 
            attributes: ['id','name','city','cover_image'],
            where: { status: 'Active', ...(city ? { city: { [Op.iLike]: `%${city}%` } } : {}) },
            required: true
          },
          { model: EventType, as: 'event_type_ref', attributes: ['id', 'name', 'status'], required: false },
          { model: Performer, as: 'performer_ref', attributes: ['id', 'name', 'status'], required: false }
        ],
        order: [['event_date','ASC']]
      }),
      MenuItem.findAndCountAll({
        where: {
          ...menuWhere,
          [Op.and]: [
            { '$menu_category_ref.status$': { [Op.or]: [{ [Op.eq]: null }, 'Active'] } },
            { '$cuisine_type_ref.status$': { [Op.or]: [{ [Op.eq]: null }, 'Active'] } }
          ]
        },
        limit: parseInt(limit), offset,
        include: [
          { 
            model: Entity, as: 'entity', 
            attributes: ['id','name','city','cover_image'],
            where: { status: 'Active', ...(city ? { city: { [Op.iLike]: `%${city}%` } } : {}) },
            required: true
          },
          { model: MenuCategory, as: 'menu_category_ref', attributes: ['id', 'name', 'status'], required: false },
          { model: CuisineType, as: 'cuisine_type_ref', attributes: ['id', 'name', 'status'], required: false }
        ],
        order: [['is_featured','DESC'],['name','ASC']]
      }),
      EntitySlot.findAndCountAll({
        where: { is_active: true, ...(q ? { slot_name: { [Op.iLike]: `%${q}%` } } : {}) },
        limit: parseInt(limit), offset,
        include: [{ model: Entity, as: 'entity', attributes: ['id','name','city'], where: { status: 'Active', ...(city ? { city: { [Op.iLike]: `%${city}%` } } : {}) }, required: true }]
      }),
      Discount.findAndCountAll({
        where: { is_active: true, ...(q ? { name: { [Op.iLike]: `%${q}%` } } : {}) },
        limit: parseInt(limit), offset,
        include: [{ model: Entity, as: 'entity', attributes: ['id','name','city'], where: { status: 'Active', ...(city ? { city: { [Op.iLike]: `%${city}%` } } : {}) }, required: true }]
      }),
      ComboDeal.findAndCountAll({
        where: { is_active: true, ...(q ? { name: { [Op.iLike]: `%${q}%` } } : {}) },
        limit: parseInt(limit), offset,
        include: [{ model: Entity, as: 'entity', attributes: ['id','name','city'], where: { status: 'Active', ...(city ? { city: { [Op.iLike]: `%${city}%` } } : {}) }, required: true }]
      }),
      Promotion.findAndCountAll({
        where: { is_active: true, ...(q ? { title: { [Op.iLike]: `%${q}%` } } : {}) },
        limit: parseInt(limit), offset,
        include: [{ model: Entity, as: 'entity', attributes: ['id','name','city'], where: { status: 'Active', ...(city ? { city: { [Op.iLike]: `%${city}%` } } : {}) }, required: true }]
      })
    ]);

    res.json({
      success: true,
      data: {
        properties: { rows: entities.rows, total: entities.count },
        events: { rows: events.rows, total: events.count },
        menu_items: { rows: menuItems.rows, total: menuItems.count },
        slots: { rows: slots.rows, total: slots.count },
        discounts: { rows: discounts.rows, total: discounts.count },
        combos: { rows: combos.rows, total: combos.count },
        promotions: { rows: promos.rows, total: promos.count }
      },
      meta: { query: q, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) { next(err); }
};

// GET /api/search/filters
const getFilters = async (req, res, next) => {
  try {
    const [eventTypes, performers, menuCategories, cuisineTypes, cities] = await Promise.all([
      EventType.findAll({ where: { status: 'Active' }, attributes: ['id', 'name', 'status', 'image'], order: [['name', 'ASC']] }),
      Performer.findAll({ where: { status: 'Active' }, attributes: ['id', 'name', 'status'], order: [['name', 'ASC']] }),
      MenuCategory.findAll({ where: { status: 'Active' }, attributes: ['id', 'name', 'status', 'image'], order: [['name', 'ASC']] }),
      CuisineType.findAll({ where: { status: 'Active' }, attributes: ['id', 'name', 'status'], order: [['name', 'ASC']] }),
      Entity.findAll({ where: { status: 'Active' }, attributes: ['city', 'state'], group: ['city', 'state'], order: [['city', 'ASC']] })
    ]);

    res.json({
      success: true,
      data: {
        event_types: eventTypes,
        performers,
        menu_categories: menuCategories,
        cuisine_types: cuisineTypes,
        cities
      }
    });
  } catch (err) { next(err); }
};

// GET /api/search/cities
const getCities = async (req, res, next) => {
  try {
    const cities = await Entity.findAll({
      where: { status: 'Active' },
      attributes: ['city', 'state'],
      group: ['city', 'state'],
      order: [['city', 'ASC']]
    });
    res.json({ success: true, data: cities });
  } catch (err) { next(err); }
};

module.exports = { search, getFilters, getCities };
