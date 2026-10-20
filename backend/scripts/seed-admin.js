/**
 * Create an admin account, or promote an existing user to admin.
 *
 *   npm run seed:admin -w backend -- --email you@example.com --name "Your Name"
 *
 * The password comes from SEED_ADMIN_PASSWORD, otherwise a random one is generated and printed
 * once. Existing users keep their password.
 */
import { parseArgs } from 'node:util';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { parseEnv } from '../src/config/env.js';
import { createLogger } from '../src/config/logger.js';
import { User } from '../src/models/User.js';
import { hashPassword, passwordSchema } from '../src/modules/auth/password.js';
import { randomToken } from '../src/utils/crypto.js';

const out = (line) => process.stdout.write(`${line}\n`);

async function main() {
  const { values } = parseArgs({
    options: { email: { type: 'string' }, name: { type: 'string' } },
  });
  const email = values.email?.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    out('Usage: npm run seed:admin -w backend -- --email you@example.com --name "Your Name"');
    process.exit(1);
  }

  const env = parseEnv(process.env);
  const logger = createLogger({ level: 'warn' });
  await connectDb(env.MONGO_URL, logger, { attempts: 2 });

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      existing.role = 'admin';
      existing.isActive = true;
      await existing.save();
      out(`Promoted existing user ${email} to admin. Their password is unchanged.`);
      return;
    }

    const fromEnv = process.env.SEED_ADMIN_PASSWORD;
    const password = fromEnv ?? randomToken(12);
    passwordSchema.parse(password);
    await User.create({
      name: values.name?.trim() || 'BhaktiYatra Admin',
      email,
      role: 'admin',
      passwordHash: await hashPassword(password, env.BCRYPT_ROUNDS),
    });
    out(`Created admin ${email}.`);
    if (!fromEnv) {
      out(`Generated password (shown once, store it safely): ${password}`);
    }
  } finally {
    await disconnectDb();
  }
}

main().catch((error) => {
  process.stderr.write(`seed-admin failed: ${error.message}\n`);
  process.exit(1);
});
