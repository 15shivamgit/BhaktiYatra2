# Test Strategy

## Pyramid

| Level | Tooling | Scope | Runs |
|---|---|---|---|
| Unit | Vitest | Services, utils, validators, pricing, transitions, signature helpers, formatters, React components in isolation | Every commit (CI) |
| Integration | Vitest + Supertest + mongodb-memory-server (replica set) | HTTP routes end-to-end inside the API with real Mongo and mocked providers | Every commit (CI) |
| End-to-end | Playwright | Browser journeys across Next.js + API with seeded data; Razorpay stubbed in CI, real test mode manually | Every PR (CI, Chromium); all browsers with `E2E_BROWSERS=all` before releases (ADR-035) |
| Accessibility | @axe-core/playwright | Key pages | With E2E |
| Performance | Lighthouse, `npm run test:load -w backend` (own load runner, in-memory data) | Key pages, list and booking APIs | Phase 9 and before releases |
| Manual | Checklists | Real devices, real Razorpay test mode, email rendering | Phase exits |

## Principles

- Test business rules at the service layer; test contracts at the route layer.
- No test touches a real external service in CI. Providers (Razorpay, Cloudinary, SMTP) are replaced via dependency injection with in-memory fakes that record calls.
- HMAC signatures are computed for real in tests with test secrets, so verification code paths are genuine.
- Each test creates its own data via factories (`tests/helpers/factories.js`); database cleared between test files.
- Time-dependent logic uses an injectable clock (`clock.now()`), faked in tests.
- Concurrency tests use `Promise.all` against the real in-memory replica set.
- No `retries` to hide flakiness; flaky tests are fixed or quarantined with an issue.

## Coverage targets

| Area | Target |
|---|---|
| `backend/src/modules/*/*.service.js` | ≥ 80 % lines, ≥ 90 % for bookings and payments |
| Validators (zod schemas) | Exercised by integration tests |
| Frontend components with logic (forms, payment panel, countdown) | ≥ 70 % |

Coverage is a guide, not a goal; critical cases in `02-critical-test-cases.md` are mandatory regardless.

## Test data

- Factories: `makeUser`, `makeAdmin`, `makeTemple`, `makeCircuit`, `makeTour`, `makeDeparture`, `makeBooking`, `makePayment`.
- E2E seed script `npm run seed:e2e -w backend` creates: 1 admin, 2 users, 5 published temples with coordinates, 1 circuit, 2 tours with 3 departures (one with 2 seats, one within cutoff, one normal).

## CI pipeline

```
lint → unit+integration (backend) → unit (frontend) → build (frontend) → e2e (chromium, stub payments) → gitleaks
```
Artifacts: coverage reports, Playwright traces and screenshots on failure.

## Environments for testing

| Purpose | Env |
|---|---|
| Automated | `NODE_ENV=test`, `PAYMENTS_PROVIDER=stub` or mocked Razorpay, `JOBS_ENABLED=false`, `RATE_LIMIT_ENABLED=false` (except dedicated rate-limit tests) |
| Manual payment testing | local or staging with Razorpay test keys and tunnel |
| Pre-release | staging with production-like data volume |

## Reporting

Phase reports include: commands run, pass/fail counts, coverage summary, list of manual checks with result, screenshots for UI and Lighthouse. Stored under `docs/10-testing/reports/phase-<n>.md`.
