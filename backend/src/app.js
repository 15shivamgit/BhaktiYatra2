import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { API_PREFIX } from './config/constants.js';
import { errorHandler, notFound } from './middleware/error-handler.js';
import { createRateLimiter } from './middleware/rate-limit.js';
import { requestId } from './middleware/request-id.js';
import { sanitizeBody } from './middleware/sanitize.js';
import { requireTrustedOrigin } from './middleware/trusted-origin.js';
import { createProviders } from './providers/index.js';
import { razorpayWebhookRouter } from './modules/payments/payments.routes.js';
import { apiRouter } from './routes.js';

/**
 * Build the Express application without starting a server, so tests can use it directly.
 * `providers` overrides individual external-service clients (tests pass fakes).
 * @param {{ env: import('./config/env.js').Env, logger: import('pino').Logger,
 *   providers?: Partial<import('./providers/index.js').Providers> }} deps
 */
export function createApp({ env, logger, providers: overrides = {} }) {
  const providers = { ...createProviders(env), ...overrides };
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1); // Render and similar hosts sit behind one proxy hop.
  app.set('query parser', 'simple'); // No nested query objects, so no operator injection via query.

  app.use(requestId());
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.id,
      autoLogging: { ignore: (req) => req.url.startsWith(`${API_PREFIX}/health`) },
      customProps: (req) => ({ requestId: req.id }),
    }),
  );
  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URLS,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Idempotency-Key', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id'],
      maxAge: 600,
    }),
  );
  // Razorpay webhooks need the untouched body for the signature, carry no browser Origin and
  // have their own (higher) rate limit, so they are mounted before the global limiter, the
  // origin check and express.json().
  app.use(`${API_PREFIX}/webhooks/razorpay`, razorpayWebhookRouter({ env, logger, providers }));

  app.use(
    createRateLimiter({
      enabled: env.RATE_LIMIT_ENABLED,
      windowMs: env.RATE_LIMIT_GLOBAL_WINDOW_MIN * 60_000,
      limit: env.RATE_LIMIT_GLOBAL_MAX,
    }),
  );

  app.use(requireTrustedOrigin(env.FRONTEND_URLS));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(sanitizeBody());

  app.use(API_PREFIX, apiRouter({ env, logger, providers }));

  app.use(notFound());
  app.use(errorHandler(logger));

  return app;
}
