import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AuditLog } from '../../src/models/AuditLog.js';
import { Booking } from '../../src/models/Booking.js';
import { NotificationLog } from '../../src/models/NotificationLog.js';
import { Payment } from '../../src/models/Payment.js';
import { TourDeparture } from '../../src/models/TourDeparture.js';
import { expireHolds } from '../../src/modules/bookings/bookings.service.js';
import { reconcilePayments } from '../../src/modules/payments/razorpay.service.js';
import { createPaymentsProvider } from '../../src/providers/payments.provider.js';
import { hmacHex } from '../../src/utils/razorpay-signature.js';
import { loginAgent, makeUser } from '../helpers/factories.js';
import { createFakeFrontend, createFakeRazorpayApi } from '../helpers/fake-providers.js';
import { makeDeparture, makeTour } from '../helpers/tour-factories.js';
import { buildTestApp, clearTestDb, connectTestDb, disconnectTestDb } from '../helpers/test-app.js';

const KEY_SECRET = 'test_key_secret_123';
const WEBHOOK_SECRET = 'test_webhook_secret_456';

let app;
let env;
let logger;
let rzp;
let payments;
let agent;
let user;

beforeAll(() => connectTestDb());
afterAll(() => disconnectTestDb());
beforeEach(async () => {
  await clearTestDb();
  rzp = createFakeRazorpayApi();
  payments = createPaymentsProvider({
    provider: 'razorpay',
    nodeEnv: 'test',
    keyId: 'rzp_test_fake',
    keySecret: KEY_SECRET,
    webhookSecret: WEBHOOK_SECRET,
    fetchImpl: rzp.fetch,
  });
  ({ app, env, logger } = buildTestApp(
    { ADMIN_NOTIFY_EMAIL: 'owner@example.com' },
    { providers: { payments, frontend: createFakeFrontend() } },
  ));
  user = await makeUser({ email: 'payer@example.com' });
  agent = request.agent(app);
  await loginAgent(agent, user.email);
});

async function createBooking({ seats = 2, price = 10000, departureSeats = 10 } = {}) {
  const tour = await makeTour({ basePrice: price });
  const departure = await makeDeparture(tour, { seats: departureSeats, price });
  const res = await agent.post('/api/v1/bookings').send({
    departureId: departure.id,
    seats,
    contact: { name: 'Payer One', email: 'payer@example.com', phone: '9876543210' },
    travellers: Array.from({ length: seats }, (_, i) => ({
      name: `Person ${i + 1}`,
      age: 30,
      gender: 'male',
    })),
    acceptedTerms: true,
  });
  expect(res.status).toBe(201);
  return {
    departure,
    reference: res.body.data.booking.bookingReference,
    orderId: res.body.data.payment.orderId,
    amountPaise: res.body.data.payment.amountPaise,
    response: res.body.data,
  };
}

const sign = (orderId, paymentId, secret = KEY_SECRET) =>
  hmacHex(secret, `${orderId}|${paymentId}`);
const verify = (body, a = agent) => a.post('/api/v1/payments/verify').send(body);
const verifyBody = (orderId, paymentId, signature = sign(orderId, paymentId)) => ({
  razorpay_order_id: orderId,
  razorpay_payment_id: paymentId,
  razorpay_signature: signature,
});

function webhook(
  event,
  entity,
  { eventId = `evt_${Math.random()}`, secret = WEBHOOK_SECRET, kind = 'payment' } = {},
) {
  const raw = JSON.stringify({
    event,
    payload: { [kind]: { entity } },
    created_at: Math.floor(Date.now() / 1000),
  });
  return request(app)
    .post('/api/v1/webhooks/razorpay')
    .set('Content-Type', 'application/json')
    .set('X-Razorpay-Signature', hmacHex(secret, raw))
    .set('X-Razorpay-Event-Id', eventId)
    .send(raw);
}

const counts = async () => ({
  captured: await Payment.countDocuments({ status: 'captured' }),
  notifications: await NotificationLog.countDocuments({ type: 'booking_confirmed' }),
  audits: await AuditLog.countDocuments({ action: 'booking.payment_captured' }),
});

