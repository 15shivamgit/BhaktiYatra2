import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AuditLog } from '../../src/models/AuditLog.js';
import { Booking } from '../../src/models/Booking.js';
import { NotificationLog } from '../../src/models/NotificationLog.js';
import { Payment } from '../../src/models/Payment.js';
import { TourDeparture } from '../../src/models/TourDeparture.js';
import { User } from '../../src/models/User.js';
import { verifyTicket } from '../../src/modules/documents/tickets.routes.js';
import { addDays } from '../../src/utils/dates.js';
import { makeCircuit, makeTemple } from '../helpers/content-factories.js';
import { loginAgent, makeAdmin, makeUser } from '../helpers/factories.js';
import { createFakeFrontend, createFakePayments } from '../helpers/fake-providers.js';
import { makeBooking, makeDeparture, makeTour } from '../helpers/tour-factories.js';
import { buildTestApp, clearTestDb, connectTestDb, disconnectTestDb } from '../helpers/test-app.js';

const SECRET = 'ticket-secret-for-tests-0123456789abcdef';
const API = '/api/v1/admin';
let app;
let env;
let logger;
let agent;
let admin;
let customer;

beforeAll(() => connectTestDb());
afterAll(() => disconnectTestDb());
beforeEach(async () => {
  await clearTestDb();
  // A fresh app per test: the dashboard cache lives in the router.
  ({ app, env, logger } = buildTestApp(
    { TICKET_SIGNING_SECRET: SECRET },
    { providers: { payments: createFakePayments(), frontend: createFakeFrontend() } },
  ));
  admin = await makeAdmin({ email: 'admin@example.com', name: 'Ops Admin' });
  customer = await makeUser({ email: 'pilgrim@example.com', name: 'Asha Devi' });
  agent = request.agent(app);
  await loginAgent(agent, admin.email);
});

const ctx = () => ({ env, logger, providers: {} });

/** A departure and a booking in the given state, with a matching Payment record. */
async function bookingIn(status, { seats = 2, price = 10000, departure, ...overrides } = {}) {
  const dep = departure ?? (await makeDeparture(await makeTour({ basePrice: price }), { price }));
  const booking = await makeBooking(dep, customer, { seats, status, ...overrides });
  const paid = ['confirmed', 'cancellation_requested', 'payment_received_no_seats'].includes(
    status,
  );
  if (paid && booking.paymentStatus !== 'paid') {
    booking.paymentStatus = 'paid';
    await booking.save();
  }
  await Payment.create({
    booking: booking._id,
    provider: 'stub',
    providerOrderId: `order_${booking.bookingReference}`,
    ...(paid && {
      providerPaymentId: `pay_${booking.bookingReference}`,
      capturedAt: new Date(),
    }),
    amount: booking.amount,
    amountPaise: booking.amount * 100,
    status: paid ? 'captured' : 'created',
  });
  return { booking, departure: dep };
}

const seatsAvailable = async (departure) =>
  (await TourDeparture.findById(departure._id)).seatsAvailable;

describe('admin operations: access', () => {
  it('guests get 401 and ordinary users 403 on every new admin route', async () => {
    const { booking } = await bookingIn('confirmed');
    const routes = [
      ['get', `${API}/dashboard`],
      ['get', `${API}/bookings`],
      ['get', `${API}/bookings/${booking.id}`],
      ['patch', `${API}/bookings/${booking.id}/status`],
      ['post', `${API}/bookings/${booking.id}/cancel`],
      ['post', `${API}/bookings/${booking.id}/notes`],
      ['post', `${API}/bookings/${booking.id}/regenerate-documents`],
      ['post', `${API}/bookings/${booking.id}/resend-confirmation`],
      ['get', `${API}/payments`],
      ['get', `${API}/audit-logs`],
    ];
    const userAgent = request.agent(app);
    await loginAgent(userAgent, customer.email);
    for (const [method, path] of routes) {
      expect((await request(app)[method](path).send({})).status, `${method} ${path}`).toBe(401);
      const res = await userAgent[method](path).send({});
      expect(res.status, `${method} ${path}`).toBe(403);
    }
  });
});

