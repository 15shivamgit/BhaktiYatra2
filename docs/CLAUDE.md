# CLAUDE.md — Working rules for AI-assisted development on BhaktiYatra

These rules apply to every session that writes or changes code in this repository. They exist because the previous prototype accumulated duplicate flows, unverified payments and committed secrets. Do not repeat that.

## 1. Read before you write

1. Read `docs/PROJECT_CONTEXT.md` at the start of every session.
2. Read the phase file in `docs/08-phases/` for the phase being worked on. Work only inside that phase unless the owner says otherwise.
3. Before creating or editing a file, search the repo for existing code that does the same thing. Extend it or propose a migration. Never add a second implementation of an existing route, model, service or component.
4. Read the matching feature spec (`05-features/`), API contract (`04-api/`) and model definition (`03-database/`) before implementing.

## 2. Specification is the contract

- Field names, route paths, status values and response shapes come from `docs/`. If the spec is wrong or incomplete, say so and propose a doc change first. Do not quietly diverge.
- When a decision is needed that the docs do not cover, ask, or make the smallest reasonable choice and record it in `00-overview/03-decision-log.md` in the same change.
- Priorities: Must > Should > Could. Do not build Could items without approval.

## 3. Non-negotiable engineering rules

- **Backend is the authority.** Prices, amounts, user identity, seat availability and payment success are computed or verified on the server. The client only expresses intent.
- **Every request is validated** with Zod before it reaches a controller.
- **Every protected route** goes through `requireAuth`, and admin routes additionally through `requireRole('admin')`.
- **Payments are idempotent.** A Razorpay payment id confirms a booking at most once, whether it arrives via client verify or webhook, in any order, any number of times.
- **Inventory changes are atomic** (`findOneAndUpdate` with a guard such as `seatsAvailable: { $gte: n }`). Never read-modify-write seat counts.
- **No secrets in code or in `NEXT_PUBLIC_*` variables.** Only the Razorpay key id is public.
- **Consistent module system:** backend uses ES modules (`import`/`export`) everywhere. No `require`.
- **Consistent API envelope:** see `04-api/01-conventions.md`. Errors use real HTTP status codes; never `200` with `success:false`.
- **No dummy production data.** Seed data is clearly labelled and only loaded by an explicit script.
- **Do not log** passwords, tokens, cookies, payment secrets or full card/UPI details.

## 4. Workflow for each task

1. **Plan** in a short list: files to add, files to change, model or API changes, tests, risks.
2. **Implement** a small, complete slice. Keep unrelated code untouched.
3. **Test**: run the relevant unit and integration tests, lint and build. Read the actual output.
4. **Report**: what changed, which tests ran and their results, what is not done, any env changes, any decision needing approval.
5. **Update docs** touched by the change in the same commit.

Never say a feature works without having run it. If something could not be verified, state that explicitly.

## 5. Code conventions

- JavaScript (no TypeScript) in both apps. JSDoc types on exported functions and service boundaries.
- Backend layering: `routes → validators → controllers → services → models`. Controllers do not talk to Mongoose directly; services do. Business rules live in services so they are unit-testable.
- Frontend: Server Components by default for public pages; Client Components only where interactivity is needed. Data fetching for public pages happens on the server for SEO.
- File naming: `kebab-case` for files and folders, `PascalCase` for React components, `camelCase` for functions and variables, `SCREAMING_SNAKE_CASE` for env vars and constants.
- One component per file. Co-locate small helpers with their only consumer; shared helpers go in `lib/` or `utils/`.
- Prefer named exports. Default exports only for Next.js pages/layouts and React components.
- Comments explain *why*, not *what*. No commented-out code committed.
- Money: integer rupees in the database; convert to paise only at the Razorpay boundary.
- Dates: store UTC; display in `Asia/Kolkata`.

## 6. Git hygiene

- Branch per phase or per feature: `phase-3/temple-explore`, `fix/booking-hold-expiry`.
- Conventional commits: `feat(tours): add departure inventory service`, `fix(payments): reject amount mismatch`, `docs(api): document cancel endpoint`.
- Never commit `.env`, `uploads/`, generated tickets, `node_modules`, or build output. Check `.gitignore` before the first commit of a phase.
- Do not force-push shared branches.

## 7. What to do when the old code conflicts

The old prototype was deleted after Phase 3 (ADR-029). If you need to look at it, read it from Git history (commit `22465dc` or earlier); never restore it into the working tree or import from it. The `docs/` tree, not the old code, defines behaviour.

## 8. Definition of Done

A task is done only when it meets `docs/10-testing/04-definition-of-done.md`. Compiling is not done. Rendering once in a browser is not done.
