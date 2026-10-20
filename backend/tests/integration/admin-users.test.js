import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AuditLog } from '../../src/models/AuditLog.js';
import { loginAgent, makeAdmin, makeUser } from '../helpers/factories.js';
import { buildTestApp, clearTestDb, connectTestDb, disconnectTestDb } from '../helpers/test-app.js';

const { app } = buildTestApp();
const base = '/api/v1/admin/users';

beforeAll(() => connectTestDb());
afterAll(() => disconnectTestDb());
beforeEach(() => clearTestDb());

async function adminAgent() {
  const admin = await makeAdmin({ email: 'admin@example.com' });
  const agent = request.agent(app);
  await loginAgent(agent, admin.email);
  return { admin, agent };
}

describe('admin users: access control', () => {
  it('TC-AUTH-09 guests get 401 and ordinary users get 403 on every route', async () => {
    const target = await makeUser();
    const routes = [
      ['get', base],
      ['get', `${base}/${target.id}`],
      ['patch', `${base}/${target.id}`],
    ];
    for (const [method, path] of routes) {
      const guest = await request(app)[method](path).send({ role: 'admin' });
      expect(guest.status, `${method} ${path} as guest`).toBe(401);
    }

    const user = await makeUser({ email: 'plain@example.com' });
    const agent = request.agent(app);
    await loginAgent(agent, user.email);
    for (const [method, path] of routes) {
      const res = await agent[method](path).send({ role: 'admin' });
      expect(res.status, `${method} ${path} as user`).toBe(403);
      expect(res.body.code).toBe('ADMIN_ONLY');
    }
  });

  it('a demoted admin loses access on the next request', async () => {
    const { admin, agent } = await adminAgent();
    expect((await agent.get(base)).status).toBe(200);
    admin.role = 'user';
    await admin.save();
    expect((await agent.get(base)).status).toBe(403);
  });
});

describe('admin users: list and detail', () => {
  it('lists with pagination, search and filters, without secrets', async () => {
    const { agent } = await adminAgent();
    await makeUser({ name: 'Ramesh Kumar', email: 'ramesh@example.com', phone: '+919811111111' });
    await makeUser({ name: 'Sita Devi', email: 'sita@example.com', isActive: false });
    for (let i = 0; i < 3; i += 1) await makeUser();

    const page1 = await agent.get(base).query({ limit: 2, page: 1 });
    expect(page1.status).toBe(200);
    expect(page1.body.data).toHaveLength(2);
    expect(page1.body.meta).toMatchObject({ page: 1, limit: 2, total: 6, totalPages: 3 });
    expect(JSON.stringify(page1.body)).not.toMatch(/passwordHash|sessionVersion/);

    const search = await agent.get(base).query({ q: 'ramesh' });
    expect(search.body.data.map((u) => u.email)).toEqual(['ramesh@example.com']);

    const byPhone = await agent.get(base).query({ q: '98111' });
    expect(byPhone.body.data).toHaveLength(1);

    const inactive = await agent.get(base).query({ isActive: 'false' });
    expect(inactive.body.data.map((u) => u.email)).toEqual(['sita@example.com']);

    const admins = await agent.get(base).query({ role: 'admin' });
    expect(admins.body.data).toHaveLength(1);
  });

  it('treats regex characters in search as plain text', async () => {
    const { agent } = await adminAgent();
    const res = await agent.get(base).query({ q: '.*(' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('returns 404 for an unknown id and 422 for a malformed one', async () => {
    const { agent } = await adminAgent();
    expect((await agent.get(`${base}/64b7f0c2a1b2c3d4e5f60718`)).status).toBe(404);
    expect((await agent.get(`${base}/not-an-id`)).status).toBe(422);
  });
});

describe('admin users: update', () => {
  it('changes role and active state and writes audit entries', async () => {
    const { admin, agent } = await adminAgent();
    const target = await makeUser();

    const promoted = await agent.patch(`${base}/${target.id}`).send({ role: 'admin' });
    expect(promoted.status).toBe(200);
    expect(promoted.body.data.role).toBe('admin');

    const disabled = await agent.patch(`${base}/${target.id}`).send({ isActive: false });
    expect(disabled.body.data.isActive).toBe(false);

    const entries = await AuditLog.find({ entityId: target._id }).sort({ _id: 1 });
    expect(entries.map((e) => e.action)).toEqual(['user.role.change', 'user.active.change']);
    expect(entries[0]).toMatchObject({ before: { role: 'user' }, after: { role: 'admin' } });
    expect(entries[0].actor.toString()).toBe(admin.id);
  });

  it('TC-AUTH-10 an admin cannot change their own role or status', async () => {
    const { admin, agent } = await adminAgent();
    const res = await agent.patch(`${base}/${admin.id}`).send({ role: 'user' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CANNOT_MODIFY_SELF');
  });

  it('a deactivated user is signed out immediately', async () => {
    const { agent } = await adminAgent();
    const target = await makeUser({ email: 'victim@example.com' });
    const targetAgent = request.agent(app);
    await loginAgent(targetAgent, target.email);

    await agent.patch(`${base}/${target.id}`).send({ isActive: false });
    const me = await targetAgent.get('/api/v1/auth/me');
    expect(me.status).toBe(401);
    expect(me.body.code).toBe('ACCOUNT_DISABLED');
  });

  it('rejects empty or unknown update fields', async () => {
    const { agent } = await adminAgent();
    const target = await makeUser();
    expect((await agent.patch(`${base}/${target.id}`).send({})).status).toBe(422);
    expect((await agent.patch(`${base}/${target.id}`).send({ email: 'x@y.z' })).status).toBe(422);
  });
});
