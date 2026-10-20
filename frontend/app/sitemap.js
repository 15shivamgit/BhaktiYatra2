import { getSitemapEntries } from '@/lib/api/content';
import { SITE_URL } from '@/lib/config';

const STATIC_PATHS = [
  '/',
  '/temples',
  '/circuits',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/refund-policy',
];

/** sitemap.xml from published content (FR-TEMPLE-10); refreshed with the "content" cache. */
export default async function sitemap() {
  const { temples, circuits } = await getSitemapEntries();
  const url = (path) => new URL(path, SITE_URL).toString();
  return [
    ...STATIC_PATHS.map((path) => ({
      url: url(path),
      changeFrequency: 'weekly',
      priority: path === '/' ? 1 : 0.6,
    })),
    ...circuits.map((c) => ({
      url: url(`/circuits/${c.slug}`),
      lastModified: c.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.7,
    })),
    ...temples.map((t) => ({
      url: url(`/temples/${t.slug}`),
      lastModified: t.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.8,
    })),
  ];
}
