# Safe-First Refactor Plan (Container-Ready + Performance-Centric)

## Objective
Refactor MenuMaker into a future-proof architecture while keeping runtime behavior equivalent to today:
- same user workflows (create/open/wizard/edit/assets/save/export),
- same bridge API semantics,
- same import/export compatibility,
- same interactive template behavior (`focus-rows`, `jukebox`).

The refactor is explicitly designed to support containerized execution and faster, asset-rich exported static sites.

## Current baseline (post-Phase-8 snapshot)
- App behavior orchestration is still concentrated in `src/App.svelte` (~6k lines), but major logic is now extracted to `core`, `application`, `infrastructure`, and `ui` modules.
- Bridge API contract remains stable in `vite.config.ts` with adapter usage in `src/infrastructure/bridge/*`.
- Export runtime builder (`buildExportScript`) is still generated inline from `src/App.svelte` (known remaining extraction item).
- Containerized workflows are implemented (`Dockerfile.dev`, `Dockerfile.prod`, `docker-compose.yml`, `scripts/container-smoke.sh`).
- Export diagnostics and budgets are implemented (`asset-manifest.json`, `export-report.json`, `npm run test:perf`).
- Template capability matrix and strategy interface are implemented (`src/core/templates/registry.ts`).
- Validation status:
  - `npm run build` passes,
  - `npm test` passes,
  - `npm run test:e2e` and `npm run test:perf` are available for smoke/perf validation.

## Non-negotiable guardrails
1. Behavior parity first, architecture second.
2. No breaking schema changes to `menu.json` without migration and compatibility tests.
3. Keep bridge endpoint behavior stable during extraction.
4. Keep exported static zip layout stable unless versioned and explicitly approved.
5. One high-coupling subsystem per phase; no multi-axis refactors.
6. Every phase ends with measurable validation gates.

## Active execution notes
- Phase status board: `PHASE_STATUS_TRACKER.md`
- Phase-0 parity contract/checklist: `PHASE0_PARITY_CONTRACT.md`

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

## Asset derivative pipeline (new requirement)

## Product requirement
- Process uploaded/imported media into fixed-size derivatives at asset import time.
- Keep original files for source-of-truth editing and future regeneration.
- Save project zips must include both originals and generated derivatives.
- Exported site zips must include derivatives only (no originals).

## Storage direction
Project asset folder shape should evolve toward explicit originals vs generated derivatives:
```text
public/projects/<slug>/assets/
  originals/
    backgrounds/
    dishes/
  derived/
    backgrounds/
    dishes/
```

## Derivative profiles (initial)
Use medium + large variants as the default profile.

Background derivatives:
- fixed viewport-oriented targets based on common screens:
  - `bg-md`: `1280x720`
  - `bg-lg`: `1920x1080`
- fit mode: `cover` (fill viewport, preserve aspect ratio, center crop).

Dish derivatives:
- fixed square targets:
  - `dish-md`: `512x512`
  - `dish-lg`: `768x768`
- fit mode: `contain` on transparent canvas (preserve full dish silhouette, no cropping).

## Processing and compatibility notes
- Preserve alpha channel for dish assets.
- Treat animated inputs (gif/webp) as first-class: resizing must preserve animation, not first-frame fallback.
- Generate derivatives with `ffmpeg` in the bridge/infrastructure pipeline to keep output deterministic across environments.
- Prefer animated `webp` derivatives for speed/size; keep originals unchanged under `assets/originals/**`.
- Optional compatibility mode can emit both `webp` + `gif` derivatives when a target environment needs gif fallback.
- Representative `ffmpeg` filter strategy:
  - Background (`cover`): `scale(...:force_original_aspect_ratio=increase)` + centered `crop`.
  - Dish (`contain` + transparency): `scale(...:force_original_aspect_ratio=decrease)` + transparent `pad`.
- Add derivative metadata fields for `format`, `width`, `height`, and `profileId`.
- Ensure `ffmpeg` availability in local/container workflows (`Dockerfile.dev`, `Dockerfile.prod` or sidecar worker image).
- Keep profile versioning (`profileId`) so future size changes can trigger safe regeneration.

