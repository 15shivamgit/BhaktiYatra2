# Auth and Users API

Requirements: FR-AUTH-01…09.

## POST /auth/register
Auth: none · Rate limit: auth group  
Body:
```json
{ "name": "Sunita Sharma", "email": "sunita@example.com", "password": "StrongPass123", "phone": "9876543210" }
```
Rules: name 2–80; email valid, unique (case-insensitive); password 8–72 chars; phone optional, 10-digit Indian or E.164.  
201:
```json
{ "success": true, "data": { "user": { "id": "…", "name": "Sunita Sharma", "email": "sunita@example.com", "phone": "+919876543210", "role": "user", "avatarUrl": null, "hasPassword": true, "googleLinked": false, "createdAt": "…" } } }
```
Sets cookie `by_session`. Enqueues `welcome` email.  
Errors: 422 `VALIDATION_ERROR`, 409 `EMAIL_TAKEN`, 429.

## POST /auth/login
Auth: none · Rate limit: auth group  
Body: `{ "email", "password" }`  
200: same `data.user` shape; sets cookie. Updates `lastLoginAt`. Admin logins write an audit entry.  
Errors: 401 `INVALID_CREDENTIALS` (same message for unknown email and wrong password), 401 `ACCOUNT_DISABLED`, 429.

## POST /auth/logout
Auth: required  
204. Clears the cookie on this device only. Other devices stay signed in (ADR-025).

## GET /auth/me
Auth: required  
200: `{ "data": { "user": PublicUser } }` (shape shown under register)  
401 if no/invalid cookie.

## GET /auth/session
Auth: optional  
200: `{ "data": { "user": PublicUser | null } }`, `Cache-Control: no-store`. Never 401, so guests do not produce error noise in the browser console. The frontend calls this on load (and on tab focus) to hydrate the user state.

## PATCH /auth/me
Auth: required  
Body (all optional, at least one): `{ "name", "phone" }`  
200: updated user. Email change is not supported in v1.

## POST /auth/change-password
Auth: required  
Body: `{ "currentPassword", "newPassword" }`. `currentPassword` is not required when the account has no password yet (Google-only), which lets those users set one.  
204. Increments `sessionVersion` (signs out other devices) and issues a fresh cookie so the current session continues.  
Errors: 401 `INVALID_CREDENTIALS` (wrong current), 422.

## POST /auth/forgot-password
Auth: none · Rate limit: auth group  
Body: `{ "email" }`  
202 always (no account enumeration). If the account exists, stores hashed token with 30-min expiry and enqueues `password_reset` email with link `${SITE_URL}/reset-password?token=…`.

## POST /auth/reset-password
Auth: none  
Body: `{ "token", "newPassword" }`  
204. Invalidates the token and increments `sessionVersion`. The user then logs in with the new password.  
Errors: 400 `INVALID_OR_EXPIRED_TOKEN`, 422.

---

# Google sign-in (ADR-020)

## GET /auth/google
Auth: none · Rate limit: auth group  
Query: `next` (optional relative path such as `/account`; anything else becomes `/`).  
302 to the Google consent screen with `response_type=code`, `scope=openid email profile`, `state`, `nonce`, PKCE `code_challenge` (S256) and `prompt=select_account`. Sets a short-lived `by_oauth` cookie: a signed JWT holding state, nonce, PKCE verifier and next; 10 minutes; httpOnly; SameSite=Lax; path `/api/v1/auth/google`.  
404 `GOOGLE_DISABLED` when `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` is not set.

## GET /auth/google/callback
Auth: none. Reached through the frontend route `/api/auth/callback/google` (the redirect URI registered in Google Cloud Console), which forwards the query string here.  
Steps: check `state` against the `by_oauth` cookie, exchange `code` with the PKCE verifier, verify the ID token (issuer `accounts.google.com`, audience = client id, `nonce`, `email_verified`), find the user by `googleId`, else link the user with the same email, else create one; reject deactivated users; set `by_session`, clear `by_oauth`; audit admin sign-ins.  
Always answers with a 302 because this is a browser navigation:
- success: `{SITE_URL}{next}`
- failure: `{SITE_URL}/login?error=<reason>`, where reason is `google_cancelled` (user denied), `google_failed` (state mismatch, exchange or verification failure, unverified email) or `account_disabled`.

---

# Admin: users

## GET /admin/users
Auth: admin  
Query: `q` (name/email/phone), `role`, `isActive`, `page`, `limit`, `sort` (`-createdAt` default, `name`, `lastLoginAt`)  
200: list of users (no hashes) with `meta`.

## GET /admin/users/:id
Auth: admin  
200: admin user shape (public fields plus `isActive`, `lastLoginAt`, `emailVerifiedAt`, `updatedAt`). `bookingCount` and the last 5 bookings are added in Phase 5, when bookings exist.

## PATCH /admin/users/:id
Auth: admin  
Body: `{ "role"?: "user"|"admin", "isActive"?: boolean }`  
Rules: cannot change own role or deactivate self (403 `CANNOT_MODIFY_SELF`). Writes audit `user.role.change` / `user.active.change`.  
200: updated user.

---

## Cookie specification

| Attribute | Dev | Prod |
|---|---|---|
| Name | `by_session` | `by_session` |
| HttpOnly | yes | yes |
| Secure | no | yes |
| SameSite | Lax | Lax |
| Domain | (host-only) | `.<root-domain>` |
| Max-Age | 7 days | 7 days |
| Path | `/` | `/` |

## Session error handling contract (frontend)

- 401 `UNAUTHENTICATED` / `SESSION_EXPIRED` on a user page → redirect to `/login?next=<current path>` with toast "Please log in again".
- 401 on a background call (e.g., navbar `/auth/me`) → treat as logged out silently.
- 403 `ADMIN_ONLY` → redirect to `/` with toast.
