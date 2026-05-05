require('dotenv').config();
const { User } = require('./src/models');
const bcrypt = require('bcryptjs');

async function resetPasswords() {
  try {
    const users = [
      { username: 'superadmin', pass: 'Admin@1234' },
      { username: 'admin', pass: 'Admin@1234' },
      { username: 'thegrandvenue', pass: 'Prop@1234' },
      { username: 'john_doe', pass: 'User@1234' }
    ];

    for (const u of users) {
      const user = await User.findOne({ where: { username: u.username } });
      if (user) {
        // We set password_hash directly and the beforeUpdate hook will hash it
        // Or we can hash it here and set it
        user.password_hash = u.pass;
        await user.save();
        console.log(`✅ Password reset for ${u.username}`);
      } else {
        console.log(`⚠️ User ${u.username} not found`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

resetPasswords();
