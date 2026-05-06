const router = require('express').Router();
const ctrl = require('../controllers/discount.controller');
const { authenticate, isEntity, optionalAuthenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

const audit = require('../middleware/audit');

// Discounts
router.get('/discounts', optionalAuthenticate, ctrl.getDiscounts);
router.post('/discounts', authenticate, isEntity, (req, res, next) => { req.uploadFolder = 'discounts'; next(); }, upload.single('image'), audit('Discount'), ctrl.createDiscount);
router.put('/discounts/:id', authenticate, isEntity, (req, res, next) => { req.uploadFolder = 'discounts'; next(); }, upload.single('image'), audit('Discount'), ctrl.updateDiscount);
router.delete('/discounts/:id', authenticate, isEntity, audit('Discount'), ctrl.deleteDiscount);
router.get('/:type/:id/history', authenticate, ctrl.getHistory);

// Combos
router.get('/combos', optionalAuthenticate, ctrl.getCombos);
router.post('/combos', authenticate, isEntity, (req, res, next) => { req.uploadFolder = 'combos'; next(); }, upload.single('image'), audit('Combo'), ctrl.createCombo);
router.put('/combos/:id', authenticate, isEntity, (req, res, next) => { req.uploadFolder = 'combos'; next(); }, upload.single('image'), audit('Combo'), ctrl.updateCombo);
router.delete('/combos/:id', authenticate, isEntity, audit('Combo'), ctrl.deleteCombo);

module.exports = router;
