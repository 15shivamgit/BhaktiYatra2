import { PDFParse } from 'pdf-parse';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Booking } from '../../src/models/Booking.js';
import { NotificationLog } from '../../src/models/NotificationLog.js';
import {
  nextInvoiceNumber,
  renderDocument,
} from '../../src/modules/documents/documents.service.js';
import { verifyTicket } from '../../src/modules/documents/tickets.routes.js';
import {
  failedEmailCount,
  processEmailQueue,
} from '../../src/modules/notifications/mailer.service.js';
import { renderEmail, TEMPLATE_TYPES } from '../../src/modules/notifications/templates.js';
import { addDays } from '../../src/utils/dates.js';
import { signTicketToken } from '../../src/utils/ticket-token.js';
import { loginAgent, makeAdmin, makeUser } from '../helpers/factories.js';
import { createFakeFrontend, createFakePayments } from '../helpers/fake-providers.js';
import { makeDeparture, makeTour } from '../helpers/tour-factories.js';
import { buildTestApp, clearTestDb, connectTestDb, disconnectTestDb } from '../helpers/test-app.js';

const SECRET = 'ticket-secret-for-tests-0123456789abcdef';
let app;
let env;
let logger;
let mail;
let agent;
let user;

function createFakeMail() {
  const fake = {
    name: 'fake',
    failing: false,
    sent: [],
    send: vi.fn(async (message) => {
      if (fake.failing) throw new Error('SMTP down');
      fake.sent.push(message);
      return { id: `msg_${fake.sent.length}` };
    }),
  };
  return fake;
}

beforeAll(() => connectTestDb());
afterAll(() => disconnectTestDb());
beforeEach(async () => {
  await clearTestDb();
  mail = createFakeMail();
  ({ app, env, logger } = buildTestApp(
    { TICKET_SIGNING_SECRET: SECRET, ADMIN_NOTIFY_EMAIL: 'owner@example.com' },
    { providers: { mail, payments: createFakePayments(), frontend: createFakeFrontend() } },
  ));
  user = await makeUser({ email: 'pilgrim@example.com', name: 'Asha Devi' });
  agent = request.agent(app);
  await loginAgent(agent, user.email);
});

const ctx = () => ({ env, logger, providers: { mail } });

async function confirmedBooking({ seats = 2, price = 9999 } = {}) {
  const tour = await makeTour({ basePrice: price, destinations: ['Ujjain', 'Omkareshwar'] });
  const departure = await makeDeparture(tour, {
    price,
    pickupInstructions: 'Report at gate 2 by 6 am',
  });
  const created = await agent.post('/api/v1/bookings').send({
    departureId: departure.id,
    seats,
    contact: { name: 'Asha Devi', email: 'asha.contact@example.com', phone: '9876543210' },
    travellers: Array.from({ length: seats }, (_, i) => ({
      name: `Traveller Name ${i + 1}`,
      age: 50 + i,
      gender: 'female',
    })),
    acceptedTerms: true,
  });
  const reference = created.body.data.booking.bookingReference;
  await agent.post(`/api/v1/bookings/${reference}/simulate-payment`).send({ outcome: 'success' });
  return { reference, booking: await Booking.findOne({ bookingReference: reference }) };
}

async function pdfText(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    return (await parser.getText()).text;
  } finally {
    await parser.destroy();
  }
}

