# 08 - Current-State Snapshot and Delta

## Snapshot baseline (as of 2026-02-20)

### Branch + commit context
- Working branch: `main`
- Snapshot commit observed during documentation: `81c7d34`

### Architecture status
- Thin shell composition remains in place:
  - `src/App.svelte` (`16` lines)
  - `src/ui/components/AppRuntime.svelte` (`8` lines)
  - `src/ui/components/AppRuntimeScreen.svelte` (`8` lines)
- Runtime orchestration host:
  - `src/ui/components/AppRuntimeScreenContent.svelte` (`896` lines)
- Export runtime orchestrator:
  - `src/export-runtime/buildRuntimeScript.ts` (`12` lines)

### Line-budget status
From `src/App.architecture.test.ts` + measured file state:
- `App.svelte <= 900` (guard present, measured `16`)
- `AppRuntime.svelte <= 900` (guard present, measured `8`)
- `AppRuntimeScreen.svelte <= 1100` (guard present, measured `8`)
- `AppRuntimeScreenContent.svelte <= 900` (guard present, measured `896`)
- `buildRuntimeScript.ts <= 900` (guard present, measured `12`)

### Gate status (latest verified run)
- `npm run build`: PASS
- `npm test`: PASS (`67` files, `230` tests)
- `npm run test:e2e`: not re-run in this documentation sync
- `npm run test:perf`: not re-run in this documentation sync

## Delta: in-flight working tree surface
Current in-flight delta for this pass includes documentation alignment:
- `docs/en/04-data-model-and-assets.md`
- `docs/en/06-testing-and-gates.md`
- `docs/en/08-current-state-snapshot-and-delta.md`
- `docs/es/04-modelo-de-datos-y-assets.md`
- `docs/es/06-pruebas-y-gates.md`
- `docs/es/08-estado-actual-snapshot-y-delta.md`

### Known residual risks
- Full e2e/perf status is unknown until the suites are re-run in this environment.
- Container performance variance can still trigger percentile threshold failures during full sweeps.
- Local fallback can still fail when shell Node resolution differs from the expected Playwright-compatible Node path.

## Operational references
- Architecture guardrails: `src/App.architecture.test.ts`
- Runtime ownership map: `docs/en/03-architecture-runtime-deep-dive.md`
- Historical phase narrative + gate history: `docs/archive/2026-02-refactor-program/PHASE_STATUS_TRACKER.md`

## Diagrams
- System context: [`../diagrams/system-context.mmd`](../diagrams/system-context.mmd)
- Controller wiring: [`../diagrams/runtime-controller-wiring.mmd`](../diagrams/runtime-controller-wiring.mmd)
- Test pipeline: [`../diagrams/test-gate-pipeline.mmd`](../diagrams/test-gate-pipeline.mmd)
