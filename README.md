# MenuMaker (menu-interactivo)

MenuMaker is a Svelte + Vite application for building and previewing interactive digital menus, managing assets, and exporting either:
- a project backup zip (editor source package), or
- a static site zip (ready to host with a local server).

This document is the current short technical and product documentation for the app behavior as implemented today.

## Documentation Hub (Bilingual + Diagram Sources)

- English architecture and current-state docs: `docs/en/INDEX.md`
- Documentacion en espanol: `docs/es/INDICE.md`
- Shared Mermaid sources (single source of truth): `docs/diagrams/`

## 1) Product Goal

MenuMaker helps a restaurant or creator:
- define menu identity (name, title, language, typography, currency),
- manage media assets (backgrounds and dish media),
- structure categories and dishes with localized content,
- preview final interaction behavior live,
- save and reopen projects safely,
- export a static interactive menu site.

## 2) Current User Workflow

### Landing
Users start in one of three entry points:
- `Create project`: starts an empty project.
- `Open project`: opens `.json` or `.zip` project files.
- `Run wizard`: starts guided setup with progress validation.

UI language can be toggled between Spanish and English.

### Editor tabs

#### `Project` tab
Main project setup:
- project name and template selection,
- enabled locales + default locale,
- currency and symbol position,
- typography selection (built-in or custom font source),
- role-based typography overrides (identity, restaurant name, menu title, section, item),
- global interaction sensitivity sliders for item/section scroll-drag (`1..10`, persisted in `meta.scrollSensitivity`),
- actions: new, open, save project zip, export static site zip.

#### `Assets` tab
Asset management for project media:
- choose target folder path for uploads,
- drag-and-drop or file upload,
- create folder, rename, move, delete,
- bulk select/move/delete,
- tree view with nested folder expansion.

Read-only protection is active for demo asset projects.

#### `Edit` tab
Manual content editing:
- identity panel (restaurant and menu title per language),
- sections panel (add/remove/rename categories),
- dishes panel (add/remove dishes, localized text, price, 360 media path),
- allergen management:
  - common allergen toggles (catalog),
  - custom allergen text per editing language,
- vegan toggle per dish.

#### `Wizard` tab
Guided flow with step gates:
1. Structure (template choice)
2. Identity (background setup)
3. Categories
4. Dishes
5. Preview / export

Wizard progress is computed from real validation state:
- template selected,
- valid background condition,
- valid categories,
- valid dishes (name + price),
- full preview-ready state.

### Preview behavior
- live preview reflects draft edits immediately,
- template-specific interaction logic is active in preview,
- dish details open in a modal,
- interactive 360 media is enhanced with `ImageDecoder` when available,
- startup loader preloads key images for smoother first interaction.

## 3) Business Logic (Current Rules)

### Localization and fallback
- menu fields are localized per enabled locales,
- default locale is always kept inside enabled locale list,
- localized lookups use: requested locale -> normalized locale -> default locale -> fallback.

### Currency formatting
- project-level currency code drives symbols,
- symbol position can be left (`$35`) or right (`35$`),
- display is consistent across cards and modal.

### Template normalization
Legacy template ids are normalized to current ids:
- `bar-pub` -> `focus-rows`
- `cafe-brunch` -> `focus-rows`
- `street-food` -> `focus-rows`

Missing template defaults to `focus-rows`.

### Allergen model
- supports both structured common allergens (`id` + localized label) and custom entries,
- import normalization upgrades string allergens into localized objects.

### Asset ownership safeguards
- demo projects (`sample-cafebrunch-menu`, `demo`) are protected as read-only,
- app surfaces ownership notice to discourage unauthorized reuse.

## 4) Data Model (Menu Project)

Core shape (`menu.json`):
- `meta`: slug, name, restaurant/title localized text, template, locales, currency, font config, role overrides (`fontRoles`), scroll sensitivity (`scrollSensitivity`).
- `backgrounds[]`: media assets for rotating background.
- `categories[]`: localized category name + dish list.
- `categories[].items[]`: localized name/description/longDescription, price, allergens, vegan flag, media.
- `sound`: scaffold exists for future sound behavior.

## 5) Template Behavior (Implemented)

### A) `focus-rows` (default, conversion-safe)
- vertical movement between sections,
- horizontal carousel inside each section,
- center-focused dish emphasis via scale/opacity/blur depth,
- wheel + touch intent logic with settle/snap behavior,
- section-edge recoil feedback when overscrolling first/last section,
- desktop arrow support for dish stepping.

