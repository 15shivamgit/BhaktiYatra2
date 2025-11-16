const Package = require('../models/Package');

exports.createPackage = async (req, res) => {
  try {
    const images = (req.files || []).map(f => '/uploads/' + f.filename);
    const pkg = new Package({ ...req.body, images });
    await pkg.save();
    res.json(pkg);
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

exports.getPackages = async (req, res) => {
  try {
    const pkgs = await Package.find().sort({ createdAt: -1 });
    res.json(pkgs);
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

exports.getPackageById = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ msg: 'Not found' });
    res.json(pkg);
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

exports.updatePackage = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ msg: 'Not found' });
    const images = (req.files || []).map(f => '/uploads/' + f.filename);
    Object.assign(pkg, req.body);
    if (images.length) pkg.images = pkg.images.concat(images);
    await pkg.save();
    res.json(pkg);
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

exports.deletePackage = async (req, res) => {
  try {
    await Package.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Deleted' });
  } catch (err) { res.status(500).json({ msg: err.message }); }
};