describe('admin dashboard', () => {
  it('TC-ADMIN-01 numbers match the seeded data; revenue = captured payments − refunds', async () => {
    await makeTemple();
    await makeTemple({ status: 'draft', publishedAt: undefined });
    await makeCircuit();
    const tour = await makeTour({ basePrice: 5000 });
    await makeTour({ status: 'draft', publishedAt: undefined });
    const soon = await makeDeparture(tour, { inDays: 3, price: 5000 });
    const later = await makeDeparture(tour, { inDays: 40, price: 5000, seats: 2 });
    await makeDeparture(tour, { inDays: -10, status: 'completed' });

    const { booking: a } = await bookingIn('confirmed', {
      departure: soon,
      confirmedAt: new Date(),
    });
    await bookingIn('confirmed', { departure: later, confirmedAt: addDays(new Date(), -60) });
    await bookingIn('pending', { departure: soon, seats: 3 });
    await bookingIn('expired', { departure: soon, holdExpiresAt: addDays(new Date(), -1) });
    // Make `later` full (2 seats, 2 booked) to count it as full.
    await TourDeparture.updateOne({ _id: later._id }, { $set: { status: 'full' } });

    // Old payment 60 days ago, refunded 1,000 today.
    await Payment.updateOne(
      { booking: { $ne: a._id }, status: 'captured' },
      {
        $set: {
          capturedAt: addDays(new Date(), -60),
          refund: { amount: 1000, at: new Date(), status: 'processed' },
        },
      },
    );
    await NotificationLog.create({
      type: 'welcome',
      to: 'x@example.com',
      dedupeKey: 'welcome:x',
      status: 'failed',
      attempts: 3,
    });

    const res = await agent.get(`${API}/dashboard`).query({ range: '7d' });
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.content).toEqual({
      templesPublished: 1,
      templesDraft: 1,
      circuitsPublished: 1,
      toursPublished: 1,
      toursDraft: 1,
    });
    expect(d.departures).toEqual({ upcoming: 2, full: 1, nextSevenDays: 1 });
    expect(d.users).toEqual({ total: 2, newInRange: 2 });
    expect(d.bookings.byStatus).toMatchObject({ confirmed: 2, pending: 1, expired: 1 });
    expect(d.bookings.confirmedInRange).toBe(1);
    expect(d.bookings.seatsConfirmedInRange).toBe(2);
    expect(d.holds).toEqual({ activePending: 1, seatsHeld: 3 });
    expect(d.revenue).toMatchObject({
      capturedInRange: 10000,
      refundedInRange: 1000,
      netInRange: 9000,
      capturedAllTime: 20000,
      refundedAllTime: 1000,
      netAllTime: 19000,
    });
    expect(d.recentBookings).toHaveLength(4);
    expect(d.recentBookings[0].user.email).toBe('pilgrim@example.com');
    expect(Object.fromEntries(d.alerts.map((x) => [x.type, x.count]))).toEqual({
      payment_received_no_seats: 0,
      cancellation_requested: 0,
      inventory_mismatch: 0,
      email_failures_24h: 1,
    });

    // 90 days takes in the older capture; refunds are dated by refund time.
    const wide = await agent.get(`${API}/dashboard`).query({ range: '90d' });
    expect(wide.body.data.revenue.capturedInRange).toBe(20000);
  });

  it('reports inventory mismatches and caches results for 60 seconds', async () => {
    const { departure } = await bookingIn('confirmed');
    const first = await agent.get(`${API}/dashboard`);
    expect(first.body.data.alerts.find((x) => x.type === 'inventory_mismatch').count).toBe(0);

    await TourDeparture.updateOne({ _id: departure._id }, { $inc: { seatsAvailable: 1 } });
    const cached = await agent.get(`${API}/dashboard`);
    expect(cached.body.meta.cachedAt).toBe(first.body.meta.cachedAt);

    // A new app (fresh cache) sees the mismatch.
    const other = request.agent(buildTestApp({ TICKET_SIGNING_SECRET: SECRET }).app);
    await loginAgent(other, admin.email);
    const recomputed = await other.get(`${API}/dashboard`);
    expect(recomputed.body.data.alerts.find((x) => x.type === 'inventory_mismatch').count).toBe(1);
  });
});

