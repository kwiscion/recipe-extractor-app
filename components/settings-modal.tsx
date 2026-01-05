"use client"

import { useState, useEffect } from "react"
import { KeyRound, Shield, Info, CheckCircle2 } from "lucide-react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSettings, saveSettings } from "@/lib/storage"
import type { AppSettings, ProviderApiKeys } from "@/lib/types"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: () => void
}

export function SettingsModal({ open, onOpenChange, onSave }: SettingsModalProps) {
  const [firecrawlKey, setFirecrawlKey] = useState("")
  const [openaiKey, setOpenaiKey] = useState("")
  const [googleKey, setGoogleKey] = useState("")
  const [anthropicKey, setAnthropicKey] = useState("")

  // Load existing keys on mount
  useEffect(() => {
    if (open) {
      const existing = getSettings()
      if (existing) {
        setFirecrawlKey(existing.firecrawl || "")
        setOpenaiKey(existing.providerKeys.openai || "")
        setGoogleKey(existing.providerKeys.google || "")
        setAnthropicKey(existing.providerKeys.anthropic || "")
      }
    }
  }, [open])

  const handleSubmit = () => {
    const providerKeys: ProviderApiKeys = {}
    
    if (openaiKey.trim()) {
      providerKeys.openai = openaiKey.trim()
    }
    if (googleKey.trim()) {
      providerKeys.google = googleKey.trim()
    }
    if (anthropicKey.trim()) {
      providerKeys.anthropic = anthropicKey.trim()
    }

    // Get existing settings to preserve selected model
    const existing = getSettings()
    const settings: AppSettings = {
      firecrawl: firecrawlKey.trim(),
      providerKeys,
      selectedModel: existing?.selectedModel || "gpt-4o",
    }
    
    saveSettings(settings)
    onSave?.()
    onOpenChange(false)
  }

  const isValid = firecrawlKey.trim() && (openaiKey.trim() || googleKey.trim() || anthropicKey.trim())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5" />
            API Settings
          </DialogTitle>
          <DialogDescription>
            Configure your API keys. You can add keys for multiple LLM providers.
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
            <Label htmlFor="firecrawl" className="flex items-center gap-2">
              Firecrawl API Key
              {firecrawlKey.trim() && <CheckCircle2 className="size-4 text-green-600" />}
            </Label>
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

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">LLM Provider Keys</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Add keys for any providers you want to use. You can switch between them later.
            </p>

            {/* OpenAI Key */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="openai-key" className="flex items-center gap-2">
                OpenAI API Key
                {openaiKey.trim() && <CheckCircle2 className="size-4 text-green-600" />}
              </Label>
              <Input
                id="openai-key"
                type="password"
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="size-3" />
                Get your key at platform.openai.com
              </p>
            </div>

            {/* Google Key */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="google-key" className="flex items-center gap-2">
                Google AI API Key
                {googleKey.trim() && <CheckCircle2 className="size-4 text-green-600" />}
              </Label>
              <Input
                id="google-key"
                type="password"
                placeholder="AI..."
                value={googleKey}
                onChange={(e) => setGoogleKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="size-3" />
                Get your key at aistudio.google.com
              </p>
            </div>

            {/* Anthropic Key */}
            <div className="space-y-2">
              <Label htmlFor="anthropic-key" className="flex items-center gap-2">
                Anthropic API Key
                {anthropicKey.trim() && <CheckCircle2 className="size-4 text-green-600" />}
              </Label>
              <Input
                id="anthropic-key"
                type="password"
                placeholder="sk-ant-..."
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="size-3" />
                Get your key at console.anthropic.com
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

