# Template Behavior Guide

## 1) In Focus Rows: Behavior and Reasoning

### Core intent
`In Focus Rows` is the baseline template for reading a menu quickly without cognitive overload.

It is designed around two axes:
- **Vertical axis = sections** (Cafe, Brunch, etc.)
- **Horizontal axis = dishes inside each section**

This gives users one clear question at a time:
1. Which section am I in?
2. Which dish is currently in focus?

### Interaction behavior
- The page scrolls vertically between sections.
- Each section has a horizontal carousel of dishes.
- The dish nearest the center gets a stronger visual state (scale/opacity/sharpness).
- On desktop, arrows assist horizontal movement when touch/trackpad is unavailable.
- Clicking/tapping a dish opens details.

### Focus logic
The template continuously computes "closest-to-center" and applies a focus treatment.

That focus treatment solves 3 UX problems:
- **Orientation:** users always know the currently selected item.
- **Readability:** only one card is fully emphasized at a time.
- **Motion comfort:** peripheral cards fade/blur instead of jumping.

### Why this template is strong for business
- Works for many menu sizes and device types.
- Easy to understand for first-time users.
- Great default for restaurants that prioritize clarity over novelty.
- Reusable data model: categories/items/assets map directly with no special content requirements.

### Animation principles behind In Focus Rows
- Motion should communicate hierarchy, not decoration.
- Snap + center behavior should reduce ambiguity after user input ends.
- Transitions should be smooth but short; avoid long easing that feels laggy.

---

## 2) Template Design System (Step by Step)

Use this process for every new template.

### Step 1: Define interaction grammar
- What does vertical scroll do?
- What does horizontal scroll do?
- What is the primary "focus" state?
- What is the fallback behavior for keyboard/mouse-only users?

### Step 2: Define visual hierarchy
- Which 3 elements are always visible?
- Which element gets strongest emphasis?
- How do inactive items look (opacity/scale/blur)?

### Step 3: Define motion rules
- Input thresholds (wheel/touch sensitivity)
- Cooldowns/debouncing
- Snap timing (idle-to-center)
- Active/inactive transition durations

### Step 4: Define template contract
- Required assets (background, dish hero, optional responsive variants)
- Required text fields (name, description, price)
- Empty-state behavior

### Step 5: Define accessibility/operability
- Arrow button support on desktop
- Click/tap hints
- Sensible focus state even when interaction stops mid-gesture
- Keyboard and reduced-motion support

### Step 6: Validate with a fixed QA pass
- Trackpad, mouse wheel, keyboard
- Desktop and mobile viewport checks
- Fast-scroll stress test
- First-load perception (progress, no flash of empty/unstyled content)

---

## 3) Jukebox Template: Structured Iteration Plan

### Current interaction model
- Vertical wheel spins items on a circular "disc".
- Horizontal movement changes sections (one disc per section).
- Center item is the active dish.

### Polish plan
1. **Motion quality pass**
- Improve orbit card interpolation so the center card settles naturally.
- Tune acceleration/deceleration curves for less robotic motion.

2. **State clarity pass**
- Add stronger active-card framing/light treatment.
- Improve off-center depth cues so ordering is obvious.

3. **Input harmony pass**
- Align touch drag and wheel behavior so both feel equivalent.
- Keep sensitivity consistent across devices and OS wheel modes.

4. **Section transition pass**
- Add stronger section change feedback (label fade/slide, disc handoff).
- Prevent half-shifted states with mandatory horizontal snap.

5. **Final production pass**
- Accessibility labels and keyboard parity.
- Performance profile under large animated assets.

---

## 4) Next Template Candidates (Designed Like a System)

### A) Watch Orbit
- Single-section-first design inspired by wearable interactions.
- Best for art collections, signature dishes, tasting flights.
- Strength: premium storytelling, high visual impact.
- Risk: discoverability if cues are weak.

### B) Gallery Lens
- One large hero with a filmstrip rail below.
- Best for visual portfolios and limited menus.
- Strength: strongest media showcase with clear focus.
- Risk: less efficient for very long catalogs.

### C) Story Chapters
- Full-screen chapters with dish-by-dish narrative progression.
- Best for chef tasting menus and events.
- Strength: emotional storytelling.
- Risk: slower scanning for users who want quick comparisons.

### D) Grid Pulse
- Dense grid with focus expansion on hover/tap.
- Best for long menus where quick scanning matters.
- Strength: information throughput.
- Risk: less cinematic brand feel.

---

## 5) Recommendation

- Keep `In Focus Rows` as the **default conversion-safe template**.
- Continue polishing `Jukebox` as the **brand experience template**.
- Build `Watch Orbit` next as the **premium showcase template** for art-like or signature content.

This creates a strong product ladder:
- Clear default (`In Focus Rows`)
- Expressive option (`Jukebox`)
- Premium storytelling (`Watch Orbit`)
