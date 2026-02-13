# App.svelte Redistribution Reviewer Guide

This guide maps former `src/App.svelte` hotspot responsibilities to their new homes after the redistribution redesign.

## Entry Shell
- `src/App.svelte`
  - now only mounts/destroys `createAppController()` and renders `AppRuntime`.

## Runtime Host
- `src/ui/components/AppRuntime.svelte`
  - thin runtime wrapper that delegates to `AppRuntimeScreen`.
- `src/ui/components/AppRuntimeScreen.svelte`
  - current runtime orchestration host while final redistribution slices are completed.

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

## Component API Normalization
- New typed `{ model, actions }` wrappers:
  - `src/ui/components/AssetsManager.svelte`
  - `src/ui/components/EditPanel.svelte`
  - `src/ui/components/WizardPanel.svelte`
  - `src/ui/components/PreviewCanvas.svelte`
  - `src/ui/components/DishModal.svelte`
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
