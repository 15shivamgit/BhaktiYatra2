import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AuditLog } from '../../src/models/AuditLog.js';
import { Booking } from '../../src/models/Booking.js';
import { SlugRedirect } from '../../src/models/SlugRedirect.js';
import { Tour } from '../../src/models/Tour.js';
import { TourDeparture } from '../../src/models/TourDeparture.js';
import { completeDepartures } from '../../src/modules/tours/departures.service.js';
import { addDays, todayIst } from '../../src/utils/dates.js';
import { makeTemple } from '../helpers/content-factories.js';
import { loginAgent, makeAdmin, makeUser } from '../helpers/factories.js';
import { createFakeFrontend, createFakeImages, PNG_1X1 } from '../helpers/fake-providers.js';
import { dayFromToday, makeBooking, makeDeparture, makeTour } from '../helpers/tour-factories.js';
import { buildTestApp, clearTestDb, connectTestDb, disconnectTestDb } from '../helpers/test-app.js';

const base = '/api/v1/admin/tours';
const depBase = '/api/v1/admin/departures';
let app;
let agent;
let frontend;
let user;

beforeAll(() => connectTestDb());
afterAll(() => disconnectTestDb());
beforeEach(async () => {
  await clearTestDb();
  frontend = createFakeFrontend();
  ({ app } = buildTestApp({}, { providers: { images: createFakeImages(), frontend } }));
  const admin = await makeAdmin({ email: 'admin@example.com' });
  agent = request.agent(app);
  await loginAgent(agent, admin.email);
  user = await makeUser({ email: 'pilgrim@example.com' });
});

const minimal = {
  title: 'Char Dham Yatra',
  summary: 'Yamunotri, Gangotri, Kedarnath and Badrinath in ten days.',
  description: '<p>Guided yatra.</p><script>alert(1)</script>',
  destinations: ['Yamunotri', 'Gangotri', 'Kedarnath', 'Badrinath'],
  durationDays: 10,
  pickupCities: ['Haridwar'],
  basePrice: 32000,
};

describe('access control', () => {
  it('guests get 401 and users get 403', async () => {
    const tour = await makeTour();
    const departure = await makeDeparture(tour);
    expect((await request(app).get(base)).status).toBe(401);
    const userAgent = request.agent(app);
    await loginAgent(userAgent, user.email);
    for (const [method, path] of [
      ['get', base],
      ['post', base],
      ['post', `${base}/${tour.id}/departures`],
      ['patch', `${depBase}/${departure.id}/inventory`],
      ['post', `${depBase}/${departure.id}/cancel`],
    ]) {
      expect((await userAgent[method](path).send({})).status, `${method} ${path}`).toBe(403);
    }
  });
});

