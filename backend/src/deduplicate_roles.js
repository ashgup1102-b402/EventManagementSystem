require('dotenv').config();
const { Role, User, Authorization, sequelize } = require('./models');

const mergeRoles = async () => {
  console.log('Merging roles into canonical lowercase versions...');
  const roles = await Role.findAll();
  
  const mapping = {
    'Admin': ['admin', 'ADMIN', 'Admin'],
    'End_User': ['end_user', 'END_USER', 'End_User', 'End User'],
    'Entity': ['property', 'ENTITY', 'Entity', 'Property'],
    'Super Admin': ['super_admin', 'Super_Admin', 'Super Admin']
  };

  for (const [canonical, variants] of Object.entries(mapping)) {
    // Find or Create the canonical role record
    let [keepRole] = await Role.findOrCreate({ 
      where: { name: canonical },
      defaults: { name: canonical, is_system: true, status: 'Active' }
    });

    for (const variant of variants) {
      if (variant === canonical) continue;
      
      const discardRole = await Role.findOne({ where: { name: variant } });
      if (!discardRole) continue;

      console.log(`Merging variant ${variant} into ${canonical}...`);
      
      const t = await sequelize.transaction();
      try {
        // Update users
        await User.update({ role: canonical }, { where: { role: variant }, transaction: t });
        
        // Resolve Authorization conflicts
        const discardAuths = await Authorization.findAll({ where: { role_name: variant } });
        for (const da of discardAuths) {
          const conflict = await Authorization.findOne({ 
            where: { role_name: canonical, screen_name: da.screen_name },
            transaction: t
          });
          if (conflict) {
            await da.destroy({ transaction: t });
          } else {
            await da.update({ role_name: canonical }, { transaction: t });
          }
        }
        
        // Delete the duplicate role record
        await discardRole.destroy({ transaction: t });
        
        await t.commit();
        console.log(`Successfully merged ${variant}.`);
      } catch (err) {
        await t.rollback();
        console.error(`Failed to merge ${variant}:`, err.message);
      }
    }
  }

  // Cleanup any other duplicates that might exist (lowercase name matches)
  const finalRoles = await Role.findAll();
  const seen = new Set();
  for (const r of finalRoles) {
    if (seen.has(r.name.toLowerCase())) {
      console.log(`Deleting extra duplicate: ${r.name}`);
      await r.destroy();
    } else {
      seen.add(r.name.toLowerCase());
    }
  }

  console.log('Deduplication complete.');
  process.exit(0);
};

mergeRoles().catch(err => {
  console.error(err);
  process.exit(1);
});
