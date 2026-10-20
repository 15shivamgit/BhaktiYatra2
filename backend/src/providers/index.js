import { createCloudinaryProvider } from './cloudinary.provider.js';
import { createFrontendProvider } from './frontend.provider.js';
import { createGoogleProvider } from './google.provider.js';
import { createPaymentsProvider } from './payments.provider.js';

/**
 * Build the external-service clients from configuration. Tests replace any of them with fakes.
 * @param {import('../config/env.js').Env} env
 */
export function createProviders(env) {
  return {
    google: createGoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      redirectUri: env.GOOGLE_REDIRECT_URI ?? `${env.SITE_URL}/api/auth/callback/google`,
    }),
    images: createCloudinaryProvider({
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
      apiSecret: env.CLOUDINARY_API_SECRET,
    }),
    frontend: createFrontendProvider({ siteUrl: env.SITE_URL, secret: env.REVALIDATE_SECRET }),
    payments: createPaymentsProvider({
      provider: env.PAYMENTS_PROVIDER,
      nodeEnv: env.NODE_ENV,
      keyId: env.RAZORPAY_KEY_ID,
    }),
  };
}

/** @typedef {ReturnType<typeof createProviders>} Providers */
