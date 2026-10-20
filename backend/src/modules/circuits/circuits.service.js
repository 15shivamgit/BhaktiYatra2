import { ERROR_CODES } from '../../config/constants.js';
import { Circuit } from '../../models/Circuit.js';
import { SlugRedirect } from '../../models/SlugRedirect.js';
import { Temple } from '../../models/Temple.js';
import { AppError } from '../../utils/app-error.js';
import { escapeRegex } from '../../utils/crypto.js';
import { sanitizeRichText } from '../../utils/html.js';
import { pageMeta, skipFor } from '../../utils/pagination.js';
import { slugify, uniqueSlug } from '../../utils/slug.js';
import { recordAudit } from '../audit/audit.service.js';
import { destroyIfManaged, uploadImages } from '../content/images.service.js';
import { revalidateContent } from '../content/revalidate.js';
import { toTempleCard } from '../temples/temples.mapper.js';
import { toursCoveringTemples } from '../tours/tours.public.service.js';

const MIN_PUBLISHED_TEMPLES = 2;

const imageOut = (image) =>
  image
    ? {
        url: image.url,
        publicId: image.publicId,
        alt: image.alt,
        width: image.width ?? null,
        height: image.height ?? null,
      }
    : null;

/** Card shape for lists; `templeCount` counts published temples only. */
function toCircuitCard(circuit, publishedCount) {
  return {
    id: circuit._id.toString(),
    slug: circuit.slug,
    name: circuit.name,
    shortDescription: circuit.shortDescription,
    image: imageOut(circuit.image),
    region: circuit.region ?? null,
    templeCount: publishedCount,
    featured: Boolean(circuit.featured),
  };
}

export function toCircuitAdmin(circuit) {
  return {
    id: circuit._id.toString(),
    slug: circuit.slug,
    name: circuit.name,
    shortDescription: circuit.shortDescription,
    description: circuit.description ?? '',
    temples: circuit.temples.map((t) =>
      typeof t === 'object' && t.name
        ? { id: t._id.toString(), name: t.name, slug: t.slug, city: t.city, status: t.status }
        : { id: t.toString() },
    ),
    image: imageOut(circuit.image),
    region: circuit.region ?? '',
    featured: Boolean(circuit.featured),
    status: circuit.status,
    publishedAt: circuit.publishedAt ?? null,
    seo: circuit.seo ?? null,
    notes: circuit.notes ?? '',
    createdAt: circuit.createdAt,
    updatedAt: circuit.updatedAt,
  };
}

async function publishedTempleIds(ids) {
  const found = await Temple.find({ _id: { $in: ids }, status: 'published' }).select('_id');
  return new Set(found.map((t) => t._id.toString()));
}

/* ---------- public ---------- */

export async function listCircuits({ featured, page, limit }) {
  const filter = { status: 'published', ...(featured !== undefined && { featured }) };
  const [circuits, total] = await Promise.all([
    Circuit.find(filter)
      .sort({ featured: -1, name: 1 })
      .skip(skipFor({ page, limit }))
      .limit(limit),
    Circuit.countDocuments(filter),
  ]);
  const published = await publishedTempleIds(circuits.flatMap((c) => c.temples));
  return {
    circuits: circuits.map((c) =>
      toCircuitCard(c, c.temples.filter((id) => published.has(id.toString())).length),
    ),
    meta: pageMeta({ page, limit }, total),
  };
}

/** Circuit with its published temples in route order (FR-TEMPLE-08). */
export async function getCircuitBySlug(slug) {
  const circuit = await Circuit.findOne({ slug, status: 'published' });
  if (!circuit) {
    const redirect = await SlugRedirect.findOne({ entityType: 'circuit', fromSlug: slug });
    if (redirect) return { redirectTo: redirect.toSlug };
    throw AppError.notFound('Circuit not found');
  }
  const temples = await Temple.find({ _id: { $in: circuit.temples }, status: 'published' });
  const byId = new Map(temples.map((t) => [t._id.toString(), t]));
  const ordered = circuit.temples.map((id) => byId.get(id.toString())).filter(Boolean);
  const tours = await toursCoveringTemples(ordered.map((t) => t._id));
  return {
    circuit: {
      ...toCircuitCard(circuit, ordered.length),
      description: circuit.description ?? null,
      seo: circuit.seo ?? null,
      updatedAt: circuit.updatedAt,
      temples: ordered.map((t, index) => toTempleCard(t, { position: index + 1 })),
      tours,
    },
  };
}

