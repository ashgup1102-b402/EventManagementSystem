const { Category } = require('../models');

const seedCategories = async () => {
  const defaultCategories = [
    { name: 'Hotel', description: 'Lodging and accommodation' },
    { name: 'Resort', description: 'Vacation and leisure resort' },
    { name: 'Singer', description: 'Musical artist or performer' },
    { name: 'Banquet Hall', description: 'Event and party venue' },
    { name: 'Club', description: 'Nightclub or social club' },
    { name: 'Restaurant', description: 'Dining and food establishment' }
  ];

  for (const cat of defaultCategories) {
    await Category.findOrCreate({
      where: { name: cat.name },
      defaults: cat
    });
  }

  console.log('✅ Categories seeded.');
};

module.exports = seedCategories;
