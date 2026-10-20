import { createGoogleProvider } from './google.provider.js';

/**
 * Build the external-service clients from configuration. Tests pass fakes instead.
 * @param {import('../config/env.js').Env} env
 */
export function createProviders(env) {
  return {
    google: createGoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      redirectUri: env.GOOGLE_REDIRECT_URI ?? `${env.SITE_URL}/api/auth/callback/google`,
    }),
  };
}

/** @typedef {ReturnType<typeof createProviders>} Providers */
