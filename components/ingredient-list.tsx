"use client"

import { formatQuantity } from "@/lib/format-quantity"
import type { Ingredient } from "@/lib/types"

interface IngredientListProps {
  ingredients: Ingredient[]
  baseServings: number
  currentServings: number
}

export function IngredientList({ ingredients, baseServings, currentServings }: IngredientListProps) {
  const scale = currentServings / baseServings

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">Ingredients</h2>
      <ul className="space-y-2">
        {ingredients.map((ingredient, index) => {
          const formattedQty = formatQuantity(ingredient.quantity, scale)
          const isScaled = scale !== 1 && ingredient.quantity > 0

          return (
            <li key={index} className="flex items-start gap-3 py-1">
              <span className="size-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <span className="text-foreground">
                {formattedQty && (
                  <span className={`font-medium ${isScaled ? "text-primary" : ""}`}>
                    {formattedQty} {ingredient.unit}
                  </span>
                )}{" "}
                <span>{ingredient.name}</span>
                {ingredient.notes && <span className="text-muted-foreground text-sm"> ({ingredient.notes})</span>}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
