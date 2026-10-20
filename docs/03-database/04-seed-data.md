# Seed Data and Migrations

## Principles

- Seeds are **explicit scripts**, never run on server start.
- Seed data is clearly non-production: tours and departures seeded for dev/staging carry `[SAMPLE]` in the title; temples are real, researched content and may be used in production.
- Scripts are idempotent: they upsert by slug/email and never duplicate.

## Scripts (`backend/scripts/`)

| Script | Command | What it does | Environments |
|---|---|---|---|
| `seed-admin.js` | `npm run seed:admin -- --email x --name y` | Creates or promotes an admin. Password is generated and printed once, or read from `SEED_ADMIN_PASSWORD`. | all |
| `seed-content.js` | `npm run seed:content` | Upserts circuits and temples from `docs/07-content/02-initial-temples.md` data file (`backend/scripts/data/temples.json`, `circuits.json`). Images are referenced by Cloudinary public ids uploaded beforehand with `upload-images.js`. | dev, staging, prod (first launch) |
| `upload-images.js` | `npm run seed:images -- ./path/to/images` | Uploads a folder of images to Cloudinary under `bhaktiyatra/<env>/temples/<slug>/` and writes a manifest used by `seed-content.js`. | dev, staging, prod |
| `seed-sample-tours.js` | `npm run seed:sample-tours` | Creates 5 sample tours with departures over the next 3 months. Refuses to run when `NODE_ENV=production`. | dev, staging |
| `seed-e2e.js` | `npm run seed:e2e` | Wipes and seeds the fixed E2E dataset described in `10-testing/01-test-strategy.md`. Refuses unless `NODE_ENV=test` or `development`. | dev, test |
| `reconcile-payments.js` | `npm run payments:reconcile -- --order <id>` | Fetches payments for one order (or all pending 20–120 min old) from Razorpay and runs `confirmBooking` for missed captures. (Should, Phase 6) | all |
| `reconcile-inventory.js` | `npm run db:reconcile` | Prints invariant violations per departure; `--fix` recomputes `seatsAvailable` from bookings (requires confirmation prompt). | all |
| `db-sync-indexes.js` | `npm run db:sync-indexes` | `syncIndexes()` for all models. | prod release step |

## Content data files

`backend/scripts/data/temples.json` — array of Temple documents without `_id`, `images` as `[ { file: 'kedarnath-1.jpg', alt: '...' } ]` resolved via the upload manifest. Source of truth for the initial list is `docs/07-content/02-initial-temples.md`; the JSON is generated from research and reviewed by the owner before seeding.

## Migration strategy

v1 has no production data to migrate. Going forward:

- Additive schema changes (new optional fields) need no migration.
- Changes to enums or required fields ship with a script in `backend/scripts/migrations/YYYYMMDD-description.js`, run manually, logged in the decision log.
- Never run destructive migrations without an Atlas snapshot taken first.

## Legacy data

The prototype's Atlas database (`bhaktiyatra`) contains test tours, bookings and users with the committed credentials. It is **not** migrated. After rotating credentials, drop the old database or leave it untouched in a separate project; do not point the new API at it.
