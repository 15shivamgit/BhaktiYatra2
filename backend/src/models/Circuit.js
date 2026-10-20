import mongoose from 'mongoose';
import { CONTENT_STATUSES } from '../config/content.js';
import { imageSchema, seoSchema } from './shared.js';

const circuitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortDescription: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String },
    /** Ordered: the sequence is the traditional route. */
    temples: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Temple' }], default: [] },
    image: { type: imageSchema, default: undefined },
    region: { type: String, trim: true, maxlength: 80 },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: CONTENT_STATUSES, default: 'draft', required: true },
    publishedAt: { type: Date },
    seo: { type: seoSchema, default: undefined },
    notes: { type: String, maxlength: 4000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

circuitSchema.index({ status: 1, featured: -1 });
circuitSchema.index({ temples: 1 });

export const Circuit = mongoose.models.Circuit ?? mongoose.model('Circuit', circuitSchema);