describe('admin bookings: list and CSV', () => {
  it('filters by status, reference, contact email, phone digits and account', async () => {
    const { booking: a } = await bookingIn('confirmed');
    const { booking: b } = await bookingIn('pending', {
      contact: { name: 'Ravi Shankar', email: 'ravi@example.com', phone: '+919812345678' },
    });
    const other = await makeUser({ email: 'second@example.com' });
    const dep = await makeDeparture(await makeTour());
    await makeBooking(dep, other, { status: 'cancelled' });

    const all = await agent.get(`${API}/bookings`);
    expect(all.body.meta.total).toBe(3);
    expect(all.body.data[0]).toHaveProperty('user.email');
    expect(all.body.data[0]).toHaveProperty('travellerCount');

    const ids = async (query) =>
      (await agent.get(`${API}/bookings`).query(query)).body.data.map((x) => x.id);
    expect(await ids({ bookingStatus: 'pending' })).toEqual([b.id]);
    expect(await ids({ q: a.bookingReference })).toEqual([a.id]);
    expect(await ids({ q: 'ravi@' })).toEqual([b.id]);
    expect(await ids({ q: '98123 45678' })).toEqual([b.id]);
    expect(await ids({ q: 'second@example' })).toHaveLength(1);
    expect(await ids({ user: customer.id })).toHaveLength(2);
    expect((await agent.get(`${API}/bookings`).query({ bookingStatus: 'nope' })).status).toBe(422);
  });

  it('TC-ADMIN-04 CSV has a BOM, the columns, Hindi text intact and no formulas', async () => {
    await bookingIn('confirmed', {
      contact: { name: 'आशा देवी', email: 'asha@example.com', phone: '+919876543210' },
    });
    await bookingIn('pending', {
      contact: {
        name: '=HYPERLINK("http://x")',
        email: 'evil@example.com',
        phone: '+919800000000',
      },
    });
    const res = await agent
      .get(`${API}/bookings`)
      .query({ format: 'csv' })
      .buffer(true)
      .parse((r, done) => {
        const chunks = [];
        r.on('data', (c) => chunks.push(c));
        r.on('end', () => done(null, Buffer.concat(chunks)));
      });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(res.headers['content-disposition']).toMatch(
      /^attachment; filename="bookings-\d{4}-\d{2}-\d{2}\.csv"$/,
    );
    const bytes = res.body;
    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const lines = bytes.toString('utf8').slice(1).split('\r\n');
    expect(lines[0]).toBe(
      'Reference,Created (IST),Tour,Start date,End date,Pickup city,Contact name,Contact email,Contact phone,Account email,Seats,Travellers,Amount (INR),Booking status,Payment status,Refund (INR),Invoice number',
    );
    expect(lines).toHaveLength(4); // header, two rows, trailing empty
    expect(lines.join('\n')).toContain('आशा देवी');
    expect(lines.join('\n')).toContain(`"'=HYPERLINK(""http://x"")"`);
    expect(lines.join('\n')).toContain("'+919876543210");
  });
});

