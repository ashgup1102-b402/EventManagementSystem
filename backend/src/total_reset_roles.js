require('dotenv').config();
const { Role, User, Authorization, sequelize } = require('./models');
const seedRoles = require('./seeders/roleSeeder');

const totalReset = async () => {
  console.log('RESTORING SYSTEM ROLES TO FACTORY SETTINGS...');
  const t = await sequelize.transaction();
  try {
    // 1. Delete all existing role and authorization data
    await Authorization.destroy({ where: {}, transaction: t });
    await Role.destroy({ where: {}, transaction: t });
    
    await t.commit();
    console.log('✅ Wiped old roles and authorizations.');

    // 2. Re-seed canonical roles
    await seedRoles();
    console.log('✅ Re-seeded canonical roles.');

    // 3. Normalize all users to canonical lowercase roles
    const users = await User.findAll();
    for (const user of users) {
      const lowerRole = (user.role || 'end_user').toLowerCase();
      // Map legacy 'entity' to 'property'
      const targetRole = lowerRole === 'entity' ? 'property' : lowerRole;
      
      console.log(`Normalizing user ${user.username}: ${user.role} -> ${targetRole}`);
      await user.update({ role: targetRole });
    }
    
    console.log('✅ Normalized all user roles.');
    process.exit(0);
  } catch (err) {
    if (t) await t.rollback();
    console.error('❌ Reset failed:', err);
    process.exit(1);
  }
};

totalReset();
