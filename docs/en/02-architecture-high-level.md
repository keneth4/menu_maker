# 02 - Architecture High-Level

## Layer model
The codebase follows a layered structure:
- `core`: domain and normalization logic (pure behavior)
- `application`: workflow/use-case logic
- `ui/controllers`: orchestration and UI-side effects
- `ui/components`: rendering and UI composition
- `infrastructure`: bridge/filesystem adapters
- `export-runtime`: static runtime script generation

## Dependency direction rules
Allowed direction:
- `ui/components -> ui/controllers -> application -> core`
- `application -> infrastructure` (for I/O adapters)
- `application -> export-runtime` (for export orchestration)

Forbidden direction:
- `core` importing from `ui/*`
- `infrastructure` importing from `ui/components`
- `export-runtime` importing `ui/controllers`

## Ownership map (critical modules)
- Runtime composition shell:
  - `src/App.svelte`
  - `src/ui/components/AppRuntime.svelte`
  - `src/ui/components/AppRuntimeScreen.svelte`
  - `src/ui/components/AppRuntimeScreenContent.svelte`
- Runtime controller composition:
  - `src/ui/controllers/runtimeWiringController.ts`
  - `src/ui/controllers/runtimeBindingsController.ts`
  - `src/ui/controllers/runtimeBootstrapController.ts`
  - `src/ui/controllers/runtimeStateBridgeController.ts`
- Project workflows:
  - `src/ui/controllers/projectWorkflowController.ts`
  - `src/ui/controllers/editorDraftController.ts`
  - `src/application/projects/*`
- Preview behavior:
  - `src/ui/controllers/runtimePreviewAdapterController.ts`
  - `src/ui/controllers/previewController.ts`
  - `src/ui/controllers/previewNavigationController.ts`
  - `src/ui/controllers/previewBackgroundController.ts`
- Export runtime:
  - `src/export-runtime/buildRuntimeScript.ts`
  - `src/export-runtime/fragments/runtimeScriptComposer.ts`

## Contracts
Primary contract surfaces:
- `src/ui/contracts/state.ts`
- `src/ui/contracts/actions.ts`
- `src/ui/contracts/components.ts`

These files are the typed boundary between runtime orchestration and UI component usage.

## Diagram
- Layered architecture source: [`../diagrams/layered-architecture.mmd`](../diagrams/layered-architecture.mmd)
