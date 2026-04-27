const router = require('express').Router();
const ctrl = require('../controllers/whatsapp.controller');
const { authenticate, isProperty } = require('../middleware/auth');

router.use(authenticate);
router.post('/init-session', isProperty, ctrl.initSession);
router.get('/qr/:session_id', isProperty, ctrl.getQR);
router.post('/send-promotion', isProperty, ctrl.sendPromotion);
router.get('/logs', isProperty, ctrl.getLogs);

module.exports = router;
