const router = require('express').Router();
const multer = require('multer');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const pkgCtrl = require('../controllers/packageController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.get('/', pkgCtrl.getPackages);
router.get('/:id', pkgCtrl.getPackageById);

router.post('/', protect, adminOnly, upload.array('images', 6), pkgCtrl.createPackage);
router.put('/:id', protect, adminOnly, upload.array('images', 6), pkgCtrl.updatePackage);
router.delete('/:id', protect, adminOnly, pkgCtrl.deletePackage);

module.exports = router;
