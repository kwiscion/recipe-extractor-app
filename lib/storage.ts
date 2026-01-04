import type { ApiKeys, Recipe } from "./types"

function normalizeRecipe(recipe: any): Recipe {
  const steps = Array.isArray(recipe?.steps)
    ? recipe.steps.map((step: any) => {
        const title = (step?.title ?? step?.summary ?? "").toString().trim()
        const instruction = (step?.instruction ?? step?.summary ?? "").toString().trim()
        return {
          title,
          instruction,
          details: typeof step?.details === "string" ? step.details : "",
          duration: typeof step?.duration === "string" ? step.duration : "",
        }
      })
    : []

  return {
    ...recipe,
    steps,
  } as Recipe
}

const STORAGE_KEYS = {
  API_KEYS: "recipe-extractor-api-keys",
  RECIPES: "recipe-extractor-recipes",
} as const

export function getApiKeys(): ApiKeys | null {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem(STORAGE_KEYS.API_KEYS)
  if (!stored) return null
  try {
    return JSON.parse(stored) as ApiKeys
  } catch {
    return null
  }
}

export function saveApiKeys(keys: ApiKeys): void {
  localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(keys))
}

export function getRecipes(): Recipe[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(STORAGE_KEYS.RECIPES)
  if (!stored) return []
  try {
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeRecipe)
  } catch {
    return []
  }
}

export function saveRecipe(recipe: Recipe): void {
  const recipes = getRecipes()
  // Check if recipe with same URL exists, update it
  const existingIndex = recipes.findIndex((r) => r.sourceUrl === recipe.sourceUrl)
  if (existingIndex >= 0) {
    recipes[existingIndex] = recipe
  } else {
    recipes.unshift(recipe) // Add to beginning
  }
  // Keep only last 20 recipes
  const trimmed = recipes.slice(0, 20)
  localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(trimmed))
}

export function deleteRecipe(id: string): void {
  const recipes = getRecipes()
  const filtered = recipes.filter((r) => r.id !== id)
  localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(filtered))
}
