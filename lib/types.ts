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
  { id: "gpt-5.2", name: "GPT-5.2", provider: "openai" },
  // Google
  { id: "gemini-3.0-flash", name: "Gemini 3.0 Flash", provider: "google" },
  { id: "gemini-3.0-pro", name: "Gemini 3.0 Pro", provider: "google" },
  // Anthropic
  {
    id: "claude-sonnet-4-5",
    name: "Claude 4.5 Sonnet",
    provider: "anthropic",
  },
  {
    id: "claude-opus-4-5",
    name: "Claude 4.5 Opus",
    provider: "anthropic",
  },
  { id: "claude-haiku-4-5", name: "Claude 4.5 Haiku", provider: "anthropic" },
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
