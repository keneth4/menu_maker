# Safe-First Refactor Plan (Container-Ready + Performance-Centric)

## Objective
Refactor MenuMaker into a future-proof architecture while keeping runtime behavior equivalent to today:
- same user workflows (create/open/wizard/edit/assets/save/export),
- same bridge API semantics,
- same import/export compatibility,
- same interactive template behavior (`focus-rows`, `jukebox`).

The refactor is explicitly designed to support containerized execution and faster, asset-rich exported static sites.

## Current baseline (verified on this branch)
- Most behavior remains concentrated in `src/App.svelte` (~7.8k lines).
- Bridge API and filesystem concerns are coupled inside `vite.config.ts` + UI state logic.
- Export runtime (`buildExportScript`) is generated inline from `src/App.svelte`.
- `npm run build` passes.
- `npm test` passes (Vitest isolated from Playwright e2e specs).
- `npm run test:e2e` passes with baseline smoke coverage for:
  - landing,
  - create project,
  - open json,
  - open zip,
  - save/export downloads.
- No first-class container files exist yet (`Dockerfile`, `docker-compose` not present).

## Non-negotiable guardrails
1. Behavior parity first, architecture second.
2. No breaking schema changes to `menu.json` without migration and compatibility tests.
3. Keep bridge endpoint behavior stable during extraction.
4. Keep exported static zip layout stable unless versioned and explicitly approved.
5. One high-coupling subsystem per phase; no multi-axis refactors.
6. Every phase ends with measurable validation gates.

## Target architecture (future-proof)

## A) Layered boundaries
- `core` (pure domain): types, normalization, validation, template capability matrix.
- `application` (use-cases): create/open/save/export/wizard/asset orchestration.
- `infrastructure` (adapters): bridge API, filesystem API, zip, image processing, fetch.
- `ui` (Svelte components + stores): presentation and interaction only.
- `export-runtime` (shared web runtime): static-site script/runtime assembly decoupled from `App.svelte`.

## B) Proposed directory direction
- `src/core/menu/*`
- `src/core/templates/*`
- `src/application/projects/*`
- `src/application/assets/*`
- `src/application/export/*`
- `src/infrastructure/bridge/*`
- `src/infrastructure/filesystem/*`
- `src/infrastructure/zip/*`
- `src/infrastructure/media/*`
- `src/ui/components/*`
- `src/ui/stores/*`
- `src/export-runtime/*`

## C) State model direction
- Central `project store` for canonical draft/project state.
- `asset store` for filesystem/bridge tree and selection.
- `ui store` for editor/wizard/preview mode state.
- Derived selectors for localized text, template render items, wizard validity.

## D) Template expansion contract
- Add a template capability matrix (navigation model, interaction mode, required assets, fallbacks).
- Keep template-specific logic in isolated strategy modules instead of inside `App.svelte`.

## Containerization plan (parity-preserving)

## Goals
- Run dev/editor in container without changing app behavior.
- Keep bridge-backed asset persistence via mounted volume.
- Validate exported static zips in a lightweight container server.

## Deliverables
1. `Dockerfile.dev`:
   - Node 20 image,
   - installs deps,
   - runs Vite dev server.
2. `Dockerfile.prod`:
   - multi-stage build (build + serve),
   - serves `dist/`.
3. `docker-compose.yml`:
   - `app` service for editor/dev,
   - persistent volume for `public/projects`,
   - optional `preview` service for exported site checks.
4. Environment contract:
   - explicit host/port config,
   - clear mount points for project assets.

## Critical parity note
Containerization must not alter:
- bridge URL contract (`/api/assets/*`),
- slug/path normalization behavior,
- import/export file structure.

## Export performance plan (asset-rich + fast loading)

## Performance budgets (initial)
- Export JS gzip <= 95 KB (currently ~80.75 KB gzip in app build baseline).
- CSS gzip <= 12 KB.
- Exported first-view image payload <= 1.2 MB on default sample profile.
- Startup loader to interactive <= 2.5s on mid-tier mobile profile (internal benchmark).

## Export pipeline improvements
1. Keep responsive variants generation but move into dedicated media/export service.
2. Add deterministic export manifest (`asset-manifest.json`) for diagnostics and validation.
3. Add per-export report:
   - asset counts,
   - total bytes,
   - missing assets,
   - responsive coverage.
4. Keep `ImageDecoder` enhancement path with graceful fallback.
5. Add strict checks for broken asset references before zip generation.

