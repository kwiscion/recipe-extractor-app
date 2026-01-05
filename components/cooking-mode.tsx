"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  List,
  X,
} from "lucide-react";
import { Drawer } from "vaul";

import type { Recipe } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { IngredientList } from "@/components/ingredient-list";
import { ScreenWakeLock } from "@/components/screen-wake-lock";
import { ServingsAdjuster } from "@/components/servings-adjuster";

interface CookingModeProps {
  recipe: Recipe;
  servings: number;
  onChangeServings: (servings: number) => void;

  checkedIngredients: Set<number>;
  onToggleIngredient: (index: number) => void;

  completedSteps: Set<number>;
  onToggleStepComplete: (index: number) => void;

  stepIndex: number;
  onChangeStepIndex: (index: number) => void;

  onExit: () => void;
}

export function CookingMode({
  recipe,
  servings,
  onChangeServings,
  checkedIngredients,
  onToggleIngredient,
  completedSteps,
  onToggleStepComplete,
  stepIndex,
  onChangeStepIndex,
  onExit,
}: CookingModeProps) {
  const stepsCount = recipe.steps.length;

  const clampedIndex = useMemo(() => {
    if (stepsCount <= 0) return 0;
    return Math.min(Math.max(stepIndex, 0), stepsCount - 1);
  }, [stepIndex, stepsCount]);

  useEffect(() => {
    if (clampedIndex !== stepIndex) onChangeStepIndex(clampedIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampedIndex]);

  const step = recipe.steps[clampedIndex];
  const prev = clampedIndex > 0 ? recipe.steps[clampedIndex - 1] : null;
  const next =
    clampedIndex < stepsCount - 1 ? recipe.steps[clampedIndex + 1] : null;

  const isDone = completedSteps.has(clampedIndex);
  const [showLearnMore, setShowLearnMore] = useState(false);

  useEffect(() => {
    setShowLearnMore(false);
  }, [clampedIndex]);

  const canPrev = clampedIndex > 0;
  const canNext = clampedIndex < stepsCount - 1;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-4 flex flex-col min-h-screen gap-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={onExit} className="gap-2">
            <X className="size-4" />
            <span className="hidden sm:inline">Exit cooking</span>
            <span className="sm:hidden">Exit</span>
          </Button>
          <div className="flex items-center gap-2">
            <ScreenWakeLock />
          </div>
        </div>

        {/* Title + progress + ingredients button */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-foreground text-balance">
              {recipe.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Step {stepsCount === 0 ? 0 : clampedIndex + 1} of {stepsCount}
            </p>
          </div>
          <Drawer.Root>
            <Drawer.Trigger asChild>
              <Button variant="outline" className="h-12 bg-transparent">
                <List className="size-4" />
                Ingredients
              </Button>
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
              <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 rounded-t-2xl border bg-background p-4 shadow-lg">
                <div className="mx-auto h-1.5 w-12 rounded-full bg-muted mb-4" />
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <Drawer.Title className="text-lg font-semibold">
                      Ingredients
                    </Drawer.Title>
                    <p className="text-sm text-muted-foreground">
                      Servings: {servings} • {recipe.ingredients.length} items
                    </p>
                  </div>
                  <Drawer.Close asChild>
                    <Button variant="ghost" size="icon" className="size-10">
                      <X className="size-8" />
                      <span className="sr-only">Close ingredients</span>
                    </Button>
                  </Drawer.Close>
                </div>

                <div className="mb-4">
                  <ServingsAdjuster
                    baseServings={recipe.baseServings}
                    currentServings={servings}
                    onChange={onChangeServings}
                  />
                </div>

                <div className="max-h-[65vh] overflow-y-auto pr-1">
                  <IngredientList
                    ingredients={recipe.ingredients}
                    baseServings={recipe.baseServings}
                    currentServings={servings}
                    checkedIngredients={checkedIngredients}
                    onToggleIngredient={onToggleIngredient}
                    showHeading={false}
                  />
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>
        </div>

        {/* Step player */}
        <div className="flex-1 flex flex-col justify-end">
          <div className="rounded-xl border bg-card p-4 space-y-4">
            {/* Step header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {/* <p className="text-sm text-muted-foreground">Current step</p> */}
                <h2 className="text-2xl font-bold text-foreground">
                  {step?.title ?? "No steps"}
                </h2>
              </div>
              {stepsCount > 0 && (
                <Button
                  type="button"
                  variant={isDone ? "secondary" : "outline"}
                  className="text-base w-36"
                  onClick={() => {
                    onToggleStepComplete(clampedIndex);
                    // Move to next step if it exists and you just marked current step as done
                    if (canNext && !isDone) {
                      onChangeStepIndex(clampedIndex + 1);
                    }
                  }}
                  aria-pressed={isDone}
                  aria-label={
                    isDone ? "Mark step as not done" : "Mark step as done"
                  }
                >
                  <Check className="size-4" />
                  {isDone ? "Done" : "Mark done"}
                </Button>
              )}
            </div>

            {/* Instruction */}
            {step?.instruction && (
              <p className="text-lg leading-relaxed text-foreground">
                {step.instruction}
              </p>
            )}

            {/* Learn more */}
            {step?.details && step.details.trim().length > 0 && (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto justify-start text-primary font-semibold text-base"
                  onClick={() => setShowLearnMore((v) => !v)}
                  aria-expanded={showLearnMore}
                >
                  {showLearnMore ? "Hide learn more" : "Learn more"}
                  <ChevronDown
                    className={`size-5 transition-transform ${
                      showLearnMore ? "rotate-180" : ""
                    }`}
                  />
                </Button>
                {showLearnMore && (
                  <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground leading-relaxed">
                    {step.details}
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-14 bg-transparent text-base flex-col gap-1 py-3"
                onClick={() => onChangeStepIndex(clampedIndex - 1)}
                disabled={!canPrev}
                aria-label="Previous step"
              >
                <div className="flex items-center gap-2">
                  <ChevronLeft className="size-5" />
                  <span>Back</span>
                </div>
                {/* {prev && (
                  <span className="text-sm text-muted-foreground font-normal">
                    {prev.title}
                  </span>
                )} */}
              </Button>
              <Button
                type="button"
                className="h-auto min-h-14 text-base flex-col gap-1 py-3"
                onClick={() => onChangeStepIndex(clampedIndex + 1)}
                disabled={!canNext}
                aria-label="Next step"
              >
                <div className="flex items-center gap-2">
                  <span>Next</span>
                  <ChevronRight className="size-5" />
                </div>
                {/* {next && (
                  <span className="text-sm font-normal">{next.title}</span>
                )} */}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
