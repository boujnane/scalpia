'use client'

import { useState } from 'react'
import { fetchTCGSearch } from '@/lib/api'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TCGdexCardExtended } from '@/lib/tcgdex/types'
import { TCGCardItem } from '@/components/tcgdex/TCGCardItem'
import { Search, Loader2, AlertCircle } from 'lucide-react'

type TCGCardResult = TCGdexCardExtended;

export default function TCGdexSearchPage() {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<TCGCardResult[]>([]) 
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
  
    const search = async () => {
      if (!query.trim()) return;
      setLoading(true)
      setError(null)
      try {
          const cards: TCGCardResult[] = await fetchTCGSearch(query) 
          setResults(cards)
      } catch (err: any) {
          setError(`Oups ! ${err.message}`)
          setResults([])
      } finally {
          setLoading(false)
      }
    }
  
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen">
        {/* En-tête avec Branding */}
        <div className="flex flex-col items-center space-y-2 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-primary">
                TCG<span className="text-foreground">dex</span> Explorer
            </h1>
            <p className="text-muted-foreground max-w-lg">
                Analysez les prix du marché et trouvez les meilleures cartes pour votre collection.
            </p>
        </div>
  
        {/* Barre de recherche */}
        <div className="flex gap-3 max-w-xl mx-auto relative">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 h-12 text-lg shadow-sm focus-visible:ring-primary/50"
              placeholder="Rechercher (ex: Pikachu, Charizard...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { 
                if (e.key === 'Enter') search();
              }}
            />
          </div>
          <Button 
            onClick={search} 
            disabled={loading || !query.trim()}
            size="lg"
            className="h-12 px-6 font-bold shadow-md hover:shadow-lg transition-all"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Rechercher"}
          </Button>
        </div>
        
        {/* Gestion d'erreur stylisée */}
        {error && (
          <div className="p-4 bg-destructive/15 border border-destructive/20 text-destructive rounded-lg flex items-center justify-center max-w-xl mx-auto animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 mr-2" />
            <p className="font-medium">{error}</p>
          </div>
        )}
  
        {/* Grille de résultats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
          {results.map((card) => (
              <TCGCardItem key={card.id} card={card} />
          ))}
  
          {/* État vide */}
          {results.length === 0 && !loading && query.trim() !== '' && !error && (
             <div className="col-span-full py-12 text-center text-muted-foreground">
                <p className="text-lg">Aucune carte trouvée pour "<span className="text-foreground font-bold">{query}</span>".</p>
                <p className="text-sm">Essayez avec le nom anglais si le français ne donne rien.</p>
            </div>
          )}
        </div>
      </div>
    )
  }