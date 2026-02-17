# 07 - Practicas de Codigo y Playbook de Extension

## Practicas obligatorias
- Mantener logica de dominio en `core`/`application`; render en `ui/components`.
- Extraer side effects/orquestacion a controllers.
- Mantener paridad estricta preview/export en rutas criticas.
- Agregar/actualizar regresiones antes y despues de refactors que mueven comportamiento.
- Respetar guardrails de line-budget definidos en `src/App.architecture.test.ts`.
- Preferir contratos tipados model/actions sobre callbacks dispersos.

## Checklist de seguridad para refactor
Antes de merge:
1. Sin drift en contrato bridge/export.
2. Sin drift de comportamiento de templates.
3. Sin drift de packaging save/export.
4. Gates unit + e2e + perf en verde en entorno esperado.
5. Mapping de ownership actualizado en docs de reviewer/tracker.

## Patron: agregar comportamiento de template de forma segura
1. Agregar capabilities/strategy en `core/templates`.
2. Mantener reglas deterministas de normalizacion/fallback.
3. Implementar comportamiento preview via controllers (`runtimePreviewAdapterController` y relacionados).
4. Reflejar mismo comportamiento en fragments de export runtime.
5. Agregar e2e de paridad + assertions unitarias de semantica.

## Patron: extender export runtime sin romper paridad
1. Agregar logica en `src/export-runtime/fragments`.
2. Mantener `buildRuntimeScript.ts` como orquestador delgado.
3. Reusar helpers compartidos de `application`/`core` cuando aplique.
4. Agregar cobertura unitaria de invariantes del output generado.
5. Validar con specs de paridad y checks de diagnostico export.

## Ejemplo guiado: agregar un atajo desktop especifico por template
Objetivo: agregar comportamiento de tecla `Home` para un template sin introducir drift.
1. Agregar capability flag en `src/core/templates/registry.ts`.
2. Implementar el manejo de tecla en `src/ui/controllers/previewNavigationController.ts`.
3. Conectar el comportamiento via `src/ui/controllers/runtimePreviewAdapterController.ts` (sin mutar vistas Svelte directamente).
4. Reflejar el comportamiento en export runtime dentro de `src/export-runtime/fragments/runtimeScriptComposer.ts`.
5. Agregar pruebas:
   - unitaria: `src/ui/controllers/previewNavigationController.test.ts`
   - e2e de paridad: `tests/e2e/jukebox-scroll-parity.spec.ts` (u otra spec de paridad del template)
6. Ejecutar gates: `npm run build`, `npm test`, `npm run test:e2e`, `npm run test:perf`.

## Anti-patrones a evitar
- Reintroducir orquestacion monolitica en `App.svelte` o shells delgados.
- Imports cross-layer que rompan direccion de dependencias.
- Logica de wheel/timers sin cleanup determinista.
- Cambios de comportamiento en controllers sin pruebas e2e de paridad.
- Mutar estado draft/template directamente en componentes de presentacion en lugar de usar actions/controllers.

## Diagrama
- Fuente stateflow de interaccion por template: [`../diagrams/template-interaction-stateflow.mmd`](../diagrams/template-interaction-stateflow.mmd)