### B) `jukebox` (visual mode)
- circular-disc style dish arrangement,
- vertical wheel/touch rotates active dish within section,
- horizontal section navigation with snap behavior,
- desktop wheel routing is intent-based (horizontal for sections, vertical for items),
- section-edge recoil feedback aligned with focus-rows boundary behavior,
- stronger visual motion profile vs focus-rows.

### Shared template behavior
- dish modal with long description, allergens, vegan badge, price,
- responsive media source selection when variants exist,
- section boundary settle/recoil behavior at first/last section,
- fallback to static image rendering when advanced decoder path is unavailable.

## 6) Storage and Asset Modes

MenuMaker supports three runtime modes:
- `filesystem`: browser File System Access API (`showDirectoryPicker`),
- `bridge`: Vite dev server API under `/api/assets/*`,
- `none`: no writable asset backend active.

Project storage layout (served under `/projects/<slug>` from `public/projects/<slug>`):
```text
public/projects/
  index.json
  <slug>/
    menu.json
    assets/
      originals/
        backgrounds/
        items/
      derived/
        backgrounds/
        items/
```

Repository policy:
- keep `public/projects/index.json` and sample fixtures used by app/tests,
- allow user-created project folders under `public/projects/*` to stay untracked.

Bridge mode supports:
- ping/list/file/upload/delete/mkdir/move/seed
- save project metadata/index updates
- rename project slug folders safely

Imported project paths are remapped to current slug conventions when needed.

## 7) Save and Export Behavior

### Save project (`Save project`)
Creates a project zip containing:
- `/<slug>/menu.json`
- `/<slug>/assets/originals/...`

Notes:
- save zips keep source-of-truth originals only (derived files are omitted),
- `menu.json` is rewritten to reference `assets/originals/**`,
- derived metadata blocks are stripped from saved `menu.json` so imports can regenerate derivatives deterministically.

### Export static site (`Export site`)
Creates `<slug>-export.zip` containing:
- `index.html`
- `styles.css`
- `app.js`
- `menu.json`
- `assets/...`
- `asset-manifest.json`
- `export-report.json`
- `favicon.ico`
- `serve.command` and `serve.bat`
- `README.txt`

Export rules:
- bridge export runs `prepare-derived` (`ffmpeg`) before packaging,
- exported media paths point to derived startup assets for backgrounds/carousel and originals for detail-card media,
- export package includes `assets/derived/**` and `assets/originals/**` (required for detail interactions),
- legacy paths like `assets/backgrounds/**` and `assets/dishes/**` are excluded,
- exported app script inlines interaction runtime and menu payload,
- startup preload uses a blocking first-view set plus deferred warmup for remaining assets,
- export diagnostics include deterministic manifest + budget report data,
- output expects serving over local HTTP (not direct `file://` open).

### Deploy exported sample sites to `keneth4.github.io`
This repository includes `.github/workflows/deploy-exported-site.yml` to publish all client demos from `exported-sites/` into `keneth4/keneth4.github.io` (your user site repo).

One-time setup:
1. In `keneth4/keneth4.github.io`, set GitHub Pages source to `Deploy from a branch`, branch `main`, folder `/ (root)`.
2. Create a Personal Access Token with write access to `keneth4/keneth4.github.io`.
3. Add that token as repository secret `PAGES_DEPLOY_TOKEN` in this source repo (`menu_maker`).

Daily flow:
1. Export from the app (`Export site`) to get `<slug>-export.zip`.
2. Extract each sample into its own tracked folder, for example:
   - `exported-sites/client-demo-1/`
   - `exported-sites/client-demo-2/`
3. Commit and push your changes to this repo.
4. GitHub Actions runs `Publish Exported Sites Showcase` and syncs `exported-sites/` into `keneth4.github.io`.
5. Share `https://keneth4.github.io/` (a generated index page links every sample folder).

Manual trigger:
- You can run `Publish Exported Sites Showcase` from `Actions` -> `Run workflow` to republish on demand.

Notes:
- Exported shell files are relative (`index.html`, `styles.css`, `app.js`, `menu.json`), so they work correctly in sample subfolders.
- The workflow regenerates `exported-sites/index.html` on each publish to keep the showcase list current.
- `CNAME` in the target repo is preserved by the sync step if you configure a custom domain.

## 8) Import Rules and Constraints

- `.zip` import requires a `menu.json` entry.
- Zip reader supports stored entries; compressed zip import is rejected.
- `.json` import is also supported.
- On bridge mode, zip assets are uploaded automatically into project storage.
- Without bridge mode, zip import can still open metadata but flags missing asset sync.

## 9) Current Technical Notes

