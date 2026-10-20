import { describe, expect, it } from 'vitest';
import {
  applyImageEdits,
  isManagedAsset,
  normaliseImages,
} from '../../src/modules/content/images.service.js';
import { sanitizeRichText, textLength } from '../../src/utils/html.js';
import { slugify, uniqueSlug } from '../../src/utils/slug.js';

describe('slugify / uniqueSlug', () => {
  it('produces readable ASCII slugs', () => {
    expect(slugify('Kashi Vishwanath Temple  Varanasi')).toBe('kashi-vishwanath-temple-varanasi');
    expect(slugify('Shri Krishna Janmabhoomi, Mathura!')).toBe('shri-krishna-janmabhoomi-mathura');
    expect(slugify('Śrī Raṅganāthaswāmy')).toBe('sri-ranganathaswamy');
  });

  it('appends -2, -3 when taken', async () => {
    const taken = new Set(['kedarnath', 'kedarnath-2']);
    expect(await uniqueSlug('kedarnath', async (s) => taken.has(s))).toBe('kedarnath-3');
    expect(await uniqueSlug('free', async () => false)).toBe('free');
  });
});

describe('sanitizeRichText', () => {
  it('keeps the allowed formatting and secures links', () => {
    const html = sanitizeRichText(
      '<h2>Title</h2><p><em>a</em> <a href="https://x.example" target="_blank">link</a></p><ul><li>one</li></ul>',
    );
    expect(html).toBe(
      '<h2>Title</h2><p><em>a</em> <a href="https://x.example" target="_blank" rel="noopener noreferrer">link</a></p><ul><li>one</li></ul>',
    );
  });

  it('removes scripts, styles, handlers and non-Cloudinary images', () => {
    const html = sanitizeRichText(
      '<p style="color:red" onmouseover="x()">t</p><script>bad()</script><iframe src="x"></iframe><img src="https://res.cloudinary.com/a/b.jpg" alt="ok"><img src="http://res.cloudinary.com/a/c.jpg">',
    );
    expect(html).toBe('<p>t</p><img src="https://res.cloudinary.com/a/b.jpg" alt="ok" />');
  });

  it('measures visible text length', () => {
    expect(textLength('<p>Hello   <strong>world</strong></p>')).toBe(11);
    expect(textLength(null)).toBe(0);
  });
});

describe('image helpers', () => {
  const img = (id, extra = {}) => ({ url: `u/${id}`, publicId: id, alt: '', order: 0, ...extra });

  it('normalises order and guarantees exactly one primary', () => {
    const out = normaliseImages([img('b', { order: 5 }), img('a', { order: 1 })]);
    expect(out.map((i) => [i.publicId, i.order, i.isPrimary])).toEqual([
      ['a', 0, true],
      ['b', 1, false],
    ]);
  });

  it('moving the primary flag clears it elsewhere; two primaries are rejected', () => {
    const current = [img('a', { order: 0, isPrimary: true }), img('b', { order: 1 })];
    expect(
      applyImageEdits(current, [{ publicId: 'b', isPrimary: true }]).find((i) => i.isPrimary)
        .publicId,
    ).toBe('b');
    expect(() =>
      applyImageEdits(current, [
        { publicId: 'a', isPrimary: true },
        { publicId: 'b', isPrimary: true },
      ]),
    ).toThrow();
  });

  it('only treats assets in the app folder as managed', () => {
    const ctx = { env: { CLOUDINARY_FOLDER: 'bhaktiyatra/dev' } };
    expect(isManagedAsset(ctx, 'bhaktiyatra/dev/temples/x/1')).toBe(true);
    expect(isManagedAsset(ctx, 'BhaktiYatra/kedar2')).toBe(false);
    expect(isManagedAsset(ctx, 'bhaktiyatra/devil/x')).toBe(false);
  });
});
