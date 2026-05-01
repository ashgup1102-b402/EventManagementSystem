const router = require('express').Router();
const ctrl = require('../controllers/event.controller');
const { authenticate, isEntity } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', authenticate, isEntity, (req, res, next) => { req.uploadFolder = 'events'; next(); }, upload.single('image'), ctrl.create);
router.put('/:id', authenticate, isEntity, (req, res, next) => { req.uploadFolder = 'events'; next(); }, upload.single('image'), ctrl.update);
router.get('/:id/history', authenticate, ctrl.getHistory);
router.delete('/:id', authenticate, isEntity, ctrl.remove);

module.exports = router;
