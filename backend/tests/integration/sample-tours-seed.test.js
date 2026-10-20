import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedContent } from '../../scripts/lib/content-seed.js';
import { seedSampleTours } from '../../scripts/lib/tour-seed.js';
import { SAMPLE_TOURS } from '../../scripts/data/sample-tours.data.js';
import { Tour } from '../../src/models/Tour.js';
import { TourDeparture } from '../../src/models/TourDeparture.js';
import { buildTestApp, clearTestDb, connectTestDb, disconnectTestDb } from '../helpers/test-app.js';

beforeAll(async () => {
  await connectTestDb();
  await clearTestDb();
});
afterAll(() => disconnectTestDb());

describe('sample tours seed', () => {
  it('publishes every sample tour with temples, images and future departures', async () => {
    await seedContent({ status: 'published' });
    const result = await seedSampleTours();
    const expectedDepartures = SAMPLE_TOURS.reduce((n, t) => n + t.departures.length, 0);
    expect(result).toEqual({ tours: SAMPLE_TOURS.length, departures: expectedDepartures });

    const tours = await Tour.find({ status: 'published' });
    expect(tours).toHaveLength(SAMPLE_TOURS.length);
    for (const tour of tours) {
      expect(tour.itinerary).toHaveLength(tour.durationDays);
      expect(tour.temples.length).toBeGreaterThan(0);
      expect(tour.images[0].url).toMatch(/^https:\/\/res\.cloudinary\.com\//);
    }
    expect(await TourDeparture.countDocuments({ startDate: { $lt: new Date() } })).toBe(0);
  });

  it('is safe to run again (no duplicate departures)', async () => {
    const before = await TourDeparture.countDocuments();
    const again = await seedSampleTours();
    expect(again.departures).toBe(0);
    expect(await TourDeparture.countDocuments()).toBe(before);
  });

  it('the public API shows bookable sample tours', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/api/v1/tours?bookableOnly=true&limit=50');
    expect(res.body.data).toHaveLength(SAMPLE_TOURS.length);
    const kedar = await request(app).get('/api/v1/temples/kedarnath-temple-rudraprayag');
    expect(kedar.body.data.tours.map((t) => t.slug)).toContain('char-dham-yatra-haridwar');
  });
});
