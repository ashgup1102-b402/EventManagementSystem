const router = require('express').Router();
const { login, register, me, changePassword, updateProfile } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticate, me);
router.put('/change-password', authenticate, changePassword);
router.put('/profile', authenticate, updateProfile);

module.exports = router;
