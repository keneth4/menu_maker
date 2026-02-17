# 01 - System Overview

## Product purpose
MenuMaker is a Svelte + Vite application for authoring interactive menu projects, previewing behavior in real time, and packaging outputs as:
- project backup zips (source-of-truth editable state)
- static export zips (deployable runtime bundle)

## Scope boundaries
### In scope
- Project authoring (`Project`, `Assets`, `Edit`, `Wizard`)
- Template-driven preview behavior (`focus-rows`, `jukebox`)
- Import/open from JSON and ZIP
- Save/export workflows with asset path rewriting
- Bridge-backed and filesystem-backed asset workflows

### Out of scope
- Backend service deployment orchestration
- Multi-user collaboration/state synchronization
- Schema migration away from current `menu.json` model
- Framework migration away from Svelte 4 + Vite 5

## Runtime modes
- `bridge`: `/api/assets/*` endpoints in `vite.config.ts` manage project files under `public/projects`
- `filesystem`: browser File System Access API path management
- `none`: read-only/no managed backing store available

## Templates and intended distinctions
- `focus-rows`
  - sections navigate vertically
  - item focus shifts horizontally per section
- `jukebox`
  - section intent is horizontal on desktop
  - item intent is vertical in active section
  - desktop section-nav controls are expected

## Non-goals for contributors
Avoid changing these without explicit parity approval and tests:
- Save/export zip layout contract
- Bridge endpoint contract in `vite.config.ts`
- Template interaction semantics (wheel/key/nav intent)
- Asset original/derived contract

## Diagram
- System context source: [`../diagrams/system-context.mmd`](../diagrams/system-context.mmd)
