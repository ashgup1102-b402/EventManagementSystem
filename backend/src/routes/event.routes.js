const router = require('express').Router();
const ctrl = require('../controllers/event.controller');
const { authenticate, isProperty } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', authenticate, isProperty, (req, res, next) => { req.uploadFolder = 'events'; next(); }, upload.single('image'), ctrl.create);
router.put('/:id', authenticate, isProperty, (req, res, next) => { req.uploadFolder = 'events'; next(); }, upload.single('image'), ctrl.update);
router.delete('/:id', authenticate, isProperty, ctrl.remove);

module.exports = router;
