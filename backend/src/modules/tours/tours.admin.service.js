import { ERROR_CODES } from '../../config/constants.js';
import { MAX_TOUR_IMAGES, UPCOMING_DEPARTURE_STATUSES } from '../../config/tours.js';
import { SlugRedirect } from '../../models/SlugRedirect.js';
import { Temple } from '../../models/Temple.js';
import { Tour } from '../../models/Tour.js';
import { TourDeparture } from '../../models/TourDeparture.js';
import { AppError } from '../../utils/app-error.js';
import { escapeRegex } from '../../utils/crypto.js';
import { todayIst } from '../../utils/dates.js';
import { sanitizeRichText } from '../../utils/html.js';
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
import { activeDeparturesWithBookings } from './departures.service.js';
import { ADMIN_SORTS } from './tours.schemas.js';

const slugTaken = (excludeId) => async (slug) =>
  Boolean(await Tour.exists({ slug, ...(excludeId && { _id: { $ne: excludeId } }) }));

async function assertTemplesExist(ids = []) {
  if (!ids.length) return;
  const count = await Temple.countDocuments({ _id: { $in: ids } });
  if (count !== ids.length) {
    throw AppError.validation([{ path: 'temples', message: 'One or more temples do not exist' }]);
  }
}

/** Sanitise rich text and default nights from days. */
function toModelFields(input, current) {
  const fields = { ...input };
  if ('description' in fields) fields.description = sanitizeRichText(fields.description);
  if (fields.itinerary) {
    fields.itinerary = fields.itinerary.map((day) => ({
      ...day,
      description: sanitizeRichText(day.description ?? ''),
    }));
  }
  if (fields.durationDays !== undefined && fields.durationNights === undefined) {
    // Keep nights = days − 1 unless the admin set nights explicitly before.
    const wasDefault = !current || current.durationNights === current.durationDays - 1;
    if (wasDefault) fields.durationNights = Math.max(0, fields.durationDays - 1);
  }
  const nights = fields.durationNights ?? current?.durationNights;
  const days = fields.durationDays ?? current?.durationDays;
  if (nights !== undefined && days !== undefined && nights > days) {
    throw AppError.validation([{ path: 'durationNights', message: 'Nights cannot exceed days' }]);
  }
  return fields;
}

