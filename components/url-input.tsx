"use client"

import type React from "react"

import { useState } from "react"
import { LinkIcon, ChefHat, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface UrlInputProps {
  onSubmit: (url: string) => void
  isLoading?: boolean
}

export function UrlInput({ onSubmit, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      onSubmit(url.trim())
    }
  }

  const isValidUrl = (str: string) => {
    try {
      new URL(str)
      return true
    } catch {
      return false
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
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
      {url && !isValidUrl(url) && <p className="text-sm text-destructive mt-2">Please enter a valid URL</p>}
    </form>
  )
}
