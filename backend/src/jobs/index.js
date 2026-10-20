import { expireHolds, reconcileInventory } from '../modules/bookings/bookings.service.js';
import { processEmailQueue } from '../modules/notifications/mailer.service.js';
import { reconcilePayments } from '../modules/payments/razorpay.service.js';
import { completeDepartures } from '../modules/tours/departures.service.js';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

/**
 * In-process jobs (docs/03-database/03-indexes-constraints.md "Jobs"). Each job only calls a
 * service. A job runs once shortly after start-up and then on its interval; a run that is still
 * going is never started again in parallel. Single API instance assumed (ADR-030).
 */
export const JOBS = Object.freeze([
  { name: 'expire-holds', everyMs: MINUTE_MS, run: () => expireHolds() },
  { name: 'send-emails', everyMs: MINUTE_MS, run: (ctx) => processEmailQueue(ctx) },
  { name: 'complete-departures', everyMs: HOUR_MS, run: () => completeDepartures() },
  // Catches captured payments whose webhook and verify call were both lost.
  { name: 'reconcile-payments', everyMs: HOUR_MS, run: (ctx) => reconcilePayments(ctx) },
  {
    name: 'reconcile-inventory',
    everyMs: HOUR_MS,
    run: async ({ logger }) => {
      const { checked, mismatches } = await reconcileInventory();
      // Never auto-fixed in v1: an admin checks and runs scripts/reconcile-inventory.js --fix.
      for (const mismatch of mismatches) logger.error(mismatch, 'Inventory mismatch');
      return { checked, mismatches: mismatches.length };
    },
  },
]);

/**
 * @param {{ env?: any, logger: import('pino').Logger, providers?: any }} ctx
 * @param {typeof JOBS} [jobs]
 * @returns {() => void} stop function
 */
export function startJobs(ctx, jobs = JOBS) {
  const { logger } = ctx;
  const timers = [];
  for (const job of jobs) {
    let running = false;
    const tick = async () => {
      if (running) return;
      running = true;
      const started = Date.now();
      try {
        const result = await job.run(ctx);
        logger.info({ job: job.name, ms: Date.now() - started, ...result }, 'Job finished');
      } catch (error) {
        logger.error({ job: job.name, err: error.message }, 'Job failed');
      } finally {
        running = false;
      }
    };
    timers.push(setTimeout(tick, 10_000).unref());
    timers.push(setInterval(tick, job.everyMs).unref());
  }
  logger.info({ jobs: jobs.map((j) => j.name) }, 'Jobs started');
  return () => timers.forEach((timer) => clearInterval(timer));
}
