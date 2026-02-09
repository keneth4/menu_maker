# MenuMaker Delivery Tracker

This file tracks phase status for the current improvement roadmap. Keep this file updated at the end of each work session.

## Status legend
- `PENDING`: not started
- `IN_PROGRESS`: currently active phase
- `BLOCKED`: waiting on decision/dependency
- `DONE`: phase exit criteria completed

## Current phase
- Active phase: `Phase 1 - Data model + normalization (logo + rotation metadata)`
- Started: `2026-02-09`
- Status: `IN_PROGRESS`

## Phase board
| Phase | Name | Status | Notes |
| --- | --- | --- | --- |
| 0 | Preview/Export parity foundation | DONE | Contract, drift inventory, extraction slice, shared helpers, parity e2e, and required gate path completed. |
| 1 | Data model + normalization (logo + rotation metadata) | IN_PROGRESS | Schema + normalization defaults/migrations implemented; remaining integration updates pending. |
| 2 | Editor/Wizard UX updates | PENDING | Depends on Phase 1 schema defaults. |
| 3 | Modal + rotation behavior update | PENDING | Remove modal direction toggle and use dish config. |
| 4 | Image loading optimization | PENDING | Startup/detail load policy + derived-only runtime source usage. |
| 5 | Desktop keyboard controls | PENDING | Arrow navigation + `Escape` close modal. |
| 6 | Validation + docs sync | PENDING | Full gates + README and docs updates. |

## Phase 0 checklist
- [x] Create a phase tracker with status board.
- [x] Create a parity contract document with acceptance criteria.
- [x] Build drift inventory from current duplicated preview/export runtime logic.
- [x] Define the first extraction slice into shared runtime module(s).
- [x] Implement shared helper module(s) and consume from preview + export builders.
- [x] Add parity e2e spec for preview vs exported-site behavior.
- [x] Wire parity spec as a required gate before feature phases merge.

First extraction slice selected:
- `PHASE0_EXTRACTION_SLICE_01.md`
- Focus: shared image source policy (`srcset`, carousel source, detail source, derivative fallback order).

Implemented:
- New shared module: `src/export-runtime/imageSources.ts`
- Preview now consumes shared helpers via `src/App.svelte`.
- Export runtime helper block is now generated from shared policy via `buildExportRuntimeImageSourceHelpers()`.
- Unit coverage added in `src/export-runtime/imageSources.test.ts`.
- Parity e2e added: `tests/e2e/parity-image-sources.spec.ts`.

Current parity run command:
- `npm run test:e2e -- tests/e2e/parity-image-sources.spec.ts`
- Required gate command: `npm run test:e2e -- tests/e2e/parity-image-sources.spec.ts`

## Asset derivative requirement (added 2026-02-09)
Upload/import processing must generate fixed-size derived assets and keep originals.

Contract:
- Keep originals under `assets/originals/**`.
- Keep resized variants under `assets/derived/**`.
- Save project zips include originals + derived.
- Export zips include derived only.
- Backgrounds use common-screen fixed resolutions (`1280x720`, `1920x1080`) with `cover` fit.
- Dishes use square fixed resolutions (`512x512`, `768x768`) with transparent `contain` fit.
- Derivatives are generated through an `ffmpeg` processing pipeline (animation + alpha preserved).
- Preferred derived delivery format is animated `webp` (optional gif fallback profile).

Tracking checklist:
- [x] Schema + normalization for originals/derived metadata and profile versioning.
- [ ] Bridge/import-time processing pipeline for animated and transparent assets (`ffmpeg`).
- [ ] Ensure `ffmpeg` is available in local + container execution paths.
- [ ] Preview/export source selection switched to derived variants.
- [ ] Save packaging includes originals + derived.
- [ ] Export packaging includes derived only + rewrite validation.
- [ ] Test coverage for animated-alpha inputs and packaging contracts.

## Drift inventory (2026-02-09)
| Priority | Hotspot | Preview runtime location | Export runtime location | Drift impact | Candidate shared module |
| --- | --- | --- | --- | --- | --- |
| P0 | Template interaction constants + wheel/touch normalization | `src/core/templates/registry.ts`, `src/core/templates/strategies/*`, `src/App.svelte` | `src/App.svelte` (`buildExportScript` constants + handlers) | Template navigation behavior can diverge between preview and exported site. | `src/export-runtime/templateInteraction.ts` |
| P0 | Interactive modal media decode/render pipeline | `src/App.svelte` (`setupInteractiveDetailMedia`) | `src/App.svelte` (`setupInteractiveModalMedia` inside export script) | 360 media behavior/fallbacks can drift and cause modal mismatch. | `src/export-runtime/interactiveMedia.ts` |
| P0 | Modal lifecycle and rotation-state handling | `src/App.svelte` (`openDish`/`closeDish`) + `src/ui/components/DishModal.svelte` | `src/App.svelte` (`bindCards` + `closeModal`) | Open/close semantics and rotation behavior can diverge quickly. | `src/export-runtime/modalController.ts` |
| P1 | Image source policy (`srcset`, carousel source, detail source) | `src/App.svelte` (`buildResponsiveSrcSetFromMedia`, `getCarouselImageSource`, `getDetailImageSource`) | `src/App.svelte` (`buildSrcSet`, `getCarouselImageSrc`, `getDetailImageSrc`) | Different image sizes loaded in preview vs export affects UX/perf parity. | `src/export-runtime/imageSources.ts` |
| P1 | Startup preload plan and blocking/deferred strategy | `src/App.svelte` (`collectPreviewStartupPlan`, `preloadPreviewStartupAssets`) + `src/core/menu/startupAssets.ts` | `src/App.svelte` (`preloadStartupAssets`) | First-view loading and perceived speed can diverge. | `src/export-runtime/startupPreload.ts` |
| P1 | Locale/allergen/price formatting helpers | `src/App.svelte` (`textOf`, `getAllergenValues`, `formatPrice`) + `src/core/menu/*` | `src/App.svelte` (export runtime helper copies) | Text fallback and price rendering can mismatch in edge locales. | `src/export-runtime/localization.ts` |
| P2 | Preview DOM/template render structure | `src/ui/components/PreviewCanvas.svelte` | `src/App.svelte` (HTML template string in export runtime render) | UI-level changes can be applied to preview but missed in export render. | `src/export-runtime/renderTemplates.ts` |
| P2 | Event wiring + cleanup lifecycle | Svelte lifecycle + handler bindings in `src/App.svelte` | Imperative DOM bindings in export runtime string | Lifecycle regressions may appear only in one runtime. | `src/export-runtime/events.ts` |

## Session log
### 2026-02-09
- Initialized phase tracking.
- Marked Phase 0 as active.
- Added references in `SAFE_FIRST_REFACTOR_PLAN.md` to tracker and parity contract docs.
- Added prioritized preview/export drift inventory for parity extraction planning.
- Added asset-derivative requirement and packaging rules to roadmap tracking.
- Selected first Phase-0 extraction slice and documented scope/acceptance criteria.
- Implemented extraction slice 01 (shared image source policy) and validated with targeted tests + build.
- Added and validated parity e2e spec for shared image source policy (preview vs exported runtime).
- Wired parity spec as explicit required gate command path in phase gates.
- Closed Phase 0 and moved active work to Phase 1.
- Implemented Phase 1 schema + normalization defaults for identity/logo, dish rotation, and original/derived metadata fields.
