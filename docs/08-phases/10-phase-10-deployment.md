# Phase 10 — Deployment and Handover

**Goal:** staging and production running on real domains, documented so the owner can operate and recover without the developer. Specs: `02-architecture/05-deployment.md`, `09-config/*`.

## Pre-requisites (owner)

- [ ] Domain purchased and DNS access (OQ-1).
- [ ] Razorpay live account activated (OQ-6).
- [ ] Brevo sender domain verified (SPF/DKIM/DMARC).
- [ ] Atlas production project/cluster created; backup plan chosen.
- [ ] Sentry projects for frontend and backend.

## Tasks

1. Staging: Render service, Vercel project/branch, Atlas staging DB, Cloudinary staging folder, Razorpay test webhook to staging URL, Brevo with `[STAGING]` prefix, `noindex`.
2. Run full smoke checklist on staging; fix issues.
3. Production: same with live configuration; custom domains; cookie domain; CORS origins; webhook with live secret.
4. Seed admin and content on production (`seed:admin`, `seed:images`, `seed:content`); publish reviewed temples.
5. Production smoke test incl. one real ₹1 departure booked and refunded (temporary test tour, archived afterwards).
6. Google Search Console: verify, submit sitemap.
7. Write `docs/09-config/04-operations-runbook.md` final version: deploy, rollback, restore from backup, rotate secrets, handle `payment_received_no_seats`, handle email failures, reconcile inventory, common support queries.
8. Tag `v1.0.0`; CHANGELOG; handover session with owner.

## Status (2026-10-21)

Owner chose staging and production now, on the free Vercel and Render addresses (no domain yet), set up through the dashboards (ADR-036). Prepared in the repository: `render.yaml`, the `/api/v1` rewrite, `PAYMENTS_PROVIDER=disabled` for a content-only production, seeding guards, `db:sync-indexes`, `db:backup`/`db:restore`, `scripts/smoke-test.mjs`, the deployment guide (`09-config/05-deployment-guide.md`) and the final runbook. Next: the owner creates the Atlas users, the Render Blueprint and the two Vercel projects; then seeding, smoke tests and the rollback and restore rehearsals.

Pre-requisites not needed for this first launch: domain (free addresses for now), Razorpay live (booking stays closed in production), verified email domain (Resend test sender), Sentry (not in v1).

## Exit criteria

- [ ] Production smoke checklist passes.
- [ ] Rollback rehearsed once on staging.
- [ ] Backup restore rehearsed once on staging (mongodump/restore or Atlas snapshot).
- [ ] Owner can deploy, roll back and rotate a secret by following the runbook alone.
