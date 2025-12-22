// components/tcgdex/PPTSetViewer.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import { Loader2, ChevronDown, ChevronUp, DollarSign, MapPin } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RarityFilter, normalizeRarity } from './RarityFilter'

// Types
interface PPTSet {
  id: string
  name: string
  tcgPlayerId: string
  imageUrl?: string
  imageCdnUrl?: string
  imageCdnUrl200?: string
  imageCdnUrl400?: string
  imageCdnUrl800?: string
  series?: string
}

interface PPTCard {
  id: string
  name: string
  rarity?: string
  cardType?: string
  hp?: number
  imageUrl?: string
  types?: string[]
  artist?: string
  localId?: string
  set?: { name?: string; symbol?: string }
  prices?: {
    market?: number
    lastUpdated?: string
    variants?: Record<string, Record<string, { price: number; priceString: string }>>
  }
}

interface GroupedSets {
  [series: string]: PPTSet[]
}

// Cache simple côté client
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

const getFromCache = (key: string) => {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return entry.data
}

const setInCache = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() })
}

// Composant d'image avec fallback
const ImageWithFallback = ({ 
  set, 
  className = "", 
  alt = "" 
}: { 
  set: PPTSet
  className?: string
  alt?: string
}) => {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0)
  
  const imageUrls = [
    set.imageCdnUrl800,
    set.imageCdnUrl400,
    set.imageCdnUrl200,
    set.imageCdnUrl,
    set.imageUrl
  ].filter(Boolean)
  
  const handleError = () => {
    if (currentUrlIndex < imageUrls.length - 1) {
      setCurrentUrlIndex(currentUrlIndex + 1)
    }
  }
  
  useEffect(() => {
    setCurrentUrlIndex(0)
  }, [set.id])
  
  if (imageUrls.length === 0 || !imageUrls[currentUrlIndex]) {
    return null
  }
  
  return (
    <img 
      src={imageUrls[currentUrlIndex]} 
      alt={alt || set.name}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  )
}

