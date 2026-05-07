const { Role, Authorization, sequelize } = require('../models');
const { Op } = require('sequelize');

const seedRoles = async () => {
  const roles = [
    { name: 'Super Admin', description: 'Full system access', is_system: true },
    { name: 'Admin', description: 'Administrative access', is_system: true },
    { name: 'Entity', description: 'Entity manager access', is_system: true },
    { name: 'End_User', description: 'General user access', is_system: true }
  ];

  // Sync Roles
  for (const r of roles) {
    const existing = await Role.findOne({ 
      where: { name: { [Op.iLike]: r.name } } 
    });
    
    if (!existing) {
      await Role.create(r);
    } else {
      // Ensure correct naming/casing
      if (existing.name !== r.name) {
        await existing.update({ name: r.name, is_system: true });
      }
    }
  }

  // Cleanup old roles that might have been used in previous versions
  const oldRoleNames = ['super_admin', 'admin', 'property', 'end_user'];
  for (const oldName of oldRoleNames) {
    const role = await Role.findOne({ where: { name: oldName } });
    if (role && !['Super Admin', 'Admin', 'Entity', 'End_User'].includes(role.name)) {
      // If we found 'super_admin' but we now have 'Super Admin', 
      // we should migrate users or just let the manual check handle it.
      // For now, let's just make sure the new ones exist.
    }
  }

  const screens = [
    'Dashboard', 'Entity Management', 'User Management', 'Booking Management', 
    'Event Management', 'Menu Management', 'Slot Management', 'Discount Management',
    'Promotions', 'SMTP Settings', 'Business Rules', 'System Configuration', 'Audit Logs',
    'Role Management', 'Authorization', 'Category Management', 'Event Types', 'Performers', 'Menu Categories', 'Cuisine Types'
  ];

  const restrictedForAdmin = ['System Configuration', 'Event Types', 'Performers', 'Menu Categories', 'Cuisine Types'];
  const readOnlyForAdmin = ['Event Management', 'Menu Management', 'Slot Management', 'Discount Management', 'Promotions'];

  for (const screen of screens) {
    // 1. Super Admin: Full Access to all
    await Authorization.findOrCreate({
      where: { role_name: 'Super Admin', screen_name: screen },
      defaults: { role_name: 'Super Admin', screen_name: screen, permission: 'Full Access' }
    }).then(([auth, created]) => {
      if (!created && auth.permission !== 'Full Access') {
        return auth.update({ permission: 'Full Access' });
      }
    });

    // 2. Admin: Logic for permissions
    let adminPermission = 'Full Access';
    if (restrictedForAdmin.includes(screen)) adminPermission = 'None';
    if (readOnlyForAdmin.includes(screen)) adminPermission = 'Read Only';

    await Authorization.findOrCreate({
      where: { role_name: 'Admin', screen_name: screen },
      defaults: { role_name: 'Admin', screen_name: screen, permission: adminPermission }
    }).then(([auth, created]) => {
      // For existing installations, update the permission to match the new rules
      if (!created && auth.permission !== adminPermission) {
        return auth.update({ permission: adminPermission });
      }
    });

    // 3. Entity: Logic for permissions
    const entityScreens = ['Dashboard', 'Event Management', 'Menu Management', 'Slot Management', 'Discount Management', 'Promotions', 'Booking Management', 'Guest List', 'Direct Marketing', 'Entity Settings'];
    let entityPermission = 'None';
    if (entityScreens.includes(screen)) entityPermission = 'Full Access';

    await Authorization.findOrCreate({
      where: { role_name: 'Entity', screen_name: screen },
      defaults: { role_name: 'Entity', screen_name: screen, permission: entityPermission }
    }).then(([auth, created]) => {
      if (!created && auth.permission !== entityPermission && entityPermission !== 'None') {
        return auth.update({ permission: entityPermission });
      }
    });

    // 4. End_User: Default to None
    await Authorization.findOrCreate({
      where: { role_name: 'End_User', screen_name: screen },
      defaults: { role_name: 'End_User', screen_name: screen, permission: 'None' }
    });
  }

  console.log('✅ Roles and Authorizations synchronized with 4 core roles.');
};

module.exports = seedRoles;
