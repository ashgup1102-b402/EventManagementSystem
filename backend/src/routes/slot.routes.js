const router = require('express').Router();
const ctrl = require('../controllers/slot.controller');
const { authenticate, isProperty } = require('../middleware/auth');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', authenticate, isProperty, ctrl.create);
router.put('/:id', authenticate, isProperty, ctrl.update);
router.delete('/:id', authenticate, isProperty, ctrl.remove);

module.exports = router;
