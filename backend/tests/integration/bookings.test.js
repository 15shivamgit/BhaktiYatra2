import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AuditLog } from '../../src/models/AuditLog.js';
import { Booking } from '../../src/models/Booking.js';
import { NotificationLog } from '../../src/models/NotificationLog.js';
import { Payment } from '../../src/models/Payment.js';
import { TourDeparture } from '../../src/models/TourDeparture.js';
import {
  createBooking,
  expireHolds,
  reconcileInventory,
} from '../../src/modules/bookings/bookings.service.js';
import { loginAgent, makeAdmin, makeUser } from '../helpers/factories.js';
import { createFakeFrontend, createFakePayments } from '../helpers/fake-providers.js';
import { makeDeparture, makeTour } from '../helpers/tour-factories.js';
import { buildTestApp, clearTestDb, connectTestDb, disconnectTestDb } from '../helpers/test-app.js';

let app;
let env;
let logger;
let payments;
let user;
let agent;

beforeAll(() => connectTestDb());
afterAll(() => disconnectTestDb());
beforeEach(async () => {
  await clearTestDb();
  payments = createFakePayments();
  ({ app, env, logger } = buildTestApp(
    { ADMIN_NOTIFY_EMAIL: 'owner@example.com' },
    { providers: { payments, frontend: createFakeFrontend() } },
  ));
  user = await makeUser({ email: 'sunita@example.com', name: 'Sunita Sharma' });
  agent = request.agent(app);
  await loginAgent(agent, user.email);
});

const traveller = (n) => ({
  name: `Traveller ${n}`,
  age: 40 + n,
  gender: n % 2 ? 'female' : 'male',
});
const body = (departure, seats = 2, extra = {}) => ({
  departureId: departure.id,
  seats,
  contact: { name: 'Sunita Sharma', email: 'sunita@example.com', phone: '98765 43210' },
  travellers: Array.from({ length: seats }, (_, i) => traveller(i + 1)),
  acceptedTerms: true,
  ...extra,
});
const seatsOf = async (departure) => (await TourDeparture.findById(departure._id)).seatsAvailable;
const book = (departure, seats, extra, a = agent) =>
  a.post('/api/v1/bookings').send(body(departure, seats, extra));

async function setup({ seats = 10, price = 12000, inDays = 30, ...rest } = {}) {
  const tour = await makeTour({ basePrice: price });
  const departure = await makeDeparture(tour, { seats, price, inDays, ...rest });
  return { tour, departure };
}

