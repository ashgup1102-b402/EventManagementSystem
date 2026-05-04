const router = require('express').Router();
const ctrl = require('../controllers/entity.controller');
const { authenticate, isAdmin, isEntity } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public
router.get('/', ctrl.getAll);
router.get('/my', authenticate, ctrl.getMyEntity);
router.put('/my', authenticate, ctrl.updateMyEntity);
router.get('/:id', ctrl.getOne);
router.get('/:id/history', authenticate, ctrl.getEntityHistory);

// Protected
router.post('/', authenticate, isAdmin, (req, res, next) => { req.uploadFolder = 'properties'; next(); }, upload.single('cover_image'), ctrl.create);
router.put('/:id', authenticate, (req, res, next) => { req.uploadFolder = 'properties'; next(); }, upload.any(), ctrl.update);
router.delete('/:id', authenticate, isAdmin, ctrl.remove);

module.exports = router;