describe('orders', () => {
  it('creates a real-shaped Razorpay order with the server amount, receipt and notes', async () => {
    const { orderId, amountPaise, reference, response } = await createBooking({
      seats: 2,
      price: 12345,
    });
    expect(amountPaise).toBe(2_469_000);
    expect(response.payment).toMatchObject({
      provider: 'razorpay',
      keyId: 'rzp_test_fake',
      simulate: false,
    });
    expect(rzp.orders.get(orderId)).toMatchObject({
      amount: 2_469_000,
      currency: 'INR',
      receipt: reference,
      notes: { bookingReference: reference },
    });
    const [, init] = rzp.fetch.mock.calls[0];
    expect(init.headers.Authorization).toBe(
      `Basic ${Buffer.from(`rzp_test_fake:${KEY_SECRET}`).toString('base64')}`,
    );
  });

  it('order creation failure releases the hold (502)', async () => {
    const tour = await makeTour();
    const departure = await makeDeparture(tour, { seats: 4 });
    rzp.failOrders = 1;
    const res = await agent.post('/api/v1/bookings').send({
      departureId: departure.id,
      seats: 2,
      contact: { name: 'Payer One', email: 'payer@example.com', phone: '9876543210' },
      travellers: [
        { name: 'A B', age: 30, gender: 'male' },
        { name: 'C D', age: 31, gender: 'female' },
      ],
      acceptedTerms: true,
    });
    expect(res.status).toBe(502);
    expect((await TourDeparture.findById(departure._id)).seatsAvailable).toBe(4);
  });

  it('exposes order and checkout options for an unpaid booking on its detail page', async () => {
    const { reference, orderId } = await createBooking();
    const res = await agent.get(`/api/v1/bookings/${reference}`);
    expect(res.body.meta.payment).toMatchObject({
      provider: 'razorpay',
      orderId,
      amountPaise: 2_000_000,
      keyId: 'rzp_test_fake',
      checkout: { name: 'BhaktiYatra', prefill: { email: 'payer@example.com' } },
    });
  });
});

