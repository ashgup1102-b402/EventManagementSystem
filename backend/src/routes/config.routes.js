const router = require('express').Router();
const ctrl = require('../controllers/config.controller');
const { authenticate, isSuperAdmin } = require('../middleware/auth');

router.get('/public', ctrl.getPublicConfig);
router.get('/', authenticate, ctrl.getConfig);
router.put('/', authenticate, isSuperAdmin, ctrl.updateConfig);

module.exports = router;
