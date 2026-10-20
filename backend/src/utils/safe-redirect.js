/**
 * Accept only same-site relative paths for post-login redirects, so `next` can never send a
 * user to another origin (open-redirect protection). Anything else becomes "/".
 * @param {unknown} next
 * @returns {string}
 */
export function safeNextPath(next) {
  if (typeof next !== 'string' || next.length === 0 || next.length > 512) return '/';
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/';
  if (/[\r\n\t\\]/.test(next)) return '/';
  return next;
}
