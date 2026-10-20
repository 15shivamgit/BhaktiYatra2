import { PUBLIC_API_BASE_URL } from '@/lib/config';
import { networkError, parseResponse } from './errors';

/**
 * Multipart upload (images). The browser sets the multipart boundary, so no Content-Type here.
 * @param {string} path
 * @param {FormData} formData
 */
export async function apiUpload(path, formData) {
  let res;
  try {
    res = await fetch(`${PUBLIC_API_BASE_URL}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' },
      body: formData,
    });
  } catch (cause) {
    throw networkError(cause);
  }
  return parseResponse(res);
}

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
