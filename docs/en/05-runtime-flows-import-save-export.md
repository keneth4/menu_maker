# 05 - Runtime Flows: Import, Save, Export

## Open project flow (JSON/ZIP)
1. Trigger open action from landing/editor.
2. Parse input:
   - JSON: normalize directly
   - ZIP: locate `menu.json`, parse entries, map assets
3. Run path normalization and template canonicalization.
4. Hydrate runtime state (`project`, `draft`, selection, template capabilities).
5. If bridge mode, upload/map assets and optionally derive outputs.
6. Refresh asset workspace and preview synchronization.

Failure paths:
- missing `menu.json` in zip
- malformed JSON
- unsupported archive shape
- bridge upload/derive failure (should degrade gracefully where contract allows)

## Save project flow
1. Validate current draft/project state.
2. Rewrite paths toward save contract (originals-focused).
3. Package save ZIP.
4. Emit workflow progress and completion status.

## Export static site flow
1. Validate export readiness.
2. In bridge mode, run derived preparation.
3. Compose runtime script (`export-runtime` builder + fragments).
4. Rewrite export asset paths and pack static shell.
5. Emit diagnostics/manifest artifacts.

## Wizard template apply behavior
- Wizard applies template through controller pipeline.
- Showcase/demo preview must be eligibility-gated (`isWizardShowcaseEligible`) to avoid overriding non-blank user projects.

## Preview/export parity checkpoints
Before closing a refactor pass, verify:
- template section/item navigation parity
- background visibility and section mapping parity
- detail image source priority parity
- locale and text rendering parity

## Diagrams
- Runtime lifecycle: [`../diagrams/runtime-lifecycle-sequence.mmd`](../diagrams/runtime-lifecycle-sequence.mmd)
- Dataflow: [`../diagrams/import-save-export-dataflow.mmd`](../diagrams/import-save-export-dataflow.mmd)
