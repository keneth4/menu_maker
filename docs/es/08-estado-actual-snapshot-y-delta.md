# 08 - Estado Actual: Snapshot y Delta

## Snapshot baseline (al 2026-02-17)

### Contexto branch + commit
- Branch de trabajo: `codex/refactor-isolation`
- Commit observado durante documentacion: `16a3a25`

### Estado de arquitectura
- Se mantiene composicion por shells delgados:
  - `src/App.svelte` (`16` lineas)
  - `src/ui/components/AppRuntime.svelte` (`8` lineas)
  - `src/ui/components/AppRuntimeScreen.svelte` (`8` lineas)
- Host de orquestacion runtime:
  - `src/ui/components/AppRuntimeScreenContent.svelte` (`896` lineas)
- Orquestador de runtime exportado:
  - `src/export-runtime/buildRuntimeScript.ts` (`12` lineas)

### Estado de line-budget
Desde `src/App.architecture.test.ts` + medicion actual:
- `App.svelte <= 900` (guard presente, medido `16`)
- `AppRuntime.svelte <= 900` (guard presente, medido `8`)
- `AppRuntimeScreen.svelte <= 1100` (guard presente, medido `8`)
- `AppRuntimeScreenContent.svelte <= 900` (guard presente, medido `896`)
- `buildRuntimeScript.ts <= 900` (guard presente, medido `12`)

### Estado de gates (ultima corrida verificada)
- `npm run build`: PASS
- `npm test`: PASS (`62` files, `183` tests)
- `npm run test:e2e`: FAIL (corrida container-first: `33 passed`, `3 skipped`, `6 failed`)
- `PATH="/Users/keneth4/.nvm/versions/node/v25.6.1/bin:$PATH" npm run test:e2e:local`: FAIL (`36 passed`, `1 skipped`, `5 failed`)
- `npm run test:perf`: PASS (gate perf en ruta container-first)

Areas e2e actualmente fallando:
- reactividad de seccion/item en Jukebox (`tests/e2e/jukebox-import-reactivity.spec.ts`)
- paridad wheel + sensibilidad en Jukebox (`tests/e2e/jukebox-scroll-parity.spec.ts`)
- assertion de cambio de seccion al cambiar template en Project tab (`tests/e2e/app.spec.ts`)
- spec de performance fluidity durante corrida e2e completa en contenedor (`tests/e2e/performance-fluidity.spec.ts`)

## Delta: superficie in-flight del working tree
El delta in-flight de esta pasada es solo alineacion documental:
- `README.md`
- `docs/en/*` y `docs/es/*` (runtime/testing/current-state)
- `APP_REDISTRIBUTION_REVIEWER_GUIDE.md`
- `PHASE_STATUS_TRACKER.md`

### Riesgos residuales conocidos
- Sigue abierto el cierre de paridad e2e en rutas de interaccion Jukebox tras los cambios de sensibilidad/recoil.
- La variabilidad de recursos del host puede gatillar fallas de percentiles en perf durante corridas e2e completas.
- El fallback local de `npm run test:e2e` puede fallar si el Node resuelto por shell no cumple el minimo ESM de Playwright.

## Referencias operativas
- Guardrails de arquitectura: `src/App.architecture.test.ts`
- Mapping para reviewers: `APP_REDISTRIBUTION_REVIEWER_GUIDE.md`
- Historial de fases y gates: `PHASE_STATUS_TRACKER.md`

## Diagramas
- Contexto de sistema: [`../diagrams/system-context.mmd`](../diagrams/system-context.mmd)
- Wiring de controllers: [`../diagrams/runtime-controller-wiring.mmd`](../diagrams/runtime-controller-wiring.mmd)
- Pipeline de tests/gates: [`../diagrams/test-gate-pipeline.mmd`](../diagrams/test-gate-pipeline.mmd)
