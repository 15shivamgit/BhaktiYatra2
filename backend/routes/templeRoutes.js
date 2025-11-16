const router = require('express').Router();
const multer = require('multer');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const templeCtrl = require('../controllers/templeController');

const storage = multer.diskStorage({
  destination: function(req, file, cb){ cb(null, 'uploads/'); },
  filename: function(req, file, cb){ cb(null, Date.now() + '-' + file.originalname); }
});
const upload = multer({ storage });

router.get('/', templeCtrl.getTemples);
router.get('/:id', templeCtrl.getTempleById);

// Admin routes
router.post('/', protect, adminOnly, upload.array('images', 6), templeCtrl.createTemple);
router.put('/:id', protect, adminOnly, upload.array('images', 6), templeCtrl.updateTemple);
router.delete('/:id', protect, adminOnly, templeCtrl.deleteTemple);

module.exports = router;