describe('documents', () => {
  it('TC-DOC-01 a confirmed booking gets an invoice number and a ticket; PDFs carry the reference', async () => {
    const { reference, booking } = await confirmedBooking();
    expect(booking.invoice.number).toMatch(/^INV-\d{4}-000001$/);
    expect(booking.ticket.token).toBeTruthy();
    expect(booking.timeline.map((t) => t.event)).toContain('documents_issued');

    const ticket = await renderDocument(ctx(), booking, 'ticket');
    expect(ticket.filename).toBe(`BhaktiYatra-Ticket-${reference}.pdf`);
    const ticketText = await pdfText(ticket.buffer);
    expect(ticketText).toContain(reference);
    expect(ticketText).toContain('CONFIRMED');
    expect(ticketText).toContain('Traveller Name 2');
    expect(ticketText).toContain('Report at gate 2 by 6 am');
    expect(ticketText).toContain('₹19,998');

    const invoice = await renderDocument(ctx(), booking, 'invoice');
    const invoiceText = await pdfText(invoice.buffer);
    expect(invoiceText).toContain(booking.invoice.number);
    expect(invoiceText).toContain('Invoice / Payment Receipt');
    expect(invoiceText).toContain('asha.contact@example.com');
  });

  it('TC-DOC-03 invoice numbers are unique and contiguous under 50 parallel requests', async () => {
    const numbers = await Promise.all(Array.from({ length: 50 }, () => nextInvoiceNumber()));
    const seqs = numbers.map((n) => Number(n.slice(-6))).sort((a, b) => a - b);
    expect(new Set(numbers).size).toBe(50);
    expect(seqs).toEqual(Array.from({ length: 50 }, (_, i) => i + 1));
  });

  it('confirming twice keeps the same invoice number', async () => {
    const { reference, booking } = await confirmedBooking();
    await agent.post(`/api/v1/bookings/${reference}/simulate-payment`).send({ outcome: 'success' });
    const again = await Booking.findOne({ bookingReference: reference });
    expect(again.invoice.number).toBe(booking.invoice.number);
    expect(again.ticket.token).toBe(booking.ticket.token);
  });
});

describe('downloads (TC-DOC-04)', () => {
  it('owner 200, other user 404, admin 200, guest 401; not ready → 404', async () => {
    const { reference } = await confirmedBooking();
    const owner = await agent.get(`/api/v1/bookings/${reference}/ticket`);
    expect(owner.status).toBe(200);
    expect(owner.headers['content-type']).toBe('application/pdf');
    expect(owner.headers['content-disposition']).toContain(`BhaktiYatra-Ticket-${reference}.pdf`);
    expect(owner.body.subarray(0, 4).toString()).toBe('%PDF');
    expect((await agent.get(`/api/v1/bookings/${reference}/invoice`)).status).toBe(200);

    const other = await makeUser({ email: 'other@example.com' });
    const otherAgent = request.agent(app);
    await loginAgent(otherAgent, other.email);
    expect((await otherAgent.get(`/api/v1/bookings/${reference}/ticket`)).status).toBe(404);

    const admin = await makeAdmin({ email: 'admin@example.com' });
    const adminAgent = request.agent(app);
    await loginAgent(adminAgent, admin.email);
    expect((await adminAgent.get(`/api/v1/bookings/${reference}/invoice`)).status).toBe(200);

    expect((await request(app).get(`/api/v1/bookings/${reference}/ticket`)).status).toBe(401);

    // Unpaid booking: nothing to download yet.
    const tour = await makeTour();
    const departure = await makeDeparture(tour);
    const pending = await agent.post('/api/v1/bookings').send({
      departureId: departure.id,
      seats: 1,
      contact: { name: 'Asha Devi', email: 'a@example.com', phone: '9876543210' },
      travellers: [{ name: 'A B', age: 30, gender: 'male' }],
      acceptedTerms: true,
    });
    const res = await agent.get(
      `/api/v1/bookings/${pending.body.data.booking.bookingReference}/ticket`,
    );
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/being prepared/);
  });
});