describe('POST /bookings', () => {
  it('TC-BOOK-01 holds seats, prices from the departure and starts a 15 minute hold', async () => {
    const { departure } = await setup({ price: 12000 });
    const before = Date.now();
    const res = await book(departure, 2);
    expect(res.status).toBe(201);
    const { booking, payment, checkout } = res.body.data;
    expect(booking).toMatchObject({
      seats: 2,
      amount: 24000,
      bookingStatus: 'pending',
      paymentStatus: 'pending',
      tour: { title: expect.any(String) },
    });
    expect(booking.bookingReference).toMatch(/^BY-\d{8}-[A-Z2-9]{5}$/);
    const hold = new Date(booking.holdExpiresAt).getTime() - before;
    expect(hold).toBeGreaterThan(14.9 * 60_000);
    expect(hold).toBeLessThan(15.1 * 60_000);
    expect(payment).toMatchObject({ provider: 'stub', amountPaise: 2_400_000, simulate: true });
    expect(checkout.prefill).toEqual({
      name: 'Sunita Sharma',
      email: 'sunita@example.com',
      contact: '+919876543210',
    });
    expect(await seatsOf(departure)).toBe(8);
    expect(await Payment.countDocuments({ status: 'created', amount: 24000 })).toBe(1);
    expect(await AuditLog.exists({ action: 'booking.create' })).toBeTruthy();
  });

  it('TC-BOOK-02 ignores amounts and prices sent by the client', async () => {
    const { departure } = await setup({ price: 9999 });
    const res = await book(departure, 1, { amount: 1, unitPrice: 1 });
    expect(res.status).toBe(201);
    expect(res.body.data.booking.amount).toBe(9999);
  });

  it('TC-BOOK-03 never oversells: 20 parallel requests for 5 seats', async () => {
    const { departure } = await setup({ seats: 5 });
    const users = await Promise.all(Array.from({ length: 20 }, () => makeUser()));
    const ctx = { env, logger, providers: { payments } };
    const results = await Promise.allSettled(
      users.map((u) =>
        createBooking(ctx, u, {
          departureId: departure.id,
          seats: 1,
          contact: { name: 'A B', email: 'a@example.com', phone: '+919876543210' },
          travellers: [traveller(1)],
        }),
      ),
    );
    const ok = results.filter((r) => r.status === 'fulfilled');
    const refused = results.filter((r) => r.status === 'rejected');
    expect(ok).toHaveLength(5);
    expect(refused).toHaveLength(15);
    expect(refused.every((r) => r.reason.code === 'SEATS_UNAVAILABLE')).toBe(true);
    const fresh = await TourDeparture.findById(departure._id);
    expect(fresh).toMatchObject({ seatsAvailable: 0, status: 'full' });
    expect(await Booking.countDocuments()).toBe(5);
  });

  it('TC-BOOK-04 validates seats, travellers and terms', async () => {
    const { departure } = await setup();
    const mismatch = await agent
      .post('/api/v1/bookings')
      .send({ ...body(departure, 2), travellers: [traveller(1)] });
    expect(mismatch.status).toBe(422);
    expect(mismatch.body.details.map((d) => d.path)).toContain('body.travellers');
    expect((await book(departure, 2, { acceptedTerms: false })).status).toBe(422);
    expect((await book(departure, 11)).status).toBe(422);
    expect(
      (await book(departure, 1, { contact: { name: 'X Y', email: 'x@example.com', phone: '123' } }))
        .status,
    ).toBe(422);
    expect(await seatsOf(departure)).toBe(10);
  });

  it('TC-BOOK-05 refuses a fourth unpaid booking', async () => {
    const { departure } = await setup({ seats: 20 });
    for (let i = 0; i < 3; i += 1) expect((await book(departure, 1)).status).toBe(201);
    const res = await book(departure, 1);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('TOO_MANY_PENDING');
    expect(await seatsOf(departure)).toBe(17);
  });

  it('TC-BOOK-06 gives the seats back when the payment order fails', async () => {
    const { departure } = await setup({ seats: 4 });
    payments.failNext = 1;
    const res = await book(departure, 3);
    expect(res.status).toBe(502);
    expect(res.body.code).toBe('PROVIDER_ERROR');
    expect(await seatsOf(departure)).toBe(4);
    expect(await Booking.countDocuments()).toBe(0);
  });

  it('TC-BOOK-07 replays an Idempotency-Key without a second hold', async () => {
    const { departure } = await setup();
    const send = (b) =>
      agent.post('/api/v1/bookings').set('Idempotency-Key', 'key-abc-12345').send(b);
    const first = await send(body(departure, 2));
    const second = await send(body(departure, 2));
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.headers['idempotent-replayed']).toBe('true');
    expect(second.body.data).toEqual(first.body.data);
    expect(await Booking.countDocuments()).toBe(1);
    expect(await seatsOf(departure)).toBe(8);

    const reused = await send(body(departure, 3));
    expect(reused.status).toBe(422);
    expect(reused.body.code).toBe('IDEMPOTENCY_KEY_REUSED');
  });

  it('a failed request releases its Idempotency-Key for a retry', async () => {
    const { departure } = await setup();
    payments.failNext = 1;
    const send = () =>
      agent
        .post('/api/v1/bookings')
        .set('Idempotency-Key', 'retry-key-0001')
        .send(body(departure, 1));
    expect((await send()).status).toBe(502);
    expect((await send()).status).toBe(201);
  });

  it('TC-DEP-05 refuses dates that closed, were cancelled or are full, and hidden tours', async () => {
    const closing = await setup({ inDays: 0 });
    let res = await book(closing.departure, 1);
    expect(res.status).toBe(410);
    expect(res.body.code).toBe('DEPARTURE_CLOSED');

    const cancelled = await setup({ status: 'cancelled' });
    expect((await book(cancelled.departure, 1)).status).toBe(410);

    const full = await setup({ seats: 2 });
    await TourDeparture.updateOne(
      { _id: full.departure._id },
      { seatsAvailable: 0, status: 'full' },
    );
    res = await book(full.departure, 1);
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ code: 'SEATS_UNAVAILABLE', details: { seatsAvailable: 0 } });

    const few = await setup({ seats: 3 });
    res = await book(few.departure, 4);
    expect(res.body).toMatchObject({ code: 'SEATS_UNAVAILABLE', details: { seatsAvailable: 3 } });

    const draft = await makeDeparture(await makeTour({ status: 'draft' }));
    expect((await book(draft, 1)).status).toBe(404);
  });

  it('requires a signed-in user', async () => {
    const { departure } = await setup();
    expect((await request(app).post('/api/v1/bookings').send(body(departure, 1))).status).toBe(401);
  });
});

