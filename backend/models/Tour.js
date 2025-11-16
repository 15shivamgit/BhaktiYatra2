const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String, required: true },
  images: [String], // array of image urls (/uploads/...)
  price: { type: Number, required: true },
  durationDays: Number,
  itinerary: String,
  inclusions: [String],
  description: String,
  seatsAvailable: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Tour', tourSchema);
