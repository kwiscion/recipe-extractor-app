import { z } from "zod";
import { generateObject, generateText, Output } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { Recipe, ApiKeys } from "./types";

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
      unit: z.string().describe("Unit (e.g. cups, tbsp, g, pieces)"),
      notes: z.string().optional().describe("Optional notes like 'diced'"),
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
  keys: ApiKeys
): Promise<Recipe> {
  // Step 1: Scrape the page
  const content = await scrapeWithFirecrawl(url, keys.firecrawl);

  // Truncate content if too long (to avoid token limits)
  const maxChars = 20000;
  const truncatedContent =
    content.length > maxChars
      ? content.slice(0, maxChars) + "\n\n[Content truncated...]"
      : content;

  // Step 2: Initialize the model
  const model = getModel(keys.llmProvider, keys.llmModel, keys.llmKey);

  // Step 3: Extract structured data
  // generateObject handles the prompting for structure, JSON parsing, and validation automatically
  const result = await generateText({
    model,
    output: Output.object({ schema: recipeSchema }),
    system:
      "You are a recipe extraction assistant. Extract the recipe from the provided content.",
    prompt: `Extract the recipe from this content:\n\n${truncatedContent}\n\n
      Guidelines:
      - For "quantity", use decimal numbers (0.5 instead of 1/2).
      - For items like "2-3 cloves", use the lower number (2) and add the range in notes.
      - If servings aren't specified, estimate based on the recipe.`,
    temperature: 0.1,
  });

  // Step 4: Return formatted recipe
  return {
    ...result.output,
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
