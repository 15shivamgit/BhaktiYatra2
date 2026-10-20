const router = require("express").Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const bookingCtrl = require("../controllers/bookingController");
const Booking = require("../models/Booking");

// User booking → Razorpay order + pending booking
router.post("/", protect, bookingCtrl.createBooking);

// Payment verify + ticket + email
router.post("/verify-payment", protect, bookingCtrl.verifyPayment);

// Logged-in user bookings
router.get("/my", protect, bookingCtrl.getMyBookings);

// Admin bookings list
router.get("/admin", protect, adminOnly, bookingCtrl.getBookingsAdmin);

// Admin change booking status (confirmed / cancelled)
router.put("/status/:id", protect, adminOnly, async (req, res) => {
  const { status } = req.body;
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.json({ success: false, message: "Not found" });

    booking.status = status;
    await booking.save();

    res.json({ success: true, booking });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

module.exports = router;