export async function circuitSitemapEntries() {
  const circuits = await Circuit.find({ status: 'published' })
    .select('slug updatedAt')
    .sort({ slug: 1 });
  return circuits.map((c) => ({ slug: c.slug, updatedAt: c.updatedAt }));
}

/* ---------- admin ---------- */

const slugTaken = (excludeId) => async (slug) =>
  Boolean(await Circuit.exists({ slug, ...(excludeId && { _id: { $ne: excludeId } }) }));

async function assertTemplesExist(ids = []) {
  if (!ids.length) return;
  const count = await Temple.countDocuments({ _id: { $in: ids } });
  if (count !== ids.length) {
    throw AppError.validation([{ path: 'temples', message: 'One or more temples do not exist' }]);
  }
}

function toModelFields(input) {
  const fields = { ...input };
  if ('description' in fields) fields.description = sanitizeRichText(fields.description);
  return fields;
}

export async function listCircuitsAdmin({ q, status, page, limit }) {
  const filter = {};
  if (status) filter.status = status;
  if (q) filter.name = new RegExp(escapeRegex(q), 'i');
  const [circuits, total] = await Promise.all([
    Circuit.find(filter).sort({ updatedAt: -1 }).skip(skipFor({ page, limit })).limit(limit),
    Circuit.countDocuments(filter),
  ]);
  return { circuits, meta: pageMeta({ page, limit }, total) };
}

export async function getCircuitAdmin(id) {
  const circuit = await Circuit.findById(id).populate('temples', 'name slug city status');
  if (!circuit) throw AppError.notFound('Circuit not found');
  return circuit;
}

export async function createCircuit(ctx, input, actor, req) {
  await assertTemplesExist(input.temples);
  const fields = toModelFields(input);
  if (input.slug) {
    if (await slugTaken()(input.slug)) {
      throw AppError.conflict(ERROR_CODES.SLUG_TAKEN, `The slug "${input.slug}" is already used`);
    }
  } else {
    fields.slug = await uniqueSlug(slugify(input.name), slugTaken());
  }
  await SlugRedirect.deleteOne({ entityType: 'circuit', fromSlug: fields.slug });
  const circuit = await Circuit.create({
    ...fields,
    status: 'draft',
    createdBy: actor._id,
    updatedBy: actor._id,
  });
  await recordAudit({
    actor,
    action: 'circuit.create',
    entityType: 'Circuit',
    entityId: circuit._id,
    after: { slug: circuit.slug },
    req,
  });
  return getCircuitAdmin(circuit._id);
}

export async function updateCircuit(ctx, id, input, actor, req) {
  const circuit = await Circuit.findById(id);
  if (!circuit) throw AppError.notFound('Circuit not found');
  await assertTemplesExist(input.temples);
  const fields = toModelFields(input);
  const oldSlug = circuit.slug;
  if (fields.slug && fields.slug !== oldSlug && (await slugTaken(circuit._id)(fields.slug))) {
    throw AppError.conflict(ERROR_CODES.SLUG_TAKEN, `The slug "${fields.slug}" is already used`);
  }
  circuit.set(fields);
  circuit.updatedBy = actor._id;
  await circuit.save();
  if (fields.slug && fields.slug !== oldSlug && circuit.publishedAt) {
    await SlugRedirect.deleteOne({ entityType: 'circuit', fromSlug: circuit.slug });
    await SlugRedirect.updateMany(
      { entityType: 'circuit', toSlug: oldSlug },
      { toSlug: circuit.slug },
    );
    await SlugRedirect.updateOne(
      { entityType: 'circuit', fromSlug: oldSlug },
      { toSlug: circuit.slug },
      { upsert: true },
    );
  }
  await recordAudit({
    actor,
    action: 'circuit.update',
    entityType: 'Circuit',
    entityId: circuit._id,
    after: { fields: Object.keys(input) },
    req,
  });
  if (circuit.status === 'published')
    revalidateContent(ctx, [`circuit:${circuit.slug}`, `circuit:${oldSlug}`]);
  return getCircuitAdmin(circuit._id);
}

