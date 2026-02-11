# MenuMaker Delivery Tracker

This file tracks phase status for the current improvement roadmap. Keep this file updated at the end of each work session.

## Status legend
- `PENDING`: not started
- `IN_PROGRESS`: currently active phase
- `BLOCKED`: waiting on decision/dependency
- `DONE`: phase exit criteria completed

## Current phase
- Active phase: `Phase 6 - Validation + docs sync`
- Started: `2026-02-11`
- Status: `IN_PROGRESS`

## Phase board
| Phase | Name | Status | Notes |
| --- | --- | --- | --- |
| 0 | Preview/Export parity foundation | DONE | Contract, drift inventory, extraction slice, shared helpers, parity e2e, and required gate path completed. |
| 1 | Data model + normalization (logo + rotation metadata) | DONE | Schema + normalization + save-zip/export packaging wiring completed for logo + rotation metadata paths. |
| 2 | Editor/Wizard UX updates | DONE | Added identity mode selector + logo source control and dish rotation direction toggle in edit/wizard flows. |
| 3 | Modal + rotation behavior update | DONE | Removed modal direction toggle and now use dish-level `rotationDirection` in preview + export runtime. |
| 4 | Image loading optimization | DONE | Startup/detail load policy + derived source usage + loading placeholder polish (spinner, no white blocks). |
| 5 | Desktop keyboard controls | DONE | Added desktop arrow-key navigation and `Escape` modal close for preview + export runtime parity. |
| 6 | Validation + docs sync | IN_PROGRESS | Final pass on tests/perf checks and docs updates. |

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
- [x] Bridge preprocessing pipeline for animated and transparent assets (`ffmpeg`) during save/export.
- [x] Ensure `ffmpeg` is available in local + container execution paths.
- [x] Preview/export source selection switched to derived variants.
- [x] Save packaging includes originals + derived.
- [x] Export packaging includes derived only + rewrite validation.
- [x] Bridge export integration fixture validates derived-only static exports with transparent GIF input.
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
- Implemented Phase 1 save-zip asset collection + rewriting for logo/original/derived/responsive paths, with tests.
- Implemented identity/logo parity in preview + export runtime topbar rendering.
- Added editor + wizard controls for identity mode/logo source and dish rotation direction metadata.
- Removed modal rotate-toggle UI and switched rotation behavior to dish-level `rotationDirection` in preview + exported runtime.
- Updated static export asset collection/rewrite to include logo asset paths.
- Added desktop keyboard controls (`Arrow*` navigation + `Escape` close) in preview and exported runtime.
- Corrected cw/ccw mapping behavior and switched direction control to a compact toggle below the 360 source input.
- Enforced derived-only export asset collection (excluding originals when derived variants are available).
- Updated exported `menu.json` rewrite flow to remap `derived` + `responsive` paths and drop `originalSrc`/`originalHero360`.
- Added export packaging unit coverage for derived-only source collection.
- Added shared centered-fit helpers for contain padding and cover cropping, including centered ffmpeg filter templates (`(ow-iw)/2`, `(iw-ow)/2`).
- Switched in-app generated responsive variants to centered contain placement to enforce symmetric composition.
- Added bridge ffmpeg preprocessing endpoint (`/api/assets/prepare-derived`) that generates centered background/item derivatives and rewrites project media metadata before export.
- Export flow in bridge mode now calls derived preprocessing before packaging, preventing original-asset fallback when derivatives can be generated.
- Added ffmpeg installation to container images (`Dockerfile.dev`, `Dockerfile.prod` build stage).
- Save flow in bridge mode now runs the same ffmpeg preprocessing before persisting `menu.json` and generating the save zip.
- Added bridge client regression coverage for `/prepare-derived` request/response/error contract.
- Added save/export workflow progress UI with step-by-step status and percentage updates, including a dedicated derived-media processing stage.
- Added bridge e2e integration fixture (`tests/e2e/ffmpeg-derived-export.spec.ts`) that validates static export zips contain derived assets and exclude originals.
- Improved long-running progress behavior so derived-processing stages keep advancing visibly (decimal progress and higher cap).
- Added ZIP-import upload progress workflow (parse/upload/apply) when opening a project from zip in bridge mode.
- ZIP-import in bridge mode now triggers derived-asset preparation after upload, so first export can reuse prebuilt variants.
- Optimized bridge derivation reuse checks and switched dish derivatives to webp-only output profile to avoid long gif fallback transcodes and export timeouts.
- ZIP-import now completes without waiting for full derivation (runs background prep), and save/export reuse the same in-flight derivation task to prevent duplicate ffmpeg work.
- Stabilized derivation naming when source files already live under `originals/**` to prevent recursive re-derivation loops across repeated exports.
- Increased ffmpeg command timeout budget to reduce false timeouts on large animated source assets.
- Tuned ffmpeg derivation profile for throughput by capping animation FPS (`items: 24`, `backgrounds: 18`) and reducing libwebp compression level (`6 -> 4`) to avoid long-running export/import stalls.
- Hardened bridge-derived processing so a single corrupt/unreadable source asset no longer aborts save/export; failed assets now log a warning and continue with the original reference.
- Updated bridge fallback to materialize `originals/**` plus `derived/**` copy-variants when ffmpeg cannot decode an asset, so save/export packaging remains consistent and does not leak original-path references.
- Disabled in-browser responsive resizing for `image/webp` hero assets during static export bundling to prevent animated-frame compositing artifacts in hosted exports.
- Strengthened item-derivative profile for quality/perf parity: medium dish variants are now still-frame `webp` (lighter carousel), large variants remain animated for detail interaction, and alpha handling was tightened with `format=rgba` + `alpha_quality=100`.
- Simplified interactive modal frame normalization to rely on browser-decoded complete frames and avoid manual `visibleRect` recomposition artifacts (ghost/onion edges).
- Added e2e regression coverage for bridge save zips to assert originals + derived packaging contract after ffmpeg preprocessing/fallback (`tests/e2e/ffmpeg-derived-export.spec.ts`).
- Updated derivative reuse rules and bumped active derivative profile IDs (`ffmpeg-v4-*`) to regenerate legacy/stale media once, ensuring projects pick up the latest sizing/alpha/perf profile fixes.

