import mongoose from 'mongoose';

/** Named sequences, e.g. "invoice:2026" → 42. Incremented atomically with $inc. */
const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false },
);

export const Counter = mongoose.models.Counter ?? mongoose.model('Counter', counterSchema);

/** Next value of a sequence (1 for a new one). Safe under concurrency. */
export async function nextSequence(name) {
  const doc = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' },
  );
  return doc.seq;
}
