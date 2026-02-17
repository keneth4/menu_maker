# 07 - Coding Practices and Extension Playbook

## Mandatory engineering practices
- Keep domain logic in `core`/`application`; keep rendering in `ui/components`.
- Use controller extraction for side effects and orchestration.
- Preserve strict preview/export parity for behavior-critical paths.
- Add or update regression tests before and after behavior-moving refactors.
- Respect architecture line-budget guardrails in `src/App.architecture.test.ts`.
- Prefer typed model/actions component contracts over callback sprawl.

## Refactor safety checklist
Before merging:
1. No bridge/export contract drift.
2. No template behavior drift.
3. No save/export packaging drift.
4. Unit + e2e + perf gates green in expected environment.
5. New ownership mapping documented in reviewer/tracker docs.

## Pattern: adding a new template behavior safely
1. Add capabilities/strategy in `core/templates`.
2. Keep normalization and fallback rules deterministic.
3. Implement preview behavior through controller path (`runtimePreviewAdapterController` + related controllers).
4. Mirror export behavior in runtime fragments.
5. Add parity e2e + unit assertions for interaction semantics.

## Pattern: extending export runtime safely
1. Add logic under `src/export-runtime/fragments`.
2. Keep `buildRuntimeScript.ts` as thin orchestrator.
3. Reuse shared helpers from `application`/`core` when possible.
4. Add unit coverage for helper presence and generated output invariants.
5. Validate with parity specs and export diagnostics checks.

## Worked example: add a template-specific desktop shortcut
Goal: add `Home` key behavior for one template without drift.
1. Add capability flag in `src/core/templates/registry.ts`.
2. Implement shortcut handling in `src/ui/controllers/previewNavigationController.ts`.
3. Wire behavior through `src/ui/controllers/runtimePreviewAdapterController.ts` (do not mutate Svelte view files directly).
4. Mirror runtime behavior in `src/export-runtime/fragments/runtimeScriptComposer.ts`.
5. Add tests:
   - unit: `src/ui/controllers/previewNavigationController.test.ts`
   - e2e parity: `tests/e2e/jukebox-scroll-parity.spec.ts` (or template-specific parity spec)
6. Run gates: `npm run build`, `npm test`, `npm run test:e2e`, `npm run test:perf`.

## Anti-patterns to avoid
- Reintroducing monolithic orchestration in `App.svelte` or thin runtime shells.
- Cross-layer imports that violate dependency direction.
- Unbounded wheel/timer logic without deterministic cleanup.
- Controller behavior changes without matching e2e parity tests.
- Directly mutating draft/template state inside presentation components instead of action/controller pipelines.

## Diagram
- Template interaction stateflow source: [`../diagrams/template-interaction-stateflow.mmd`](../diagrams/template-interaction-stateflow.mmd)