describe('reading bookings', () => {
  it('TC-BOOK-11 hides other users’ bookings (404) and lists only my own', async () => {
    const { departure } = await setup();
    const reference = (await book(departure, 1)).body.data.booking.bookingReference;

    const other = await makeUser({ email: 'other@example.com' });
    const otherAgent = request.agent(app);
    await loginAgent(otherAgent, other.email);
    expect((await otherAgent.get(`/api/v1/bookings/${reference}`)).status).toBe(404);
    expect((await otherAgent.get('/api/v1/bookings/my')).body.data).toEqual([]);

    const mine = await agent.get(`/api/v1/bookings/${reference}`);
    expect(mine.status).toBe(200);
    expect(mine.body.data).toMatchObject({
      bookingReference: reference,
      travellers: [traveller(1)],
      timeline: [{ event: 'created', meta: { seats: 1, amount: 12000 } }],
      payments: [{ status: 'created', amount: 12000 }],
    });
    expect(mine.body.meta.serverTime).toBeTruthy();

    const admin = await makeAdmin({ email: 'admin@example.com' });
    const adminAgent = request.agent(app);
    await loginAgent(adminAgent, admin.email);
    expect((await adminAgent.get(`/api/v1/bookings/${reference}`)).status).toBe(200);
    expect((await agent.get('/api/v1/bookings/my')).body.data).toHaveLength(1);
    expect((await agent.get('/api/v1/bookings/BY-2026')).status).toBe(422);
  });
});

describe('user cancellation', () => {
  it('TC-BOOK-10 cancels an unpaid booking and releases its seats', async () => {
    const { departure } = await setup({ seats: 2 });
    const reference = (await book(departure, 2)).body.data.booking.bookingReference;
    expect((await TourDeparture.findById(departure._id)).status).toBe('full');

    const res = await agent
      .post(`/api/v1/bookings/${reference}/cancel`)
      .send({ reason: 'Plans changed' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ bookingStatus: 'cancelled', holdExpiresAt: null });
    const fresh = await TourDeparture.findById(departure._id);
    expect(fresh).toMatchObject({ seatsAvailable: 2, status: 'scheduled' });
    expect(await Payment.findOne()).toMatchObject({
      status: 'failed',
      failureReason: 'cancelled_by_user',
    });

    const again = await agent.post(`/api/v1/bookings/${reference}/cancel`).send({});
    expect(again.status).toBe(409);
    expect(again.body.code).toBe('INVALID_TRANSITION');
  });

  it('a paid booking becomes a cancellation request with a refund quote and an admin alert', async () => {
    const { departure } = await setup({ inDays: 40, price: 10000 });
    const reference = (await book(departure, 2)).body.data.booking.bookingReference;
    await agent.post(`/api/v1/bookings/${reference}/simulate-payment`).send({ outcome: 'success' });

    const res = await agent
      .post(`/api/v1/bookings/${reference}/cancel`)
      .send({ reason: 'Illness' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      bookingStatus: 'cancellation_requested',
      cancellation: { reason: 'Illness', departureCancelled: false },
      cancellationQuote: { chargePct: 10, suggestedRefund: 18000 },
    });
    expect(await seatsOf(departure)).toBe(8); // seats stay held until the admin processes it
    expect(
      await NotificationLog.exists({
        type: 'cancellation_requested_admin',
        to: 'owner@example.com',
      }),
    ).toBeTruthy();
  });
});

