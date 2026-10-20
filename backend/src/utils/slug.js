import slugifyLib from 'slugify';

/**
 * URL-safe slug: lowercase ASCII letters, digits and single hyphens.
 * @param {string} value
 */
export function slugify(value) {
  // Decompose accented letters (ṅ → n + combining dot) and drop the marks first, so Sanskrit
  // transliterations such as "Raṅganātha" keep every base letter.
  const plain = String(value).normalize('NFKD').replace(/\p{M}/gu, '');
  return slugifyLib(plain, { lower: true, strict: true, trim: true })
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * First free slug: `base`, then `base-2`, `base-3`, …
 * @param {string} base
 * @param {(slug: string) => Promise<boolean>} isTaken
 */
export async function uniqueSlug(base, isTaken) {
  const root = base || 'item';
  if (!(await isTaken(root))) return root;
  for (let n = 2; n < 1000; n += 1) {
    const candidate = `${root}-${n}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  throw new Error(`Could not find a free slug for ${root}`);
}
