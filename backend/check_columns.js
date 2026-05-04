const { sequelize } = require('./src/config/database');

async function checkSchema() {
  try {
    const [results] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'entities'");
    console.log('--- ENTITIES COLUMNS ---');
    results.forEach(c => console.log(`${c.column_name}: ${c.data_type}`));

    const [results2] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'event_types'");
    console.log('\n--- EVENT_TYPES COLUMNS ---');
    results2.forEach(c => console.log(`${c.column_name}: ${c.data_type}`));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
