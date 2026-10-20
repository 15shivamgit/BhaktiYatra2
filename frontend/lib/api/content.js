import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { serverApiBaseUrl } from '@/lib/config';
import { networkError, parseResponse } from './errors';

/*
 * Public content fetchers for Server Components (ADR-022). Each is a 'use cache' function:
 * results are cached about five minutes under the shared "content" tag, which the API
 * invalidates on publish. If the API is unreachable during `next build`, they return an empty
 * fallback so the build still succeeds; at runtime errors are thrown (and never cached) so the
 * route's error boundary can offer a retry.
 */

const IS_BUILD = process.env.NEXT_PHASE === 'phase-production-build';

async function request(path, { redirect = 'follow' } = {}) {
  let res;
  try {
    res = await fetch(`${serverApiBaseUrl()}${path}`, {
      headers: { Accept: 'application/json' },
      redirect,
      signal: AbortSignal.timeout(8000),
    });
  } catch (cause) {
    throw networkError(cause);
  }
  if (res.status === 301 || res.status === 308) {
    const body = await res.json().catch(() => null);
    return { redirectSlug: body?.data?.redirect?.slug ?? null };
  }
  if (res.status === 404) return { notFound: true };
  return parseResponse(res);
}

async function withBuildFallback(fn, fallback) {
  try {
    return await fn();
  } catch (error) {
    if (IS_BUILD) {
      console.warn(`[content] API unavailable during build, using fallback: ${error.message}`);
      return fallback;
    }
    throw error;
  }
}

const query = (params) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : '';
};

/** @param {Record<string, string | number | boolean | undefined>} params */
export async function getTemples(params = {}) {
  'use cache';
  cacheLife('content');
  cacheTag('content', 'temples');
  return withBuildFallback(
    async () => {
      const body = await request(`/temples${query(params)}`);
      return { temples: body.data ?? [], meta: body.meta ?? { page: 1, total: 0, totalPages: 1 } };
    },
    { temples: [], meta: { page: 1, limit: 12, total: 0, totalPages: 1 } },
  );
}

export async function getTempleFilters() {
  'use cache';
  cacheLife('content');
  cacheTag('content', 'temples');
  return withBuildFallback(async () => (await request('/temples/filters')).data, {
    states: [],
    deities: [],
    circuits: [],
  });
}

/**
 * @returns {Promise<{ temple?: any, redirectSlug?: string | null, notFound?: boolean }>}
 */
export async function getTemple(slug) {
  'use cache';
  cacheLife('content');
  cacheTag('content', `temple:${slug}`);
  return withBuildFallback(
    async () => {
      const body = await request(`/temples/${encodeURIComponent(slug)}`, { redirect: 'manual' });
      if (body.redirectSlug !== undefined || body.notFound) return body;
      return { temple: body.data };
    },
    { notFound: true },
  );
}

export async function getCircuits(params = {}) {
  'use cache';
  cacheLife('content');
  cacheTag('content', 'circuits');
  return withBuildFallback(
    async () => {
      const body = await request(`/circuits${query(params)}`);
      return { circuits: body.data ?? [], meta: body.meta };
    },
    { circuits: [], meta: { page: 1, total: 0, totalPages: 1 } },
  );
}

export async function getCircuit(slug) {
  'use cache';
  cacheLife('content');
  cacheTag('content', `circuit:${slug}`);
  return withBuildFallback(
    async () => {
      const body = await request(`/circuits/${encodeURIComponent(slug)}`, { redirect: 'manual' });
      if (body.redirectSlug !== undefined || body.notFound) return body;
      return { circuit: body.data };
    },
    { notFound: true },
  );
}

export async function getSitemapEntries() {
  'use cache';
  cacheLife('content');
  cacheTag('content', 'sitemap');
  return withBuildFallback(async () => (await request('/sitemap')).data, {
    temples: [],
    circuits: [],
  });
}
