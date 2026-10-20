# Definition of Done

## For a task or feature

A task is done only when **all** apply:

- [ ] Requirement IDs it implements are listed in the PR/phase report and their acceptance criteria are met.
- [ ] Code follows `docs/CLAUDE.md` (layering, ES modules, no duplicates, naming).
- [ ] Every new route has a Zod schema and the correct auth/role middleware.
- [ ] Business rules live in services and have unit tests; routes have integration tests for success and main errors.
- [ ] Relevant critical test cases (`02-critical-test-cases.md`) pass.
- [ ] UI has loading, empty, error and success states; strings in `messages/en.json`.
- [ ] Responsive at 360 / 768 / 1280 with no horizontal scroll; keyboard operable; no new axe serious/critical violations.
- [ ] API request/response matches `04-api/`; docs updated in the same change if anything changed.
- [ ] No secrets in code, logs or `NEXT_PUBLIC_*`; `.env.example` updated for new variables.
- [ ] Lint, tests and build pass locally and in CI.
- [ ] Exercised through the real user workflow in a browser (not just unit tests), and the result stated in the report.
- [ ] No `console.log`, commented-out code or TODOs without an issue link.

## For a phase

- [ ] All tasks in the phase file done per above.
- [ ] Phase exit criteria checked with evidence.
- [ ] Phase report written in `docs/10-testing/reports/phase-<n>.md`.
- [ ] Decision log updated for any choice made.
- [ ] Owner reviewed the running result and approved.

## For the v1 release

- [ ] Release gate in `00-overview/02-vision-goals-success.md` fully ticked.
- [ ] Phase 9 QA report with no open critical/high defects.
- [ ] Production smoke checklist passed.
- [ ] Operations runbook final and rehearsed.

A successful compile, a green unit test or a page that renders once is not "done".
