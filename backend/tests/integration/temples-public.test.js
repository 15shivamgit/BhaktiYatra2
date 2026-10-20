import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SlugRedirect } from '../../src/models/SlugRedirect.js';
import { Temple } from '../../src/models/Temple.js';
import { makeCircuit, makeTemple, pointNorth } from '../helpers/content-factories.js';
import { buildTestApp, clearTestDb, connectTestDb, disconnectTestDb } from '../helpers/test-app.js';

const { app } = buildTestApp();
const api = (path = '') => `/api/v1/temples${path}`;

beforeAll(() => connectTestDb());
afterAll(() => disconnectTestDb());
beforeEach(() => clearTestDb());

describe('GET /temples', () => {
  it('TC-TEMPLE-01 lists only published temples, as cards without internal fields', async () => {
    await makeTemple({ name: 'Visible', notes: 'internal source notes' });
    await makeTemple({ name: 'Draft', status: 'draft' });
    await makeTemple({ name: 'Old', status: 'archived' });

    const res = await request(app).get(api());
    expect(res.status).toBe(200);
    expect(res.body.data.map((t) => t.name)).toEqual(['Visible']);
    expect(res.body.meta).toMatchObject({ page: 1, total: 1 });
    const card = res.body.data[0];
    expect(Object.keys(card).sort()).toEqual(
      [
        'city',
        'deity',
        'featured',
        'id',
        'location',
        'name',
        'primaryImage',
        'shortDescription',
        'slug',
        'state',
      ].sort(),
    );
    expect(card.location).toEqual({ lat: 30.1, lng: 78.3 });
    expect(res.headers['cache-control']).toMatch(/public/);
  });

  it('TC-TEMPLE-02 combines state and deity filters', async () => {
    await makeTemple({ name: 'Alpha', state: 'Uttarakhand', deity: 'Shiva' });
    await makeTemple({ name: 'Bravo', state: 'Uttarakhand', deity: 'Vishnu' });
    await makeTemple({ name: 'Charlie', state: 'Gujarat', deity: 'Shiva' });
    const res = await request(app).get(api()).query({ state: 'Uttarakhand', deity: 'Shiva' });
    expect(res.body.data.map((t) => t.name)).toEqual(['Alpha']);
  });

  it('filters by circuit slug and by featured, and paginates', async () => {
    const [a, b] = [
      await makeTemple({ name: 'In A' }),
      await makeTemple({ name: 'In B', featured: true }),
    ];
    await makeTemple({ name: 'Outside' });
    await makeCircuit({ slug: 'char-dham', temples: [a._id, b._id] });

    const inCircuit = await request(app).get(api()).query({ circuit: 'char-dham' });
    expect(inCircuit.body.data.map((t) => t.name).sort()).toEqual(['In A', 'In B']);
    const featured = await request(app).get(api()).query({ featured: 'true' });
    expect(featured.body.data.map((t) => t.name)).toEqual(['In B']);
    const unknown = await request(app).get(api()).query({ circuit: 'nope' });
    expect(unknown.body.data).toEqual([]);

    const page2 = await request(app).get(api()).query({ limit: 2, page: 2 });
    expect(page2.body.data).toHaveLength(1);
    expect(page2.body.meta).toMatchObject({ page: 2, limit: 2, total: 3, totalPages: 2 });
  });

  it('TC-TEMPLE-03 ranks a name match above a description match', async () => {
    await makeTemple({
      name: 'Riverside Shrine',
      shortDescription: 'Pilgrims bathe in the Ganga here before darshan.',
    });
    await makeTemple({ name: 'Ganga Temple', shortDescription: 'A small shrine by the road.' });
    const res = await request(app).get(api()).query({ q: 'ganga' });
    expect(res.body.data.map((t) => t.name)).toEqual(['Ganga Temple', 'Riverside Shrine']);
  });

  it('falls back to partial matching when no whole word matches', async () => {
    await makeTemple({ name: 'Kedarnath Temple', city: 'Rudraprayag' });
    await makeTemple({ name: 'Somnath Temple', city: 'Veraval' });
    const res = await request(app).get(api()).query({ q: 'kedar' });
    expect(res.body.data.map((t) => t.name)).toEqual(['Kedarnath Temple']);
  });

  it('finds temples near a point and inside a map box', async () => {
    await makeTemple({ name: 'Close', location: pointNorth(30, 78, 10) });
    await makeTemple({ name: 'Far', location: pointNorth(30, 78, 200) });
    const near = await request(app).get(api()).query({ near: '30,78', radiusKm: 50 });
    expect(near.body.data.map((t) => t.name)).toEqual(['Close']);
    const box = await request(app).get(api()).query({ bbox: '77.5,29.5,78.5,30.5' });
    expect(box.body.data.map((t) => t.name)).toEqual(['Close']);
  });

  it('rejects malformed geo parameters', async () => {
    expect((await request(app).get(api()).query({ near: 'x,y' })).status).toBe(422);
    expect((await request(app).get(api()).query({ bbox: '1,2,0,3' })).status).toBe(422);
  });
});

