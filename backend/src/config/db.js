import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

/**
 * Connect to MongoDB, retrying with backoff so a slow network does not crash startup.
 * @param {string} url
 * @param {import('pino').Logger} logger
 * @param {{ attempts?: number, baseDelayMs?: number }} [options]
 */
export async function connectDb(url, logger, { attempts = 5, baseDelayMs = 1000 } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await mongoose.connect(url, { serverSelectionTimeoutMS: 10_000 });
      logger.info({ db: mongoose.connection.name }, 'MongoDB connected');
      return mongoose.connection;
    } catch (error) {
      logger.warn({ attempt, attempts, err: error.message }, 'MongoDB connection failed');
      if (attempt === attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** (attempt - 1)));
    }
  }
  throw new Error('unreachable');
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

/**
 * True when the driver reports a live connection and the server answers a ping.
 * @param {number} [timeoutMs]
 */
export async function pingDb(timeoutMs = 2000) {
  if (mongoose.connection.readyState !== 1) return false;
  try {
    await Promise.race([
      mongoose.connection.db.admin().ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('ping timeout')), timeoutMs)),
    ]);
    return true;
  } catch {
    return false;
  }
}
