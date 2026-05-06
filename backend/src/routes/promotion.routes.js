const router = require('express').Router();
const ctrl = require('../controllers/promotion.controller');
const { authenticate, isEntity, optionalAuthenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const audit = require('../middleware/audit');

router.get('/', optionalAuthenticate, ctrl.getAll);
router.post('/', authenticate, isEntity, (req, res, next) => { req.uploadFolder = 'promotions'; next(); }, upload.single('image'), audit('Promotion'), ctrl.create);
router.put('/:id', authenticate, isEntity, (req, res, next) => { req.uploadFolder = 'promotions'; next(); }, upload.single('image'), audit('Promotion'), ctrl.update);
router.delete('/:id', authenticate, isEntity, audit('Promotion'), ctrl.remove);
router.get('/:id/history', authenticate, ctrl.getHistory);

module.exports = router;
