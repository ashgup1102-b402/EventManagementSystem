const router = require('express').Router();
const ctrl = require('../controllers/entity.controller');
const { authenticate, isAdmin, isEntity } = require('../middleware/auth');
const upload = require('../middleware/upload');

const audit = require('../middleware/audit');

// Public
router.get('/', ctrl.getAll);
router.get('/my', authenticate, ctrl.getMyEntity);
router.put('/my', authenticate, audit('Entity'), ctrl.updateMyEntity);
router.get('/:id', ctrl.getOne);
router.get('/:id/history', authenticate, ctrl.getEntityHistory);

// Protected
router.post('/', authenticate, isAdmin, (req, res, next) => { req.uploadFolder = 'properties'; next(); }, upload.single('cover_image'), audit('Entity'), ctrl.create);
router.put('/:id', authenticate, (req, res, next) => { req.uploadFolder = 'properties'; next(); }, upload.any(), audit('Entity'), ctrl.update);
router.delete('/:id', authenticate, isAdmin, audit('Entity'), ctrl.remove);

module.exports = router;
