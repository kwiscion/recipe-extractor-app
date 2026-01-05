"use client"

import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"
import { LLM_MODELS, type LLMModel, type ProviderApiKeys } from "@/lib/types"

interface ModelSelectorProps {
  selectedModel: string
  providerKeys: ProviderApiKeys
  onModelChange: (modelId: string) => void
  onOpenSettings: () => void
}

export function ModelSelector({
  selectedModel,
  providerKeys,
  onModelChange,
  onOpenSettings,
}: ModelSelectorProps) {
  // Filter models to only show those with API keys configured
  const availableModels = LLM_MODELS.filter((model) => {
    const key = providerKeys[model.provider]
    return key && key.trim().length > 0
  })

  // Group models by provider
  const openaiModels = availableModels.filter((m) => m.provider === "openai")
  const googleModels = availableModels.filter((m) => m.provider === "google")
  const anthropicModels = availableModels.filter((m) => m.provider === "anthropic")

  // Check if selected model is still available
  const isSelectedAvailable = availableModels.some((m) => m.id === selectedModel)
  const currentValue = isSelectedAvailable ? selectedModel : availableModels[0]?.id || ""

  return (
    <div className="flex gap-2 w-full max-w-xl mx-auto">
      <Select value={currentValue} onValueChange={onModelChange}>
        <SelectTrigger className="flex-1 h-12">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {openaiModels.length > 0 && (
            <SelectGroup>
              <SelectLabel>OpenAI</SelectLabel>
              {openaiModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          {googleModels.length > 0 && (
            <SelectGroup>
              <SelectLabel>Google</SelectLabel>
              {googleModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          {anthropicModels.length > 0 && (
            <SelectGroup>
              <SelectLabel>Anthropic</SelectLabel>
              {anthropicModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          {availableModels.length === 0 && (
            <div className="p-2 text-sm text-muted-foreground text-center">
              No models available. Add API keys in settings.
            </div>
          )}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="icon"
        onClick={onOpenSettings}
        className="h-12 w-12 shrink-0"
        title="API Settings"
      >
        <Settings className="size-5" />
      </Button>
    </div>
  )
}

