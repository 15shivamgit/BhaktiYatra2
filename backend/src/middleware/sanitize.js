/**
 * Remove object keys that MongoDB treats as operators or paths ("$gt", "a.b") from
 * request bodies. Zod schemas reject most of these anyway; this is defence in depth.
 * Express 5's simple query parser never builds nested objects, so req.query is safe.
 */
function stripOperatorKeys(value) {
  if (Array.isArray(value)) return value.map(stripOperatorKeys);
  if (value === null || typeof value !== 'object') return value;
  const clean = {};
  for (const [key, child] of Object.entries(value)) {
    if (key.startsWith('$') || key.includes('.')) continue;
    clean[key] = stripOperatorKeys(child);
  }
  return clean;
}

export function sanitizeBody() {
  return (req, _res, next) => {
    if (req.body && typeof req.body === 'object') req.body = stripOperatorKeys(req.body);
    next();
  };
}

export { stripOperatorKeys };
