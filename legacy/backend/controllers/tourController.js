const Tour = require('../models/Tour');

exports.getTours = async (req, res) => {
  try {
    const tours = await Tour.find().sort({ createdAt: -1 });
    res.json({ success: true, tours });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTourById = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) return res.status(404).json({ success: false, message: "Tour not found" });

    res.json({ success: true, tour });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTour = async (req, res) => {
  try {
    const { name, price, seatsAvailable } = req.body;
    const image = req.file ? "/uploads/" + req.file.filename : null; // single image

    const newTour = new Tour({
      name,
      price,
      seatsAvailable: Number(seatsAvailable),
      image
    });

    await newTour.save();
    res.json({ success: true, tour: newTour });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const { name, price } = req.body;
    const tour = await Tour.findById(req.params.id);
    if (!tour) return res.status(404).json({ success: false, message: "Tour not found" });

    // update normal fields
    tour.name = name || tour.name;
    tour.price = price || tour.price;
    tour.seatsAvailable = seatsAvailable || tour.seatsAvailable;

    // update image if new file selected
    if (req.file) {
      tour.image = "/uploads/" + req.file.filename;
    }

    await tour.save();
    res.json({ success: true, tour });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Tour deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
