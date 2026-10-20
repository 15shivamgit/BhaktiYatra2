import { pingDb } from '../../config/db.js';

/**
 * Snapshot of process and database health.
 * @param {{ version: string }} options
 */
export async function getHealth({ version }) {
  const dbUp = await pingDb();
  return {
    healthy: dbUp,
    report: {
      status: dbUp ? 'ok' : 'degraded',
      version,
      uptimeSec: Math.round(process.uptime()),
      db: dbUp ? 'up' : 'down',
      time: new Date().toISOString(),
    },
  };
}