## Save/export behavior contract
- Save project (`*.zip`):
  - include `menu.json`,
  - include `assets/originals/**`,
  - include `assets/derived/**`,
  - keep mapping metadata needed to regenerate or remap paths safely.
- Export site (`*-export.zip`):
  - include only `assets/derived/**` + runtime shell files,
  - rewrite all runtime media references to derivative paths,
  - fail export (or report explicit warning policy) when required derivative is missing.

## Suggested implementation order
1. Define derivative metadata in schema and normalization.
2. Add import/upload processing service + job state tracking (`ffmpeg` adapter).
3. Route preview/runtime source selection to derived paths only.
4. Update save/export packaging rules.
5. Add tests for animated-alpha assets and path rewriting parity.

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

## Phase 0: Preview/Export parity foundation
- Define a strict parity contract (preview vs exported static site) for:
  - template navigation and snapping behavior,
  - dish modal open/close and media behavior,
  - dish rotation direction behavior,
  - keyboard controls (`Arrow*`, `Escape`),
  - image source selection (`carousel` vs `detail`),
  - locale and currency rendering output.
- Build and track a drift inventory of duplicated runtime logic between app preview and export runtime.
- Introduce parity-focused tests that validate preview behavior against exported site behavior using shared fixtures.
- Add a hard parity gate to required validation for feature phases.

Exit criteria:
- parity contract is documented and versioned,
- parity test coverage exists for critical interaction flows,
- no known high-severity preview/export behavior drift remains open.

Status:
- In progress.

Phase-0 extension for derivative requirement:
- Include parity assertions that preview and exported site resolve the same derivative variant classes (`background md/lg`, `dish md/lg`) for identical viewport conditions.

## Phase 1: Refactor scaffolding + test stabilization
- Introduce target folder structure (without behavior changes).
- Fix runner boundaries and stale tests.
- Add parity fixture set from current sample project.

Exit criteria:
- green build + unit + e2e smoke,
- no user-visible behavior changes.

Status:
- Completed.

## Phase 2: Domain extraction (`core`)
- Move `normalizeProject`, localization helpers, currency formatting, allergen helpers into pure modules.
- Add unit tests for schema normalization and locale fallback rules.
- Add derivative/original media metadata normalization and migration defaults.

Exit criteria:
- no UI regression,
- pure-domain tests cover migration/defaulting paths.

Status:
- Completed.

## Phase 3: Infrastructure adapters
- Extract bridge client and filesystem operations into adapter interfaces.
- Keep existing endpoint contract and path rules intact.
- Add contract tests for slug/path normalization and move/rename safety.
- Add asset-processing adapter contract for derivative generation at import/upload time.

Exit criteria:
- asset workflows parity in both modes,
- same bridge semantics from UI perspective.

Status:
- Completed.

## Phase 4: Import/export isolation
- Move zip read/write and static export assembly to `application/export` + `infrastructure/*`.
- Extract export runtime builder from `App.svelte`.
- Add golden tests for export zip structure and key file content checks.
- Enforce save/export packaging split:
  - save includes originals + derivatives,
  - export includes derivatives only.

Exit criteria:
- exported zip file set unchanged (unless versioned),
- import compatibility retained for stored zip entries.

Status:
- Mostly completed:
  - import/export helpers and diagnostics are extracted to `src/application/export/*`,
  - zip/project import helpers are extracted to `src/application/projects/*`,
  - remaining deferred item: exported runtime script builder is still inline in `src/App.svelte`.

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

Status:
- Completed.

## Phase 6: Containerization enablement
- Add Dockerfiles + compose + volume mapping for `public/projects`.
- Document local container workflows for dev/build/test.
- Add container smoke checks for bridge and export flows.

Exit criteria:
- app works in container with same core behaviors,
- parity checklist still passes.

Status:
- Completed.

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

Status:
- Implemented on this branch:
  - capability matrix + strategy registry in `src/core/templates/registry.ts`,
  - `PreviewCanvas` and app interaction handlers now consume template capabilities/strategy interfaces,
  - template smoke fixture path added via `public/projects/sample-jukebox-smoke/menu.json`,
  - e2e smoke coverage includes fixture-based jukebox strategy shell validation.

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
