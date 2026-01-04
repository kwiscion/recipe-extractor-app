"use client"

import { useState } from "react"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ServingsAdjuster } from "@/components/servings-adjuster"
import { IngredientList } from "@/components/ingredient-list"
import { RecipeSteps } from "@/components/recipe-steps"
import { WarningsSection } from "@/components/warnings-section"
import { ScreenWakeLock } from "@/components/screen-wake-lock"
import type { Recipe } from "@/lib/types"

interface RecipeViewProps {
  recipe: Recipe
  onBack: () => void
}

export function RecipeView({ recipe, onBack }: RecipeViewProps) {
  const [servings, setServings] = useState(recipe.baseServings)

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <ScreenWakeLock />
        </div>

        {/* Title */}
        <div className="space-y-2 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-balance">{recipe.title}</h1>
          {recipe.description && <p className="text-muted-foreground text-pretty">{recipe.description}</p>}
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            View original
            <ExternalLink className="size-3" />
          </a>
        </div>

        {/* Warnings */}
        {recipe.warnings.length > 0 && (
          <div className="mb-6">
            <WarningsSection warnings={recipe.warnings} />
          </div>
        )}

        {/* Servings */}
        <div className="mb-6 p-4 bg-card rounded-lg border">
          <ServingsAdjuster baseServings={recipe.baseServings} currentServings={servings} onChange={setServings} />
        </div>

        {/* Content Grid - Ingredients and Steps */}
        <div className="space-y-8">
          {/* Ingredients */}
          <div className="p-4 bg-card rounded-lg border">
            <IngredientList
              ingredients={recipe.ingredients}
              baseServings={recipe.baseServings}
              currentServings={servings}
            />
          </div>

          {/* Steps */}
          <div className="p-4 bg-card rounded-lg border">
            <RecipeSteps steps={recipe.steps} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center">
          <p className="text-sm text-muted-foreground">
            Extracted on {new Date(recipe.extractedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </main>
  )
}
