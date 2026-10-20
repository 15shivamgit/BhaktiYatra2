import mongoose from 'mongoose';

/** Old public slug → current slug, so renamed pages answer with 301 (NFR-SEO-02). */
const slugRedirectSchema = new mongoose.Schema(
  {
    entityType: { type: String, enum: ['temple', 'circuit', 'tour'], required: true },
    fromSlug: { type: String, required: true },
    toSlug: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

slugRedirectSchema.index({ entityType: 1, fromSlug: 1 }, { unique: true });
slugRedirectSchema.index({ entityType: 1, toSlug: 1 });

export const SlugRedirect =
  mongoose.models.SlugRedirect ?? mongoose.model('SlugRedirect', slugRedirectSchema);
