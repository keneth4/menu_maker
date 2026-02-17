# MenuMaker (menu-interactivo)

MenuMaker is a Svelte + Vite app for authoring interactive menu projects and exporting static client-ready menu sites.

## Quick Start

Requirements:
- Node.js `>=18.19.0`
- npm

Core commands:
```bash
npm install
npm run dev
npm run build
npm test
npm run test:e2e
npm run test:perf
```

Optional container commands:
```bash
npm run docker:dev
npm run docker:preview
npm run docker:smoke
```

## Export and Publish to `keneth4.github.io`

### One-time setup
1. In `keneth4/keneth4.github.io`, configure Pages to deploy from your default branch (`main` or `master`) at `/ (root)`.
2. Create a Personal Access Token with write access to `keneth4/keneth4.github.io`.
3. Add the token as repository secret `PAGES_DEPLOY_TOKEN` in this repo (`menu_maker`).

### Daily flow
1. In the app, run `Export site` to produce `<slug>-export.zip`.
2. Extract each sample into `exported-sites/<sample-name>/`.
3. Commit and push changes to this repo.
4. GitHub Actions workflow `Publish Exported Sites Showcase` syncs `exported-sites/` to `keneth4/keneth4.github.io`.
5. Share `https://keneth4.github.io/` (showcase index is generated automatically).

Manual trigger:
- Run `Publish Exported Sites Showcase` from the Actions tab when you want to republish on demand.

## Documentation Hub
- English docs index: `docs/en/INDEX.md`
- Espanol docs index: `docs/es/INDICE.md`
- Historical archive: `docs/archive/README.md`
- Shared diagrams: `docs/diagrams/`

## Repository Orientation
- `src/`: application source code (core, application, UI, infrastructure, export-runtime)
- `public/projects/`: sample fixtures and local project storage roots
- `exported-sites/`: extracted static export samples used for client showcase publishing
- `docs/`: active architecture, runtime, and testing documentation (EN/ES)
- `scripts/`: test and runtime helper scripts

## Notes
- Legacy phase/program planning files are archived under `docs/archive/2026-02-refactor-program/`.
- Root-level phase files are now stubs that point to the archive and active docs indices.