describe('payments (stub simulator) and late payments', () => {
  it('confirms once; a repeat is already_confirmed', async () => {
    const { departure } = await setup();
    const reference = (await book(departure, 2)).body.data.booking.bookingReference;
    const pay = () =>
      agent.post(`/api/v1/bookings/${reference}/simulate-payment`).send({ outcome: 'success' });
    const first = await pay();
    expect(first.body.data.state).toBe('confirmed');
    expect(first.body.data.booking).toMatchObject({
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
    });
    expect((await pay()).body.data.state).toBe('already_confirmed');
    expect(await Payment.countDocuments({ status: 'captured' })).toBe(1);
    expect(await NotificationLog.countDocuments({ type: 'booking_confirmed' })).toBe(1);
    expect(await seatsOf(departure)).toBe(8);
  });

  it('a failed attempt keeps the booking pending and a retry can still succeed', async () => {
    const { departure } = await setup();
    const reference = (await book(departure, 1)).body.data.booking.bookingReference;
    const fail = await agent
      .post(`/api/v1/bookings/${reference}/simulate-payment`)
      .send({ outcome: 'failure' });
    expect(fail.body.data.booking).toMatchObject({
      bookingStatus: 'pending',
      paymentStatus: 'failed',
    });
    const ok = await agent
      .post(`/api/v1/bookings/${reference}/simulate-payment`)
      .send({ outcome: 'success' });
    expect(ok.body.data.booking).toMatchObject({
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
    });
  });

  it('late payment after expiry: re-holds seats when free, otherwise payment_received_no_seats', async () => {
    const { departure } = await setup({ seats: 2 });
    const reference = (await book(departure, 2)).body.data.booking.bookingReference;
    await Booking.updateOne(
      { bookingReference: reference },
      { holdExpiresAt: new Date(Date.now() - 1000) },
    );
    await expireHolds();
    expect(await seatsOf(departure)).toBe(2);

    const late = await agent
      .post(`/api/v1/bookings/${reference}/simulate-payment`)
      .send({ outcome: 'success' });
    expect(late.body.data.state).toBe('confirmed_late');
    expect(await seatsOf(departure)).toBe(0);

    // Second booking expires, then someone else takes the seats before the payment lands.
    const second = await setup({ seats: 1 });
    const ref2 = (await book(second.departure, 1)).body.data.booking.bookingReference;
    await Booking.updateOne(
      { bookingReference: ref2 },
      { holdExpiresAt: new Date(Date.now() - 1000) },
    );
    await expireHolds();
    await TourDeparture.updateOne(
      { _id: second.departure._id },
      { seatsAvailable: 0, status: 'full' },
    );
    const noSeats = await agent
      .post(`/api/v1/bookings/${ref2}/simulate-payment`)
      .send({ outcome: 'success' });
    expect(noSeats.body.data.state).toBe('payment_received_no_seats');
    expect(noSeats.body.data.booking).toMatchObject({
      bookingStatus: 'payment_received_no_seats',
      paymentStatus: 'paid',
    });
    expect(await NotificationLog.exists({ type: 'payment_received_no_seats' })).toBeTruthy();
  });

  it('the simulator does not exist when the provider does not allow it', async () => {
    const { app: liveApp } = buildTestApp(
      {},
      { providers: { payments: createFakePayments({ simulate: false }) } },
    );
    const { departure } = await setup();
    const liveAgent = request.agent(liveApp);
    await loginAgent(liveAgent, user.email);
    const reference = (await book(departure, 1, {}, liveAgent)).body.data.booking.bookingReference;
    const res = await liveAgent
      .post(`/api/v1/bookings/${reference}/simulate-payment`)
      .send({ outcome: 'success' });
    expect(res.status).toBe(404);
  });
});

describe('hold expiry job', () => {
  it('TC-BOOK-08 expires overdue holds, releases seats and reopens a full date', async () => {
    const { departure } = await setup({ seats: 3 });
    const reference = (await book(departure, 3)).body.data.booking.bookingReference;
    expect((await TourDeparture.findById(departure._id)).status).toBe('full');
    expect((await expireHolds()).expired).toBe(0); // not due yet

    await Booking.updateOne(
      { bookingReference: reference },
      { holdExpiresAt: new Date(Date.now() - 1000) },
    );
    expect((await expireHolds()).expired).toBe(1);
    const booking = await Booking.findOne({ bookingReference: reference });
    expect(booking.bookingStatus).toBe('expired');
    expect(booking.timeline.at(-1).event).toBe('expired');
    expect(await TourDeparture.findById(departure._id)).toMatchObject({
      seatsAvailable: 3,
      status: 'scheduled',
    });
    expect(await Payment.findOne()).toMatchObject({
      status: 'failed',
      failureReason: 'hold_expired',
    });
  });

  it('TC-BOOK-09 two concurrent runs release the seats only once', async () => {
    const { departure } = await setup({ seats: 6 });
    await book(departure, 2);
    await book(departure, 2);
    await Booking.updateMany({}, { holdExpiresAt: new Date(Date.now() - 1000) });
    const [a, b] = await Promise.all([expireHolds(), expireHolds()]);
    expect(a.expired + b.expired).toBe(2);
    expect(await seatsOf(departure)).toBe(6);
  });
});

