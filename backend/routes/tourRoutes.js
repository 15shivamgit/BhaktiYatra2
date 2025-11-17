const router = require('express').Router();
const multer = require('multer');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const tourCtrl = require('../controllers/tourController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

// Public routes
router.get('/', tourCtrl.getTours);
router.get('/:id', tourCtrl.getTourById);

// Admin routes
router.post('/', protect, adminOnly, upload.single('image'), tourCtrl.createTour);
router.put('/:id', protect, adminOnly, upload.single('image'), tourCtrl.updateTour);
router.delete('/:id', protect, adminOnly, tourCtrl.deleteTour);

module.exports = router;
