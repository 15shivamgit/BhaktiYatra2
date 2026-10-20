import { z } from 'zod';

/**
 * Environment schema. Variables needed only by later phases are optional here and are
 * tightened to required in the phase that starts using them (see docs/09-config).
 */
const booleanFromString = z
  .enum(['true', 'false', '1', '0'])
  .transform((value) => value === 'true' || value === '1');

const commaList = z
  .string()
  .min(1)
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.url()).min(1));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  APP_VERSION: z.string().default('0.1.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  MONGO_URL: z
    .string()
    .regex(/^mongodb(\+srv)?:\/\//, 'must start with mongodb:// or mongodb+srv://'),

  FRONTEND_URLS: commaList.default(['http://localhost:3000']),
  SITE_URL: z.url().default('http://localhost:3000'),

  RATE_LIMIT_ENABLED: booleanFromString.default(true),
  RATE_LIMIT_GLOBAL_MAX: z.coerce.number().int().positive().default(300),
  RATE_LIMIT_GLOBAL_WINDOW_MIN: z.coerce.number().int().positive().default(15),
  JOBS_ENABLED: booleanFromString.default(true),

  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_AUTH_WINDOW_MIN: z.coerce.number().int().positive().default(15),
  RATE_LIMIT_CONTACT_MAX: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_CONTACT_WINDOW_MIN: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_BOOKING_MAX: z.coerce.number().int().positive().default(20),
  RATE_LIMIT_BOOKING_WINDOW_MIN: z.coerce.number().int().positive().default(15),

  // Phase 2: authentication
  JWT_SECRET: z.string().min(32, 'must be at least 32 characters'),
  JWT_SECRET_PREVIOUS: z.string().min(32).optional(),
  JWT_EXPIRES_IN_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  COOKIE_DOMAIN: z.string().optional(),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.url().optional(),

  // Phase 3+
  REVALIDATE_SECRET: z.string().min(16).optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default('bhaktiyatra/dev'),

  // Phase 5: bookings (fractional HOLD_MINUTES only make sense in tests)
  HOLD_MINUTES: z.coerce.number().positive().max(60).default(15),
  MAX_SEATS_PER_BOOKING: z.coerce.number().int().min(1).max(10).default(10),

  // Razorpay from Phase 6; `stub` fakes orders for tests and offline development (ADR-031/032)
  PAYMENTS_PROVIDER: z.enum(['razorpay', 'stub']).default('razorpay'),
  RATE_LIMIT_WEBHOOK_MAX: z.coerce.number().int().positive().default(600),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // Phase 7+
  TICKET_SIGNING_SECRET: z.string().min(32).optional(),
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  MAIL_REPLY_TO: z.string().optional(),
  ADMIN_NOTIFY_EMAIL: z.email().optional(),

  SENTRY_DSN: z.string().optional(),
});

/** Thrown when the environment is invalid; carries one readable line per problem. */
export class EnvError extends Error {
  /** @param {string[]} problems */
  constructor(problems) {
    super(`Invalid environment configuration:\n  - ${problems.join('\n  - ')}`);
    this.name = 'EnvError';
    this.problems = problems;
  }
}

/**
 * Parse and validate an environment object.
 * Empty strings are treated as unset so `.env` files can keep blank placeholders.
 * @param {Record<string, string | undefined>} raw
 */
export function parseEnv(raw) {
  const cleaned = Object.fromEntries(
    Object.entries(raw).filter(([, value]) => value !== undefined && value !== ''),
  );
  const result = envSchema.safeParse(cleaned);
  if (!result.success) {
    const problems = result.error.issues.map((issue) => {
      const key = issue.path.join('.') || '(root)';
      // Zod 4 does not echo the input, so "missing" is decided by the key's absence.
      const missing = issue.code === 'invalid_type' && !(issue.path[0] in cleaned);
      return `${key} ${missing ? 'is required' : issue.message}`;
    });
    throw new EnvError(problems);
  }
  const data = result.data;
  const problems = [];
  if (data.NODE_ENV === 'production' && data.PAYMENTS_PROVIDER === 'stub') {
    // The stub confirms bookings without money changing hands; never allow it live.
    problems.push('PAYMENTS_PROVIDER must be razorpay in production');
  }
  // Deployed environments must be able to take payments; locally a missing key only makes
  // booking creation answer "payment is not configured".
  if (data.PAYMENTS_PROVIDER === 'razorpay' && ['production', 'staging'].includes(data.NODE_ENV)) {
    for (const key of ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET']) {
      if (!data[key]) problems.push(`${key} is required in ${data.NODE_ENV}`);
    }
  }
  if (problems.length) throw new EnvError(problems);
  return Object.freeze(result.data);
}

/** @typedef {ReturnType<typeof parseEnv>} Env */
