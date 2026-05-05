const router = require('express').Router();
const ctrl = require('../controllers/event.controller');
const { authenticate, isEntity, optionalAuthenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

const audit = require('../middleware/audit');

router.get('/', optionalAuthenticate, ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', authenticate, isEntity, (req, res, next) => { req.uploadFolder = 'events'; next(); }, upload.single('image'), audit('Event'), ctrl.create);
router.put('/:id', authenticate, isEntity, (req, res, next) => { req.uploadFolder = 'events'; next(); }, upload.single('image'), audit('Event'), ctrl.update);
router.get('/:id/history', authenticate, ctrl.getHistory);
router.delete('/:id', authenticate, isEntity, audit('Event'), ctrl.remove);

module.exports = router;
