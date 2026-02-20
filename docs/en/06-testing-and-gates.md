# 06 - Testing and Gates

## Test pyramid (current)
- Unit tests: workflow/controllers/core rules (`vitest`)
- Component tests: key UI contract surfaces (`@testing-library/svelte`)
- E2E tests: parity/regression behavior (`playwright`)
- Perf gate: fluidity/responsiveness smoke spec

## Required gate commands
- `npm run build`
- `npm test`
- `npm run test:e2e`
- `npm run test:perf`

Container-forced variants:
- `ALLOW_CONTAINER_BUILD=1 npm run test:e2e:container`
- `npm run test:perf:container`

## Container-first behavior
- `npm run test:e2e` and `npm run test:perf` attempt container path first.
- If the wrapper cannot complete in container mode, local fallback can execute (as defined in scripts).
- strict container checks should use explicit `*:container` commands.

## Current status (2026-02-20 docs sync)
- `npm run build`: PASS
- `npm test`: PASS (`67` files, `230` tests)
- `npm run test:e2e`: not re-run in this docs sync (last historical sweep was failing; see snapshot doc)
- `npm run test:perf`: not re-run in this docs sync

Notes:
- Host shell Node resolution can differ from nvm-managed Node.
- This host can require a pinned Node path for local Playwright fallback (`>=18.19`) when shell resolution differs.

## Flaky-risk areas and stabilization rules
- Section background settle timing:
  - avoid overly tight poll windows for cross-environment rendering
- Perf jitter in containers:
  - use percentile metrics (`p95`, `p99`) plus bounded outlier caps
- File chooser handling:
  - prefer deterministic hidden-input upload in e2e when event-based chooser is flaky
- Interactive media decode path:
  - use deterministic fixtures for codec-sensitive tests

## Diagram
- Test gate pipeline source: [`../diagrams/test-gate-pipeline.mmd`](../diagrams/test-gate-pipeline.mmd)