describe('POST /payments/verify', () => {
  it('TC-PAY-01 confirms with a valid signature; audit and notification once', async () => {
    const { orderId, reference } = await createBooking();
    rzp.addPayment({ id: 'pay_valid0001', order_id: orderId, amount: 2_000_000 });
    const res = await verify(verifyBody(orderId, 'pay_valid0001'));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      state: 'confirmed',
      booking: { bookingReference: reference, bookingStatus: 'confirmed', paymentStatus: 'paid' },
    });
    const payment = await Payment.findOne({ providerOrderId: orderId });
    expect(payment).toMatchObject({
      status: 'captured',
      providerPaymentId: 'pay_valid0001',
      signatureVerified: true,
      verifiedVia: 'client',
      method: 'upi',
    });
    expect(Object.keys(payment.rawSnapshot).sort()).toEqual(
      ['amount', 'currency', 'id', 'method', 'order_id', 'status'].sort(),
    );
    expect(await counts()).toEqual({ captured: 1, notifications: 1, audits: 1 });
  });

  it('TC-PAY-02 rejects a tampered signature and leaves the booking pending', async () => {
    const { orderId } = await createBooking();
    const res = await verify(verifyBody(orderId, 'pay_tamper001', sign(orderId, 'pay_other0001')));
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('SIGNATURE_INVALID');
    const booking = await Booking.findOne({ razorpayOrderId: orderId });
    expect(booking).toMatchObject({ bookingStatus: 'pending', paymentStatus: 'pending' });
    expect(await Payment.findOne({ providerOrderId: orderId })).toMatchObject({
      status: 'failed',
      failureReason: 'signature_mismatch',
    });
    // A signature made with another secret fails too.
    const other = await verify(
      verifyBody(orderId, 'pay_x0000001', sign(orderId, 'pay_x0000001', 'wrong')),
    );
    expect(other.status).toBe(400);
  });

  it('TC-PAY-03 a non-owner gets 404', async () => {
    const { orderId } = await createBooking();
    const stranger = await makeUser({ email: 'stranger@example.com' });
    const strangerAgent = request.agent(app);
    await loginAgent(strangerAgent, stranger.email);
    const res = await verify(verifyBody(orderId, 'pay_steal0001'), strangerAgent);
    expect(res.status).toBe(404);
    expect(
      (await request(app).post('/api/v1/payments/verify').send(verifyBody(orderId, 'p'))).status,
    ).toBe(401);
  });

  it('TC-PAY-10 an amount mismatch from the provider is refused and reported', async () => {
    const { orderId } = await createBooking();
    rzp.addPayment({ id: 'pay_cheap0001', order_id: orderId, amount: 100 });
    const res = await verify(verifyBody(orderId, 'pay_cheap0001'));
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('AMOUNT_MISMATCH');
    expect((await Booking.findOne({ razorpayOrderId: orderId })).bookingStatus).toBe('pending');
    expect(
      await NotificationLog.exists({ type: 'payment_issue_admin', to: 'owner@example.com' }),
    ).toBeTruthy();
    expect(await AuditLog.exists({ action: 'payment.issue' })).toBeTruthy();
  });

  it('an authorized (not yet captured) payment waits for the capture webhook', async () => {
    const { orderId } = await createBooking();
    rzp.addPayment({
      id: 'pay_auth00001',
      order_id: orderId,
      amount: 2_000_000,
      status: 'authorized',
    });
    const res = await verify(verifyBody(orderId, 'pay_auth00001'));
    expect(res.body.data.state).toBe('pending_confirmation');
    expect((await Booking.findOne({ razorpayOrderId: orderId })).bookingStatus).toBe('pending');

    const hook = await webhook('payment.captured', {
      id: 'pay_auth00001',
      order_id: orderId,
      amount: 2_000_000,
      currency: 'INR',
      status: 'captured',
    });
    expect(hook.body.data.result).toBe('confirmed');
  });

  it('trusts the signature when the provider cannot be reached', async () => {
    const { orderId } = await createBooking();
    rzp.failFetch = true;
    const res = await verify(verifyBody(orderId, 'pay_offline01'));
    expect(res.body.data.state).toBe('confirmed');
  });

  it('a failed payment from the provider keeps the booking pending', async () => {
    const { orderId } = await createBooking();
    rzp.addPayment({
      id: 'pay_failed001',
      order_id: orderId,
      amount: 2_000_000,
      status: 'failed',
      error_description: 'Bank declined',
    });
    const res = await verify(verifyBody(orderId, 'pay_failed001'));
    expect(res.body.data.state).toBe('failed');
    expect(res.body.data.booking).toMatchObject({
      bookingStatus: 'pending',
      paymentStatus: 'failed',
    });
  });

  it('validates the body', async () => {
    const res = await verify({
      razorpay_order_id: 'order_x',
      razorpay_payment_id: 'pay_x',
      razorpay_signature: 'nothex',
    });
    expect(res.status).toBe(422);
  });
});

