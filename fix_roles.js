require('dotenv').config({ path: './backend/.env' });
const { User, sequelize } = require('./backend/src/models');

const fix = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database.');
    
    await User.update({ role: 'Super Admin' }, { where: { username: 'superadmin' } });
    await User.update({ role: 'Admin' }, { where: { username: 'admin' } });
    await User.update({ role: 'Entity' }, { where: { username: 'thegrandvenue' } });
    await User.update({ role: 'End_User' }, { where: { username: 'john_doe' } });
    
    console.log('✅ User roles normalized to new canonical names.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

fix();
