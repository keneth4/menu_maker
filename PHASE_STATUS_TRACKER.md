# MenuMaker Delivery Tracker

This file tracks phase status for the current improvement roadmap. Keep this file updated at the end of each work session.

## Status legend
- `PENDING`: not started
- `IN_PROGRESS`: currently active phase
- `BLOCKED`: waiting on decision/dependency
- `DONE`: phase exit criteria completed

## Current phase
- Active phase: `Phase 0 - Preview/Export parity foundation`
- Started: `2026-02-09`
- Status: `IN_PROGRESS`

## Phase board
| Phase | Name | Status | Notes |
| --- | --- | --- | --- |
| 0 | Preview/Export parity foundation | IN_PROGRESS | Contract + tracker created. Shared runtime extraction/test gate pending. |
| 1 | Data model + normalization (logo + rotation metadata) | PENDING | Depends on Phase 0 contract/tests. |
| 2 | Editor/Wizard UX updates | PENDING | Depends on Phase 1 schema defaults. |
| 3 | Modal + rotation behavior update | PENDING | Remove modal direction toggle and use dish config. |
| 4 | Image loading optimization | PENDING | Startup and detail load policy changes. |
| 5 | Desktop keyboard controls | PENDING | Arrow navigation + `Escape` close modal. |
| 6 | Validation + docs sync | PENDING | Full gates + README and docs updates. |

## Phase 0 checklist
- [x] Create a phase tracker with status board.
- [x] Create a parity contract document with acceptance criteria.
- [ ] Build drift inventory from current duplicated preview/export runtime logic.
- [ ] Define the first extraction slice into shared runtime module(s).
- [ ] Add parity e2e spec for preview vs exported-site behavior.
- [ ] Wire parity spec as a required gate before feature phases merge.

## Session log
### 2026-02-09
- Initialized phase tracking.
- Marked Phase 0 as active.
- Added references in `SAFE_FIRST_REFACTOR_PLAN.md` to tracker and parity contract docs.
