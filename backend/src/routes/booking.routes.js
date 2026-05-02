const router = require('express').Router();
const ctrl = require('../controllers/booking.controller');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getAll);
router.get('/:id', authenticate, ctrl.getOne);
router.post('/', optionalAuthenticate, ctrl.create);
router.get('/guests', authenticate, ctrl.getGuestList);
router.patch('/:id/cancel', authenticate, ctrl.cancel);
router.patch('/:id/status', authenticate, ctrl.changeStatus);

module.exports = router;
