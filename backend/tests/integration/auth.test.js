import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { NotificationLog } from '../../src/models/NotificationLog.js';
import { User } from '../../src/models/User.js';
import { AuditLog } from '../../src/models/AuditLog.js';
import { signSession } from '../../src/modules/auth/session.js';
import { sha256Hex } from '../../src/utils/crypto.js';
import { DEFAULT_PASSWORD, loginAgent, makeAdmin, makeUser } from '../helpers/factories.js';
import {
  buildTestApp,
  clearTestDb,
  connectTestDb,
  cookieFrom,
  disconnectTestDb,
} from '../helpers/test-app.js';

const { app, env } = buildTestApp();
const api = (path) => `/api/v1/auth${path}`;
const SECRET_FIELDS = /passwordHash|passwordReset|sessionVersion|googleId/;

beforeAll(() => connectTestDb());
afterAll(() => disconnectTestDb());
beforeEach(() => clearTestDb());

describe('POST /auth/register', () => {
  it('TC-AUTH-01 creates a user, sets the session cookie and hides secrets', async () => {
    const res = await request(app).post(api('/register')).send({
      name: '  Sunita Sharma ',
      email: 'Sunita@Example.com',
      password: 'StrongPass123',
      phone: '98765 43210',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({
      name: 'Sunita Sharma',
      email: 'sunita@example.com',
      phone: '+919876543210',
      role: 'user',
      hasPassword: true,
      googleLinked: false,
    });
    expect(JSON.stringify(res.body)).not.toMatch(SECRET_FIELDS);
    const cookie = cookieFrom(res, 'by_session');
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);

    const queued = await NotificationLog.findOne({ type: 'welcome' });
    expect(queued.to).toBe('sunita@example.com');
  });

  it('TC-AUTH-02 rejects a duplicate email regardless of case', async () => {
    await makeUser({ email: 'dup@example.com' });
    const res = await request(app)
      .post(api('/register'))
      .send({ name: 'Dup', email: 'DUP@example.com', password: 'StrongPass123' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_TAKEN');
  });

  it('rejects weak or common passwords, bad phones and unknown fields', async () => {
    const res = await request(app).post(api('/register')).send({
      name: 'A',
      email: 'not-an-email',
      password: 'password',
      phone: '12345',
      role: 'admin',
    });
    expect(res.status).toBe(422);
    const paths = res.body.details.map((d) => d.path);
    expect(paths).toEqual(
      expect.arrayContaining(['body.name', 'body.email', 'body.password', 'body.phone']),
    );
    expect(res.body.details.some((d) => /unrecognized/i.test(d.message))).toBe(true);
  });
});

describe('POST /auth/login', () => {
  it('logs in, returns the user and updates lastLoginAt', async () => {
    const user = await makeUser({ email: 'ram@example.com' });
    const res = await request(app)
      .post(api('/login'))
      .send({ email: 'RAM@example.com', password: DEFAULT_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(user.id);
    expect(cookieFrom(res, 'by_session')).toBeTruthy();
    expect((await User.findById(user.id)).lastLoginAt).toBeInstanceOf(Date);
  });

  it('TC-AUTH-03 gives the same answer for a wrong password and an unknown email', async () => {
    await makeUser({ email: 'ram@example.com' });
    const wrong = await request(app)
      .post(api('/login'))
      .send({ email: 'ram@example.com', password: 'nope-nope-1' });
    const unknown = await request(app)
      .post(api('/login'))
      .send({ email: 'ghost@example.com', password: 'nope-nope-1' });
    for (const res of [wrong, unknown]) {
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
      expect(res.body.message).toBe('Invalid email or password');
    }
  });

  it('refuses password login for a Google-only account without revealing why', async () => {
    await makeUser({ email: 'g@example.com', password: null, googleId: 'g-1' });
    const res = await request(app)
      .post(api('/login'))
      .send({ email: 'g@example.com', password: 'anything-1' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('reports a disabled account only after a correct password', async () => {
    await makeUser({ email: 'off@example.com', isActive: false });
    const res = await request(app)
      .post(api('/login'))
      .send({ email: 'off@example.com', password: DEFAULT_PASSWORD });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('ACCOUNT_DISABLED');
  });

  it('audits admin logins', async () => {
    const admin = await makeAdmin({ email: 'boss@example.com' });
    await request(app)
      .post(api('/login'))
      .send({ email: 'boss@example.com', password: DEFAULT_PASSWORD });
    const entry = await AuditLog.findOne({ action: 'auth.admin_login' });
    expect(entry.entityId.toString()).toBe(admin.id);
  });

  it('TC-SEC-03 rejects NoSQL operator injection in the email field', async () => {
    const res = await request(app)
      .post(api('/login'))
      .send({ email: { $gt: '' }, password: { $gt: '' } });
    expect(res.status).toBe(422);
  });
});

describe('session lifecycle', () => {
  it('TC-AUTH-04 /me without a cookie is 401 UNAUTHENTICATED', async () => {
    const res = await request(app).get(api('/me'));
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('/me returns the signed-in user; logout clears the cookie', async () => {
    const user = await makeUser();
    const agent = request.agent(app);
    await loginAgent(agent, user.email);

    const me = await agent.get(api('/me'));
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe(user.email);
    expect(me.headers['cache-control']).toBe('no-store');

    const out = await agent.post(api('/logout'));
    expect(out.status).toBe(204);
    expect(cookieFrom(out, 'by_session')).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect((await agent.get(api('/me'))).status).toBe(401);
  });

  it('TC-AUTH-05 a deactivated user with a valid cookie gets 401', async () => {
    const user = await makeUser();
    const agent = request.agent(app);
    await loginAgent(agent, user.email);
    await User.updateOne({ _id: user._id }, { isActive: false });
    const res = await agent.get(api('/me'));
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('ACCOUNT_DISABLED');
  });

  it('/session answers 200 with null for guests and the user when signed in', async () => {
    const guest = await request(app).get(api('/session'));
    expect(guest.status).toBe(200);
    expect(guest.body.data.user).toBeNull();
    const bad = await request(app).get(api('/session')).set('Cookie', 'by_session=junk');
    expect(bad.status).toBe(200);
    expect(bad.body.data.user).toBeNull();

    const user = await makeUser();
    const agent = request.agent(app);
    await loginAgent(agent, user.email);
    const signedIn = await agent.get(api('/session'));
    expect(signedIn.body.data.user.email).toBe(user.email);
    expect(signedIn.headers['cache-control']).toBe('no-store');
  });

  it('a tampered cookie is 401 SESSION_EXPIRED', async () => {
    const res = await request(app).get(api('/me')).set('Cookie', 'by_session=not.a.jwt');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('SESSION_EXPIRED');
  });
});

describe('profile', () => {
  it('updates name and phone, and clears phone with an empty string', async () => {
    const user = await makeUser();
    const agent = request.agent(app);
    await loginAgent(agent, user.email);

    const updated = await agent
      .patch(api('/me'))
      .send({ name: 'New Name', phone: '+44 7700 900123' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.user).toMatchObject({ name: 'New Name', phone: '+447700900123' });

    const cleared = await agent.patch(api('/me')).send({ phone: '' });
    expect(cleared.body.data.user.phone).toBeNull();
  });

  it('refuses email or role changes through /me', async () => {
    const user = await makeUser();
    const agent = request.agent(app);
    await loginAgent(agent, user.email);
    const res = await agent.patch(api('/me')).send({ role: 'admin' });
    expect(res.status).toBe(422);
    expect((await User.findById(user.id)).role).toBe('user');
  });
});

describe('POST /auth/change-password', () => {
  it('TC-AUTH-06 signs out other sessions but keeps the current one', async () => {
    const user = await makeUser();
    const deviceA = request.agent(app);
    const deviceB = request.agent(app);
    await loginAgent(deviceA, user.email);
    await loginAgent(deviceB, user.email);

    const res = await deviceA
      .post(api('/change-password'))
      .send({ currentPassword: DEFAULT_PASSWORD, newPassword: 'Brand-New-Pass-7' });
    expect(res.status).toBe(204);

    expect((await deviceA.get(api('/me'))).status).toBe(200);
    const stale = await deviceB.get(api('/me'));
    expect(stale.status).toBe(401);
    expect(stale.body.code).toBe('SESSION_EXPIRED');

    const relogin = await request(app)
      .post(api('/login'))
      .send({ email: user.email, password: 'Brand-New-Pass-7' });
    expect(relogin.status).toBe(200);
  });

  it('rejects a wrong current password', async () => {
    const user = await makeUser();
    const agent = request.agent(app);
    await loginAgent(agent, user.email);
    const res = await agent
      .post(api('/change-password'))
      .send({ currentPassword: 'wrong-pass-1', newPassword: 'Brand-New-Pass-7' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('lets a Google-only account set its first password without a current one', async () => {
    const user = await makeUser({ password: null, googleId: 'g-2' });
    // A Google-only user cannot log in with a password, so mint their session directly.
    const token = await signSession(env, user);

    const res = await request(app)
      .post(api('/change-password'))
      .set('Cookie', `by_session=${token}`)
      .send({ newPassword: 'First-Pass-123' });
    expect(res.status).toBe(204);

    const fresh = cookieFrom(res, 'by_session').split(';')[0];
    const me = await request(app).get(api('/me')).set('Cookie', fresh);
    expect(me.body.data.user.hasPassword).toBe(true);
  });
});

describe('password reset', () => {
  it('always answers 202 and stores only a hash of the token', async () => {
    const user = await makeUser({ email: 'reset@example.com' });
    const unknown = await request(app)
      .post(api('/forgot-password'))
      .send({ email: 'nobody@example.com' });
    const known = await request(app)
      .post(api('/forgot-password'))
      .send({ email: 'reset@example.com' });
    expect(unknown.status).toBe(202);
    expect(known.status).toBe(202);
    expect(known.body).toEqual(unknown.body);

    const stored = await User.findById(user.id).select('+passwordReset');
    expect(stored.passwordReset.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    const queued = await NotificationLog.findOne({ type: 'password_reset' });
    expect(JSON.stringify(queued.payload)).not.toMatch(/token/i);
  });

  it('TC-AUTH-07 resets once with a valid token and rejects reuse and expiry', async () => {
    const user = await makeUser({ email: 'reset@example.com' });
    const token = 'A'.repeat(43);
    await User.updateOne(
      { _id: user._id },
      { passwordReset: { tokenHash: sha256Hex(token), expiresAt: new Date(Date.now() + 60_000) } },
    );
    const agent = request.agent(app);
    await loginAgent(agent, user.email);

    const ok = await request(app)
      .post(api('/reset-password'))
      .send({ token, newPassword: 'Reset-Pass-123' });
    expect(ok.status).toBe(204);
    expect((await agent.get(api('/me'))).status).toBe(401); // other sessions signed out

    const reuse = await request(app)
      .post(api('/reset-password'))
      .send({ token, newPassword: 'Again-Pass-123' });
    expect(reuse.status).toBe(400);
    expect(reuse.body.code).toBe('INVALID_OR_EXPIRED_TOKEN');

    const expiredToken = 'B'.repeat(43);
    await User.updateOne(
      { _id: user._id },
      {
        passwordReset: {
          tokenHash: sha256Hex(expiredToken),
          expiresAt: new Date(Date.now() - 1000),
        },
      },
    );
    const expired = await request(app)
      .post(api('/reset-password'))
      .send({ token: expiredToken, newPassword: 'Again-Pass-123' });
    expect(expired.status).toBe(400);

    const login = await request(app)
      .post(api('/login'))
      .send({ email: user.email, password: 'Reset-Pass-123' });
    expect(login.status).toBe(200);
  });
});
