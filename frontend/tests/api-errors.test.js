import { describe, expect, it } from 'vitest';
import { ApiError, networkError, parseResponse, toApiError } from '@/lib/api/errors';

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('API error normalisation', () => {
  it('maps the error envelope onto ApiError', () => {
    const error = toApiError(409, {
      success: false,
      code: 'SEATS_UNAVAILABLE',
      message: 'Only 2 seats left',
      details: { seatsAvailable: 2 },
      requestId: 'req-1',
    });
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 409,
      code: 'SEATS_UNAVAILABLE',
      message: 'Only 2 seats left',
      details: { seatsAvailable: 2 },
      requestId: 'req-1',
    });
  });

  it('falls back to HTTP_<status> for non-JSON bodies', () => {
    const error = toApiError(502, null);
    expect(error.code).toBe('HTTP_502');
    expect(error.message).toMatch(/502/);
  });

  it('parseResponse returns the envelope on success', async () => {
    await expect(parseResponse(json(200, { success: true, data: { ok: 1 } }))).resolves.toEqual({
      success: true,
      data: { ok: 1 },
    });
  });

  it('parseResponse throws ApiError on error status', async () => {
    await expect(
      parseResponse(json(503, { success: false, code: 'SERVICE_UNAVAILABLE', message: 'down' })),
    ).rejects.toMatchObject({ status: 503, code: 'SERVICE_UNAVAILABLE' });
  });

  it('parseResponse handles 204 and invalid JSON', async () => {
    await expect(parseResponse(new Response(null, { status: 204 }))).resolves.toBeNull();
    await expect(parseResponse(new Response('<html>', { status: 500 }))).rejects.toMatchObject({
      code: 'HTTP_500',
    });
  });

  it('networkError has status 0 and keeps the cause', () => {
    const cause = new TypeError('fetch failed');
    const error = networkError(cause);
    expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
    expect(error.cause).toBe(cause);
  });
});
