# Phase 1 report: Foundation

**Date:** 2026-10-20 · **Branch:** `shivam-kumar-dev` · **Status:** done in code; two owner actions open (see "Not done")

## What was built

| Area | Result |
|---|---|
| Repository | Old prototype moved to `legacy/frontend-vite` and `legacy/backend`. npm workspaces `backend` + `frontend`. Root scripts `dev`, `lint`, `test`, `test:e2e`, `build`, `format`. `.nvmrc` (24), `.editorconfig`, `.prettierrc`, `.gitattributes`, `.vscode/extensions.json`. |
| Secrets | `backend/.env` untracked; every `.env*` except `.env.example` ignored (root and frontend). New local `backend/.env` generated with fresh JWT, revalidate and ticket secrets and a new database name `bhaktiyatra_dev`. |
| Backend | Express 5, ES modules. Zod env validation with readable startup errors. pino logging with redaction. Request ids, helmet, CORS allow-list with credentials, global rate limit, body sanitiser, `validate()` middleware, error envelope, 404 handler. `GET /api/v1/health` (200 / 503). Graceful shutdown. |
| Frontend | Next.js 16.4 (App Router, Turbopack, Cache Components), Tailwind 4 with design tokens in `@theme`, Inter + Cormorant Garamond via `next/font`. Layout with skip link, placeholder Navbar and Footer with business details, `not-found`, `error` (Next 16 `retry`), `robots.txt` blocking crawl. API clients for server and browser with a shared `ApiError`. `messages/en.json` + `t()` helper. `components.json` for shadcn/ui. Temporary home page showing live API status. |
| Tooling | Vitest + Supertest + mongodb-memory-server (backend); Vitest + Testing Library (frontend); Playwright (desktop and mobile Chromium); GitHub Actions CI with gitleaks, format, lint, tests, build, E2E. |
| Images | Cloudinary account inventoried; `backend/scripts/data/cloudinary-images.json` lists 158 temple, 4 brand and 15 review images (ADR-021). |

## Tests run (results read from actual output)

| Command | Result |
|---|---|
| `npm test` (backend) | 4 files, 17 tests passed |
| `npm test` (frontend) | 3 files, 16 tests passed |
| `npm run test:e2e` | 8 passed (4 tests × desktop + mobile) |
| `npm run lint` | 0 problems in both apps |
| `npm run format:check` | all files formatted |
| `npm run build` | compiled; `/` is Partial Prerender, `/_not-found` and `/robots.txt` static |
| `npm audit --omit=dev` | 0 vulnerabilities |

Dev-only audit: 5 high findings in `eslint-config-next`'s dependency chain (`braces` denial of service in lint tooling). Not shipped to production; recheck when `eslint-config-next` updates.

## Manual checks

| Check | Result |
|---|---|
| API against MongoDB Atlas | `/api/v1/health` → 200, `db: "up"` |
| Unknown route | 404 with `NOT_FOUND` envelope and request id |
| CORS | foreign origin gets no `Access-Control-Allow-Origin`; `http://localhost:3000` allowed |
| Missing / invalid env | `MONGO_URL is required`, `PORT … expected number`, exit code 1, no stack trace |
| Full stack in browser | home shows "API connected · Version 0.1.0" (screenshots in `phase-1/`) |
| `npm run dev` from root | API and web both ready in about 3 s |

A bug found during manual checks was fixed: invalid values were reported as "is required" because Zod 4 does not echo inputs. A test now covers it.

## Exit criteria

| Criterion | Status |
|---|---|
| `git log --all -- backend/.env` empty; gitleaks passes | **Partly met.** CI's gitleaks job passed, but on push it scans only the new commits. The old commits still contain `backend/.env`; removing them needs a history rewrite and force-push, which require the owner's approval. |
| Fresh clone + `npm ci` + env + `npm run dev` works on Windows | Met on the owner's machine with a clean `npm ci`; a separate fresh-clone run was not done |
| Missing `MONGO_URL` gives a clear error | Met |
| Health 200 with db up, 503 with db down | Met (Atlas manually; 503 in tests) |
| Home renders with tokens and fonts | Met (E2E checks background colour) |
| Lint, tests and build pass in CI | Met: GitHub Actions run 39389530935 passed all three jobs (secrets-scan, build-and-test, e2e) |

## Not done / owner actions

1. **Rotate credentials** that were committed: MongoDB user `15shivambgs_db_user`, Razorpay test keys, Gmail password. Also rotate the Google OAuth secret, Resend key and Cloudinary secret if `legacy/backend/.env` was ever shared.
2. **Approve the history rewrite** to remove `backend/.env` from all commits (requires force-push to `main` and `shivam-kumar-dev`).
3. **Remove personal files from Cloudinary** (`Backup-codes-15shivambgs.txt`, resumes, admit card, timetables, project report, profile photos). The backup-codes file is the most urgent; consider regenerating those codes.
4. **Decide on Google sign-in** for Phase 2 (ADR-020).
5. **Larger temple photos** needed for Phase 3 (137 of 158 are about 300 px wide).

## Decisions recorded

ADR-018 (Resend), ADR-019 (Express 5, built-in env loading), ADR-020 (Google sign-in pending), ADR-021 (Cloudinary inventory), ADR-022 (Next 16 Cache Components, Tailwind 4), ADR-023 (accessible primary colour).

## Environment changes

New `backend/.env` keys follow `backend/.env.example`. `frontend/.env.local` is optional for local work (defaults point at `localhost`).
