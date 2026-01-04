## Recipe Extractor — Implementation Plan (V1 → Cooking Mode)

This plan is written for **incremental delivery** with frequent **manual checkpoints** (especially on mobile).  
Focus areas:

- **Cooking mode** (step player + quick ingredients access)
- Steps schema change: `title` + `instruction` + optional “learn more”
- Ingredient alternative measurements (safe conversions first, approximations clearly labeled)
- Language toggle: **Original** vs **English**
- Mobile UX & accessibility improvements (from `docs/ux-audit.md` + additional findings)

Non-goals for this plan (for now):

- API keys UX polishing (skip)
- Social sharing / printing (nice-to-have later)

---

## Guiding principles (so decisions stay consistent)

- **Cooking-first**: optimize for the moment someone is actively cooking with one hand.
- **Glanceable**: all critical info should be readable in 1–2 seconds.
- **Forgiving touch**: primary actions are 44–56px touch targets; avoid tiny icon-only targets.
- **Stable layout**: avoid jumpy UI that loses scroll position or the user’s place.
- **Accessible by default**: don’t block zoom; labels for inputs; keyboard focus is coherent.
- **Truth over magic**: only show conversions you can justify; mark approximations explicitly.

---

## Milestone 0 — Baseline & “definition of done”

**Goal**: establish a repeatable way to verify changes on mobile and prevent regressions.

### Tasks

- Add a simple “QA checklist” section to this doc (see bottom) and use it after every milestone.
- Decide your primary mobile test devices:
  - iPhone Safari (or simulator)
  - Android Chrome
- Decide one “golden” recipe URL in Polish and one in English you’ll use repeatedly.

### Manual checkpoint (5–10 min)

- On a phone:
  - App loads quickly and is usable with one hand.
  - No console errors that break the UI.

**Acceptance criteria**

- You can confidently test every milestone with the same quick checklist.

---

## Milestone 1 — Accessibility & mobile ergonomics (must-fix foundation)

**Goal**: remove known UX blockers and align with “kitchen” constraints.

### Tasks (small, independent)

1. **Allow zoom**
   - Remove `maximumScale: 1` and `userScalable: false` from `app/layout.tsx`.
2. **Wake lock feedback**
   - Replace `alert()` usage in `components/screen-wake-lock.tsx` with non-blocking feedback:
     - Inline state (button label/icon changes)
     - Optional toast for errors only
3. **Touch targets**
   - Increase servings +/- buttons in `components/servings-adjuster.tsx` from ~32px to **≥44px**.
   - Increase step detail toggle target (see Milestone 4).
4. **Input labeling**
   - Add an accessible label for the URL input in `components/url-input.tsx`.

### Manual checkpoints

- **Zoom**: pinch-zoom works; content reflows acceptably.
- **Wake lock**: toggling does not block the UI; state is obvious (on/off).
- **Servings**: can reliably tap +/- with thumb; no mis-taps.
- **URL input**: screen reader sees a proper label (or at least `aria-label`).

**Acceptance criteria**

- No blocking UI dialogs while cooking.
- App is usable by users who rely on zoom.

---

## Milestone 2 — Data model update: steps become “title + instruction + learn more”

**Goal**: align extraction + UI with your desired step structure.

### Tasks

1. Update types
   - In `lib/types.ts`:
     - Replace `RecipeStep.summary` with:
       - `title: string`
       - `instruction: string` (doable without expanding)
       - `details?: string` (learn more)
       - `duration?: string`
2. Update extraction prompt + validation
   - In `lib/extract-recipe.ts`:
     - Ask model to output `title` + `instruction` + optional `details`.
     - Ensure `instruction` is actionable and not just a verb phrase.
3. Update UI
   - In `components/recipe-steps.tsx`:
     - Render:
       - Step number
       - `title` as the bold line
       - `instruction` as the default text
       - “Learn more” expands `details` (if present)

### Manual checkpoints

- Load a known recipe from history:
  - Each step shows enough to perform it without expanding.
  - Expanding “Learn more” feels optional (tips/troubleshooting).

