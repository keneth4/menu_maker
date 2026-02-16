# 08 - Current-State Snapshot and Delta

## Snapshot baseline (as of 2026-02-16)

### Branch + commit context
- Working branch: `codex/refactor-isolation`
- Snapshot commit observed during documentation: `5dfc273`

### Architecture status
- Thin shell composition remains in place:
  - `src/App.svelte`
  - `src/ui/components/AppRuntime.svelte`
  - `src/ui/components/AppRuntimeScreen.svelte`
- Runtime orchestration host:
  - `src/ui/components/AppRuntimeScreenContent.svelte`

### Line-budget status
From `src/App.architecture.test.ts` + measured file state:
- `App.svelte <= 900` (guard present)
- `AppRuntime.svelte <= 900` (guard present)
- `AppRuntimeScreen.svelte <= 1100` (guard present)
- `AppRuntimeScreenContent.svelte <= 900` (guard present, measured `897`)
- `buildRuntimeScript.ts <= 900` (guard present)

### Gate status (latest validated baseline)
- `npm run build`: PASS
- `npm test`: PASS (60 files, 162 tests)
- `ALLOW_CONTAINER_BUILD=1 npm run test:e2e:container`: PASS (36 passed, 3 skipped)
- `npm run test:perf`: PASS (container-first perf path)

## Delta: in-flight working tree surface
Current branch includes uncommitted changes across multiple domains.

### Domain groups
- UI controllers/components:
  - `src/ui/controllers/*`
  - `src/ui/components/*`
  - `src/ui/contracts/components.ts`
- Application workflows:
  - `src/application/projects/*`
  - `src/application/export/*`
  - `src/core/menu/*`
  - `src/core/templates/*`
- E2E and gate harness:
  - `tests/e2e/*`
  - `scripts/test-e2e.sh`
  - `scripts/test-perf.sh`
  - `scripts/container-smoke.sh`
- Documentation/tracking:
  - `README.md`
  - `APP_REDISTRIBUTION_REVIEWER_GUIDE.md`
  - `PHASE_STATUS_TRACKER.md`
- Project index/sample state:
  - `public/projects/index.json`

### Known residual risks
- Large in-flight diff increases merge/review complexity; phase-based commits are recommended before PR.
- Container performance can vary by host resource pressure; percentile perf assertions mitigate but do not remove resource sensitivity.
- ffmpeg fixture processing may emit warning logs in bridge-derive tests for intentionally tiny/corrupt-edge fixtures; test contracts should assert outcomes, not warning absence.

## Operational references
- Architecture guardrails: `src/App.architecture.test.ts`
- Reviewer mapping: `APP_REDISTRIBUTION_REVIEWER_GUIDE.md`
- Phase narrative + gate history: `PHASE_STATUS_TRACKER.md`

## Diagrams
- System context: [`../diagrams/system-context.mmd`](../diagrams/system-context.mmd)
- Controller wiring: [`../diagrams/runtime-controller-wiring.mmd`](../diagrams/runtime-controller-wiring.mmd)
- Test pipeline: [`../diagrams/test-gate-pipeline.mmd`](../diagrams/test-gate-pipeline.mmd)
