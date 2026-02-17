# 05 - Flujos Runtime: Importar, Guardar, Exportar

## Flujo abrir proyecto (JSON/ZIP)
1. Se dispara accion open desde landing/editor.
2. Parseo de entrada:
   - JSON: normalizacion directa
   - ZIP: localizar `menu.json`, parsear entries, mapear assets
3. Ejecutar normalizacion de rutas + canonicalizacion de template.
4. Hidratar estado runtime (`project`, `draft`, seleccion, capabilities).
5. Si hay bridge, subir/mapear assets y opcionalmente derivar outputs.
6. Refrescar workspace de assets y sincronizacion de preview.

Errores esperados:
- zip sin `menu.json`
- JSON invalido
- shape de zip no soportado
- fallas en upload/derive bridge (debe degradar de forma controlada)

## Flujo guardar proyecto
1. Validar estado actual de draft/project.
2. Reescribir rutas segun contrato de save (orientado a originals).
3. Empaquetar ZIP de save.
4. Emitir progreso y estado de finalizacion.

## Flujo exportar sitio estatico
1. Validar export readiness.
2. En bridge, ejecutar derived preparation.
3. Componer runtime script (`export-runtime` + fragments).
4. Reescribir rutas de assets y empaquetar shell estatico.
5. Emitir diagnosticos/manifests.

## Comportamiento wizard al aplicar template
- Wizard aplica template por pipeline de controller.
- Demo/showcase debe estar condicionado por elegibilidad (`isWizardShowcaseEligible`) para no sobreescribir proyectos no vacios.

## Checkpoints de paridad preview/export
Antes de cerrar una pasada de refactor:
- paridad de navegacion seccion/item por template
- paridad de visibilidad de backgrounds y mapping por seccion
- paridad de prioridad de source en detalle
- paridad de locale y render de texto

## Diagramas
- Secuencia lifecycle runtime: [`../diagrams/runtime-lifecycle-sequence.mmd`](../diagrams/runtime-lifecycle-sequence.mmd)
- Dataflow import/save/export: [`../diagrams/import-save-export-dataflow.mmd`](../diagrams/import-save-export-dataflow.mmd)
