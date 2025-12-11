// TCGdexSearchPage.tsx
'use client'

import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useState } from 'react'
import { fetchTCGSearch } from '@/lib/api'
// 💡 Importation des types créés dans types.ts

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TCGdexCardExtended } from '@/lib/tcgdex/types'
import { TCGCardItem } from '@/components/tcgdex/TCGCardItem'


// 💡 NOTE: L'interface TCGCardResult est maintenant TCGdexCardExtended
// Nous la ré-aliasions ici pour la simplicité, mais l'interface TCGdexCardExtended
// est utilisée pour garantir que 'pricing' est présent.

// On utilise TCGdexCardExtended (le type importé) pour les résultats
type TCGCardResult = TCGdexCardExtended;


/**
 * Reconstruit l'URL de l'asset (Logo ou Symbole) avec l'extension recommandée.
 */
const getAssetUrl = (baseUrl: string | null | undefined, extension: 'png' | 'webp' = 'webp'): string | null => {
    if (!baseUrl) return null;
    return `${baseUrl}.${extension}`;
};


export default function TCGdexSearchPage() {
    const [query, setQuery] = useState("")
    // Utilise TCGCardResult (alias de TCGdexCardExtended)
    const [results, setResults] = useState<TCGCardResult[]>([]) 
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
  
    const search = async () => {
      setLoading(true)
      setError(null)
      try {
          // fetchTCGSearch renvoie TCGCardResult[] qui inclut maintenant 'pricing'
          const cards: TCGCardResult[] = await fetchTCGSearch(query) 
          setResults(cards)
      } catch (err: any) {
          setError(`Erreur lors de la recherche: ${err.message}`)
          setResults([])
      } finally {
          setLoading(false)
      }
    }
  
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Recherche TCGdex</h1>
  
        <div className="flex gap-2">
          <Input
            placeholder="Ex: pikachu, charizard..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { 
              if (e.key === 'Enter' && query.trim() !== '') {
                search();
              }
            }}
          />
          <Button onClick={search} disabled={loading || query.trim() === ''}>
            {loading ? "Recherche..." : "Rechercher"}
          </Button>
        </div>
        
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded" role="alert">
            <p>{error}</p>
          </div>
        )}
  
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 💡 Utilisation du composant TCGCardItem importé */}
          {results.map((card) => (
              <TCGCardItem key={card.id} card={card} />
          ))}
  
          {/* Message si pas de résultats */}
          {results.length === 0 && !loading && query.trim() !== '' && !error && (
             <p className="text-center text-gray-500 col-span-full">
              Aucune carte trouvée pour "{query}".
            </p>
          )}
        </div>
      </div>
    )
  }