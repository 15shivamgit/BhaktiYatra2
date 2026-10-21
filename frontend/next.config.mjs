const isDev = process.env.NODE_ENV === 'development';
const publicApi = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1';
// A relative base ("/api/v1") means the browser talks to the API through this site's own
// rewrite below, so no extra origin is needed in the policy.
const apiOrigin = publicApi.startsWith('/') ? '' : new URL(publicApi).origin;
const https = (process.env.NEXT_PUBLIC_SITE_URL ?? '').startsWith('https://');
const staging = process.env.NEXT_PUBLIC_ENV === 'staging';
/**
 * Deployed without a shared domain (ADR-036): the API lives on another site, so the browser
 * calls /api/v1 here and Vercel forwards it. Cookies then belong to this site (first-party).
 */
const apiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/+$/, '');

/**
 * Content Security Policy (docs/02-architecture/04-security.md §5). No nonces: they would force
 * every page to render per request and lose static caching, so inline scripts stay allowed and
 * every other source is listed. Razorpay Checkout loads its script and opens its own frames.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://checkout.razorpay.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://*.tile.openstreetmap.org https://lh3.googleusercontent.com",
  "font-src 'self'",
  ['connect-src', "'self'", apiOrigin, 'https://*.razorpay.com'].filter(Boolean).join(' '),
  'frame-src https://api.razorpay.com https://checkout.razorpay.com',
  "object-src 'none'",
  "base-uri 'self'",
  ['form-action', "'self'", apiOrigin].filter(Boolean).join(' '),
  "frame-ancestors 'none'",
  ...(https ? ['upgrade-insecure-requests'] : []),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(self)',
  },
  ...(https
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]
    : []),
  // Staging must never appear in search results (robots.txt also disallows everything).
  ...(staging ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async rewrites() {
    return apiProxyTarget
      ? [{ source: '/api/v1/:path*', destination: `${apiProxyTarget}/api/v1/:path*` }]
      : [];
  },
  // Next 16 defaults: data is dynamic unless cached with 'use cache' (docs/02-architecture, ADR-022).
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Public content: refresh in the background every 5 minutes; the API also invalidates the
  // "content" tag on publish (lib/api/content.js).
  cacheLife: {
    content: { stale: 300, revalidate: 300, expire: 86_400 },
  },
  images: {
    // Cloudinary does the resizing; see lib/cloudinary-loader.js.
    loader: 'custom',
    loaderFile: './lib/cloudinary-loader.js',
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google profile photos
    ],
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
