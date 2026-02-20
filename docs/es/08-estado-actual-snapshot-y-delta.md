# 08 - Estado Actual: Snapshot y Delta

## Snapshot baseline (al 2026-02-20)

### Contexto branch + commit
- Branch de trabajo: `main`
- Commit observado durante documentacion: `81c7d34`

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
- `npm test`: PASS (`67` files, `230` tests)
- `npm run test:e2e`: no re-ejecutado en este sync documental
- `npm run test:perf`: no re-ejecutado en este sync documental

## Delta: superficie in-flight del working tree
El delta in-flight de esta pasada incluye alineacion documental:
- `docs/en/04-data-model-and-assets.md`
- `docs/en/06-testing-and-gates.md`
- `docs/en/08-current-state-snapshot-and-delta.md`
- `docs/es/04-modelo-de-datos-y-assets.md`
- `docs/es/06-pruebas-y-gates.md`
- `docs/es/08-estado-actual-snapshot-y-delta.md`

### Riesgos residuales conocidos
- El estado completo de e2e/perf queda pendiente hasta re-ejecutar esos suites en este entorno.
- La variabilidad de recursos del host puede gatillar fallas de percentiles en perf durante corridas e2e completas.
- El fallback local puede fallar cuando el Node resuelto por shell no coincide con el path esperado por Playwright.

## Referencias operativas
- Guardrails de arquitectura: `src/App.architecture.test.ts`
- Mapa de ownership runtime: `docs/es/03-arquitectura-runtime-detalle.md`
- Historial historico de fases y gates: `docs/archive/2026-02-refactor-program/PHASE_STATUS_TRACKER.md`

## Diagramas
- Contexto de sistema: [`../diagrams/system-context.mmd`](../diagrams/system-context.mmd)
- Wiring de controllers: [`../diagrams/runtime-controller-wiring.mmd`](../diagrams/runtime-controller-wiring.mmd)
- Pipeline de tests/gates: [`../diagrams/test-gate-pipeline.mmd`](../diagrams/test-gate-pipeline.mmd)
