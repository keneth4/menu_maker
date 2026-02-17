# 03 - Architecture Runtime Deep Dive

## Runtime composition path
Current runtime path is:
- `App.svelte` -> `AppRuntime.svelte` -> `AppRuntimeScreen.svelte` -> `AppRuntimeScreenContent.svelte`

The first three are thin composition shells. `AppRuntimeScreenContent.svelte` is the runtime orchestration host within the current line-budget guard.

## Runtime wiring controllers
`AppRuntimeScreenContent` composes runtime behavior via:
- `runtimeWiringController`
- `runtimeBindingsController`
- `runtimeBootstrapController`
- `runtimeStateBridgeController`
- `runtimePreviewAdapterController`
- modal + interactive media controllers (`runtimeModalSurfaceController`, `modalController`, `interactiveMediaController`)

## Lifecycle ownership
- `mount()` responsibilities:
  - initialize runtime wiring
  - resolve project/list state
  - initialize preview/startup flows
- `destroy()` responsibilities:
  - remove listeners/timers/RAF loops
  - cleanup interactive modal media resources
  - clear workflow pulse tasks

## State synchronization model
State coherence is managed by:
- typed store slices (`ui/stores/*`)
- binding bridge (`runtimeStateBridgeController`)
- reactive orchestration in runtime content host
- project-scoped interaction sensitivity (`meta.scrollSensitivity`) resolved through `application/preview/scrollSensitivityWorkflow.ts` and injected into carousel + preview adapter config

Critical rule: state ownership should remain explicit per controller; avoid hidden cross-controller mutation paths.

## Modal and interactive media stack
- `runtimeModalSurfaceController` orchestrates modal open/close and prefetch intent
- `interactiveMediaController` controls decoder-driven interactive rendering
- `modalController` owns selection and resolve-active-dish semantics

## Runtime ownership map (reviewer-focused)

### Entry and runtime hosts
- `src/App.svelte` (entry shell)
- `src/ui/components/AppRuntime.svelte` (thin wrapper)
- `src/ui/components/AppRuntimeScreen.svelte` (thin shell)
- `src/ui/components/AppRuntimeScreenContent.svelte` (runtime orchestration host)
- `src/ui/components/RuntimeWorkspace.svelte` (landing/editor/preview workspace shell)
- `src/ui/components/RuntimeEditorTabContent.svelte` (editor tab composition)

### State, contracts, and controller layers
- Contracts: `src/ui/contracts/state.ts`, `src/ui/contracts/actions.ts`, `src/ui/contracts/components.ts`
- Stores: `src/ui/stores/*`
- Runtime composition: `src/ui/controllers/runtimeWiringController.ts`, `src/ui/controllers/runtimeStateBridgeController.ts`
- Runtime behavior orchestration: `src/ui/controllers/runtimeBindingsController.ts`, `src/ui/controllers/runtimeBootstrapController.ts`, `src/ui/controllers/runtimeModalSurfaceController.ts`, `src/ui/controllers/runtimePreviewAdapterController.ts`
- Shell and IO policy helpers: `src/ui/controllers/runtimeShellDomController.ts`, `src/ui/controllers/runtimeAssetReaderController.ts`, `src/ui/controllers/runtimeDraftMetaController.ts`

### Component contract surfaces
Typed `{ model, actions }` component wrappers:
- `src/ui/components/AssetsManager.svelte`
- `src/ui/components/EditPanel.svelte`
- `src/ui/components/WizardPanel.svelte`
- `src/ui/components/PreviewCanvas.svelte`
- `src/ui/components/DishModal.svelte`
- `src/ui/components/ProjectInfoPanel.svelte`
- `src/ui/components/RuntimeSurfaceHost.svelte`

### Extracted application workflows
- Projects/session/import/save: `src/application/projects/*`
- Assets/media workflows: `src/application/assets/*`
- Preview/startup/navigation: `src/application/preview/*`
- Export workflows: `src/application/export/*`
- Workflow progress: `src/application/workflow/progress.ts`

### Export runtime decomposition
- `src/export-runtime/buildRuntimeScript.ts` (thin orchestrator)
- `src/export-runtime/fragments/runtimeScriptComposer.ts`
- `src/export-runtime/fragments/runtimeDataFragment.ts`
- `src/export-runtime/fragments/runtimeImageSourcesFragment.ts`
- `src/export-runtime/imageSources.ts`

### Compatibility hardening
- `scripts/patch-parse5-for-jsdom.mjs` (postinstall compatibility patch for local/offline jsdom+parse5 runtime mismatches)

## Reviewer quick map (where responsibility lives now)

| Concern | Primary locations |
| --- | --- |
| App entry and lifecycle mount/destroy | `src/App.svelte`, `src/ui/controllers/createAppController.ts` |
| Runtime state bridge and wiring | `src/ui/controllers/runtimeStateBridgeController.ts`, `src/ui/controllers/runtimeWiringController.ts` |
| Project open/save/export orchestration | `src/ui/controllers/projectWorkflowController.ts`, `src/application/export/*` |
| Editor/wizard draft mutations | `src/ui/controllers/editorDraftController.ts`, `src/application/projects/*` |
| Preview navigation and interaction semantics | `src/ui/controllers/previewNavigationController.ts`, `src/ui/controllers/runtimePreviewAdapterController.ts`, `src/core/templates/registry.ts` |
| Modal and interactive media behavior | `src/ui/controllers/runtimeModalSurfaceController.ts`, `src/ui/controllers/interactiveMediaController.ts` |
| Asset read/write policy (bridge/filesystem/static fallback) | `src/ui/controllers/runtimeAssetReaderController.ts`, `src/infrastructure/*`, `vite.config.ts` |
| Exported runtime parity assembly | `src/export-runtime/*`, `src/application/export/exportSiteWorkflow.ts` |

## Validation and guardrail references
- Architecture guard: `src/App.architecture.test.ts`
- Gate commands and policy: `./06-testing-and-gates.md`
- Current-state operational snapshot: `./08-current-state-snapshot-and-delta.md`
- Historical phase/program archive: `../archive/README.md`

## Diagrams
- Controller wiring source: [`../diagrams/runtime-controller-wiring.mmd`](../diagrams/runtime-controller-wiring.mmd)
- Lifecycle sequence source: [`../diagrams/runtime-lifecycle-sequence.mmd`](../diagrams/runtime-lifecycle-sequence.mmd)
