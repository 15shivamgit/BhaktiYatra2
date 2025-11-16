const Contact = require('../models/Contact');

exports.createContact = async (req, res) => {
  try {
    const { name, email, message, phone } = req.body;
    const c = new Contact({ name, email, message, phone });
    await c.save();
    // TODO: send email to admin using nodemailer if needed
    res.json({ msg: 'Message received' });
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

exports.getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) { res.status(500).json({ msg: err.message }); }
};
