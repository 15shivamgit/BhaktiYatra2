import { ERROR_CODES } from '../../config/constants.js';
import { MAX_TEMPLE_IMAGES, MIN_DESCRIPTION_CHARS } from '../../config/content.js';
import { Circuit } from '../../models/Circuit.js';
import { fromLatLng } from '../../models/shared.js';
import { SlugRedirect } from '../../models/SlugRedirect.js';
import { Temple } from '../../models/Temple.js';
import { AppError } from '../../utils/app-error.js';
import { escapeRegex } from '../../utils/crypto.js';
import { sanitizeRichText, textLength } from '../../utils/html.js';
import { pageMeta, skipFor } from '../../utils/pagination.js';
import { slugify, uniqueSlug } from '../../utils/slug.js';
import { recordAudit } from '../audit/audit.service.js';
import {
  applyImageEdits,
  destroyIfManaged,
  normaliseImages,
  uploadImages,
} from '../content/images.service.js';
import { revalidateContent } from '../content/revalidate.js';
import { ADMIN_SORTS } from './temples.schemas.js';

const RICH_FIELDS = ['description', 'history', 'significance'];
const URL_FIELDS = ['officialWebsite', 'darshanBookingUrl', 'pincode'];

/** Turn validated input into model fields: sanitise HTML, convert location, drop empty strings. */
function toModelFields(input) {
  const fields = { ...input };
  for (const key of RICH_FIELDS) {
    if (key in fields) fields[key] = sanitizeRichText(fields[key]);
  }
  for (const key of URL_FIELDS) {
    if (fields[key] === '') fields[key] = undefined;
  }
  if ('location' in fields) fields.location = fromLatLng(fields.location);
  return fields;
}

const slugTaken = (excludeId) => async (slug) =>
  Boolean(await Temple.exists({ slug, ...(excludeId && { _id: { $ne: excludeId } }) }));

export async function listTemplesAdmin({ q, status, state, deity, sort, page, limit }) {
  const filter = {};
  if (status) filter.status = status;
  if (state) filter.state = state;
  if (deity) filter.deity = deity;
  if (q) {
    const pattern = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: pattern }, { city: pattern }, { slug: pattern }];
  }
  const [temples, total] = await Promise.all([
    Temple.find(filter).sort(ADMIN_SORTS[sort]).skip(skipFor({ page, limit })).limit(limit),
    Temple.countDocuments(filter),
  ]);
  return { temples, meta: pageMeta({ page, limit }, total) };
}

export async function getTempleAdmin(id) {
  const temple = await Temple.findById(id);
  if (!temple) throw AppError.notFound('Temple not found');
  return temple;
}

/** New temples always start as drafts (FR-ADMINCONTENT-01). */
export async function createTemple(ctx, input, actor, req) {
  const fields = toModelFields(input);
  if (input.slug) {
    if (await slugTaken()(input.slug)) {
      throw AppError.conflict(ERROR_CODES.SLUG_TAKEN, `The slug "${input.slug}" is already used`);
    }
  } else {
    fields.slug = await uniqueSlug(slugify(`${input.name} ${input.city}`), slugTaken());
  }
  // A brand-new page takes over a slug that only survived as a redirect source.
  await SlugRedirect.deleteOne({ entityType: 'temple', fromSlug: fields.slug });

  const temple = await Temple.create({
    ...fields,
    status: 'draft',
    createdBy: actor._id,
    updatedBy: actor._id,
  });
  await recordAudit({
    actor,
    action: 'temple.create',
    entityType: 'Temple',
    entityId: temple._id,
    after: { slug: temple.slug },
    req,
  });
  return temple;
}

/**
 * Update fields. Renaming the slug of a temple that has ever been published records a redirect
 * so old links keep working (FR-ADMINCONTENT-05).
 */
export async function updateTemple(ctx, id, input, actor, req) {
  const temple = await getTempleAdmin(id);
  const fields = toModelFields(input);
  const oldSlug = temple.slug;

  if (fields.slug && fields.slug !== oldSlug) {
    if (await slugTaken(temple._id)(fields.slug)) {
      throw AppError.conflict(ERROR_CODES.SLUG_TAKEN, `The slug "${fields.slug}" is already used`);
    }
  }

  temple.set(fields);
  temple.updatedBy = actor._id;
  await temple.save();

  if (fields.slug && fields.slug !== oldSlug) {
    await SlugRedirect.deleteOne({ entityType: 'temple', fromSlug: temple.slug });
    if (temple.publishedAt) {
      // Point older redirects straight at the new slug (no chains), then add the latest hop.
      await SlugRedirect.updateMany(
        { entityType: 'temple', toSlug: oldSlug },
        { toSlug: temple.slug },
      );
      await SlugRedirect.updateOne(
        { entityType: 'temple', fromSlug: oldSlug },
        { toSlug: temple.slug },
        { upsert: true },
      );
    }
  }

  await recordAudit({
    actor,
    action: 'temple.update',
    entityType: 'Temple',
    entityId: temple._id,
    after: { fields: Object.keys(input) },
    req,
  });
  if (temple.status === 'published')
    revalidateContent(ctx, [`temple:${temple.slug}`, `temple:${oldSlug}`]);
  return temple;
}

