/**
 * API load test (Phase 9, NFR-PERF-02): seeds an in-memory database with release-sized data
 * (1,000 temples, 50 tours, 500 departures, 10,000 bookings), runs the API, measures list,
 * detail and booking endpoints under concurrent load, then checks seat inventory and the query
 * plans of the busiest queries. Never touches a real database.
 *
 *   npm run test:load -w backend
 *   LOAD_SECONDS=20 LOAD_CONNECTIONS=40 npm run test:load -w backend
 */
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connectDb } from '../src/config/db.js';
import { parseEnv } from '../src/config/env.js';
import { createLogger } from '../src/config/logger.js';
import { Booking } from '../src/models/Booking.js';
import { Payment } from '../src/models/Payment.js';
import { Temple } from '../src/models/Temple.js';
import { Tour } from '../src/models/Tour.js';
import { TourDeparture } from '../src/models/TourDeparture.js';
import { User } from '../src/models/User.js';
import { hashPassword } from '../src/modules/auth/password.js';
import { reconcileInventory } from '../src/modules/bookings/bookings.service.js';
import { createPaymentsProvider } from '../src/providers/payments.provider.js';
import { addDays, todayIst } from '../src/utils/dates.js';

const out = (line = '') => process.stdout.write(`${line}\n`);
const SECONDS = Number(process.env.LOAD_SECONDS ?? 10);
const CONNECTIONS = Number(process.env.LOAD_CONNECTIONS ?? 20);
const P95_TARGET_MS = 300;
const COUNTS = { temples: 1000, tours: 50, departures: 500, bookings: 10_000, users: 2000 };

const STATES = ['Uttarakhand', 'Uttar Pradesh', 'Tamil Nadu', 'Maharashtra', 'Gujarat', 'Odisha'];
const DEITIES = ['Shiva', 'Vishnu', 'Devi', 'Ganesha', 'Hanuman', 'Krishna'];
const pick = (list, i) => list[i % list.length];

/* ---------- data ---------- */

