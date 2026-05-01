const router = require('express').Router();
const { login, register, me, changePassword, updateProfile } = require('../controllers/auth.controller');
const roleCtrl = require('../controllers/role.controller');
const { authenticate, isSuperAdmin } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticate, me);
router.put('/change-password', authenticate, changePassword);
router.put('/profile', authenticate, updateProfile);

// Roles & Authorizations
router.get('/roles', authenticate, roleCtrl.getRoles);
router.post('/roles', authenticate, isSuperAdmin, roleCtrl.createRole);
router.put('/roles/:id', authenticate, isSuperAdmin, roleCtrl.updateRole);
router.delete('/roles/:id', authenticate, isSuperAdmin, roleCtrl.removeRole);
router.get('/authorizations', authenticate, roleCtrl.getAuthorizations);
router.post('/authorizations/bulk', authenticate, isSuperAdmin, roleCtrl.updateAuthorizationsBulk);

module.exports = router;
