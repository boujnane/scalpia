'use client'

import { useState } from 'react'
import { fetchTCGSearch } from '@/lib/api'
import { TCGdexCardExtended } from '@/lib/tcgdex/types'
import { TCGCardItem } from '@/components/tcgdex/TCGCardItem'
import { PPTSetViewer } from '@/components/tcgdex/PPTSetViewer'
import { SearchBar } from '@/components/tcgdex/SearchBar'
import { Grid3x3, Package, Loader2, AlertCircle } from 'lucide-react'

type TCGCardResult = TCGdexCardExtended
type SearchMode = 'cards' | 'sets'

export default function TCGdexExplorerPage() {
  const [mode, setMode] = useState<SearchMode>('cards')
  const [query, setQuery] = useState('')

  const [cards, setCards] = useState<TCGCardResult[]>([])
  const [cardLoading, setCardLoading] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)

  const isLoading = cardLoading
  const error = cardError

  // Recherche de cartes
  const searchCards = async () => {
    if (!query.trim()) return
    setCardLoading(true)
    setCardError(null)
    setCards([])
    try {
      const results: TCGCardResult[] = await fetchTCGSearch(query)
      setCards(results)
      if (results.length === 0) setCardError('Aucune carte trouvée')
    } catch (err: any) {
      setCardError(`Erreur: ${err.message}`)
      setCards([])
    } finally {
      setCardLoading(false)
    }
  }

  const handleSearch = () => {
    if (mode === 'cards') searchCards()
    // Le mode 'sets' est géré directement par PPTSetViewer
  }

  const handleModeChange = (newMode: SearchMode) => {
    setMode(newMode)
    setQuery('')
    setCards([])
    setCardError(null)
  }

  const placeholder = mode === 'cards'
    ? 'Rechercher une carte (ex: Pikachu, Pikachu 238...)'
    : 'Rechercher un set (ex: Darkness Ablaze, Scarlet & Violet...)'

  const hasResults = cards.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="p-6 max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col items-center space-y-3 text-center pt-8 pb-4">
          <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            TCGdex Explorer
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg">
            Explorez l'univers Pokémon TCG : recherchez des cartes ou explorez les sets avec prix
          </p>
        </div>

        {/* Recherche */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-card rounded-2xl shadow-xl border border-border/50 p-6 space-y-6">
            {/* Mode */}
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

            {/* SearchBar */}
            {mode === 'cards' && (
              <SearchBar 
                query={query} 
                setQuery={setQuery} 
                onSearch={handleSearch} 
                loading={isLoading} 
                placeholder={placeholder}
              />
            )}
          </div>
        </div>

        {/* Erreurs */}
        {error && (
          <div className="max-w-2xl mx-auto p-5 bg-destructive/10 border-2 border-destructive/30 text-destructive rounded-xl flex items-center justify-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Résultats cartes */}
        {hasResults && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cards.map(card => <TCGCardItem key={card.id} card={card} />)}
            </div>
          </div>
        )}

        {/* Résultats sets PPT */}
        {mode === 'sets' && <PPTSetViewer />}

      </div>
    </div>
  )
}