async function seed() {
  const started = Date.now();
  const image = (i) => ({
    url: `https://res.cloudinary.com/demo/image/upload/seed/l${i}.jpg`,
    publicId: `bhaktiyatra/load/l${i}`,
    alt: 'Temple',
    isPrimary: true,
    order: 0,
  });
  await Temple.insertMany(
    Array.from({ length: COUNTS.temples }, (_, i) => ({
      name: `Load Temple ${i} ${pick(DEITIES, i)}`,
      slug: `load-temple-${i}`,
      deity: pick(DEITIES, i),
      state: pick(STATES, i * 7),
      city: `City ${i % 120}`,
      shortDescription: 'A temple visited by pilgrims through the year, with daily aarti.',
      description: `<p>${'Pilgrims gather here for darshan and festivals. '.repeat(8)}</p>`,
      location: { type: 'Point', coordinates: [72 + (i % 150) / 10, 10 + (i % 200) / 10] },
      timings: [{ label: 'Darshan', open: '05:00', close: '21:00' }],
      images: [image(i)],
      featured: i % 25 === 0,
      status: i % 10 === 0 ? 'draft' : 'published',
      publishedAt: new Date(Date.now() - i * 60_000),
    })),
  );
  const templeIds = (await Temple.find().select('_id').limit(200)).map((t) => t._id);

  const tours = await Tour.insertMany(
    Array.from({ length: COUNTS.tours }, (_, i) => ({
      title: `Load Yatra ${i}`,
      slug: `load-yatra-${i}`,
      summary: 'A guided pilgrimage with stays, transport and darshan arranged.',
      description: '<p>Day-by-day guided pilgrimage.</p>',
      destinations: ['Haridwar', 'Rishikesh'],
      durationDays: 3,
      durationNights: 2,
      itinerary: [1, 2, 3].map((day) => ({
        day,
        title: `Day ${day}`,
        description: '<p>Darshan and travel.</p>',
        meals: ['breakfast'],
        stay: 'Hotel',
      })),
      inclusions: ['Hotel stay'],
      exclusions: ['Personal expenses'],
      pickupCities: ['Delhi'],
      temples: [templeIds[i % templeIds.length], templeIds[(i + 1) % templeIds.length]],
      basePrice: 5000 + i * 100,
      images: [image(i)],
      status: 'published',
      publishedAt: new Date(),
    })),
  );

  const today = todayIst();
  const SEATS = 40;
  const departures = await TourDeparture.insertMany(
    Array.from({ length: COUNTS.departures }, (_, i) => {
      const startDate = addDays(today, 10 + (i % 300));
      return {
        tour: tours[i % tours.length]._id,
        startDate,
        endDate: addDays(startDate, 2),
        price: 5000 + (i % 30) * 100,
        totalSeats: SEATS,
        seatsAvailable: SEATS,
        status: 'scheduled',
      };
    }),
  );

  const passwordHash = await hashPassword('Load-Test-Pass-1', 4);
  const users = await User.insertMany(
    Array.from({ length: COUNTS.users }, (_, i) => ({
      name: `Load User ${i}`,
      email: `load${i}@example.com`,
      passwordHash,
      role: i === 0 ? 'admin' : 'user',
    })),
  );

  // 10,000 bookings; each departure gets 20, using at most 30 of its 40 seats.
  const statuses = ['confirmed', 'confirmed', 'confirmed', 'expired', 'cancelled', 'pending'];
  const committed = new Map();
  const bookings = [];
  for (let i = 0; i < COUNTS.bookings; i += 1) {
    const departure = departures[i % departures.length];
    const status = pick(statuses, Math.floor(i / departures.length));
    const seats = 1 + (i % 2);
    if (['pending', 'confirmed'].includes(status)) {
      committed.set(departure.id, (committed.get(departure.id) ?? 0) + seats);
    }
    const tour = tours[i % tours.length];
    bookings.push({
      bookingReference: `BY-LOAD-${String(i).padStart(6, '0')}`,
      user: users[1 + (i % (users.length - 1))]._id,
      tour: departure.tour,
      departure: departure._id,
      snapshot: {
        tourTitle: tour.title,
        tourSlug: tour.slug,
        startDate: departure.startDate,
        endDate: departure.endDate,
        durationDays: 3,
      },
      contact: { name: `Pilgrim ${i}`, email: `pilgrim${i}@example.com`, phone: '+919876543210' },
      travellers: Array.from({ length: seats }, () => ({
        name: 'Traveller',
        age: 40,
        gender: 'female',
      })),
      seats,
      unitPrice: departure.price,
      amount: departure.price * seats,
      bookingStatus: status,
      paymentStatus: status === 'confirmed' ? 'paid' : 'pending',
      holdExpiresAt: status === 'pending' ? addDays(new Date(), 1) : addDays(new Date(), -1),
      confirmedAt: status === 'confirmed' ? addDays(new Date(), -(i % 90)) : undefined,
      createdAt: addDays(new Date(), -(i % 120)),
    });
  }
  const inserted = await Booking.insertMany(bookings);
  await Payment.insertMany(
    inserted
      .filter((b) => b.bookingStatus === 'confirmed')
      .map((b) => ({
        booking: b._id,
        provider: 'stub',
        providerOrderId: `order_${b.bookingReference}`,
        providerPaymentId: `pay_${b.bookingReference}`,
        amount: b.amount,
        amountPaise: b.amount * 100,
        status: 'captured',
        capturedAt: b.confirmedAt,
      })),
  );
  await TourDeparture.bulkWrite(
    departures.map((d) => ({
      updateOne: {
        filter: { _id: d._id },
        update: { $set: { seatsAvailable: SEATS - (committed.get(d.id) ?? 0) } },
      },
    })),
  );
  out(
    `Seeded ${COUNTS.temples} temples, ${COUNTS.tours} tours, ${COUNTS.departures} departures, ` +
      `${COUNTS.bookings} bookings, ${COUNTS.users} users in ${((Date.now() - started) / 1000).toFixed(1)} s`,
  );
  return { departures, users };
}

/* ---------- load ---------- */

const percentile = (sorted, p) =>
  sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];

/**
 * Keep CONNECTIONS requests in flight for SECONDS (or until `total` requests are done).
 * @param {(i: number) => Promise<Response>} makeRequest
 */
async function run(name, makeRequest, { total, connections = CONNECTIONS } = {}) {
  const latencies = [];
  let errors = 0;
  let next = 0;
  const deadline = Date.now() + SECONDS * 1000;
  const worker = async () => {
    while (total ? next < total : Date.now() < deadline) {
      const i = next;
      next += 1;
      const t0 = performance.now();
      try {
        const res = await makeRequest(i);
        await res.arrayBuffer();
        if (res.status >= 400) errors += 1;
      } catch {
        errors += 1;
      }
      latencies.push(performance.now() - t0);
    }
  };
  const started = performance.now();
  await Promise.all(Array.from({ length: connections }, worker));
  const seconds = (performance.now() - started) / 1000;
  latencies.sort((a, b) => a - b);
  const row = {
    name,
    requests: latencies.length,
    rps: Math.round(latencies.length / seconds),
    p50: Math.round(percentile(latencies, 0.5)),
    p95: Math.round(percentile(latencies, 0.95)),
    p99: Math.round(percentile(latencies, 0.99)),
    errors,
  };
  out(
    `${name.padEnd(34)} ${String(row.requests).padStart(6)} req ${String(row.rps).padStart(5)}/s ` +
      `p50 ${String(row.p50).padStart(4)} ms  p95 ${String(row.p95).padStart(4)} ms  ` +
      `p99 ${String(row.p99).padStart(4)} ms  errors ${errors}`,
  );
  return row;
}

