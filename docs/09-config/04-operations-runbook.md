# Operations Runbook

Draft now; finalised in Phase 10. Written so the owner can act without a developer.

## Daily checks (5 minutes)

1. Admin dashboard alerts strip: `payment_received_no_seats`, inventory mismatch, email failures. Each should be 0.
2. Bookings with status `cancellation_requested`: process per policy.
3. Contacts inbox: reply to new messages.
4. Sentry: any new production issue.

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
1. Run `npm run db:reconcile -w backend` on the server shell (Render shell) to see the diff.
2. Investigate recent audit entries for that departure.
3. If confirmed as a counter drift, run with `--fix` and note in the audit reason.

### Emails failing
1. Dashboard alert count > 0 → Admin booking detail shows notification status and last error.
2. Check Brevo status and SMTP credentials in Render env.
3. After fixing, failed logs with attempts < 3 retry automatically; others: booking detail → Resend confirmation.

## Deploy

Merge to `staging` → verify → merge to `main`. Vercel and Render auto-deploy. Watch Render logs for "Server listening" and health 200.

## Rollback

- Frontend: Vercel → Deployments → previous → Promote.
- API: Render → Deploys → previous successful → Redeploy.
- If a deploy changed data shape, check the migration notes in the release before rolling back.

## Backup and restore

- Production Atlas backups per chosen tier. Before any risky change: take an on-demand snapshot.
- Restore drill (staging): restore snapshot to a new cluster, point staging API to it, verify, switch back.
- M0 interim: weekly `mongodump --uri "$MONGO_URL" --out backup-YYYYMMDD` stored encrypted off-site.

## Rotate a secret

1. Generate new value.
2. JWT: set `JWT_SECRET_PREVIOUS` = old, `JWT_SECRET` = new, deploy; remove previous after 7 days.
3. Razorpay keys: generate in dashboard, update Render env, redeploy, then revoke old key.
4. Webhook secret: update in Razorpay and Render at the same time; brief failures are retried by Razorpay.
5. Database password: create new password in Atlas, update Render env, redeploy, confirm health, done.

## Incident basics

1. Is the site up? Check `/api/v1/health` and home page.
2. Check Render, Vercel, Atlas, Razorpay status pages.
3. If payments are failing broadly, put a site banner (feature flag) "Online booking temporarily unavailable; call us".
4. After resolution, write a short note in `docs/09-config/incidents.md`: what happened, impact, fix, prevention.
