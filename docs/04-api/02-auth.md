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
{ "success": true, "data": { "user": { "id": "…", "name": "Sunita Sharma", "email": "sunita@example.com", "phone": "+919876543210", "role": "user" } } }
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
204. Clears cookie. (Should) sets `tokenInvalidBefore = now`.

## GET /auth/me
Auth: required  
200: `{ "data": { "user": { id, name, email, phone, role, createdAt } } }`  
401 if no/invalid cookie. The frontend calls this on load to hydrate the user state.

## PATCH /auth/me
Auth: required  
Body (all optional, at least one): `{ "name", "phone" }`  
200: updated user. Email change is not supported in v1.

## POST /auth/change-password
Auth: required  
Body: `{ "currentPassword", "newPassword" }`  
204. Sets `tokenInvalidBefore = now` and issues a fresh cookie so the current session continues.  
Errors: 401 `INVALID_CREDENTIALS` (wrong current), 422.

## POST /auth/forgot-password
Auth: none · Rate limit: auth group  
Body: `{ "email" }`  
202 always (no account enumeration). If the account exists, stores hashed token with 30-min expiry and enqueues `password_reset` email with link `${SITE_URL}/reset-password?token=…`.

## POST /auth/reset-password
Auth: none  
Body: `{ "token", "newPassword" }`  
204. Invalidates token, sets `tokenInvalidBefore = now`.  
Errors: 400 `INVALID_OR_EXPIRED_TOKEN`, 422.

---

# Admin: users

## GET /admin/users
Auth: admin  
Query: `q` (name/email/phone), `role`, `isActive`, `page`, `limit`, `sort` (`-createdAt` default, `name`, `lastLoginAt`)  
200: list of users (no hashes) with `meta`.

## GET /admin/users/:id
Auth: admin  
200: user + `bookingCount` + last 5 bookings (reference, status, amount, createdAt).

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
