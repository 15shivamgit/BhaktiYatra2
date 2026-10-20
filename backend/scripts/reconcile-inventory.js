/**
 * Check seat inventory for active departures (totalSeats = seatsAvailable + held seats).
 *
 *   npm run db:reconcile -w backend                 # report only
 *   npm run db:reconcile -w backend -- --fix --yes  # also set seatsAvailable to the expected value
 *
 * The hourly job only reports; fixing is a deliberate admin action (docs/05-features/04).
 */
import { parseArgs } from 'node:util';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { parseEnv } from '../src/config/env.js';
import { createLogger } from '../src/config/logger.js';
import { reconcileInventory } from '../src/modules/bookings/bookings.service.js';

const out = (line = '') => process.stdout.write(`${line}\n`);

async function main() {
  const { values } = parseArgs({
    options: { fix: { type: 'boolean' }, yes: { type: 'boolean' } },
  });
  if (values.fix && !values.yes) {
    out('Add --yes to confirm: --fix rewrites seatsAvailable on mismatched departures.');
    process.exit(1);
  }
  const env = parseEnv(process.env);
  await connectDb(env.MONGO_URL, createLogger({ level: 'warn' }), { attempts: 2 });
  try {
    const { checked, mismatches } = await reconcileInventory({ fix: Boolean(values.fix) });
    out(`Checked ${checked} active departures; ${mismatches.length} mismatch(es).`);
    for (const m of mismatches) {
      out(
        `  ${m.departureId}: total ${m.totalSeats}, held/booked ${m.committed}, available ${m.seatsAvailable}, expected ${m.expected}${values.fix ? ' → fixed' : ''}`,
      );
    }
    if (mismatches.length && !values.fix) process.exitCode = 2;
  } finally {
    await disconnectDb();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