describe('admin bookings: status changes', () => {
  it('TC-ADMIN-02 marking paid needs a reason, the payment details and the exact amount', async () => {
    const { booking } = await bookingIn('pending', { seats: 2, price: 10000 });
    const url = `${API}/bookings/${booking.id}/status`;
    const manualPayment = { reference: 'UTR123456', method: 'bank_transfer', amount: 20000 };

    const noReason = await agent.patch(url).send({ to: 'confirmed', manualPayment });
    expect(noReason.status).toBe(422);
    expect(noReason.body.code).toBe('REASON_REQUIRED');

    const noPayment = await agent.patch(url).send({ to: 'confirmed', reason: 'Paid at office' });
    expect(noPayment.status).toBe(422);

    const wrongAmount = await agent.patch(url).send({
      to: 'confirmed',
      reason: 'Paid at office',
      manualPayment: { ...manualPayment, amount: 100 },
    });
    expect(wrongAmount.status).toBe(422);
    expect(wrongAmount.body.code).toBe('AMOUNT_MISMATCH');

    const ok = await agent
      .patch(url)
      .send({ to: 'confirmed', reason: 'Paid at office', manualPayment });
    expect(ok.status).toBe(200);
    expect(ok.body.data).toMatchObject({ bookingStatus: 'confirmed', paymentStatus: 'paid' });
    expect(ok.body.data.allowedActions).toContain('regenerateDocuments');
    const payment = await Payment.findOne({ booking: booking._id });
    expect(payment).toMatchObject({
      status: 'captured',
      verifiedVia: 'manual',
      providerPaymentId: 'manual:UTR123456',
      method: 'bank_transfer',
    });
    const audit = await AuditLog.findOne({ action: 'booking.manual_payment' });
    expect(audit.reason).toBe('Paid at office');
    expect(audit.actor.toString()).toBe(admin.id);
    expect((await Booking.findById(booking._id)).invoice.number).toMatch(/^INV-/);
    expect(await NotificationLog.countDocuments({ type: 'booking_confirmed' })).toBe(1);

    // The same bank reference cannot pay a second booking.
    const { booking: second } = await bookingIn('pending', { seats: 2, price: 10000 });
    const reused = await agent
      .patch(`${API}/bookings/${second.id}/status`)
      .send({ to: 'confirmed', reason: 'Paid at office', manualPayment });
    expect(reused.status).toBe(409);
  });

  it('pending → cancelled releases the held seats', async () => {
    const { booking, departure } = await bookingIn('pending', { seats: 3 });
    expect(await seatsAvailable(departure)).toBe(17);
    const res = await agent
      .patch(`${API}/bookings/${booking.id}/status`)
      .send({ to: 'cancelled', reason: 'Customer called to cancel' });
    expect(res.status).toBe(200);
    expect(res.body.data.bookingStatus).toBe('cancelled');
    expect(await seatsAvailable(departure)).toBe(20);
    expect((await Payment.findOne({ booking: booking._id })).status).toBe('failed');
  });

  it('a cancellation request can be rejected, except when the departure was cancelled', async () => {
    const { booking } = await bookingIn('cancellation_requested', {
      cancellation: { requestedAt: new Date(), reason: 'Unwell' },
    });
    const res = await agent
      .patch(`${API}/bookings/${booking.id}/status`)
      .send({ to: 'confirmed', reason: 'Spoke to the customer; travelling after all' });
    expect(res.status).toBe(200);
    expect(res.body.data.bookingStatus).toBe('confirmed');
    expect(res.body.data.cancellation).toBeNull();
    expect(res.body.data.timeline.at(-1)).toMatchObject({
      event: 'cancellation_rejected',
      by: 'Ops Admin',
    });

    const { booking: dc } = await bookingIn('cancellation_requested', {
      cancellation: { requestedAt: new Date(), reason: 'Rain', departureCancelled: true },
    });
    const refused = await agent
      .patch(`${API}/bookings/${dc.id}/status`)
      .send({ to: 'confirmed', reason: 'Try it' });
    expect(refused.status).toBe(409);
    expect(refused.body.code).toBe('INVALID_TRANSITION');
  });

  it('payment received without seats confirms only after the seats are raised', async () => {
    const tour = await makeTour();
    const departure = await makeDeparture(tour, { seats: 2 });
    await bookingIn('confirmed', { departure, seats: 2 }); // fills the date
    const { booking } = await bookingIn('payment_received_no_seats', { departure, seats: 2 });
    const url = `${API}/bookings/${booking.id}/status`;
    const body = { to: 'confirmed', reason: 'Added a seat row in the bus' };

    const full = await agent.patch(url).send(body);
    expect(full.status).toBe(409);
    expect(full.body.code).toBe('SEATS_UNAVAILABLE');

    await TourDeparture.updateOne(
      { _id: departure._id },
      { $inc: { totalSeats: 2, seatsAvailable: 2 } },
    );
    const ok = await agent.patch(url).send(body);
    expect(ok.status).toBe(200);
    expect(ok.body.data.bookingStatus).toBe('confirmed');
    expect(await seatsAvailable(departure)).toBe(0);
    expect((await TourDeparture.findById(departure._id)).status).toBe('full');
    expect(await NotificationLog.countDocuments({ type: 'booking_confirmed' })).toBe(1);
  });

  it('refuses transitions the state machine does not allow', async () => {
    const cases = [
      ['expired', 'cancelled'],
      ['cancelled', 'confirmed'],
      ['confirmed', 'confirmed'],
    ];
    for (const [status, to] of cases) {
      const { booking } = await bookingIn(status);
      const res = await agent
        .patch(`${API}/bookings/${booking.id}/status`)
        .send({ to, reason: 'Testing the rules' });
      expect(res.status, `${status} → ${to}`).toBe(409);
      expect(res.body.code).toBe('INVALID_TRANSITION');
    }
  });
});

