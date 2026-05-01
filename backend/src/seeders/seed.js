require('dotenv').config();
const { sequelize } = require('../config/database');
const { User, Entity, Event, MenuItem, EntitySlot, SystemConfig } = require('../models');
const seedRoles = require('./roleSeeder');

const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('✅ Database connected and synced.');

    // Roles and Authorizations
    await seedRoles();

    // System Config
    await SystemConfig.findOrCreate({
      where: { id: 1 },
      defaults: {
        id: 1, site_name: 'EventPortal', site_tagline: 'Discover · Book · Celebrate',
        portal_default_commission_percent: 10, whatsapp_mode: 'property',
        smtp_host: 'smtp.gmail.com', smtp_port: 587, smtp_secure: false,
        from_name: 'EventPortal', from_email: 'noreply@eventportal.com',
        maintenance_mode: false, payment_enabled: false,
        cancellation_policy: 'Cancellations made 24 hours before the event are eligible for a full refund.'
      }
    });
    console.log('✅ System config seeded.');

    // Super Admin
    const [superAdminUser] = await User.findOrCreate({
      where: { username: 'superadmin' },
      defaults: {
        username: 'superadmin', email: 'superadmin@eventportal.com',
        password_hash: 'Admin@1234', role: 'Super Admin',
        first_name: 'Super', last_name: 'Admin', is_active: true
      }
    });
    await superAdminUser.update({ role: 'Super Admin' });
    console.log('✅ Super Admin synchronized.');

    // Admin
    const [adminUser] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin', email: 'admin@eventportal.com',
        password_hash: 'Admin@1234', role: 'Admin',
        first_name: 'Portal', last_name: 'Admin', is_active: true
      }
    });
    await adminUser.update({ role: 'Admin' });
    console.log('✅ Admin synchronized.');

    // Property User
    const [propUserRecord] = await User.findOrCreate({
      where: { username: 'thegrandvenue' },
      defaults: {
        username: 'thegrandvenue', email: 'property@grandvenue.com',
        password_hash: 'Prop@1234', role: 'Entity',
        first_name: 'Grand', last_name: 'Venue', phone: '9876543210', is_active: true
      }
    });
    await propUserRecord.update({ role: 'Entity' });
    console.log('✅ Property User synchronized.');

    // End User
    const [endUserRecord] = await User.findOrCreate({
      where: { username: 'john_doe' },
      defaults: {
        username: 'john_doe', email: 'john@example.com',
        password_hash: 'User@1234', role: 'End_User',
        first_name: 'John', last_name: 'Doe', phone: '9123456789', is_active: true
      }
    });
    await endUserRecord.update({ role: 'End_User' });
    console.log('✅ End User synchronized.');

    // Sample Entity
    const [entity] = await Entity.findOrCreate({
      where: { name: 'The Grand Venue' },
      defaults: {
        name: 'The Grand Venue', description: 'Mumbai\'s premier event destination featuring world-class entertainment, fine dining, and stunning rooftop views.',
        address: '42, Marine Drive', city: 'Mumbai', state: 'Maharashtra', country: 'India', pincode: '400001',
        category: 'banquet_hall', admin_user_id: adminUser.id, entity_user_id: propUserRecord.id,
        portal_commission_percent: 10, mobile_1: '9876543210', email: 'info@grandvenue.com',
        opening_time: '18:00', closing_time: '02:00',
        cuisine_types: ['Indian', 'Continental', 'Chinese', 'Mexican'],
        amenities: ['Parking', 'AC', 'Bar', 'Dance Floor', 'Live Music', 'Valet'],
        tags: ['premium', 'rooftop', 'events', 'dining'],
        status: 'Active', is_featured: true, rating: 4.5, total_reviews: 128
      }
    });
    console.log('✅ Entity seeded: The Grand Venue');

    // Events
    const today = new Date();
    const events = [
      { name: 'Sonu Nigam Live', description: 'An unforgettable evening with Bollywood legend Sonu Nigam performing his greatest hits.', event_date: new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0], start_time: '20:00', end_time: '23:00', ticket_price: 1500, total_capacity: 200, is_featured: true, status: 'Active' },
      { name: 'Stand-Up Comedy Night', description: 'Mumbai\'s best comedians take the stage for a night of laughter and fun.', event_date: new Date(today.getTime() + 14 * 86400000).toISOString().split('T')[0], start_time: '19:30', end_time: '22:00', ticket_price: 800, total_capacity: 150, status: 'Active' }
    ];

    for (const ev of events) {
      await Event.findOrCreate({ where: { name: ev.name, property_id: entity.id }, defaults: { ...ev, property_id: entity.id } });
    }
    console.log('✅ Events seeded.');

    // Menu Items
    const menuItems = [
      { name: 'Paneer Tikka', price: 350, is_veg: true, description: 'Grilled cottage cheese with spiced marinade.', status: 'Active' },
      { name: 'Chicken Wings', price: 450, is_veg: false, description: 'Crispy wings with BBQ and hot sauce.', status: 'Active' }
    ];

    for (const item of menuItems) {
      await MenuItem.findOrCreate({ where: { name: item.name, property_id: entity.id }, defaults: { ...item, property_id: entity.id } });
    }
    console.log('✅ Menu items seeded.');

    // Slots
    const slots = [
      { slot_name: 'Rooftop Table - Dinner', slot_date: new Date(today.getTime() + 2 * 86400000).toISOString().split('T')[0], start_time: '19:00', end_time: '22:00', slot_type: 'rooftop', total_capacity: 40, price_per_head: 200, min_guests: 2, max_guests: 8 },
      { slot_name: 'Main Hall - Private Event', slot_date: new Date(today.getTime() + 5 * 86400000).toISOString().split('T')[0], start_time: '18:00', end_time: '23:00', slot_type: 'hall', total_capacity: 100, price_per_head: 500, min_guests: 20, max_guests: 100 }
    ];

    for (const slot of slots) {
      await EntitySlot.findOrCreate({ where: { slot_name: slot.slot_name, property_id: entity.id }, defaults: { ...slot, property_id: entity.id } });
    }
    console.log('✅ Slots seeded.');

    console.log('\n🎉 Seeding complete!\n');
    console.log('─────────────────────────────────────────');
    console.log('  Test Credentials:');
    console.log('  Super Admin → superadmin / Admin@1234');
    console.log('  Admin       → admin / Admin@1234');
    console.log('  Property    → thegrandvenue / Prop@1234');
    console.log('  End User    → john_doe / User@1234');
    console.log('─────────────────────────────────────────\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seed();
