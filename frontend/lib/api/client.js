import { PUBLIC_API_BASE_URL } from '@/lib/config';
import { networkError, parseResponse } from './errors';

/**
 * Fetch from the API in Client Components. Always sends the session cookie.
 * @param {string} path e.g. "/auth/me"
 * @param {{ method?: string, body?: unknown, headers?: Record<string, string>, signal?: AbortSignal }} [options]
 */
export async function apiFetch(path, { method = 'GET', body, headers = {}, signal } = {}) {
  let res;
  try {
    res = await fetch(`${PUBLIC_API_BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (cause) {
    throw networkError(cause);
  }
  return parseResponse(res);
}
