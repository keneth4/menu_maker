# 06 - Pruebas y Gates

## Piramide de pruebas actual
- Unit: workflows/controllers/reglas core (`vitest`)
- Component: contratos UI criticos (`@testing-library/svelte`)
- E2E: paridad/regresion (`playwright`)
- Perf gate: smoke de fluidez/responsiveness

## Comandos obligatorios de gate
- `npm run build`
- `npm test`
- `npm run test:e2e`
- `npm run test:perf`

Variantes forzadas en contenedor:
- `ALLOW_CONTAINER_BUILD=1 npm run test:e2e:container`
- `npm run test:perf:container`

## Semantica container-first
- `npm run test:e2e` y `npm run test:perf` intentan primero la ruta de contenedor.
- Si el wrapper no completa en contenedor, puede ejecutarse fallback local segun scripts.
- Para validacion estricta en contenedor, usar comandos `*:container`.

## Estado actual (sync docs 2026-02-17)
- `npm run build`: PASS
- `npm test`: PASS (`62` files, `183` tests)
- `npm run test:e2e`: FAIL (`33 passed`, `3 skipped`, `6 failed` en corrida container-first)
- `npm run test:perf`: PASS (gate perf en ruta container-first)

Notas:
- La resolucion de Node en shell host puede diferir del Node manejado por nvm.
- En este host, el fallback local de `npm run test:e2e` reporta mismatch ESM si no se fija path de Node (`>=18.19`).

## Riesgos de flake y reglas de estabilizacion
- Timing de settle en section background:
  - evitar ventanas de poll demasiado cortas
- Jitter de perf en contenedor:
  - usar percentiles (`p95`, `p99`) + cap de outliers
- File chooser:
  - preferir upload por hidden input cuando el evento chooser sea inestable
- Decode interactivo:
  - usar fixtures deterministas en pruebas sensibles a codec

## Diagrama
- Fuente del pipeline de gates: [`../diagrams/test-gate-pipeline.mmd`](../diagrams/test-gate-pipeline.mmd)