describe('tour create and update', () => {
  it('creates a draft with an auto slug, default nights and sanitised HTML', async () => {
    const res = await agent.post(base).send(minimal);
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      status: 'draft',
      slug: 'char-dham-yatra',
      durationNights: 9,
      description: '<p>Guided yatra.</p>',
    });
    expect(res.body.meta.publishProblems.map((p) => p.path)).toEqual([
      'images',
      'itinerary',
      'inclusions',
    ]);
    expect(await AuditLog.exists({ action: 'tour.create' })).toBeTruthy();
  });

  it('validates itinerary numbering, nights and required fields', async () => {
    const bad = await agent.post(base).send({
      ...minimal,
      durationNights: 11,
      itinerary: [{ day: 2, title: 'Out of order' }],
    });
    expect(bad.status).toBe(422);
    const paths = bad.body.details.map((d) => d.path);
    expect(paths).toContain('body.itinerary');
    expect(paths).toContain('body.durationNights');
    expect((await agent.post(base).send({ title: 'Only a title' })).status).toBe(422);
  });

  it('rejects unknown temples', async () => {
    const res = await agent.post(base).send({ ...minimal, temples: ['0123456789abcdef01234567'] });
    expect(res.status).toBe(422);
  });

  it('warns when the duration changes on a tour with departures', async () => {
    const tour = await makeTour({ status: 'draft' });
    await makeDeparture(tour);
    const res = await agent.patch(`${base}/${tour.id}`).send({ durationDays: 5 });
    expect(res.status).toBe(200);
    expect(res.body.data.durationNights).toBe(4);
    expect(res.body.meta.warnings[0]).toMatch(/existing departure/);
  });

  it('renaming a published tour leaves a redirect and revalidates the site', async () => {
    const tour = await makeTour({ slug: 'old-slug' });
    const res = await agent.patch(`${base}/${tour.id}`).send({ slug: 'new-slug' });
    expect(res.status).toBe(200);
    expect(await SlugRedirect.findOne({ entityType: 'tour', fromSlug: 'old-slug' })).toMatchObject({
      toSlug: 'new-slug',
    });
    expect(frontend.revalidate).toHaveBeenCalledWith({
      tags: ['content', 'tour:new-slug', 'tour:old-slug'],
    });
  });

  it('returns populated temples in the admin detail', async () => {
    const temple = await makeTemple({ name: 'Kedarnath Temple' });
    const tour = await makeTour({ temples: [temple._id] });
    const res = await agent.get(`${base}/${tour.id}`);
    expect(res.body.data.temples).toEqual([
      {
        id: temple.id,
        name: 'Kedarnath Temple',
        slug: temple.slug,
        city: temple.city,
        status: 'published',
      },
    ]);
  });

  it('lists tours with departure counts', async () => {
    const tour = await makeTour();
    await makeDeparture(tour, { inDays: 10 });
    await makeDeparture(tour, { inDays: -10 });
    const res = await agent.get(base);
    expect(res.body.data[0]).toMatchObject({ departureCount: 2, upcomingDepartureCount: 1 });
  });
});

describe('publishing, archiving and deleting tours', () => {
  it('TC-TOUR-03 publish lists every missing prerequisite, then succeeds once complete', async () => {
    const tour = await makeTour({ status: 'draft', images: [], itinerary: [], inclusions: [] });
    const refused = await agent.post(`${base}/${tour.id}/publish`);
    expect(refused.status).toBe(422);
    expect(refused.body.code).toBe('PUBLISH_PREREQUISITES');
    expect(refused.body.details.map((d) => d.path)).toEqual(['images', 'itinerary', 'inclusions']);

    const complete = await makeTour({ status: 'draft' });
    const ok = await agent.post(`${base}/${complete.id}/publish`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.status).toBe('published');
    expect(ok.body.data.publishedAt).toBeTruthy();
  });

  it('TC-TOUR-03 an itinerary shorter than the duration blocks publishing', async () => {
    const tour = await makeTour({ status: 'draft', publishedAt: undefined, durationDays: 3 });
    tour.itinerary = tour.itinerary.slice(0, 2);
    await tour.save();
    const res = await agent.post(`${base}/${tour.id}/publish`);
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('PUBLISH_PREREQUISITES');
    expect(res.body.details).toEqual([
      { path: 'itinerary', message: 'The itinerary needs exactly 3 days (it has 2)' },
    ]);
  });

  it('itinerary days need titles', async () => {
    const tour = await makeTour({
      status: 'draft',
      durationDays: 2,
      itinerary: [
        { day: 1, title: 'Arrive' },
        { day: 2, title: '' },
      ],
    });
    const res = await agent.post(`${base}/${tour.id}/publish`);
    expect(res.body.details).toEqual([
      { path: 'itinerary', message: 'Every itinerary day needs a title' },
    ]);
  });

  it('archive is refused while upcoming departures have bookings', async () => {
    const tour = await makeTour();
    const departure = await makeDeparture(tour, { inDays: 20 });
    await makeBooking(departure, user, { status: 'pending' });
    const res = await agent.post(`${base}/${tour.id}/archive`);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('HAS_ACTIVE_DEPARTURES');

    await Booking.updateMany({}, { bookingStatus: 'expired' });
    expect((await agent.post(`${base}/${tour.id}/archive`)).status).toBe(200);
  });

  it('deletes only drafts without departures', async () => {
    const published = await makeTour();
    expect((await agent.delete(`${base}/${published.id}`)).status).toBe(409);
    const withDeparture = await makeTour({ status: 'draft' });
    await makeDeparture(withDeparture);
    expect((await agent.delete(`${base}/${withDeparture.id}`)).status).toBe(409);
    const empty = await makeTour({ status: 'draft' });
    expect((await agent.delete(`${base}/${empty.id}`)).status).toBe(204);
    expect(await Tour.exists({ _id: empty._id })).toBeNull();
  });

  it('uploads tour images into the tours folder', async () => {
    const tour = await makeTour({ status: 'draft', images: [] });
    const res = await agent
      .post(`${base}/${tour.id}/images`)
      .field('alts', JSON.stringify(['Pilgrims on the trek']))
      .attach('files', PNG_1X1, 'a.png');
    expect(res.status).toBe(201);
    expect(res.body.data[0]).toMatchObject({ alt: 'Pilgrims on the trek', isPrimary: true });
    expect(res.body.data[0].publicId.startsWith(`bhaktiyatra/dev/tours/${tour.slug}/`)).toBe(true);
  });
});