## Runtime loading improvements
1. Prioritized preload list for first visible assets only.
2. Keep lazy loading for non-visible dish media.
3. Ensure template runtime avoids unnecessary reflows during carousel updates.
4. Maintain startup loader semantics while reducing total blocking asset set.

## Test and validation strategy

## Gate 0 (baseline hardening, before deep refactor)
1. Split test runners:
   - Vitest only for unit/component tests.
   - Playwright only via `npm run test:e2e`.
2. Update stale copy assertions in:
   - `src/App.test.ts`
   - `tests/e2e/app.spec.ts`
3. Add smoke checks for these critical flows:
   - create project,
   - open `.json`,
   - open `.zip`,
   - save project zip,
   - export static site zip.

Status:
- Completed on this branch.

## Per-phase required gates
1. `npm run build`
2. `npm test`
3. `npm run test:e2e` (or documented fallback smoke if CI browsers unavailable)
4. Static export validation:
   - unzip and verify required files,
   - verify `menu.json` paths and responsive entries.
5. Manual parity checklist:
   - wizard progress logic,
   - assets CRUD (bridge and/or filesystem mode),
   - modal media interactions,
   - template navigation parity.

## Phase roadmap

## Phase 1: Refactor scaffolding + test stabilization
- Introduce target folder structure (without behavior changes).
- Fix runner boundaries and stale tests.
- Add parity fixture set from current sample project.

Exit criteria:
- green build + unit + e2e smoke,
- no user-visible behavior changes.

## Phase 2: Domain extraction (`core`)
- Move `normalizeProject`, localization helpers, currency formatting, allergen helpers into pure modules.
- Add unit tests for schema normalization and locale fallback rules.

Exit criteria:
- no UI regression,
- pure-domain tests cover migration/defaulting paths.

## Phase 3: Infrastructure adapters
- Extract bridge client and filesystem operations into adapter interfaces.
- Keep existing endpoint contract and path rules intact.
- Add contract tests for slug/path normalization and move/rename safety.

Exit criteria:
- asset workflows parity in both modes,
- same bridge semantics from UI perspective.

## Phase 4: Import/export isolation
- Move zip read/write and static export assembly to `application/export` + `infrastructure/*`.
- Extract export runtime builder from `App.svelte`.
- Add golden tests for export zip structure and key file content checks.

Exit criteria:
- exported zip file set unchanged (unless versioned),
- import compatibility retained for stored zip entries.

## Phase 5: UI decomposition (Svelte)
- Decompose `App.svelte` into:
  - `LandingView`,
  - `EditorShell`,
  - `AssetsManager`,
  - `EditPanel`,
  - `WizardPanel`,
  - `PreviewCanvas`,
  - `DishModal`.
- Keep current CSS class hooks to reduce style regression risk.

Exit criteria:
- behavior parity checklist passes,
- component boundaries align with stores/use-cases.

## Phase 6: Containerization enablement
- Add Dockerfiles + compose + volume mapping for `public/projects`.
- Document local container workflows for dev/build/test.
- Add container smoke checks for bridge and export flows.

Exit criteria:
- app works in container with same core behaviors,
- parity checklist still passes.

## Phase 7: Performance hardening (export + runtime)
- Implement export diagnostics manifest/report.
- Add performance thresholds in CI checks.
- Tune startup preload strategy and runtime rendering hot paths.

Status:
- Implemented on this branch:
  - export now emits `asset-manifest.json` and `export-report.json`,
  - startup preloading now uses blocking-first + deferred warmup strategy,
  - `npm run test:perf` validates export diagnostics and budget checks through e2e export flow.

Exit criteria:
- budget targets met or explicitly baselined with approved exceptions,
- no regression in interaction quality.

## Phase 8: Template system expansion readiness
- Implement capability matrix and template strategy interface.
- Ensure adding new template does not require editing core UI shell.
- Add at least one template smoke test fixture path.

Exit criteria:
- extensibility achieved with low coupling,
- existing template behavior unchanged.

## Rollback and release strategy
1. Keep each phase in separate PR(s) with explicit parity checklist.
2. If any gate fails, rollback only that phase.
3. Avoid mixing container/performance/template work in the same PR.
4. Tag stable checkpoints after Phases 2, 4, 6, and 8.

## Definition of done for this refactor program
- Architecture split implemented across core/application/infrastructure/ui layers.
- Containerized dev/build workflow available and documented.
- Behavior parity validated for critical user and export flows.
- Export pipeline provides measurable asset/performance diagnostics.
- New template development can be added through strategy modules, not monolithic edits.
