import type {
  ApiKeys,
  AppSettings,
  Recipe,
  AlternativeMeasurement,
  ProviderApiKeys,
} from "./types";
import { getProviderForModel } from "./types";

function normalizeRecipe(recipe: any): Recipe {
  const ingredients = Array.isArray(recipe?.ingredients)
    ? recipe.ingredients.map((ing: any) => {
        const altsRaw = Array.isArray(ing?.alternatives)
          ? ing.alternatives
          : [];
        const alternatives: AlternativeMeasurement[] = altsRaw
          .filter(
            (a: any) =>
              Number.isFinite(a?.quantity) &&
              a.quantity > 0 &&
              typeof a?.unit === "string" &&
              a.unit.trim().length > 0
          )
          .slice(0, 6)
          .map((a: any) => ({
            quantity: a.quantity,
            unit: a.unit.trim(),
            exact: Boolean(a.exact),
            note:
              typeof a.note === "string"
                ? a.note.trim() || undefined
                : undefined,
          }));

        return {
          ...ing,
          alternatives: alternatives.length ? alternatives : undefined,
        };
      })
    : [];

  const steps = Array.isArray(recipe?.steps)
    ? recipe.steps.map((step: any) => {
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
    ...recipe,
    ingredients,
    steps,
  } as Recipe;
}

const STORAGE_KEYS = {
  API_KEYS: "recipe-extractor-api-keys", // Legacy key
  SETTINGS: "recipe-extractor-settings-v2",
  RECIPES: "recipe-extractor-recipes",
  PROGRESS: "recipe-extractor-progress-v1",
  CURRENT_SESSION: "recipe-extractor-current-session",
} as const;

type CurrentSession = {
  recipeId: string;
  mode: "overview" | "cooking";
  updatedAt: string;
};

type RecipeProgress = {
  servings: number;
  checkedIngredients: number[];
  completedSteps: number[];
  cookingStepIndex: number;
  lastMode: "overview" | "cooking";
  updatedAt: string;
};

function readProgressMap(): Record<string, RecipeProgress> {
  if (typeof window === "undefined") return {};
  const stored = localStorage.getItem(STORAGE_KEYS.PROGRESS);
  if (!stored) return {};
  try {
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, RecipeProgress>;
  } catch {
    return {};
  }
}

function writeProgressMap(map: Record<string, RecipeProgress>): void {
  localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(map));
}

export function getRecipeProgress(recipeId: string): RecipeProgress | null {
  if (typeof window === "undefined") return null;
  const map = readProgressMap();
  const p = map[recipeId];
  if (!p) return null;
  return p;
}

export function saveRecipeProgress(
  recipeId: string,
  progress: Omit<RecipeProgress, "updatedAt">
): void {
  if (typeof window === "undefined") return;
  const map = readProgressMap();
  map[recipeId] = {
    ...progress,
    updatedAt: new Date().toISOString(),
  };
  writeProgressMap(map);
}

export function clearRecipeProgress(recipeId: string): void {
  if (typeof window === "undefined") return;
  const map = readProgressMap();
  if (map[recipeId]) {
    delete map[recipeId];
    writeProgressMap(map);
  }
}

// New settings functions
export function getSettings(): AppSettings | null {
  if (typeof window === "undefined") return null;

  // Try new format first
  const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (stored) {
    try {
      return JSON.parse(stored) as AppSettings;
    } catch {
      // Fall through to migration
    }
  }

  // Try to migrate from old format
  const legacy = getApiKeysLegacy();
  if (legacy) {
    const migrated: AppSettings = {
      firecrawl: legacy.firecrawl,
      providerKeys: {
        [legacy.llmProvider]: legacy.llmKey,
      },
      selectedModel: legacy.llmModel,
    };
    saveSettings(migrated);
    return migrated;
  }

  return null;
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function getSelectedModel(): string | null {
  const settings = getSettings();
  return settings?.selectedModel || null;
}

export function setSelectedModel(modelId: string): void {
  const settings = getSettings();
  if (settings) {
    settings.selectedModel = modelId;
    saveSettings(settings);
  }
}

// Legacy functions for backward compatibility
function getApiKeysLegacy(): ApiKeys | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEYS.API_KEYS);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as ApiKeys;
  } catch {
    return null;
  }
}

export function getApiKeys(): ApiKeys | null {
  // Try to get settings and convert to old format
  const settings = getSettings();
  if (!settings) return null;

  const provider = getProviderForModel(settings.selectedModel);
  if (!provider) return null;

  const llmKey = settings.providerKeys[provider];
  if (!llmKey) return null;

  return {
    firecrawl: settings.firecrawl,
    llmProvider: provider,
    llmModel: settings.selectedModel,
    llmKey,
  };
}

export function saveApiKeys(keys: ApiKeys): void {
  // Convert to new format
  const settings: AppSettings = {
    firecrawl: keys.firecrawl,
    providerKeys: {
      [keys.llmProvider]: keys.llmKey,
    },
    selectedModel: keys.llmModel,
  };
  saveSettings(settings);
}

export function getRecipes(): Recipe[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEYS.RECIPES);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeRecipe);
  } catch {
    return [];
  }
}

export function saveRecipe(recipe: Recipe): void {
  const recipes = getRecipes();
  // Check if recipe with same URL exists, update it
  const existingIndex = recipes.findIndex(
    (r) => r.sourceUrl === recipe.sourceUrl
  );
  if (existingIndex >= 0) {
    recipes[existingIndex] = recipe;
  } else {
    recipes.unshift(recipe); // Add to beginning
  }
  // Keep only last 20 recipes
  const trimmed = recipes.slice(0, 20);
  localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(trimmed));
}

export function deleteRecipe(id: string): void {
  const recipes = getRecipes();
  const filtered = recipes.filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(filtered));
}

export function getCurrentSession(): CurrentSession | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as CurrentSession;
  } catch {
    return null;
  }
}

export function saveCurrentSession(
  recipeId: string,
  mode: "overview" | "cooking"
): void {
  if (typeof window === "undefined") return;
  const session: CurrentSession = {
    recipeId,
    mode,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
}

export function clearCurrentSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
}
