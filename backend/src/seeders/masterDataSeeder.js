require('dotenv').config();
const { sequelize } = require('../config/database');
const { EventType, Performer, MenuCategory, CuisineType } = require('../models');

const seedMasterData = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected.');

    // Event Types
    const eventTypes = ['Concert', 'Comedy Show', 'DJ Night', 'Dance Performance', 'Theatre', 'Live Band', 'Exhibition'];
    for (const name of eventTypes) {
      await EventType.findOrCreate({ where: { name }, defaults: { name, status: 'Active' } });
    }
    console.log('✅ Event Types seeded.');

    // Performers
    const performers = ['Sonu Nigam', 'Arijit Singh', 'Zakir Khan', 'Nucleya', 'Sunidhi Chauhan', 'Local Band', 'DJ Rahul'];
    const [concertType] = await EventType.findOrCreate({ where: { name: 'Concert' } });
    for (const name of performers) {
      await Performer.findOrCreate({ where: { name }, defaults: { name, status: 'Active', event_type_id: concertType.id } });
    }
    console.log('✅ Performers seeded.');

    // Menu Categories
    const menuCats = ['Starter', 'Main Course', 'Dessert', 'Beverage', 'Cocktail', 'Mocktail'];
    for (const name of menuCats) {
      await MenuCategory.findOrCreate({ where: { name }, defaults: { name, status: 'Active' } });
    }
    console.log('✅ Menu Categories seeded.');

    // Cuisine Types
    const cuisines = ['Indian', 'Chinese', 'Italian', 'Mexican', 'Continental', 'Mediterranean'];
    for (const name of cuisines) {
      await CuisineType.findOrCreate({ where: { name }, defaults: { name, status: 'Active' } });
    }
    console.log('✅ Cuisine Types seeded.');

    console.log('🎉 Master data seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Master data seeding failed:', err);
    process.exit(1);
  }
};

seedMasterData();
