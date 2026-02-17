# 03 - Arquitectura Runtime Detalle

## Ruta de composicion runtime
Ruta actual:
- `App.svelte` -> `AppRuntime.svelte` -> `AppRuntimeScreen.svelte` -> `AppRuntimeScreenContent.svelte`

Los primeros tres son shells delgados. `AppRuntimeScreenContent.svelte` contiene la orquestacion runtime dentro del budget de lineas.

## Controllers de wiring runtime
`AppRuntimeScreenContent` compone comportamiento mediante:
- `runtimeWiringController`
- `runtimeBindingsController`
- `runtimeBootstrapController`
- `runtimeStateBridgeController`
- `runtimePreviewAdapterController`
- stack modal/interactivo (`runtimeModalSurfaceController`, `modalController`, `interactiveMediaController`)

## Ownership de lifecycle
- `mount()`:
  - inicializa wiring runtime
  - carga estado de proyectos
  - arranca flows de preview/startup
- `destroy()`:
  - limpia listeners/timers/RAF
  - limpia recursos de media interactiva
  - detiene tasks de progreso

## Modelo de sincronizacion de estado
La coherencia de estado se soporta con:
- slices tipados en `ui/stores/*`
- bridge de estado (`runtimeStateBridgeController`)
- orquestacion reactiva en `AppRuntimeScreenContent`
- sensibilidad de interaccion por proyecto (`meta.scrollSensitivity`) resuelta por `application/preview/scrollSensitivityWorkflow.ts` e inyectada en configuracion de carousel + preview adapter

Regla critica: ownership explicito por controller; evitar mutaciones cruzadas opacas.

## Stack modal + media interactiva
- `runtimeModalSurfaceController` orquesta open/close + prefetch
- `interactiveMediaController` controla render interactivo con decoder
- `modalController` resuelve seleccion y dish activo

## Mapa de ownership runtime (enfoque reviewer)

### Entry y hosts runtime
- `src/App.svelte` (shell de entrada)
- `src/ui/components/AppRuntime.svelte` (wrapper delgado)
- `src/ui/components/AppRuntimeScreen.svelte` (shell delgado)
- `src/ui/components/AppRuntimeScreenContent.svelte` (host de orquestacion)
- `src/ui/components/RuntimeWorkspace.svelte` (shell de landing/editor/preview)
- `src/ui/components/RuntimeEditorTabContent.svelte` (composicion de tabs del editor)

### Estado, contratos y capas de controllers
- Contratos: `src/ui/contracts/state.ts`, `src/ui/contracts/actions.ts`, `src/ui/contracts/components.ts`
- Stores: `src/ui/stores/*`
- Composicion runtime: `src/ui/controllers/runtimeWiringController.ts`, `src/ui/controllers/runtimeStateBridgeController.ts`
- Orquestacion runtime: `src/ui/controllers/runtimeBindingsController.ts`, `src/ui/controllers/runtimeBootstrapController.ts`, `src/ui/controllers/runtimeModalSurfaceController.ts`, `src/ui/controllers/runtimePreviewAdapterController.ts`
- Helpers de shell y politica de IO: `src/ui/controllers/runtimeShellDomController.ts`, `src/ui/controllers/runtimeAssetReaderController.ts`, `src/ui/controllers/runtimeDraftMetaController.ts`

### Superficies de contrato de componentes
Wrappers tipados `{ model, actions }`:
- `src/ui/components/AssetsManager.svelte`
- `src/ui/components/EditPanel.svelte`
- `src/ui/components/WizardPanel.svelte`
- `src/ui/components/PreviewCanvas.svelte`
- `src/ui/components/DishModal.svelte`
- `src/ui/components/ProjectInfoPanel.svelte`
- `src/ui/components/RuntimeSurfaceHost.svelte`

### Workflows de aplicacion extraidos
- Proyectos/sesion/import/save: `src/application/projects/*`
- Workflows de assets/media: `src/application/assets/*`
- Preview/startup/navegacion: `src/application/preview/*`
- Workflows de export: `src/application/export/*`
- Progreso de workflows: `src/application/workflow/progress.ts`

### Decomposicion de runtime exportado
- `src/export-runtime/buildRuntimeScript.ts` (orquestador delgado)
- `src/export-runtime/fragments/runtimeScriptComposer.ts`
- `src/export-runtime/fragments/runtimeDataFragment.ts`
- `src/export-runtime/fragments/runtimeImageSourcesFragment.ts`
- `src/export-runtime/imageSources.ts`

### Endurecimiento de compatibilidad
- `scripts/patch-parse5-for-jsdom.mjs` (patch de compatibilidad postinstall para desajustes locales/offline de jsdom+parse5)

## Mapa rapido para reviewers (donde vive cada responsabilidad)

| Area | Ubicaciones principales |
| --- | --- |
| Entry app y lifecycle mount/destroy | `src/App.svelte`, `src/ui/controllers/createAppController.ts` |
| Bridge tipado de estado y wiring runtime | `src/ui/controllers/runtimeStateBridgeController.ts`, `src/ui/controllers/runtimeWiringController.ts` |
| Orquestacion open/save/export | `src/ui/controllers/projectWorkflowController.ts`, `src/application/export/*` |
| Mutaciones draft en editor/wizard | `src/ui/controllers/editorDraftController.ts`, `src/application/projects/*` |
| Semantica de navegacion/interaccion preview | `src/ui/controllers/previewNavigationController.ts`, `src/ui/controllers/runtimePreviewAdapterController.ts`, `src/core/templates/registry.ts` |
| Comportamiento modal y media interactiva | `src/ui/controllers/runtimeModalSurfaceController.ts`, `src/ui/controllers/interactiveMediaController.ts` |
| Politica de lectura/escritura de assets | `src/ui/controllers/runtimeAssetReaderController.ts`, `src/infrastructure/*`, `vite.config.ts` |
| Ensamblado de runtime exportado y paridad | `src/export-runtime/*`, `src/application/export/exportSiteWorkflow.ts` |

## Referencias de validacion y guardrails
- Guard de arquitectura: `src/App.architecture.test.ts`
- Politica de gates/comandos: `./06-pruebas-y-gates.md`
- Snapshot operativo actual: `./08-estado-actual-snapshot-y-delta.md`
- Archivo historico de fases/programa: `../archive/README.md`

## Diagramas
- Wiring de controllers: [`../diagrams/runtime-controller-wiring.mmd`](../diagrams/runtime-controller-wiring.mmd)
- Secuencia de lifecycle: [`../diagrams/runtime-lifecycle-sequence.mmd`](../diagrams/runtime-lifecycle-sequence.mmd)
