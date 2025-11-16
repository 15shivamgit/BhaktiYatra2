const Temple = require('../models/Temple');

exports.createTemple = async (req, res) => {
  try {
    const { name, location, description, tags } = req.body;
    const images = (req.files || []).map(f => '/uploads/' + f.filename);
    const temple = new Temple({ name, location, description, tags: tags || [], images });
    await temple.save();
    res.json(temple);
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

exports.getTemples = async (req, res) => {
  try {
    const temples = await Temple.find().sort({ createdAt: -1 });
    res.json(temples);
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

exports.getTempleById = async (req, res) => {
  try {
    const temple = await Temple.findById(req.params.id);
    if (!temple) return res.status(404).json({ msg: 'Not found' });
    res.json(temple);
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

exports.updateTemple = async (req, res) => {
  try {
    const temple = await Temple.findById(req.params.id);
    if (!temple) return res.status(404).json({ msg: 'Not found' });
    const images = (req.files || []).map(f => '/uploads/' + f.filename);
    Object.assign(temple, req.body);
    if (images.length) temple.images = temple.images.concat(images);
    await temple.save();
    res.json(temple);
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

exports.deleteTemple = async (req, res) => {
  try {
    await Temple.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Deleted' });
  } catch (err) { res.status(500).json({ msg: err.message }); }
};
