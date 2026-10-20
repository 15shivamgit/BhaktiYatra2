import pino from 'pino';

/** Paths that must never reach logs. */
export const REDACT_PATHS = [
  'req.headers.cookie',
  'req.headers.authorization',
  'res.headers["set-cookie"]',
  '*.password',
  '*.newPassword',
  '*.currentPassword',
  '*.passwordHash',
  '*.token',
  '*.secret',
  '*.razorpay_signature',
];

/**
 * @param {{ level: string, pretty?: boolean }} options
 * @returns {import('pino').Logger}
 */
export function createLogger({ level, pretty = false }) {
  return pino({
    level,
    redact: { paths: REDACT_PATHS, censor: '[redacted]' },
    base: undefined,
    timestamp: pino.stdTimeFunctions.isoTime,
    ...(pretty && {
      transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } },
    }),
  });
}
