# 04 - Modelo de Datos y Assets

## Modelo canonico (`menu.json`)
Estructura principal:
- `meta`
  - slug, name, template, locales/defaultLocale, currency, typography, identidad
  - `fontRoles` overrides por rol (`identity`, `restaurant`, `title`, `section`, `item`)
  - `scrollSensitivity` (ajuste global de interaccion runtime)
    - `item`: `1..10` (sensibilidad wheel/drag entre items)
    - `section`: `1..10` (sensibilidad para cambio horizontal de seccion)
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
- clamp/default de sensibilidad en `normalizeProject`:
  - default `{ item: 5, section: 5 }`
  - rango permitido `1..10`

## Reglas runtime de sensibilidad
Las formulas canonicas viven en `src/application/preview/scrollSensitivityWorkflow.ts` y se comparten entre preview y runtime exportado.

- normalizacion de nivel:
  - `level = clamp(round(value), 1, 10)`
  - nivel default `5`
- multiplicador de umbral (`mayor nivel => menor umbral => mas sensible`):
  - nivel `5` -> `1.00`
  - nivel `10` -> `0.18`
  - nivel `1` -> `3.80`
- multiplicador touch:
  - nivel `5` -> `1.00`
  - nivel `10` -> `2.60`
  - nivel `1` -> `0.28`
- guardrail para minima sensibilidad:
  - en nivel `1`, `maxStepPerInput = 1` (evita saltos de multiples pasos con un solo input)

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
