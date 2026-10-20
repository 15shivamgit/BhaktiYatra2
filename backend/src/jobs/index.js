import { completeDepartures } from '../modules/tours/departures.service.js';

const HOUR_MS = 3_600_000;

/**
 * In-process jobs (docs/03-database/03-indexes-constraints.md "Jobs"). Each job only calls a
 * service. A job runs once shortly after start-up and then on its interval; a run that is still
 * going is never started again in parallel. Single API instance assumed (ADR-030).
 */
export const JOBS = Object.freeze([
  { name: 'complete-departures', everyMs: HOUR_MS, run: () => completeDepartures() },
]);

/**
 * @param {{ logger: import('pino').Logger }} ctx
 * @param {typeof JOBS} [jobs]
 * @returns {() => void} stop function
 */
export function startJobs({ logger }, jobs = JOBS) {
  const timers = [];
  for (const job of jobs) {
    let running = false;
    const tick = async () => {
      if (running) return;
      running = true;
      const started = Date.now();
      try {
        const result = await job.run();
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
