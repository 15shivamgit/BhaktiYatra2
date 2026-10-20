import mongoose from 'mongoose';
import { CONTENT_STATUSES, RELIGIONS } from '../config/content.js';
import { imageSchema, pointSchema, seoSchema } from './shared.js';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const timingSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 60 },
    open: { type: String, match: TIME },
    close: { type: String, match: TIME },
    note: { type: String, trim: true, maxlength: 200 },
  },
  { _id: false },
);

const aartiSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    time: { type: String, match: TIME },
    note: { type: String, trim: true, maxlength: 200 },
  },
  { _id: false },
);

const festivalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    month: { type: Number, min: 1, max: 12, default: null },
    description: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
);

const howToReachSchema = new mongoose.Schema(
  {
    nearestAirport: { type: String, trim: true, maxlength: 300 },
    nearestRailway: { type: String, trim: true, maxlength: 300 },
    nearestBusStand: { type: String, trim: true, maxlength: 300 },
    byRoad: { type: String, trim: true, maxlength: 300 },
  },
  { _id: false },
);

const templeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    deity: { type: String, required: true, trim: true, maxlength: 60 },
    religion: { type: String, enum: RELIGIONS, default: 'hindu', required: true },
    state: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    district: { type: String, trim: true, maxlength: 80 },
    address: { type: String, trim: true, maxlength: 300 },
    pincode: { type: String, match: /^\d{6}$/ },
    location: { type: pointSchema, default: undefined },
    shortDescription: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, required: true },
    history: { type: String },
    significance: { type: String },
    timings: { type: [timingSchema], default: [] },
    aartiSchedule: { type: [aartiSchema], default: [] },
    festivals: { type: [festivalSchema], default: [] },
    bestTimeToVisit: { type: String, trim: true, maxlength: 300 },
    howToReach: { type: howToReachSchema, default: undefined },
    rules: { type: [String], default: [] },
    entryFee: { type: String, trim: true, maxlength: 200, default: 'Free' },
    officialWebsite: { type: String, trim: true },
    darshanBookingUrl: { type: String, trim: true },
    contactPhone: { type: String, trim: true, maxlength: 40 },
    images: { type: [imageSchema], default: [] },
    tags: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: CONTENT_STATUSES, default: 'draft', required: true },
    publishedAt: { type: Date },
    seo: { type: seoSchema, default: undefined },
    viewCount: { type: Number, default: 0 },
    /** Internal: sources and verification notes. Never sent to the public. */
    notes: { type: String, maxlength: 4000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

templeSchema.index({ status: 1, featured: -1, publishedAt: -1 });
templeSchema.index({ status: 1, state: 1 });
templeSchema.index({ status: 1, deity: 1 });
templeSchema.index({ location: '2dsphere' });
templeSchema.index(
  { name: 'text', city: 'text', deity: 'text', tags: 'text', shortDescription: 'text' },
  {
    name: 'temple_text',
    weights: { name: 10, city: 5, deity: 5, tags: 3, shortDescription: 1 },
    default_language: 'english',
  },
);

export const Temple = mongoose.models.Temple ?? mongoose.model('Temple', templeSchema);
