/**
 * Restore a backup made by db-backup.js into the database in MONGO_URL. Each collection in the
 * backup replaces the collection of the same name. Run db:sync-indexes afterwards.
 *
 *   node --env-file=.env.staging scripts/db-restore.js --from backups/<folder> --yes
 *
 * Refuses to run without --yes, and against a database whose name is "bhaktiyatra" (production)
 * unless --production is also given.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import mongoose from 'mongoose';

const { EJSON } = mongoose.mongo.BSON;
const out = (line = '') => process.stdout.write(`${line}\n`);
const { values } = parseArgs({
  options: {
    from: { type: 'string' },
    yes: { type: 'boolean', default: false },
    production: { type: 'boolean', default: false },
  },
});

if (!values.from || !process.env.MONGO_URL) {
  out('Usage: node --env-file=<env file> scripts/db-restore.js --from <backup folder> --yes');
  process.exit(2);
}
const dir = path.resolve(values.from);
const meta = JSON.parse(fs.readFileSync(path.join(dir, 'backup.json'), 'utf8'));

await mongoose.connect(process.env.MONGO_URL, { autoIndex: false });
const db = mongoose.connection.db;
if (db.databaseName === 'bhaktiyatra' && !values.production) {
  out('Refusing to restore into the production database without --production.');
  process.exit(1);
}
if (!values.yes) {
  out(`This replaces collections in "${db.databaseName}" with the backup of "${meta.database}"`);
  out(`made at ${meta.createdAt} (${meta.total} documents). Run again with --yes to continue.`);
  process.exit(1);
}

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'backup.json')) {
  const name = file.slice(0, -'.json'.length);
  const docs = EJSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'), { relaxed: false });
  await db.collection(name).deleteMany({});
  if (docs.length) await db.collection(name).insertMany(docs, { ordered: false });
  out(`${name}: ${docs.length} documents restored`);
}
await mongoose.disconnect();
out('\nRestore finished. Now run: npm run db:sync-indexes -w backend (with the same env file).');