describe('POST /webhooks/razorpay', () => {
  const captured = (orderId, id = 'pay_hook00001', amount = 2_000_000) => ({
    id,
    order_id: orderId,
    amount,
    currency: 'INR',
    status: 'captured',
    method: 'card',
    card: { last4: '1111' }, // must never be stored
  });

  it('TC-PAY-04 rejects a bad signature without changes', async () => {
    const { orderId } = await createBooking();
    const res = await webhook('payment.captured', captured(orderId), { secret: 'not-the-secret' });
    expect(res.status).toBe(400);
    expect((await Booking.findOne({ razorpayOrderId: orderId })).bookingStatus).toBe('pending');
    const unsigned = await request(app)
      .post('/api/v1/webhooks/razorpay')
      .set('Content-Type', 'application/json')
      .send('{"event":"payment.captured"}');
    expect(unsigned.status).toBe(400);
  });

  it('confirms on payment.captured and never stores card details', async () => {
    const { orderId } = await createBooking();
    const res = await webhook('payment.captured', captured(orderId), { eventId: 'evt_first' });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ event: 'payment.captured', result: 'confirmed' });
    const payment = await Payment.findOne({ providerOrderId: orderId });
    expect(payment).toMatchObject({
      status: 'captured',
      verifiedVia: 'webhook',
      webhookEventIds: ['evt_first'],
    });
    expect(payment.rawSnapshot.card).toBeUndefined();
  });

  it('TC-PAY-05 webhook then verify → one confirmation; verify is already_confirmed', async () => {
    const { orderId } = await createBooking();
    rzp.addPayment(captured(orderId));
    await webhook('payment.captured', captured(orderId));
    const res = await verify(verifyBody(orderId, 'pay_hook00001'));
    expect(res.body.data.state).toBe('already_confirmed');
    expect(await counts()).toEqual({ captured: 1, notifications: 1, audits: 1 });
  });

  it('TC-PAY-06 verify then webhook → one confirmation; webhook is a no-op', async () => {
    const { orderId } = await createBooking();
    rzp.addPayment(captured(orderId));
    await verify(verifyBody(orderId, 'pay_hook00001'));
    const res = await webhook('payment.captured', captured(orderId), { eventId: 'evt_after' });
    expect(res.body.data.result).toBe('already_confirmed');
    expect(await counts()).toEqual({ captured: 1, notifications: 1, audits: 1 });
    expect((await Payment.findOne({ providerOrderId: orderId })).webhookEventIds).toEqual([
      'evt_after',
    ]);
  });

  it('TC-PAY-07 the same event twice → second is a duplicate', async () => {
    const { orderId } = await createBooking();
    await webhook('payment.captured', captured(orderId), { eventId: 'evt_same' });
    const before = await Payment.findOne({ providerOrderId: orderId }).lean();
    const second = await webhook('payment.captured', captured(orderId), { eventId: 'evt_same' });
    expect(second.status).toBe(200);
    expect(second.body.data.result).toBe('duplicate');
    const after = await Payment.findOne({ providerOrderId: orderId }).lean();
    expect(after.updatedAt).toEqual(before.updatedAt);
  });

  it('order.paid confirms like payment.captured', async () => {
    const { orderId } = await createBooking();
    const raw = JSON.stringify({
      event: 'order.paid',
      payload: { payment: { entity: captured(orderId) }, order: { entity: { id: orderId } } },
    });
    const res = await request(app)
      .post('/api/v1/webhooks/razorpay')
      .set('Content-Type', 'application/json')
      .set('X-Razorpay-Signature', hmacHex(WEBHOOK_SECRET, raw))
      .set('X-Razorpay-Event-Id', 'evt_order_paid')
      .send(raw);
    expect(res.body.data.result).toBe('confirmed');
  });

  it('TC-PAY-08 capture after expiry with seats free → confirmed_late', async () => {
    const { orderId, departure } = await createBooking({ seats: 2, departureSeats: 2 });
    await Booking.updateOne(
      { razorpayOrderId: orderId },
      { holdExpiresAt: new Date(Date.now() - 1000) },
    );
    await expireHolds();
    const res = await webhook('payment.captured', captured(orderId));
    expect(res.body.data.result).toBe('confirmed_late');
    expect(await TourDeparture.findById(departure._id)).toMatchObject({
      seatsAvailable: 0,
      status: 'full',
    });
  });

  it('TC-PAY-09 capture after expiry without seats → payment_received_no_seats and an alert', async () => {
    const { orderId, departure } = await createBooking({ seats: 2, departureSeats: 2 });
    await Booking.updateOne(
      { razorpayOrderId: orderId },
      { holdExpiresAt: new Date(Date.now() - 1000) },
    );
    await expireHolds();
    await TourDeparture.updateOne({ _id: departure._id }, { seatsAvailable: 0, status: 'full' });
    const res = await webhook('payment.captured', captured(orderId));
    expect(res.body.data.result).toBe('payment_received_no_seats');
    expect(await Booking.findOne({ razorpayOrderId: orderId })).toMatchObject({
      bookingStatus: 'payment_received_no_seats',
      paymentStatus: 'paid',
    });
    expect(await NotificationLog.exists({ type: 'payment_received_no_seats' })).toBeTruthy();
  });

  it('TC-PAY-11 payment.failed marks the attempt failed and keeps the booking pending', async () => {
    const { orderId } = await createBooking();
    const res = await webhook('payment.failed', {
      id: 'pay_declined1',
      order_id: orderId,
      amount: 2_000_000,
      currency: 'INR',
      status: 'failed',
      error_code: 'BAD_REQUEST_ERROR',
      error_description: 'Payment declined by bank',
    });
    expect(res.body.data.result).toBe('payment_failed');
    const booking = await Booking.findOne({ razorpayOrderId: orderId });
    expect(booking).toMatchObject({ bookingStatus: 'pending', paymentStatus: 'failed' });
    expect(booking.timeline.at(-1)).toMatchObject({
      event: 'payment_failed',
      meta: { reason: 'Payment declined by bank' },
    });
    expect(await Payment.findOne({ providerOrderId: orderId })).toMatchObject({
      status: 'failed',
      failureReason: 'Payment declined by bank',
    });
  });

  it('webhook amount mismatch is reported and not confirmed', async () => {
    const { orderId } = await createBooking();
    const res = await webhook('payment.captured', captured(orderId, 'pay_wrongamt1', 500));
    expect(res.status).toBe(200);
    expect(res.body.data.result).toBe('amount_mismatch');
    expect((await Booking.findOne({ razorpayOrderId: orderId })).bookingStatus).toBe('pending');
  });

  it('refund.processed records partial then full refunds', async () => {
    const { orderId } = await createBooking();
    await webhook('payment.captured', captured(orderId));
    const refund = (id, amount) =>
      webhook(
        'refund.processed',
        { id, payment_id: 'pay_hook00001', amount, status: 'processed' },
        { kind: 'refund' },
      );
    expect((await refund('rfnd_0001', 500_000)).body.data.result).toBe('partially_refunded');
    expect((await Booking.findOne({ razorpayOrderId: orderId })).paymentStatus).toBe(
      'partially_refunded',
    );
    expect((await refund('rfnd_0002', 1_500_000)).body.data.result).toBe('refunded');
    const payment = await Payment.findOne({ providerOrderId: orderId });
    expect(payment).toMatchObject({
      status: 'refunded',
      refund: { amount: 20000, providerRefundId: 'rfnd_0002' },
    });
    expect((await Booking.findOne({ razorpayOrderId: orderId })).paymentStatus).toBe('refunded');
  });

  it('ignores unknown events and unknown orders with 200', async () => {
    expect((await webhook('payment.dispute.created', { id: 'disp_1' })).body.data.result).toBe(
      'ignored',
    );
    expect((await webhook('payment.captured', captured('order_nobody00'))).body.data.result).toBe(
      'ignored_unknown_order',
    );
  });
});

