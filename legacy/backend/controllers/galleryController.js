const Gallery = require('../models/Gallery');

exports.uploadImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ msg: 'No file' });
    const g = new Gallery({ title: req.body.title || '', imageUrl: '/uploads/' + file.filename, caption: req.body.caption || '' });
    await g.save();
    res.json(g);
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

exports.getGallery = async (req, res) => {
  try {
    const items = await Gallery.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) { res.status(500).json({ msg: err.message }); }
};
