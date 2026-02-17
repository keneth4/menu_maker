# 08 - Current-State Snapshot and Delta

## Snapshot baseline (as of 2026-02-17)

### Branch + commit context
- Working branch: `codex/refactor-isolation`
- Snapshot commit observed during documentation: `16a3a25`

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
- `npm test`: PASS (`62` files, `183` tests)
- `npm run test:e2e`: FAIL (container-first run: `33 passed`, `3 skipped`, `6 failed`)
- `PATH="/Users/keneth4/.nvm/versions/node/v25.6.1/bin:$PATH" npm run test:e2e:local`: FAIL (`36 passed`, `1 skipped`, `5 failed`)
- `npm run test:perf`: PASS (container-first perf gate)

Current failing e2e areas:
- Jukebox section/item reactivity specs (`tests/e2e/jukebox-import-reactivity.spec.ts`)
- Jukebox wheel parity + sensitivity specs (`tests/e2e/jukebox-scroll-parity.spec.ts`)
- Project-tab template-switch section assertion (`tests/e2e/app.spec.ts`)
- Perf fluidity spec under full container e2e sweep (`tests/e2e/performance-fluidity.spec.ts`)

## Delta: in-flight working tree surface
Current in-flight delta for this pass is documentation alignment only:
- `README.md`
- `docs/en/03-architecture-runtime-deep-dive.md`
- `docs/en/07-coding-practices-and-extension-playbook.md`
- `docs/en/08-current-state-snapshot-and-delta.md`
- `docs/es/03-arquitectura-runtime-detalle.md`
- `docs/es/07-practicas-de-codigo-y-playbook.md`
- `docs/es/08-estado-actual-snapshot-y-delta.md`

### Known residual risks
- E2E parity remains open for Jukebox interaction paths after recent sensitivity/recoil changes.
- Container performance variance can trigger percentile perf threshold failures during full e2e runs.
- Local fallback in `npm run test:e2e` can fail on hosts where shell Node resolution is below Playwright ESM requirements.

## Operational references
- Architecture guardrails: `src/App.architecture.test.ts`
- Runtime ownership map: `docs/en/03-architecture-runtime-deep-dive.md`
- Historical phase narrative + gate history: `docs/archive/2026-02-refactor-program/PHASE_STATUS_TRACKER.md`

## Diagrams
- System context: [`../diagrams/system-context.mmd`](../diagrams/system-context.mmd)
- Controller wiring: [`../diagrams/runtime-controller-wiring.mmd`](../diagrams/runtime-controller-wiring.mmd)
- Test pipeline: [`../diagrams/test-gate-pipeline.mmd`](../diagrams/test-gate-pipeline.mmd)
