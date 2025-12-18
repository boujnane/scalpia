'use client'
import { useEffect, useState } from 'react'
import { Loader2, ChevronDown, ChevronUp, DollarSign, MapPin } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

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
  
  // Liste des URLs à essayer dans l'ordre de priorité
  const imageUrls = [
    set.imageCdnUrl800,
    set.imageCdnUrl400,
    set.imageCdnUrl200,
    set.imageCdnUrl,
    set.imageUrl
  ].filter(Boolean) // Enlever les valeurs undefined/null
  
  const handleError = () => {
    // Passer à l'URL suivante si disponible
    if (currentUrlIndex < imageUrls.length - 1) {
      setCurrentUrlIndex(currentUrlIndex + 1)
    }
  }
  
  // Réinitialiser l'index quand le set change
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

const PPTCardItem = ({ card }: { card: PPTCard }) => {
  const holofoil = card.prices?.variants?.Holofoil

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
        {/* Logo du set */}
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
            <img src={card.imageUrl} alt={card.name} className="rounded z-10 max-h-64 object-contain drop-shadow-md group-hover:drop-shadow-2xl transition-all" loading="lazy" />
          </div>
        )}

        {card.prices?.market != null && (
          <div className="text-sm mb-2">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="font-bold">Marché:</span>
            </div>
            <p className="text-xs">{card.prices.market.toFixed(2)} $</p>
            {card.prices.lastUpdated && <p className="text-[10px] text-muted-foreground mt-1">MAJ: {new Date(card.prices.lastUpdated).toLocaleDateString('fr-FR')}</p>}
          </div>
        )}

        {holofoil && (
          <div className="text-sm mt-2">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-blue-500" />
              <span className="font-bold">Holofoil</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(holofoil).map(([condition, data]) => (
                <div key={condition} className="flex justify-between bg-background p-1.5 rounded border border-border text-xs">
                  <span>{condition}</span>
                  <span>${data.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs grid grid-cols-2 gap-y-1 text-muted-foreground mt-2">
          {card.hp && <p className="flex items-center"><span className="font-bold mr-1">PV:</span>{card.hp}</p>}
          {card.types?.length && <p className="col-span-2"><span className="font-bold">Types:</span> {card.types.join(', ')}</p>}
          {card.artist && <p className="col-span-2 truncate"><span className="font-bold">Art:</span> {card.artist}</p>}
        </div>

        {/* Set info */}
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





export const PPTSetViewer = () => {
  const [sets, setSets] = useState<PPTSet[]>([])
  const [groupedSets, setGroupedSets] = useState<GroupedSets>({})
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set())
  const [selectedSet, setSelectedSet] = useState<PPTSet | null>(null)
  const [cards, setCards] = useState<PPTCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Charger les sets
  useEffect(() => {
    const fetchSets = async () => {
      try {
        const res = await fetch('/api/ppt/sets')
        if (!res.ok) throw new Error('Failed to fetch sets')
        const data = await res.json()
        setSets(data)

        // Grouper par série
        const grouped: GroupedSets = {}

        data.forEach((set: PPTSet) => {
          const series = normalizeSeries(set)
        
          if (!grouped[series]) {
            grouped[series] = []
          }
        
          grouped[series].push(set)
        })
        setGroupedSets(grouped)

        // Expand first series by default
        const firstSeries = Object.keys(grouped)[0]
        if (firstSeries) {
          setExpandedSeries(new Set([firstSeries]))
        }
      } catch (err: any) {
        setError(err.message)
      }
    }
    fetchSets()
  }, [])

  // Charger les cartes d'un set
  const handleSelectSet = async (set: PPTSet) => {
    setSelectedSet(set)
    setLoading(true)
    setError(null)
    setCards([])
    try {
      const res = await fetch(`/api/ppt/cards?setId=${set.tcgPlayerId}`)
      if (!res.ok) throw new Error('Failed to fetch cards')
      const data = await res.json()
      setCards(data)
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

  if (error) return <div className="p-4 text-red-500">{error}</div>

  return (
    <div className="space-y-6">
      {/* Groupes de séries */}
      <div className="space-y-4">
        {Object.entries(groupedSets)
          .sort(([a], [b]) => b.localeCompare(a)) // Trier par série (plus récent en premier)
          .map(([series, seriesSets]) => (
            <div key={series} className="border rounded-lg overflow-hidden bg-card">
              {/* Header de série */}
              <button
                onClick={() => toggleSeries(series)}
                className="w-full p-4 flex items-center justify-between hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Image de la série (premier set) */}
                  {seriesSets[0] && (
                    <ImageWithFallback 
                      set={seriesSets[0]}
                      className="w-12 h-12 object-contain rounded"
                      alt={series}
                    />
                  )}
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold">{series}</h2>
                    <span className="text-sm text-muted-foreground">({seriesSets.length} sets)</span>
                  </div>
                </div>
                {expandedSeries.has(series) ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {/* Sets de la série */}
              {expandedSeries.has(series) && (
                <div className="p-4 pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {seriesSets.map((set) => (
                      <button
                        key={set.id}
                        className={`p-3 border-2 rounded-lg hover:border-primary hover:shadow-lg transition-all flex flex-col items-center gap-2 ${
                          selectedSet?.id === set.id ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                        onClick={() => handleSelectSet(set)}
                      >
                        <ImageWithFallback 
                          set={set}
                          className="w-full h-16 object-contain"
                        />
                        <span className="text-sm font-medium text-center line-clamp-2">
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

      <Separator className="my-8" />

      {/* Cartes du set */}
      {loading && (
        <div className="flex flex-col items-center gap-2 py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement des cartes...</p>
        </div>
      )}

      {selectedSet && !loading && cards.length > 0 && (
        <div>
          <div className="flex items-center gap-4 mb-6">
            <ImageWithFallback 
              set={selectedSet}
              className="h-16 object-contain"
            />
            <div>
              <h2 className="text-2xl font-bold">{selectedSet.name}</h2>
              <p className="text-muted-foreground">{cards.length} cartes</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cards.map((card) => (
              <PPTCardItem key={card.id} card={card} />
            ))}
          </div>
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