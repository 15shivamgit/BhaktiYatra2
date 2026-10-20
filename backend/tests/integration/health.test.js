import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildTestApp, connectTestDb, disconnectTestDb } from '../helpers/test-app.js';

describe('GET /api/v1/health', () => {
  describe('with the database connected', () => {
    const { app } = buildTestApp({ APP_VERSION: '9.9.9' });
    beforeAll(() => connectTestDb());
    afterAll(() => disconnectTestDb());

    it('returns 200 with db up and the app version', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        data: { status: 'ok', db: 'up', version: '9.9.9' },
      });
      expect(typeof res.body.data.uptimeSec).toBe('number');
      expect(res.headers['cache-control']).toBe('no-store');
      expect(res.headers['x-request-id']).toBeTruthy();
    });
  });

  describe('with the database disconnected', () => {
    const { app } = buildTestApp();

    it('returns 503 SERVICE_UNAVAILABLE with db down', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(503);
      expect(res.body).toMatchObject({
        success: false,
        code: 'SERVICE_UNAVAILABLE',
        details: { db: 'down', status: 'degraded' },
      });
      expect(res.body.requestId).toBeTruthy();
    });
  });
});