describe('admin bookings: cancel with refund', () => {
  it('TC-ADMIN-03 cancels a confirmed booking with a full refund', async () => {
    const { booking, departure } = await bookingIn('confirmed', { seats: 2, price: 10000 });
    expect(await seatsAvailable(departure)).toBe(18);
    const res = await agent.post(`${API}/bookings/${booking.id}/cancel`).send({
      reason: 'Customer request, more than 30 days ahead',
      refund: { amount: 20000, reference: 'rfnd_ABC123', method: 'razorpay' },
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      bookingStatus: 'cancelled',
      paymentStatus: 'refunded',
      cancellation: {
        refundAmount: 20000,
        refundReference: 'rfnd_ABC123',
        refundMethod: 'razorpay',
        processedBy: 'Ops Admin',
      },
    });
    expect(await seatsAvailable(departure)).toBe(20);
    const payment = await Payment.findOne({ booking: booking._id });
    expect(payment.status).toBe('refunded');
    expect(payment.refund).toMatchObject({ amount: 20000, providerRefundId: 'rfnd_ABC123' });
    const audit = await AuditLog.findOne({ action: 'booking.cancel' });
    expect(audit.reason).toMatch(/Customer request/);
    expect(audit.after.refund.amount).toBe(20000);
    const mail = await NotificationLog.findOne({ type: 'booking_cancelled' });
    expect(mail.dedupeKey).toBe(`booking_cancelled:${booking._id}:admin`);
  });

  it('a partial refund marks the payment partially refunded and suggests the policy amount', async () => {
    const departure = await makeDeparture(await makeTour({ basePrice: 10000 }), { inDays: 20 });
    const { booking } = await bookingIn('cancellation_requested', {
      seats: 1,
      departure,
      cancellation: { requestedAt: new Date(), reason: 'Family function' },
    });
    const view = await agent.get(`${API}/bookings/${booking.id}`);
    expect(view.body.data.cancellationQuote).toMatchObject({
      chargePct: 25,
      suggestedRefund: 7500,
    });

    const res = await agent.post(`${API}/bookings/${booking.id}/cancel`).send({
      reason: 'Policy slab 15–29 days',
      refund: { amount: 7500, reference: 'rfnd_P1', method: 'razorpay' },
    });
    expect(res.body.data.paymentStatus).toBe('partially_refunded');
    expect(res.body.data.cancellation.reason).toBe('Family function'); // the traveller's reason stays
    expect((await Payment.findOne({ booking: booking._id })).status).toBe('captured');
  });

  it('validates the refund', async () => {
    const { booking } = await bookingIn('confirmed', { seats: 1, price: 10000 });
    const url = `${API}/bookings/${booking.id}/cancel`;
    const tooMuch = await agent
      .post(url)
      .send({ reason: 'Test', refund: { amount: 10001, method: 'bank' } });
    expect(tooMuch.status).toBe(422);
    const noMethod = await agent
      .post(url)
      .send({ reason: 'Test', refund: { amount: 100, method: 'none' } });
    expect(noMethod.status).toBe(422);
    const noReason = await agent.post(url).send({ refund: { amount: 0, method: 'none' } });
    expect(noReason.body.code).toBe('REASON_REQUIRED');

    const { booking: unpaid } = await bookingIn('pending');
    const nothingPaid = await agent
      .post(`${API}/bookings/${unpaid.id}/cancel`)
      .send({ reason: 'Test', refund: { amount: 100, method: 'bank' } });
    expect(nothingPaid.status).toBe(422);

    const { booking: expired } = await bookingIn('expired');
    const notAllowed = await agent
      .post(`${API}/bookings/${expired.id}/cancel`)
      .send({ reason: 'Test' });
    expect(notAllowed.status).toBe(409);
  });

  it('payment received without seats is cancelled with a full refund and releases nothing', async () => {
    const tour = await makeTour();
    const departure = await makeDeparture(tour, { seats: 2 });
    await bookingIn('confirmed', { departure, seats: 2 });
    const { booking } = await bookingIn('payment_received_no_seats', { departure, seats: 2 });
    const view = await agent.get(`${API}/bookings/${booking.id}`);
    expect(view.body.data.cancellationQuote.suggestedRefund).toBe(booking.amount);
    const res = await agent.post(`${API}/bookings/${booking.id}/cancel`).send({
      reason: 'Sold out; refunded in full',
      refund: { amount: booking.amount, reference: 'rfnd_full', method: 'razorpay' },
    });
    expect(res.body.data.paymentStatus).toBe('refunded');
    expect(await seatsAvailable(departure)).toBe(0);
  });
});