- `src/App.svelte` is now a thin composition shell (controller mount + `AppRuntime` composition only).
- `src/ui/components/AppRuntime.svelte` is now a thin runtime wrapper.
- `src/ui/components/AppRuntimeScreen.svelte` is now a thin composition shell.
- Runtime orchestration currently lives in `src/ui/components/AppRuntimeScreenContent.svelte` (`896` lines, within current closeout budget), with redistribution implemented across:
  - `src/application/*` workflows,
  - `src/ui/controllers/*`,
  - `src/ui/stores/*`,
  - `src/export-runtime/*`.
- Workspace shell composition (landing/editor/preview host) is now delegated through:
  - `src/ui/components/RuntimeWorkspace.svelte`.
- Editor tab composition (`info/assets/edit/wizard`) is now delegated through:
  - `src/ui/components/RuntimeEditorTabContent.svelte`.
- Runtime bindings/bootstrap state synchronization now uses a typed bridge:
  - `src/ui/controllers/runtimeStateBridgeController.ts`.
- Runtime bindings/bootstrap composition wiring is delegated through:
  - `src/ui/controllers/runtimeWiringController.ts`.
- Runtime modal/detail orchestration and interactive setup synchronization are delegated through:
  - `src/ui/controllers/runtimeModalSurfaceController.ts`.
- Runtime asset byte loading policy is delegated through:
  - `src/ui/controllers/runtimeAssetReaderController.ts`.
- Runtime shell DOM/orientation helpers are delegated through:
  - `src/ui/controllers/runtimeShellDomController.ts`.
- Draft meta localized-field hydration (`title`/`restaurantName`) is delegated through:
  - `src/ui/controllers/runtimeDraftMetaController.ts`.
- `src/ui/controllers/createAppController.ts` now exposes real action groups and lifecycle-owned mount/destroy wiring.
- Large UI surfaces now expose typed `{ model, actions }` contracts in:
  - `src/ui/components/AssetsManager.svelte`
  - `src/ui/components/EditPanel.svelte`
  - `src/ui/components/WizardPanel.svelte`
  - `src/ui/components/PreviewCanvas.svelte`
  - `src/ui/components/DishModal.svelte`
- Template capability matrix + strategy interface are in `src/core/templates/registry.ts`.
- Domain logic modules are in `src/core/menu/*`.
- Import/export use-cases are in `src/application/export/*`.
- Bridge/filesystem adapters are in `src/infrastructure/*`.
- Bridge API contract remains in `vite.config.ts` (`/api/assets/*`).
- Zip primitives remain in `src/lib/zip.ts`.
- Template behavior reference doc: `TEMPLATE_BEHAVIOR_GUIDE.md`.
- Redistribution mapping reference: `APP_REDISTRIBUTION_REVIEWER_GUIDE.md`.

## 10) Next Development Priorities

Completed in Phases 1-8:
- UI decomposition into focused Svelte components,
- asset and pathing adapters in infrastructure modules,
- import/export use-case extraction and static export diagnostics,
- expanded test coverage (unit + e2e smoke + perf export check),
- template capability matrix + strategy-driven preview/interaction wiring.

Open product and engineering priorities:
- close remaining Jukebox e2e parity regressions (section switching/reactivity + sensitivity assertions),
- stronger wizard recommendations by menu size/use case,
- accessibility hardening and reduced-motion parity across templates,
- continue store/controller ownership migration to reduce runtime-local mutable state in `src/ui/components/AppRuntimeScreenContent.svelte`,
- template expansion using the strategy registry (next template implementation path).

## 11) Local Development

Requirements:
- Node.js `>=18.19.0` (Playwright ESM loader requirement)
- if the host shell resolves an older Node, run commands with explicit path (example):
  - `PATH="/Users/keneth4/.nvm/versions/node/v25.6.1/bin:$PATH" npm run test:e2e:local`

Commands:
- `npm install`
- `npm run dev`
- `npm run build`
- `npm run test`
- `npm run test:e2e` (container-first full e2e gate, local fallback)
- `npm run test:e2e:container` (forced full containerized e2e gate)
- `npm run test:e2e:local` (forced local Playwright run)
- `npm run test:perf` (container-first perf gate for `performance-fluidity`, local fallback)
- `npm run test:perf:container` (forced containerized `performance-fluidity` gate)

Current validation snapshot (`2026-02-17`, docs sync pass):
- `npm run build`: PASS
- `npm test`: PASS (`62` files, `183` tests)
- `npm run test:e2e`: FAIL (`33 passed`, `3 skipped`, `6 failed` in container-first run; local fallback in host shell failed due Node runtime mismatch)
- `PATH="/Users/keneth4/.nvm/versions/node/v25.6.1/bin:$PATH" npm run test:e2e:local`: FAIL (`36 passed`, `1 skipped`, `5 failed`)
- `npm run test:perf`: PASS (container-first perf gate)

