# MenuMaker Documentation (EN)

This documentation set describes the current codebase architecture, runtime behavior, testing/gate strategy, and safe extension practices.

## Audience
- Core maintainers
- New contributors onboarding to current architecture
- Readers using the Spanish mirror: `../es/INDICE.md`

## How to use this set
1. Read `01-system-overview.md` for scope and operating modes.
2. Read `02-architecture-high-level.md` and `03-architecture-runtime-deep-dive.md` for implementation structure.
3. Use `04` and `05` for data/flow decisions before editing workflow code.
4. Follow `06` and `07` before opening any refactor or feature PR.
5. Use `08-current-state-snapshot-and-delta.md` as the current-state operational baseline.

## Chapters
- [01 - System Overview](./01-system-overview.md)
- [02 - Architecture High-Level](./02-architecture-high-level.md)
- [03 - Architecture Runtime Deep Dive](./03-architecture-runtime-deep-dive.md)
- [04 - Data Model and Assets](./04-data-model-and-assets.md)
- [05 - Runtime Flows: Import, Save, Export](./05-runtime-flows-import-save-export.md)
- [06 - Testing and Gates](./06-testing-and-gates.md)
- [07 - Coding Practices and Extension Playbook](./07-coding-practices-and-extension-playbook.md)
- [08 - Current-State Snapshot and Delta](./08-current-state-snapshot-and-delta.md)

## Shared diagrams
All architecture and flow diagrams are source-controlled under:
- [`../diagrams/`](../diagrams/)

Primary diagram files:
- [`system-context.mmd`](../diagrams/system-context.mmd)
- [`layered-architecture.mmd`](../diagrams/layered-architecture.mmd)
- [`runtime-controller-wiring.mmd`](../diagrams/runtime-controller-wiring.mmd)
- [`runtime-lifecycle-sequence.mmd`](../diagrams/runtime-lifecycle-sequence.mmd)
- [`template-interaction-stateflow.mmd`](../diagrams/template-interaction-stateflow.mmd)
- [`import-save-export-dataflow.mmd`](../diagrams/import-save-export-dataflow.mmd)
- [`bridge-api-flow.mmd`](../diagrams/bridge-api-flow.mmd)
- [`test-gate-pipeline.mmd`](../diagrams/test-gate-pipeline.mmd)
