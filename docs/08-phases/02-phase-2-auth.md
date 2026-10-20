# Phase 2 — Authentication

**Goal:** secure accounts, sessions and roles that every later phase relies on. Specs: `05-features/02-auth-profile.md`, `04-api/02-auth.md`, `02-architecture/04-security.md`.

## Tasks

### Backend
1. `User` model with indexes and `toJSON` transform.
2. `AuditLog` model and `audit.service.log()` helper (used from now on).
3. `NotificationLog` model and a minimal `notifications.service.enqueue()` that writes records (sending comes in Phase 7; in dev, a console transport logs the would-be email).
4. Auth service: register, login, logout, me, update profile, change password, forgot/reset password (token hashing, expiry).
5. Middleware: `requireAuth` (cookie → JWT verify → load user → active and `tokenInvalidBefore` checks), `optionalAuth`, `requireRole`, `requireTrustedOrigin`.
6. Cookie helpers (set/clear with env-based flags).
7. Rate limits on auth routes.
8. Admin users endpoints (`GET/PATCH /admin/users`) with self-modification guard and audit.
9. `scripts/seed-admin.js`.
10. Tests (unit + integration): every endpoint happy path and errors; password never serialised; cookie flags; 401/403 matrix; rate limit; deactivated user; token invalidation after password change.

### Frontend
11. `UserProvider` + `useUser()`; hydration via `/auth/me`.
12. Pages: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/account` (profile + password).
13. Navbar auth area and `UserMenu`.
14. Guards: `(account)` layout and `admin/layout.jsx` redirect logic; `next` param handling.
15. Forms with react-hook-form + zod, inline errors, focus management, toasts.
16. Admin shell placeholder (`/admin` with sidebar and "Dashboard coming in Phase 8").
17. Tests: form validation unit tests; Playwright: register → logout → login → profile edit; user cannot open `/admin`.

## Exit criteria

- [ ] All auth integration tests pass; coverage ≥ 80 % on auth service.
- [ ] Manual: session survives refresh and new tab; logout clears it everywhere after refresh.
- [ ] User hitting `/admin` is redirected; `GET /api/v1/admin/users` as user → 403.
- [ ] Password reset email appears in dev log/Mailpit with a working link.
- [ ] Admin login creates an audit entry.
- [ ] axe: no serious violations on auth pages.
