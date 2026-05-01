require('dotenv').config();
const { Role } = require('./models');

const listRoles = async () => {
  const roles = await Role.findAll();
  console.log('--- Current Roles ---');
  roles.forEach(r => console.log(`${r.name} | ${r.id} | System: ${r.is_system}`));
  process.exit(0);
};

listRoles();
