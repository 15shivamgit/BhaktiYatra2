import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Temple } from '../../src/models/Temple.js';
import { fromLatLng } from '../../src/models/shared.js';
import { publishProblems } from '../../src/modules/temples/temples.admin.service.js';
import { createTempleSchema } from '../../src/modules/temples/temples.schemas.js';
import { CIRCUITS, TEMPLES } from '../../scripts/data/temples.data.js';

const manifest = JSON.parse(
  readFileSync(new URL('../../scripts/data/cloudinary-images.json', import.meta.url), 'utf8'),
);
const knownImages = new Set(
  [...manifest.temple, ...manifest.needsReview, ...manifest.brand].map((i) => i.publicId),
);

describe('launch content (scripts/data/temples.data.js)', () => {
  it('has unique slugs and at least ten temples and three circuits', () => {
    const slugs = TEMPLES.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(TEMPLES.length).toBeGreaterThanOrEqual(10);
    expect(CIRCUITS.length).toBeGreaterThanOrEqual(3);
  });

  it.each(TEMPLES.map((t) => [t.slug, t]))(
    '%s passes the admin schema and publish rules',
    (_slug, entry) => {
      const { images, ...input } = entry;
      const parsed = createTempleSchema.body.safeParse(input);
      expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);

      for (const [publicId, alt] of images) {
        expect(knownImages.has(publicId), `${publicId} missing from manifest`).toBe(true);
        expect(alt.trim().length).toBeGreaterThan(10);
      }

      const doc = new Temple({
        ...parsed.data,
        location: fromLatLng(parsed.data.location),
        images: images.map(([publicId, alt], i) => ({
          url: `https://x/${publicId}`,
          publicId,
          alt,
          order: i,
          isPrimary: i === 0,
        })),
      });
      expect(publishProblems(doc)).toEqual([]);
      expect(doc.validateSync()).toBeUndefined();
    },
  );

  it('places every temple inside India', () => {
    for (const { slug, location } of TEMPLES) {
      expect(location.lat, slug).toBeGreaterThan(6);
      expect(location.lat, slug).toBeLessThan(37.5);
      expect(location.lng, slug).toBeGreaterThan(68);
      expect(location.lng, slug).toBeLessThan(97.5);
    }
  });

  it('circuits reference existing temples, without repeats, and have known images', () => {
    const slugs = new Set(TEMPLES.map((t) => t.slug));
    for (const circuit of CIRCUITS) {
      expect(new Set(circuit.temples).size, circuit.slug).toBe(circuit.temples.length);
      for (const slug of circuit.temples)
        expect(slugs.has(slug), `${circuit.slug} → ${slug}`).toBe(true);
      expect(circuit.temples.length).toBeGreaterThanOrEqual(2);
      if (circuit.image) expect(knownImages.has(circuit.image[0])).toBe(true);
    }
    expect(CIRCUITS.find((c) => c.slug === '12-jyotirlingas').temples).toHaveLength(12);
  });
});
