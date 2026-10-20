/**
 * Seeds the sample tours and their departures (scripts/data/sample-tours.data.js). Used by
 * scripts/seed-sample-tours.js and the E2E server. Needs the launch temples to be seeded first
 * and an open Mongoose connection.
 */
import { Temple } from '../../src/models/Temple.js';
import { Tour } from '../../src/models/Tour.js';
import { TourDeparture } from '../../src/models/TourDeparture.js';
import { publishProblems } from '../../src/modules/tours/tours.admin.service.js';
import { createTourSchema } from '../../src/modules/tours/tours.schemas.js';
import { addDays, todayIst } from '../../src/utils/dates.js';
import { sanitizeRichText } from '../../src/utils/html.js';
import { SAMPLE_NOTE, SAMPLE_TOURS } from '../data/sample-tours.data.js';
import { loadImageManifest, toImage } from './content-seed.js';

async function templeIds(slugs) {
  const temples = await Temple.find({ slug: { $in: slugs } }).select('slug');
  const bySlug = new Map(temples.map((t) => [t.slug, t._id]));
  const missing = slugs.filter((slug) => !bySlug.has(slug));
  if (missing.length) {
    throw new Error(
      `Seed the temples first (npm run seed:content); missing: ${missing.join(', ')}`,
    );
  }
  return slugs.map((slug) => bySlug.get(slug));
}

/**
 * Upsert the sample tours (published) and give each tour its sample departures when it has none.
 * @param {{ now?: Date }} [options]
 * @returns {Promise<{ tours: number, departures: number }>}
 */
export async function seedSampleTours({ now = new Date() } = {}) {
  const manifest = loadImageManifest();
  let departureCount = 0;

  for (const entry of SAMPLE_TOURS) {
    const { images, departures, temples, ...input } = entry;
    const parsed = createTourSchema.body.safeParse(input);
    if (!parsed.success) {
      const problems = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      throw new Error(`${entry.slug} is invalid:\n  ${problems.join('\n  ')}`);
    }
    const data = parsed.data;
    const fields = {
      ...data,
      description: sanitizeRichText(data.description),
      itinerary: data.itinerary.map((d) => ({
        ...d,
        description: sanitizeRichText(d.description),
      })),
      durationNights: data.durationNights ?? data.durationDays - 1,
      temples: await templeIds(temples),
      images: images.map((image, index) => toImage(manifest, image, index)),
      notes: SAMPLE_NOTE,
    };
    const problems = publishProblems(fields);
    if (problems.length) {
      throw new Error(
        `${entry.slug} cannot be published: ${problems.map((p) => p.message).join('; ')}`,
      );
    }

    const tour = await Tour.findOneAndUpdate(
      { slug: entry.slug },
      {
        $set: { ...fields, status: 'published' },
        $setOnInsert: { publishedAt: now },
      },
      { upsert: true, returnDocument: 'after', runValidators: true },
    );

    if (await TourDeparture.exists({ tour: tour._id })) continue;
    const today = todayIst(now);
    await TourDeparture.insertMany(
      departures.map(({ inDays, totalSeats, price }) => {
        const startDate = addDays(today, inDays);
        return {
          tour: tour._id,
          startDate,
          endDate: addDays(startDate, tour.durationDays - 1),
          pickupCity: null,
          price: price ?? tour.basePrice,
          totalSeats,
          seatsAvailable: totalSeats,
          status: 'scheduled',
          pickupInstructions: `Report at the ${tour.pickupCities[0]} pickup point by 6:00 am. Exact address is sent a week before departure.`,
        };
      }),
    );
    departureCount += departures.length;
  }
  return { tours: SAMPLE_TOURS.length, departures: departureCount };
}
