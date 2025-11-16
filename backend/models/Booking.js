const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
  userName: { type: String, required: true },
  userEmail: { type: String },
  userPhone: { type: String },
  seatsBooked: { type: Number, default: 1 },
  totalAmount: { type: Number },
  status: { type: String, default: 'pending' } // pending, confirmed, cancelled
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
