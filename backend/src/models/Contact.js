import mongoose from 'mongoose';

export const CONTACT_STATUSES = Object.freeze(['new', 'read', 'replied', 'spam']);

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 20 },
    subject: { type: String, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: CONTACT_STATUSES, default: 'new', required: true },
    /** SHA-256 of the sender IP: enough to spot abuse without storing the address. */
    ipHash: { type: String },
  },
  { timestamps: true },
);

contactSchema.index({ status: 1, createdAt: -1 });

export const Contact = mongoose.models.Contact ?? mongoose.model('Contact', contactSchema);
