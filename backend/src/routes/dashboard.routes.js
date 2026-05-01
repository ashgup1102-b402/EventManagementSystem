const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const { authenticate, isAdmin, isSuperAdmin, isEntity } = require('../middleware/auth');

router.get('/user', authenticate, ctrl.userDashboard);
router.get('/property', authenticate, isEntity, ctrl.propertyDashboard);
router.get('/admin', authenticate, isAdmin, ctrl.adminDashboard);
router.get('/superadmin', authenticate, isSuperAdmin, ctrl.superAdminDashboard);
router.post('/audit/purge', authenticate, isSuperAdmin, ctrl.purgeAuditLogs);
router.get('/audit/purge-history', authenticate, isSuperAdmin, ctrl.getPurgeHistory);

module.exports = router;
