# Phase 0 - Extraction Slice 01

## Name
Shared image source policy (`preview` + `export runtime`)

## Status
- Implemented on `2026-02-09`.

## Why this is first
- Lowest-risk, high-impact parity hotspot.
- Pure helper logic with minimal UI coupling.
- Directly supports the new derivative requirement (`derived md/lg`, `webp` preference).

## Scope
Extract image-source decision logic into a shared module and consume it in both:
- in-editor preview runtime,
- exported site runtime generation path.

Primary logic to unify:
1. Responsive `srcset` assembly.
2. Carousel source priority (fast/default path).
3. Detail modal source priority (quality path).
4. Fallback ordering when derivatives are missing.

## Target files
- New: `src/export-runtime/imageSources.ts`
- Update: `src/App.svelte`
  - preview helpers (`buildResponsiveSrcSetFromMedia`, `getCarouselImageSource`, `getDetailImageSource`)
  - export runtime helper string equivalents (`buildSrcSet`, `getCarouselImageSrc`, `getDetailImageSrc`)
- Tests:
  - New: `src/export-runtime/imageSources.test.ts`
  - Update parity e2e later in Phase 0 test item.

## Policy contract (initial)
- Carousel (`md first for speed`):
  1. `derived.medium` (prefer animated `webp`)
  2. `derived.large`
  3. legacy responsive medium/large/small
  4. original source

- Detail modal (`quality first`):
  1. `derived.large` (prefer animated `webp`)
  2. `derived.medium`
  3. legacy responsive large/medium/small
  4. original source

- `srcset` generation:
  - deterministic width labels,
  - stable ordering,
  - dedupe repeated URLs.

## Out of scope
- Modal interaction/decode pipeline extraction.
- Template wheel/touch interaction extraction.
- Keyboard behavior extraction.

## Acceptance criteria
- Preview and export use the same source-priority function behavior.
- Unit tests cover derivative + legacy + fallback permutations.
- No regression in existing e2e smoke flow for save/export.

## Risks and mitigations
- Risk: mismatch due to export runtime still being string-assembled.
  - Mitigation: centralize policy in shared helpers and generate export helper body from one source of truth where possible.
- Risk: missing derivative fields in older projects.
  - Mitigation: strict fallback path to legacy fields and original assets.
