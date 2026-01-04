"use client"

import { History } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Recipe } from "@/lib/types"

interface RecipeHistoryProps {
  recipes: Recipe[]
  onSelect: (recipe: Recipe) => void
}

export function RecipeHistory({ recipes, onSelect }: RecipeHistoryProps) {
  const handleSelect = (recipeId: string) => {
    const recipe = recipes.find((r) => r.id === recipeId)
    if (recipe) {
      onSelect(recipe)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })
  }

  // Truncate title if too long
  const truncateTitle = (title: string, maxLength = 40) => {
    if (title.length <= maxLength) return title
    return title.slice(0, maxLength) + "..."
  }

  return (
    <div className="flex items-center gap-2">
      <History className="size-4 text-muted-foreground" />
      <Select onValueChange={handleSelect}>
        <SelectTrigger className="w-full bg-card/50">
          <SelectValue placeholder="Previous recipes..." />
        </SelectTrigger>
        <SelectContent>
          {recipes.map((recipe) => (
            <SelectItem key={recipe.id} value={recipe.id}>
              <span className="flex items-center justify-between gap-4 w-full">
                <span>{truncateTitle(recipe.title)}</span>
                <span className="text-xs text-muted-foreground">{formatDate(recipe.extractedAt)}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