/** Temple ids whether `temples` holds ObjectIds or populated documents. */
const templeIdsOf = (circuit) =>
  circuit.temples.map((t) => (t && typeof t === 'object' && 'name' in t ? t._id : t));

export async function circuitPublishProblems(circuit) {
  const ids = templeIdsOf(circuit);
  const published = await publishedTempleIds(ids);
  return published.size >= MIN_PUBLISHED_TEMPLES
    ? []
    : [{ path: 'temples', message: `Add at least ${MIN_PUBLISHED_TEMPLES} published temples` }];
}

async function setStatus(ctx, id, status, action, actor, req) {
  const circuit = await Circuit.findById(id);
  if (!circuit) throw AppError.notFound('Circuit not found');
  const before = circuit.status;
  if (status === 'published') {
    const problems = await circuitPublishProblems(circuit);
    if (problems.length) {
      throw new AppError(
        422,
        ERROR_CODES.PUBLISH_PREREQUISITES,
        'This circuit is not ready to publish',
        problems,
      );
    }
    circuit.publishedAt ??= new Date();
  }
  circuit.status = status;
  circuit.updatedBy = actor._id;
  await circuit.save();
  await recordAudit({
    actor,
    action,
    entityType: 'Circuit',
    entityId: circuit._id,
    before: { status: before },
    after: { status },
    req,
  });
  if (before === 'published' || status === 'published')
    revalidateContent(ctx, [`circuit:${circuit.slug}`]);
  return getCircuitAdmin(circuit._id);
}

export const publishCircuit = (ctx, id, actor, req) =>
  setStatus(ctx, id, 'published', 'circuit.publish', actor, req);
export const unpublishCircuit = (ctx, id, actor, req) =>
  setStatus(ctx, id, 'draft', 'circuit.unpublish', actor, req);
export const archiveCircuit = (ctx, id, actor, req) =>
  setStatus(ctx, id, 'archived', 'circuit.archive', actor, req);

export async function deleteCircuit(ctx, id, actor, req) {
  const circuit = await Circuit.findById(id);
  if (!circuit) throw AppError.notFound('Circuit not found');
  if (circuit.status !== 'draft') {
    throw AppError.conflict(
      ERROR_CODES.HAS_REFERENCES,
      'Only draft circuits can be deleted; archive it instead',
    );
  }
  await Circuit.deleteOne({ _id: circuit._id });
  if (circuit.image) await destroyIfManaged(ctx, circuit.image.publicId);
  await recordAudit({
    actor,
    action: 'circuit.delete',
    entityType: 'Circuit',
    entityId: circuit._id,
    before: { slug: circuit.slug },
    req,
  });
}

/** Replace the circuit's single cover image. */
export async function setCircuitImage(ctx, id, file, alt, actor, req) {
  const circuit = await Circuit.findById(id);
  if (!circuit) throw AppError.notFound('Circuit not found');
  const { uploaded } = await uploadImages(ctx, [file], {
    folder: `${ctx.env.CLOUDINARY_FOLDER}/circuits/${circuit.slug}`,
    alts: [alt ?? ''],
  });
  const previous = circuit.image?.publicId;
  circuit.image = { ...uploaded[0], isPrimary: true, order: 0 };
  circuit.updatedBy = actor._id;
  await circuit.save();
  if (previous) await destroyIfManaged(ctx, previous);
  await recordAudit({
    actor,
    action: 'circuit.image.set',
    entityType: 'Circuit',
    entityId: circuit._id,
    req,
  });
  if (circuit.status === 'published') revalidateContent(ctx, [`circuit:${circuit.slug}`]);
  return getCircuitAdmin(circuit._id);
}
