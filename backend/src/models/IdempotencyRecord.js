import mongoose from 'mongoose';
import { IDEMPOTENCY_TTL_MIN } from '../config/bookings.js';

/**
 * Stored response for an `Idempotency-Key` (per user), so a double click or a network retry of
 * POST /bookings returns the first result instead of holding seats twice. Kept in MongoDB so it
 * works across restarts; MongoDB's TTL monitor removes records after IDEMPOTENCY_TTL_MIN.
 */
const idempotencySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    key: { type: String, required: true },
    scope: { type: String, required: true },
    requestHash: { type: String, required: true },
    state: { type: String, enum: ['in_progress', 'done'], default: 'in_progress' },
    statusCode: { type: Number },
    body: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now, expires: IDEMPOTENCY_TTL_MIN * 60 },
  },
  { versionKey: false },
);

idempotencySchema.index({ user: 1, scope: 1, key: 1 }, { unique: true });

export const IdempotencyRecord =
  mongoose.models.IdempotencyRecord ?? mongoose.model('IdempotencyRecord', idempotencySchema);
