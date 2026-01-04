"use client";

import { useState } from "react";
import { ChevronDown, Clock } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { RecipeStep } from "@/lib/types";
import { Button } from "./ui/button";

interface RecipeStepsProps {
  steps: RecipeStep[];
}

export function RecipeSteps({ steps }: RecipeStepsProps) {
  const [openSteps, setOpenSteps] = useState<Set<number>>(new Set());

  const toggleStep = (index: number) => {
    const newOpen = new Set(openSteps);
    if (newOpen.has(index)) {
      newOpen.delete(index);
    } else {
      newOpen.add(index);
    }
    setOpenSteps(newOpen);
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">Instructions</h2>
      <ol className="space-y-3">
        {steps.map((step, index) => {
          const hasDetails = step.details && step.details.trim().length > 0;
          const isOpen = openSteps.has(index);

          return (
            <li key={index} className="relative">
              <div className="flex gap-4">
                {/* Step number */}
                <div className="flex flex-col items-center">
                  <span className="flex items-center justify-center size-7 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                    {index + 1}
                  </span>
                  {index < steps.length - 1 && (
                    <div className="w-px flex-1 bg-border mt-2" />
                  )}
                </div>

                {/* Step content */}
                <div className="flex-1 pb-4">
                  <Collapsible
                    open={isOpen}
                    onOpenChange={() => hasDetails && toggleStep(index)}
                  >
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <p className="text-foreground font-medium">
                          {step.title}
                        </p>
                        <p className="text-foreground leading-relaxed">
                          {step.instruction}
                        </p>
                        {step.duration && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            {step.duration}
                          </span>
                        )}
                      </div>
                      {hasDetails && (
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="link"
                            // className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline underline-offset-4"
                            aria-label={
                              isOpen ? "Hide learn more" : "Learn more"
                            }
                          >
                            <span>Learn more</span>
                            <ChevronDown
                              className={`size-5 transition-transform duration-200 ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          </Button>
                        </CollapsibleTrigger>
                      )}
                    </div>
                    {hasDetails && (
                      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-md p-3">
                          {step.details}
                        </p>
                      </CollapsibleContent>
                    )}
                  </Collapsible>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