### 2026-02-10
- Refined Phase 4 asset strategy: preview/startup now consumes reduced derived media while detail-card media resolves to `originalHero360` on demand.
- Changed derived generation targets to smaller mirrors (backgrounds scaled to ~50%; dishes to single reduced preview variant) and updated active derivative profile IDs (`ffmpeg-v5-background-half-webp`, `ffmpeg-v7-item-md-webp-detail-original`) for one-time regeneration.
- Restricted user asset management scope to `assets/originals/backgrounds/**` and `assets/originals/items/**`; `derived/**` is now hidden from asset manager operations.
- Added guardrails to prevent rename/move/delete of base managed roots and to reject path traversal/out-of-scope operations.
- Updated export packaging/runtime contract so static export includes `originals/items/**` for detail rendering while still avoiding `originals/backgrounds/**`.
- Fixed bridge derivative reuse staleness checks so existing derived assets are only reused when they are newer than originals; re-uploaded originals now force regeneration on the next derive run.
- ZIP open flow in bridge mode now waits for `prepare-derived` during upload workflow (with progress), instead of deferring derivation silently in the background.
- Assets tab now uses icon-based top/file actions and includes an in-panel progress bar that shows upload + derived-processing status for manual asset uploads.
- Bumped dish derivative profile id to `ffmpeg-v6-item-contain-md-webp-lg-gif` so previously generated dish derivatives are reprocessed once under the latest pipeline.

### 2026-02-11
- Removed visible white/gray placeholder blocks while dish media streams in by switching to a transparent placeholder source.
- Added per-card carousel loading spinner state in both preview and exported runtime so unresolved media shows an intentional loading affordance instead of an empty square.
- Added per-source media readiness tracking in preview (`category + item + source`) to avoid stale loaded-state reuse when item media source paths change.
