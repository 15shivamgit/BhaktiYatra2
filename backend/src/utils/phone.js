/**
 * Normalise a phone number to E.164. Ten-digit Indian mobiles (starting 6–9) get +91.
 * @param {string} input
 * @returns {string | null} normalised number, or null when invalid
 */
export function normalizePhone(input) {
  const compact = String(input).replace(/[\s()-]/g, '');
  if (/^[6-9]\d{9}$/.test(compact)) return `+91${compact}`;
  if (/^(\+91|0091|91|0)[6-9]\d{9}$/.test(compact)) return `+91${compact.slice(-10)}`;
  if (/^\+[1-9]\d{7,14}$/.test(compact)) return compact;
  return null;
}

/** Mask an email for logs: "sunita@example.com" → "s***a@example.com". */
export function maskEmail(email) {
  const [local, domain] = String(email).split('@');
  if (!domain) return '***';
  const masked = local.length <= 2 ? `${local[0] ?? ''}***` : `${local[0]}***${local.at(-1)}`;
  return `${masked}@${domain}`;
}
