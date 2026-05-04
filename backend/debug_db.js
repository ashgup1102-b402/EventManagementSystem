const { Entity, EventType, MenuCategory } = require('./src/models');

async function debugImages() {
  try {
    console.log('--- ENTITIES ---');
    const entities = await Entity.findAll({ limit: 5 });
    entities.forEach(e => {
      console.log(`Name: ${e.name}, CoverImage: ${e.cover_image}`);
    });

    console.log('\n--- EVENT TYPES ---');
    const ev = await EventType.findAll({ limit: 5 });
    ev.forEach(e => {
      console.log(`Name: ${e.name}, Image: ${e.image}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debugImages();
