# Phase 1 — Foundation

**Goal:** a clean monorepo where both apps start with one command, configuration is validated, the API reports health, CI runs, and no secrets remain in Git.

## Pre-requisites (owner)

- [ ] Rotate MongoDB Atlas password for the old user (or delete the user and create a new one).
- [ ] Regenerate Razorpay test keys.
- [ ] Change the Gmail password that was committed; do not use Gmail for the app.
- [ ] Create a fresh Atlas database `bhaktiyatra_dev` with a new least-privilege user.
- [ ] Approve rewriting Git history to remove `backend/.env`.

## Tasks

### Repository restructure
1. Move existing code into `legacy/` (`Frontend/` → `legacy/frontend-vite`, `backend/` → `legacy/backend`). Do not modify it. The new Next.js app is created as lowercase `frontend/`; on Windows, finish the move before creating it because the file system is case-insensitive.
2. Remove `backend/.env` from history (`git filter-repo --path backend/.env --invert-paths`), force-push after owner confirmation.
3. Root `package.json` with npm workspaces `frontend`, `backend`; scripts: `dev` (concurrently), `lint`, `test`, `build`, `format`.
4. Root `.gitignore` (env files, node_modules, .next, coverage, uploads, tickets, OS files), `.editorconfig`, `.prettierrc`, `eslint.config.js` (flat; react, jsx-a11y, import, node rules).
5. `.nvmrc` with Node LTS.

### Backend skeleton
6. `backend/package.json` (`"type": "module"`), dependencies from `02-architecture/02-tech-stack.md`, scripts: `dev` (`node --watch src/server.js`), `start`, `test`, `lint`, `seed:*`, `db:*`.
7. `src/config/env.js`: zod schema for all variables in `09-config/01-environment-variables.md`; exits with a readable list of missing/invalid keys.
8. `src/config/logger.js` (pino with redaction), `src/config/db.js` (connect with retry, graceful shutdown).
9. `src/utils/app-error.js`, `async-handler.js`; `middleware/error-handler.js`, `request-id.js`, `validate.js`, `rate-limit.js` (configurable, disabled in test).
10. `src/app.js`: helmet, cors (from env), cookie-parser, json limit 100 kb, mongo-sanitize, hpp, pino-http, routes, 404 handler, error handler. Raw-body placeholder for webhooks route ordering.
11. `modules/health`: `GET /api/v1/health` per `04-api/06-admin.md`.
12. `src/server.js`: load env → connect DB → start HTTP → register jobs (none yet) → SIGTERM handling.
13. Tests: health 200 with in-memory Mongo; 503 when DB disconnected; unknown route 404 envelope; validation middleware 422 shape.

### Frontend skeleton
14. `create-next-app` (App Router, JS, Tailwind, ESLint, `src/` off, import alias `@/`), pin version.
15. Install shadcn/ui; configure design tokens from `06-design/01-design-system.md`; fonts via `next/font`.
16. `app/layout.jsx` with Navbar/Footer placeholders, `messages/en.json`, `lib/api/server.js` and `client.js` with `ApiError`.
17. `app/page.jsx` temporary home that calls `/health` server-side and shows status (removed in Phase 3).
18. `not-found.jsx`, `error.jsx`, `loading.jsx` basics; `robots.js` returning disallow-all until Phase 3.
19. Vitest + RTL config with one smoke test; Playwright config with one test that loads `/`.

### Tooling
20. `.github/workflows/ci.yml`: install, lint, test (backend with mongodb-memory-server), build frontend, gitleaks.
21. `backend/.env.example`, `frontend/.env.example`.
22. Root `README.md` rewritten: what the project is, how to run locally, link to docs.

## Deliverables

- Monorepo structure per `02-architecture/03-folder-structure.md` (skeleton).
- `npm run dev` starts API on 5000 and web on 3000.
- CI green on the phase branch.

## Exit criteria

- [ ] `git log --all -- backend/.env` returns nothing after history rewrite; gitleaks passes.
- [ ] Fresh clone + `npm ci` + copying `.env.example` with real values + `npm run dev` works on Windows (owner's machine).
- [ ] Missing `MONGO_URL` produces a clear startup error, not a stack trace.
- [ ] `GET /api/v1/health` → 200 with `db: up`; stopping Mongo → 503.
- [ ] Home page renders with design tokens and fonts; Lighthouse runs without errors.
- [ ] Lint, tests and build pass in CI.
