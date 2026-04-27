const { sequelize } = require('../config/database');
const User = require('./User');
const Property = require('./Property');
const PropertySlot = require('./PropertySlot');
const Event = require('./Event');
const MenuItem = require('./MenuItem');
const ComboDeal = require('./ComboDeal');
const Discount = require('./Discount');
const Booking = require('./Booking');
const BookingItem = require('./BookingItem');
const WhatsappLog = require('./WhatsappLog');
const AuditLog = require('./AuditLog');
const SystemConfig = require('./SystemConfig');

// ─── Associations ──────────────────────────────────────────────

// User ↔ Property (admin_user)
User.hasMany(Property, { foreignKey: 'admin_user_id', as: 'managed_properties' });
Property.belongsTo(User, { foreignKey: 'admin_user_id', as: 'admin' });

// User ↔ Property (property_user)
User.hasOne(Property, { foreignKey: 'property_user_id', as: 'property' });
Property.belongsTo(User, { foreignKey: 'property_user_id', as: 'property_user' });

// Property → Events
Property.hasMany(Event, { foreignKey: 'property_id', as: 'events', onDelete: 'CASCADE' });
Event.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });

// Property → Slots
Property.hasMany(PropertySlot, { foreignKey: 'property_id', as: 'slots', onDelete: 'CASCADE' });
PropertySlot.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });

// Property → Menu
Property.hasMany(MenuItem, { foreignKey: 'property_id', as: 'menu_items', onDelete: 'CASCADE' });
MenuItem.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });

// Property → Combos
Property.hasMany(ComboDeal, { foreignKey: 'property_id', as: 'combo_deals', onDelete: 'CASCADE' });
ComboDeal.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });

// Property → Discounts
Property.hasMany(Discount, { foreignKey: 'property_id', as: 'discounts', onDelete: 'CASCADE' });
Discount.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });

// User → Bookings
User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Property → Bookings
Property.hasMany(Booking, { foreignKey: 'property_id', as: 'bookings' });
Booking.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });

// Event → Bookings
Event.hasMany(Booking, { foreignKey: 'event_id', as: 'bookings' });
Booking.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

// Slot → Bookings
PropertySlot.hasMany(Booking, { foreignKey: 'slot_id', as: 'bookings' });
Booking.belongsTo(PropertySlot, { foreignKey: 'slot_id', as: 'slot' });

// Discount → Bookings
Discount.hasMany(Booking, { foreignKey: 'discount_id', as: 'bookings' });
Booking.belongsTo(Discount, { foreignKey: 'discount_id', as: 'discount' });

// Booking → BookingItems
Booking.hasMany(BookingItem, { foreignKey: 'booking_id', as: 'items', onDelete: 'CASCADE' });
BookingItem.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// Property → WhatsappLogs
Property.hasMany(WhatsappLog, { foreignKey: 'property_id', as: 'whatsapp_logs' });
WhatsappLog.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });

// User → AuditLogs
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'audit_logs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User, Property, PropertySlot, Event, MenuItem,
  ComboDeal, Discount, Booking, BookingItem,
  WhatsappLog, AuditLog, SystemConfig
};