/** What still stops this temple from being published; empty when it is ready. */
export function publishProblems(temple) {
  const problems = [];
  if (!temple.location?.coordinates) {
    problems.push({ path: 'location', message: 'Set the temple location on the map' });
  }
  if (!temple.images?.length) {
    problems.push({ path: 'images', message: 'Upload at least one image' });
  } else if (temple.images.some((image) => !image.alt?.trim())) {
    problems.push({ path: 'images', message: 'Every image needs alt text' });
  }
  if (textLength(temple.description) < MIN_DESCRIPTION_CHARS) {
    problems.push({
      path: 'description',
      message: `Description needs at least ${MIN_DESCRIPTION_CHARS} characters of text`,
    });
  }
  if (!temple.timings?.length) {
    problems.push({ path: 'timings', message: 'Add at least one darshan timing' });
  }
  return problems;
}

async function setStatus(ctx, id, status, action, actor, req) {
  const temple = await getTempleAdmin(id);
  const before = temple.status;
  if (status === 'published') {
    const problems = publishProblems(temple);
    if (problems.length) {
      throw new AppError(
        422,
        ERROR_CODES.PUBLISH_PREREQUISITES,
        'This temple is not ready to publish',
        problems,
      );
    }
    temple.publishedAt ??= new Date();
  }
  temple.status = status;
  temple.updatedBy = actor._id;
  await temple.save();
  await recordAudit({
    actor,
    action,
    entityType: 'Temple',
    entityId: temple._id,
    before: { status: before },
    after: { status },
    req,
  });
  if (before === 'published' || status === 'published')
    revalidateContent(ctx, [`temple:${temple.slug}`]);
  return temple;
}

export const publishTemple = (ctx, id, actor, req) =>
  setStatus(ctx, id, 'published', 'temple.publish', actor, req);
export const unpublishTemple = (ctx, id, actor, req) =>
  setStatus(ctx, id, 'draft', 'temple.unpublish', actor, req);
export const archiveTemple = (ctx, id, actor, req) =>
  setStatus(ctx, id, 'archived', 'temple.archive', actor, req);

/** Only drafts that nothing references can be deleted; everything else is archived instead. */
export async function deleteTemple(ctx, id, actor, req) {
  const temple = await getTempleAdmin(id);
  if (temple.status !== 'draft') {
    throw AppError.conflict(
      ERROR_CODES.HAS_REFERENCES,
      'Only draft temples can be deleted; archive it instead',
    );
  }
  if (await Circuit.exists({ temples: temple._id })) {
    throw AppError.conflict(
      ERROR_CODES.HAS_REFERENCES,
      'This temple is part of a circuit; remove it there first',
    );
  }
  await Temple.deleteOne({ _id: temple._id });
  await SlugRedirect.deleteMany({ entityType: 'temple', toSlug: temple.slug });
  await Promise.all(temple.images.map((image) => destroyIfManaged(ctx, image.publicId)));
  await recordAudit({
    actor,
    action: 'temple.delete',
    entityType: 'Temple',
    entityId: temple._id,
    before: { slug: temple.slug },
    req,
  });
}

/* ---------- images ---------- */

export async function addTempleImages(ctx, id, files, alts, actor, req) {
  const temple = await getTempleAdmin(id);
  if (temple.images.length + files.length > MAX_TEMPLE_IMAGES) {
    throw new AppError(
      422,
      ERROR_CODES.IMAGE_LIMIT,
      `A temple can have at most ${MAX_TEMPLE_IMAGES} images (it has ${temple.images.length})`,
    );
  }
  const folder = `${ctx.env.CLOUDINARY_FOLDER}/temples/${temple.slug}`;
  const { uploaded, failed } = await uploadImages(ctx, files, { folder, alts });
  const startOrder = temple.images.length;
  temple.images = normaliseImages([
    ...temple.images.map((image) => image.toObject()),
    ...uploaded.map((image, index) => ({ ...image, order: startOrder + index, isPrimary: false })),
  ]);
  temple.updatedBy = actor._id;
  await temple.save();
  await recordAudit({
    actor,
    action: 'temple.images.add',
    entityType: 'Temple',
    entityId: temple._id,
    after: { added: uploaded.length, failed: failed.length },
    req,
  });
  if (temple.status === 'published') revalidateContent(ctx, [`temple:${temple.slug}`]);
  return { temple, failed };
}

export async function editTempleImages(ctx, id, edits, actor, req) {
  const temple = await getTempleAdmin(id);
  temple.images = applyImageEdits(
    temple.images.map((image) => image.toObject()),
    edits,
  );
  temple.updatedBy = actor._id;
  await temple.save();
  await recordAudit({
    actor,
    action: 'temple.images.update',
    entityType: 'Temple',
    entityId: temple._id,
    req,
  });
  if (temple.status === 'published') revalidateContent(ctx, [`temple:${temple.slug}`]);
  return temple;
}

export async function removeTempleImage(ctx, id, publicId, actor, req) {
  const temple = await getTempleAdmin(id);
  const image = temple.images.find((i) => i.publicId === publicId);
  if (!image) throw AppError.notFound('Image not found on this temple');
  if (temple.status === 'published' && temple.images.length === 1) {
    throw AppError.conflict(
      ERROR_CODES.INVALID_TRANSITION,
      'A published temple needs at least one image',
    );
  }
  temple.images = normaliseImages(
    temple.images.filter((i) => i.publicId !== publicId).map((i) => i.toObject()),
  );
  temple.updatedBy = actor._id;
  await temple.save();
  await destroyIfManaged(ctx, publicId);
  await recordAudit({
    actor,
    action: 'temple.images.remove',
    entityType: 'Temple',
    entityId: temple._id,
    before: { publicId },
    req,
  });
  if (temple.status === 'published') revalidateContent(ctx, [`temple:${temple.slug}`]);
  return temple;
}
