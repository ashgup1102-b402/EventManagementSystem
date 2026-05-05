const router = require('express').Router();
const ctrl = require('../controllers/slot.controller');
const { authenticate, isEntity, optionalAuthenticate } = require('../middleware/auth');

const audit = require('../middleware/audit');

router.get('/', optionalAuthenticate, ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', authenticate, isEntity, audit('Slot'), ctrl.create);
router.put('/:id', authenticate, isEntity, audit('Slot'), ctrl.update);
router.get('/:id/history', authenticate, ctrl.getHistory);
router.delete('/:id', authenticate, isEntity, audit('Slot'), ctrl.remove);

module.exports = router;
