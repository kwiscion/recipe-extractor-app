"use client";

import { useState, useEffect } from "react";
import { KeyRound, Shield, Info, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { getSettings, saveSettings } from "@/lib/storage";
import { LLM_MODELS } from "@/lib/types";
import type { AppSettings, ProviderApiKeys } from "@/lib/types";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
}

export function SettingsModal({
  open,
  onOpenChange,
  onSave,
}: SettingsModalProps) {
  const [firecrawlKey, setFirecrawlKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [googleKey, setGoogleKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("");

  // Load existing keys on mount
  useEffect(() => {
    if (open) {
      const existing = getSettings();
      if (existing) {
        setFirecrawlKey(existing.firecrawl || "");
        setOpenaiKey(existing.providerKeys.openai || "");
        setGoogleKey(existing.providerKeys.google || "");
        setAnthropicKey(existing.providerKeys.anthropic || "");
        setSelectedModel(existing.selectedModel || "");
      }
    }
  }, [open]);

  const handleSubmit = () => {
    const providerKeys: ProviderApiKeys = {};

    if (openaiKey.trim()) {
      providerKeys.openai = openaiKey.trim();
    }
    if (googleKey.trim()) {
      providerKeys.google = googleKey.trim();
    }
    if (anthropicKey.trim()) {
      providerKeys.anthropic = anthropicKey.trim();
    }

    // Get existing settings to preserve other settings
    const existing = getSettings();
    const settings: AppSettings = {
      firecrawl: firecrawlKey.trim(),
      providerKeys,
      selectedModel: selectedModel || existing?.selectedModel || "gpt-4o",
    };

    saveSettings(settings);
    onSave?.();
    onOpenChange(false);
  };

  const isValid =
    firecrawlKey.trim() &&
    (openaiKey.trim() || googleKey.trim() || anthropicKey.trim());

  // Filter models based on entered API keys
  const availableModels = LLM_MODELS.filter((model) => {
    if (model.provider === "openai") return openaiKey.trim();
    if (model.provider === "google") return googleKey.trim();
    if (model.provider === "anthropic") return anthropicKey.trim();
    return false;
  });

  // Group models by provider
  const openaiModels = availableModels.filter((m) => m.provider === "openai");
  const googleModels = availableModels.filter((m) => m.provider === "google");
  const anthropicModels = availableModels.filter(
    (m) => m.provider === "anthropic"
  );

  // Ensure selected model is valid, fallback to first available or default
  const currentModelValue =
    selectedModel && availableModels.some((m) => m.id === selectedModel)
      ? selectedModel
      : availableModels[0]?.id || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5" />
            API Settings
          </DialogTitle>
          <DialogDescription>
            Configure your API keys. You can add keys for multiple LLM
            providers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Privacy notice */}
          <Alert className="bg-muted/50">
            <Shield className="size-4" />
            <AlertDescription className="text-sm">
              Your keys are stored locally in your browser and never sent to our
              servers.
            </AlertDescription>
          </Alert>

          {/* Firecrawl Key */}
          <div className="space-y-2">
            <Label htmlFor="firecrawl" className="flex items-center gap-2">
              Firecrawl API Key
              {firecrawlKey.trim() && (
                <CheckCircle2 className="size-4 text-green-600" />
              )}
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
              Add keys for any providers you want to use. You can switch between
              them later.
            </p>

            {/* OpenAI Key */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="openai-key" className="flex items-center gap-2">
                OpenAI API Key
                {openaiKey.trim() && (
                  <CheckCircle2 className="size-4 text-green-600" />
                )}
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
                Get your key at{" "}
                <a
                  href="https://platform.openai.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  platform.openai.com
                </a>
              </p>
            </div>

            {/* Google Key */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="google-key" className="flex items-center gap-2">
                Google AI API Key
                {googleKey.trim() && (
                  <CheckCircle2 className="size-4 text-green-600" />
                )}
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
                Get your key at{" "}
                <a
                  href="https://aistudio.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  aistudio.google.com
                </a>
              </p>
            </div>

            {/* Anthropic Key, disabled because of CORS policy, TODO: fix this */}
            {/* <div className="space-y-2">
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
            </div> */}
          </div>

          {/* Model Selector */}
          <div className="border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="model-select">Default Model</Label>
              <Select
                value={currentModelValue}
                onValueChange={setSelectedModel}
                disabled={availableModels.length === 0}
              >
                <SelectTrigger id="model-select" className="w-full">
                  <SelectValue
                    placeholder={
                      availableModels.length === 0
                        ? "Add API keys to select a model"
                        : "Select a model"
                    }
                  />
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
                      No models available. Add API keys above.
                    </div>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select the default model to use for recipe extraction. Only
                models with configured API keys are shown.
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
  );
}
