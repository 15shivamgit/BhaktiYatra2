/** @type {import('next').NextConfig} */
const nextConfig = {
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
