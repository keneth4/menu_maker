# Template Roadmap

## Objective
Build a template lineup that keeps the current menu use case strong while opening a premium lane for immersive and art-like digital experiences.

## Strategic Direction
1. Keep one "fast default" template for most restaurants.
2. Keep one "visual premium" template for higher-ticket clients.
3. Add one "experiential" template (Watch Orbit) as an upsell, not the default.

## Recommendation on Watch Orbit
Watch Orbit is useful for the business plan if we position it as:
- Premium storytelling template for signature menus, tasting menus, cocktails, and digital art.
- Optional mode for clients who value brand experience over dense scanning.

It should not replace the default template because dense menus still need a quick, list-first flow.

## Template Portfolio

### 1) Focus Rows Pro (Core, default)
Goal: fastest browsing and strongest readability.
- Horizontal section controls with arrows on desktop.
- Responsive small/medium/large image loading.
- Startup loader and progressive asset preload.
- Strong accessibility and keyboard navigation.

### 2) Jukebox Stories (Core+, visual)
Goal: immersive but still practical for medium-size menus.
- Full-bleed visual transitions.
- Section-level storytelling cards.
- Lightweight motion and smooth fallback for low-power devices.

### 3) Watch Orbit (Premium / Experimental)
Goal: wow-factor interaction for curated content.
- Circular/orbit navigation inspired by watch-like interaction.
- Best with one primary section (or a small number of curated sections).
- Great for chef picks, gallery menus, drink flights, and digital art sets.
- Must include quick fallback to linear list mode.

### 4) Quick QR Lite (Utility)
Goal: performance-first template for high-volume operations.
- Minimal visual effects.
- Aggressive lightweight asset usage.
- Designed for weak connections and older phones.

## Release Plan

### Phase 1 (Now -> March 2026): Foundation
- Finalize shared performance layer across templates.
- Lock responsive asset pipeline contract (small/medium/large).
- Define template capability matrix (supports sections, 360 media, animations, list fallback).

### Phase 2 (March -> April 2026): Core Template Upgrades
- Ship Focus Rows Pro updates.
- Ship Jukebox Stories updates.
- Add template-level performance budget checks before export.

### Phase 3 (April -> June 2026): Watch Orbit Beta
- Build Watch Orbit as opt-in beta.
- Add strict content guidance in wizard (ideal number of items, recommended asset ratios).
- Add runtime fallback if device FPS or memory is low.

### Phase 4 (June -> July 2026): Product Expansion
- Launch Quick QR Lite.
- Add "template recommendation" step in wizard based on venue type and menu size.

## Success Metrics
- Exported site first meaningful load under 2.5s on mid-tier mobile test profiles.
- At least 95% smooth interactions in internal scroll/animation QA runs.
- Template adoption split target:
  - 60% Focus Rows Pro
  - 25% Jukebox Stories
  - 10% Quick QR Lite
  - 5% Watch Orbit (premium lane)
- Increased premium-package attach rate after Watch Orbit beta launch.

## Risks and Mitigations
- Risk: Watch Orbit can hurt usability for large menus.
  - Mitigation: force list fallback and onboarding hints.
- Risk: Heavy assets reduce smoothness.
  - Mitigation: keep original uploads, but export responsive variants and preload only required sizes.
- Risk: Template sprawl increases maintenance cost.
  - Mitigation: one shared rendering/performance core and template capability tests.

## Immediate Next Tasks
1. Create a template capability matrix in code/docs.
2. Define Watch Orbit interaction spec (gesture, click, keyboard, fallback states).
3. Add export performance validation report (asset counts, size totals, missing responsive variants).
