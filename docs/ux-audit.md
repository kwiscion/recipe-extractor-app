## Key Observations:

### Positive Aspects:

1. **Clean, minimalist design** - follows the core goal of decluttering recipes
2. **Well-structured warnings section** - highlighted in yellow/accent color with clear title "Before You Start"
3. **Expandable step details** - allows both quick scanning and deep dives
4. **Step duration indicators** - shows time for each step
5. **Servings adjuster** - with +/- buttons, shows current count
6. **Recipe history** - dropdown to access previously extracted recipes
7. **Keep screen on** - critical feature for kitchen use
8. **Ingredient notes** - shown in parentheses (like "grated", "chopped")
9. **Privacy notice** - clear message about API keys stored locally

### Issues/Concerns:

1. **Screen Wake Lock alerts** - The component uses `alert()` calls which is bad UX on mobile
2. **Mobile viewport issues** - The browser resize didn't seem to change layout much
3. **Touch target sizes** - The +/- buttons are 32px (size-8), might be small for messy hands
4. **Back button text hidden on mobile** - Only shows arrow, text hidden with sm:inline
5. **No way to delete recipes** - There's a deleteRecipe function in storage but no UI
6. **No ingredient checkboxes** - Would be helpful to track what you've added
7. **No step completion tracking** - Would help keep your place while cooking
8. **Servings reset button** - Very small/subtle text
9. **No print/share functionality**
10. **Geist font might not be installed** - Using system fallbacks

### Mobile-Specific Concerns:

1. The app may need larger touch targets
2. The input field + button layout changes from column to row (sm:flex-row), good

3. Screen wake lock feature needs improved user feedback mechanism
4. Dark mode implementation exists but lacks a visible toggle control

I'll focus on refining the user experience by addressing these critical interaction and design gaps. The wake lock alerts and missing toggle options represent key areas for immediate UX improvement.</details></think>

---

Now I have a comprehensive understanding of the app. Let me compile my detailed UX audit report:

---

# 🍳 Recipe Extractor App - UX/Accessibility Audit Report

## Executive Summary

This audit evaluates the Recipe Extractor app from the perspective of its target users: **home cooks using their mobile phones in the kitchen** while actively cooking. The app successfully achieves its core goal of presenting clean, distraction-free recipes, but there are several opportunities to improve the mobile cooking experience.

---

## 1. Target User Analysis

### Primary User Profile

- **Who**: Home cooks aged 25-55 who follow online recipes
- **Context**: Standing in kitchen, phone propped up or held with one hand
- **Constraints**:
  - Hands often messy/wet from ingredients
  - Limited attention span (multitasking with actual cooking)
  - Need quick glances, not prolonged reading
  - Kitchen may have varying lighting conditions

### Key User Needs

1. Quick access to ingredients while shopping/prepping
2. Step-by-step guidance during cooking
3. Easy scaling for different serving sizes
4. Screen that stays on without touching
5. Large, tappable targets for greasy fingers

---

## 2. Positive Findings ✅

### 2.1 Core Recipe View Structure

The recipe view follows an excellent logical flow:

```
Header → Warnings → Servings → Ingredients → Steps
```

This mirrors the actual cooking workflow: know what to watch out for, confirm portions, gather ingredients, then follow steps.

### 2.2 Warnings/Tips Section ("Before You Start")

```18:26:components/warnings-section.tsx
  return (
    <Alert className="bg-accent/20 border-accent">
      <AlertTriangle className="size-4 text-accent-foreground" />
      <AlertTitle className="text-accent-foreground font-semibold">Before You Start</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 space-y-1">
          {warnings.map((warning, index) => (
            <li key={index} className="text-sm text-foreground flex items-start gap-2">
```

**Strengths**:

- Yellow/accent background makes it visually prominent
- Positioned at the top so users see critical info before starting
- Includes allergens, equipment needs, and pro tips

### 2.3 Expandable Step Details

```29:77:components/recipe-steps.tsx
        {steps.map((step, index) => {
          const hasDetails = step.details && step.details.trim().length > 0
          const isOpen = openSteps.has(index)

          return (
            <li key={index} className="relative">
              <div className="flex gap-4">
                {/* Step number */}
                <div className="flex flex-col items-center">
                  <span className="flex items-center justify-center size-7 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                    {index + 1}
                  </span>
                  {index < steps.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
                </div>

                {/* Step content */}
                <div className="flex-1 pb-4">
                  <Collapsible open={isOpen} onOpenChange={() => hasDetails && toggleStep(index)}>
```

