const { Entity, Event, MenuItem, Booking, User, EventType, Performer, MenuCategory, CuisineType } = require('../models');
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
    if (date) eventWhere.event_date = date;
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

    // Include entity filter for events and menu items if city is provided
    const entityIncludeWhere = {};
    if (city) entityIncludeWhere.city = { [Op.iLike]: `%${city}%` };

    // Search menu items
    const menuWhere = { is_available: true, status: 'Active' };
    if (mcIds.length > 0) menuWhere.menu_category_id = { [Op.in]: mcIds };
    if (ctIds.length > 0) menuWhere.cuisine_type_id = { [Op.in]: ctIds };
    if (is_veg !== undefined && is_veg !== '') menuWhere.is_veg = is_veg === 'true';
    if (q) menuWhere.name = { [Op.iLike]: `%${q}%` };

    const [entities, events, menuItems] = await Promise.all([
      Entity.findAndCountAll({
        where: propWhere, limit: parseInt(limit), offset,
        attributes: ['id','name','description','city','state','category','cover_image','rating','total_reviews','cuisine_types','is_featured'],
        order: [['is_featured','DESC'],['rating','DESC']]
      }),
      Event.findAndCountAll({
        where: eventWhere, limit: parseInt(limit), offset,
        include: [
          { 
            model: Entity, 
            as: 'entity', 
            attributes: ['id','name','city','cover_image'],
            where: { status: 'Active', ...(city ? { city: { [Op.iLike]: `%${city}%` } } : {}) },
            required: true
          },
          {
            model: EventType,
            as: 'event_type_ref',
            attributes: ['id', 'name', 'status'],
            required: false
          },
          {
            model: Performer,
            as: 'performer_ref',
            attributes: ['id', 'name', 'status'],
            required: false
          }
        ],
        // Manual filter for association status to allow NULLs but block Inactive
        where: {
          [Op.and]: [
            eventWhere,
            literal(`("event_type_ref"."status" IS NULL OR "event_type_ref"."status" = 'Active')`),
            literal(`("performer_ref"."status" IS NULL OR "performer_ref"."status" = 'Active')`)
          ]
        },
        order: [['event_date','ASC']]
      }),
      MenuItem.findAndCountAll({
        where: menuWhere, limit: parseInt(limit), offset,
        include: [
          { 
            model: Entity, 
            as: 'entity', 
            attributes: ['id','name','city','cover_image'],
            where: { status: 'Active', ...(city ? { city: { [Op.iLike]: `%${city}%` } } : {}) },
            required: true
          },
          {
            model: MenuCategory,
            as: 'menu_category_ref',
            attributes: ['id', 'name', 'status'],
            required: false
          },
          {
            model: CuisineType,
            as: 'cuisine_type_ref',
            attributes: ['id', 'name', 'status'],
            required: false
          }
        ],
        where: {
          [Op.and]: [
            menuWhere,
            literal(`("menu_category_ref"."status" IS NULL OR "menu_category_ref"."status" = 'Active')`),
            literal(`("cuisine_type_ref"."status" IS NULL OR "cuisine_type_ref"."status" = 'Active')`)
          ]
        },
        order: [['is_featured','DESC'],['name','ASC']]
      })
    ]);

    // Post-filtering for the (ref is null OR ref.status = 'Active') logic if needed, 
    // or use Op.or in include. Actually, the above include will filter out rows where ref.status != 'Active' 
    // BUT only if they have a ref. If they don't have a ref, they will still show up (because required: false).
    // This is exactly what we want: Master data only blocks if it EXISTS and is Inactive.

    res.json({
      success: true,
      data: {
        properties: { rows: entities.rows, total: entities.count },
        events: { rows: events.rows, total: events.count },
        menu_items: { rows: menuItems.rows, total: menuItems.count }
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
