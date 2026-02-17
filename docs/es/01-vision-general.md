# 01 - Vision General

## Proposito del producto
MenuMaker es una aplicacion Svelte + Vite para crear proyectos de menu interactivo, previsualizar comportamiento en tiempo real y empaquetar salidas como:
- zips de respaldo del proyecto (estado editable)
- zips de export estatico (bundle deployable)

## Limites de alcance
### En alcance
- Edicion de proyecto (`Project`, `Assets`, `Edit`, `Wizard`)
- Comportamiento de preview por template (`focus-rows`, `jukebox`)
- Importar/abrir JSON y ZIP
- Guardar/exportar con reescritura de rutas de assets
- Flujos de assets por bridge y por filesystem

### Fuera de alcance
- Orquestacion de despliegue backend
- Colaboracion multiusuario/sincronizacion remota
- Migrar fuera del modelo actual `menu.json`
- Migrar fuera de Svelte 4 + Vite 5

## Modos runtime
- `bridge`: endpoints `/api/assets/*` en `vite.config.ts` gestionan archivos en `public/projects`
- `filesystem`: uso de File System Access API del navegador
- `none`: modo sin backend de assets administrable

## Templates y diferencias esperadas
- `focus-rows`
  - secciones con navegacion vertical
  - foco de items horizontal por seccion
- `jukebox`
  - intencion horizontal para secciones en desktop
  - intencion vertical para items de la seccion activa
  - controles de seccion en desktop

## No-goals para contribuidores
No cambiar sin aprobacion explicita y pruebas de paridad:
- Contrato de layout de save/export zip
- Contrato de endpoints bridge en `vite.config.ts`
- Semantica de interaccion de templates (wheel/key/nav)
- Contrato originals/derived de assets

## Diagrama
- Fuente de contexto de sistema: [`../diagrams/system-context.mmd`](../diagrams/system-context.mmd)
