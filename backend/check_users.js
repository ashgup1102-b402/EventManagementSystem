require('dotenv').config();
const { User } = require('./src/models');

async function checkUsers() {
  try {
    console.log('--- USERS IN DATABASE ---');
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'status', 'is_active']
    });
    
    if (users.length === 0) {
      console.log('No users found in database.');
    } else {
      console.table(users.map(u => u.toJSON()));
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkUsers();
