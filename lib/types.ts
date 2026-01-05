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
  {
    id: "gemini-3-flash-preview",
    name: "Gemini 3.0 Flash",
    provider: "google",
  },
  { id: "gemini-3-pro-preview", name: "Gemini 3.0 Pro", provider: "google" },
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

export type AlternativeMeasurement = {
  quantity: number;
  unit: string;
  /**
   * true for deterministic conversions (e.g. tbsp ↔ ml), false for estimates (e.g. tbsp flour ↔ grams)
   */
  exact: boolean;
  /**
   * Optional qualifier (e.g. "approx; depends on packing/brand")
   */
  note?: string;
};

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
  /**
   * Alternative measurements for the BASE quantity/unit (not scaled for servings).
   * These will be scaled client-side with the same servings ratio.
   */
  alternatives?: AlternativeMeasurement[];
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

export interface ProviderApiKeys {
  openai?: string;
  google?: string;
  anthropic?: string;
}

export interface AppSettings {
  firecrawl: string;
  providerKeys: ProviderApiKeys;
  selectedModel: string; // model ID like "gpt-4o"
}

// Legacy type for backward compatibility
export interface ApiKeys {
  firecrawl: string;
  llmProvider: LLMProvider;
  llmModel: string;
  llmKey: string;
}

// Helper to get provider from model ID
export function getProviderForModel(modelId: string): LLMProvider | null {
  const model = LLM_MODELS.find((m) => m.id === modelId);
  return model ? model.provider : null;
}

// Helper to get available models based on configured provider keys
export function getAvailableModels(providerKeys: ProviderApiKeys): LLMModel[] {
  return LLM_MODELS.filter((model) => {
    const key = providerKeys[model.provider];
    return key && key.trim().length > 0;
  });
}
