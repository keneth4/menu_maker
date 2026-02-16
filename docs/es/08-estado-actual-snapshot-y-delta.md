# 08 - Estado Actual: Snapshot y Delta

## Snapshot baseline (al 2026-02-16)

### Contexto branch + commit
- Branch de trabajo: `codex/refactor-isolation`
- Commit observado durante documentacion: `5dfc273`

### Estado de arquitectura
- Se mantiene composicion por shells delgados:
  - `src/App.svelte`
  - `src/ui/components/AppRuntime.svelte`
  - `src/ui/components/AppRuntimeScreen.svelte`
- Host de orquestacion runtime:
  - `src/ui/components/AppRuntimeScreenContent.svelte`

### Estado de line-budget
Desde `src/App.architecture.test.ts` + medicion actual:
- `App.svelte <= 900` (guard presente)
- `AppRuntime.svelte <= 900` (guard presente)
- `AppRuntimeScreen.svelte <= 1100` (guard presente)
- `AppRuntimeScreenContent.svelte <= 900` (guard presente, medido `897`)
- `buildRuntimeScript.ts <= 900` (guard presente)

### Estado de gates (ultima baseline validada)
- `npm run build`: PASS
- `npm test`: PASS (60 files, 162 tests)
- `ALLOW_CONTAINER_BUILD=1 npm run test:e2e:container`: PASS (36 passed, 3 skipped)
- `npm run test:perf`: PASS (ruta container-first de perf)

## Delta: superficie in-flight del working tree
El branch actual incluye cambios sin commit en varios dominios.

### Grupos de dominio
- UI controllers/components:
  - `src/ui/controllers/*`
  - `src/ui/components/*`
  - `src/ui/contracts/components.ts`
- Workflows de aplicacion:
  - `src/application/projects/*`
  - `src/application/export/*`
  - `src/core/menu/*`
  - `src/core/templates/*`
- E2E y harness de gates:
  - `tests/e2e/*`
  - `scripts/test-e2e.sh`
  - `scripts/test-perf.sh`
  - `scripts/container-smoke.sh`
- Documentacion/tracking:
  - `README.md`
  - `APP_REDISTRIBUTION_REVIEWER_GUIDE.md`
  - `PHASE_STATUS_TRACKER.md`
- Estado de indice/sample:
  - `public/projects/index.json`

### Riesgos residuales conocidos
- Diff in-flight grande aumenta complejidad de review/merge; conviene cerrar en commits por fase.
- Perf en contenedor depende de recursos host; percentiles mitigan variabilidad pero no eliminan sensibilidad.
- Pruebas bridge con ffmpeg pueden emitir warnings en fixtures limite (intencionalmente pequenos/corrupt-edge); validar contratos de salida, no ausencia de logs.

## Referencias operativas
- Guardrails de arquitectura: `src/App.architecture.test.ts`
- Mapping para reviewers: `APP_REDISTRIBUTION_REVIEWER_GUIDE.md`
- Historial de fases y gates: `PHASE_STATUS_TRACKER.md`

## Diagramas
- Contexto de sistema: [`../diagrams/system-context.mmd`](../diagrams/system-context.mmd)
- Wiring de controllers: [`../diagrams/runtime-controller-wiring.mmd`](../diagrams/runtime-controller-wiring.mmd)
- Pipeline de tests/gates: [`../diagrams/test-gate-pipeline.mmd`](../diagrams/test-gate-pipeline.mmd)
