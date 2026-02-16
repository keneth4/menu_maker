# 02 - Arquitectura Alto Nivel

## Modelo por capas
Estructura principal:
- `core`: reglas de dominio y normalizacion (logica pura)
- `application`: workflows/casos de uso
- `ui/controllers`: orquestacion y side effects de UI
- `ui/components`: render y composicion visual
- `infrastructure`: adaptadores bridge/filesystem
- `export-runtime`: generacion de script runtime exportado

## Reglas de direccion de dependencias
Direccion permitida:
- `ui/components -> ui/controllers -> application -> core`
- `application -> infrastructure`
- `application -> export-runtime`

Direccion prohibida:
- `core` importando `ui/*`
- `infrastructure` importando `ui/components`
- `export-runtime` importando `ui/controllers`

## Mapa de ownership (modulos criticos)
- Shell runtime:
  - `src/App.svelte`
  - `src/ui/components/AppRuntime.svelte`
  - `src/ui/components/AppRuntimeScreen.svelte`
  - `src/ui/components/AppRuntimeScreenContent.svelte`
- Composicion de controllers runtime:
  - `src/ui/controllers/runtimeWiringController.ts`
  - `src/ui/controllers/runtimeBindingsController.ts`
  - `src/ui/controllers/runtimeBootstrapController.ts`
  - `src/ui/controllers/runtimeStateBridgeController.ts`
- Workflows de proyecto:
  - `src/ui/controllers/projectWorkflowController.ts`
  - `src/ui/controllers/editorDraftController.ts`
  - `src/application/projects/*`
- Comportamiento preview:
  - `src/ui/controllers/runtimePreviewAdapterController.ts`
  - `src/ui/controllers/previewController.ts`
  - `src/ui/controllers/previewNavigationController.ts`
  - `src/ui/controllers/previewBackgroundController.ts`
- Runtime export:
  - `src/export-runtime/buildRuntimeScript.ts`
  - `src/export-runtime/fragments/runtimeScriptComposer.ts`

## Contratos
Superficies tipadas principales:
- `src/ui/contracts/state.ts`
- `src/ui/contracts/actions.ts`
- `src/ui/contracts/components.ts`

Estas definen el limite entre orquestacion runtime y uso de componentes.

## Diagrama
- Fuente de arquitectura por capas: [`../diagrams/layered-architecture.mmd`](../diagrams/layered-architecture.mmd)
