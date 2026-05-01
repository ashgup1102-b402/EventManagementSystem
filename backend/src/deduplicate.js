require('dotenv').config();
const { Entity, sequelize } = require('./models');

const deduplicate = async () => {
  console.log('Deduping entity names...');
  const entities = await Entity.findAll();
  const names = new Set();
  
  for (const ent of entities) {
    if (names.has(ent.name)) {
      const newName = `${ent.name} (${ent.entity_code})`;
      console.log(`Renaming duplicate: ${ent.name} -> ${newName}`);
      await ent.update({ name: newName });
    } else {
      names.add(ent.name);
    }
  }
  console.log('Deduplication complete.');
  process.exit(0);
};

deduplicate().catch(err => {
  console.error(err);
  process.exit(1);
});
