const router = require("express").Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { protect } = require("../middleware/authMiddleware");
//const Booking = require("../models/Booking");
//const Tour = require("../models/Tour");

const { sendBookingEmail } = require("../utils/email");
const { generateTicketPdf } = require("../utils/ticketPdf");
const Booking = require("../models/Booking");
const Tour = require("../models/Tour");
const User = require("../models/User");


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 1) Create Razorpay Order
router.post("/create-order", protect, async (req, res) => {
  try {
    const { tourId, seats } = req.body;

    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ success: false, message: "Tour not found" });
    }

    const amount = tour.price * seats * 100; // Razorpay in paise

    const options = {
      amount,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    return res.json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
      amount,
      tourName: tour.name,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2) Payment Verification + Booking Create
router.post("/verify", protect, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      tourId,
      seats,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }

    const tour = await Tour.findById(tourId);
    const user = await User.findById(req.user.id);

    const baseAmount = tour.price * seats;
    const gstAmount = Math.round(baseAmount * 0.18);
    const totalAmount = baseAmount + gstAmount;

    // 1) Booking save karo
    const booking = new Booking({
      user: req.user.id,
      tour: tourId,
      seats,
      amount: totalAmount,
      status: "paid",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      invoiceNumber: `INV-${Date.now()}`
    });

    await booking.save();

    // 2) Ticket + Invoice PDF generate karo
    const pdfPath = await generateTicketPdf(booking, user, tour);
    booking.ticketPdfPath = pdfPath;
    await booking.save();

    // 3) Email user ko bhejo
    await sendBookingEmail({
      to: user.email,
      subject: "BhaktiYatra - Booking Confirmed",
      text: `Dear ${user.name}, your booking is confirmed for ${tour.name}.`,
      html: `<p>Dear ${user.name},</p>
             <p>Your booking is <b>confirmed</b> for <b>${tour.name}</b>.</p>
             <p>Attached is your ticket & invoice PDF.</p>
             <p>Jai Shree Ram 🙏</p>`,
      attachments: [
        {
          filename: `ticket_${booking._id}.pdf`,
          path: pdfPath,
        },
      ],
    });

    return res.json({ success: true, booking });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;
