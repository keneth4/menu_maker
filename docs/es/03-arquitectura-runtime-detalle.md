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

## Diagramas
- Wiring de controllers: [`../diagrams/runtime-controller-wiring.mmd`](../diagrams/runtime-controller-wiring.mmd)
- Secuencia de lifecycle: [`../diagrams/runtime-lifecycle-sequence.mmd`](../diagrams/runtime-lifecycle-sequence.mmd)
