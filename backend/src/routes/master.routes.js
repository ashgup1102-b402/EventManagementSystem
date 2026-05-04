const router = require('express').Router();
const ctrl = require('../controllers/master.controller');
const { authenticate, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const setUploadFolder = (folder) => (req, res, next) => { req.uploadFolder = folder; next(); };

// Event Types
router.get('/event-types', authenticate, ctrl.eventTypes.getAll);
router.post('/event-types', authenticate, isAdmin, setUploadFolder('masters'), upload.single('image'), ctrl.eventTypes.create);
router.put('/event-types/:id', authenticate, isAdmin, setUploadFolder('masters'), upload.single('image'), ctrl.eventTypes.update);
router.delete('/event-types/:id', authenticate, isAdmin, ctrl.eventTypes.remove);

// Performers
router.get('/performers', authenticate, ctrl.performers.getAll);
router.post('/performers', authenticate, isAdmin, ctrl.performers.create);
router.put('/performers/:id', authenticate, isAdmin, ctrl.performers.update);
router.delete('/performers/:id', authenticate, isAdmin, ctrl.performers.remove);

// Menu Categories
router.get('/menu-categories', authenticate, ctrl.menuCategories.getAll);
router.post('/menu-categories', authenticate, isAdmin, setUploadFolder('masters'), upload.single('image'), ctrl.menuCategories.create);
router.put('/menu-categories/:id', authenticate, isAdmin, setUploadFolder('masters'), upload.single('image'), ctrl.menuCategories.update);
router.delete('/menu-categories/:id', authenticate, isAdmin, ctrl.menuCategories.remove);

// Cuisine Types
router.get('/cuisine-types', authenticate, ctrl.cuisineTypes.getAll);
router.post('/cuisine-types', authenticate, isAdmin, setUploadFolder('masters'), upload.single('image'), ctrl.cuisineTypes.create);
router.put('/cuisine-types/:id', authenticate, isAdmin, setUploadFolder('masters'), upload.single('image'), ctrl.cuisineTypes.update);
router.delete('/cuisine-types/:id', authenticate, isAdmin, ctrl.cuisineTypes.remove);

module.exports = router;
