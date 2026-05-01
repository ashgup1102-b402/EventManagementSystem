require('dotenv').config();
const { Role, User, sequelize } = require('./models');

const fixStatus = async () => {
  console.log('Fixing status and roles for all records...');
  
  // Set default status for all roles
  await Role.update({ status: 'Active' }, { where: { status: null } });
  
  // Ensure all users have lowercase roles (in case any were missed)
  const users = await User.findAll();
  for (const user of users) {
    if (user.role && user.role !== user.role.toLowerCase()) {
      console.log(`Fixing user ${user.username} role: ${user.role} -> ${user.role.toLowerCase()}`);
      await user.update({ role: user.role.toLowerCase() });
    }
  }
  
  console.log('Fix complete.');
  process.exit(0);
};

fixStatus().catch(err => {
  console.error(err);
  process.exit(1);
});
