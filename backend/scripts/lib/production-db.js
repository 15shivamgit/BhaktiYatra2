/** The production database name (docs/02-architecture/05-deployment.md "Environments"). */
export const PRODUCTION_DB = 'bhaktiyatra';

/**
 * True when the connection string points at the production database, whatever NODE_ENV says
 * (seeding runs from a laptop with a local env file).
 * @param {string} mongoUrl
 */
export function isProductionDb(mongoUrl) {
  try {
    return new URL(mongoUrl).pathname.replace(/^\//, '') === PRODUCTION_DB;
  } catch {
    return false;
  }
}
