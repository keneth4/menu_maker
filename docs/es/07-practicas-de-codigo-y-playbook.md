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
5. Mapping de ownership y notas de arquitectura actualizados en `docs/es/03-arquitectura-runtime-detalle.md` y docs de estado actual.

## Resumen base de comportamiento de templates

### `focus-rows` (default base)
- Movimiento vertical entre secciones.
- Movimiento horizontal dentro del carrusel de cada seccion.
- Enfasis del item centrado (scale/opacity/sharpness).
- Comportamiento settle/snap para reducir estados ambiguos tras la entrada.

### `jukebox` (modo visual expresivo)
- Navegacion de secciones con intencion horizontal.
- Rotacion del item activo con intencion vertical.
- Presentacion tipo disco circular con perfil de movimiento mas fuerte.
- La paridad seccion/item debe mantenerse entre wheel, touch, keyboard y runtime exportado.

### Requisitos compartidos
- Semantica modal open/close consistente entre preview y export.
- Politica de seleccion de fuentes de imagen con paridad estricta.
- Comportamiento de bordes de seccion (settle/recoil en primera/ultima seccion) consistente.

## Checklist de diseno de template
Usar este checklist para cada nuevo template o cambio grande de comportamiento:
1. Gramatica de interaccion:
   - definir intencion vertical, horizontal y fallback de teclado.
2. Jerarquia visual:
   - definir enfasis del item activo y estado de items inactivos.
3. Politica de movimiento:
   - definir thresholds, debounce/cooldown, tiempos de settle y transiciones.
4. Superficie de contrato:
   - definir assets/campos de texto requeridos y comportamiento en estado vacio.
5. Accesibilidad/operabilidad:
   - asegurar paridad por teclado, reduced-motion y cues de foco claros.
6. Pasada de validacion:
   - ejecutar checks desktop/mobile, stress wheel/touch y percepcion de carga inicial.

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

## Direcciones exploratorias de templates (no comprometidas)
Estas notas son exploratorias y no representan un roadmap comprometido.

### Watch Orbit
- Modelo de interaccion centrado en una sola seccion.
- Fuerte storytelling y look premium; riesgo mayor de discoverability.

### Gallery Lens
- Hero principal grande + rail secundario para previsualizacion.
- Excelente para media visual; menos eficiente en catalogos muy largos.

### Story Chapters
- Progresion narrativa en capitulos de pantalla completa.
- Alto impacto emocional; mas lento para comparacion rapida.

### Grid Pulse
- Grid denso con expansion de foco.
- Alta velocidad de escaneo; menos sensacion cinematica de marca.

## Anti-patrones a evitar
- Reintroducir orquestacion monolitica en `App.svelte` o shells delgados.
- Imports cross-layer que rompan direccion de dependencias.
- Logica de wheel/timers sin cleanup determinista.
- Cambios de comportamiento en controllers sin pruebas e2e de paridad.
- Mutar estado draft/template directamente en componentes de presentacion en lugar de usar actions/controllers.

## Diagrama
- Fuente stateflow de interaccion por template: [`../diagrams/template-interaction-stateflow.mmd`](../diagrams/template-interaction-stateflow.mmd)
