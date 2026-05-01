const { sequelize } = require('../config/database');
const User = require('./User');
const Entity = require('./Entity');
const EntitySlot = require('./EntitySlot');
const Event = require('./Event');
const MenuItem = require('./MenuItem');
const ComboDeal = require('./ComboDeal');
const Discount = require('./Discount');
const Booking = require('./Booking');
const BookingItem = require('./BookingItem');
const WhatsappLog = require('./WhatsappLog');
const AuditLog = require('./AuditLog');
const SystemConfig = require('./SystemConfig');
const Role = require('./Role');
const Authorization = require('./Authorization');
const Category = require('./Category');
const EventType = require('./EventType');
const Performer = require('./Performer');
const MenuCategory = require('./MenuCategory');
const CuisineType = require('./CuisineType');

// ─── Associations ──────────────────────────────────────────────

// User ↔ Entity (admin_user)
User.hasMany(Entity, { foreignKey: 'admin_user_id', as: 'managed_entities' });
Entity.belongsTo(User, { foreignKey: 'admin_user_id', as: 'admin' });

// User ↔ Entity (entity_user)
User.hasOne(Entity, { foreignKey: 'entity_user_id', as: 'entity' });
Entity.belongsTo(User, { foreignKey: 'entity_user_id', as: 'entity_user' });

// Entity → Events
Entity.hasMany(Event, { foreignKey: 'property_id', as: 'events', onDelete: 'CASCADE' });
Event.belongsTo(Entity, { foreignKey: 'property_id', as: 'entity' });

// Entity → Slots
Entity.hasMany(EntitySlot, { foreignKey: 'property_id', as: 'slots', onDelete: 'CASCADE' });
EntitySlot.belongsTo(Entity, { foreignKey: 'property_id', as: 'entity' });

// Entity → Menu
Entity.hasMany(MenuItem, { foreignKey: 'property_id', as: 'menu_items', onDelete: 'CASCADE' });
MenuItem.belongsTo(Entity, { foreignKey: 'property_id', as: 'entity' });

// Entity → Combos
Entity.hasMany(ComboDeal, { foreignKey: 'property_id', as: 'combo_deals', onDelete: 'CASCADE' });
ComboDeal.belongsTo(Entity, { foreignKey: 'property_id', as: 'entity' });

// Entity → Discounts
Entity.hasMany(Discount, { foreignKey: 'property_id', as: 'discounts', onDelete: 'CASCADE' });
Discount.belongsTo(Entity, { foreignKey: 'property_id', as: 'entity' });

// User → Bookings
User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings', onDelete: 'SET NULL' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Entity → Bookings
Entity.hasMany(Booking, { foreignKey: 'property_id', as: 'bookings' });
Booking.belongsTo(Entity, { foreignKey: 'property_id', as: 'entity' });

// Event → Bookings
Event.hasMany(Booking, { foreignKey: 'event_id', as: 'bookings' });
Booking.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

// Slot → Bookings
EntitySlot.hasMany(Booking, { foreignKey: 'slot_id', as: 'bookings' });
Booking.belongsTo(EntitySlot, { foreignKey: 'slot_id', as: 'slot' });

// Discount → Bookings
Discount.hasMany(Booking, { foreignKey: 'discount_id', as: 'bookings' });
Booking.belongsTo(Discount, { foreignKey: 'discount_id', as: 'discount' });

// Booking → BookingItems
Booking.hasMany(BookingItem, { foreignKey: 'booking_id', as: 'items', onDelete: 'CASCADE' });
BookingItem.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// Entity → WhatsappLogs
Entity.hasMany(WhatsappLog, { foreignKey: 'property_id', as: 'whatsapp_logs' });
WhatsappLog.belongsTo(Entity, { foreignKey: 'property_id', as: 'entity' });

// User → AuditLogs
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'audit_logs', onDelete: 'SET NULL' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Category ↔ Entity
Category.hasMany(Entity, { foreignKey: 'category_id', as: 'entities' });
Entity.belongsTo(Category, { foreignKey: 'category_id', as: 'entity_category' });

// Master Associations
EventType.hasMany(Performer, { foreignKey: 'event_type_id', as: 'performers' });
Performer.belongsTo(EventType, { foreignKey: 'event_type_id', as: 'event_type' });

EventType.hasMany(Event, { foreignKey: 'event_type_id', as: 'events' });
Event.belongsTo(EventType, { foreignKey: 'event_type_id', as: 'event_type_ref' });

Performer.hasMany(Event, { foreignKey: 'performer_id', as: 'events' });
Event.belongsTo(Performer, { foreignKey: 'performer_id', as: 'performer_ref' });

MenuCategory.hasMany(MenuItem, { foreignKey: 'menu_category_id', as: 'menu_items' });
MenuItem.belongsTo(MenuCategory, { foreignKey: 'menu_category_id', as: 'menu_category' });

CuisineType.hasMany(MenuItem, { foreignKey: 'cuisine_type_id', as: 'menu_items' });
MenuItem.belongsTo(CuisineType, { foreignKey: 'cuisine_type_id', as: 'cuisine_type' });

module.exports = {
  sequelize,
  User, Entity, EntitySlot, Event, MenuItem,
  ComboDeal, Discount, Booking, BookingItem,
  WhatsappLog, AuditLog, SystemConfig, Role, Authorization, Category,
  EventType, Performer, MenuCategory, CuisineType
};
