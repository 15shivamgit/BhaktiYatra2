/**
 * Create the indexes the models declare and drop ones they no longer declare. Production starts
 * with autoIndex off, so this runs as a release step (render.yaml runs it before the server).
 * Safe to run repeatedly.
 *
 *   npm run db:sync-indexes -w backend
 */
import mongoose from 'mongoose';
import { parseEnv } from '../src/config/env.js';
import '../src/models/AuditLog.js';
import '../src/models/Booking.js';
import '../src/models/Circuit.js';
import '../src/models/Contact.js';
import '../src/models/Counter.js';
import '../src/models/IdempotencyRecord.js';
import '../src/models/NotificationLog.js';
import '../src/models/Payment.js';
import '../src/models/SlugRedirect.js';
import '../src/models/Temple.js';
import '../src/models/Tour.js';
import '../src/models/TourDeparture.js';
import '../src/models/User.js';

const out = (line = '') => process.stdout.write(`${line}\n`);
const env = parseEnv(process.env);
await mongoose.connect(env.MONGO_URL, { autoIndex: false });
for (const model of Object.values(mongoose.models)) {
  const dropped = await model.syncIndexes();
  out(
    `${model.modelName}: indexes in sync${dropped.length ? ` (dropped ${dropped.join(', ')})` : ''}`,
  );
}
await mongoose.disconnect();
