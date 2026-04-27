const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const { authenticate, isAdmin, isSuperAdmin, isProperty } = require('../middleware/auth');

router.get('/user', authenticate, ctrl.userDashboard);
router.get('/property', authenticate, isProperty, ctrl.propertyDashboard);
router.get('/admin', authenticate, isAdmin, ctrl.adminDashboard);
router.get('/superadmin', authenticate, isSuperAdmin, ctrl.superAdminDashboard);

module.exports = router;
