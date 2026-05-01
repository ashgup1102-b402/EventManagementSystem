const router = require('express').Router();
const { getAll, getOne, create, update, remove, updateMe } = require('../controllers/user.controller');
const { authenticate, isAdmin, isSuperAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Profile route must be BEFORE /:id to avoid UUID parsing errors
router.put('/profile', authenticate, (req, res, next) => { req.uploadFolder = 'users'; next(); }, upload.single('profile_photo'), updateMe);

router.use(authenticate);
router.get('/', isAdmin, getAll);
router.post('/', isAdmin, create);
router.get('/:id', isAdmin, getOne);
router.put('/:id', isAdmin, update);
router.delete('/:id', isSuperAdmin, remove);

module.exports = router;
