import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AuditLog } from '../../src/models/AuditLog.js';
import { Temple } from '../../src/models/Temple.js';
import { loginAgent, makeAdmin, makeUser } from '../helpers/factories.js';
import { LONG_DESCRIPTION, makeCircuit, makeTemple } from '../helpers/content-factories.js';
import {
  createFakeFrontend,
  createFakeImages,
  FAKE_EXE,
  PNG_1X1,
} from '../helpers/fake-providers.js';
import { buildTestApp, clearTestDb, connectTestDb, disconnectTestDb } from '../helpers/test-app.js';

const base = '/api/v1/admin/temples';
let app;
let images;
let frontend;
let agent;

beforeAll(() => connectTestDb());
afterAll(() => disconnectTestDb());
beforeEach(async () => {
  await clearTestDb();
  images = createFakeImages();
  frontend = createFakeFrontend();
  ({ app } = buildTestApp({}, { providers: { images, frontend } }));
  const admin = await makeAdmin({ email: 'admin@example.com' });
  agent = request.agent(app);
  await loginAgent(agent, admin.email);
});

const minimal = {
  name: 'Kedarnath Temple',
  deity: 'Shiva',
  state: 'Uttarakhand',
  city: 'Rudraprayag',
  shortDescription: 'One of the twelve Jyotirlingas, high in the Garhwal Himalaya.',
  description: '<p>Short for now.</p>',
};

describe('access control', () => {
  it('guests get 401 and users get 403 on admin temple routes', async () => {
    const t = await makeTemple();
    expect((await request(app).get(base)).status).toBe(401);
    const user = await makeUser({ email: 'u@example.com' });
    const userAgent = request.agent(app);
    await loginAgent(userAgent, user.email);
    for (const [method, path] of [
      ['get', base],
      ['post', base],
      ['patch', `${base}/${t.id}`],
      ['post', `${base}/${t.id}/publish`],
      ['delete', `${base}/${t.id}`],
    ]) {
      expect((await userAgent[method](path).send({})).status, `${method} ${path}`).toBe(403);
    }
  });
});

describe('create and update', () => {
  it('creates a draft with a unique auto slug and audits it', async () => {
    await makeTemple({ slug: 'kedarnath-temple-rudraprayag' });
    const res = await agent.post(base).send({ ...minimal, status: undefined });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      status: 'draft',
      slug: 'kedarnath-temple-rudraprayag-2',
    });
    expect(await AuditLog.exists({ action: 'temple.create' })).toBeTruthy();
  });

  it('refuses unknown fields such as status or images on create', async () => {
    const res = await agent.post(base).send({ ...minimal, status: 'published' });
    expect(res.status).toBe(422);
  });

  it('rejects an explicit slug that is taken with 409 SLUG_TAKEN', async () => {
    await makeTemple({ slug: 'taken' });
    const res = await agent.post(base).send({ ...minimal, slug: 'taken' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('SLUG_TAKEN');
  });

  it('TC-TEMPLE-07 strips scripts and event handlers from rich text', async () => {
    const created = await agent.post(base).send(minimal);
    const res = await agent.patch(`${base}/${created.body.data.id}`).send({
      description:
        '<p onclick="steal()">Hello <script>alert(1)</script><a href="javascript:alert(1)">x</a><img src="https://evil.example/a.png" onerror="x()"><strong>ok</strong></p>',
    });
    expect(res.status).toBe(200);
    const html = res.body.data.description;
    expect(html).not.toMatch(/script|onclick|onerror|javascript:|evil\.example/i);
    expect(html).toContain('<strong>ok</strong>');
  });

  it('stores location from { lat, lng } and returns it the same way', async () => {
    const created = await agent
      .post(base)
      .send({ ...minimal, location: { lat: 30.7352, lng: 79.0669 } });
    expect(created.body.data.location).toEqual({ lat: 30.7352, lng: 79.0669 });
    const stored = await Temple.findById(created.body.data.id);
    expect(stored.location.coordinates).toEqual([79.0669, 30.7352]);
  });

  it('validates state, times and URLs', async () => {
    const res = await agent.post(base).send({
      ...minimal,
      state: 'Atlantis',
      timings: [{ label: 'Morning', open: '25:00' }],
      officialWebsite: 'not a url',
    });
    expect(res.status).toBe(422);
    const paths = res.body.details.map((d) => d.path);
    expect(paths).toEqual(
      expect.arrayContaining(['body.state', 'body.timings.0.open', 'body.officialWebsite']),
    );
  });
});

