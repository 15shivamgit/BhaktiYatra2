/**
 * Block all crawling until public pages exist (Phase 3 replaces this with the real rules
 * from docs/07-content/04-seo.md).
 */
export default function robots() {
  return { rules: { userAgent: '*', disallow: '/' } };
}
