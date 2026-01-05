"use client";

import { useState } from "react";
import { ArrowLeft, ExternalLink, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServingsAdjuster } from "@/components/servings-adjuster";
import { IngredientList } from "@/components/ingredient-list";
import { RecipeSteps } from "@/components/recipe-steps";
import { WarningsSection } from "@/components/warnings-section";
import { ScreenWakeLock } from "@/components/screen-wake-lock";
import { CookingMode } from "@/components/cooking-mode";
import type { Recipe } from "@/lib/types";

interface RecipeViewProps {
  recipe: Recipe;
  onBack: () => void;
}

export function RecipeView({ recipe, onBack }: RecipeViewProps) {
  const [servings, setServings] = useState(recipe.baseServings);
  const [mode, setMode] = useState<"overview" | "cooking">("overview");
  const [cookingStepIndex, setCookingStepIndex] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(
    () => new Set()
  );
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    () => new Set()
  );

  const toggleIngredient = (index: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleStepCompleted = (index: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const startCooking = () => {
    // Start at the first incomplete step if we can; otherwise start at step 0.
    const firstIncomplete = recipe.steps.findIndex(
      (_, i) => !completedSteps.has(i)
    );
    setCookingStepIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
    setMode("cooking");
  };

  if (mode === "cooking") {
    return (
      <CookingMode
        recipe={recipe}
        servings={servings}
        onChangeServings={setServings}
        checkedIngredients={checkedIngredients}
        onToggleIngredient={toggleIngredient}
        completedSteps={completedSteps}
        onToggleStepComplete={toggleStepCompleted}
        stepIndex={cookingStepIndex}
        onChangeStepIndex={setCookingStepIndex}
        onExit={() => setMode("overview")}
      />
    );
  }

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
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-balance">
            {recipe.title}
          </h1>
          {recipe.description && (
            <p className="text-muted-foreground text-pretty">
              {recipe.description}
            </p>
          )}
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
          <ServingsAdjuster
            baseServings={recipe.baseServings}
            currentServings={servings}
            onChange={setServings}
          />
        </div>

        {/* Content Grid - Ingredients and Steps */}
        <div className="space-y-8">
          {/* Ingredients */}
          <div className="p-4 bg-card rounded-lg border">
            <IngredientList
              ingredients={recipe.ingredients}
              baseServings={recipe.baseServings}
              currentServings={servings}
              checkedIngredients={checkedIngredients}
              onToggleIngredient={toggleIngredient}
            />
          </div>

          {/* Start cooking */}
          <div className="flex justify-center">
            <Button
              size="lg"
              className="h-14 w-full sm:w-auto px-8 text-base"
              onClick={startCooking}
            >
              <Play className="size-5" />
              Start Cooking
            </Button>
          </div>

          {/* Steps */}
          <div className="p-4 bg-card rounded-lg border">
            <RecipeSteps
              steps={recipe.steps}
              completedSteps={completedSteps}
              onToggleComplete={toggleStepCompleted}
            />
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
  );
}
