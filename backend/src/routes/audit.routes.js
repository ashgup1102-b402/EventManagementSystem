const router = require('express').Router();
const ctrl = require('../controllers/audit.controller');
const { authenticate, isSuperAdmin } = require('../middleware/auth');

router.use(authenticate);
router.use(isSuperAdmin); // Only Super Admins can see full audit logs

router.get('/', ctrl.getAuditLogs);
router.get('/actions', ctrl.getAuditActions);

module.exports = router;