describe('admin bookings: notes, documents and emails', () => {
  it('adds internal notes that the traveller never sees', async () => {
    const { booking } = await bookingIn('confirmed');
    const res = await agent
      .post(`${API}/bookings/${booking.id}/notes`)
      .send({ text: 'Needs a lower berth' });
    expect(res.status).toBe(201);
    expect(res.body.data).toEqual([
      { at: expect.any(String), text: 'Needs a lower berth', by: 'Ops Admin' },
    ]);
    expect(
      (await agent.post(`${API}/bookings/${booking.id}/notes`).send({ text: ' ' })).status,
    ).toBe(422);

    const owner = request.agent(app);
    await loginAgent(owner, customer.email);
    const mine = await owner.get(`/api/v1/bookings/${booking.bookingReference}`);
    expect(JSON.stringify(mine.body)).not.toContain('lower berth');
  });

  it('regenerating documents keeps the invoice number and retires the old QR code', async () => {
    const { booking } = await bookingIn('pending', { seats: 1 });
    await agent.patch(`${API}/bookings/${booking.id}/status`).send({
      to: 'confirmed',
      reason: 'Paid in cash',
      manualPayment: { reference: 'CASH-1', method: 'cash', amount: booking.amount },
    });
    const before = await Booking.findById(booking._id);
    const res = await agent.post(`${API}/bookings/${booking.id}/regenerate-documents`);
    expect(res.status).toBe(202);
    const after = await Booking.findById(booking._id);
    expect(after.invoice.number).toBe(before.invoice.number);
    expect(after.ticket.token).not.toBe(before.ticket.token);
    expect(await verifyTicket(ctx(), before.ticket.token)).toEqual({
      valid: false,
      reason: 'not_found',
    });
    expect((await verifyTicket(ctx(), after.ticket.token)).valid).toBe(true);

    const { booking: pending } = await bookingIn('pending');
    expect((await agent.post(`${API}/bookings/${pending.id}/regenerate-documents`)).status).toBe(
      409,
    );
  });

  it('resending the confirmation queues a new email each time', async () => {
    const { booking } = await bookingIn('confirmed');
    for (let i = 0; i < 2; i += 1) {
      const res = await agent.post(`${API}/bookings/${booking.id}/resend-confirmation`);
      expect(res.status).toBe(202);
      await new Promise((r) => setTimeout(r, 2));
    }
    const logs = await NotificationLog.find({ type: 'booking_confirmed' });
    expect(logs).toHaveLength(2);
    expect(logs.every((l) => l.dedupeKey.includes(':resend:'))).toBe(true);

    const { booking: cancelled } = await bookingIn('cancelled');
    expect((await agent.post(`${API}/bookings/${cancelled.id}/resend-confirmation`)).status).toBe(
      409,
    );
  });

  it('the detail shows payments, audit entries and emails, without raw provider data', async () => {
    const { booking } = await bookingIn('confirmed');
    await Payment.updateOne({ booking: booking._id }, { $set: { rawSnapshot: { secret: 'x' } } });
    await agent.post(`${API}/bookings/${booking.id}/resend-confirmation`);
    const res = await agent.get(`${API}/bookings/${booking.id}`);
    const d = res.body.data;
    expect(d.user).toMatchObject({ email: 'pilgrim@example.com', name: 'Asha Devi' });
    expect(d.payments[0]).toMatchObject({ status: 'captured', provider: 'stub' });
    expect(JSON.stringify(d)).not.toContain('rawSnapshot');
    expect(d.auditLogs[0]).toMatchObject({
      action: 'booking.confirmation.resend',
      actor: { name: 'Ops Admin' },
    });
    expect(d.notifications[0]).toMatchObject({ type: 'booking_confirmed', status: 'pending' });
    expect(d.departureLive).toMatchObject({ totalSeats: 20, seatsAvailable: 18 });
    expect(d.allowedActions).toEqual([
      'addNote',
      'cancel',
      'regenerateDocuments',
      'resendConfirmation',
    ]);
    expect((await agent.get(`${API}/bookings/${'0'.repeat(24)}`)).status).toBe(404);
  });

  it('TC-ADMIN-05 every admin booking mutation writes one audit entry with the actor', async () => {
    const { booking: p } = await bookingIn('pending');
    const { booking: c } = await bookingIn('confirmed');
    const { booking: r } = await bookingIn('cancellation_requested', {
      cancellation: { requestedAt: new Date(), reason: 'x' },
    });
    await agent.patch(`${API}/bookings/${p.id}/status`).send({ to: 'cancelled', reason: 'abc' });
    await agent.post(`${API}/bookings/${c.id}/notes`).send({ text: 'note' });
    await agent.post(`${API}/bookings/${c.id}/regenerate-documents`);
    await agent.post(`${API}/bookings/${c.id}/resend-confirmation`);
    await agent.patch(`${API}/bookings/${r.id}/status`).send({ to: 'confirmed', reason: 'abc' });
    await agent
      .post(`${API}/bookings/${c.id}/cancel`)
      .send({ reason: 'abc', refund: { amount: 0, method: 'none' } });

    const rows = await AuditLog.find({ actor: admin._id, action: /^booking\./ });
    const counts = Object.fromEntries(
      [...new Set(rows.map((x) => x.action))].map((a) => [
        a,
        rows.filter((x) => x.action === a).length,
      ]),
    );
    expect(counts).toEqual({
      'booking.cancel': 2,
      'booking.note.add': 1,
      'booking.documents.regenerate': 1,
      'booking.confirmation.resend': 1,
      'booking.cancellation_rejected': 1,
    });
  });
});