async function login(base, email) {
  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Load-Test-Pass-1' }),
  });
  if (!res.ok) throw new Error(`login failed for ${email}: ${res.status}`);
  return res.headers.get('set-cookie').split(';')[0];
}

/* ---------- query plans ---------- */

function planStages(plan, stages = []) {
  if (!plan) return stages;
  stages.push(plan.stage);
  planStages(plan.inputStage, stages);
  for (const child of plan.inputStages ?? []) planStages(child, stages);
  return stages;
}

async function explain(name, query) {
  const result = await query.explain('executionStats');
  const plan =
    result.queryPlanner?.winningPlan ?? result.stages?.[0]?.$cursor?.queryPlanner?.winningPlan;
  const stats = result.executionStats ?? result.stages?.[0]?.$cursor?.executionStats ?? {};
  const stages = planStages(plan?.queryPlan ?? plan);
  const usesIndex = stages.some((s) =>
    ['IXSCAN', 'TEXT_MATCH', 'TEXT', 'GEO_NEAR_2DSPHERE', 'IDHACK', 'EXPRESS_IXSCAN'].includes(s),
  );
  out(
    `${usesIndex ? 'index' : 'SCAN '} ${name.padEnd(42)} examined ${String(stats.totalDocsExamined ?? '?').padStart(6)} ` +
      `returned ${String(stats.nReturned ?? '?').padStart(5)}  [${[...new Set(stages)].join(' > ')}]`,
  );
  return { name, usesIndex, examined: stats.totalDocsExamined, returned: stats.nReturned };
}

/* ---------- main ---------- */

const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
const env = parseEnv({
  NODE_ENV: 'test',
  PORT: '5200', // required by the config; the server below takes any free port
  LOG_LEVEL: 'error',
  MONGO_URL: replSet.getUri('bhaktiyatra_load'),
  FRONTEND_URLS: 'http://localhost:3000',
  SITE_URL: 'http://localhost:3000',
  JWT_SECRET: 'load-test-only-secret-that-is-at-least-32-characters',
  REVALIDATE_SECRET: 'load-test-revalidate-secret',
  BCRYPT_ROUNDS: '4',
  RATE_LIMIT_ENABLED: 'false',
  JOBS_ENABLED: 'false',
  TICKET_SIGNING_SECRET: 'load-test-ticket-secret-0123456789abcdef',
  MAIL_PROVIDER: 'console',
});
const logger = createLogger({ level: 'error' });
await connectDb(env.MONGO_URL, logger, { attempts: 1 });
await Promise.all(Object.values(mongoose.models).map((m) => m.init()));

const { departures, users } = await seed();
const payments = createPaymentsProvider({ provider: 'stub', nodeEnv: 'test' });
const app = createApp({ env, logger, providers: { payments } });
const server = app.listen(0);
await new Promise((resolve) => server.once('listening', resolve));
const base = `http://localhost:${server.address().port}/api/v1`;
const adminCookie = await login(base, 'load0@example.com');

out(`\nLoad: ${CONNECTIONS} concurrent connections, ${SECONDS} s per list scenario\n`);
const rows = [];
const get = (path, cookie) =>
  fetch(`${base}${path}`, cookie ? { headers: { Cookie: cookie } } : {});
