/**
 * Same rule as the API's safeNextPath: only same-site relative paths are allowed as
 * post-login destinations. Anything else falls back to the given default.
 * @param {unknown} next
 * @param {string} [fallback]
 */
export function safeNext(next, fallback = '/') {
  if (typeof next !== 'string' || next.length === 0 || next.length > 512) return fallback;
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  if (/[\r\n\t\\]/.test(next)) return fallback;
  return next;
}

/** Login URL that returns the user to `path` afterwards. */
export function loginUrl(path) {
  const next = safeNext(path, '');
  return next && next !== '/' ? `/login?next=${encodeURIComponent(next)}` : '/login';
}
