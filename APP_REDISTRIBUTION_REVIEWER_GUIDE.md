# App.svelte Redistribution Reviewer Guide

This guide maps former `src/App.svelte` hotspot responsibilities to their new homes after the redistribution redesign.

## Documentation map
- English architecture set: `docs/en/INDEX.md`
- Spanish architecture set: `docs/es/INDICE.md`
- Shared diagram sources: `docs/diagrams/`

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

## Current Runtime/Validation Status (2026-02-17)
- Runtime size closeout remains within architecture budgets:
  - `src/App.svelte`: `16` lines
  - `src/ui/components/AppRuntime.svelte`: `8` lines
  - `src/ui/components/AppRuntimeScreen.svelte`: `8` lines
  - `src/ui/components/AppRuntimeScreenContent.svelte`: `896` lines (`<= 900`)
  - `src/export-runtime/buildRuntimeScript.ts`: `12` lines
- Verified gates in this docs-sync pass:
  - `npm run build`: PASS
  - `npm test`: PASS (`62` files, `183` tests)
  - `npm run test:e2e`: FAIL in container-first path (`33 passed`, `3 skipped`, `6 failed`)
  - `PATH="/Users/keneth4/.nvm/versions/node/v25.6.1/bin:$PATH" npm run test:e2e:local`: FAIL (`36 passed`, `1 skipped`, `5 failed`)
  - `npm run test:perf`: PASS (container-first performance path)

Primary open parity regressions are currently concentrated in Jukebox interaction paths:
- `tests/e2e/jukebox-import-reactivity.spec.ts`
- `tests/e2e/jukebox-scroll-parity.spec.ts`
- Jukebox template-switch section assertion in `tests/e2e/app.spec.ts`

Recent architecture/functionality additions reflected in current code:
- project-level interaction sensitivity contract:
  - `src/application/preview/scrollSensitivityWorkflow.ts`
  - `src/ui/controllers/runtimePreviewAdapterController.ts`
  - `src/core/menu/normalization.ts`
  - `src/ui/components/ProjectInfoPanel.svelte`
- role-scoped typography controls for identity/restaurant/title/section/item:
  - `src/lib/types.ts` (`meta.fontRoles`)
  - `src/ui/controllers/editorDraftController.ts`
  - `src/ui/controllers/fontStyleController.ts`