describe('departures: create', () => {
  it('defaults end date from the duration and price from the base price', async () => {
    const tour = await makeTour({ durationDays: 6, basePrice: 24999 });
    const res = await agent
      .post(`${base}/${tour.id}/departures`)
      .send({ startDate: dayFromToday(30), totalSeats: 40, pickupCity: 'Delhi' });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      startDate: dayFromToday(30),
      endDate: dayFromToday(35),
      price: 24999,
      totalSeats: 40,
      seatsAvailable: 40,
      status: 'scheduled',
      isBookable: true,
      bookingCutoffHours: 24,
      bookedSeats: 0,
      heldSeats: 0,
    });
    expect(await AuditLog.exists({ action: 'departure.create' })).toBeTruthy();
    expect(frontend.revalidate).toHaveBeenCalledWith({ tags: ['content', `tour:${tour.slug}`] });
  });

  it('refuses past dates, unknown pickup cities, bad seat counts and archived tours', async () => {
    const tour = await makeTour();
    const post = (body) => agent.post(`${base}/${tour.id}/departures`).send(body);
    expect((await post({ startDate: dayFromToday(-1), totalSeats: 10 })).status).toBe(422);
    expect(
      (await post({ startDate: dayFromToday(5), totalSeats: 10, pickupCity: 'Mumbai' })).status,
    ).toBe(422);
    expect((await post({ startDate: dayFromToday(5), totalSeats: 0 })).status).toBe(422);
    expect((await post({ startDate: dayFromToday(5), totalSeats: 201 })).status).toBe(422);
    expect(
      (await post({ startDate: dayFromToday(5), endDate: dayFromToday(4), totalSeats: 5 })).status,
    ).toBe(422);

    const archived = await makeTour({ status: 'archived' });
    const res = await agent
      .post(`${base}/${archived.id}/departures`)
      .send({ startDate: dayFromToday(5), totalSeats: 10 });
    expect(res.status).toBe(409);
  });

  it('bulk adds weekly departures and refuses oversized ranges', async () => {
    const tour = await makeTour();
    const res = await agent.post(`${base}/${tour.id}/departures/bulk`).send({
      firstDate: dayFromToday(7),
      lastDate: dayFromToday(35),
      every: 'week',
      totalSeats: 30,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.map((d) => d.startDate)).toEqual(
      [7, 14, 21, 28, 35].map((n) => dayFromToday(n)),
    );
    const tooMany = await agent.post(`${base}/${tour.id}/departures/bulk`).send({
      firstDate: dayFromToday(1),
      lastDate: dayFromToday(800),
      every: 'week',
      totalSeats: 30,
    });
    expect(tooMany.status).toBe(422);
  });

  it('lists a tour’s departures with booked, held and revenue', async () => {
    const tour = await makeTour();
    const departure = await makeDeparture(tour, { seats: 20, price: 10000 });
    await makeBooking(departure, user, { seats: 3, status: 'confirmed' });
    await makeBooking(departure, user, { seats: 2, status: 'pending' });
    await makeBooking(departure, user, { seats: 4, status: 'expired' });
    const res = await agent.get(`${base}/${tour.id}/departures`);
    expect(res.body.data[0]).toMatchObject({
      bookedSeats: 3,
      heldSeats: 2,
      revenue: 30000,
      seatsAvailable: 15,
    });
  });
});

