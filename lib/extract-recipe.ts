import { z } from "zod";
import { generateObject, generateText, Output } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { Recipe, AppSettings, AlternativeMeasurement } from "./types";
import { getProviderForModel } from "./types";

// 1. Define the schema exactly as you want the data structure
// This replaces the manual "EXTRACTION_PROMPT" and JSON parsing logic
const recipeSchema = z.object({
  title: z.string().describe("Concise title of the dish (under 6 words)"),
  description: z
    .string()
    .describe("Brief description of the dish (1-2 sentences)"),
  baseServings: z.number().int().describe("Number of servings as an integer"),
  ingredients: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().describe("Decimal number (e.g. 0.5 for 1/2)"),
      unit: z
        .string()
        .describe(
          "Unit as used in the source recipe language (e.g. g, kg, ml, l, łyżka, łyżeczka, szklanka, szt.)"
        ),
      notes: z.string().optional().describe("Optional notes like 'diced'"),
      alternatives: z
        .array(
          z.object({
            quantity: z.number().describe("Decimal number (e.g. 0.5 for 1/2)"),
            unit: z
              .string()
              .describe(
                "Alternative unit (keep the recipe's measurement system; keep language consistent)"
              ),
            exact: z
              .boolean()
              .describe(
                "True for deterministic conversions, false for estimates"
              ),
            note: z
              .string()
              .optional()
              .describe(
                "Optional qualifier (e.g. 'approx; depends on packing/brand')"
              ),
          })
        )
        .optional()
        .describe(
          "Optional alternative measurements for the BASE quantity/unit"
        ),
    })
  ),
  steps: z.array(
    z.object({
      title: z
        .string()
        .describe("Short label for the step (e.g. 'Cook the pasta')"),
      instruction: z
        .string()
        .describe("Complete actionable instruction without expanding details"),
      details: z
        .string()
        .optional()
        .describe("Optional tips, substitutions, or troubleshooting"),
      duration: z
        .string()
        .optional()
        .describe("Estimated time like '5 minutes'"),
    })
  ),
  warnings: z
    .array(z.string())
    .describe(
      "Allergens, equipment needed, prep time requirements, or advance prep"
    ),
});

const ingredientAlternativesSchema = z.object({
  ingredients: z.array(
    z.object({
      alternatives: z.array(
        z.object({
          quantity: z.number().describe("Decimal number (e.g. 0.5 for 1/2)"),
          unit: z
            .string()
            .describe(
              "Unit (keep measurement system aligned with the recipe; keep language consistent)"
            ),
          exact: z
            .boolean()
            .describe(
              "True for deterministic conversions, false for estimates"
            ),
          note: z
            .string()
            .optional()
            .describe(
              "Optional qualifier (e.g. 'approx; depends on packing/brand')"
            ),
        })
      ),
    })
  ),
});

function mergeIngredientAlternatives(
  baseIngredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    notes?: string;
    alternatives?: AlternativeMeasurement[];
  }>,
  enriched: unknown
) {
  const parsed = ingredientAlternativesSchema.safeParse(enriched);
  if (!parsed.success) return baseIngredients;
  if (parsed.data.ingredients.length !== baseIngredients.length)
    return baseIngredients;

  return baseIngredients.map((ing, i) => {
    const rawAlts = parsed.data.ingredients[i]?.alternatives ?? [];
    const alts: AlternativeMeasurement[] = rawAlts
      .filter(
        (a) =>
          Number.isFinite(a.quantity) &&
          a.quantity > 0 &&
          typeof a.unit === "string" &&
          a.unit.trim().length > 0
      )
      .slice(0, 4)
      .map((a) => ({
        quantity: a.quantity,
        unit: a.unit.trim(),
        exact: Boolean(a.exact),
        note: a.note?.trim() || undefined,
      }));

    return {
      ...ing,
      alternatives: alts.length ? alts : undefined,
    };
  });
}

// 2. Helper to initialize the correct provider
function getModel(provider: string, modelId: string, apiKey: string) {
  switch (provider) {
    case "openai":
      const openai = createOpenAI({ apiKey });
      return openai(modelId);
    case "google":
      const google = createGoogleGenerativeAI({ apiKey });
      return google(modelId);
    case "anthropic":
      const anthropic = createAnthropic({ apiKey });
      return anthropic(modelId);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// Keep existing Firecrawl logic
async function scrapeWithFirecrawl(
  url: string,
  apiKey: string
): Promise<string> {
  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 401) {
      throw new Error(
        "Invalid Firecrawl API key. Please check your key and try again."
      );
    }
    if (response.status === 402) {
      throw new Error(
        "Firecrawl API quota exceeded. Please check your plan limits."
      );
    }
    throw new Error(`Failed to scrape page: ${error}`);
  }

  const data = await response.json();

  if (!data.success || !data.data?.markdown) {
    throw new Error(
      "Failed to extract content from the page. The site may be blocking scraping."
    );
  }

  return data.data.markdown;
}

