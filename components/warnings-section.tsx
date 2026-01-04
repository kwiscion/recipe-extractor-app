import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface WarningsSectionProps {
  warnings: string[]
}

export function WarningsSection({ warnings }: WarningsSectionProps) {
  if (!warnings.length) return null

  return (
    <Alert className="bg-accent/20 border-accent">
      <AlertTriangle className="size-4 text-accent-foreground" />
      <AlertTitle className="text-accent-foreground font-semibold">Before You Start</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 space-y-1">
          {warnings.map((warning, index) => (
            <li key={index} className="text-sm text-foreground flex items-start gap-2">
              <span className="text-accent-foreground">•</span>
              {warning}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
