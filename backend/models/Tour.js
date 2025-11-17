const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },  // single image now
  description: String,
  durationDays: Number,
  seatsAvailable: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Tour', tourSchema);