**Acceptance criteria**

- “Wall of text” is avoided while still being fully cookable without expanding.

---

## Milestone 3 — Overview mode improvements (pre-cook planning)

**Goal**: make the existing recipe view better for prepping/shopping and reduce scrolling pain.

### Tasks

1. Ingredient checkboxes (prep tracking)
   - Add optional “checkbox mode” for ingredients:
     - Either always visible, or toggled with a “Prep mode” switch.
   - Persist ingredient checked state per recipe (localStorage), or per session (start with session).
2. Step completion tracking (place-keeping)
   - Add completion state to steps:
     - Checkbox or “mark done” per step
     - Visual state for completed steps
3. Make “Reset servings” a real button
   - Replace tiny `(reset to X)` with a clear, tappable button.

### Manual checkpoints

- Mark 2–3 ingredients as gathered; reload the page:
  - If persisted: state remains (or clearly resets if that’s intended).
- Mark step 1 complete:
  - Completed state is obvious at a glance.
- Change servings and reset:
  - Reset is easy to hit with thumb.

**Acceptance criteria**

- Users can prep without losing place or re-reading.

---

## Milestone 4 — Cooking Mode MVP (the big UX win)

**Goal**: implement a dedicated “execution” view optimized for mobile cooking.

### UX spec (MVP)

- Add a **“Start Cooking”** button between Ingredients and Instructions (overview page).
- Cooking mode screen includes:
  - **Step player** (primary)
    - Current step number + title
    - Large instruction text
    - Big **Back** / **Next** buttons (≥48px tall)
    - Progress indicator: “Step 3 of 8”
    - Optional “Learn more” expands details inline
  - **Ingredients access** (secondary)
    - A collapsible ingredients drawer (bottom sheet or top collapsible)
    - Shows scaled quantities and checkboxes
    - Remembers scroll position inside the drawer
  - **Peek without navigating**
    - Show “Up next: …” and “Previously: …” as small preview rows (no gestures required)

### Tasks

1. Add `CookingMode` UI state
   - In `components/recipe-view.tsx` (or a new component), add a state machine:
     - `mode: "overview" | "cooking"`
2. Implement the step player component
   - New component: `components/cooking-mode.tsx` (recommended)
   - State:
     - `currentStepIndex`
     - `completedSteps` (reuse Milestone 3)
3. Implement ingredients drawer
   - Reuse `IngredientList`, but add a compact mode (smaller spacing) for the drawer.
4. Improve step expand hit area
   - Make step header tappable (not just tiny chevron) in overview mode.
5. Keyboard / accessibility
   - Ensure focus order makes sense.
   - Buttons have clear `aria-label`s.

### Manual checkpoints (mobile, real cooking simulation)

- With phone in one hand:
  - Tap “Start Cooking”
  - Advance 5 steps without precision tapping
  - Open ingredients drawer, scroll, close it, and you’re still on the same step
  - The “Up next / Previously” previews reduce anxiety (“where am I?”)
- “Learn more” expands without jumping scroll.

**Acceptance criteria**

- A user can cook from the phone without scrolling between ingredients and steps.

---

## Milestone 5 — Ingredient alternative measurements (trustworthy conversions)

**Goal**: allow expanded ingredient rows showing alternative measures while staying honest.

### Strategy (two phases)

- **Phase 1 (deterministic conversions; safe)**
  - tsp/tbsp/cup ↔ ml
  - oz ↔ g
  - lb ↔ g/kg
- **Phase 2 (ingredient-dependent; explicitly approximate)**
  - Add a small density table for common ingredients (flour, sugar, butter, honey, rice, salt…)
  - Display approximations with **“≈”** and a tooltip/warning.

### Tasks

1. Add conversion utilities
   - New file: `lib/unit-conversions.ts`
   - Provide:
     - Parsing helpers (unit normalization)
     - Conversions returning a list of alternatives
2. Update ingredient data model (optional)
   - Option A (simple): compute alternatives on the fly from `name/unit/quantity`.
   - Option B (explicit): extend Ingredient type with `alternatives?: AlternativeMeasurement[]`.
