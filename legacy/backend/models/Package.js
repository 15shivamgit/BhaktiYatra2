const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: Number,
  durationDays: Number,
  itinerary: String,
  inclusions: [String],
  images: [String],
  seatsAvailable: Number
}, { timestamps: true });

module.exports = mongoose.model('Package', packageSchema);
