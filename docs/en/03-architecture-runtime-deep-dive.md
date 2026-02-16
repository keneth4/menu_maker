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

Critical rule: state ownership should remain explicit per controller; avoid hidden cross-controller mutation paths.

## Modal and interactive media stack
- `runtimeModalSurfaceController` orchestrates modal open/close and prefetch intent
- `interactiveMediaController` controls decoder-driven interactive rendering
- `modalController` owns selection and resolve-active-dish semantics

## Diagrams
- Controller wiring source: [`../diagrams/runtime-controller-wiring.mmd`](../diagrams/runtime-controller-wiring.mmd)
- Lifecycle sequence source: [`../diagrams/runtime-lifecycle-sequence.mmd`](../diagrams/runtime-lifecycle-sequence.mmd)
