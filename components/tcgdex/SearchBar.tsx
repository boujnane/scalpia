'use client'
import { useState, memo } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2 } from "lucide-react"

interface SearchBarProps {
  query: string
  setQuery: (q: string) => void
  onSearch: () => void
  loading: boolean
  placeholder?: string
}

// On utilise memo pour empêcher le rerender inutile
export const SearchBar = memo(({ query, setQuery, onSearch, loading, placeholder }: SearchBarProps) => {
  return (
    <div className="flex gap-3">
      <div className="relative flex-grow">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          className="pl-12 h-14 text-lg shadow-sm focus-visible:ring-2 focus-visible:ring-primary/50 border-border/50"
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)} // juste mettre à jour l'état local
          onKeyDown={e => {
            if (e.key === 'Enter') {
              onSearch() // recherche uniquement sur Enter
            }
          }}
        />
      </div>
      <Button 
        onClick={onSearch} 
        disabled={loading || !query.trim()}
        size="lg"
        className="h-14 px-8 font-bold shadow-lg hover:shadow-xl transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Recherche...
          </>
        ) : (
          <>
            <Search className="mr-2 h-5 w-5" />
            Rechercher
          </>
        )}
      </Button>
    </div>
  )
})