**Strengths**:

- Clean summary view with expandable details - perfect for quick scanning
- Visual timeline with connecting lines between steps
- Duration badges help time management
- Chevron icon indicates expandability

### 2.4 Screen Wake Lock Feature

The "Keep screen on" button is crucial for kitchen use - users can cook without the screen timing out.

### 2.5 Recipe History Persistence

Storing recipes in localStorage means users can return to favorites without re-extracting.

### 2.6 Responsive Layout Design

```36:37:components/url-input.tsx
      <div className="flex flex-col sm:flex-row gap-3">
```

The URL input properly stacks on mobile and goes horizontal on larger screens.

---

## 3. Critical Issues & Recommendations 🔴

### 3.1 Screen Wake Lock Alert Dialogs

**Current Implementation:**

```6:11:components/screen-wake-lock.tsx
  const { isSupported, released, request, release } = useWakeLock({
    onRequest: () => alert("Screen Wake Lock: requested!"),
    onError: () => alert("An error happened 💥"),
    onRelease: () => alert("Screen Wake Lock: released!"),
    reacquireOnPageVisible: true,
  });
```

**Problem**: Using `alert()` is extremely disruptive:

- Blocks the entire interface
- Requires dismissal with precise tap
- Terrible UX when hands are messy/wet
- Unnecessary friction for a background feature

**Recommendation**: Use toast notifications instead:

```tsx
const { toast } = useToast();

const { isSupported, released, request, release } = useWakeLock({
  onRequest: () => toast({ description: "Screen will stay on while cooking" }),
  onError: () =>
    toast({ variant: "destructive", description: "Couldn't enable wake lock" }),
  onRelease: () => {}, // Silent release, no notification needed
  reacquireOnPageVisible: true,
});
```

### 3.2 Touch Target Sizes Too Small for Kitchen Use

**Current servings buttons:**

```34:43:components/servings-adjuster.tsx
        <Button
          variant="outline"
          size="icon"
          className="size-8 bg-transparent"
          onClick={decrease}
          disabled={currentServings <= 1}
          aria-label="Decrease servings"
        >
          <Minus className="size-4" />
        </Button>
```

**Problem**: 32px (size-8) buttons are below Apple's recommended 44pt minimum for touch targets. With wet/greasy fingers, this is frustrating.

**Recommendation**: Increase to `size-12` (48px) or `size-14` (56px):

```tsx
<Button
  variant="outline"
  size="icon"
  className="size-12 bg-transparent text-lg"
  ...
>
```

### 3.3 No Step Completion Tracking

**Problem**: Users lose their place while cooking. With 5+ steps, it's easy to forget which step you're on after chopping vegetables.

**Recommendation**: Add checkbox/completion state to steps:

```tsx
const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

// Add visual indication for completed steps
<span className={`size-7 rounded-full ${completedSteps.has(index)
  ? 'bg-green-500'
  : 'bg-primary'}`}>
```

### 3.4 No Ingredient Checkboxes

**Problem**: Users can't track which ingredients they've gathered during prep.

**Recommendation**: Add interactive checkboxes:

```tsx
<li className="flex items-start gap-3 py-1">
  <input
    type="checkbox"
    className="size-5 mt-1 accent-primary"
    aria-label={`Mark ${ingredient.name} as gathered`}
  />
  ...
</li>
```

---

## 4. Important Improvements 🟡

### 4.1 Sticky Ingredients Section for Mobile

**Problem**: When cooking, users constantly scroll between ingredients and current step.

**Recommendation**: Add a collapsible, sticky ingredients panel at bottom of screen:

```tsx
// Mobile-only sticky footer with quick ingredient reference
<div className="fixed bottom-0 left-0 right-0 bg-card border-t md:hidden">
  <Collapsible>
    <CollapsibleTrigger className="w-full p-3">
      <span>Ingredients ({ingredients.length})</span>
      <ChevronUp />
    </CollapsibleTrigger>
    <CollapsibleContent className="max-h-60 overflow-y-auto">
      {/* Ingredient list */}
    </CollapsibleContent>
  </Collapsible>
</div>
```

### 4.2 Dark Mode Toggle

**Problem**: The app has CSS dark mode support but no visible toggle. Kitchens often have harsh overhead lighting where dark mode helps reduce glare.

**Recommendation**: Add a theme toggle in the recipe view header next to "Keep screen on":

