const router = require('express').Router();
const ctrl = require('../controllers/slot.controller');
const { authenticate, isEntity } = require('../middleware/auth');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', authenticate, isEntity, ctrl.create);
router.put('/:id', authenticate, isEntity, ctrl.update);
router.delete('/:id', authenticate, isEntity, ctrl.remove);

module.exports = router;
