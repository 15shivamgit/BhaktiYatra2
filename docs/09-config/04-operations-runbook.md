# Operations Runbook

Written so the owner can act without a developer. Hosting setup: `05-deployment-guide.md`. Addresses below use the default names (`bhaktiyatra.vercel.app`, `bhaktiyatra-api.onrender.com`); use yours.

## Daily checks (5 minutes)

1. Admin dashboard alerts strip: `payment_received_no_seats`, inventory mismatch, email failures. Each should be 0.
2. Bookings with status `cancellation_requested`: process per policy.
3. Contacts inbox: reply to new messages.
4. Render → `bhaktiyatra-api` → Logs: any `error` lines since yesterday (Sentry is not set up in v1).

## Common procedures

### A customer says "I paid but have no booking"
1. Admin → Payments → search the Razorpay payment id or the customer's email.
2. If a Payment exists and booking is `confirmed` → resend confirmation from booking detail.
3. If booking is `pending`/`expired` but Razorpay shows captured → the reconciliation job should fix within an hour; to fix now, run `npm run payments:reconcile -w backend -- --order <order_id>` (Phase 6 Should) or record a manual payment with reason in booking detail.
4. If no booking at all → find the order in Razorpay by receipt/notes (`bookingReference`), then proceed as above or refund in Razorpay.

### `payment_received_no_seats`
1. Decide: add seats (Tour → Departures → Adjust seats, reason "Accommodating paid booking BY-…") then booking detail → Resolve → Confirm; or
2. Refund in Razorpay dashboard, then booking detail → Cancel with refund record (amount, refund id).
3. Call/email the customer.

### Cancel a confirmed booking with refund
1. Check policy for refund percentage.
2. Razorpay dashboard → Payments → refund amount.
3. Booking detail → Cancel → enter refund amount and Razorpay refund id. Seats are released automatically.

### Cancel a whole departure
Tour → Departures → Cancel (reason). Then process each affected confirmed booking (they appear as `cancellation_requested`).

### Inventory mismatch alert
1. On your computer, from `backend/`: `node --env-file=.env.production scripts/reconcile-inventory.js` to see the difference (the Render shell needs a paid plan).
2. Investigate recent audit entries for that departure.
3. If confirmed as a counter drift, run with `--fix` and note in the audit reason.

### Emails failing
1. Dashboard alert count > 0 → Admin booking detail shows notification status and last error.
2. Check Resend status and `RESEND_API_KEY` in Render → Environment. Without a verified domain Resend only delivers to your own address.
3. After fixing, failed logs with attempts < 3 retry automatically; others: booking detail → Resend confirmation.

## Deploy

1. Changes land on `shivam-kumar-dev`: staging (Vercel `bhaktiyatra-staging`, Render `bhaktiyatra-api-staging`) deploys by itself.
2. Check staging: `node scripts/smoke-test.mjs --site https://bhaktiyatra-staging.vercel.app --api https://bhaktiyatra-api-staging.onrender.com --staging --write`, then click through the change.
3. On GitHub open a pull request `shivam-kumar-dev` → `main`, wait for CI to be green, merge. Production deploys by itself (Render runs `db:sync-indexes` before starting).
4. Check production: `node scripts/smoke-test.mjs --site https://bhaktiyatra.vercel.app --api https://bhaktiyatra-api.onrender.com`.
5. Watch Render logs for "Server listening" and `/api/v1/health` returning `"db":"up"`.

## Rollback

- Website: Vercel → project → Deployments → the previous good one → ⋯ → **Instant Rollback** (seconds). Undo later with **Promote** on the newer deployment.
- API: Render → service → Events/Deploys → the previous good deploy → **Rollback** (rebuilds that commit, a few minutes).
- Code: if the bad change is on `main`, revert it on GitHub (pull request → Revert) so the next deploy does not bring it back.
- If a deploy changed data shape, check the migration notes in the release before rolling back.

## Backup and restore

- The free Atlas cluster has no automatic snapshots. **Every week and before any risky change**, from `backend/`: `node --env-file=.env.production scripts/db-backup.js` → a folder in `backend/backups/` (ignored by Git). Copy it to private storage (for example an encrypted drive or private cloud folder); it contains customer data.
- Restore into staging (rehearsal or investigation): `node --env-file=.env.staging scripts/db-restore.js --from backups/<folder> --yes`, then `node --env-file=.env.staging scripts/sync-indexes.js`.
- Restore into production (only after an incident): the same with `.env.production` and `--production`; take a fresh backup first.
- When the cluster is upgraded (M10 or above), turn on Atlas Cloud Backup and use its snapshots instead.

## Rotate a secret

1. Generate new value.
2. JWT: set `JWT_SECRET_PREVIOUS` = old, `JWT_SECRET` = new, deploy; remove previous after 7 days.
3. Razorpay keys: generate in dashboard, update Render env, redeploy, then revoke old key.
4. Webhook secret: update in Razorpay and Render at the same time; brief failures are retried by Razorpay.
5. Database password: Atlas → Database Access → the user → Edit → new password; Render → Environment → `MONGO_URL` → Save (redeploys); check `/api/v1/health`; update your local `.env.*` file.
6. Any other secret (`TICKET_SIGNING_SECRET`, `REVALIDATE_SECRET`, Cloudinary, Resend): change it in Render (and `REVALIDATE_SECRET` also in Vercel, then redeploy both). Changing `TICKET_SIGNING_SECRET` makes existing e-ticket QR codes fail: regenerate documents for upcoming confirmed bookings afterwards.

## Incident basics

1. Is the site up? Check `/api/v1/health` and home page.
2. Check Render, Vercel, Atlas, Razorpay status pages.
3. If payments are failing broadly, close booking: Render → `PAYMENTS_PROVIDER=disabled` and Vercel → `NEXT_PUBLIC_FEATURE_BOOKING=false` (redeploy). Visitors see the enquiry button instead.
4. After resolution, write a short note in `docs/09-config/incidents.md`: what happened, impact, fix, prevention.
