import type { Recipe, RecipeResponse, ApiKeys } from "./types";

const EXTRACTION_PROMPT = `You are a recipe extraction assistant. Extract the recipe from the provided content and return it as valid JSON.

Return ONLY a JSON object with this exact structure (no markdown, no code blocks, just pure JSON):
{
  "title": "Recipe title",
  "description": "Brief description of the dish (1-2 sentences)",
  "baseServings": <number of servings as integer>,
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": <number>,
      "unit": "unit of measurement (e.g., cups, tbsp, g, pieces)",
      "notes": "optional notes like 'diced' or 'room temperature'"
    }
  ],
  "steps": [
    {
      "title": "Short label for the step (e.g., 'Cook the pasta')",
      "instruction": "Complete instruction that is sufficient to perform the step without expanding details (e.g., 'Boil in salted water and cook 2 minutes less than package time.')",
      "details": "Optional learn-more content: tips, substitutions, technique notes, troubleshooting (optional)",
      "duration": "estimated time like '5 minutes' (optional)"
    }
  ],
  "warnings": ["Important tips or warnings to know before starting"]
}

Guidelines:
- For "quantity", use decimal numbers (0.5 instead of 1/2, 0.25 instead of 1/4, 0.333 instead of 1/3)
- For items like "2-3 cloves garlic", use the lower number (2) and add the range in notes
- For "to taste" or "as needed", use 0 for quantity and put the description in notes
- Keep "title" concise (under 6 words). The "instruction" must be actionable and complete.
- Put optional substitution tips, technique notes, or common mistakes in the "details" field as "learn more"
- "warnings" should include: allergens, equipment needed, prep time requirements, items that need advance preparation
- If servings aren't specified, estimate based on the recipe

Extract the recipe from the following content:`;

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

async function extractWithOpenAI(
  content: string,
  model: string,
  apiKey: string
): Promise<RecipeResponse> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that extracts recipes from text and returns valid JSON.",
        },
        {
          role: "user",
          content: `${EXTRACTION_PROMPT}\n\n${content}`,
        },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 401) {
      throw new Error(
        "Invalid OpenAI API key. Please check your key and try again."
      );
    }
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("No response from OpenAI");
  }

  return parseRecipeJSON(text);
}

async function extractWithGoogle(
  content: string,
  model: string,
  apiKey: string
): Promise<RecipeResponse> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${EXTRACTION_PROMPT}\n\n${content}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 400 || response.status === 401) {
      throw new Error(
        "Invalid Google AI API key. Please check your key and try again."
      );
    }
    throw new Error(`Google AI API error: ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No response from Google AI");
  }

  return parseRecipeJSON(text);
}

async function extractWithAnthropic(
  content: string,
  model: string,
  apiKey: string
): Promise<RecipeResponse> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `${EXTRACTION_PROMPT}\n\n${content}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 401) {
      throw new Error(
        "Invalid Anthropic API key. Please check your key and try again."
      );
    }
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text;

  if (!text) {
    throw new Error("No response from Anthropic");
  }

  return parseRecipeJSON(text);
}

function parseRecipeJSON(text: string): RecipeResponse {
  // Try to extract JSON from the response (in case LLM wraps it in markdown)
  let jsonStr = text;

  // Remove markdown code blocks if present
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  // Try to find JSON object in the text
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    jsonStr = objectMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate required fields
    if (!parsed.title || !parsed.ingredients || !parsed.steps) {
      throw new Error("Missing required recipe fields");
    }

    const normalizedSteps = Array.isArray(parsed.steps)
      ? parsed.steps.map((step: any) => {
          const title = (step?.title ?? step?.summary ?? "").toString().trim();
          const instruction = (step?.instruction ?? step?.summary ?? "")
            .toString()
            .trim();
          return {
            title,
            instruction,
            details: typeof step?.details === "string" ? step.details : "",
            duration: typeof step?.duration === "string" ? step.duration : "",
          };
        })
      : [];

    return {
      title: parsed.title,
      description: parsed.description || "",
      baseServings: parsed.baseServings || 4,
      ingredients: parsed.ingredients || [],
      steps: normalizedSteps,
      warnings: parsed.warnings || [],
    };
  } catch {
    throw new Error(
      "Failed to parse recipe from AI response. The content might not contain a valid recipe."
    );
  }
}

export async function extractRecipe(
  url: string,
  keys: ApiKeys
): Promise<Recipe> {
  // Step 1: Scrape the page
  const content = await scrapeWithFirecrawl(url, keys.firecrawl);

  // Truncate content if too long (to avoid token limits)
  const maxChars = 15000;
  const truncatedContent =
    content.length > maxChars
      ? content.slice(0, maxChars) + "\n\n[Content truncated...]"
      : content;

  // Step 2: Extract recipe with chosen LLM
  let recipeData: RecipeResponse;

  switch (keys.llmProvider) {
    case "openai":
      recipeData = await extractWithOpenAI(
        truncatedContent,
        keys.llmModel,
        keys.llmKey
      );
      break;
    case "google":
      recipeData = await extractWithGoogle(
        truncatedContent,
        keys.llmModel,
        keys.llmKey
      );
      break;
    case "anthropic":
      recipeData = await extractWithAnthropic(
        truncatedContent,
        keys.llmModel,
        keys.llmKey
      );
      break;
    default:
      throw new Error("Unknown LLM provider");
  }

  // Construct full recipe object
  const recipe: Recipe = {
    ...recipeData,
    id: crypto.randomUUID(),
    sourceUrl: url,
    extractedAt: new Date().toISOString(),
  };

  return recipe;
}
