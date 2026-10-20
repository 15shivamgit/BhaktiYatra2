# BhaktiYatra Documentation

This folder is the single source of truth for the BhaktiYatra rebuild. Code is written **from** these documents, not the other way around. If code and docs disagree, the docs are either updated first (with approval) or the code is wrong.

## Start here

| If you are... | Read |
|---|---|
| New to the project (human or AI) | `PROJECT_CONTEXT.md`, then `00-overview/` |
| About to write code with Claude Code | `CLAUDE.md` (rules), then the phase file in `08-phases/` |
| Designing a screen | `06-design/` and the matching feature in `05-features/` |
| Adding an API | `04-api/01-conventions.md`, then the relevant API file |
| Touching the database | `03-database/` |
| Setting up a machine or a server | `09-config/` |
| Writing or running tests | `10-testing/` |

## Folder map

| Folder | Purpose |
|---|---|
| `00-overview/` | What the product is, vision, success criteria, decision log, glossary |
| `01-requirements/` | Functional and non-functional requirements with IDs (FR-xx, NFR-xx), roles, scope boundaries |
| `02-architecture/` | System architecture, tech stack, folder structure, security, deployment topology |
| `03-database/` | Models, ER diagram, indexes, constraints, seed strategy |
| `04-api/` | REST API contract: conventions, every endpoint, request/response shapes, error codes |
| `05-features/` | Feature specifications with user flows, business rules, edge cases and acceptance criteria |
| `06-design/` | Design system (tokens, typography, components), page layouts, responsive and accessibility rules |
| `07-content/` | Temple content guidelines, initial temple and circuit list, SEO rules |
| `08-phases/` | Development phases in order, each with tasks, deliverables and exit criteria |
| `09-config/` | Environment variables, local setup, third-party service setup, scripts |
| `10-testing/` | Test strategy, critical test cases, end-to-end journeys, Definition of Done |

## Conventions used in these docs

- Requirement IDs: `FR-TEMPLE-01`, `NFR-SEC-03`. Features and tests reference these IDs.
- Priority: **Must** (release blocker), **Should** (planned, can slip one phase), **Could** (nice to have, needs approval).
- Diagrams are Mermaid so they render on GitHub and stay editable.
- Status words for a phase: `planned`, `in-progress`, `done`. Only `done` after exit criteria pass.

## Keeping docs in sync

Every pull request or phase report that changes behaviour must update the relevant doc in the same change. `00-overview/03-decision-log.md` records every non-trivial choice and why.
