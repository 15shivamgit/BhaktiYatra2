const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  title: String,
  imageUrl: String,
  caption: String
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);