describe('admin payments and audit log', () => {
  it('lists payments with booking reference and email, filtered by status and search', async () => {
    const { booking: paid } = await bookingIn('confirmed');
    await bookingIn('pending');
    const all = await agent.get(`${API}/payments`);
    expect(all.body.meta.total).toBe(2);
    const captured = await agent.get(`${API}/payments`).query({ status: 'captured' });
    expect(captured.body.data).toHaveLength(1);
    expect(captured.body.data[0]).toMatchObject({
      booking: { bookingReference: paid.bookingReference },
      userEmail: 'pilgrim@example.com',
      providerPaymentId: `pay_${paid.bookingReference}`,
    });
    expect(captured.body.data[0]).not.toHaveProperty('rawSnapshot');
    const byRef = await agent.get(`${API}/payments`).query({ q: paid.bookingReference });
    expect(byRef.body.data).toHaveLength(1);
    const byPayId = await agent.get(`${API}/payments`).query({ q: `pay_${paid.bookingReference}` });
    expect(byPayId.body.data).toHaveLength(1);
  });

  it('filters audit entries by action prefix and entity, with actor names and a detail view', async () => {
    const target = await makeUser({ email: 'promote@example.com' });
    await agent.patch(`${API}/users/${target.id}`).send({ role: 'admin' });
    const { booking } = await bookingIn('confirmed');
    await agent.post(`${API}/bookings/${booking.id}/notes`).send({ text: 'hello' });

    const users = await agent.get(`${API}/audit-logs`).query({ action: 'user.' });
    expect(users.body.data).toHaveLength(1);
    expect(users.body.data[0]).toMatchObject({
      action: 'user.role.change',
      actor: { name: 'Ops Admin', email: 'admin@example.com' },
      before: { role: 'user' },
      after: { role: 'admin' },
    });
    const forBooking = await agent
      .get(`${API}/audit-logs`)
      .query({ entityType: 'Booking', entityId: booking.id });
    expect(forBooking.body.data.map((x) => x.action)).toEqual(['booking.note.add']);
    const one = await agent.get(`${API}/audit-logs/${users.body.data[0].id}`);
    expect(one.body.data.after).toEqual({ role: 'admin' });
    expect((await agent.get(`${API}/audit-logs`).query({ action: 'x$' })).status).toBe(422);
    expect(await User.countDocuments({ role: 'admin' })).toBe(2);
  });
});
