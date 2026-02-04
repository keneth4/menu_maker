# Editing UX Conclusion Plan

## Objective
Make multilingual menu editing fast, clear, and low-friction, especially when translating dishes and managing parent-child structure (Section -> Dish).

## What we improved now
1. Added edit sub-tabs for clearer hierarchy:
   - `Identity`
   - `Sections`
   - `Dishes`
2. Added repeated quick language switch inside edit flow (globe chip) so users can switch language without scrolling to the top.
3. Updated option labels to respect the active editing language in key edit/wizard selectors.
4. Added hierarchy helper copy to make parent-child relationships visually explicit.

## Next UX iterations (recommended)

### Phase 1: Translation-first workflow
1. Add side-by-side translation mode for dish text:
   - Left: source language
   - Right: target language
2. Add quick "copy source text" actions for each field.
3. Add per-field translation completion indicators.

### Phase 2: Information architecture polish
1. Keep section context sticky while editing dishes.
2. Add breadcrumb at all times:
   - `Section > Dish`
3. Add dish list with search/filter by language completion.

### Phase 3: Data confidence and speed
1. Add autosave indicator and unsaved-change status.
2. Add lightweight validation badges:
   - Missing name
   - Missing price
   - Missing 360 asset
3. Add keyboard shortcuts for next/previous dish and language switch.

### Phase 4: Accessibility and mobile comfort
1. Improve focus order and keyboard navigation across sub-tabs.
2. Keep controls reachable in mobile landscape (sticky action row).
3. Improve touch targets for dense edit controls.

## Success criteria
1. Switching language while editing a dish takes one tap/click.
2. Users can always see what section and dish they are editing.
3. Translating one dish into another language can be done without scrolling to the top.
4. New users can identify hierarchy and workflow in under 30 seconds.
