const mongoose = require('mongoose');

const templeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: String,
  description: String,
  images: [String], // urls: /uploads/...
  tags: [String]
}, { timestamps: true });

module.exports = mongoose.model('Temple', templeSchema);
