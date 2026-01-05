## Recipe Extractor

A minimalist recipe extraction app: paste a recipe URL, get a clean recipe (servings, scalable ingredients, expandable steps, warnings), and use **Cooking Mode** on your phone without “scroll ping‑pong”.

### Motivation

This is a **pet project** I built in an evening with **v0** and **Cursor** because my wife and I like to cook, but we’re tired of recipe sites with:

- long “grandma’s life story” intros
- aggressive popups and ads
- endless scrolling back and forth between ingredients and steps

I wanted to see if I could build a quick, pleasant “just the recipe” experience for our own kitchen use.

There are great apps that already do this (for example [JustTheRecipe](https://www.justtherecipe.com/)), but I wanted to try building my own.

### What it does

- **Extracts a recipe from a URL** (title, description, servings, ingredients, steps, warnings)
- **Adjustable servings**: ingredient quantities scale
- **Tap-to-expand ingredient alternatives** (deterministic conversions + optional LLM enrichment)
- **Expandable step details** (“Learn more”)
- **Cooking Mode**: step-by-step navigation + ingredients drawer
- **Progress persistence**: restores checked ingredients, completed steps, current step, mode, and open recipe after refresh
- **Keep screen on** button (wake lock) for cooking sessions

### High-level architecture

All data extraction happens client-side using your own API keys.

#### Flow

- **User pastes URL**
- **Firecrawl** scrapes the page into clean-ish text/markdown
- An **LLM** turns that content into a structured `Recipe` object (Zod schema via the AI SDK)
- Second **LLM step** enriches ingredients with alternative measurements
- The app renders the recipe and saves it locally for history/progress

#### Storage (browser localStorage)

- **Settings & API keys**: stored locally so the app can call Firecrawl + the chosen LLM provider from the browser
- **Recipes**: saved for a dropdown history
- **Progress/session**: servings, checked ingredients, completed steps, current cooking step, and current mode/recipe so refresh brings you right back

### Tech stack

- **Next.js** (App Router)
- **React + TypeScript**
- **Tailwind CSS**
- **shadcn/ui** components + **vaul** drawer
- **Firecrawl** for scraping
- **AI SDK** (OpenAI / Google ) for structured extraction

### Running locally

```bash
pnpm install
pnpm dev
```

Then open the app and add your API keys in Settings. Keys are stored in `localStorage`.

### Notes / limitations

- This project is optimized for “good enough” cooking UX rather than perfect data extraction.
- Some sites block scraping; some recipes are ambiguous.
- Since calls are made from the browser, **treat your API keys as sensitive** and use keys/limits you’re comfortable with.