export async function extractRecipe(
  url: string,
  settings: AppSettings
): Promise<Recipe> {
  // Step 1: Get the provider and API key for the selected model
  const provider = getProviderForModel(settings.selectedModel);
  if (!provider) {
    throw new Error(`Invalid model: ${settings.selectedModel}`);
  }

  const llmKey = settings.providerKeys[provider];
  if (!llmKey) {
    throw new Error(`API key not configured for ${provider}`);
  }

  // Step 2: Scrape the page
  const content = await scrapeWithFirecrawl(url, settings.firecrawl);

  // Truncate content if too long (to avoid token limits)
  const maxChars = 20000;
  const truncatedContent =
    content.length > maxChars
      ? content.slice(0, maxChars) + "\n\n[Content truncated...]"
      : content;

  // Step 3: Initialize the model
  const model = getModel(provider, settings.selectedModel, llmKey);

  // Step 4: Extract structured data
  // generateObject handles the prompting for structure, JSON parsing, and validation automatically
  const result = await generateText({
    model,
    output: Output.object({ schema: recipeSchema }),
    system:
      "You are a recipe extraction assistant. Extract the recipe from the provided content. IMPORTANT: Keep the original language of the recipe. Do not translate. Preserve measurement conventions and units as used by the source.",
    prompt: `Extract the recipe from this content:\n\n${truncatedContent}\n\n
      Guidelines:
      - Keep ALL text (title/description/ingredients/steps/warnings) in the same language as the source recipe. Do NOT translate.
      - For "quantity", use decimal numbers (0.5 instead of 1/2).
      - For items like "2-3 cloves", use the lower number (2) and add the range in notes.
      - Preserve measurement units as used in the source recipe (do not convert unit systems).
      - Do NOT introduce imperial units (cups/oz/lb) unless they appear in the source recipe.
      - If the recipe is Polish, prefer metric units (g/kg/ml/l) and common Polish units/abbreviations (e.g. łyżka, łyżeczka, szklanka, szt.). Do not introduce imperial.
      - Keep units consistent across ingredients (don't mix systems unnecessarily).
      - "warnings" should reflect the original-language cues (e.g. allergens, equipment, advance prep, chilling/resting time).
      - If servings aren't specified, estimate based on the recipe.`,
    temperature: 0.1,
  });

  // Step 5: Enrich ingredient list with alternative measurements (best-effort)
  // This is intentionally non-fatal: if it fails, we still return the recipe.
  let enrichedIngredients = result.output.ingredients;
  try {
    const alternativesResult = await generateText({
      model,
      output: Output.object({ schema: ingredientAlternativesSchema }),
      system:
        "You are a precise cooking assistant. Given ingredients with quantities and units, propose useful alternative measurements. IMPORTANT: Keep the original language and measurement conventions of the recipe; do not translate.",
      prompt: `For each ingredient, propose up to 3 alternative measurements that are useful while cooking.

Rules:
- Return JSON only, matching the provided schema exactly.
- The output array length MUST exactly match the input ingredient list length and order.
- Keep conversions conservative. If unsure, return an empty alternatives array for that ingredient.
- Keep the SAME language as the ingredient list. Do NOT translate ingredient names or notes.
- Do NOT introduce a different measurement system than the recipe uses.
  - If the ingredient list is metric (g/ml/l/kg), DO NOT output imperial units (cups/oz/lb).
  - If the ingredient list uses imperial (cups/oz/lb), you MAY include metric equivalents (g/ml) as helpful alternatives.
- For Polish recipes, prefer Polish units/abbreviations where appropriate (e.g. łyżeczka, łyżka, szklanka) and metric units (g, ml, l). Do not introduce imperial.
- If converting between volume and weight (e.g., tbsp flour -> grams), set exact=false and include a short note like "approx; depends on packing/brand".
- For deterministic conversions (e.g., tbsp -> ml, oz -> g, l <-> ml, kg <-> g) set exact=true.
- Do not repeat the original unit (don't include alternatives that are the same as the original unit).

Ingredients (base quantities):\n${JSON.stringify(
        result.output.ingredients.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          notes: i.notes,
        })),
        null,
        2
      )}`,
      temperature: 0.1,
    });

    enrichedIngredients = mergeIngredientAlternatives(
      result.output.ingredients,
      alternativesResult.output
    );
  } catch {
    // ignore (best-effort)
  }

  // Step 6: Return formatted recipe
  return {
    ...result.output,
    ingredients: enrichedIngredients,
    id: crypto.randomUUID(),
    sourceUrl: url,
    extractedAt: new Date().toISOString(),
    // // Ensure warnings is always an array (Zod handles this, but good for safety)
    // warnings: result.output.warnings || [],
    // ingredients: result.output.ingredients.map((i) => ({
    //   ...i,
    //   notes: i.notes || undefined, // Clean up nulls if any
    // })),
    // steps: result.output.steps.map((s) => ({
    //   ...s,
    //   details: s.details || undefined,
    //   duration: s.duration || undefined,
    // })),
  };
}