describe('payment reconciliation job', () => {
  it('confirms a captured payment whose webhook and verify were both lost', async () => {
    const { orderId } = await createBooking();
    // createdAt is immutable through Mongoose, so age the booking at the collection level.
    await Booking.collection.updateOne(
      { razorpayOrderId: orderId },
      {
        $set: {
          createdAt: new Date(Date.now() - 30 * 60_000),
          holdExpiresAt: new Date(Date.now() - 15 * 60_000),
        },
      },
    );
    await expireHolds();
    rzp.addPayment({ id: 'pay_lost00001', order_id: orderId, amount: 2_000_000 });

    const ctx = { env, logger, providers: { payments } };
    expect(await reconcilePayments(ctx)).toEqual({ checked: 1, confirmed: 1 });
    expect(await Booking.findOne({ razorpayOrderId: orderId })).toMatchObject({
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
    });
    expect(await Payment.findOne({ providerOrderId: orderId })).toMatchObject({
      verifiedVia: 'reconcile',
    });
    expect(await reconcilePayments(ctx)).toEqual({ checked: 0, confirmed: 0 });
  });

  it('does nothing with the stub provider', async () => {
    const stub = createPaymentsProvider({ provider: 'stub', nodeEnv: 'test' });
    expect(await reconcilePayments({ env, logger, providers: { payments: stub } })).toEqual({
      checked: 0,
      confirmed: 0,
    });
  });
});
