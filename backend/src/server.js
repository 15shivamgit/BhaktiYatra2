import { createApp } from './app.js';
import { connectDb, disconnectDb } from './config/db.js';
import { EnvError, parseEnv } from './config/env.js';
import { createLogger } from './config/logger.js';
import { startJobs } from './jobs/index.js';
import { createProviders } from './providers/index.js';

function loadEnvOrExit() {
  try {
    return parseEnv(process.env);
  } catch (error) {
    if (error instanceof EnvError) {
      process.stderr.write(
        `\n${error.message}\n\nSee backend/.env.example and docs/09-config/01-environment-variables.md\n\n`,
      );
      process.exit(1);
    }
    throw error;
  }
}

async function main() {
  const env = loadEnvOrExit();
  const logger = createLogger({ level: env.LOG_LEVEL, pretty: env.NODE_ENV === 'development' });

  try {
    await connectDb(env.MONGO_URL, logger, { autoIndex: env.NODE_ENV !== 'production' });
  } catch (error) {
    logger.fatal({ err: error.message }, 'Could not connect to MongoDB; exiting');
    process.exit(1);
  }

  const providers = createProviders(env, logger);
  const app = createApp({ env, logger, providers });
  const stopJobs = env.JOBS_ENABLED ? startJobs({ env, logger, providers }) : () => {};
  const server = app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, env: env.NODE_ENV, version: env.APP_VERSION },
      'Server listening',
    );
  });

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Shutting down');
    stopJobs();
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
