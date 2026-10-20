import { NEARBY_RADIUS_KM } from '../../config/content.js';
import { Circuit } from '../../models/Circuit.js';
import { SlugRedirect } from '../../models/SlugRedirect.js';
import { Temple } from '../../models/Temple.js';
import { AppError } from '../../utils/app-error.js';
import { escapeRegex } from '../../utils/crypto.js';
import { pageMeta, skipFor } from '../../utils/pagination.js';
import { toTempleCard, toTemplePublic } from './temples.mapper.js';

const EARTH_RADIUS_KM = 6378.1;
const DEFAULT_SORT = { featured: -1, publishedAt: -1, _id: 1 };
const SORTS = { name: { name: 1 }, '-viewCount': { viewCount: -1, _id: 1 }, default: DEFAULT_SORT };

/** Shared filter for list, facets and map queries; null when a circuit slug matches nothing. */
async function buildFilter({ state, deity, religion, featured, circuit, near, radiusKm, bbox }) {
  const filter = { status: 'published' };
  if (state) filter.state = state;
  if (deity) filter.deity = deity;
  if (religion) filter.religion = religion;
  if (featured !== undefined) filter.featured = featured;
  if (circuit) {
    const found = await Circuit.findOne({ slug: circuit, status: 'published' }).select('temples');
    if (!found) return null;
    filter._id = { $in: found.temples };
  }
  if (near) {
    filter.location = {
      $geoWithin: { $centerSphere: [[near.lng, near.lat], radiusKm / EARTH_RADIUS_KM] },
    };
  } else if (bbox) {
    const [minLng, minLat, maxLng, maxLat] = bbox;
    filter.location = {
      $geoWithin: {
        $box: [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
      },
    };
  }
  return filter;
}

/**
 * Published temples with filters and search (FR-TEMPLE-01…03). Full-word text search ranks by
 * relevance; when it finds nothing, a partial-match fallback (e.g. "kedar") is tried so people
 * typing the start of a name still get results.
 */
export async function listTemples(query) {
  const filter = await buildFilter(query);
  if (!filter) return { temples: [], meta: pageMeta(query, 0) };
  const skip = skipFor(query);

  if (query.q) {
    const textFilter = { ...filter, $text: { $search: query.q } };
    const total = await Temple.countDocuments(textFilter);
    if (total > 0) {
      const temples = await Temple.find(textFilter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' }, featured: -1, viewCount: -1 })
        .skip(skip)
        .limit(query.limit);
      return { temples: temples.map((t) => toTempleCard(t)), meta: pageMeta(query, total) };
    }
    const pattern = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ name: pattern }, { city: pattern }, { deity: pattern }, { tags: pattern }];
  }

  const sort = SORTS[query.sort] ?? DEFAULT_SORT;
  const [temples, total] = await Promise.all([
    Temple.find(filter).sort(sort).skip(skip).limit(query.limit),
    Temple.countDocuments(filter),
  ]);
  return { temples: temples.map((t) => toTempleCard(t)), meta: pageMeta(query, total) };
}

/** Counts for the filter panel, computed from published temples only. */
export async function templeFilters() {
  const [states, deities, circuits] = await Promise.all([
    Temple.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$state', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Temple.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$deity', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
    Circuit.find({ status: 'published' }).select('slug name temples').sort({ name: 1 }),
  ]);
  const publishedIds = new Set(
    (await Temple.find({ status: 'published' }).select('_id')).map((t) => t._id.toString()),
  );
  return {
    states: states.map((s) => ({ value: s._id, count: s.count })),
    deities: deities.map((d) => ({ value: d._id, count: d.count })),
    circuits: circuits.map((c) => ({
      slug: c.slug,
      name: c.name,
      count: c.temples.filter((id) => publishedIds.has(id.toString())).length,
    })),
  };
}

/** Published temples within `radiusKm`, nearest first, excluding the temple itself. */
export async function nearbyTemples(temple, { limit = 6, radiusKm = NEARBY_RADIUS_KM } = {}) {
  if (!temple.location?.coordinates) return [];
  const results = await Temple.aggregate([
    {
      $geoNear: {
        near: temple.location,
        distanceField: 'distanceMeters',
        maxDistance: radiusKm * 1000,
        spherical: true,
        query: { status: 'published', _id: { $ne: temple._id } },
      },
    },
    { $limit: limit },
  ]);
  return results.map((t) =>
    toTempleCard(t, { distanceKm: Math.round((t.distanceMeters / 1000) * 10) / 10 }),
  );
}

/** Slug to follow when an old slug was renamed, or null. */
async function redirectFor(slug) {
  const redirect = await SlugRedirect.findOne({ entityType: 'temple', fromSlug: slug });
  return redirect?.toSlug ?? null;
}

/**
 * Temple detail with related content (FR-TEMPLE-04). Returns `{ redirectTo }` for renamed
 * slugs so the caller can answer with a 301.
 */
export async function getTempleBySlug(slug) {
  const temple = await Temple.findOne({ slug, status: 'published' });
  if (!temple) {
    const redirectTo = await redirectFor(slug);
    if (redirectTo) return { redirectTo };
    throw AppError.notFound('Temple not found');
  }
  const [circuits, nearby] = await Promise.all([
    Circuit.find({ status: 'published', temples: temple._id })
      .select('slug name')
      .sort({ name: 1 }),
    nearbyTemples(temple),
  ]);
  return {
    temple: {
      ...toTemplePublic(temple),
      circuits: circuits.map((c) => ({ id: c._id.toString(), slug: c.slug, name: c.name })),
      nearby,
      tours: [], // Phase 4
    },
  };
}

export async function getNearbyBySlug(slug, options) {
  const temple = await Temple.findOne({ slug, status: 'published' }).select('location');
  if (!temple) throw AppError.notFound('Temple not found');
  return nearbyTemples(temple, options);
}

/** Fire-and-forget page-view counter; unknown or unpublished slugs are ignored. */
export async function recordView(slug) {
  await Temple.updateOne({ slug, status: 'published' }, { $inc: { viewCount: 1 } });
}

/** Every published temple slug with its last change, for the sitemap. */
export async function templeSitemapEntries() {
  const temples = await Temple.find({ status: 'published' })
    .select('slug updatedAt')
    .sort({ slug: 1 });
  return temples.map((t) => ({ slug: t.slug, updatedAt: t.updatedAt }));
}
