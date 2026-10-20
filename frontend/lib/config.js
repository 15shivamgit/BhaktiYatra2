/**
 * Public configuration. Only NEXT_PUBLIC_* values reach the browser; never put secrets here.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/** API base used by the browser (cookie-authenticated calls). */
export const PUBLIC_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1';

/** API base used by Server Components; may point at a private network address in production. */
export function serverApiBaseUrl() {
  return process.env.API_BASE_URL_INTERNAL ?? PUBLIC_API_BASE_URL;
}

/** Home hero photo (owner's Cloudinary upload, viewed and described). */
export const HERO_IMAGE = Object.freeze({
  url: 'https://res.cloudinary.com/hboje2fj/image/upload/v1792477172/kedar1.jpg',
  alt: 'Kedarnath Temple beneath rocky Himalayan slopes, with pilgrims in front',
  width: 4608,
  height: 3456,
});

export const BUSINESS = Object.freeze({
  name: 'BhaktiYatra',
  address: 'Ramdiri-3, Begusarai, Bihar, India 851129',
  phoneDisplay: '+91 74888 81563',
  phoneHref: 'tel:+917488881563',
  email: '15shivambgs@gmail.com',
});

/** Deployment name for the admin badge: "local", "staging" or "production". */
export const APP_ENV =
  process.env.NEXT_PUBLIC_ENV ?? (SITE_URL.includes('localhost') ? 'local' : 'production');