describe('inventory reconciliation', () => {
  it('TC-BOOK-13 detects injected drift and fixes it on request', async () => {
    const { departure } = await setup({ seats: 10 });
    await book(departure, 3);
    expect((await reconcileInventory()).mismatches).toEqual([]);

    await TourDeparture.updateOne({ _id: departure._id }, { $inc: { seatsAvailable: 2 } });
    const report = await reconcileInventory();
    expect(report.mismatches).toEqual([
      { departureId: departure.id, totalSeats: 10, committed: 3, seatsAvailable: 9, expected: 7 },
    ]);
    await reconcileInventory({ fix: true });
    expect(await seatsOf(departure)).toBe(7);
    expect((await reconcileInventory()).mismatches).toEqual([]);
  });

  it('stays consistent after a random mix of bookings, cancellations, payments and expiries', async () => {
    const { departure } = await setup({ seats: 30 });
    const users = await Promise.all(Array.from({ length: 8 }, () => makeUser()));
    const agents = await Promise.all(
      users.map(async (u) => {
        const a = request.agent(app);
        await loginAgent(a, u.email);
        return a;
      }),
    );
    let seed = 7;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const references = [];
    for (let i = 0; i < 24; i += 1) {
      const a = agents[Math.floor(random() * agents.length)];
      const action = random();
      if (action < 0.5 || references.length === 0) {
        const res = await book(departure, 1 + Math.floor(random() * 3), {}, a);
        if (res.status === 201) references.push({ a, ref: res.body.data.booking.bookingReference });
      } else {
        const pick = references[Math.floor(random() * references.length)];
        if (action < 0.7) await pick.a.post(`/api/v1/bookings/${pick.ref}/cancel`).send({});
        else if (action < 0.85)
          await pick.a
            .post(`/api/v1/bookings/${pick.ref}/simulate-payment`)
            .send({ outcome: 'success' });
        else {
          await Booking.updateOne(
            { bookingReference: pick.ref, bookingStatus: 'pending' },
            { holdExpiresAt: new Date(0) },
          );
          await expireHolds();
        }
      }
    }
    expect((await reconcileInventory()).mismatches).toEqual([]);
  });
});

describe('departure cancellation with real bookings', () => {
  it('expires pending bookings, flags paid ones, and fails their open payments', async () => {
    const admin = await makeAdmin({ email: 'admin@example.com' });
    const adminAgent = request.agent(app);
    await loginAgent(adminAgent, admin.email);
    const { departure } = await setup({ seats: 10 });
    const pendingRef = (await book(departure, 2)).body.data.booking.bookingReference;
    const paidRef = (await book(departure, 3)).body.data.booking.bookingReference;
    await agent.post(`/api/v1/bookings/${paidRef}/simulate-payment`).send({ outcome: 'success' });

    const res = await adminAgent
      .post(`/api/v1/admin/departures/${departure.id}/cancel`)
      .send({ reason: 'Road closed' });
    expect(res.body.data.affected).toEqual({ pending: 1, confirmed: 1 });
    expect((await Booking.findOne({ bookingReference: pendingRef })).bookingStatus).toBe('expired');
    const paid = await agent.get(`/api/v1/bookings/${paidRef}`);
    expect(paid.body.data).toMatchObject({
      bookingStatus: 'cancellation_requested',
      cancellationQuote: { chargePct: 0, suggestedRefund: 36000, departureCancelled: true },
    });
    const pendingBooking = await Booking.findOne({ bookingReference: pendingRef });
    expect(await Payment.findOne({ booking: pendingBooking._id })).toMatchObject({
      status: 'failed',
      failureReason: 'departure_cancelled',
    });
  });
});
