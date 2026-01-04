export type LLMProvider = "openai" | "google" | "anthropic";

export type LLMModel = {
  id: string;
  name: string;
  provider: LLMProvider;
};

export const LLM_MODELS: LLMModel[] = [
  // OpenAI
  { id: "gpt-4o", name: "GPT-4o", provider: "openai" },
  { id: "gpt-4.1", name: "GPT-4.1", provider: "openai" },
  // Google
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "google" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "google" },
  // Anthropic
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude 4 Sonnet",
    provider: "anthropic",
  },
  {
    id: "claude-opus-4-20250514",
    name: "Claude 4 Opus",
    provider: "anthropic",
  },
  { id: "claude-4-haiku", name: "Claude 4 Haiku", provider: "anthropic" },
];

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface RecipeStep {
  /**
   * Short label for scanning/jumping between steps (e.g. "Cook the pasta")
   */
  title: string;
  /**
   * Complete instruction that is sufficient to perform the step without expanding details.
   * (e.g. "Boil in salted water and cook 2 minutes less than package time.")
   */
  instruction: string;
  details?: string;
  duration?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  sourceUrl: string;
  baseServings: number;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  warnings: string[];
  extractedAt: string;
}

export type RecipeResponse = Omit<Recipe, "id" | "sourceUrl" | "extractedAt">;

export interface ApiKeys {
  firecrawl: string;
  llmProvider: LLMProvider;
  llmModel: string;
  llmKey: string;
}
