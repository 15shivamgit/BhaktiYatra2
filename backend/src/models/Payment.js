import mongoose from 'mongoose';
import { PAYMENT_RECORD_STATUSES, PAYMENT_VERIFIED_VIA } from '../config/bookings.js';

/**
 * One payment attempt for a booking (docs/03-database/02-models.md "Payment"). Created with the
 * provider order in Phase 5; Razorpay ids, signature checks and webhooks fill it from Phase 6.
 * `providerPaymentId` is unique so a captured payment can never confirm twice.
 */
const paymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    provider: { type: String, enum: ['razorpay', 'stub'], required: true },
    providerOrderId: { type: String, required: true },
    providerPaymentId: { type: String },
    amount: { type: Number, required: true, min: 1 },
    amountPaise: { type: Number, required: true, min: 100 },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: PAYMENT_RECORD_STATUSES, default: 'created', required: true },
    method: { type: String },
    signatureVerified: { type: Boolean, default: false },
    verifiedVia: { type: String, enum: PAYMENT_VERIFIED_VIA },
    /** When the money was captured (revenue is counted by this date). */
    capturedAt: { type: Date },
    webhookEventIds: { type: [String], default: [] },
    failureReason: { type: String },
    refund: {
      type: new mongoose.Schema(
        { providerRefundId: String, amount: Number, method: String, status: String, at: Date },
        { _id: false },
      ),
      default: undefined,
    },
    rawSnapshot: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

paymentSchema.index({ booking: 1, createdAt: -1 });
paymentSchema.index({ providerOrderId: 1 });
paymentSchema.index({ status: 1, capturedAt: -1 });
paymentSchema.index(
  { providerPaymentId: 1 },
  { unique: true, partialFilterExpression: { providerPaymentId: { $type: 'string' } } },
);

export const Payment = mongoose.models.Payment ?? mongoose.model('Payment', paymentSchema);