// Composant carte individuelle
const PPTCardItem = ({ card }: { card: PPTCard }) => {
  // Extraire les différentes variantes de prix
  const holofoil = card.prices?.variants?.Holofoil
  const normal = card.prices?.variants?.Normal
  const reverseHolofoil = card.prices?.variants?.['Reverse Holofoil']
  const firstEdition = card.prices?.variants?.['1st Edition Holofoil']

  // Prix market (TCGPlayer market price)
  const marketPrice = card.prices?.market

  return (
    <Card className="group overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/50 cursor-pointer bg-card">
      <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start space-x-2">
        <div className="overflow-hidden flex-1">
          <CardTitle className="text-lg truncate font-extrabold text-primary group-hover:text-indigo-500 transition-colors">
            {card.name}
          </CardTitle>
          <p className="text-xs text-muted-foreground font-medium mt-1 flex items-center gap-2">
            {card.rarity && <span className="bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">{card.rarity}</span>}
            {card.cardType && <span>{card.cardType}</span>}
          </p>
        </div>
        {card.set?.symbol && (
          <img 
            src={card.set.symbol} 
            alt={card.set.name || 'Set logo'} 
            className="w-8 h-8 object-contain opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0"
            loading="lazy"
          />
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-4 p-4 pt-2 flex-grow">
        {card.imageUrl && (
          <div className="flex justify-center items-center py-2 relative">
            <img 
              src={card.imageUrl} 
              alt={card.name} 
              className="rounded z-10 max-h-64 object-contain drop-shadow-md group-hover:drop-shadow-2xl transition-all" 
              loading="lazy" 
            />
          </div>
        )}

        {/* Prix Market TCGPlayer */}
        {marketPrice != null && marketPrice > 0 && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-sm text-emerald-700 dark:text-emerald-300">Prix Marché (TCGPlayer)</span>
            </div>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">${marketPrice.toFixed(2)}</p>
            {card.prices?.lastUpdated && (
              <p className="text-[10px] text-muted-foreground mt-1">
                MAJ: {new Date(card.prices.lastUpdated).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        )}

        {/* Variantes de prix - Affichage conditionnel */}
        <div className="space-y-3">
          {/* Normal */}
          {normal && Object.keys(normal).length > 0 && (
            <div className="text-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-xs uppercase tracking-wide">Normal</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(normal).map(([condition, data]) => (
                  <div key={condition} className="flex justify-between bg-muted/50 p-1.5 rounded border border-border">
                    <span className="text-muted-foreground">{condition}</span>
                    <span className="font-semibold">${data.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Holofoil */}
          {holofoil && Object.keys(holofoil).length > 0 && (
            <div className="text-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-xs uppercase tracking-wide text-purple-600 dark:text-purple-400">💎 Holofoil</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(holofoil).map(([condition, data]) => (
                  <div key={condition} className="flex justify-between bg-purple-50 dark:bg-purple-950/30 p-1.5 rounded border border-purple-200 dark:border-purple-800">
                    <span className="text-muted-foreground">{condition}</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">${data.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reverse Holofoil */}
          {reverseHolofoil && Object.keys(reverseHolofoil).length > 0 && (
            <div className="text-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-xs uppercase tracking-wide text-blue-600 dark:text-blue-400">🔄 Reverse Holo</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(reverseHolofoil).map(([condition, data]) => (
                  <div key={condition} className="flex justify-between bg-blue-50 dark:bg-blue-950/30 p-1.5 rounded border border-blue-200 dark:border-blue-800">
                    <span className="text-muted-foreground">{condition}</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">${data.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 1st Edition */}
          {firstEdition && Object.keys(firstEdition).length > 0 && (
            <div className="text-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-xs uppercase tracking-wide text-amber-600 dark:text-amber-400">⭐ 1st Edition</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(firstEdition).map(([condition, data]) => (
                  <div key={condition} className="flex justify-between bg-amber-50 dark:bg-amber-950/30 p-1.5 rounded border border-amber-200 dark:border-amber-800">
                    <span className="text-muted-foreground">{condition}</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">${data.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="text-xs grid grid-cols-2 gap-y-1 text-muted-foreground mt-2">
          {card.hp && <p className="flex items-center"><span className="font-bold mr-1">PV:</span>{card.hp}</p>}
          {card.types?.length && <p className="col-span-2"><span className="font-bold">Types:</span> {card.types.join(', ')}</p>}
          {card.artist && <p className="col-span-2 truncate"><span className="font-bold">Art:</span> {card.artist}</p>}
        </div>

        {card.set?.name && (
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mt-3 pt-2 border-t flex justify-between items-center">
            <span className="flex items-center gap-1 font-bold text-primary/80">
              <MapPin className="w-3 h-3"/> {card.set.name}
            </span>
            {card.localId && <span className="font-mono bg-muted px-1 rounded">#{card.localId}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Règles de normalisation des séries
const SERIES_RULES: [string, string][] = [
  ['sv', 'Scarlet & Violet'],
  ['swsh', 'Sword & Shield'],
  ['shining', 'Sword & Shield'],
  ['sm', 'Sun & Moon'],
  ['me', 'Mega Evolution'],
  ['xy', 'XY'],
]

const normalizeSeries = (set: PPTSet): string => {
  const id = set.tcgPlayerId.toLowerCase()

  for (const [prefix, series] of SERIES_RULES) {
    if (id.startsWith(prefix)) return series
  }

  if (set.series && !['other', 'others'].includes(set.series.toLowerCase())) {
    return set.series
  }

  return 'Autres'
}

// Composant principal
export const PPTSetViewer = () => {
  const [sets, setSets] = useState<PPTSet[]>([])
  const [groupedSets, setGroupedSets] = useState<GroupedSets>({})
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set())
  const [selectedSet, setSelectedSet] = useState<PPTSet | null>(null)
  const [cards, setCards] = useState<PPTCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRarities, setSelectedRarities] = useState<Set<string>>(new Set())

  // Extraire les raretés disponibles avec normalisation
  const availableRarities = useMemo(() => {
    const rarities = new Set<string>()
    cards.forEach(card => {
      if (card.rarity) {
        const normalized = normalizeRarity(card.rarity)
        rarities.add(normalized)
      }
    })
    return Array.from(rarities).sort()
  }, [cards])

  // Filtrer les cartes par rareté avec normalisation
  const filteredCards = useMemo(() => {
    if (selectedRarities.size === 0) return cards
    return cards.filter(card => {
      if (!card.rarity) return false
      const normalized = normalizeRarity(card.rarity)
      return selectedRarities.has(normalized)
    })
  }, [cards, selectedRarities])

  // Charger les sets avec cache
  useEffect(() => {
    const fetchSets = async () => {
      // Vérifier le cache
      const cached = getFromCache('sets')
      if (cached) {
        console.log('✅ Sets chargés depuis le cache')
        setSets(cached)
        groupSetsBySeries(cached)
        return
      }

      try {
        console.log('🌐 Chargement des sets depuis l\'API...')
        const res = await fetch('/api/ppt/sets')
        if (!res.ok) throw new Error('Failed to fetch sets')
        const data = await res.json()
        setSets(data)
        setInCache('sets', data)
        groupSetsBySeries(data)
      } catch (err: any) {
        setError(err.message)
      }
    }

    const groupSetsBySeries = (setsData: PPTSet[]) => {
      const grouped: GroupedSets = {}
      setsData.forEach((set: PPTSet) => {
        const series = normalizeSeries(set)
        if (!grouped[series]) grouped[series] = []
        grouped[series].push(set)
      })
      setGroupedSets(grouped)

      // Expand la première série par défaut
      const firstSeries = Object.keys(grouped)[0]
      if (firstSeries) {
        setExpandedSeries(new Set([firstSeries]))
      }
    }

    fetchSets()
  }, [])

  // Charger les cartes d'un set avec cache
  const handleSelectSet = async (set: PPTSet) => {
    setSelectedSet(set)
    setSelectedRarities(new Set()) // Reset des filtres

    // Vérifier le cache
    const cacheKey = `cards:${set.tcgPlayerId}`
    const cached = getFromCache(cacheKey)
    if (cached) {
      console.log(`✅ Cartes du set ${set.name} chargées depuis le cache`)
      setCards(cached)
      return
    }

    setLoading(true)
    setError(null)
    setCards([])
    try {
      console.log(`🌐 Chargement des cartes du set ${set.name} depuis l'API...`)
      const res = await fetch(`/api/ppt/cards?setId=${set.tcgPlayerId}`)
      if (!res.ok) throw new Error('Failed to fetch cards')
      const data = await res.json()
      setCards(data)
      setInCache(cacheKey, data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleSeries = (series: string) => {
    setExpandedSeries(prev => {
      const newSet = new Set(prev)
      if (newSet.has(series)) {
        newSet.delete(series)
      } else {
        newSet.add(series)
      }
      return newSet
    })
  }

  const toggleRarity = (rarity: string) => {
    setSelectedRarities(prev => {
      const newSet = new Set(prev)
      if (newSet.has(rarity)) {
        newSet.delete(rarity)
      } else {
        newSet.add(rarity)
      }
      return newSet
    })
  }

  const clearAllFilters = () => {
    setSelectedRarities(new Set())
  }

  if (error) return <div className="p-4 text-red-500">{error}</div>

  return (
    <div className="space-y-6">
      {/* Groupes de séries - Version compacte */}
      <div className="space-y-3">
        {Object.entries(groupedSets)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([series, seriesSets]) => (
            <div key={series} className="border rounded-lg overflow-hidden bg-card/50 backdrop-blur-sm">
              {/* Header de série - Plus compact */}
              <button
                onClick={() => toggleSeries(series)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  {seriesSets[0] && (
                    <ImageWithFallback 
                      set={seriesSets[0]}
                      className="w-10 h-10 object-contain rounded"
                      alt={series}
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">{series}</h2>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                      {seriesSets.length}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {expandedSeries.has(series) && (
                    <span className="text-xs text-muted-foreground">Scroll →</span>
                  )}
                  {expandedSeries.has(series) ? (
                    <ChevronUp className="w-4 h-4 transition-transform group-hover:scale-110" />
                  ) : (
                    <ChevronDown className="w-4 h-4 transition-transform group-hover:scale-110" />
                  )}
                </div>
              </button>

              {/* Sets de la série - Scroll horizontal */}
              {expandedSeries.has(series) && (
                <div className="px-4 pb-4">
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                    {seriesSets.map((set) => (
                      <button
                        key={set.id}
                        className={`flex-shrink-0 w-32 p-3 border-2 rounded-lg transition-all flex flex-col items-center gap-2 hover:scale-105 ${
                          selectedSet?.id === set.id 
                            ? 'border-primary bg-primary/10 shadow-lg scale-105' 
                            : 'border-border hover:border-primary/50 hover:shadow-md'
                        }`}
                        onClick={() => handleSelectSet(set)}
                      >
                        <ImageWithFallback 
                          set={set}
                          className="w-full h-14 object-contain"
                        />
                        <span className="text-xs font-medium text-center line-clamp-2 leading-tight">
                          {set.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Séparateur visible seulement si un set est sélectionné */}
      {selectedSet && <Separator className="my-6" />}

      {/* Filtres de rareté */}
      {selectedSet && !loading && availableRarities.length > 0 && (
        <RarityFilter
          availableRarities={availableRarities}
          selectedRarities={selectedRarities}
          onToggleRarity={toggleRarity}
          onClearAll={clearAllFilters}
          totalCards={cards.length}
          filteredCount={filteredCards.length}
        />
      )}

      {/* Cartes du set */}
      {loading && (
        <div className="flex flex-col items-center gap-2 py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement des cartes...</p>
        </div>
      )}

      {selectedSet && !loading && filteredCards.length > 0 && (
        <div>
          <div className="flex items-center gap-4 mb-6">
            <ImageWithFallback 
              set={selectedSet}
              className="h-16 object-contain"
            />
            <div>
              <h2 className="text-2xl font-bold">{selectedSet.name}</h2>
              <p className="text-muted-foreground">
                {filteredCards.length} carte{filteredCards.length > 1 ? 's' : ''}
                {selectedRarities.size > 0 && ` (${cards.length} au total)`}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCards.map((card) => (
              <PPTCardItem key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}

      {selectedSet && !loading && filteredCards.length === 0 && cards.length > 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Aucune carte ne correspond aux filtres sélectionnés
        </div>
      )}

      {selectedSet && !loading && cards.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Aucune carte trouvée pour ce set
        </div>
      )}
    </div>
  )
}