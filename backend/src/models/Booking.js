import mongoose from 'mongoose';
import { BOOKING_STATUSES, GENDERS, PAYMENT_STATUSES } from '../config/tours.js';

/*
 * Booking (docs/03-database/02-models.md). The schema is defined in Phase 4 because departure
 * inventory rules (committed seats, cancellation, delete guards) read it; creating bookings,
 * holds and payments arrives in Phases 5 and 6.
 */

const travellerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    age: { type: Number, required: true, min: 1, max: 120 },
    gender: { type: String, enum: GENDERS, required: true },
  },
  { _id: false },
);

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tour: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
    departure: { type: mongoose.Schema.Types.ObjectId, ref: 'TourDeparture', required: true },
    snapshot: {
      tourTitle: { type: String, required: true },
      tourSlug: { type: String, required: true },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      pickupCity: { type: String, default: null },
      durationDays: { type: Number, required: true },
    },
    contact: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, required: true, trim: true },
    },
    travellers: { type: [travellerSchema], default: [] },
    seats: { type: Number, required: true, min: 1, max: 10 },
    unitPrice: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'INR' },
    bookingStatus: { type: String, enum: BOOKING_STATUSES, default: 'pending', required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending', required: true },
    razorpayOrderId: { type: String },
    holdExpiresAt: { type: Date, required: true },
    confirmedAt: { type: Date },
    cancelledAt: { type: Date },
    cancellation: {
      type: new mongoose.Schema(
        {
          requestedAt: Date,
          reason: String,
          departureCancelled: { type: Boolean, default: false },
          processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          refundAmount: Number,
          refundReference: String,
          refundedAt: Date,
        },
        { _id: false },
      ),
      default: undefined,
    },
    notes: {
      type: [
        new mongoose.Schema(
          { by: mongoose.Schema.Types.ObjectId, at: Date, text: String },
          { _id: false },
        ),
      ],
      default: [],
    },
    timeline: {
      type: [
        new mongoose.Schema(
          {
            at: { type: Date, default: Date.now },
            event: { type: String, required: true },
            by: { type: mongoose.Schema.Types.Mixed, default: 'system' },
            meta: { type: mongoose.Schema.Types.Mixed },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { timestamps: true },
);

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ departure: 1, bookingStatus: 1 });
bookingSchema.index({ razorpayOrderId: 1 });
bookingSchema.index({ bookingStatus: 1, holdExpiresAt: 1 });
bookingSchema.index({ 'contact.email': 1 });
bookingSchema.index({ 'contact.phone': 1 });
bookingSchema.index({ createdAt: -1 });

export const Booking = mongoose.models.Booking ?? mongoose.model('Booking', bookingSchema);
