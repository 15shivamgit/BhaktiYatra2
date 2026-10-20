import mongoose from 'mongoose';

/** Image stored in Cloudinary and referenced from content documents. */
export const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    alt: { type: String, default: '', maxlength: 200, trim: true },
    width: { type: Number },
    height: { type: Number },
    isPrimary: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

/** GeoJSON point; coordinates are [longitude, latitude]. */
export const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], required: true, default: 'Point' },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: ([lng, lat] = []) =>
          Number.isFinite(lng) &&
          Number.isFinite(lat) &&
          Math.abs(lng) <= 180 &&
          Math.abs(lat) <= 90,
        message: 'Coordinates must be [longitude, latitude]',
      },
    },
  },
  { _id: false },
);

export const seoSchema = new mongoose.Schema(
  {
    title: { type: String, maxlength: 70, trim: true },
    description: { type: String, maxlength: 170, trim: true },
  },
  { _id: false },
);

/** { lat, lng } for API responses, or null. */
export function toLatLng(point) {
  if (!point?.coordinates || point.coordinates.length !== 2) return null;
  const [lng, lat] = point.coordinates;
  return { lat, lng };
}

/** GeoJSON point from { lat, lng }, or undefined. */
export function fromLatLng(value) {
  if (!value) return undefined;
  return { type: 'Point', coordinates: [value.lng, value.lat] };
}

/** The image flagged primary, otherwise the first by order. */
export function primaryImage(images = []) {
  if (!images.length) return null;
  const image = images.find((i) => i.isPrimary) ?? [...images].sort((a, b) => a.order - b.order)[0];
  return {
    url: image.url,
    alt: image.alt,
    width: image.width ?? null,
    height: image.height ?? null,
  };
}
