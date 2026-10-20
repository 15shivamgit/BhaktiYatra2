import { primaryImage, toLatLng } from '../../models/shared.js';

const sortedImages = (images = []) =>
  [...images]
    .sort((a, b) => a.order - b.order)
    .map(({ url, publicId, alt, width, height, isPrimary, order }) => ({
      url,
      publicId,
      alt,
      width: width ?? null,
      height: height ?? null,
      isPrimary: Boolean(isPrimary),
      order,
    }));

/** List shape (docs/04-api/03-temples-circuits.md "TempleCard"). */
export function toTempleCard(temple, extra = {}) {
  return {
    id: temple._id.toString(),
    slug: temple.slug,
    name: temple.name,
    deity: temple.deity,
    city: temple.city,
    state: temple.state,
    shortDescription: temple.shortDescription,
    primaryImage: primaryImage(temple.images),
    featured: Boolean(temple.featured),
    location: toLatLng(temple.location),
    ...extra,
  };
}

/** Public detail shape: everything a visitor may see, nothing internal. */
export function toTemplePublic(temple) {
  return {
    ...toTempleCard(temple),
    religion: temple.religion,
    district: temple.district ?? null,
    address: temple.address ?? null,
    pincode: temple.pincode ?? null,
    description: temple.description,
    history: temple.history ?? null,
    significance: temple.significance ?? null,
    timings: temple.timings ?? [],
    aartiSchedule: temple.aartiSchedule ?? [],
    festivals: temple.festivals ?? [],
    bestTimeToVisit: temple.bestTimeToVisit ?? null,
    howToReach: temple.howToReach ?? null,
    rules: temple.rules ?? [],
    entryFee: temple.entryFee ?? null,
    officialWebsite: temple.officialWebsite || null,
    darshanBookingUrl: temple.darshanBookingUrl || null,
    contactPhone: temple.contactPhone ?? null,
    images: sortedImages(temple.images),
    tags: temple.tags ?? [],
    seo: temple.seo ?? null,
    publishedAt: temple.publishedAt ?? null,
    updatedAt: temple.updatedAt,
  };
}

/** Admin shape: public fields plus status, notes and audit fields. */
export function toTempleAdmin(temple) {
  return {
    ...toTemplePublic(temple),
    status: temple.status,
    notes: temple.notes ?? '',
    viewCount: temple.viewCount ?? 0,
    createdAt: temple.createdAt,
  };
}

export function toTempleAdminListItem(temple) {
  return {
    id: temple._id.toString(),
    slug: temple.slug,
    name: temple.name,
    city: temple.city,
    state: temple.state,
    deity: temple.deity,
    status: temple.status,
    featured: Boolean(temple.featured),
    primaryImage: primaryImage(temple.images),
    imageCount: temple.images?.length ?? 0,
    publishedAt: temple.publishedAt ?? null,
    updatedAt: temple.updatedAt,
  };
}