3. UI: tap ingredient to expand
   - In `components/ingredient-list.tsx`:
     - Make each ingredient row a button-like control
     - Expand panel shows “Also: …”

### Manual checkpoints

- Tap 3 ingredients:
  - Expanded panel opens/closes reliably.
  - Conversions are sensible and labeled clearly.
- Verify units:
  - tbsp → ml shows correct conversion.
  - Any grams-from-tbsp is marked **≈** with explanation.

**Acceptance criteria**

- Alternative measurements feel helpful, not misleading.

---

## Milestone 6 — Language selection: Original vs English

**Goal**: let users choose the recipe language for UI content.

### Product decisions to make (before coding)

- Where should the toggle live?
  - Recommended: recipe view header (overview + cooking mode), plus a default in settings later.
- Default behavior:
  - Recommended: default to **Original**, with an easy toggle to **English**.

### Tasks

1. Extend recipe model to support both languages
   - Option A (store both):
     - `titleOriginal`, `titleEn`, etc.
   - Option B (store original + on-demand translation cache)
     - Store original in recipe
     - Translate on toggle and cache result in localStorage
2. Update extraction pipeline
   - Extract in original language
   - Add translation step (if needed) after extraction:
     - Translate `title`, `description`, `ingredients.name/notes`, steps `title/instruction/details`, warnings
3. Add UI toggle
   - A segmented control: “Original | English”
   - Switching should not reset cooking progress or scroll position.

### Manual checkpoints

- On a Polish recipe:
  - Toggle to English: title/steps/ingredients switch language.
  - Toggle back: returns to original.
  - Cooking mode step index stays the same.

**Acceptance criteria**

- Users can cook in the language they prefer without losing their place.

---

## Milestone 7 — Persistence of “cooking state” (optional but very useful)

**Goal**: survive accidental refreshes, phone lock/unlock, and returning later.

### Tasks

- Persist per recipe:
  - `currentStepIndex`
  - `completedSteps`
  - ingredient checkboxes
  - selected language
  - selected servings

### Manual checkpoints

- Start cooking, go to step 3, refresh:
  - App returns to step 3 (or offers “Resume cooking?”).

**Acceptance criteria**

- The app is resilient in real kitchens (where interruptions happen constantly).

---

## Milestone 8 — Polish/International recipe robustness (quality + trust)

**Goal**: improve extraction consistency across languages and measurement formats.

### Tasks

- Unit normalization improvements (e.g., “łyżka”, “łyżeczka”, “szklanka”, “g”, “ml”)
- Decimal + fraction handling for locales (comma decimals, etc.)
- Better warnings extraction (“Before you start” cues)

### Manual checkpoints

- Run 3 recipes from different sites/languages and compare:
  - Ingredient units look correct
  - Steps are usable without expanding

**Acceptance criteria**

- Output is consistently “cookable” across sources.

---

## Milestone 9 — UI polish & cleanup (when core flow feels great)

**Goal**: reduce friction and round out the experience.

### Tasks (pick based on need)

- Dark mode toggle (if you want it now)
- Recipe deletion UI in history dropdown
- Haptic feedback (optional)
- Print/share (optional)

### Manual checkpoint

- “10-minute hallway test”:
  - Give someone a URL and ask them to cook step 1–2.
  - Observe: where do they hesitate? what do they tap wrong?

---

## QA checklist (run after each milestone)

### Mobile usability

- Can I operate everything one-handed?
- Are primary actions ≥44px tall/wide?
- Does anything require precision tapping?
- Does the screen ever unexpectedly jump while I’m reading?

### Accessibility

- Pinch-zoom works.
- Inputs have labels.
- Focus styles exist (try keyboard tabbing on desktop).
- No blocking dialogs during core flows.

### Cooking mode

- I can advance steps without scrolling.
- I can check ingredients and return to the same step.
- I can see where I am (step X of Y + next/prev preview).

### Data integrity

- Servings scaling is correct and reversible.
- Conversions are correct and clearly labeled (≈ for approximations).
- Language toggle does not lose state.
