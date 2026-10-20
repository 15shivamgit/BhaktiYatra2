import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SlugRedirect } from '../../src/models/SlugRedirect.js';
import { makeCircuit, makeTemple } from '../helpers/content-factories.js';
import { makeUser } from '../helpers/factories.js';
import { dayFromToday, makeBooking, makeDeparture, makeTour } from '../helpers/tour-factories.js';
import { buildTestApp, clearTestDb, connectTestDb, disconnectTestDb } from '../helpers/test-app.js';

let app;

beforeAll(() => connectTestDb());
afterAll(() => disconnectTestDb());
beforeEach(async () => {
  await clearTestDb();
  ({ app } = buildTestApp());
});

const list = (query = '') => request(app).get(`/api/v1/tours${query}`);

describe('GET /tours pricing (FR-TOUR-02)', () => {
  it('fromPrice is the cheapest bookable departure and nextDeparture the earliest bookable one', async () => {
    const tour = await makeTour({ basePrice: 20000 });
    await makeDeparture(tour, { inDays: -5, price: 9000 }); // past
    await makeDeparture(tour, { inDays: 0, price: 9500 }); // inside the 24 h cutoff
    await makeDeparture(tour, { inDays: 10, price: 8000, status: 'full', seatsAvailable: 0 });
    await makeDeparture(tour, { inDays: 20, price: 9000, status: 'cancelled' });
    const next = await makeDeparture(tour, { inDays: 30, price: 18000, seats: 12 });
    await makeDeparture(tour, { inDays: 60, price: 16000 });

    const res = await list();
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      fromPrice: 16000,
      priceIsIndicative: false,
      nextDeparture: {
        id: next.id,
        startDate: dayFromToday(30),
        seatsAvailable: 12,
        price: 18000,
      },
    });
  });

  it('falls back to the base price when nothing is bookable', async () => {
    await makeTour({ basePrice: 21000 });
    const res = await list();
    expect(res.body.data[0]).toMatchObject({
      fromPrice: 21000,
      priceIsIndicative: true,
      nextDeparture: null,
    });
    expect((await list('?bookableOnly=true')).body.data).toEqual([]);
  });

  it('hides drafts and archived tours', async () => {
    await makeTour({ status: 'draft' });
    await makeTour({ status: 'archived' });
    expect((await list()).body.data).toEqual([]);
  });
});

describe('GET /tours filters and sorting', () => {
  it('month returns only tours with a departure in that month', async () => {
    const may = await makeTour({ title: 'Has departure in month' });
    const other = await makeTour({ title: 'Departs later' });
    await makeDeparture(may, { inDays: 40 });
    await makeDeparture(other, { inDays: 120 });
    const month = dayFromToday(40).slice(0, 7);
    const res = await list(`?month=${month}`);
    const titles = res.body.data.map((t) => t.title);
    expect(titles).toContain('Has departure in month');
    if (dayFromToday(120).slice(0, 7) !== month) expect(titles).not.toContain('Departs later');
  });

  it('filters by price, duration, destination, pickup city and search', async () => {
    const cheap = await makeTour({
      title: 'Kashi Darshan',
      basePrice: 9000,
      durationDays: 2,
      destinations: ['Varanasi'],
      pickupCities: ['Patna'],
    });
    await makeTour({
      title: 'Char Dham Yatra',
      basePrice: 45000,
      durationDays: 10,
      destinations: ['Kedarnath', 'Badrinath'],
    });
    await makeDeparture(cheap, { inDays: 15, price: 8500 });

    const titles = async (q) => (await list(q)).body.data.map((t) => t.title);
    expect(await titles('?maxPrice=10000')).toEqual(['Kashi Darshan']);
    expect(await titles('?minDays=8')).toEqual(['Char Dham Yatra']);
    expect(await titles('?destination=varanasi')).toEqual(['Kashi Darshan']);
    expect(await titles('?pickupCity=Patna')).toEqual(['Kashi Darshan']);
    expect(await titles('?q=dham')).toEqual(['Char Dham Yatra']);
    expect((await list('?minPrice=50000&maxPrice=100')).status).toBe(422);
  });

  it('filters by temple and circuit', async () => {
    const kedar = await makeTemple({ name: 'Kedarnath', slug: 'kedarnath' });
    const kashi = await makeTemple({ name: 'Kashi Vishwanath', slug: 'kashi-vishwanath' });
    await makeTour({ title: 'Himalayan Yatra', temples: [kedar._id] });
    await makeTour({ title: 'Kashi Yatra', temples: [kashi._id] });
    await makeCircuit({ slug: 'jyotirlingas', temples: [kedar._id] });

    const titles = async (q) => (await list(q)).body.data.map((t) => t.title);
    expect(await titles('?temple=kashi-vishwanath')).toEqual(['Kashi Yatra']);
    expect(await titles('?circuit=jyotirlingas')).toEqual(['Himalayan Yatra']);
    expect(await titles('?temple=unknown')).toEqual([]);
  });

  it('sorts by price and by next departure (tours without dates last)', async () => {
    const a = await makeTour({ title: 'Yatra A', basePrice: 30000 });
    const b = await makeTour({ title: 'Yatra B', basePrice: 10000 });
    await makeTour({ title: 'Yatra C', basePrice: 20000 });
    await makeDeparture(a, { inDays: 50, price: 30000 });
    await makeDeparture(b, { inDays: 70, price: 10000 });

    const titles = async (q) => (await list(q)).body.data.map((t) => t.title);
    expect(await titles('?sort=price')).toEqual(['Yatra B', 'Yatra C', 'Yatra A']);
    expect(await titles('?sort=-price')).toEqual(['Yatra A', 'Yatra C', 'Yatra B']);
    expect(await titles('?sort=nextDeparture')).toEqual(['Yatra A', 'Yatra B', 'Yatra C']);
  });

  it('paginates with meta', async () => {
    for (let i = 0; i < 3; i += 1) await makeTour();
    const res = await list('?limit=2&page=2');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toMatchObject({ page: 2, limit: 2, total: 3, totalPages: 2 });
  });

  it('GET /tours/filters lists destinations, pickup cities and ranges', async () => {
    await makeTour({
      destinations: ['Puri'],
      pickupCities: ['Kolkata'],
      basePrice: 12000,
      durationDays: 4,
    });
    await makeTour({
      destinations: ['Dwarka'],
      pickupCities: ['Ahmedabad'],
      basePrice: 18000,
      durationDays: 6,
    });
    const res = await request(app).get('/api/v1/tours/filters');
    expect(res.body.data).toEqual({
      destinations: ['Dwarka', 'Puri'],
      pickupCities: ['Ahmedabad', 'Kolkata'],
      priceRange: { min: 12000, max: 18000 },
      maxDays: 6,
    });
  });
});

