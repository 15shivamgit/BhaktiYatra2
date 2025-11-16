const Booking = require('../models/Booking');
const Tour = require('../models/Tour');

exports.createBooking = async (req, res) => {
  try {
    const { tour: tourId, userName, userEmail, userPhone, seatsBooked } = req.body;
    const tour = await Tour.findById(tourId);
    if (!tour) return res.status(404).json({ success: false, message: 'Tour not found' });

    if (tour.seatsAvailable < seatsBooked) {
      return res.status(400).json({ success: false, message: 'Not enough seats available' });
    }

    const totalAmount = Number(tour.price) * Number(seatsBooked);

    const booking = new Booking({
      tour: tourId,
      userName, userEmail, userPhone, seatsBooked, totalAmount
    });
    await booking.save();

    // reduce seats
    tour.seatsAvailable = tour.seatsAvailable - seatsBooked;
    await tour.save();

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('tour').sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBookingsByUser = async (req, res) => {
  try {
    const email = req.query.email;
    const filter = email ? { userEmail: email } : {};
    const bookings = await Booking.find(filter).populate('tour').sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
