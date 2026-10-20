import { createCloudinaryProvider } from './cloudinary.provider.js';
import { createFrontendProvider } from './frontend.provider.js';
import { createGoogleProvider } from './google.provider.js';
import { createMailProvider } from './mail.provider.js';
import { createPaymentsProvider } from './payments.provider.js';

/**
 * Build the external-service clients from configuration. Tests replace any of them with fakes.
 * @param {import('../config/env.js').Env} env
 */
export function createProviders(env, logger) {
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
    mail: createMailProvider({
      provider: env.MAIL_PROVIDER,
      apiKey: env.RESEND_API_KEY,
      from: env.MAIL_FROM,
      replyTo: env.MAIL_REPLY_TO,
      logger,
    }),
    payments: createPaymentsProvider({
      provider: env.PAYMENTS_PROVIDER,
      nodeEnv: env.NODE_ENV,
      keyId: env.RAZORPAY_KEY_ID,
      keySecret: env.RAZORPAY_KEY_SECRET,
      webhookSecret: env.RAZORPAY_WEBHOOK_SECRET,
    }),
  };
}

/** @typedef {ReturnType<typeof createProviders>} Providers */
