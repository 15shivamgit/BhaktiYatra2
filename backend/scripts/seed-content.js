/**
 * Upsert the launch temples and circuits from scripts/data/temples.data.js.
 *
 *   npm run seed:content -w backend            # publish in dev/staging
 *   npm run seed:content -w backend -- --draft # load as drafts for review
 *
 * Every temple is validated with the same schema as the admin API, rich text is sanitised, and
 * images are taken from scripts/data/cloudinary-images.json (the owner's existing uploads). The
 * script refuses to run against production unless --allow-production is passed, because the
 * drafted content must be reviewed first (ADR-015).
 */
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { parseEnv } from '../src/config/env.js';
import { createLogger } from '../src/config/logger.js';
import { Circuit } from '../src/models/Circuit.js';
import { fromLatLng } from '../src/models/shared.js';
import { Temple } from '../src/models/Temple.js';
import { publishProblems } from '../src/modules/temples/temples.admin.service.js';
import { createTempleSchema } from '../src/modules/temples/temples.schemas.js';
import { sanitizeRichText } from '../src/utils/html.js';
import { CIRCUITS, REVIEW_NOTE, TEMPLES } from './data/temples.data.js';

const out = (line = '') => process.stdout.write(`${line}\n`);

function loadImageManifest() {
  const manifest = JSON.parse(
    readFileSync(new URL('./data/cloudinary-images.json', import.meta.url), 'utf8'),
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

async function main() {
  const { values } = parseArgs({
    options: { draft: { type: 'boolean' }, 'allow-production': { type: 'boolean' } },
  });
  const env = parseEnv(process.env);
  if (env.NODE_ENV === 'production' && !values['allow-production']) {
    out(
      'Refusing to seed production: review the drafted content first, then pass --allow-production.',
    );
    process.exit(1);
  }
  const status = values.draft ? 'draft' : 'published';
  const manifest = loadImageManifest();

  // Validate everything before touching the database.
  const prepared = TEMPLES.map((entry) => templeFields(entry, manifest));

  await connectDb(env.MONGO_URL, createLogger({ level: 'warn' }), { attempts: 2 });
  try {
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
    out(`Temples: ${prepared.length} upserted (${created} new), status "${status}".`);

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
    out(`Circuits: ${CIRCUITS.length} upserted, status "${status}".`);
    out(
      'Reminder: content was drafted by Claude and must be reviewed before production (ADR-015).',
    );
  } finally {
    await disconnectDb();
  }
}

main().catch((error) => {
  process.stderr.write(`seed-content failed: ${error.message}\n`);
  process.exit(1);
});
