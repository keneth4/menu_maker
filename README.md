# MenuMaker (menu-interactivo)

MenuMaker is a Svelte + Vite application for building and previewing interactive digital menus, managing assets, and exporting either:
- a project backup zip (editor source package), or
- a static site zip (ready to host with a local server).

This document is the current short technical and product documentation for the app behavior as implemented today.

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
- typography selection (built-in or custom font URL),
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
- `meta`: slug, name, restaurant/title localized text, template, locales, currency, font config.
- `backgrounds[]`: media assets for rotating background.
- `categories[]`: localized category name + dish list.
- `items[]`: localized name/description/longDescription, price, allergens, vegan flag, media.
- `sound`: scaffold exists for future sound behavior.

## 5) Template Behavior (Implemented)

### A) `focus-rows` (default, conversion-safe)
- vertical movement between sections,
- horizontal carousel inside each section,
- center-focused dish emphasis via scale/opacity/blur depth,
- wheel + touch intent logic with settle/snap behavior,
- desktop arrow support for dish stepping.

### B) `jukebox` (visual mode)
- circular-disc style dish arrangement,
- vertical wheel/touch rotates active dish within section,
- horizontal section navigation with snap behavior,
- stronger visual motion profile vs focus-rows.

### Shared template behavior
- dish modal with long description, allergens, vegan badge, price,
- responsive media source selection when variants exist,
- fallback to static image rendering when advanced decoder path is unavailable.

## 6) Storage and Asset Modes

MenuMaker supports three runtime modes:
- `filesystem`: browser File System Access API (`showDirectoryPicker`),
- `bridge`: Vite dev server API under `/api/assets/*`,
- `none`: no writable asset backend active.

Bridge mode supports:
- ping/list/file/upload/delete/mkdir/move/seed
- save project metadata/index updates
- rename project slug folders safely

Imported project paths are remapped to current slug conventions when needed.

## 7) Save and Export Behavior

### Save project (`Save project`)
Creates a project zip containing:
- `/<slug>/menu.json`
- `/<slug>/assets/...`

Notes:
- asset paths are rewritten to portable `assets/...` references inside `menu.json`,
- responsive export media fields are removed for project-save zips.

### Export static site (`Export site`)
Creates `<slug>-export.zip` containing:
- `index.html`
- `styles.css`
- `app.js`
- `menu.json`
- `assets/...`
- `favicon.ico`
- `serve.command` and `serve.bat`
- `README.txt`

Export rules:
- hero images can be auto-generated into responsive variants (`small`, `medium`, `large`),
- exported app script inlines interaction runtime and menu payload,
- output expects serving over local HTTP (not direct `file://` open).

## 8) Import Rules and Constraints

- `.zip` import requires a `menu.json` entry.
- Zip reader supports stored entries; compressed zip import is rejected.
- `.json` import is also supported.
- On bridge mode, zip assets are uploaded automatically into project storage.
- Without bridge mode, zip import can still open metadata but flags missing asset sync.

## 9) Current Technical Notes

- Main behavior is still concentrated in `src/App.svelte`.
- Asset bridge contract is in `vite.config.ts`.
- Zip utilities live in `src/lib/zip.ts`.
- Template and roadmap strategy docs:
  - `TEMPLATE_BEHAVIOR_GUIDE.md`
  - `TEMPLATE_ROADMAP.md`

## 10) Future Development (Recommended)

Short-term refactor direction:
- split `src/App.svelte` into focused feature modules/components,
- isolate asset operations behind adapters/services,
- isolate import/export logic from UI concerns,
- expand automated tests beyond current smoke checks.

Product direction opportunities:
- template capability matrix and explicit constraints per template,
- stronger wizard recommendations based on menu size/use case,
- deeper accessibility and reduced-motion parity,
- richer performance reporting in export pipeline.

## 11) Local Development

Requirements:
- Node.js 20+ recommended

Commands:
- `npm install`
- `npm run dev`
- `npm run build`
- `npm run test`
- `npm run test:e2e`

---

If this file drifts from implementation, prefer updating this README and then synchronizing planning docs so product, engineering, and refactor work stay aligned.
