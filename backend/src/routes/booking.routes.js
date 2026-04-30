const router = require('express').Router();
const ctrl = require('../controllers/booking.controller');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getAll);
router.get('/:id', authenticate, ctrl.getOne);
router.post('/', optionalAuthenticate, ctrl.create);
router.patch('/:id/cancel', authenticate, ctrl.cancel);

module.exports = router;
