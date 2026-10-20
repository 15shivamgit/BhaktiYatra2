# Phase 2 report: Authentication

**Date:** 2026-10-20 · **Branch:** `shivam-kumar-dev` · **Status:** done; one manual check open (real Google sign-in end to end)

## Also done this session

- **Git history cleaned (ADR-024).** `backend/.env` removed from every commit on `main` and `shivam-kumar-dev` with `git filter-branch`, after a verified backup bundle. Both branches force-pushed with `--force-with-lease`. Commit IDs changed; other clones must re-clone or hard-reset. GitHub's read-only `refs/pull/1/head` still points at the old history, so rotating the leaked credentials remains mandatory.
- **Google sign-in approved and built (ADR-020).**

## What was built

| Area | Result |
|---|---|
| Models | `User` (optional password, `googleId`, `avatarUrl`, `sessionVersion`, hashed reset token), `AuditLog` (append-only), `NotificationLog` (queue records; sending is Phase 7) |
| Sessions | HS256 JWT via `jose` in an httpOnly `by_session` cookie; `sessionVersion` invalidates other devices on password change/reset; previous-secret rotation; audience separation between session and OAuth-state tokens (ADR-025) |
| Endpoints | `POST /auth/register`, `/login`, `/logout`, `GET/PATCH /auth/me`, `POST /auth/change-password`, `/forgot-password`, `/reset-password`, `GET /auth/google`, `/auth/google/callback`, `GET /admin/users`, `GET/PATCH /admin/users/:id` |
| Security | Zod validation on every route, bcrypt (cost 12), timing-equalised login for unknown emails, same message for unknown email and wrong password, auth rate limit (10 per 15 min), trusted-origin check on state-changing requests, open-redirect protection on `next`, audit entries for admin logins and role/status changes, admins cannot modify themselves |
| Google | Authorisation code + PKCE (S256) + `state` + `nonce`; ID token verified against Google's JWKS (issuer, audience, nonce, `email_verified`); links verified emails to existing accounts; frontend route `/api/auth/callback/google` forwards to the API so the redirect URI already registered in Google Cloud Console keeps working |
| Frontend | `UserProvider` (re-checks on tab focus), navbar account menu (Radix dropdown), login, register, forgot and reset password pages, profile page with "Set a password" for Google-only accounts, client guards for account and admin areas, admin shell placeholder, toasts, accessible form fields |
| Tooling | `npm run seed:admin -w backend -- --email … --name …`; `backend/scripts/e2e-server.js` (in-memory MongoDB, seeded accounts) used by Playwright; E2E now runs against a production build |

## Tests run (results read from actual output)

| Command | Result |
|---|---|
| Backend `vitest run` | 10 files, 96 tests passed |
| Frontend `vitest run` | 5 files, 42 tests passed |
| `playwright test` (production build, desktop + mobile) | 34 passed |
| `npm run lint` / `format:check` | clean |
| `npm run build` | compiled |
| `npm audit --omit=dev` | 0 vulnerabilities |

Critical cases covered: TC-AUTH-01 to TC-AUTH-11, TC-SEC-01 to TC-SEC-05 (TC-SEC-06 is the CI gitleaks job). axe reports no serious or critical violations on `/login`, `/register`, `/forgot-password`, `/reset-password` and `/account`.

## Bugs found and fixed during the phase

1. **OAuth state tokens were minted already expired.** `jose` reads a numeric expiry as an absolute Unix timestamp, so `600` meant 1970. Integration tests caught it; expiry is now a duration string and a unit test guards it.
2. **Account menu failed WCAG 2.5.3 (label in name).** Its `aria-label` did not contain its visible text. The button is now named by its visible text, and the avatar initials are CSS-generated decoration.
3. **Reset-password errors used a generic code.** Now `INVALID_OR_EXPIRED_TOKEN` as specified.

## Manual checks

| Check | Result |
|---|---|
| `GET /auth/google` on the real API | 302 to accounts.google.com with the registered redirect URI |
| Google's response to that URL | normal "Sign in – Google Accounts … to continue to" page; no `redirect_uri_mismatch` or `invalid_client` |
| Full Google sign-in (token exchange with the client secret) | **Not verified.** Needs a person to sign in with a Google account; see "Owner actions". |
| Login page | screenshots in `phase-2/` (desktop and mobile) |

## Exit criteria

| Criterion | Status |
|---|---|
| All auth integration tests pass; coverage ≥ 80 % on auth service | Met: `auth.service.js` 98 % lines, backend overall 92.5 % lines (`vitest run --coverage`). Lowest file is `config/db.js` (35 %): its retry loop is not exercised by tests. |
| Session survives refresh and new tab; logout clears it | Met (E2E reload check; cookie is shared across tabs by the browser) |
| User hitting `/admin` is redirected; admin API as user → 403 | Met (E2E and TC-AUTH-09) |
| Password reset link appears in dev log | Met: in `NODE_ENV=development` the API logs the link (never in other environments) |
| Admin login creates an audit entry | Met (tests for password and Google sign-in) |
| axe: no serious violations on auth pages | Met |

## Owner actions

1. **Try Google sign-in once:** run `npm run dev`, open <http://localhost:3000/login>, choose "Continue with Google". If Google shows "access blocked", add your Gmail as a test user in Google Cloud Console (OAuth consent screen → Test users).
2. **Create your admin account:** `npm run seed:admin -w backend -- --email 15shivambgs@gmail.com --name "Shivam Kumar"`. It prints a generated password once. If you already signed in with Google using that email, the script promotes the existing account instead.
3. **Rotate leaked credentials** (still open from Phase 1): MongoDB user, Razorpay test keys, Gmail password.
4. **Delete personal files from Cloudinary** (still open from Phase 1), especially `Backup-codes-15shivambgs.txt`.

## Decisions recorded

ADR-020 (Google sign-in, accepted), ADR-024 (history rewrite), ADR-025 (`jose`, `sessionVersion`, `BCRYPT_ROUNDS`).
