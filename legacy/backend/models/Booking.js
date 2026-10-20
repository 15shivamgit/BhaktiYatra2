const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tour: { type: mongoose.Schema.Types.ObjectId, ref: "Tour", required: true },
    seats: { type: Number, required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: "paid" }, // paid / confirmed / cancelled
    paymentId: String,
    orderId: String,
    invoiceNumber: String,
    ticketPdfPath: String,
    userName: String,
    userEmail: String,
    userPhone: String,
    seatsBooked: Number,
    totalAmount: Number
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
