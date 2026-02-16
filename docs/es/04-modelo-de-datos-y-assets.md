# 04 - Modelo de Datos y Assets

## Modelo canonico (`menu.json`)
Estructura principal:
- `meta`
  - slug, name, template, locales/defaultLocale, currency, typography, identidad
- `backgrounds[]`
  - `id`, `label`, `src`, opcional `originalSrc`, opcional `derived`
- `categories[]`
  - `id`, `name` localizado, opcional mapping de background
- `categories[].items[]`
  - copy localizado, price, allergens, vegan
  - media (`hero360`, opcional `originalHero360`, variantes responsive/derived)

Ruta de normalizacion:
- `normalizeProject` en `src/core/menu/normalization.ts`
- canonicalizacion de template con `resolveTemplateId` en `src/core/templates/registry.ts`

## Reglas de normalizacion de template
Los IDs se canonicalizan con alias + fallback seguro:
- IDs invalidos -> `focus-rows`
- aliases legacy -> IDs canonicos (`focus-rows`, `jukebox`)

## Contrato de assets
Roots administrados:
- `assets/originals/backgrounds`
- `assets/originals/items`
- `assets/originals/fonts`
- derivados en `assets/derived/*`

## Reescritura de rutas
### Import
- rutas legacy o de slugs externos se remapean en workflows de import
- rutas `/projects/<slug>/assets/...` se normalizan al slug activo

### Save
- el zip de save preserva originals como source-of-truth editable
- se limpia/reduce metadata derived para regeneracion determinista

### Export
- el runtime/menu exportado usa derived para vistas de inicio
- originals se preservan donde se requiere fidelidad de detalle
- se producen diagnosticos (`asset-manifest.json`, `export-report.json`)

## Implicaciones de endpoints bridge
`vite.config.ts` controla:
- list/upload/move/delete de archivos
- derived preparation (`/prepare-derived`)
- integracion de guardado/actualizacion de `index.json`

## Diagrama
- Fuente de dataflow import/save/export: [`../diagrams/import-save-export-dataflow.mmd`](../diagrams/import-save-export-dataflow.mmd)
- Fuente de flujo de API bridge: [`../diagrams/bridge-api-flow.mmd`](../diagrams/bridge-api-flow.mmd)
