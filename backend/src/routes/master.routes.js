const router = require('express').Router();
const ctrl = require('../controllers/master.controller');
const { authenticate, isAdmin } = require('../middleware/auth');

// Event Types
router.get('/event-types', authenticate, ctrl.eventTypes.getAll);
router.post('/event-types', authenticate, isAdmin, ctrl.eventTypes.create);
router.put('/event-types/:id', authenticate, isAdmin, ctrl.eventTypes.update);
router.delete('/event-types/:id', authenticate, isAdmin, ctrl.eventTypes.remove);

// Performers
router.get('/performers', authenticate, ctrl.performers.getAll);
router.post('/performers', authenticate, isAdmin, ctrl.performers.create);
router.put('/performers/:id', authenticate, isAdmin, ctrl.performers.update);
router.delete('/performers/:id', authenticate, isAdmin, ctrl.performers.remove);

// Menu Categories
router.get('/menu-categories', authenticate, ctrl.menuCategories.getAll);
router.post('/menu-categories', authenticate, isAdmin, ctrl.menuCategories.create);
router.put('/menu-categories/:id', authenticate, isAdmin, ctrl.menuCategories.update);
router.delete('/menu-categories/:id', authenticate, isAdmin, ctrl.menuCategories.remove);

// Cuisine Types
router.get('/cuisine-types', authenticate, ctrl.cuisineTypes.getAll);
router.post('/cuisine-types', authenticate, isAdmin, ctrl.cuisineTypes.create);
router.put('/cuisine-types/:id', authenticate, isAdmin, ctrl.cuisineTypes.update);
router.delete('/cuisine-types/:id', authenticate, isAdmin, ctrl.cuisineTypes.remove);

module.exports = router;
