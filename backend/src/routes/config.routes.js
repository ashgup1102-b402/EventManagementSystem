const router = require('express').Router();
const ctrl = require('../controllers/config.controller');
const { authenticate, isSuperAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/public', ctrl.getPublicConfig);
router.get('/', authenticate, ctrl.getConfig);
router.put('/', authenticate, isSuperAdmin, (req, res, next) => { req.uploadFolder = 'config'; next(); }, upload.single('site_logo'), ctrl.updateConfig);

module.exports = router;