async function departureCounts(tourIds, now = new Date()) {
  const rows = await TourDeparture.aggregate([
    { $match: { tour: { $in: tourIds } } },
    {
      $group: {
        _id: '$tour',
        departureCount: { $sum: 1 },
        upcomingDepartureCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $in: ['$status', [...UPCOMING_DEPARTURE_STATUSES]] },
                  { $gte: ['$startDate', todayIst(now)] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);
  return new Map(rows.map((r) => [r._id.toString(), r]));
}

export async function listToursAdmin({ q, status, featured, sort, page, limit }) {
  const filter = {};
  if (status) filter.status = status;
  if (featured !== undefined) filter.featured = featured;
  if (q) {
    const pattern = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ title: pattern }, { slug: pattern }, { destinations: pattern }];
  }
  const [tours, total] = await Promise.all([
    Tour.find(filter).sort(ADMIN_SORTS[sort]).skip(skipFor({ page, limit })).limit(limit),
    Tour.countDocuments(filter),
  ]);
  const counts = await departureCounts(tours.map((t) => t._id));
  return { tours, counts, meta: pageMeta({ page, limit }, total) };
}

export async function getTourAdmin(id, { populate = false } = {}) {
  const query = Tour.findById(id);
  if (populate) query.populate('temples', 'name slug city status');
  const tour = await query;
  if (!tour) throw AppError.notFound('Tour not found');
  return tour;
}

/** What is missing before the tour can be published (docs/04-api/04-tours-departures.md). */
export function publishProblems(tour) {
  const problems = [];
  if (!tour.images?.length) {
    problems.push({ path: 'images', message: 'Upload at least one image' });
  } else if (tour.images.some((image) => !image.alt?.trim())) {
    problems.push({ path: 'images', message: 'Every image needs alt text' });
  }
  if ((tour.itinerary?.length ?? 0) !== tour.durationDays) {
    problems.push({
      path: 'itinerary',
      message: `The itinerary needs exactly ${tour.durationDays} days (it has ${tour.itinerary?.length ?? 0})`,
    });
  } else if (tour.itinerary.some((day) => !day.title?.trim())) {
    problems.push({ path: 'itinerary', message: 'Every itinerary day needs a title' });
  }
  if (!tour.inclusions?.length) {
    problems.push({ path: 'inclusions', message: 'Add at least one inclusion' });
  }
  if (!tour.pickupCities?.length) {
    problems.push({ path: 'pickupCities', message: 'Add at least one pickup city' });
  }
  return problems;
}

/** New tours always start as drafts. */
export async function createTour(ctx, input, actor, req) {
  await assertTemplesExist(input.temples);
  const fields = toModelFields(input);
  if (input.slug) {
    if (await slugTaken()(input.slug)) {
      throw AppError.conflict(ERROR_CODES.SLUG_TAKEN, `The slug "${input.slug}" is already used`);
    }
  } else {
    fields.slug = await uniqueSlug(slugify(input.title), slugTaken());
  }
  await SlugRedirect.deleteOne({ entityType: 'tour', fromSlug: fields.slug });
  fields.durationNights ??= Math.max(0, input.durationDays - 1);

  const tour = await Tour.create({
    ...fields,
    status: 'draft',
    createdBy: actor._id,
    updatedBy: actor._id,
  });
  await recordAudit({
    actor,
    action: 'tour.create',
    entityType: 'Tour',
    entityId: tour._id,
    after: { slug: tour.slug },
    req,
  });
  return tour;
}

/**
 * Update fields. A slug rename on a tour that was ever published leaves a redirect. Changing the
 * duration leaves existing departures alone and returns a warning.
 */
export async function updateTour(ctx, id, input, actor, req) {
  const tour = await getTourAdmin(id);
  if (input.temples) await assertTemplesExist(input.temples);
  const fields = toModelFields(input, tour);
  const oldSlug = tour.slug;
  const warnings = [];

  if (fields.slug && fields.slug !== oldSlug && (await slugTaken(tour._id)(fields.slug))) {
    throw AppError.conflict(ERROR_CODES.SLUG_TAKEN, `The slug "${fields.slug}" is already used`);
  }
  if (fields.durationDays !== undefined && fields.durationDays !== tour.durationDays) {
    const count = await TourDeparture.countDocuments({ tour: tour._id });
    if (count) {
      warnings.push(
        `${count} existing departure(s) keep their current dates; edit their end dates if the trip length changed`,
      );
    }
  }

  tour.set(fields);
  tour.updatedBy = actor._id;
  await tour.save();

  if (fields.slug && fields.slug !== oldSlug) {
    await SlugRedirect.deleteOne({ entityType: 'tour', fromSlug: tour.slug });
    if (tour.publishedAt) {
      await SlugRedirect.updateMany({ entityType: 'tour', toSlug: oldSlug }, { toSlug: tour.slug });
      await SlugRedirect.updateOne(
        { entityType: 'tour', fromSlug: oldSlug },
        { toSlug: tour.slug },
        { upsert: true },
      );
    }
  }

  await recordAudit({
    actor,
    action: 'tour.update',
    entityType: 'Tour',
    entityId: tour._id,
    after: { fields: Object.keys(input) },
    req,
  });
  if (tour.status === 'published') revalidateContent(ctx, [`tour:${tour.slug}`, `tour:${oldSlug}`]);
  return { tour, warnings };
}

async function setStatus(ctx, id, status, action, actor, req) {
  const tour = await getTourAdmin(id);
  const before = tour.status;
  if (status === 'published') {
    const problems = publishProblems(tour);
    if (problems.length) {
      throw new AppError(
        422,
        ERROR_CODES.PUBLISH_PREREQUISITES,
        'This tour is not ready to publish',
        problems,
      );
    }
    tour.publishedAt ??= new Date();
  }
  if (status === 'archived') {
    const active = await activeDeparturesWithBookings(tour._id);
    if (active) {
      throw AppError.conflict(
        ERROR_CODES.HAS_ACTIVE_DEPARTURES,
        `Upcoming departures still have ${active} booking(s); cancel those departures first`,
      );
    }
  }
  tour.status = status;
  tour.updatedBy = actor._id;
  await tour.save();
  await recordAudit({
    actor,
    action,
    entityType: 'Tour',
    entityId: tour._id,
    before: { status: before },
    after: { status },
    req,
  });
  if (before === 'published' || status === 'published') {
    revalidateContent(ctx, [`tour:${tour.slug}`]);
  }
  return tour;
}

export const publishTour = (ctx, id, actor, req) =>
  setStatus(ctx, id, 'published', 'tour.publish', actor, req);
export const unpublishTour = (ctx, id, actor, req) =>
  setStatus(ctx, id, 'draft', 'tour.unpublish', actor, req);
export const archiveTour = (ctx, id, actor, req) =>
  setStatus(ctx, id, 'archived', 'tour.archive', actor, req);

/** Only drafts without departures can be deleted; everything else is archived instead. */
export async function deleteTour(ctx, id, actor, req) {
  const tour = await getTourAdmin(id);
  if (tour.status !== 'draft') {
    throw AppError.conflict(
      ERROR_CODES.HAS_REFERENCES,
      'Only draft tours can be deleted; archive it instead',
    );
  }
  if (await TourDeparture.exists({ tour: tour._id })) {
    throw AppError.conflict(
      ERROR_CODES.HAS_REFERENCES,
      'This tour has departures; delete or cancel them first',
    );
  }
  await Tour.deleteOne({ _id: tour._id });
  await SlugRedirect.deleteMany({ entityType: 'tour', toSlug: tour.slug });
  await Promise.all(tour.images.map((image) => destroyIfManaged(ctx, image.publicId)));
  await recordAudit({
    actor,
    action: 'tour.delete',
    entityType: 'Tour',
    entityId: tour._id,
    before: { slug: tour.slug },
    req,
  });
}

/* ---------- images ---------- */

export async function addTourImages(ctx, id, files, alts, actor, req) {
  const tour = await getTourAdmin(id);
  if (tour.images.length + files.length > MAX_TOUR_IMAGES) {
    throw new AppError(
      422,
      ERROR_CODES.IMAGE_LIMIT,
      `A tour can have at most ${MAX_TOUR_IMAGES} images (it has ${tour.images.length})`,
    );
  }
  const folder = `${ctx.env.CLOUDINARY_FOLDER}/tours/${tour.slug}`;
  const { uploaded, failed } = await uploadImages(ctx, files, { folder, alts });
  const startOrder = tour.images.length;
  tour.images = normaliseImages([
    ...tour.images.map((image) => image.toObject()),
    ...uploaded.map((image, index) => ({ ...image, order: startOrder + index, isPrimary: false })),
  ]);
  tour.updatedBy = actor._id;
  await tour.save();
  await recordAudit({
    actor,
    action: 'tour.images.add',
    entityType: 'Tour',
    entityId: tour._id,
    after: { added: uploaded.length, failed: failed.length },
    req,
  });
  if (tour.status === 'published') revalidateContent(ctx, [`tour:${tour.slug}`]);
  return { tour, failed };
}

export async function editTourImages(ctx, id, edits, actor, req) {
  const tour = await getTourAdmin(id);
  tour.images = applyImageEdits(
    tour.images.map((image) => image.toObject()),
    edits,
  );
  tour.updatedBy = actor._id;
  await tour.save();
  await recordAudit({
    actor,
    action: 'tour.images.update',
    entityType: 'Tour',
    entityId: tour._id,
    req,
  });
  if (tour.status === 'published') revalidateContent(ctx, [`tour:${tour.slug}`]);
  return tour;
}

export async function removeTourImage(ctx, id, publicId, actor, req) {
  const tour = await getTourAdmin(id);
  if (!tour.images.some((i) => i.publicId === publicId)) {
    throw AppError.notFound('Image not found on this tour');
  }
  if (tour.status === 'published' && tour.images.length === 1) {
    throw AppError.conflict(
      ERROR_CODES.INVALID_TRANSITION,
      'A published tour needs at least one image',
    );
  }
  tour.images = normaliseImages(
    tour.images.filter((i) => i.publicId !== publicId).map((i) => i.toObject()),
  );
  tour.updatedBy = actor._id;
  await tour.save();
  await destroyIfManaged(ctx, publicId);
  await recordAudit({
    actor,
    action: 'tour.images.remove',
    entityType: 'Tour',
    entityId: tour._id,
    before: { publicId },
    req,
  });
  if (tour.status === 'published') revalidateContent(ctx, [`tour:${tour.slug}`]);
  return tour;
}