describe('publishing', () => {
  it('TC-TEMPLE-05 lists every missing prerequisite', async () => {
    const created = await agent.post(base).send(minimal);
    const res = await agent.post(`${base}/${created.body.data.id}/publish`);
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('PUBLISH_PREREQUISITES');
    expect(res.body.details.map((d) => d.path).sort()).toEqual([
      'description',
      'images',
      'location',
      'timings',
    ]);
  });

  it('publishes a complete temple, sets publishedAt and revalidates the frontend', async () => {
    const draft = await makeTemple({ status: 'draft', publishedAt: undefined });
    const res = await agent.post(`${base}/${draft.id}/publish`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('published');
    expect(res.body.data.publishedAt).toBeTruthy();
    expect(frontend.revalidate).toHaveBeenCalledWith({ tags: ['content', `temple:${draft.slug}`] });
    expect((await request(app).get(`/api/v1/temples/${draft.slug}`)).status).toBe(200);
  });

  it('requires alt text on every image before publishing', async () => {
    const draft = await makeTemple({
      status: 'draft',
      images: [
        {
          url: 'https://res.cloudinary.com/x/a.jpg',
          publicId: 'x/a',
          alt: '',
          isPrimary: true,
          order: 0,
        },
      ],
    });
    const res = await agent.post(`${base}/${draft.id}/publish`);
    expect(res.body.details).toEqual([{ path: 'images', message: 'Every image needs alt text' }]);
  });

  it('unpublish and archive hide the temple from the public', async () => {
    const t = await makeTemple({ slug: 'goes-away' });
    await agent.post(`${base}/${t.id}/archive`);
    expect((await request(app).get('/api/v1/temples/goes-away')).status).toBe(404);
    const detail = await agent.get(`${base}/${t.id}`);
    expect(detail.body.data.status).toBe('archived');
  });

  it('TC-TEMPLE-06 renaming a published temple redirects the old slug with 301', async () => {
    const t = await makeTemple({ slug: 'old-slug' });
    await agent.patch(`${base}/${t.id}`).send({ slug: 'newer-slug' });
    await agent.patch(`${base}/${t.id}`).send({ slug: 'newest-slug' });
    for (const old of ['old-slug', 'newer-slug']) {
      const res = await request(app).get(`/api/v1/temples/${old}`).redirects(0);
      expect(res.status, old).toBe(301);
      expect(res.body.data.redirect.slug).toBe('newest-slug'); // no redirect chains
    }
  });

  it('returns publish problems with the admin detail', async () => {
    const created = await agent.post(base).send({ ...minimal, description: LONG_DESCRIPTION });
    const detail = await agent.get(`${base}/${created.body.data.id}`);
    expect(detail.body.meta.publishProblems.map((p) => p.path).sort()).toEqual([
      'images',
      'location',
      'timings',
    ]);
  });
});

describe('deleting', () => {
  it('deletes unreferenced drafts only', async () => {
    const draft = await makeTemple({ status: 'draft', images: [] });
    const published = await makeTemple();
    const inCircuit = await makeTemple({ status: 'draft' });
    await makeCircuit({ temples: [inCircuit._id], status: 'draft' });

    expect((await agent.delete(`${base}/${draft.id}`)).status).toBe(204);
    const pub = await agent.delete(`${base}/${published.id}`);
    expect(pub.status).toBe(409);
    expect(pub.body.code).toBe('HAS_REFERENCES');
    expect((await agent.delete(`${base}/${inCircuit.id}`)).status).toBe(409);
  });
});

describe('images', () => {
  async function draftTemple() {
    return makeTemple({ status: 'draft', images: [] });
  }

  it('uploads images to the app folder, keeps order and makes the first primary', async () => {
    const t = await draftTemple();
    const res = await agent
      .post(`${base}/${t.id}/images`)
      .field('alts', JSON.stringify(['Front gate', 'Sanctum spire']))
      .attach('files', PNG_1X1, 'a.png')
      .attach('files', PNG_1X1, 'b.png');
    expect(res.status).toBe(201);
    expect(res.body.data.map((i) => [i.alt, i.order, i.isPrimary])).toEqual([
      ['Front gate', 0, true],
      ['Sanctum spire', 1, false],
    ]);
    expect(res.body.data[0].publicId.startsWith(`bhaktiyatra/dev/temples/${t.slug}/`)).toBe(true);
  });

  it('TC-TEMPLE-08 rejects a disguised executable with 415', async () => {
    const t = await draftTemple();
    const res = await agent.post(`${base}/${t.id}/images`).attach('files', FAKE_EXE, 'photo.jpg');
    expect(res.status).toBe(415);
    expect(res.body.code).toBe('UNSUPPORTED_MEDIA_TYPE');
    expect(images.uploadImage).not.toHaveBeenCalled();
  });

  it('TC-TEMPLE-09 refuses to go beyond 12 images', async () => {
    const twelve = Array.from({ length: 12 }, (_, i) => ({
      url: `https://res.cloudinary.com/x/${i}.jpg`,
      publicId: `x/${i}`,
      alt: 'x',
      order: i,
      isPrimary: i === 0,
    }));
    const t = await makeTemple({ status: 'draft', images: twelve });
    const res = await agent.post(`${base}/${t.id}/images`).attach('files', PNG_1X1, 'c.png');
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('IMAGE_LIMIT');
  });

  it('rejects files over 5 MB with 413', async () => {
    const t = await draftTemple();
    const big = Buffer.concat([PNG_1X1, Buffer.alloc(5 * 1024 * 1024 + 1)]);
    const res = await agent.post(`${base}/${t.id}/images`).attach('files', big, 'big.png');
    expect(res.status).toBe(413);
  });

  it('keeps successful uploads when one file fails at the storage provider', async () => {
    const t = await draftTemple();
    images.failNext = 1;
    const res = await agent
      .post(`${base}/${t.id}/images`)
      .attach('files', PNG_1X1, 'fails.png')
      .attach('files', PNG_1X1, 'works.png');
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.failed).toEqual([
      { name: 'fails.png', reason: 'Upload to image storage failed' },
    ]);
  });

  it('edits alt, order and primary; exactly one primary remains', async () => {
    const t = await draftTemple();
    const up = await agent
      .post(`${base}/${t.id}/images`)
      .attach('files', PNG_1X1, 'a.png')
      .attach('files', PNG_1X1, 'b.png');
    const [first, second] = up.body.data;
    const res = await agent.patch(`${base}/${t.id}/images`).send({
      images: [
        { publicId: second.publicId, order: 0, isPrimary: true, alt: 'Now first' },
        { publicId: first.publicId, order: 1 },
      ],
    });
    expect(res.body.data.map((i) => [i.publicId, i.isPrimary, i.alt])).toEqual([
      [second.publicId, true, 'Now first'],
      [first.publicId, false, ''],
    ]);
    const bad = await agent
      .patch(`${base}/${t.id}/images`)
      .send({ images: [{ publicId: 'nope', alt: 'x' }] });
    expect(bad.status).toBe(422);
  });

  it('deletes app-managed images from storage but only unlinks seeded originals', async () => {
    const t = await makeTemple({
      status: 'draft',
      images: [
        {
          url: 'https://res.cloudinary.com/x/o.jpg',
          publicId: 'BhaktiYatra/kedar2',
          alt: 'a',
          order: 0,
          isPrimary: true,
        },
        {
          url: 'https://res.cloudinary.com/x/m.jpg',
          publicId: 'bhaktiyatra/dev/temples/x/m1',
          alt: 'b',
          order: 1,
        },
      ],
    });
    await agent.delete(`${base}/${t.id}/images`).query({ publicId: 'BhaktiYatra/kedar2' });
    await agent
      .delete(`${base}/${t.id}/images`)
      .query({ publicId: 'bhaktiyatra/dev/temples/x/m1' });
    expect(images.destroy).toHaveBeenCalledTimes(1);
    expect(images.destroy).toHaveBeenCalledWith('bhaktiyatra/dev/temples/x/m1');
    expect((await Temple.findById(t.id)).images).toHaveLength(0);
  });

  it('keeps at least one image on a published temple', async () => {
    const t = await makeTemple();
    const res = await agent
      .delete(`${base}/${t.id}/images`)
      .query({ publicId: t.images[0].publicId });
    expect(res.status).toBe(409);
  });

  it('answers 503 when image storage is not configured', async () => {
    ({ app } = buildTestApp(
      {},
      { providers: { images: createFakeImages({ enabled: false }), frontend } },
    ));
    const admin2 = await makeAdmin({ email: 'admin2@example.com' });
    const a2 = request.agent(app);
    await loginAgent(a2, admin2.email);
    const t = await draftTemple();
    const res = await a2.post(`${base}/${t.id}/images`).attach('files', PNG_1X1, 'a.png');
    expect(res.status).toBe(503);
  });
});

describe('admin list and options', () => {
  it('searches across statuses and returns list items', async () => {
    await makeTemple({ name: 'Somnath Temple', city: 'Veraval', status: 'draft' });
    await makeTemple({ name: 'Kedarnath Temple' });
    const res = await agent.get(base).query({ q: 'veraval' });
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      name: 'Somnath Temple',
      status: 'draft',
      imageCount: 1,
    });
    const drafts = await agent.get(base).query({ status: 'draft' });
    expect(drafts.body.meta.total).toBe(1);
  });

  it('exposes picker options', async () => {
    const res = await agent.get(`${base}/options`);
    expect(res.body.data.states).toContain('Uttarakhand');
    expect(res.body.data.deities).toContain('Shiva');
    expect(res.body.data.maxImages).toBe(12);
  });
});
