# Phase 9 — Quality Assurance

**Goal:** prove the whole system against the release gate in `00-overview/02-vision-goals-success.md`.

## Tasks

1. Run full automated suite (unit, integration, E2E) in CI; fix flakiness (no retries masking failures).
2. Execute every Must case in `10-testing/02-critical-test-cases.md`; record results.
3. E2E journeys in `10-testing/03-e2e-journeys.md` on Chrome, Firefox, WebKit (Playwright), plus manual on a real Android and iPhone.
4. Accessibility: axe on listed pages; manual keyboard and screen-reader pass (NVDA on Windows, VoiceOver on iOS) for booking flow.
5. Performance: Lighthouse on home, temple detail, tour detail (mobile, production build); API load test (autocannon/k6) on list endpoints and booking creation with realistic data volume (1,000 temples, 50 tours, 500 departures, 10,000 bookings).
6. Security review: checklist in `02-architecture/04-security.md`; `npm audit`; gitleaks; manual tests for IDOR on bookings/tickets, rate limits, CORS from foreign origin, cookie flags, upload of disguised file types, XSS attempts in rich text and contact form.
7. Content review: ≥ 60 temples published meeting guidelines; legal pages reviewed by owner.
8. Data checks: reconciliation zero mismatches after load test; indexes used (`explain()` on top queries).
9. Bug triage: critical/high fixed; medium documented with owner decision.

## Exit criteria

Status on 2026-10-21 (details in `10-testing/reports/phase-9.md`):

- [ ] Release-gate checklist fully ticked with evidence (screenshots, reports) stored in `docs/10-testing/reports/`. (All lines met except Lighthouse Performance, the staging deployment (Phase 10) and the owner's manual checks.)
- [x] No open critical or high defects.
- [ ] Owner sign-off.
