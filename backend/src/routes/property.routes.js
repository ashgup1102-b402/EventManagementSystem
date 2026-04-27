const router = require('express').Router();
const ctrl = require('../controllers/property.controller');
const { authenticate, isAdmin, isProperty } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public
router.get('/', (req, res, next) => { req.uploadFolder = 'properties'; next(); }, ctrl.getAll);
router.get('/my', authenticate, ctrl.getMyProperty);
router.get('/:id', ctrl.getOne);

// Protected
router.post('/', authenticate, isAdmin, (req, res, next) => { req.uploadFolder = 'properties'; next(); }, upload.single('cover_image'), ctrl.create);
router.put('/:id', authenticate, isProperty, (req, res, next) => { req.uploadFolder = 'properties'; next(); }, upload.single('cover_image'), ctrl.update);
router.delete('/:id', authenticate, isAdmin, ctrl.remove);

module.exports = router;