describe('GET /tours/:slug', () => {
  it('returns itinerary, temples in tour order and upcoming departures with bookability', async () => {
    const t1 = await makeTemple({ name: 'First' });
    const t2 = await makeTemple({ name: 'Second' });
    const hidden = await makeTemple({ name: 'Draft temple', status: 'draft' });
    const tour = await makeTour({ slug: 'kedar-yatra', temples: [t2._id, hidden._id, t1._id] });
    await makeDeparture(tour, { inDays: -3 });
    await makeDeparture(tour, { inDays: 0 });
    await makeDeparture(tour, { inDays: 45, pickupCity: 'Delhi', bookingCutoffHours: 48 });
    await makeDeparture(tour, { inDays: 500 }); // beyond 12 months

    const res = await request(app).get('/api/v1/tours/kedar-yatra');
    expect(res.status).toBe(200);
    const { data } = res.body;
    expect(data.temples.map((t) => t.name)).toEqual(['Second', 'First']);
    expect(data.itinerary).toHaveLength(3);
    expect(data.departures.map((d) => [d.startDate, d.isBookable])).toEqual([
      [dayFromToday(0), false],
      [dayFromToday(45), true],
    ]);
    expect(data.departures[1]).toMatchObject({
      pickupCity: 'Delhi',
      totalSeats: 20,
      status: 'scheduled',
    });
    expect(data).not.toHaveProperty('notes');
  });

  it('301s a renamed slug and 404s drafts', async () => {
    await makeTour({ slug: 'new-name' });
    await SlugRedirect.create({ entityType: 'tour', fromSlug: 'old-name', toSlug: 'new-name' });
    const moved = await request(app).get('/api/v1/tours/old-name').redirects(0);
    expect(moved.status).toBe(301);
    expect(moved.body.data.redirect.slug).toBe('new-name');
    await makeTour({ slug: 'secret', status: 'draft' });
    expect((await request(app).get('/api/v1/tours/secret')).status).toBe(404);
  });

  it('GET /tours/:slug/departures honours from/to', async () => {
    const tour = await makeTour({ slug: 'ranged' });
    await makeDeparture(tour, { inDays: 10 });
    await makeDeparture(tour, { inDays: 40 });
    const res = await request(app).get(
      `/api/v1/tours/ranged/departures?from=${dayFromToday(20)}&to=${dayFromToday(60)}`,
    );
    expect(res.body.data.map((d) => d.startDate)).toEqual([dayFromToday(40)]);
    expect(res.headers['cache-control']).toBe('no-store');
  });
});

describe('GET /departures/:id', () => {
  it('returns live availability with a tour summary', async () => {
    const tour = await makeTour();
    const departure = await makeDeparture(tour, { inDays: 20, seats: 10 });
    const user = await makeUser({ email: 'u@example.com' });
    await makeBooking(departure, user, { seats: 3 });
    const res = await request(app).get(`/api/v1/departures/${departure.id}`);
    expect(res.body.data).toMatchObject({
      seatsAvailable: 7,
      isBookable: true,
      tour: { slug: tour.slug },
    });
  });

  it('404s for a draft tour', async () => {
    const departure = await makeDeparture(await makeTour({ status: 'draft' }));
    expect((await request(app).get(`/api/v1/departures/${departure.id}`)).status).toBe(404);
  });
});

describe('tours on temple and circuit pages, and the sitemap', () => {
  it('temple and circuit details list published tours covering them', async () => {
    const temple = await makeTemple({ slug: 'somnath' });
    await makeCircuit({ slug: 'west', temples: [temple._id] });
    await makeTour({ title: 'Gujarat Darshan', temples: [temple._id] });
    await makeTour({ title: 'Unpublished', temples: [temple._id], status: 'draft' });

    const templeRes = await request(app).get('/api/v1/temples/somnath');
    expect(templeRes.body.data.tours.map((t) => t.title)).toEqual(['Gujarat Darshan']);
    const circuitRes = await request(app).get('/api/v1/circuits/west');
    expect(circuitRes.body.data.tours.map((t) => t.title)).toEqual(['Gujarat Darshan']);
  });

  it('sitemap includes published tours', async () => {
    await makeTour({ slug: 'in-sitemap' });
    await makeTour({ slug: 'not-in-sitemap', status: 'draft' });
    const res = await request(app).get('/api/v1/sitemap');
    expect(res.body.data.tours.map((t) => t.slug)).toEqual(['in-sitemap']);
  });
});
