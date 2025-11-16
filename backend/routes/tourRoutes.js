// import express from "express";
// import Tour from "../models/Tour.js";

// const router = express.Router();

// // GET all tours
// router.get("/", async (req, res) => {
//   try {
//     const tours = await Tour.find();
//     res.json({ success: true, tours });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Failed to fetch tours" });
//   }
// });

// // ADD new tour (optional)
// router.post("/", async (req, res) => {
//   try {
//     const tour = new Tour(req.body);
//     await tour.save();
//     res.json({ success: true, tour });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Failed to add tour" });
//   }
// });

// export default router;





const router = require('express').Router();
const multer = require('multer');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const tourCtrl = require('../controllers/tourController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.get('/', tourCtrl.getTours);
router.get('/:id', tourCtrl.getTourById);

// admin routes
router.post('/', protect, adminOnly, upload.array('images', 6), tourCtrl.createTour);
router.put('/:id', protect, adminOnly, upload.array('images', 6), tourCtrl.updateTour);
router.delete('/:id', protect, adminOnly, tourCtrl.deleteTour);

module.exports = router;
