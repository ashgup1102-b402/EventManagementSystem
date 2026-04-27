const router = require('express').Router();
const ctrl = require('../controllers/discount.controller');
const { authenticate, isProperty } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Discounts
router.get('/discounts', ctrl.getDiscounts);
router.post('/discounts', authenticate, isProperty, ctrl.createDiscount);
router.put('/discounts/:id', authenticate, isProperty, ctrl.updateDiscount);
router.delete('/discounts/:id', authenticate, isProperty, ctrl.deleteDiscount);

// Combos
router.get('/combos', ctrl.getCombos);
router.post('/combos', authenticate, isProperty, (req, res, next) => { req.uploadFolder = 'combos'; next(); }, upload.single('image'), ctrl.createCombo);
router.put('/combos/:id', authenticate, isProperty, (req, res, next) => { req.uploadFolder = 'combos'; next(); }, upload.single('image'), ctrl.updateCombo);
router.delete('/combos/:id', authenticate, isProperty, ctrl.deleteCombo);

module.exports = router;
