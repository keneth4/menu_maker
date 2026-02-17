# Documentacion de MenuMaker (ES)

Este conjunto documenta la arquitectura actual, el comportamiento runtime, la estrategia de pruebas/gates y las practicas para expandir el proyecto sin romper paridad.

## Audiencia
- Mantenedores del core
- Nuevos contribuidores
- Lectores de la version en ingles: `../en/INDEX.md`

## Como usar esta documentacion
1. Lee `01-vision-general.md` para alcance y modos de operacion.
2. Lee `02-arquitectura-alto-nivel.md` y `03-arquitectura-runtime-detalle.md` para entender estructura e implementacion.
3. Usa `04` y `05` antes de tocar workflows de datos/export.
4. Sigue `06` y `07` antes de abrir PRs de refactor/feature.
5. Usa `08-estado-actual-snapshot-y-delta.md` como baseline operativo.

## Capitulos
- [01 - Vision General](./01-vision-general.md)
- [02 - Arquitectura Alto Nivel](./02-arquitectura-alto-nivel.md)
- [03 - Arquitectura Runtime Detalle](./03-arquitectura-runtime-detalle.md)
- [04 - Modelo de Datos y Assets](./04-modelo-de-datos-y-assets.md)
- [05 - Flujos Runtime: Importar, Guardar, Exportar](./05-flujos-runtime-importar-guardar-exportar.md)
- [06 - Pruebas y Gates](./06-pruebas-y-gates.md)
- [07 - Practicas de Codigo y Playbook de Extension](./07-practicas-de-codigo-y-playbook.md)
- [08 - Estado Actual: Snapshot y Delta](./08-estado-actual-snapshot-y-delta.md)

## Diagramas compartidos
Todos los diagramas viven en:
- [`../diagrams/`](../diagrams/)

Archivos principales:
- [`system-context.mmd`](../diagrams/system-context.mmd)
- [`layered-architecture.mmd`](../diagrams/layered-architecture.mmd)
- [`runtime-controller-wiring.mmd`](../diagrams/runtime-controller-wiring.mmd)
- [`runtime-lifecycle-sequence.mmd`](../diagrams/runtime-lifecycle-sequence.mmd)
- [`template-interaction-stateflow.mmd`](../diagrams/template-interaction-stateflow.mmd)
- [`import-save-export-dataflow.mmd`](../diagrams/import-save-export-dataflow.mmd)
- [`bridge-api-flow.mmd`](../diagrams/bridge-api-flow.mmd)
- [`test-gate-pipeline.mmd`](../diagrams/test-gate-pipeline.mmd)
