import 'server-only';
import { serverApiBaseUrl } from '@/lib/config';
import { networkError, parseResponse } from './errors';

/**
 * Fetch from the API inside Server Components. Sends no cookies (public data only).
 * With Cache Components, callers decide caching: wrap in a `'use cache'` function for
 * cached public content, or render inside <Suspense> for request-time data.
 * @param {string} path e.g. "/health"
 * @param {{ timeoutMs?: number }} [options]
 * @returns {Promise<{ success: true, data: any, meta?: any }>}
 */
export async function serverGet(path, { timeoutMs = 5000 } = {}) {
  let res;
  try {
    res = await fetch(`${serverApiBaseUrl()}${path}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (cause) {
    throw networkError(cause);
  }
  return parseResponse(res);
}
