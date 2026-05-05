const router = require('express').Router();
const ctrl = require('../controllers/whatsapp.controller');
const { authenticate, isEntity } = require('../middleware/auth');
const audit = require('../middleware/audit');

router.use(authenticate);
router.post('/init-session', isEntity, audit('WhatsApp'), ctrl.initSession);
router.get('/qr/:session_id', isEntity, ctrl.getQR);
router.post('/send-promotion', isEntity, audit('WhatsApp'), ctrl.sendPromotion);
router.get('/logs', isEntity, ctrl.getLogs);

module.exports = router;
