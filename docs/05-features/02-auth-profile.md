# Feature: Authentication and Profile

Requirements: FR-AUTH-01…09. Phase 2.

## User flows

### Register
1. `/register`: name, email, phone (optional), password, confirm password, checkbox "I agree to Terms and Privacy Policy".
2. Client-side zod validation with inline messages; password strength hint (length, mix).
3. Submit → `POST /auth/register` → on 201, user is logged in (cookie set), toast "Welcome, Sunita", redirect to `next` param or `/`.
4. On 409 `EMAIL_TAKEN`: inline error under email with link "Log in instead".

### Login
1. `/login`: email, password, "Forgot password?" link.
2. Submit → `POST /auth/login` → redirect to `next` or `/`. Admins land on `/admin` if `next` is absent.
3. Error: single inline message "Invalid email or password". After 5 failures the button shows a 30 s cooldown (client-side nicety; server rate limit is the real guard).

### Session hydration
- Root layout renders a `UserProvider` that calls `GET /auth/me` once on mount (client) or forwards cookies (server) and exposes `{ user, status: 'loading'|'authenticated'|'guest' }`.
- Navbar shows skeleton while loading, then either "Log in / Register" or avatar menu (My Bookings, Profile, Admin if role admin, Log out).

### Logout
- Avatar menu → Log out → `POST /auth/logout` → clear client state → redirect `/` → toast.

### Protected pages
- `/account/*` and `/tours/[slug]/book`: if guest → redirect `/login?next=…`.
- `/admin/*`: if guest → login; if user → `/` with toast "Admin access only".
- Guards are implemented in layouts; they are UX only. API enforces.

### Profile
- `/account`: edit name and phone; change password section (current, new, confirm).
- Success toasts; errors inline.

### Forgot / reset password
- `/forgot-password`: email → always "If an account exists, we've sent a link".
- Email contains link valid 30 min.
- `/reset-password?token=`: new password + confirm → success → redirect login with toast.

## Business rules

- Email normalised to lowercase; leading/trailing spaces trimmed.
- Phone normalised to `+91XXXXXXXXXX` when 10 digits; otherwise must be valid E.164.
- Password: 8–72 chars; reject if in a small deny-list (`password`, `12345678`, `bhaktiyatra`, …).
- Registration sends `welcome` email (non-blocking).
- New users are `role: user`. Admin promotion only via admin UI or seed script.
- Deactivated users cannot log in (401 `ACCOUNT_DISABLED`) and existing sessions fail on next request.
- Changing password invalidates other sessions (via `tokenInvalidBefore`) but keeps the current one by reissuing the cookie.

## Edge cases

| Case | Behaviour |
|---|---|
| Cookie present but user deleted/deactivated | 401; client clears state; redirect if on protected page |
| Register with email differing only by case | 409 `EMAIL_TAKEN` |
| Reset token reused | 400 `INVALID_OR_EXPIRED_TOKEN` |
| Login from admin and then demoted | Next admin API call 403; admin layout re-checks `/auth/me` on focus and redirects |
| Third-party cookies blocked (prod different domains) | Not supported; see ADR-007 fallback |

## Acceptance criteria

- [ ] Register, login, logout, me, profile update, change password, forgot/reset all pass integration tests.
- [ ] Password hash never appears in any response (test asserts on serialised user).
- [ ] 10 rapid login attempts from one IP → 429.
- [ ] Admin page as user → redirected; admin API as user → 403 (tests).
- [ ] Cookie flags verified in test (httpOnly, SameSite=Lax, Secure in prod config).
- [ ] UI: form errors are announced to screen readers (aria-describedby), focus moves to first error.
