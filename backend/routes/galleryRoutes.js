const router = require('express').Router();
const multer = require('multer');
const galleryCtrl = require('../controllers/galleryController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.get('/', galleryCtrl.getGallery);
router.post('/', protect, adminOnly, upload.single('image'), galleryCtrl.uploadImage);

module.exports = router;
