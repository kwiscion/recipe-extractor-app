# V0 initial app

## Me

The problem I struggle myself with is that when I look for culinary recipies online, all pages have two issues:

1. cluttered with ads
2. recipe is a huge wall of text and I need to scroll a lot between ingredient list and steps, or steps are baked into a longform text which is even worse

I want to create a minimalistic app where a user can drop a link to culinary recipe page and the app extracts the recipe in a clean way, showing you:

1. number of servings, which you can change
2. ingredients, which scale with your number of servings
3. clean, minimalistic steps, with expand button to show more details (like basic step is "add sour cream" and expansion is "you can use thick yougurt instead, just make sure to add a little bit of water to it to make mixing it with the sauce easier")
4. highlights/warnings - anything that you should be aware of before you start cooking

From the technical point of view, it will:

1. use firecrawl to scrape the page
2. LLM to extract the recipe
3. user has to bring own API keys: firecrawl and LLM (openai, gemini, anthropic)

Flow:

1. Landing page explaining that the app gives you a clean version of recipe and with a place to paste url
2. User pastes URL and clicks "get recipe"
3. Popup asking for the API keys and to choose LLM, also with explanation that everything stays in the browser in localStorage. if keys already present in local storage, skip this step
4. When processing, animated pot icon and text "Cooking..." below it
5. Display the recipe

## V0

Thought for 4s# Recipe Extractor App - Implementation Plan

I love this idea! A clean, focused recipe viewer is exactly what the cooking web needs. Let me outline a detailed plan for your approval.

---

## Project Overview

A minimalist recipe extraction app that scrapes recipe pages and presents them in a clean, interactive format with adjustable servings and expandable steps.

---

## Architecture

### Pages & Components

| File                               | Purpose                                                           |
| ---------------------------------- | ----------------------------------------------------------------- |
| `app/page.tsx`                     | Landing page with hero, URL input, and feature explanation        |
| `app/recipe/page.tsx`              | Recipe display page (client-side, receives data via state/params) |
| `components/url-input.tsx`         | URL paste field with "Get Recipe" button                          |
| `components/api-keys-modal.tsx`    | Modal for entering Firecrawl + LLM keys, provider selection       |
| `components/cooking-loader.tsx`    | Animated pot icon with "Cooking..." text                          |
| `components/recipe-view.tsx`       | Main recipe display component                                     |
| `components/servings-adjuster.tsx` | +/- buttons to change serving count                               |
| `components/ingredient-list.tsx`   | Scaled ingredient list                                            |
| `components/recipe-steps.tsx`      | Expandable step cards                                             |
| `components/warnings-section.tsx`  | Highlighted warnings/tips                                         |
| `lib/storage.ts`                   | localStorage helpers for API keys                                 |
| `lib/extract-recipe.ts`            | Firecrawl scraping + LLM extraction logic                         |
| `lib/types.ts`                     | TypeScript types for Recipe, Ingredient, Step, etc.               |

### Data Flow

```plaintext
URL Input → Check localStorage for keys → (Show modal if missing) →
Firecrawl scrape → LLM extraction → Display recipe
```

---

## Technical Approach

### 1. **Scraping with Firecrawl**

- Use Firecrawl's `/scrape` endpoint to get clean markdown from recipe URLs
- Handle errors gracefully (blocked sites, invalid URLs)

### 2. **LLM Extraction**

- Support 3 providers: OpenAI, Google Gemini, Anthropic
- Structured output prompt to extract:

- Title, description, servings (base number)
- Ingredients with: name, quantity, unit
- Steps with: summary (short), details (expanded), duration (optional)
- Warnings/highlights array

### 3. **Ingredient Scaling**

- Store base quantities and servings
- Calculate scaled amounts: `(baseQty / baseServings) * currentServings`
- Handle fractional display nicely (½, ¼, etc.)

### 4. **localStorage Usage**(as you requested)

- Store: `{ firecrawlKey, llmProvider, llmKey }`
- Check on "Get Recipe" click, prompt if missing

---

## Design Direction

- **Minimalist & clean** - lots of whitespace, soft shadows
- **Warm color palette** - cooking-friendly (cream, soft orange accents)
- **Typography-focused** - clear hierarchy for scanning while cooking
- **Mobile-first** - easy to use with messy hands in kitchen

---

## ️ Potential Challenges

| Challenge                   | Mitigation                                               |
| --------------------------- | -------------------------------------------------------- |
| Recipe sites block scraping | Firecrawl handles most; show friendly error for failures |
| LLM hallucination           | Strong structured prompt + validation                    |
| Ingredient unit conversion  | Keep original units, only scale quantities               |
| Various recipe formats      | Robust LLM prompt to handle blogs, videos, etc.          |

---

## Implementation Order

1. **Landing Page** - Hero, URL input, feature cards
2. **API Keys Modal** - Form with provider selector, localStorage save
3. **Loading State** - Animated pot component
4. **Recipe Extraction** - Firecrawl + LLM integration
5. **Recipe Display** - All sub-components (servings, ingredients, steps, warnings)

---

## Questions Before I Proceed

1. **LLM calls location**: Should the LLM calls happen client-side (directly from browser using user's key) or via API routes (server-side but keys still from client)? Client-side is simpler but exposes API patterns.
2. **Recipe persistence**: Should extracted recipes be saved to localStorage so users can revisit them later? Or always fresh extraction?
3. **Error handling preference**: Toast notifications or inline error messages when something fails?

---

**Does this plan look good to you?** Let me know if you'd like any adjustments, and once approved, I'll start building! 🍳

## ME

Looks good! Answering your questions:

1. LLM calls from the frontend
2. Make recipes persistent in localStorage and add dropdown with recipe history
3. Toast notifications for errors

Also:

1. When choosing provider, allow to choose model too: openai 4o/5.2, gemini flash/pro, claude 4.5 opus/sonnet/haiku
2. Ensure it's mobile friendly (very important!)
3. On mobile, show button to keep screen on
