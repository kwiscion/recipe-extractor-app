"use client";

import { Minus, Plus, RefreshCcw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServingsAdjusterProps {
  baseServings: number;
  currentServings: number;
  onChange: (servings: number) => void;
}

export function ServingsAdjuster({
  baseServings,
  currentServings,
  onChange,
}: ServingsAdjusterProps) {
  const decrease = () => {
    if (currentServings > 1) {
      onChange(currentServings - 1);
    }
  };

  const increase = () => {
    if (currentServings < 99) {
      onChange(currentServings + 1);
    }
  };

  const isScaled = currentServings !== baseServings;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Users className="size-4" />
        <span className="text-sm">Servings</span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-12 bg-transparent"
          onClick={decrease}
          disabled={currentServings <= 1}
          aria-label="Decrease servings"
        >
          <Minus className="size-5" />
        </Button>
        <span
          className={`w-10 text-center font-medium tabular-nums ${
            isScaled ? "text-primary" : "text-foreground"
          }`}
        >
          {currentServings}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="size-12 bg-transparent"
          onClick={increase}
          disabled={currentServings >= 99}
          aria-label="Increase servings"
        >
          <Plus className="size-5" />
        </Button>
      </div>
      {isScaled && (
        <Button
          variant="outline"
          size="lg"
          onClick={() => onChange(baseServings)}
          className="h-12 bg-transparent ml-auto"
          aria-label="Reset servings to base servings"
        >
          Reset to {baseServings}
        </Button>
      )}
    </div>
  );
}
