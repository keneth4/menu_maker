# App.svelte Redistribution Reviewer Guide

This guide maps former `src/App.svelte` hotspot responsibilities to their new homes after the redistribution redesign.

## Entry Shell
- `src/App.svelte`
  - now only mounts/destroys `createAppController()` and renders `AppRuntime`.

## Runtime Host
- `src/ui/components/AppRuntime.svelte`
  - thin runtime wrapper that delegates to `AppRuntimeScreen`.
- `src/ui/components/AppRuntimeScreen.svelte`
  - thin composition shell that delegates to `AppRuntimeScreenContent`.
- `src/ui/components/AppRuntimeScreenContent.svelte`
  - current runtime orchestration host while final redistribution slices are completed.
- `src/ui/components/RuntimeWorkspace.svelte`
  - extracted landing/editor/preview workspace shell host.

## State / Contracts / Controllers
- `src/ui/contracts/state.ts`
- `src/ui/contracts/actions.ts`
- `src/ui/contracts/components.ts`
- `src/ui/stores/*`
- `src/ui/controllers/createAppController.ts`
  - now exposes real action groups and lifecycle-owned mount/destroy wiring (no no-op action stubs).
- `src/ui/controllers/appLifecycleController.ts`
- `src/ui/controllers/previewController.ts`
- `src/ui/controllers/interactiveMediaController.ts`
- `src/ui/controllers/backgroundRotationController.ts`
- `src/ui/controllers/runtimeBindingsController.ts`
- `src/ui/controllers/runtimeBootstrapController.ts`
- `src/ui/controllers/runtimeStateBridgeController.ts`
  - typed runtime state bridge used by runtime bindings/bootstrap wiring.
- `src/ui/controllers/runtimeWiringController.ts`
  - composes runtime bindings + bootstrap wiring for `AppRuntimeScreenContent`.
- `src/ui/controllers/runtimeModalSurfaceController.ts`
  - owns runtime modal open/close/prefetch delegation plus interactive setup signature sync.
- `src/ui/controllers/runtimeAssetReaderController.ts`
  - isolates asset byte loading policy across filesystem, bridge, and static `/projects/*` fallbacks.
- `src/ui/controllers/runtimeShellDomController.ts`
  - centralizes editor-panel hit testing and landscape lock attempts used by shell orchestration.
- `src/ui/controllers/runtimeDraftMetaController.ts`
  - owns draft meta localized-field hydration (`title`, `restaurantName`).

## Component API Normalization
- New typed `{ model, actions }` wrappers:
  - `src/ui/components/AssetsManager.svelte`
  - `src/ui/components/EditPanel.svelte`
  - `src/ui/components/WizardPanel.svelte`
  - `src/ui/components/PreviewCanvas.svelte`
  - `src/ui/components/DishModal.svelte`
  - `src/ui/components/ProjectInfoPanel.svelte`
  - `src/ui/components/RuntimeSurfaceHost.svelte`
  - `src/ui/components/RuntimeEditorTabContent.svelte`
- Previous implementations preserved as legacy internals:
  - `src/ui/components/AssetsManagerLegacy.svelte`
  - `src/ui/components/EditPanelLegacy.svelte`
  - `src/ui/components/WizardPanelLegacy.svelte`
  - `src/ui/components/PreviewCanvasLegacy.svelte`
  - `src/ui/components/DishModalLegacy.svelte`

## Extracted Application Workflows
- Save/import/session/draft:
  - `src/application/projects/saveWorkflow.ts`
  - `src/application/projects/importWorkflow.ts`
  - `src/application/projects/session.ts`
  - `src/application/projects/draftMutations.ts`
- Asset workspace:
  - `src/application/assets/workspaceWorkflow.ts`
- Preview/startup/navigation:
  - `src/application/preview/startupWorkflow.ts`
  - `src/application/preview/navigationWorkflow.ts`
- Typography:
  - `src/application/typography/fontWorkflow.ts`
- Workflow progress:
  - `src/application/workflow/progress.ts`
- Export flow:
  - `src/application/export/exportSiteWorkflow.ts`

## Export Runtime Decomposition
- `src/export-runtime/buildRuntimeScript.ts`
- `src/export-runtime/fragments/runtimeScriptComposer.ts`
- `src/export-runtime/fragments/runtimeDataFragment.ts`
- `src/export-runtime/fragments/runtimeImageSourcesFragment.ts`
- `src/export-runtime/imageSources.ts`

## Guardrails and Tests
- Architecture guard:
  - `src/App.architecture.test.ts` (thin shell line-count gate)
- New workflow tests:
  - `src/application/export/exportSiteWorkflow.test.ts`
  - `src/application/workflow/progress.test.ts`
- Runtime parity regression tests:
  - `src/ui/components/PreviewCanvas.test.ts`
  - `src/ui/controllers/previewController.test.ts`
  - `src/ui/controllers/previewNavigationController.test.ts`
  - `src/ui/controllers/runtimePreviewAdapterController.test.ts`

## Compatibility Hardening (Test Env)
- `scripts/patch-parse5-for-jsdom.mjs`
  - postinstall compatibility patch for offline/local jsdom+parse5+Node runtime mismatches.

## Current Closeout Status (2026-02-15)
- Container-first gates are operational and passing:
  - `npm run test:e2e` (container-first wrapper path)
  - `ALLOW_CONTAINER_BUILD=1 npm run test:e2e:container` (`36 passed`, `3 skipped`)
  - `npm run test:perf` (container-first performance path)
- Forced container commands are explicit:
  - `npm run test:e2e:container` runs full containerized e2e.
  - `npm run test:perf:container` runs containerized `performance-fluidity` spec.
- Runtime size closeout:
  - `src/ui/components/AppRuntimeScreenContent.svelte` is now `898` lines (within `<= 900` architecture cap).
- Phase 9.4 coherence updates shipped:
  - Project-tab template changes now flow through controller action wiring (`setTemplate -> applyTemplate(..., { source: "project" })`) via:
    - `src/ui/components/ProjectInfoPanel.svelte`
    - `src/ui/components/RuntimeEditorTabContent.svelte`
    - `src/ui/contracts/components.ts`
  - Wizard demo preview now only activates for blank projects using:
    - `src/application/projects/wizardShowcaseEligibility.ts`
    - `src/ui/controllers/editorDraftController.ts`
    - `src/ui/components/AppRuntimeScreenContent.svelte` stale-showcase guard.
  - Jukebox desktop routing/visibility parity hardening:
    - desktop wheel intent routing in `src/ui/controllers/runtimePreviewAdapterController.ts`,
    - desktop-only section-nav contract in `src/ui/components/PreviewCanvasLegacy.svelte`,
    - matching export-runtime nav gating in `src/export-runtime/fragments/runtimeScriptComposer.ts`.
  - Template ID compatibility hardening:
    - alias/canonical normalization in `src/core/templates/registry.ts`,
    - normalization pipeline integration in `src/core/menu/normalization.ts`.
- Regression + gate reliability hardening:
  - Open-project e2e helpers now use deterministic hidden-input uploads across specs (avoids flaky `filechooser` waits under mobile emulation).
  - Interactive modal regression now uses deterministic GIF-data fixture:
    - `tests/e2e/interactive-modal.spec.ts`.
  - Section-background parity settle timing stabilized:
    - `tests/e2e/parity-section-background.spec.ts`.
  - Perf gate now uses percentile-based frame-jitter assertions (`p95`, `p99`) with outlier cap:
    - `tests/e2e/performance-fluidity.spec.ts`.
