import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Contact } from '../../src/models/Contact.js';
import { NotificationLog } from '../../src/models/NotificationLog.js';
import { loginAgent, makeAdmin } from '../helpers/factories.js';
import { makeCircuit, makeTemple } from '../helpers/content-factories.js';
import { createFakeFrontend, createFakeImages, PNG_1X1 } from '../helpers/fake-providers.js';
import { buildTestApp, clearTestDb, connectTestDb, disconnectTestDb } from '../helpers/test-app.js';

let app;
let agent;
let frontend;

beforeAll(() => connectTestDb());
afterAll(() => disconnectTestDb());
beforeEach(async () => {
  await clearTestDb();
  frontend = createFakeFrontend();
  ({ app } = buildTestApp(
    { ADMIN_NOTIFY_EMAIL: 'owner@example.com' },
    { providers: { images: createFakeImages(), frontend } },
  ));
  const admin = await makeAdmin({ email: 'admin@example.com' });
  agent = request.agent(app);
  await loginAgent(agent, admin.email);
});

describe('public circuits', () => {
  it('lists published circuits with published-temple counts and shows temples in route order', async () => {
    const yamunotri = await makeTemple({ name: 'Yamunotri' });
    const gangotri = await makeTemple({ name: 'Gangotri' });
    const hidden = await makeTemple({ name: 'Hidden', status: 'draft' });
    const kedarnath = await makeTemple({ name: 'Kedarnath' });
    await makeCircuit({
      slug: 'char-dham',
      name: 'Char Dham',
      temples: [yamunotri._id, gangotri._id, hidden._id, kedarnath._id],
    });
    await makeCircuit({ slug: 'draft-route', status: 'draft' });

    const list = await request(app).get('/api/v1/circuits');
    expect(list.body.data.map((c) => [c.slug, c.templeCount])).toEqual([['char-dham', 3]]);

    const detail = await request(app).get('/api/v1/circuits/char-dham');
    expect(detail.body.data.temples.map((t) => [t.position, t.name])).toEqual([
      [1, 'Yamunotri'],
      [2, 'Gangotri'],
      [3, 'Kedarnath'],
    ]);
    expect((await request(app).get('/api/v1/circuits/draft-route')).status).toBe(404);
  });
});

describe('admin circuits', () => {
  it('creates with an ordered temple list and refuses unknown or duplicate temples', async () => {
    const a = await makeTemple();
    const b = await makeTemple();
    const res = await agent
      .post('/api/v1/admin/circuits')
      .send({
        name: 'Char Dham',
        shortDescription: 'The four abodes in Uttarakhand.',
        temples: [b.id, a.id],
      });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ slug: 'char-dham', status: 'draft' });
    expect(res.body.data.temples.map((t) => t.id)).toEqual([b.id, a.id]);

    const dup = await agent
      .post('/api/v1/admin/circuits')
      .send({ name: 'Dup', shortDescription: 'Duplicate temples here.', temples: [a.id, a.id] });
    expect(dup.status).toBe(422);
    const missing = await agent
      .post('/api/v1/admin/circuits')
      .send({
        name: 'Missing',
        shortDescription: 'Unknown temple id here.',
        temples: ['64b7f0c2a1b2c3d4e5f60718'],
      });
    expect(missing.status).toBe(422);
  });

  it('publishes only with at least two published temples', async () => {
    const pub = await makeTemple();
    const draft = await makeTemple({ status: 'draft' });
    const created = await agent
      .post('/api/v1/admin/circuits')
      .send({
        name: 'Loop',
        shortDescription: 'A short loop of shrines.',
        temples: [pub.id, draft.id],
      });
    const blocked = await agent.post(`/api/v1/admin/circuits/${created.body.data.id}/publish`);
    expect(blocked.status).toBe(422);
    expect(blocked.body.code).toBe('PUBLISH_PREREQUISITES');

    const pub2 = await makeTemple();
    await agent
      .patch(`/api/v1/admin/circuits/${created.body.data.id}`)
      .send({ temples: [pub.id, pub2.id] });
    const ok = await agent.post(`/api/v1/admin/circuits/${created.body.data.id}/publish`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.status).toBe('published');
    expect(frontend.revalidate).toHaveBeenCalled();
  });

  it('sets a cover image and deletes drafts only', async () => {
    const circuit = await makeCircuit({ status: 'draft' });
    const img = await agent
      .post(`/api/v1/admin/circuits/${circuit.id}/image`)
      .field('alt', 'Snow peaks above the valley')
      .attach('file', PNG_1X1, 'cover.png');
    expect(img.status).toBe(201);
    expect(img.body.data.image.alt).toBe('Snow peaks above the valley');

    expect((await agent.delete(`/api/v1/admin/circuits/${circuit.id}`)).status).toBe(204);
    const live = await makeCircuit();
    expect((await agent.delete(`/api/v1/admin/circuits/${live.id}`)).status).toBe(409);
  });
});

describe('contact form', () => {
  const message = {
    name: 'Ramesh Kumar',
    email: 'Ramesh@Example.com',
    phone: '98765 43210',
    subject: 'Group booking',
    message: 'We are 25 people from Patna. Do you run group yatras?',
  };

  it('stores a message, normalises contact details and notifies the admin', async () => {
    const res = await request(app).post('/api/v1/contact').send(message);
    expect(res.status).toBe(201);
    const stored = await Contact.findById(res.body.data.id);
    expect(stored).toMatchObject({
      email: 'ramesh@example.com',
      phone: '+919876543210',
      status: 'new',
    });
    expect(stored.ipHash).toMatch(/^[a-f0-9]{64}$/);
    expect(
      await NotificationLog.exists({ type: 'contact_received_admin', to: 'owner@example.com' }),
    ).toBeTruthy();
  });

  it('TC-CONTACT-01 a filled honeypot is stored as spam with the same response and no email', async () => {
    const res = await request(app)
      .post('/api/v1/contact')
      .send({ ...message, website: 'http://spam.example' });
    expect(res.status).toBe(201);
    expect((await Contact.findById(res.body.data.id)).status).toBe('spam');
    expect(await NotificationLog.countDocuments()).toBe(0);
  });

  it('validates input', async () => {
    const res = await request(app)
      .post('/api/v1/contact')
      .send({ name: 'A', email: 'x', message: 'short' });
    expect(res.status).toBe(422);
  });

  it('is rate limited per IP', async () => {
    const limited = buildTestApp({ RATE_LIMIT_ENABLED: 'true', RATE_LIMIT_CONTACT_MAX: '2' }).app;
    const codes = [];
    for (let i = 0; i < 3; i += 1)
      codes.push((await request(limited).post('/api/v1/contact').send(message)).status);
    expect(codes).toEqual([201, 201, 429]);
  });

  it('lets admins list and triage messages', async () => {
    await request(app).post('/api/v1/contact').send(message);
    const list = await agent.get('/api/v1/admin/contacts').query({ status: 'new' });
    expect(list.body.data).toHaveLength(1);
    const patched = await agent
      .patch(`/api/v1/admin/contacts/${list.body.data[0].id}`)
      .send({ status: 'replied' });
    expect(patched.body.data.status).toBe('replied');
  });
});
