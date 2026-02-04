# Safe-First Refactor Plan

## Goal
Refactor in small, low-risk steps while keeping the menu editor stable and shippable at every checkpoint.

## Current baseline
- Main behavior is concentrated in `src/App.svelte`.
- Bridge API contract is in `vite.config.ts` and is tightly coupled to frontend calls.
- Import/export and zip flows are high-impact paths.
- `npm run build` passes.
- `npm test` currently fails because `jsdom` is missing.

## Global guardrails
1. Change only one high-coupling subsystem per phase.
2. No schema changes without updating `normalizeProject` behavior.
3. If bridge endpoints change, update frontend call sites in the same change.
4. Keep user-visible behavior unchanged unless explicitly planned.
5. Every phase must pass validation gates before moving forward.

## Validation gates (run each phase)
1. `npm run build`
2. `npm test` (after adding `jsdom`)
3. `npm run test:e2e` (or at least landing + open/create flow smoke check)
4. Manual checks:
   - Create project
   - Open/import project (json + zip)
   - Save project zip
   - Export static site zip
   - Upload/move/delete asset in current mode

## Phase plan

### Phase 0: Test baseline hardening
- Add missing `jsdom` dev dependency.
- Keep existing tests green and stable.
- Add minimal smoke tests for key flows where possible.

### Phase 1: Low-risk extraction (copy/config only)
- Extract UI copy, template options, and static catalogs from `src/App.svelte` into `src/lib/` modules.
- Keep all existing function signatures and behavior unchanged.

### Phase 2: Styling reorganization
- Split `src/app.css` into logical sections/files (layout/editor/preview/assets/wizard/modal).
- Preserve class names and DOM structure.

### Phase 3: Asset operations adapter
- Extract filesystem + bridge asset operations from `src/App.svelte` into a dedicated adapter module.
- Keep current API behavior for:
  - list, upload, mkdir, move, rename, delete, bulk actions.
- Add focused tests for path normalization and move/rename rules.

### Phase 4: Import/export extraction
- Move project zip and static export logic into dedicated `src/lib/` modules.
- Keep output structure and filenames unchanged.
- Preserve current zip compatibility assumptions (stored entries only).

### Phase 5: Project data safety
- Add explicit runtime guards around project loading/import.
- Centralize migration/defaulting behavior in normalization utilities.
- Verify all sample projects in `public/projects/` still load.

### Phase 6: App component decomposition
- Split `src/App.svelte` into focused components (landing, editor tabs, preview, modal).
- Keep state flow and props/events explicit and minimal.
- Ensure no behavior regression in wizard, preview carousel, and editor actions.

## Rollback strategy
1. Keep phases small and atomic.
2. If a phase fails gates, revert only that phase.
3. Do not batch multiple high-coupling changes in one commit.

## Notes for upcoming work
- Start from Phase 0 before any deep refactor so test feedback is reliable.
- Prioritize user-critical paths first: import, save, export, assets.
