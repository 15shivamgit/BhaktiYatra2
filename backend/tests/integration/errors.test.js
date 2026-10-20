import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createLogger } from '../../src/config/logger.js';
import { errorHandler, notFound } from '../../src/middleware/error-handler.js';
import { requestId } from '../../src/middleware/request-id.js';
import { sanitizeBody } from '../../src/middleware/sanitize.js';
import { validate } from '../../src/middleware/validate.js';
import { buildTestApp } from '../helpers/test-app.js';

/** Minimal app exercising the shared middleware chain with throwaway routes. */
function middlewareApp() {
  const app = express();
  app.use(requestId());
  app.use(express.json({ limit: '1kb' }));
  app.use(sanitizeBody());
  app.post(
    '/echo/:id',
    validate({
      params: z.object({ id: z.string().regex(/^\d+$/, 'must be numeric') }),
      query: z.object({ page: z.coerce.number().int().min(1).default(1) }),
      body: z.object({ name: z.string().min(2), age: z.number().int().min(1) }).strict(),
    }),
    (req, res) => res.json({ success: true, data: req.valid }),
  );
  app.post('/raw', (req, res) => res.json({ body: req.body }));
  app.get('/boom', () => {
    throw new Error('secret internal detail');
  });
  app.get('/boom-async', async () => {
    throw new Error('async internal detail');
  });
  app.get('/mongo-duplicate', () => {
    throw Object.assign(
      new Error('E11000 duplicate key error collection: prod.users index: email_1 dup key'),
      { name: 'MongoServerError', code: 11000, keyPattern: { email: 1 } },
    );
  });
  app.get('/mongo-network', () => {
    throw Object.assign(new Error('connection <monitor> to 10.0.0.5:27017 closed'), {
      name: 'MongoNetworkError',
    });
  });
  app.use(notFound());
  app.use(errorHandler(createLogger({ level: 'silent' })));
  return app;
}

describe('error envelope and shared middleware', () => {
  const app = middlewareApp();

  it('unknown API route returns 404 NOT_FOUND envelope', async () => {
    const { app: realApp } = buildTestApp();
    const res = await request(realApp).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, code: 'NOT_FOUND' });
    expect(res.body.requestId).toBeTruthy();
  });

  it('validation failure returns 422 with field-level details', async () => {
    const res = await request(app).post('/echo/abc').send({ name: 'A', age: 0, extra: true });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    const paths = res.body.details.map((d) => d.path);
    expect(paths).toEqual(expect.arrayContaining(['params.id', 'body.name', 'body.age']));
    expect(res.body.details.some((d) => d.message.toLowerCase().includes('unrecognized'))).toBe(
      true,
    );
  });

  it('valid request exposes parsed values on req.valid with coercion and defaults', async () => {
    const res = await request(app).post('/echo/42?page=3').send({ name: 'Sunita', age: 58 });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      params: { id: '42' },
      query: { page: 3 },
      body: { name: 'Sunita', age: 58 },
    });
  });

  it('malformed JSON returns 400 BAD_REQUEST', async () => {
    const res = await request(app)
      .post('/raw')
      .set('Content-Type', 'application/json')
      .send('{"name":');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
  });

  it('oversized body returns 413 PAYLOAD_TOO_LARGE', async () => {
    const res = await request(app)
      .post('/raw')
      .send({ text: 'x'.repeat(2000) });
    expect(res.status).toBe(413);
    expect(res.body.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('TC-SEC-04 unexpected and database errors never leak stack traces or Mongo text', async () => {
    for (const path of ['/boom', '/boom-async', '/mongo-network']) {
      const res = await request(app).get(path);
      expect(res.status).toBe(500);
      expect(res.body.code).toBe('INTERNAL_ERROR');
      expect(JSON.stringify(res.body)).not.toMatch(/internal detail|stack|27017|monitor/i);
    }
    const dup = await request(app).get('/mongo-duplicate');
    expect(dup.status).toBe(409);
    expect(dup.body.message).toBe('A record with this email already exists');
    expect(JSON.stringify(dup.body)).not.toMatch(/E11000|prod\.users|index/);
  });

  it('strips Mongo operator keys from bodies', async () => {
    const res = await request(app)
      .post('/raw')
      .send({ email: { $gt: '' }, 'a.b': 1, nested: [{ $where: 'x', ok: 1 }] });
    expect(res.body.body).toEqual({ email: {}, nested: [{ ok: 1 }] });
  });

  it('echoes a safe incoming X-Request-Id and replaces an unsafe one', async () => {
    const safe = await request(app).get('/nope').set('X-Request-Id', 'abc-123');
    expect(safe.headers['x-request-id']).toBe('abc-123');
    const unsafe = await request(app).get('/nope').set('X-Request-Id', 'bad id<script>');
    expect(unsafe.headers['x-request-id']).not.toBe('bad id<script>');
  });
});
