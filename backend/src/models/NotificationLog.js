import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = Object.freeze([
  'welcome',
  'booking_confirmed',
  'booking_cancelled',
  'payment_failed',
  'password_reset',
  'cancellation_requested_admin',
  'payment_received_no_seats',
  'contact_received_admin',
  'departure_cancelled',
  'payment_issue_admin',
]);

/**
 * Email queue and delivery record. Sending arrives in Phase 7; until then entries stay
 * `pending`. Payloads must never contain secrets such as reset tokens.
 */
const notificationLogSchema = new mongoose.Schema(
  {
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    dedupeKey: { type: String, required: true, unique: true },
    to: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['pending', 'sending', 'sent', 'failed'], default: 'pending' },
    attempts: { type: Number, default: 0 },
    nextAttemptAt: { type: Date, default: () => new Date() },
    lastError: { type: String },
    sentAt: { type: Date },
  },
  { timestamps: true },
);

notificationLogSchema.index({ status: 1, nextAttemptAt: 1 });

export const NotificationLog =
  mongoose.models.NotificationLog ?? mongoose.model('NotificationLog', notificationLogSchema);
