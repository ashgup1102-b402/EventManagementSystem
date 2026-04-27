require('dotenv').config();
const { sequelize } = require('../config/database');
const { User, Property, Event, MenuItem, PropertySlot, SystemConfig } = require('../models');

const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('✅ Database connected and synced.');

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
    const [superAdmin] = await User.findOrCreate({
      where: { username: 'superadmin' },
      defaults: {
        username: 'superadmin', email: 'superadmin@eventportal.com',
        password_hash: 'Admin@1234', role: 'super_admin',
        first_name: 'Super', last_name: 'Admin', is_active: true
      }
    });
    console.log('✅ Super Admin: username=superadmin  password=Admin@1234');

    // Admin
    const [admin] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin', email: 'admin@eventportal.com',
        password_hash: 'Admin@1234', role: 'admin',
        first_name: 'Portal', last_name: 'Admin', is_active: true
      }
    });
    console.log('✅ Admin: username=admin  password=Admin@1234');

    // Property User
    const [propUser] = await User.findOrCreate({
      where: { username: 'thegrandvenue' },
      defaults: {
        username: 'thegrandvenue', email: 'property@grandvenue.com',
        password_hash: 'Prop@1234', role: 'property',
        first_name: 'Grand', last_name: 'Venue', phone: '9876543210', is_active: true
      }
    });
    console.log('✅ Property User: username=thegrandvenue  password=Prop@1234');

    // End User
    await User.findOrCreate({
      where: { username: 'john_doe' },
      defaults: {
        username: 'john_doe', email: 'john@example.com',
        password_hash: 'User@1234', role: 'end_user',
        first_name: 'John', last_name: 'Doe', phone: '9123456789', is_active: true
      }
    });
    console.log('✅ End User: username=john_doe  password=User@1234');

    // Sample Property
    const [property] = await Property.findOrCreate({
      where: { name: 'The Grand Venue' },
      defaults: {
        name: 'The Grand Venue', description: 'Mumbai\'s premier event destination featuring world-class entertainment, fine dining, and stunning rooftop views.',
        address: '42, Marine Drive', city: 'Mumbai', state: 'Maharashtra', country: 'India', pincode: '400001',
        category: 'banquet_hall', admin_user_id: admin.id, property_user_id: propUser.id,
        portal_commission_percent: 10, phone: '9876543210', email: 'info@grandvenue.com',
        opening_time: '18:00', closing_time: '02:00',
        cuisine_types: ['Indian', 'Continental', 'Chinese', 'Mexican'],
        amenities: ['Parking', 'AC', 'Bar', 'Dance Floor', 'Live Music', 'Valet'],
        tags: ['premium', 'rooftop', 'events', 'dining'],
        is_active: true, is_featured: true, rating: 4.5, total_reviews: 128
      }
    });
    console.log('✅ Property seeded: The Grand Venue');

    // Events
    const today = new Date();
    const events = [
      { name: 'Sonu Nigam Live', type: 'singer', description: 'An unforgettable evening with Bollywood legend Sonu Nigam performing his greatest hits.', event_date: new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0], start_time: '20:00', end_time: '23:00', ticket_price: 1500, total_capacity: 200, performer_name: 'Sonu Nigam', is_featured: true },
      { name: 'Stand-Up Comedy Night', type: 'comedy', description: 'Mumbai\'s best comedians take the stage for a night of laughter and fun.', event_date: new Date(today.getTime() + 14 * 86400000).toISOString().split('T')[0], start_time: '19:30', end_time: '22:00', ticket_price: 800, total_capacity: 150, performer_name: 'Various Artists' },
      { name: 'Dhol Tasha Group Troup', type: 'group_troup', description: 'Experience the energy of traditional Maharashtrian dhol-tasha performance.', event_date: new Date(today.getTime() + 21 * 86400000).toISOString().split('T')[0], start_time: '21:00', end_time: '23:30', ticket_price: 600, total_capacity: 300, performer_name: 'Mumbai Beats Group' },
      { name: 'DJ Nights — EDM Special', type: 'dj', description: 'Dance the night away with top DJs spinning the best EDM tracks.', event_date: new Date(today.getTime() + 3 * 86400000).toISOString().split('T')[0], start_time: '22:00', end_time: '03:00', ticket_price: 1200, total_capacity: 250, performer_name: 'DJ Karan' }
    ];

    for (const ev of events) {
      await Event.findOrCreate({ where: { name: ev.name, property_id: property.id }, defaults: { ...ev, property_id: property.id } });
    }
    console.log('✅ Events seeded.');

    // Menu Items
    const menuItems = [
      { name: 'Paneer Tikka', category: 'starter', price: 350, is_veg: true, cuisine_type: 'Indian', description: 'Grilled cottage cheese with spiced marinade.' },
      { name: 'Chicken Wings', category: 'starter', price: 450, is_veg: false, cuisine_type: 'Continental', description: 'Crispy wings with BBQ and hot sauce.' },
      { name: 'Dal Makhani', category: 'main_course', price: 320, is_veg: true, cuisine_type: 'Indian', description: 'Slow-cooked black lentils in buttery tomato gravy.' },
      { name: 'Butter Chicken', category: 'main_course', price: 480, is_veg: false, cuisine_type: 'Indian', description: 'Tender chicken in rich creamy tomato sauce.' },
      { name: 'Gulab Jamun', category: 'dessert', price: 180, is_veg: true, cuisine_type: 'Indian', description: 'Soft milk dumplings soaked in rose syrup.' },
      { name: 'Virgin Mojito', category: 'mocktail', price: 220, is_veg: true, cuisine_type: 'Continental', description: 'Fresh mint, lime, and soda.' },
      { name: 'Whisky Sour', category: 'cocktail', price: 550, is_veg: true, cuisine_type: 'Continental', description: 'Classic whisky cocktail with lemon and egg white.' },
      { name: 'Veg Hakka Noodles', category: 'main_course', price: 280, is_veg: true, cuisine_type: 'Chinese', description: 'Stir-fried noodles with fresh vegetables.' }
    ];

    for (const item of menuItems) {
      await MenuItem.findOrCreate({ where: { name: item.name, property_id: property.id }, defaults: { ...item, property_id: property.id } });
    }
    console.log('✅ Menu items seeded.');

    // Slots
    const slots = [
      { slot_name: 'Rooftop Table - Dinner', slot_date: new Date(today.getTime() + 2 * 86400000).toISOString().split('T')[0], start_time: '19:00', end_time: '22:00', slot_type: 'rooftop', total_capacity: 40, price_per_head: 200, min_guests: 2, max_guests: 8 },
      { slot_name: 'Main Hall - Private Event', slot_date: new Date(today.getTime() + 5 * 86400000).toISOString().split('T')[0], start_time: '18:00', end_time: '23:00', slot_type: 'hall', total_capacity: 100, price_per_head: 500, min_guests: 20, max_guests: 100 },
      { slot_name: 'Poolside Table', slot_date: new Date(today.getTime() + 2 * 86400000).toISOString().split('T')[0], start_time: '20:00', end_time: '23:00', slot_type: 'outdoor', total_capacity: 30, price_per_head: 150, min_guests: 2, max_guests: 6 }
    ];

    for (const slot of slots) {
      await PropertySlot.findOrCreate({ where: { slot_name: slot.slot_name, property_id: property.id }, defaults: { ...slot, property_id: property.id } });
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