rows.push(await run('GET /temples (pages 1-40)', (i) => get(`/temples?page=${1 + (i % 40)}`)));
rows.push(
  await run('GET /temples state+deity filter', (i) =>
    get(`/temples?state=${encodeURIComponent(pick(STATES, i))}&deity=${pick(DEITIES, i)}`),
  ),
);
rows.push(await run('GET /temples?q= text search', (i) => get(`/temples?q=${pick(DEITIES, i)}`)));
rows.push(
  await run('GET /temples/:slug', (i) => get(`/temples/load-temple-${((i * 7) % 90) * 10 + 1}`)),
);
rows.push(await run('GET /tours', (i) => get(`/tours?page=${1 + (i % 4)}`)));
rows.push(await run('GET /tours/:slug', (i) => get(`/tours/load-yatra-${i % COUNTS.tours}`)));
rows.push(
  await run('GET /admin/bookings (filters)', (i) =>
    get(
      `/admin/bookings?page=${1 + (i % 20)}${pick(['&bookingStatus=confirmed', '&bookingStatus=pending', ''], i)}`,
      adminCookie,
    ),
  ),
);
rows.push(
  await run('GET /admin/bookings?q=', (i) =>
    get(`/admin/bookings?q=pilgrim${i % 9000}@`, adminCookie),
  ),
);
rows.push(
  await run('GET /admin/payments', (i) => get(`/admin/payments?page=${1 + (i % 20)}`, adminCookie)),
);

// Bookings: 300 different users each book one seat at the same time.
const BOOKERS = 300;
const cookies = [];
for (let i = 1; i <= BOOKERS; i += 1) cookies.push(await login(base, users[i].email));
const before = await reconcileInventory();
rows.push(
  await run(
    'POST /bookings (300 users at once)',
    (i) =>
      fetch(`${base}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookies[i] },
        body: JSON.stringify({
          departureId: departures[i % 50].id,
          seats: 1,
          contact: { name: 'Load Booker', email: `booker${i}@example.com`, phone: '9876543210' },
          travellers: [{ name: 'Load Booker', age: 40, gender: 'male' }],
          acceptedTerms: true,
        }),
      }),
    { total: BOOKERS, connections: 50 },
  ),
);
const after = await reconcileInventory();

out('\nInventory check (reconciliation)');
out(`before load: ${before.checked} departures checked, ${before.mismatches.length} mismatches`);
out(`after load:  ${after.checked} departures checked, ${after.mismatches.length} mismatches`);

out('\nQuery plans');
const today = todayIst();
const plans = [
  await explain(
    'public temple list (default sort)',
    Temple.find({ status: 'published' }).sort({ featured: -1, publishedAt: -1 }).limit(12),
  ),
  await explain(
    'public temple list by state',
    Temple.find({ status: 'published', state: 'Gujarat' }).limit(12),
  ),
  await explain(
    'public temple text search',
    Temple.find({ status: 'published', $text: { $search: 'Shiva' } }).limit(12),
  ),
  await explain('temple by slug', Temple.findOne({ slug: 'load-temple-5' })),
  await explain(
    'tour departures (public page)',
    TourDeparture.find({ tour: departures[0].tour, startDate: { $gte: today } }).sort({
      startDate: 1,
    }),
  ),
  await explain(
    'my bookings',
    Booking.find({ user: users[5]._id }).sort({ createdAt: -1 }).limit(20),
  ),
  await explain(
    'expiry job (pending past hold)',
    Booking.find({ bookingStatus: 'pending', holdExpiresAt: { $lt: new Date() } }).limit(200),
  ),
  await explain('admin bookings newest first', Booking.find({}).sort({ createdAt: -1 }).limit(20)),
  await explain(
    'admin bookings by status',
    Booking.find({ bookingStatus: 'confirmed' }).sort({ createdAt: -1 }).limit(20),
  ),
  await explain('booking by reference', Booking.findOne({ bookingReference: 'BY-LOAD-000123' })),
  await explain(
    'bookings of a departure (seat counts)',
    Booking.find({
      departure: departures[3]._id,
      bookingStatus: { $in: ['pending', 'confirmed'] },
    }),
  ),
  await explain(
    'payments of a booking',
    Payment.find({ booking: (await Booking.findOne().select('_id'))._id }),
  ),
];

const lists = rows.filter((r) => r.name.startsWith('GET'));
const slow = lists.filter((r) => r.p95 > P95_TARGET_MS);
const failedRequests = rows.reduce((sum, r) => sum + r.errors, 0);
out('\nSummary');
out(
  `list/detail endpoints over p95 ${P95_TARGET_MS} ms: ${slow.length ? slow.map((r) => r.name).join(', ') : 'none'}`,
);
out(`failed requests: ${failedRequests}`);
out(`inventory mismatches after load: ${after.mismatches.length}`);
out(
  `queries without an index: ${
    plans
      .filter((p) => !p.usesIndex)
      .map((p) => p.name)
      .join(', ') || 'none'
  }`,
);

server.close();
await mongoose.disconnect();
await replSet.stop();
process.exit(slow.length || failedRequests || after.mismatches.length ? 1 : 0);
