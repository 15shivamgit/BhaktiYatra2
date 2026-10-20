import messages from '@/messages/en.json';

/**
 * Look up a UI string by dotted key and fill `{placeholders}`.
 * A tiny stand-in for next-intl (ADR-012); returns the key itself when missing so gaps are visible.
 * @param {string} key e.g. "nav.temples"
 * @param {Record<string, string | number>} [values]
 * @returns {string}
 */
export function t(key, values) {
  const template = key.split('.').reduce((node, part) => node?.[part], messages);
  if (typeof template !== 'string') return key;
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    name in values ? String(values[name]) : match,
  );
}
