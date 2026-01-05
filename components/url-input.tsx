"use client";

import type React from "react";

import { useState } from "react";
import { LinkIcon, ChefHat, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
  url?: string;
  onUrlChange?: (url: string) => void;
}

export function UrlInput({
  onSubmit,
  isLoading,
  url: controlledUrl,
  onUrlChange,
}: UrlInputProps) {
  const [internalUrl, setInternalUrl] = useState("");
  const url = controlledUrl !== undefined ? controlledUrl : internalUrl;
  const setUrl = onUrlChange || setInternalUrl;
  const urlInputId = "recipe-url";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      if (!url.startsWith("http")) {
        onSubmit("https://" + url.trim());
      } else {
        onSubmit(url.trim());
      }
    }
  };

  const isValidUrl = (str: string) => {
    try {
      if (!str.startsWith("http")) {
        str = "https://" + str;
      }
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Label htmlFor={urlInputId} className="sr-only">
            Recipe URL
          </Label>
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id={urlInputId}
            type="url"
            placeholder="Paste recipe URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-10 h-12 text-base"
            disabled={isLoading}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={!url.trim() || !isValidUrl(url) || isLoading}
          className="h-12 px-6 gap-2"
        >
          {isLoading ? (
            <>
              <ChefHat className="size-4 animate-bounce" />
              Cooking...
            </>
          ) : (
            <>
              Get Recipe
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>
      {url && !isValidUrl(url) && (
        <p className="text-sm text-destructive mt-2">
          Please enter a valid URL
        </p>
      )}
    </form>
  );
}
