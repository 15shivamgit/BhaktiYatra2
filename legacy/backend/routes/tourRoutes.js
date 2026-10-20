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



router.patch('/:id/update-seats', protect, adminOnly, async (req, res) => {
  try {
    const { seatsAvailable } = req.body;
    const tour = await Tour.findById(req.params.id);
    if (!tour) return res.status(404).json({ success: false, message: "Tour not found" });

    tour.seatsAvailable = seatsAvailable;
    await tour.save();

    res.json({ success: true, tour });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;
