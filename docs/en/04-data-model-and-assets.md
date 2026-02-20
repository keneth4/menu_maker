# 04 - Data Model and Assets

## Canonical model (`menu.json`)
Primary structure:
- `meta`
  - slug, name, template, locales/defaultLocale, currency, typography, identity fields
  - `identityMode`: `"text"` | `"logo"`
  - `logoSrc`: managed logo source (strictly under `assets/originals/logos/**` when set)
  - `fontRoles` role overrides (`identity`, `restaurant`, `title`, `section`, `item`)
  - `backgroundCarouselSeconds` normalized to `2..60` (default/fallback `10`)
  - `scrollSensitivity` (global runtime interaction tuning)
    - `item`: `1..10` (item wheel/drag sensitivity)
    - `section`: `1..10` (horizontal section-switch sensitivity)
- `backgrounds[]`
  - `id`, `label`, `src`, optional `originalSrc`, optional `derived`
- `categories[]`
  - `id`, localized `name`, optional background assignment
- `categories[].items[]`
  - localized copy, price, allergens, vegan
  - media fields (`hero360`, optional `originalHero360`, responsive/derived variants)
  - `media.rotationDirection`: `"cw"` | `"ccw"` (default/fallback `"cw"`)

Normalization path:
- `normalizeProject` in `src/core/menu/normalization.ts`
- template canonicalization via `resolveTemplateId` in `src/core/templates/registry.ts`
- scroll sensitivity clamp/default in `normalizeProject`:
  - default `{ item: 5, section: 5 }`
  - clamp rule `1..10`

## Sensitivity runtime rules
Canonical formulas live in `src/application/preview/scrollSensitivityWorkflow.ts` and are shared by preview/export runtime paths.

- level normalization:
  - `level = clamp(round(value), 1, 10)`
  - default level is `5`
- threshold multiplier (`higher level => lower threshold => more sensitive`):
  - level `5` -> `1.00`
  - level `10` -> `0.18`
  - level `1` -> `3.80`
- touch multiplier:
  - level `5` -> `1.00`
  - level `10` -> `2.60`
  - level `1` -> `0.28`
- hard low-sensitivity guard:
  - at level `1`, `maxStepPerInput = 1` (prevents multi-step jumps from a single wheel/drag input)

## Template normalization rules
Template IDs are canonicalized with alias mapping and safe fallback:
- invalid/unknown IDs -> `focus-rows`
- legacy aliases map to canonical IDs (`focus-rows`, `jukebox`)

## Identity editor behavior (current)
In `Edit > Identity`:
- `text` mode shows `Title`, `Subtitle`, and role controls for `title`, `subtitle`, `sections`, and `items`.
- `logo` mode shows `Logo asset`, keeps `Subtitle`, and shows role controls for `subtitle`, `sections`, and `items` (title controls are hidden).
- Title/subtitle rows are inline pairs in this order: localized text input first, then the corresponding font selector.
- Internal role-key mapping remains backward-compatible: `restaurant` role powers **Title font**, and `title` role powers **Subtitle font**.

## Asset contract
Managed roots under project assets:
- `assets/originals/backgrounds`
- `assets/originals/items`
- `assets/originals/fonts`
- `assets/originals/logos`
- derived outputs under `assets/derived/*`

Protection and scope rules:
- base roots `assets/originals`, `assets/originals/backgrounds`, `assets/originals/items`, `assets/originals/fonts`, and `assets/originals/logos` are locked (no rename/move/delete)
- asset picker options are scope-filtered by root (backgrounds/items/fonts/logos selectors only list their own managed root)

## Path rewriting behavior
### Import
- legacy or foreign project asset paths are remapped by import workflows
- slug-specific `/projects/<slug>/assets/...` paths are normalized to active slug
- non-managed/legacy logo paths are sanitized; `logoSrc` is cleared unless it resolves under `originals/logos`

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
