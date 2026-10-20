/**
 * Compare the admin dashboard numbers with plain MongoDB queries written by hand (Phase 8 exit
 * criterion). Read-only: it never writes to the database.
 *
 *   npm run db:check-dashboard -w backend            # last 7 days
 *   npm run db:check-dashboard -w backend -- 30d
 */
import mongoose from 'mongoose';
import { parseEnv } from '../src/config/env.js';
import { compareDashboard } from '../src/modules/dashboard/dashboard.check.js';

const out = (line = '') => process.stdout.write(`${line}\n`);
const range = process.argv[2] ?? '7d';
const env = parseEnv(process.env);
await mongoose.connect(env.MONGO_URL);

const checks = await compareDashboard(range);
let failed = 0;
out(`Dashboard check, range ${range}`);
for (const [label, expected, actual] of checks) {
  const ok = expected === actual;
  if (!ok) failed += 1;
  out(`${ok ? 'ok  ' : 'DIFF'} ${label.padEnd(36)} query=${expected} dashboard=${actual}`);
}
out(failed ? `${failed} difference(s)` : 'All figures match.');
await mongoose.disconnect();
process.exit(failed ? 1 : 0);