describe('ticket verification', () => {
  it('TC-DOC-02 / TC-DOC-07 valid, tampered, cancelled and expired tokens; no personal data', async () => {
    const { reference, booking } = await confirmedBooking();
    const res = await request(app).get(`/api/v1/tickets/verify/${booking.ticket.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      valid: true,
      bookingReference: reference,
      seats: 2,
      travellerCount: 2,
      bookingStatus: 'confirmed',
    });
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('Traveller Name');
    expect(body).not.toContain('asha.contact@example.com');
    expect(body).not.toContain('9876543210');

    const tampered = `${booking.ticket.token.slice(0, -3)}abc`;
    expect(await verifyTicket(ctx(), tampered)).toEqual({ valid: false, reason: 'not_found' });

    const expiredToken = await signTicketToken(
      { reference, departureId: booking.departure, startDate: addDays(new Date(), -30) },
      SECRET,
    );
    expect(await verifyTicket(ctx(), expiredToken)).toEqual({
      valid: false,
      reason: 'expired_token',
    });

    await Booking.updateOne({ _id: booking._id }, { bookingStatus: 'cancelled' });
    expect(await verifyTicket(ctx(), booking.ticket.token)).toMatchObject({
      valid: false,
      reason: 'cancelled',
      bookingReference: reference,
    });
  });
});

describe('email queue', () => {
  it('sends the confirmation with both PDFs, to contact and account email', async () => {
    const { reference } = await confirmedBooking();
    const result = await processEmailQueue(ctx());
    expect(result.sent).toBeGreaterThanOrEqual(1);
    const confirmation = mail.sent.find((m) => m.subject.startsWith('Booking confirmed'));
    expect(confirmation.to).toEqual(['asha.contact@example.com', 'pilgrim@example.com']);
    expect(confirmation.attachments.map((a) => a.filename)).toEqual([
      `BhaktiYatra-Ticket-${reference}.pdf`,
      expect.stringMatching(/^BhaktiYatra-Invoice-INV-\d{4}-\d{6}\.pdf$/),
    ]);
    expect(confirmation.attachments[0].content.subarray(0, 4).toString()).toBe('%PDF');
    expect(confirmation.text).toContain(reference);
    expect(confirmation.html).toContain(reference);
    expect(await NotificationLog.findOne({ type: 'booking_confirmed' })).toMatchObject({
      status: 'sent',
      attempts: 1,
    });
  });

  it('TC-DOC-05 two concurrent runs send each email once', async () => {
    await confirmedBooking();
    await Promise.all([processEmailQueue(ctx()), processEmailQueue(ctx())]);
    const confirmations = mail.sent.filter((m) => m.subject.startsWith('Booking confirmed'));
    expect(confirmations).toHaveLength(1);
  });

  it('TC-DOC-06 retries 3 times with 1/5/30 minute backoff, then stops; booking stays confirmed', async () => {
    const { reference } = await confirmedBooking();
    await NotificationLog.deleteMany({ type: { $ne: 'booking_confirmed' } });
    mail.failing = true;
    const t0 = new Date();
    const at = (minutes) => new Date(t0.getTime() + minutes * 60_000);

    expect(await processEmailQueue(ctx(), t0)).toEqual({ sent: 0, failed: 1 });
    let log = await NotificationLog.findOne({ type: 'booking_confirmed' });
    expect(log).toMatchObject({ status: 'failed', attempts: 1, lastError: 'SMTP down' });
    expect(log.nextAttemptAt.getTime()).toBe(at(1).getTime());

    expect(await processEmailQueue(ctx(), at(0.5))).toEqual({ sent: 0, failed: 0 }); // too early
    expect(await processEmailQueue(ctx(), at(1))).toEqual({ sent: 0, failed: 1 });
    log = await NotificationLog.findOne({ type: 'booking_confirmed' });
    expect(log.nextAttemptAt.getTime()).toBe(at(6).getTime());
    expect(await processEmailQueue(ctx(), at(6))).toEqual({ sent: 0, failed: 1 });
    expect(await processEmailQueue(ctx(), at(120))).toEqual({ sent: 0, failed: 0 });

    log = await NotificationLog.findOne({ type: 'booking_confirmed' });
    expect(log).toMatchObject({ status: 'failed', attempts: 3 });
    expect(await failedEmailCount()).toBe(1);
    expect(mail.send).toHaveBeenCalledTimes(3);
    expect((await Booking.findOne({ bookingReference: reference })).bookingStatus).toBe(
      'confirmed',
    );
  });

  it('ignores queued emails older than a day', async () => {
    await NotificationLog.collection.insertOne({
      type: 'welcome',
      to: 'old@example.com',
      dedupeKey: 'welcome:old',
      payload: { name: 'Old' },
      status: 'pending',
      attempts: 0,
      nextAttemptAt: new Date(Date.now() - 3 * 86_400_000),
      createdAt: new Date(Date.now() - 3 * 86_400_000),
      updatedAt: new Date(Date.now() - 3 * 86_400_000),
    });
    expect(await processEmailQueue(ctx())).toEqual({ sent: 0, failed: 0 });
  });

  it('queues and sends welcome, user cancellation and departure cancellation emails', async () => {
    await NotificationLog.deleteMany({});
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'New Pilgrim', email: 'new@example.com', password: 'Strong-Pass-123' });

    const tour = await makeTour();
    const departure = await makeDeparture(tour);
    const created = await agent.post('/api/v1/bookings').send({
      departureId: departure.id,
      seats: 1,
      contact: { name: 'Asha Devi', email: 'asha.contact@example.com', phone: '9876543210' },
      travellers: [{ name: 'A B', age: 30, gender: 'male' }],
      acceptedTerms: true,
    });
    const reference = created.body.data.booking.bookingReference;
    await agent.post(`/api/v1/bookings/${reference}/cancel`).send({});

    const other = await setupPaidOnDeparture();
    const admin = await makeAdmin({ email: 'admin2@example.com' });
    const adminAgent = request.agent(app);
    await loginAgent(adminAgent, admin.email);
    await adminAgent
      .post(`/api/v1/admin/departures/${other.departureId}/cancel`)
      .send({ reason: 'Landslide' });

    await processEmailQueue(ctx());
    const subjects = mail.sent.map((m) => m.subject);
    expect(subjects).toContain('Welcome to BhaktiYatra');
    expect(subjects).toContain(`Booking cancelled: ${reference}`);
    expect(
      subjects.some((s) => s.startsWith('Important: your') && s.endsWith('departure is cancelled')),
    ).toBe(true);
  });
});

async function setupPaidOnDeparture() {
  const { booking } = await confirmedBooking({ seats: 1 });
  return { departureId: booking.departure.toString() };
}

describe('password reset email', () => {
  it('is sent during the request with the link, and the log keeps no token', async () => {
    await request(app).post('/api/v1/auth/forgot-password').send({ email: 'pilgrim@example.com' });
    const message = mail.sent.find((m) => m.subject === 'Reset your BhaktiYatra password');
    expect(message.to).toBe('pilgrim@example.com');
    expect(message.text).toMatch(/http:\/\/localhost:3000\/reset-password\?token=[\w-]+/);
    const log = await NotificationLog.findOne({ type: 'password_reset' });
    expect(log).toMatchObject({ status: 'sent', attempts: 1 });
    expect(JSON.stringify(log.payload)).not.toContain('token');
    // The queue never picks it up again.
    const before = mail.send.mock.calls.length;
    await processEmailQueue(ctx());
    expect(mail.sent.filter((m) => m.subject === 'Reset your BhaktiYatra password')).toHaveLength(
      1,
    );
    expect(mail.send.mock.calls.length).toBeGreaterThanOrEqual(before);
  });

  it('records a failed attempt when the provider is down', async () => {
    mail.failing = true;
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'pilgrim@example.com' });
    expect(res.status).toBe(202);
    expect(await NotificationLog.findOne({ type: 'password_reset' })).toMatchObject({
      status: 'failed',
      lastError: 'SMTP down',
    });
  });
});

describe('templates', () => {
  it('render every type with HTML escaping, a text part and a staging prefix', () => {
    const booking = {
      bookingReference: 'BY-20260510-7K3QZ',
      seats: 2,
      amount: 19998,
      paymentStatus: 'paid',
      contact: { name: '<Asha>' },
      snapshot: {
        tourTitle: 'Kashi & Ayodhya',
        startDate: new Date('2026-05-09T18:30:00Z'),
        endDate: new Date('2026-05-13T18:30:00Z'),
        pickupCity: null,
      },
    };
    const data = {
      name: '<Asha>',
      resetUrl: 'http://x/reset',
      expiresInMinutes: 30,
      booking,
      reason: 'x',
      bookingReference: booking.bookingReference,
      issue: 'amount_mismatch',
      subject: 'Hello',
    };
    for (const type of TEMPLATE_TYPES) {
      const email = renderEmail(type, data, { siteUrl: 'http://x', nodeEnv: 'test' });
      expect(email.subject.length, type).toBeGreaterThan(5);
      expect(email.html, type).not.toContain('<Asha>');
      expect(email.text.length, type).toBeGreaterThan(20);
    }
    const confirmed = renderEmail('booking_confirmed', data, {
      siteUrl: 'http://x',
      nodeEnv: 'staging',
    });
    expect(confirmed.subject).toMatch(/^\[STAGING\] Booking confirmed: Kashi & Ayodhya/);
    expect(confirmed.html).toContain('Kashi &amp; Ayodhya');
    expect(confirmed.text).toContain('Amount: ₹19,998');
  });
});
