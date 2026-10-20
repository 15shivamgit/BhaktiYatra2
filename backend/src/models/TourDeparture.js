import mongoose from 'mongoose';
import {
  DEFAULT_BOOKING_CUTOFF_HOURS,
  DEPARTURE_STATUSES,
  MAX_DEPARTURE_SEATS,
} from '../config/tours.js';

/**
 * One dated run of a tour with its own seats and price. `seatsAvailable` is changed only by
 * atomic updates in the departures service (and, from Phase 5, the booking hold).
 * Invariant: totalSeats = seatsAvailable + seats of bookings that hold seats.
 */
const departureSchema = new mongoose.Schema(
  {
    tour: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    pickupCity: { type: String, trim: true, maxlength: 60, default: null },
    price: { type: Number, required: true, min: 1 },
    totalSeats: { type: Number, required: true, min: 1, max: MAX_DEPARTURE_SEATS },
    seatsAvailable: { type: Number, required: true, min: 0 },
    status: { type: String, enum: DEPARTURE_STATUSES, default: 'scheduled', required: true },
    bookingCutoffHours: {
      type: Number,
      default: DEFAULT_BOOKING_CUTOFF_HOURS,
      min: 0,
      max: 720,
    },
    pickupInstructions: { type: String, trim: true, maxlength: 500 },
    notes: { type: String, trim: true, maxlength: 2000 },
    cancellation: {
      type: new mongoose.Schema(
        {
          reason: { type: String, trim: true, maxlength: 500 },
          at: { type: Date },
          by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        },
        { _id: false },
      ),
      default: undefined,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

departureSchema.index({ tour: 1, startDate: 1 });
departureSchema.index({ status: 1, startDate: 1 });

export const TourDeparture =
  mongoose.models.TourDeparture ?? mongoose.model('TourDeparture', departureSchema);
