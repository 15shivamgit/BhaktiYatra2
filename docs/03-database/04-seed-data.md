# Seed Data and Migrations

## Principles

- Seeds are **explicit scripts**, never run on server start.
- Seed data is clearly non-production: tours and departures seeded for dev/staging carry `[SAMPLE]` in the title; temples are real, researched content and may be used in production.
- Scripts are idempotent: they upsert by slug/email and never duplicate.

## Scripts (`backend/scripts/`)

| Script | Command | What it does | Environments |
|---|---|---|---|
| `seed-admin.js` | `npm run seed:admin -- --email x --name y` | Creates or promotes an admin. Password is generated and printed once, or read from `SEED_ADMIN_PASSWORD`. | all |
| `seed-content.js` | `npm run seed:content -w backend [-- --draft]` | Upserts temples and circuits from `backend/scripts/data/temples.data.js` (logic in `scripts/lib/content-seed.js`, also used by the E2E server). Published by default; `--draft` seeds drafts. Refuses `NODE_ENV=production` unless `--allow-production` is passed. Images reference existing Cloudinary public IDs. | dev, staging, prod (first launch, after owner review) |
| ~~`upload-images.js`~~ | — | Not built (ADR-028): seed images are the owner's existing Cloudinary assets, and new photos are uploaded in the admin temple editor. | — |
| `seed-sample-tours.js` | `npm run seed:sample-tours` | Creates 5 sample tours with departures over the next 3 months. Refuses to run when `NODE_ENV=production`. | dev, staging |
| `seed-e2e.js` | `npm run seed:e2e` | Wipes and seeds the fixed E2E dataset described in `10-testing/01-test-strategy.md`. Refuses unless `NODE_ENV=test` or `development`. | dev, test |
| `reconcile-payments.js` | `npm run payments:reconcile -- --order <id>` | Fetches payments for one order (or all pending 20–120 min old) from Razorpay and runs `confirmBooking` for missed captures. (Should, Phase 6) | all |
| `reconcile-inventory.js` | `npm run db:reconcile` | Prints invariant violations per departure; `--fix` recomputes `seatsAvailable` from bookings (requires confirmation prompt). | all |
| `db-sync-indexes.js` | `npm run db:sync-indexes` | `syncIndexes()` for all models. | prod release step |

## Content data files

`backend/scripts/data/temples.data.js` — an ES module exporting `TEMPLES` (22 temples drafted by Claude per ADR-015, each with sources and check date in `notes`), `CIRCUITS` (Char Dham, 12 Jyotirlingas, Bada Char Dham, temples in traditional order) and `REVIEW_NOTE`. Images are `[publicId, alt]` pairs pointing at photos already in the owner's Cloudinary library; each photo was viewed before use, and mislabeled or watermarked ones were left out. `tests/unit/content-data.test.js` checks the file (required fields, valid states, coordinates inside India, unique slugs, circuits reference known temples). The plan for the full list stays in `docs/07-content/02-initial-temples.md`.

## Migration strategy

v1 has no production data to migrate. Going forward:

- Additive schema changes (new optional fields) need no migration.
- Changes to enums or required fields ship with a script in `backend/scripts/migrations/YYYYMMDD-description.js`, run manually, logged in the decision log.
- Never run destructive migrations without an Atlas snapshot taken first.

## Legacy data

The prototype's Atlas database (`bhaktiyatra`) contains test tours, bookings and users with the committed credentials. It is **not** migrated. After rotating credentials, drop the old database or leave it untouched in a separate project; do not point the new API at it.
