const Booking = require("../models/Booking");
const Tour = require("../models/Tour");

const Razorpay = require("razorpay");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// 🔹 User ka "Book Now" → yahan aata hai → Razorpay order + pending booking
exports.createBooking = async (req, res) => {
  try {
    const { tour, seatsBooked, userName, userEmail, userPhone } = req.body;

    const foundTour = await Tour.findById(tour);
    if (!foundTour)
      return res.json({ success: false, message: "Tour not found" });

    if (foundTour.seatsAvailable < seatsBooked) {
      return res.json({
        success: false,
        message: `Only ${foundTour.seatsAvailable} seats left`,
      });
    }

    const amount = foundTour.price * seatsBooked * 100; // paise

    // Razorpay order
    const rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await rzp.orders.create({
      amount,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    });

    // DB me pending booking create
    const booking = await Booking.create({
      tour,
      userName,
      userEmail,
      userPhone,
      seatsBooked,
      totalAmount: amount / 100,
      paymentStatus: "pending",
      razorpayOrderId: order.id,
    });

    res.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: amount / 100,
      bookingId: booking._id,
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err.message });
  }
};

// 🔹 Payment success hone ke baad frontend yahan hit karega
exports.verifyPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId).populate("tour");
    if (!booking)
      return res.json({ success: false, message: "Booking not found" });

    // 1) Seats reduce in tour
    booking.tour.seatsAvailable -= booking.seatsBooked;
    await booking.tour.save();

    // 2) Booking status update
    booking.paymentStatus = "paid";
    await booking.save();

    // 3) Tickets folder ensure
    const ticketsDir = path.join(__dirname, "..", "tickets");
    if (!fs.existsSync(ticketsDir)) fs.mkdirSync(ticketsDir);

    // 4) Ticket PDF generate
    const ticketPath = path.join(ticketsDir, `ticket_${booking._id}.pdf`);
    const pdf = new PDFDocument();
    pdf.pipe(fs.createWriteStream(ticketPath));

    pdf.fontSize(24).text("🎫 BhaktiYatra Ticket", { align: "center" });
    pdf.moveDown();
    pdf.fontSize(14);
    pdf.text(`Passenger: ${booking.userName}`);
    pdf.text(`Email: ${booking.userEmail}`);
    pdf.text(`Tour: ${booking.tour.title || booking.tour.name}`);
    pdf.text(`Seats Booked: ${booking.seatsBooked}`);
    pdf.text(`Amount Paid: ₹${booking.totalAmount}`);
    pdf.moveDown();

    const qrText = `Booking ID: ${booking._id}`;
    const qrBase64 = await QRCode.toDataURL(qrText);
    const qrBuffer = Buffer.from(qrBase64.split(",")[1], "base64");
    pdf.image(qrBuffer, { fit: [120, 120], align: "left" });

    pdf.moveDown(2);
    pdf.fontSize(10).text("Thank you for choosing BhaktiYatra!", {
      align: "center",
    });

    pdf.end();

    // 5) Ticket path save for download
    booking.ticketPDF = `/tickets/ticket_${booking._id}.pdf`;
    await booking.save();

    // 6) Email send
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: `BhaktiYatra <${process.env.SMTP_USER}>`,
      to: booking.userEmail,
      subject: "Your BhaktiYatra Ticket",
      html: `<h3>Your ticket is confirmed ✅</h3>
             <p>Tour: <b>${booking.tour.title || booking.tour.name}</b></p>
             <p>Seats: <b>${booking.seatsBooked}</b></p>
             <p>Ticket PDF attached.</p>`,
      attachments: [{ filename: "ticket.pdf", path: ticketPath }],
    });

    res.json({
      success: true,
      message: "Payment verified, Ticket sent!",
      ticketPath: booking.ticketPDF,
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err.message });
  }
};

// 🔹 Logged-in user ke bookings
exports.getMyBookings = async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id }).populate("tour");
  res.json({ success: true, bookings });
};

// 🔹 Admin ke liye sab bookings
exports.getBookingsAdmin = async (req, res) => {
  const bookings = await Booking.find().populate("user").populate("tour");
  res.json({ success: true, bookings });
};
