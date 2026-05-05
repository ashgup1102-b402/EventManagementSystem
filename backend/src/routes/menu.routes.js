const router = require('express').Router();
const ctrl = require('../controllers/menu.controller');
const { authenticate, isEntity, optionalAuthenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

const audit = require('../middleware/audit');

router.get('/', optionalAuthenticate, ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', authenticate, isEntity, (req, res, next) => { req.uploadFolder = 'menu'; next(); }, upload.single('image'), audit('Menu'), ctrl.create);
router.put('/:id', authenticate, isEntity, (req, res, next) => { req.uploadFolder = 'menu'; next(); }, upload.single('image'), audit('Menu'), ctrl.update);
router.get('/:id/history', authenticate, ctrl.getHistory);
router.delete('/:id', authenticate, isEntity, audit('Menu'), ctrl.remove);

module.exports = router;
