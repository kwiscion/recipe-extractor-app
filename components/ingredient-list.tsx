"use client"

import { formatQuantity } from "@/lib/format-quantity"
import type { Ingredient } from "@/lib/types"

interface IngredientListProps {
  ingredients: Ingredient[]
  baseServings: number
  currentServings: number
  checkedIngredients?: Set<number>
  onToggleIngredient?: (index: number) => void
  showHeading?: boolean
}

export function IngredientList({
  ingredients,
  baseServings,
  currentServings,
  checkedIngredients,
  onToggleIngredient,
  showHeading = true,
}: IngredientListProps) {
  const scale = currentServings / baseServings

  return (
    <div className="space-y-3">
      {showHeading && <h2 className="text-lg font-semibold text-foreground">Ingredients</h2>}
      <ul className="space-y-2">
        {ingredients.map((ingredient, index) => {
          const formattedQty = formatQuantity(ingredient.quantity, scale)
          const isScaled = scale !== 1 && ingredient.quantity > 0
          const isChecked = checkedIngredients?.has(index) ?? false

          return (
            <li key={index} className="py-1">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="mt-1 size-5 accent-primary"
                  checked={isChecked}
                  onChange={() => onToggleIngredient?.(index)}
                  aria-label={`Mark ${ingredient.name} as gathered`}
                />
                <span className={`text-foreground ${isChecked ? "opacity-60 line-through" : ""}`}>
                  {formattedQty && (
                    <span className={`font-medium ${isScaled ? "text-primary" : ""}`}>
                      {formattedQty} {ingredient.unit}
                    </span>
                  )}{" "}
                  <span>{ingredient.name}</span>
                  {ingredient.notes && <span className="text-muted-foreground text-sm"> ({ingredient.notes})</span>}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