```tsx
<div className="flex items-center gap-2">
  <Button onClick={toggleTheme} variant="outline" size="sm">
    {isDark ? <Sun /> : <Moon />}
  </Button>
  <ScreenWakeLock />
</div>
```

### 4.3 Font Size Controls

**Problem**: Recipe text is fixed-size. Cooks with the phone propped at distance need larger text.

**Recommendation**: Add text size adjustment (A+ / A-) or use a larger base font size on mobile.

### 4.4 Recipe Deletion UI

**Problem**: There's a `deleteRecipe` function in storage but no UI to use it:

```48:52:lib/storage.ts
export function deleteRecipe(id: string): void {
  const recipes = getRecipes()
  const filtered = recipes.filter((r) => r.id !== id)
  localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(filtered))
}
```

**Recommendation**: Add delete button/swipe action in recipe history dropdown.

### 4.5 Reset Servings Button Too Subtle

**Current:**

```59:64:components/servings-adjuster.tsx
      {isScaled && (
        <button
          onClick={() => onChange(baseServings)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          (reset to {baseServings})
```

**Problem**: `text-xs` is tiny on mobile. The parentheses make it look like a footnote, not a clickable action.

**Recommendation**: Make it a proper button with visible tap target:

```tsx
{
  isScaled && (
    <Button variant="ghost" size="sm" onClick={() => onChange(baseServings)}>
      Reset to {baseServings}
    </Button>
  );
}
```

---

## 5. Minor Enhancements 🟢

### 5.1 Add Voice Command Hint

For hands-free navigation, hint that users can use device voice assistants: "Tip: Use 'Hey Siri/Google, scroll down' while cooking"

### 5.2 Print-Friendly View

Add a print button that generates a clean, single-page recipe card.

### 5.3 Share Functionality

Allow sharing extracted recipes via native share sheet.

### 5.4 Ingredient Quantity Highlighting

When servings are scaled, quantities change color - great! But consider making scaled values **bold** in addition to colored for accessibility:

```28:30:components/ingredient-list.tsx
                {formattedQty && (
                  <span className={`font-medium ${isScaled ? "text-primary" : ""}`}>
                    {formattedQty} {ingredient.unit}
```

**Update to:**

```tsx
className={`${isScaled ? "text-primary font-bold" : "font-medium"}`}
```

### 5.5 Add Haptic Feedback

For supported devices, add subtle vibration on button taps for tactile confirmation.

---

## 6. Accessibility Audit

### What's Good:

- ✅ Semantic HTML structure (headings, lists, buttons)
- ✅ aria-labels on icon-only buttons (Decrease/Increase servings)
- ✅ Good color contrast (purple on cream/white)
- ✅ Focus-visible styles via Tailwind

### Needs Improvement:

- ⚠️ Step expand/collapse state not announced to screen readers
- ⚠️ No skip link for keyboard navigation
- ⚠️ Loading state could use aria-live region

**Recommendation for step expansion:**

```tsx
<button
  aria-expanded={isOpen}
  aria-controls={`step-${index}-details`}
  aria-label={`${isOpen ? 'Hide' : 'Show'} details for step ${index + 1}`}
>
```

---

## 7. Summary Scorecard

| Category                | Score | Notes                                     |
| ----------------------- | ----- | ----------------------------------------- |
| **Core Functionality**  | 9/10  | Excellent recipe extraction & display     |
| **Mobile Usability**    | 6/10  | Touch targets too small, needs sticky nav |
| **Kitchen Context Fit** | 7/10  | Wake lock good, needs step tracking       |
| **Accessibility**       | 7/10  | Good basics, needs ARIA improvements      |
| **Visual Design**       | 8/10  | Clean, warm palette, good hierarchy       |

---

## 8. Priority Implementation Order

1. **🔴 Critical**: Remove alert() calls in ScreenWakeLock (immediate)
2. **🔴 Critical**: Increase touch target sizes (immediate)
3. **🟡 High**: Add step completion checkboxes
4. **🟡 High**: Add ingredient checkboxes
5. **🟡 Medium**: Sticky ingredients panel for mobile
6. **🟢 Low**: Dark mode toggle
7. **🟢 Low**: Print/share features

---

This app has a solid foundation and achieves its core mission of decluttering recipes. The recommendations focus on enhancing the "phone in kitchen with messy hands" experience - making every interaction forgiving, every target large, and every state trackable without precision taps.

---
