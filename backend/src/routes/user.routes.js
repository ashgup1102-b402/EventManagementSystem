const router = require('express').Router();
const { getAll, getOne, create, update, remove } = require('../controllers/user.controller');
const { authenticate, isAdmin, isSuperAdmin } = require('../middleware/auth');

router.use(authenticate);
router.get('/', isAdmin, getAll);
router.get('/:id', isAdmin, getOne);
router.post('/', isAdmin, create);
router.put('/:id', isAdmin, update);
router.delete('/:id', isSuperAdmin, remove);

module.exports = router;