describe('departures: update', () => {
  it('changes price and keeps trip length when the start date moves', async () => {
    const tour = await makeTour({ durationDays: 3 });
    const departure = await makeDeparture(tour, { inDays: 20 });
    const res = await agent
      .patch(`${depBase}/${departure.id}`)
      .send({ startDate: dayFromToday(25), price: 17000 });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      startDate: dayFromToday(25),
      endDate: dayFromToday(27),
      price: 17000,
    });
  });

  it('refuses date changes once seats are booked, but allows other edits', async () => {
    const departure = await makeDeparture(await makeTour());
    await makeBooking(departure, user, { status: 'confirmed' });
    const res = await agent
      .patch(`${depBase}/${departure.id}`)
      .send({ startDate: dayFromToday(50) });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('HAS_BOOKINGS');
    expect(
      (await agent.patch(`${depBase}/${departure.id}`).send({ notes: 'Bus 2 confirmed' })).status,
    ).toBe(200);
  });

  it('refuses edits to cancelled or completed departures', async () => {
    const departure = await makeDeparture(await makeTour(), { status: 'cancelled' });
    const res = await agent.patch(`${depBase}/${departure.id}`).send({ price: 100 });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INVALID_TRANSITION');
  });
});

describe('departures: inventory (TC-INV)', () => {
  it('TC-DEP-02 raises and lowers seats by the same delta and records the reason', async () => {
    const departure = await makeDeparture(await makeTour(), { seats: 20 });
    await makeBooking(departure, user, { seats: 5 });
    const up = await agent
      .patch(`${depBase}/${departure.id}/inventory`)
      .send({ totalSeats: 30, reason: 'Added second bus' });
    expect(up.status).toBe(200);
    expect(up.body.data).toMatchObject({ totalSeats: 30, seatsAvailable: 25, bookedSeats: 5 });
    const audit = await AuditLog.findOne({ action: 'departure.inventory.update' });
    expect(audit.after).toMatchObject({ totalSeats: 30, reason: 'Added second bus' });
  });

  it('TC-DEP-01 refuses to go below committed seats with 409 and counts', async () => {
    const departure = await makeDeparture(await makeTour(), { seats: 20 });
    await makeBooking(departure, user, { seats: 6, status: 'confirmed' });
    await makeBooking(departure, user, { seats: 2, status: 'pending' });
    const res = await agent
      .patch(`${depBase}/${departure.id}/inventory`)
      .send({ totalSeats: 7, reason: 'Smaller bus' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('BELOW_COMMITTED_SEATS');
    expect(res.body.details).toMatchObject({ bookedSeats: 6, heldSeats: 2, committed: 8 });

    const exact = await agent
      .patch(`${depBase}/${departure.id}/inventory`)
      .send({ totalSeats: 8, reason: 'Smaller bus' });
    expect(exact.body.data).toMatchObject({ seatsAvailable: 0, status: 'full' });

    const back = await agent
      .patch(`${depBase}/${departure.id}/inventory`)
      .send({ totalSeats: 12, reason: 'Bigger bus again' });
    expect(back.body.data).toMatchObject({ seatsAvailable: 4, status: 'scheduled' });
  });

  it('TC-DEP-03 keeps the invariant under concurrent adjustments and holds', async () => {
    const departure = await makeDeparture(await makeTour(), { seats: 20 });
    await makeBooking(departure, user, { seats: 10, status: 'confirmed' });
    // Simulated concurrent holds (the Phase 5 hold is the same conditional $inc).
    const hold = () =>
      TourDeparture.updateOne(
        { _id: departure._id, seatsAvailable: { $gte: 1 } },
        { $inc: { seatsAvailable: -1 } },
      );
    const adjust = (totalSeats) =>
      agent.patch(`${depBase}/${departure.id}/inventory`).send({ totalSeats, reason: 'Race test' });

    const results = await Promise.all([adjust(12), hold(), adjust(15), hold(), adjust(11), hold()]);
    const adjustments = [results[0], results[2], results[4]];
    const holds = [results[1], results[3], results[5]].reduce((n, r) => n + r.modifiedCount, 0);
    expect(adjustments.every((r) => r.status === 200 || r.status === 409)).toBe(true);

    const fresh = await TourDeparture.findById(departure._id);
    expect(fresh.seatsAvailable).toBeGreaterThanOrEqual(0);
    // Invariant: totalSeats − seatsAvailable = seats taken (10 booked + successful holds).
    expect(fresh.totalSeats - fresh.seatsAvailable).toBe(10 + holds);
    expect([12, 15, 11, 20]).toContain(fresh.totalSeats);
  });
});

describe('departures: cancel, delete, complete', () => {
  it('TC-DEP-04 cancelling expires pending bookings and flags confirmed ones for refunds', async () => {
    const departure = await makeDeparture(await makeTour(), { seats: 20 });
    const pending = await makeBooking(departure, user, { seats: 2, status: 'pending' });
    const confirmed = await makeBooking(departure, user, { seats: 3, status: 'confirmed' });

    const res = await agent
      .post(`${depBase}/${departure.id}/cancel`)
      .send({ reason: 'Landslide on route' });
    expect(res.status).toBe(200);
    expect(res.body.data.affected).toEqual({ pending: 1, confirmed: 1 });
    expect(res.body.data.departure).toMatchObject({
      status: 'cancelled',
      isBookable: false,
      seatsAvailable: 17,
    });

    const p = await Booking.findById(pending._id);
    expect(p.bookingStatus).toBe('expired');
    const c = await Booking.findById(confirmed._id);
    expect(c.bookingStatus).toBe('cancellation_requested');
    expect(c.cancellation).toMatchObject({
      departureCancelled: true,
      reason: 'Landslide on route',
    });
    expect(c.timeline.at(-1).event).toBe('departure_cancelled');

    expect(
      (await agent.post(`${depBase}/${departure.id}/cancel`).send({ reason: 'Again' })).status,
    ).toBe(409);
  });

  it('deletes only departures without any booking', async () => {
    const tour = await makeTour();
    const used = await makeDeparture(tour);
    await makeBooking(used, user, { status: 'expired' });
    expect((await agent.delete(`${depBase}/${used.id}`)).status).toBe(409);
    const unused = await makeDeparture(tour);
    expect((await agent.delete(`${depBase}/${unused.id}`)).status).toBe(204);
  });

  it('completeDepartures marks finished trips completed and leaves the rest', async () => {
    const tour = await makeTour({ durationDays: 3 });
    const finished = await makeDeparture(tour, { inDays: -10 });
    const ongoing = await makeDeparture(tour, { inDays: -1 });
    const cancelled = await makeDeparture(tour, { inDays: -20, status: 'cancelled' });
    const result = await completeDepartures();
    expect(result.completed).toBe(1);
    expect((await TourDeparture.findById(finished._id)).status).toBe('completed');
    expect((await TourDeparture.findById(ongoing._id)).status).toBe('scheduled');
    expect((await TourDeparture.findById(cancelled._id)).status).toBe('cancelled');
    // A trip that ended yesterday completes today.
    const endedYesterday = await TourDeparture.create({
      tour: tour._id,
      startDate: addDays(todayIst(), -3),
      endDate: addDays(todayIst(), -1),
      price: 1,
      totalSeats: 1,
      seatsAvailable: 1,
    });
    await completeDepartures();
    expect((await TourDeparture.findById(endedYesterday._id)).status).toBe('completed');
  });
});
