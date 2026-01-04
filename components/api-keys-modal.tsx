"use client"

import { useState, useEffect } from "react"
import { KeyRound, Shield, Info } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getApiKeys, saveApiKeys } from "@/lib/storage"
import { LLM_MODELS, type ApiKeys, type LLMProvider } from "@/lib/types"

interface ApiKeysModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (keys: ApiKeys) => void
}

export function ApiKeysModal({ open, onOpenChange, onSubmit }: ApiKeysModalProps) {
  const [firecrawlKey, setFirecrawlKey] = useState("")
  const [llmProvider, setLlmProvider] = useState<LLMProvider>("openai")
  const [llmModel, setLlmModel] = useState("gpt-4o")
  const [llmKey, setLlmKey] = useState("")

  // Load existing keys on mount
  useEffect(() => {
    const existing = getApiKeys()
    if (existing) {
      setFirecrawlKey(existing.firecrawl)
      setLlmProvider(existing.llmProvider)
      setLlmModel(existing.llmModel)
      setLlmKey(existing.llmKey)
    }
  }, [open])

  // Update model when provider changes
  const handleProviderChange = (provider: LLMProvider) => {
    setLlmProvider(provider)
    // Set default model for provider
    const firstModel = LLM_MODELS.find((m) => m.provider === provider)
    if (firstModel) {
      setLlmModel(firstModel.id)
    }
  }

  const handleSubmit = () => {
    const keys: ApiKeys = {
      firecrawl: firecrawlKey.trim(),
      llmProvider,
      llmModel,
      llmKey: llmKey.trim(),
    }
    saveApiKeys(keys)
    onSubmit(keys)
  }

  const isValid = firecrawlKey.trim() && llmKey.trim()

  const providerModels = LLM_MODELS.filter((m) => m.provider === llmProvider)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5" />
            API Keys Required
          </DialogTitle>
          <DialogDescription>
            Enter your API keys to extract recipes. We need Firecrawl to scrape pages and an LLM to parse the content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Privacy notice */}
          <Alert className="bg-muted/50">
            <Shield className="size-4" />
            <AlertDescription className="text-sm">
              Your keys are stored locally in your browser and never sent to our servers.
            </AlertDescription>
          </Alert>

          {/* Firecrawl Key */}
          <div className="space-y-2">
            <Label htmlFor="firecrawl">Firecrawl API Key</Label>
            <Input
              id="firecrawl"
              type="password"
              placeholder="fc-..."
              value={firecrawlKey}
              onChange={(e) => setFirecrawlKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Get your key at{" "}
              <a
                href="https://firecrawl.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2"
              >
                firecrawl.dev
              </a>
            </p>
          </div>

          {/* LLM Provider */}
          <div className="space-y-2">
            <Label>LLM Provider</Label>
            <Select value={llmProvider} onValueChange={(v) => handleProviderChange(v as LLMProvider)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="google">Google (Gemini)</SelectItem>
                <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* LLM Model */}
          <div className="space-y-2">
            <Label>Model</Label>
            <Select value={llmModel} onValueChange={setLlmModel}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>
                    {llmProvider === "openai" ? "OpenAI" : llmProvider === "google" ? "Google" : "Anthropic"} Models
                  </SelectLabel>
                  {providerModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* LLM API Key */}
          <div className="space-y-2">
            <Label htmlFor="llm-key">
              {llmProvider === "openai" ? "OpenAI" : llmProvider === "google" ? "Google AI" : "Anthropic"} API Key
            </Label>
            <Input
              id="llm-key"
              type="password"
              placeholder={llmProvider === "openai" ? "sk-..." : llmProvider === "google" ? "AI..." : "sk-ant-..."}
              value={llmKey}
              onChange={(e) => setLlmKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="size-3" />
              {llmProvider === "openai" && "Get your key at platform.openai.com"}
              {llmProvider === "google" && "Get your key at aistudio.google.com"}
              {llmProvider === "anthropic" && "Get your key at console.anthropic.com"}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            Save & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
