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

## Compatibility Hardening (Test Env)
- `scripts/patch-parse5-for-jsdom.mjs`
  - postinstall compatibility patch for offline/local jsdom+parse5+Node runtime mismatches.

## Current Closeout Status (2026-02-14)
- Container-first gates are operational and passing:
  - `npm run test:e2e` (full suite in container-first path)
  - `npm run test:perf` (container-first performance spec path)
- Forced container commands are now explicit:
  - `npm run test:e2e:container` runs full containerized e2e.
  - `npm run test:perf:container` runs containerized `performance-fluidity` spec.
- Remaining architectural hotspot:
  - `src/ui/components/AppRuntimeScreenContent.svelte` now carries `892` lines and is within the closeout budget for this phase.
