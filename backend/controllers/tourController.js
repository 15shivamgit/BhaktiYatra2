const Tour = require('../models/Tour');

exports.getTours = async (req, res) => {
  try {
    // Search & filter: ?q=nameOrLocation&minPrice=&maxPrice=&sort=price|createdAt
    const { q, minPrice, maxPrice, location, sort, page = 1, limit = 12 } = req.query;
    const filter = {};

    if (q) filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { location: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ];
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (minPrice) filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };

    const skip = (Number(page) - 1) * Number(limit);
    const sortObj = {};
    if (sort === 'price') sortObj.price = 1;
    else if (sort === '-price') sortObj.price = -1;
    else sortObj.createdAt = -1;

    const tours = await Tour.find(filter).sort(sortObj).skip(skip).limit(Number(limit));
    const total = await Tour.countDocuments(filter);

    res.json({ success: true, tours, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTourById = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, tour });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTour = async (req, res) => {
  try {
    // images uploaded via multer => req.files
    const images = (req.files || []).map(f => '/uploads/' + f.filename);
    const body = req.body;
    // if inclusions passed as comma string -> split
    if (body.inclusions && typeof body.inclusions === 'string') {
      body.inclusions = body.inclusions.split(',').map(s => s.trim());
    }
    const tour = new Tour({ ...body, images });
    await tour.save();
    res.json({ success: true, tour });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) return res.status(404).json({ success: false, message: 'Not found' });
    const images = (req.files || []).map(f => '/uploads/' + f.filename);
    Object.assign(tour, req.body);
    if (images.length) tour.images = tour.images.concat(images);
    await tour.save();
    res.json({ success: true, tour });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
