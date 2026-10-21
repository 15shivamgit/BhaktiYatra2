/**
 * Back up every collection of the database in MONGO_URL to a folder of Extended JSON files
 * (types such as ObjectId and Date survive). Read-only. Atlas free clusters have no snapshots,
 * so this is the backup until the cluster is upgraded (docs/09-config/04-operations-runbook.md).
 *
 *   node --env-file=.env.production scripts/db-backup.js [--out backups]
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import mongoose from 'mongoose';

const { EJSON } = mongoose.mongo.BSON;
const out = (line = '') => process.stdout.write(`${line}\n`);
const { values } = parseArgs({ options: { out: { type: 'string', default: 'backups' } } });

if (!process.env.MONGO_URL) {
  out('MONGO_URL is not set');
  process.exit(2);
}
await mongoose.connect(process.env.MONGO_URL, { autoIndex: false });
const db = mongoose.connection.db;
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const dir = path.resolve(values.out, `${db.databaseName}-${stamp}`);
fs.mkdirSync(dir, { recursive: true });

let total = 0;
for (const { name } of await db.listCollections({}, { nameOnly: true }).toArray()) {
  if (name.startsWith('system.')) continue;
  const docs = await db.collection(name).find().toArray();
  fs.writeFileSync(
    path.join(dir, `${name}.json`),
    EJSON.stringify(docs, null, 0, { relaxed: false }),
  );
  out(`${name}: ${docs.length} documents`);
  total += docs.length;
}
fs.writeFileSync(
  path.join(dir, 'backup.json'),
  JSON.stringify(
    { database: db.databaseName, createdAt: new Date().toISOString(), total },
    null,
    2,
  ),
);
await mongoose.disconnect();
out(`\nBackup written to ${dir} (${total} documents). Keep it somewhere safe and private.`);
