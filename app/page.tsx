"use client";

import { useState, useEffect } from "react";
import { Scale, ListChecks, AlertTriangle, Sparkles } from "lucide-react";
import { UrlInput } from "@/components/url-input";
import { FeatureCard } from "@/components/feature-card";
import { SettingsModal } from "@/components/settings-modal";
import { ModelSelector } from "@/components/model-selector";
import { CookingLoader } from "@/components/cooking-loader";
import { RecipeView } from "@/components/recipe-view";
import { RecipeHistory } from "@/components/recipe-history";
import {
  getSettings,
  saveSettings,
  getRecipes,
  saveRecipe,
  getCurrentSession,
  clearCurrentSession,
} from "@/lib/storage";
import { extractRecipe } from "@/lib/extract-recipe";
import type { Recipe, AppSettings, ProviderApiKeys } from "@/lib/types";
import { getProviderForModel, getAvailableModels } from "@/lib/types";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

const features = [
  {
    icon: Scale,
    title: "Adjustable Servings",
    description:
      "Change the number of servings and watch ingredients scale automatically.",
  },
  {
    icon: ListChecks,
    title: "Clean Steps",
    description:
      "Clear, numbered steps with expandable details for when you need more info.",
  },
  {
    icon: AlertTriangle,
    title: "Warnings & Tips",
    description:
      "Important notes highlighted so you never miss crucial cooking tips.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered",
    description:
      "Uses your preferred LLM to intelligently extract and structure recipes.",
  },
];

export default function HomePage() {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const recipes = getRecipes();
    setSavedRecipes(recipes);

    // Load settings
    const loadedSettings = getSettings();
    setSettings(loadedSettings);

    // Auto-restore current session if exists
    const session = getCurrentSession();
    if (session?.recipeId) {
      const recipe = recipes.find((r) => r.id === session.recipeId);
      if (recipe) {
        setCurrentRecipe(recipe);
      }
    }
    setIsLoading(false);
  }, []);

  const handleUrlSubmit = async (url: string) => {
    if (!settings) {
      setPendingUrl(url);
      setShowSettingsModal(true);
      toast({
        variant: "destructive",
        title: "Settings Required",
        description: "Please configure your API keys first.",
      });
      return;
    }

    // Check if selected model has API key
    const provider = getProviderForModel(settings.selectedModel);
    if (!provider || !settings.providerKeys[provider]) {
      setShowSettingsModal(true);
      toast({
        variant: "destructive",
        title: "API Key Missing",
        description: `Please add an API key for ${provider} or select a different model.`,
      });
      return;
    }

    await processRecipe(url, settings);
  };

  const handleSettingsSaved = () => {
    const loadedSettings = getSettings();
    setSettings(loadedSettings);
    
    // If there was a pending URL, process it now
    if (pendingUrl && loadedSettings) {
      processRecipe(pendingUrl, loadedSettings);
      setPendingUrl(null);
    }
  };

  const handleModelChange = (modelId: string) => {
    if (settings) {
      const updatedSettings = { ...settings, selectedModel: modelId };
      saveSettings(updatedSettings);
      setSettings(updatedSettings);
    }
  };

  const processRecipe = async (url: string, currentSettings: AppSettings) => {
    setIsLoadingRecipe(true);
    setCurrentRecipe(null);
    try {
      const recipe = await extractRecipe(url, currentSettings);
      setCurrentRecipe(recipe);
      saveRecipe(recipe);
      setSavedRecipes(getRecipes());
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Extraction Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to extract recipe. Please try again.",
      });
    } finally {
      setIsLoadingRecipe(false);
    }
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    setCurrentRecipe(recipe);
  };

  const handleBack = () => {
    clearCurrentSession();
    setCurrentRecipe(null);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <CookingLoader />
      </main>
    );
  }

  // Show recipe view if we have a current recipe
  if (currentRecipe) {
    return (
      <>
        <RecipeView recipe={currentRecipe} onBack={handleBack} />
        <Toaster />
      </>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 sm:py-16">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground text-balance">
            Recipe Extractor
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Paste any recipe URL and get a clean, distraction-free version with
            adjustable servings and clear instructions. No ads, no life stories.
          </p>
        </div>

        {/* Recipe History Dropdown */}
        {savedRecipes.length > 0 && (
          <div className="max-w-xl mx-auto mb-6">
            <RecipeHistory
              recipes={savedRecipes}
              onSelect={handleSelectRecipe}
            />
          </div>
        )}

        {/* URL Input */}
        {isLoadingRecipe ? (
          <CookingLoader />
        ) : (
          <>
            <UrlInput onSubmit={handleUrlSubmit} isLoading={isLoadingRecipe} />
            {/* Model Selector */}
            <div className="mt-4">
              <ModelSelector
                selectedModel={settings?.selectedModel || "gpt-4o"}
                providerKeys={settings?.providerKeys || {}}
                onModelChange={handleModelChange}
                onOpenSettings={() => setShowSettingsModal(true)}
              />
            </div>
          </>
        )}

        {/* Features */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2 max-w-3xl mx-auto">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>

        {/* Privacy Note */}
        <p className="text-center text-sm text-muted-foreground mt-12">
          Your API keys are stored locally in your browser and never sent to our
          servers.
        </p>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
        onSave={handleSettingsSaved}
      />
      <Toaster />
    </main>
  );
}