describe('GET /temples/filters', () => {
  it('counts published temples by state, deity and circuit', async () => {
    const a = await makeTemple({ state: 'Uttarakhand', deity: 'Shiva' });
    await makeTemple({ state: 'Uttarakhand', deity: 'Vishnu' });
    const draft = await makeTemple({ state: 'Gujarat', status: 'draft' });
    await makeCircuit({ slug: 'panch-kedar', name: 'Panch Kedar', temples: [a._id, draft._id] });

    const res = await request(app).get(api('/filters'));
    expect(res.body.data.states).toEqual([{ value: 'Uttarakhand', count: 2 }]);
    expect(res.body.data.deities).toEqual(
      expect.arrayContaining([
        { value: 'Shiva', count: 1 },
        { value: 'Vishnu', count: 1 },
      ]),
    );
    expect(res.body.data.circuits).toEqual([
      { slug: 'panch-kedar', name: 'Panch Kedar', count: 1 },
    ]);
  });
});

describe('GET /temples/:slug', () => {
  it('returns the public detail with circuits and nearby temples, never internal notes', async () => {
    const main = await makeTemple({
      slug: 'main-temple',
      notes: 'secret notes',
      location: pointNorth(30, 78, 0),
    });
    await makeTemple({ name: 'Near One', location: pointNorth(30, 78, 10) });
    await makeCircuit({ slug: 'loop', name: 'Loop', temples: [main._id] });
    await makeCircuit({ slug: 'hidden', name: 'Hidden', status: 'draft', temples: [main._id] });

    const res = await request(app).get(api('/main-temple'));
    expect(res.status).toBe(200);
    const t = res.body.data;
    expect(t.slug).toBe('main-temple');
    expect(t.circuits).toEqual([{ id: expect.any(String), slug: 'loop', name: 'Loop' }]);
    expect(t.nearby.map((n) => n.name)).toEqual(['Near One']);
    expect(t.nearby[0].distanceKm).toBeCloseTo(10, 0);
    expect(t.tours).toEqual([]);
    expect(JSON.stringify(t)).not.toMatch(/secret notes|"status"|viewCount|createdBy/);
  });

  it('is 404 for drafts and unknown slugs', async () => {
    await makeTemple({ slug: 'draft-one', status: 'draft' });
    expect((await request(app).get(api('/draft-one'))).status).toBe(404);
    expect((await request(app).get(api('/nope'))).status).toBe(404);
  });

  it('answers 301 with the new slug for a renamed temple', async () => {
    await makeTemple({ slug: 'new-name' });
    await SlugRedirect.create({ entityType: 'temple', fromSlug: 'old-name', toSlug: 'new-name' });
    const res = await request(app).get(api('/old-name')).redirects(0);
    expect(res.status).toBe(301);
    expect(res.headers.location).toBe('/api/v1/temples/new-name');
    expect(res.body.data.redirect).toEqual({ slug: 'new-name' });
  });
});

describe('nearby, views and sitemap', () => {
  it('TC-TEMPLE-04 orders nearby temples by distance within the radius', async () => {
    await makeTemple({ slug: 'centre', location: pointNorth(30, 78, 0) });
    await makeTemple({ name: '60 km', location: pointNorth(30, 78, 60) });
    await makeTemple({ name: '20 km', location: pointNorth(30, 78, 20) });
    await makeTemple({ name: '150 km', location: pointNorth(30, 78, 150) });
    await makeTemple({ name: 'draft 5 km', status: 'draft', location: pointNorth(30, 78, 5) });

    const res = await request(app).get(api('/centre/nearby'));
    expect(res.body.data.map((t) => t.name)).toEqual(['20 km', '60 km']);
    const wide = await request(app).get(api('/centre/nearby')).query({ radiusKm: 200, limit: 1 });
    expect(wide.body.data.map((t) => t.name)).toEqual(['20 km']);
  });

  it('counts page views for published temples only', async () => {
    const t = await makeTemple({ slug: 'counted' });
    await makeTemple({ slug: 'not-counted', status: 'draft' });
    expect((await request(app).post(api('/counted/views'))).status).toBe(204);
    expect((await request(app).post(api('/not-counted/views'))).status).toBe(204);
    expect((await Temple.findById(t._id)).viewCount).toBe(1);
    expect((await Temple.findOne({ slug: 'not-counted' })).viewCount).toBe(0);
  });

  it('lists published temple and circuit slugs for the sitemap', async () => {
    await makeTemple({ slug: 'in-sitemap' });
    await makeTemple({ slug: 'not-in-sitemap', status: 'draft' });
    await makeCircuit({ slug: 'route' });
    const res = await request(app).get('/api/v1/sitemap');
    expect(res.body.data.temples.map((t) => t.slug)).toEqual(['in-sitemap']);
    expect(res.body.data.circuits.map((c) => c.slug)).toEqual(['route']);
  });
});
