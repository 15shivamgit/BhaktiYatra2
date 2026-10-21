/**
 * Create the sample tours with departures over the next few months (dev and staging only).
 *
 *   npm run seed:sample-tours -w backend
 *
 * Needs the launch temples (npm run seed:content). Tours are upserted by slug; departures are
 * added only to sample tours that have none, so running it again is safe. Always refuses to run
 * with NODE_ENV=production: real tours are created by the owner in the admin panel.
 */
import { connectDb, disconnectDb } from '../src/config/db.js';
import { isProductionDb } from './lib/production-db.js';
import { parseEnv } from '../src/config/env.js';
import { createLogger } from '../src/config/logger.js';
import { seedSampleTours } from './lib/tour-seed.js';

const out = (line = '') => process.stdout.write(`${line}\n`);

async function main() {
  const env = parseEnv(process.env);
  if (env.NODE_ENV === 'production' || isProductionDb(env.MONGO_URL)) {
    out('Refusing to seed sample tours in production.');
    process.exit(1);
  }
  await connectDb(env.MONGO_URL, createLogger({ level: 'warn' }), { attempts: 2 });
  try {
    const result = await seedSampleTours();
    out(`Sample tours: ${result.tours} upserted; ${result.departures} new departures.`);
    out('Prices, stays and dates are placeholders. Edit or archive them in the admin panel.');
  } finally {
    await disconnectDb();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
