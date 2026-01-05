"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatQuantity } from "@/lib/format-quantity";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  getAlternativeMeasurements,
  formatAltValue,
} from "@/lib/unit-conversions";
import type { Ingredient } from "@/lib/types";

interface IngredientListProps {
  ingredients: Ingredient[];
  baseServings: number;
  currentServings: number;
  checkedIngredients?: Set<number>;
  onToggleIngredient?: (index: number) => void;
  showHeading?: boolean;
}

export function IngredientList({
  ingredients,
  baseServings,
  currentServings,
  checkedIngredients,
  onToggleIngredient,
  showHeading = true,
}: IngredientListProps) {
  const scale = currentServings / baseServings;
  const [openIngredients, setOpenIngredients] = useState<Set<number>>(
    () => new Set()
  );

  const formatAltToken = (value: number, unit: string, exact: boolean) => {
    const prefix = exact ? "" : "≈ ";
    return `${prefix}${formatAltValue(value, unit)} ${unit}`;
  };

  return (
    <div className="space-y-3">
      {showHeading && (
        <h2 className="text-lg font-semibold text-foreground">Ingredients</h2>
      )}
      <ul className="space-y-2">
        {ingredients.map((ingredient, index) => {
          const formattedQty = formatQuantity(ingredient.quantity, scale);
          const isScaled = scale !== 1 && ingredient.quantity > 0;
          const isChecked = checkedIngredients?.has(index) ?? false;
          const scaledQty = ingredient.quantity * scale;
          const deterministicAlts = getAlternativeMeasurements(
            scaledQty,
            ingredient.unit
          );
          const llmAltsScaled =
            ingredient.alternatives?.map((a) => ({
              ...a,
              quantity: a.quantity * scale,
            })) ?? [];

          // Merge + de-dupe by unit (keep deterministic first for exactness)
          const seenUnits = new Set<string>([ingredient.unit.toLowerCase()]);
          const merged = [...deterministicAlts, ...llmAltsScaled]
            .filter((a) => {
              const key = (a.unit ?? "").toLowerCase().trim();
              if (!key || seenUnits.has(key)) return false;
              seenUnits.add(key);
              return true;
            })
            .slice(0, 4);

          const hasAlternatives = merged.length > 0;
          const isOpen = openIngredients.has(index);

          const setOpen = (open: boolean) => {
            setOpenIngredients((prev) => {
              const next = new Set(prev);
              if (open) next.add(index);
              else next.delete(index);
              return next;
            });
          };

          return (
            <li key={index} className="py-1">
              <Collapsible
                open={isOpen}
                onOpenChange={(open) => hasAlternatives && setOpen(open)}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 size-5 accent-primary shrink-0"
                    checked={isChecked}
                    onChange={() => onToggleIngredient?.(index)}
                    aria-label={`Mark ${ingredient.name} as gathered`}
                  />

                  <div className="flex-1 min-w-0">
                    {hasAlternatives ? (
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="w-full text-left cursor-pointer"
                          aria-label={
                            isOpen
                              ? "Hide alternative measurements"
                              : "Show alternative measurements"
                          }
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span
                              className={`text-foreground ${
                                isChecked ? "opacity-60 line-through" : ""
                              }`}
                            >
                              {formattedQty && (
                                <span
                                  className={`font-medium ${
                                    isScaled ? "text-primary" : ""
                                  }`}
                                >
                                  {formattedQty} {ingredient.unit}
                                </span>
                              )}{" "}
                              <span>{ingredient.name}</span>
                              {ingredient.notes && (
                                <span className="text-muted-foreground text-sm">
                                  {" "}
                                  ({ingredient.notes})
                                </span>
                              )}
                            </span>
                            <ChevronDown
                              className={`mt-1 size-4 text-muted-foreground transition-transform ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </button>
                      </CollapsibleTrigger>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={`text-foreground ${
                            isChecked ? "opacity-60 line-through" : ""
                          }`}
                        >
                          {formattedQty && (
                            <span
                              className={`font-medium ${
                                isScaled ? "text-primary" : ""
                              }`}
                            >
                              {formattedQty} {ingredient.unit}
                            </span>
                          )}{" "}
                          <span>{ingredient.name}</span>
                          {ingredient.notes && (
                            <span className="text-muted-foreground text-sm">
                              {" "}
                              ({ingredient.notes})
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {hasAlternatives && (
                      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
                        <p className="mt-2 text-sm text-muted-foreground">
                          Also:{" "}
                          {merged
                            .map((m) =>
                              formatAltToken(m.quantity, m.unit, m.exact)
                            )
                            .join(" • ")}
                        </p>
                      </CollapsibleContent>
                    )}
                  </div>
                </div>
              </Collapsible>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
