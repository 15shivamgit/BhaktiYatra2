import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { parseEnv } from '../../src/config/env.js';
import { Booking } from '../../src/models/Booking.js';
import { TourDeparture } from '../../src/models/TourDeparture.js';
import { createPaymentsProvider } from '../../src/providers/payments.provider.js';
import { loginAgent, makeUser } from '../helpers/factories.js';
import { createFakeFrontend } from '../helpers/fake-providers.js';
import { makeDeparture, makeTour } from '../helpers/tour-factories.js';
import { buildTestApp, clearTestDb, connectTestDb, disconnectTestDb } from '../helpers/test-app.js';

/* Settings for the deployed environments (Phase 10, ADR-036). */

beforeAll(() => connectTestDb());
afterAll(() => disconnectTestDb());
beforeEach(() => clearTestDb());

const deployed = {
  MONGO_URL: 'mongodb://localhost/x',
  JWT_SECRET: 'x'.repeat(40),
  FRONTEND_URLS: 'https://bhaktiyatra.vercel.app',
  SITE_URL: 'https://bhaktiyatra.vercel.app',
  REVALIDATE_SECRET: 'r'.repeat(20),
  TICKET_SIGNING_SECRET: 't'.repeat(40),
  RESEND_API_KEY: 're_test',
  ADMIN_NOTIFY_EMAIL: 'owner@example.com',
};

describe('content-only launch (PAYMENTS_PROVIDER=disabled)', () => {
  it('production may start without Razorpay keys when payments are disabled', () => {
    expect(() =>
      parseEnv({ ...deployed, NODE_ENV: 'production', PAYMENTS_PROVIDER: 'disabled' }),
    ).not.toThrow();
    expect(() =>
      parseEnv({ ...deployed, NODE_ENV: 'production', PAYMENTS_PROVIDER: 'stub' }),
    ).toThrow(/razorpay or disabled/);
    expect(() => parseEnv({ ...deployed, NODE_ENV: 'production' })).toThrow(/RAZORPAY_KEY_ID/);
  });

  it('booking answers 503 and never holds a seat', async () => {
    const { app } = buildTestApp(
      { PAYMENTS_PROVIDER: 'disabled' },
      {
        providers: {
          payments: createPaymentsProvider({ provider: 'disabled', nodeEnv: 'production' }),
          frontend: createFakeFrontend(),
        },
      },
    );
    const user = await makeUser();
    const agent = request.agent(app);
    await loginAgent(agent, user.email);
    const departure = await makeDeparture(await makeTour(), { seats: 10 });
    const res = await agent.post('/api/v1/bookings').send({
      departureId: departure.id,
      seats: 2,
      contact: { name: 'Asha Devi', email: 'asha@example.com', phone: '9876543210' },
      travellers: [
        { name: 'Asha Devi', age: 50, gender: 'female' },
        { name: 'Ravi Kumar', age: 52, gender: 'male' },
      ],
      acceptedTerms: true,
    });
    expect(res.status).toBe(503);
    expect(res.body.message).toMatch(/not open yet/);
    expect((await TourDeparture.findById(departure._id)).seatsAvailable).toBe(10);
    expect(await Booking.countDocuments()).toBe(0);
  });
});

describe('client IP behind the Vercel rewrite', () => {
  const attempt = (app, forwardedFor) =>
    request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', forwardedFor)
      .send({ email: 'nobody@example.com', password: 'wrong-pass-1' });

  it('with two proxy hops, rate limits apply per visitor, not per Vercel server', async () => {
    const { app } = buildTestApp({
      RATE_LIMIT_ENABLED: 'true',
      RATE_LIMIT_AUTH_MAX: '1',
      TRUST_PROXY_HOPS: '2',
    });
    // Vercel puts the visitor first; Render appends the Vercel server's address.
    expect((await attempt(app, '203.0.113.1, 76.76.21.9')).status).toBe(401);
    expect((await attempt(app, '203.0.113.2, 76.76.21.9')).status).toBe(401); // another visitor
    expect((await attempt(app, '203.0.113.1, 76.76.21.9')).status).toBe(429); // same visitor
  });

  it('with one hop (Render alone) the Vercel address would be everyone’s address', async () => {
    const { app } = buildTestApp({
      RATE_LIMIT_ENABLED: 'true',
      RATE_LIMIT_AUTH_MAX: '1',
      TRUST_PROXY_HOPS: '1',
    });
    expect((await attempt(app, '203.0.113.1, 76.76.21.9')).status).toBe(401);
    expect((await attempt(app, '203.0.113.2, 76.76.21.9')).status).toBe(429);
  });
});
