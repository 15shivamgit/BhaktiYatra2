import { errorMessage } from '@/lib/api/messages';

/**
 * Content rules the API explains in plain words (for example "This temple is part of a circuit;
 * remove it there first"). Admins see that server text; everything else uses the shared messages.
 */
const EXPLAINED = new Set([
  'HAS_REFERENCES',
  'INVALID_TRANSITION',
  'IMAGE_LIMIT',
  'PUBLISH_PREREQUISITES',
  'SLUG_TAKEN',
  'NOT_FOUND',
]);

/** @param {any} error */
export function adminErrorMessage(error) {
  if (EXPLAINED.has(error?.code) && error.message) return error.message;
  return errorMessage(error);
}

/**
 * Map an API validation path ("body.timings.0.open", "body.location.lat") to a form field name.
 * @param {string} path
 */
export function formFieldFor(path) {
  const field = path.replace(/^body\./, '');
  if (field.startsWith('location')) return 'lat';
  if (field.startsWith('rules')) return 'rulesText';
  if (field.startsWith('tags')) return 'tagsText';
  return field;
}

/**
 * Apply API validation details to the form. Returns details that match no known field so the
 * caller can show them in a general alert.
 * @param {(name: string, error: object, options?: object) => void} setError
 * @param {{ path: string, message: string }[] | undefined} details
 * @param {string[]} topLevelFields keys of the form values
 * @param {(path: string) => string} [mapPath] API path → form field (defaults to the temple form)
 */
export function applyApiErrors(setError, details, topLevelFields, mapPath = formFieldFor) {
  const unmatched = [];
  let first = true;
  for (const detail of details ?? []) {
    const name = mapPath(detail.path);
    if (topLevelFields.includes(name.split('.')[0])) {
      setError(name, { type: 'server', message: detail.message }, { shouldFocus: first });
      first = false;
    } else {
      unmatched.push(detail);
    }
  }
  return unmatched;
}

/**
 * Count field errors per tab so tab labels can show "Basics (2)".
 * @param {Record<string, any>} errors react-hook-form errors object
 * @param {Record<string, string>} fieldTabs field name → tab key
 */
export function errorCountsByTab(errors, fieldTabs) {
  const leaves = (node) => {
    if (!node || typeof node !== 'object') return 0;
    if (typeof node.message === 'string' || node.type) return 1;
    return Object.values(node).reduce((sum, child) => sum + leaves(child), 0);
  };
  const counts = {};
  for (const [field, node] of Object.entries(errors ?? {})) {
    const tab = fieldTabs[field];
    if (tab) counts[tab] = (counts[tab] ?? 0) + leaves(node);
  }
  return counts;
}
