"use client"

export function CookingLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      <div className="relative">
        {/* Pot */}
        <svg viewBox="0 0 100 100" className="size-24 text-primary" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Steam lines */}
          <path
            d="M30 25 Q30 15 35 10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="animate-steam-1 opacity-60"
          />
          <path
            d="M50 20 Q50 10 55 5"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="animate-steam-2 opacity-60"
          />
          <path
            d="M70 25 Q70 15 65 10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="animate-steam-3 opacity-60"
          />
          {/* Pot body */}
          <path
            d="M20 40 L20 75 Q20 85 30 85 L70 85 Q80 85 80 75 L80 40"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          {/* Pot lid */}
          <path d="M15 40 L85 40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="animate-lid" />
          {/* Lid handle */}
          <circle cx="50" cy="35" r="5" fill="currentColor" className="animate-lid" />
          {/* Handles */}
          <path d="M15 50 Q5 50 5 60 Q5 70 15 70" stroke="currentColor" strokeWidth="4" fill="none" />
          <path d="M85 50 Q95 50 95 60 Q95 70 85 70" stroke="currentColor" strokeWidth="4" fill="none" />
        </svg>
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-foreground">Cooking...</p>
        <p className="text-sm text-muted-foreground">Extracting your recipe</p>
      </div>
    </div>
  )
}
