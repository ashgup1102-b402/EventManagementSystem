const { Entity, EventType, MenuCategory } = require('./src/models');

async function debugData() {
  try {
    const names = ['GURU', 'Le First', 'Le Newly', 'The Grandeur Datalog', 'The Grand Venue'];
    console.log('--- TARGET ENTITIES ---');
    const entities = await Entity.findAll({ 
      where: { name: names },
      attributes: ['id', 'name', 'cover_image'] 
    });
    
    if (entities.length === 0) {
      console.log('No entities found with those names. Listing last 5 entities instead:');
      const last5 = await Entity.findAll({ order: [['createdAt', 'DESC']], limit: 5 });
      last5.forEach(e => console.log(`Name: ${e.name}, CoverImage: ${e.cover_image}`));
    } else {
      entities.forEach(e => {
        console.log(`Name: ${e.name}, CoverImage: ${e.cover_image}`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debugData();
