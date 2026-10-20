/**
 * Shared seeding logic for the launch content, used by scripts/seed-content.js and the E2E
 * server. Expects an open Mongoose connection.
 */
import { readFileSync } from 'node:fs';
import { Circuit } from '../../src/models/Circuit.js';
import { fromLatLng } from '../../src/models/shared.js';
import { Temple } from '../../src/models/Temple.js';
import { publishProblems } from '../../src/modules/temples/temples.admin.service.js';
import { createTempleSchema } from '../../src/modules/temples/temples.schemas.js';
import { sanitizeRichText } from '../../src/utils/html.js';
import { CIRCUITS, REVIEW_NOTE, TEMPLES } from '../data/temples.data.js';

function loadImageManifest() {
  const manifest = JSON.parse(
    readFileSync(new URL('../data/cloudinary-images.json', import.meta.url), 'utf8'),
  );
  const all = [...manifest.temple, ...manifest.needsReview, ...manifest.brand];
  return new Map(all.map((image) => [image.publicId, image]));
}

function toImage(manifest, [publicId, alt], index) {
  const found = manifest.get(publicId);
  if (!found) throw new Error(`Image "${publicId}" is not in cloudinary-images.json`);
  return {
    url: found.url,
    publicId,
    alt,
    width: found.width,
    height: found.height,
    order: index,
    isPrimary: index === 0,
  };
}

/** Validate with the admin schema, then convert to model fields. */
function templeFields(entry, manifest) {
  const { images, ...input } = entry;
  const parsed = createTempleSchema.body.safeParse(input);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`${entry.slug} is invalid:\n  ${problems.join('\n  ')}`);
  }
  const data = parsed.data;
  return {
    ...data,
    description: sanitizeRichText(data.description),
    history: sanitizeRichText(data.history),
    significance: sanitizeRichText(data.significance),
    location: fromLatLng(data.location),
    images: images.map((image, index) => toImage(manifest, image, index)),
    notes: REVIEW_NOTE,
  };
}

/**
 * Upsert every launch temple and circuit.
 * @param {{ status?: 'published' | 'draft' }} [options]
 * @returns {Promise<{ temples: number, created: number, circuits: number }>}
 */
export async function seedContent({ status = 'published' } = {}) {
  const manifest = loadImageManifest();
  // Validate everything before touching the database.
  const prepared = TEMPLES.map((entry) => templeFields(entry, manifest));

  await Promise.all([Temple.init(), Circuit.init()]);
  const idsBySlug = new Map();
  let created = 0;
  for (const fields of prepared) {
    const existing = await Temple.findOne({ slug: fields.slug });
    const doc = existing ?? new Temple();
    doc.set({ ...fields, status });
    if (status === 'published') doc.publishedAt ??= new Date();
    const problems = publishProblems(doc);
    if (status === 'published' && problems.length) {
      throw new Error(
        `${fields.slug} cannot be published: ${problems.map((p) => p.message).join('; ')}`,
      );
    }
    await doc.save();
    if (!existing) created += 1;
    idsBySlug.set(doc.slug, doc._id);
  }

  for (const entry of CIRCUITS) {
    const temples = entry.temples.map((slug) => {
      const id = idsBySlug.get(slug);
      if (!id) throw new Error(`Circuit ${entry.slug} references unknown temple ${slug}`);
      return id;
    });
    const { image, ...rest } = entry;
    const doc = (await Circuit.findOne({ slug: entry.slug })) ?? new Circuit();
    doc.set({
      ...rest,
      description: sanitizeRichText(rest.description),
      temples,
      image: image ? toImage(manifest, image, 0) : undefined,
      status,
      notes: REVIEW_NOTE,
    });
    if (status === 'published') doc.publishedAt ??= new Date();
    await doc.save();
  }
  return { temples: prepared.length, created, circuits: CIRCUITS.length };
}
