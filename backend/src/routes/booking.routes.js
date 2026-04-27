const router = require('express').Router();
const ctrl = require('../controllers/booking.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.patch('/:id/cancel', ctrl.cancel);

module.exports = router;
