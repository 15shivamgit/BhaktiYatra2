import { SITE_URL } from '@/lib/config';

/** Allow crawling of public pages; staging is never indexed (docs/07-content/04-seo.md). */
export default function robots() {
  if (process.env.NEXT_PUBLIC_ENV === 'staging') {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/account',
        '/api/',
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
      ],
    },
    sitemap: new URL('/sitemap.xml', SITE_URL).toString(),
  };
}
