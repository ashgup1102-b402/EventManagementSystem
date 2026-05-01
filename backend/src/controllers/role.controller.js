const { Role, Authorization, sequelize, User } = require('../models');

const SYSTEM_ROLES = ['Super Admin', 'Admin', 'Entity', 'End_User'];

// GET /api/auth/roles
const getRoles = async (req, res, next) => {
  try {
    // Admin cannot see Super Admin roles if restricted (but usually they see the list)
    // The user said: "Admin... cannot Read, Edit or Delete role rights [for Super Admin]"
    const roles = await Role.findAll({ order: [['is_system', 'DESC'], ['name', 'ASC']] });
    res.json({ success: true, data: roles });
  } catch (err) { next(err); }
};

// POST /api/auth/roles
const createRole = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    // Check if name is a system role
    if (SYSTEM_ROLES.some(r => r.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Cannot create a role with a system name.' });
    }
    const role = await Role.create({ name, description, is_system: false });
    res.status(201).json({ success: true, data: role });
  } catch (err) { next(err); }
};

// PUT /api/auth/roles/:id
const updateRole = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { name, description, status } = req.body;
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Role not found.' });
    }

    // Protection for System Roles
    if (SYSTEM_ROLES.includes(role.name)) {
      if (req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(403).json({ success: false, message: 'Only Super Admin can modify system roles.' });
      }
      
      if (status === 'Inactive' && role.name === 'Super Admin') {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Cannot deactivate Super Admin role.' });
      }
      
      if (name && name !== role.name) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'System roles cannot be renamed.' });
      }
    }

    const oldName = role.name;
    const newName = name || oldName;

    await role.update({ name: newName, description, status }, { transaction: t });

    if (newName !== oldName) {
      await User.update({ role: newName }, { where: { role: oldName }, transaction: t });
      await Authorization.update({ role_name: newName }, { where: { role_name: oldName }, transaction: t });
    }

    await t.commit();
    res.json({ success: true, data: role });
  } catch (err) { 
    await t.rollback();
    next(err); 
  }
};

// GET /api/auth/authorizations
const getAuthorizations = async (req, res, next) => {
  try {
    const { role_name } = req.query;
    const where = {};
    if (role_name) where.role_name = role_name;

    // Admin cannot read Super Admin authorizations
    if (req.user.role !== 'Super Admin' && role_name === 'Super Admin') {
      return res.status(403).json({ success: false, message: 'Access denied to Super Admin authorizations.' });
    }

    const auths = await Authorization.findAll({ where });
    
    // Filter out Super Admin if listing all and not super admin
    let filteredAuths = auths;
    if (req.user.role !== 'Super Admin' && !role_name) {
      filteredAuths = auths.filter(a => a.role_name !== 'Super Admin');
    }

    res.json({ success: true, data: filteredAuths });
  } catch (err) { next(err); }
};

// POST /api/auth/authorizations/bulk
const updateAuthorizationsBulk = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { authorizations } = req.body;
    for (const auth of authorizations) {
      // Protection: Only Super Admin can modify Super Admin authorizations
      if (auth.role_name === 'Super Admin' && req.user.role !== 'Super Admin') {
        continue; // Skip or throw error? Let's skip to process others
      }

      const existing = await Authorization.findOne({ 
        where: { role_name: auth.role_name, screen_name: auth.screen_name },
        transaction: t 
      });
      if (existing) {
        await existing.update({ permission: auth.permission }, { transaction: t });
      } else {
        await Authorization.create({
          role_name: auth.role_name,
          screen_name: auth.screen_name,
          permission: auth.permission
        }, { transaction: t });
      }
    }
    await t.commit();
    res.json({ success: true, message: 'Authorizations updated.' });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

// DELETE /api/auth/roles/:id
const removeRole = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Role not found.' });
    }

    if (SYSTEM_ROLES.includes(role.name)) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Core system roles cannot be deleted.' });
    }

    // Check for assigned users
    const usersCount = await User.count({ where: { role: role.name } });
    if (usersCount > 0) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: `This role is assigned to ${usersCount} user(s). Please reassign them before deleting.` 
      });
    }

    await Authorization.destroy({ where: { role_name: role.name }, transaction: t });
    await role.destroy({ transaction: t });

    await t.commit();
    res.json({ success: true, message: 'Role deleted successfully.' });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

module.exports = { getRoles, createRole, updateRole, removeRole, getAuthorizations, updateAuthorizationsBulk };
