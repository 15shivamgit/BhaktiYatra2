const router = require('express').Router();
const bookingCtrl = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', bookingCtrl.createBooking); // public booking
router.get('/', protect, adminOnly, bookingCtrl.getBookings); // admin view all
router.get('/my', bookingCtrl.getBookingsByUser); // ?email=user@example.com

module.exports = router;