Install note:
- `postinstall` runs `scripts/patch-parse5-for-jsdom.mjs` to apply local jsdom/parse5 compatibility fixes required by the current host runtime constraints.

## 12) Container Workflows (Phase 6)

Added container files:
- `Dockerfile.dev`
- `Dockerfile.prod`
- `docker-compose.yml`
- `scripts/container-smoke.sh`

### Environment contract
- `VITE_PORT` (default `5173`): host port mapped to dev app (`app` service).
- `PREVIEW_PORT` (default `4173`): host port mapped to static preview (`preview` service).
- `APP_PORT` (default `5173`): smoke script target port.
- `E2E_GREP` (default empty): optional Playwright grep for containerized e2e runs. Empty value runs full suite.
- `ALLOW_CONTAINER_BUILD`:
  - `scripts/container-smoke.sh` default is `0` (fail fast if images are missing),
  - `npm run test:e2e` and `npm run test:perf` default it to `1` unless explicitly overridden.
- `PLAYWRIGHT_DOCKER_TAG` (default auto-derived, fallback `v1.58.1-jammy`): Playwright image tag used by container smoke e2e service.

Mount points in `docker-compose.yml`:
- Source code: `./ -> /app`
- Dependencies cache: `menumaker_node_modules -> /app/node_modules`

This keeps the bridge API contract stable under container dev:
- `/api/assets/ping`
- `/api/assets/list`
- `/api/assets/file`
- `/api/assets/upload`
- `/api/assets/delete`
- `/api/assets/mkdir`
- `/api/assets/move`
- `/api/assets/seed`
- `/api/assets/save-project`
- `/api/assets/rename-project`

### Container commands
- `npm run docker:dev`
  - Builds and runs the editor/dev server at `http://127.0.0.1:${VITE_PORT:-5173}`.
  - First run installs container dependencies into the `menumaker_node_modules` volume.
- `npm run docker:preview`
  - Builds production bundle and serves `dist/` at `http://127.0.0.1:${PREVIEW_PORT:-4173}`.
- `npm run docker:smoke`
  - Runs bridge smoke checks (ping/upload/list/file) plus a dedicated Playwright container run against the running containerized app.
  - Default run executes the full e2e suite; set `E2E_GREP` to target a subset.
  - E2E container uses internal Docker alias `menumaker-dev` (avoids Chromium HSTS behavior on hostname `app`).

### Optional manual smoke sequence
1. `docker compose up -d --build app`
2. Verify bridge: `curl "http://127.0.0.1:5173/api/assets/ping?project=manual-smoke"`
3. Run containerized e2e against containerized server:
   `npm run test:e2e:container`
4. Run containerized perf gate:
   `npm run test:perf:container`
5. `docker compose down`

## 13) Performance Hardening (Phase 7)

Added in this phase:
- deterministic export diagnostics files:
  - `asset-manifest.json` (all exported files with sizes, mime, role, first-view flag),
  - `export-report.json` (counts/bytes/missing assets/responsive coverage + budget checks).
- export budget evaluation for:
  - Export JS gzip (`<= 95 KB` target),
  - Export CSS gzip (`<= 12 KB` target),
  - first-view image payload (`<= 1.2 MB` target).
- startup preload strategy update:
  - block on first-view asset subset,
  - defer non-critical asset warmup to idle/background.

Validation:
- `npm run test:perf` asserts export zip includes diagnostics and that no budget check is failing.

## 14) Template System Readiness (Phase 8)

Added in this phase:
- capability matrix + strategy registry:
  - `src/core/templates/registry.ts`
- template options now derive from the capability matrix:
  - `src/core/templates/templateOptions.ts`
- preview shell rendering now uses strategy interface methods instead of hardcoded template branches:
  - `src/ui/components/PreviewCanvas.svelte`
- interaction handlers in app shell now use template capabilities (axis, thresholds, settle timing) instead of `focus-rows`/`jukebox` conditionals:
  - `src/ui/components/AppRuntimeScreenContent.svelte`
- fixture-backed template smoke path added for strategy validation:
  - `public/projects/sample-jukebox-smoke/menu.json`

Validation:
- `src/core/templates/registry.test.ts` validates registry coverage and fixture paths.
- `tests/e2e/app.spec.ts` includes a template fixture smoke test for the `jukebox` strategy shell.

---

If this file drifts from implementation, prefer updating this README and then synchronizing planning docs so product, engineering, and refactor work stay aligned.
