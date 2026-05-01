const router = require('express').Router();
const ctrl = require('../controllers/category.controller');
const { authenticate, isSuperAdmin } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getAll);
router.get('/:id', authenticate, ctrl.getOne);
router.post('/', authenticate, isSuperAdmin, ctrl.create);
router.put('/:id', authenticate, isSuperAdmin, ctrl.update);
router.delete('/:id', authenticate, isSuperAdmin, ctrl.remove);

module.exports = router;
