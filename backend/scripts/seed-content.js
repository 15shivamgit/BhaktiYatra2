/**
 * Upsert the launch temples and circuits from scripts/data/temples.data.js.
 *
 *   npm run seed:content -w backend            # publish in dev/staging
 *   npm run seed:content -w backend -- --draft # load as drafts for review
 *
 * Every temple is validated with the same schema as the admin API, rich text is sanitised, and
 * images are taken from scripts/data/cloudinary-images.json (the owner's existing uploads). The
 * script refuses to run against production unless --allow-production is passed, because the
 * drafted content must be reviewed first (ADR-015).
 */
import { parseArgs } from 'node:util';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { parseEnv } from '../src/config/env.js';
import { createLogger } from '../src/config/logger.js';
import { seedContent } from './lib/content-seed.js';

const out = (line = '') => process.stdout.write(`${line}\n`);

async function main() {
  const { values } = parseArgs({
    options: { draft: { type: 'boolean' }, 'allow-production': { type: 'boolean' } },
  });
  const env = parseEnv(process.env);
  if (env.NODE_ENV === 'production' && !values['allow-production']) {
    out(
      'Refusing to seed production: review the drafted content first, then pass --allow-production.',
    );
    process.exit(1);
  }
  const status = values.draft ? 'draft' : 'published';

  await connectDb(env.MONGO_URL, createLogger({ level: 'warn' }), { attempts: 2 });
  try {
    const result = await seedContent({ status });
    out(`Temples: ${result.temples} upserted (${result.created} new), status "${status}".`);
    out(`Circuits: ${result.circuits} upserted, status "${status}".`);
    out(
      'Reminder: content was drafted by Claude and must be reviewed before production (ADR-015).',
    );
  } finally {
    await disconnectDb();
  }
}

main().catch((error) => {
  process.stderr.write(`seed-content failed: ${error.message}\n`);
  process.exit(1);
});
