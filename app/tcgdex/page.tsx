'use client'

import { useState } from 'react'
import { fetchTCGSearch, fetchTCGSets } from '@/lib/api'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TCGdexCardExtended } from '@/lib/tcgdex/types'
import { TCGCardItem } from '@/components/tcgdex/TCGCardItem'
import { TCGSetViewer } from '@/components/tcgdex/TCGSetViewer'
import { Search, Loader2, AlertCircle, Grid3x3, Package } from 'lucide-react'
import { SearchBar } from '@/components/tcgdex/SearchBar'

type TCGCardResult = TCGdexCardExtended
type SearchMode = 'cards' | 'sets'

export default function TCGdexExplorerPage() {
  const [mode, setMode] = useState<SearchMode>('cards')
  const [query, setQuery] = useState('')
  
  // États pour les cartes
  const [cards, setCards] = useState<TCGCardResult[]>([])
  const [cardLoading, setCardLoading] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)

  // États pour les sets
  const [setId, setSetId] = useState<string | null>(null)
  const [setLoading, setSetLoading] = useState(false)
  const [setError, setSetError] = useState<string | null>(null)

  const isLoading = cardLoading || setLoading
  const error = cardError || setError

  // Recherche de cartes
  const searchCards = async () => {
    if (!query.trim()) return
    setCardLoading(true)
    setCardError(null)
    setCards([])
    setSetId(null)
    try {
      const results: TCGCardResult[] = await fetchTCGSearch(query)
      setCards(results)
      if (results.length === 0) {
        setCardError('Aucune carte trouvée')
      }
    } catch (err: any) {
      setCardError(`Erreur: ${err.message}`)
      setCards([])
    } finally {
      setCardLoading(false)
    }
  }

  // Recherche de sets
  const searchSet = async () => {
    if (!query.trim()) return
    setSetLoading(true)
    setSetError(null)
    setSetId(null)
    setCards([])
    try {
      const sets = await fetchTCGSets()
      const found = sets.find(s => s.name.toLowerCase().includes(query.toLowerCase()))
      if (!found) {
        setSetError(`Aucun set trouvé pour "${query}"`)
        return
      }
      setSetId(found.id)
    } catch (err: any) {
      setSetError(`Erreur: ${err.message}`)
    } finally {
      setSetLoading(false)
    }
  }

  const handleSearch = () => {
    if (mode === 'cards') {
      searchCards()
    } else {
      searchSet()
    }
  }

  const handleModeChange = (newMode: SearchMode) => {
    setMode(newMode)
    setQuery('')
    setCards([])
    setSetId(null)
    setCardError(null)
    setSetError(null)
  }

  const placeholder = mode === 'cards' 
    ? 'Rechercher une carte (ex: Pikachu, Charizard...)'
    : 'Rechercher un set (ex: Darkness Ablaze, Scarlet & Violet...)'

  const hasResults = cards.length > 0 || setId !== null

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        
        {/* En-tête */}
        <div className="flex flex-col items-center space-y-3 text-center pt-8 pb-4">
          <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            TCGdex Explorer
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg">
            Explorez l'univers Pokémon TCG : recherchez des cartes, analysez les prix et découvrez des sets complets
          </p>
        </div>

        {/* Zone de recherche centrale */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-card rounded-2xl shadow-xl border border-border/50 p-6 space-y-6">
            
            {/* Sélecteur de mode */}
            <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
              <button
                onClick={() => handleModeChange('cards')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all ${
                  mode === 'cards'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
                Cartes
              </button>
              <button
                onClick={() => handleModeChange('sets')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all ${
                  mode === 'sets'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Package className="w-5 h-5" />
                Sets
              </button>
            </div>

            <SearchBar 
              query={query} 
              setQuery={setQuery} 
              onSearch={handleSearch} 
              loading={isLoading} 
              placeholder={placeholder}
            />
            {/* Message d'information */}
            {!hasResults && !error && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                {mode === 'cards' 
                  ? '💡 Recherchez vos cartes Pokémon préférées par nom'
                  : '📦 Explorez les sets complets avec toutes leurs cartes'
                }
              </div>
            )}
          </div>
        </div>

        {/* Affichage des erreurs */}
        {error && (
          <div className="max-w-2xl mx-auto p-5 bg-destructive/10 border-2 border-destructive/30 text-destructive rounded-xl flex items-center justify-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Résultats */}
        {hasResults && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Grille de cartes */}
            {cards.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">
                    {cards.length} carte{cards.length > 1 ? 's' : ''} trouvée{cards.length > 1 ? 's' : ''}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {cards.map(card => <TCGCardItem key={card.id} card={card} />)}
                </div>
              </div>
            )}

            {/* Visualiseur de set */}
            {setId && <TCGSetViewer setId={setId} />}
          </div>
        )}

      </div>
    </div>
  )
}