# 04 - Data Model and Assets

## Canonical model (`menu.json`)
Primary structure:
- `meta`
  - slug, name, template, locales/defaultLocale, currency, typography, identity fields
- `backgrounds[]`
  - `id`, `label`, `src`, optional `originalSrc`, optional `derived`
- `categories[]`
  - `id`, localized `name`, optional background assignment
- `categories[].items[]`
  - localized copy, price, allergens, vegan
  - media fields (`hero360`, optional `originalHero360`, responsive/derived variants)

Normalization path:
- `normalizeProject` in `src/core/menu/normalization.ts`
- template canonicalization via `resolveTemplateId` in `src/core/templates/registry.ts`

## Template normalization rules
Template IDs are canonicalized with alias mapping and safe fallback:
- invalid/unknown IDs -> `focus-rows`
- legacy aliases map to canonical IDs (`focus-rows`, `jukebox`)

## Asset contract
Managed roots under project assets:
- `assets/originals/backgrounds`
- `assets/originals/items`
- `assets/originals/fonts`
- derived outputs under `assets/derived/*`

## Path rewriting behavior
### Import
- legacy or foreign project asset paths are remapped by import workflows
- slug-specific `/projects/<slug>/assets/...` paths are normalized to active slug

### Save
- save zip preserves originals as editable source-of-truth
- derived metadata is stripped/reduced for deterministic re-generation

### Export
- export runtime/menu rewrite uses derived assets for startup views
- originals are retained where detail fidelity is required
- diagnostics and manifests are produced (`asset-manifest.json`, `export-report.json`)

## Bridge endpoint implications
`vite.config.ts` bridge endpoint set controls:
- project file listing/upload/move/delete
- derived preparation (`/prepare-derived`)
- save/index update integration

## Diagram
- Import/save/export dataflow source: [`../diagrams/import-save-export-dataflow.mmd`](../diagrams/import-save-export-dataflow.mmd)
- Bridge API flow source: [`../diagrams/bridge-api-flow.mmd`](../diagrams/bridge-api-flow.mmd)
