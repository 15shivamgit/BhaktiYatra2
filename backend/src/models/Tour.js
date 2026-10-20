import mongoose from 'mongoose';
import { CONTENT_STATUSES } from '../config/content.js';
import { MEALS } from '../config/tours.js';
import { imageSchema, seoSchema } from './shared.js';

const itineraryDaySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true, min: 1 },
    title: { type: String, trim: true, maxlength: 120, default: '' },
    description: { type: String, default: '' },
    meals: { type: [{ type: String, enum: MEALS }], default: [] },
    stay: { type: String, trim: true, maxlength: 120, default: '' },
  },
  { _id: false },
);

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 200 },
    answer: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { _id: false },
);

/** A pilgrimage tour product (docs/03-database/02-models.md "Tour"). Dates live on departures. */
const tourSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 4, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    summary: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, default: '' },
    highlights: { type: [{ type: String, trim: true, maxlength: 160 }], default: [] },
    temples: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Temple' }], default: [] },
    destinations: { type: [{ type: String, trim: true, maxlength: 60 }], default: [] },
    durationDays: { type: Number, required: true, min: 1 },
    durationNights: { type: Number, required: true, min: 0 },
    itinerary: { type: [itineraryDaySchema], default: [] },
    inclusions: { type: [{ type: String, trim: true, maxlength: 200 }], default: [] },
    exclusions: { type: [{ type: String, trim: true, maxlength: 200 }], default: [] },
    pickupCities: { type: [{ type: String, trim: true, maxlength: 60 }], default: [] },
    basePrice: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'INR', enum: ['INR'] },
    images: { type: [imageSchema], default: [] },
    faqs: { type: [faqSchema], default: [] },
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

tourSchema.index({ status: 1, featured: -1, publishedAt: -1 });
tourSchema.index({ temples: 1 });
tourSchema.index(
  { title: 'text', destinations: 'text', summary: 'text' },
  { name: 'tour_text', weights: { title: 10, destinations: 5, summary: 2 } },
);

export const Tour = mongoose.models.Tour ?? mongoose.model('Tour', tourSchema);
