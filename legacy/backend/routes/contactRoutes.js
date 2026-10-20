const router = require('express').Router();
const contactCtrl = require('../controllers/contactController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', contactCtrl.createContact);
router.get('/', protect, adminOnly, contactCtrl.getContacts);

module.exports = router;
