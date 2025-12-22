'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  Euro,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { RarityFilter, normalizeRarity } from '@/components/tcgdex/RarityFilter'
import { CMCard, CMSet } from '@/lib/cardmarket/types'
import { Button } from '../ui/button'

/* =======================
   Card Item
======================= */

const CardmarketCardItem = ({ card }: { card: CMCard }) => {
  const graded = card.prices?.graded

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-extrabold truncate group-hover:text-primary">
          {card.name}
        </CardTitle>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          {card.rarity && (
            <span className="bg-secondary px-2 py-0.5 rounded">
              {card.rarity}
            </span>
          )}
          {card.card_number && (
            <span className="font-mono">#{card.card_number}</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 flex flex-col gap-4">
        {card.image && (
          <div className="flex justify-center">
            <img
              src={card.image}
              alt={card.name}
              className="max-h-64 object-contain drop-shadow-md"
              loading="lazy"
            />
          </div>
        )}

        {/* Prix FR */}
        {card.prices?.fr && (
          <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <Euro className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                Prix Cardmarket (FR)
              </span>
            </div>
            <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
              {card.prices.fr.toFixed(2)} €
            </p>
            {card.prices.avg7 && (
              <p className="text-xs text-muted-foreground mt-1">
                Moy. 7j : {card.prices.avg7.toFixed(2)} €
              </p>
            )}
          </div>
        )}

        {/* Graded */}
        {graded && (
          <div className="space-y-2 text-xs">
            {graded.psa && (
              <div>
                <p className="font-bold flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" /> PSA
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {Object.entries(graded.psa).map(([k, v]) => (
                    <span
                      key={k}
                      className="bg-muted px-2 py-0.5 rounded font-mono"
                    >
                      {k.toUpperCase()}: {v}€
                    </span>
                  ))}
                </div>
              </div>
            )}

            {graded.bgs && (
              <div>
                <p className="font-bold">BGS</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {Object.entries(graded.bgs).map(([k, v]) => (
                    <span
                      key={k}
                      className="bg-muted px-2 py-0.5 rounded font-mono"
                    >
                      {k.toUpperCase()}: {v}€
                    </span>
                  ))}
                </div>
              </div>
            )}

            {graded.cgc && (
              <div>
                <p className="font-bold">CGC</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {Object.entries(graded.cgc).map(([k, v]) => (
                    <span
                      key={k}
                      className="bg-muted px-2 py-0.5 rounded font-mono"
                    >
                      {k.toUpperCase()}: {v}€
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-[10px] uppercase tracking-wider text-muted-foreground pt-2 border-t">
          {card.episode.name}
        </div>
      </CardContent>
    </Card>
  )
}

/* =======================
   Viewer principal
======================= */

export const CardmarketSetViewer = () => {
    const [sets, setSets] = useState<CMSet[]>([])
    const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set())
    const [selectedSet, setSelectedSet] = useState<CMSet | null>(null)
    
    // États de données et pagination
    const [cards, setCards] = useState<CMCard[]>([])
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalResults, setTotalResults] = useState(0)
    
    const [selectedRarities, setSelectedRarities] = useState<Set<string>>(new Set())
  
    /* ===== Fetch Sets ===== */
    useEffect(() => {
      fetch('/api/cardmarket/sets')
        .then(res => res.json())
        .then(data => {
          const results = Array.isArray(data) ? data : (data.data || [])
          setSets(results)
        })
    }, [])
  
    const groupedBySeries = useMemo(() => {
      const grouped: Record<string, CMSet[]> = {}
      sets.forEach(set => {
        const series = set.series?.name ?? 'Autres'
        if (!grouped[series]) grouped[series] = []
        grouped[series].push(set)
      })
      return grouped
    }, [sets])
  
    /* ===== Logique de Pagination ===== */
  
    const fetchCards = async (setId: string, page: number) => {
      setLoading(true)
      // Scroll en haut de la grille lors du changement de page
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      try {
        const res = await fetch(`/api/cardmarket/sets/${setId}/cards?page=${page}`)
        const json = await res.json()
        
        // On s'adapte à la structure { data, paging, results }
        setCards(json.data || [])
        setCurrentPage(json.paging?.current || 1)
        setTotalPages(json.paging?.total || 1)
        setTotalResults(json.results || 0)
      } catch (err) {
        console.error("Erreur pagination:", err)
      } finally {
        setLoading(false)
      }
    }
  
    const handleSelectSet = (set: CMSet) => {
      setSelectedSet(set)
      setSelectedRarities(new Set())
     fetchCards(String(set.id), 1)
    }
  
    const goToPage = (page: number) => {
      if (page < 1 || page > totalPages || !selectedSet) return
      fetchCards(String(selectedSet.id), page)
    }
    
  
    /* ===== Filtres ===== */
  
    const availableRarities = useMemo(() => {
      const s = new Set<string>()
      cards.forEach(c => c.rarity && s.add(normalizeRarity(c.rarity)))
      return Array.from(s).sort()
    }, [cards])
  
    const filteredCards = useMemo(() => {
      if (selectedRarities.size === 0) return cards
      return cards.filter(c => c.rarity && selectedRarities.has(normalizeRarity(c.rarity)))
    }, [cards, selectedRarities])
  
    return (
      <div className="space-y-6 pb-10">
        {/* Sélecteur de Séries / Sets (Identique) */}
        {Object.entries(groupedBySeries).map(([series, seriesSets]) => (
          <div key={series} className="border rounded-lg overflow-hidden bg-card shadow-sm">
            <button
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent"
              onClick={() => setExpandedSeries(prev => {
                const s = new Set(prev); s.has(series) ? s.delete(series) : s.add(series); return s;
              })}
            >
              <h2 className="font-bold text-lg">{series}</h2>
              {expandedSeries.has(series) ? <ChevronUp /> : <ChevronDown />}
            </button>
            {expandedSeries.has(series) && (
              <div className="flex gap-3 overflow-x-auto p-4 bg-muted/10">
                {seriesSets.map(set => (
                  <button
                    key={set.slug}
                    onClick={() => handleSelectSet(set)}
                    className={`w-36 p-3 border rounded-lg flex-shrink-0 transition-all ${
                      selectedSet?.id === set.id ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'bg-card'
                    }`}
                  >
                    {set.logo && <img src={set.logo} alt={set.name} className="h-12 object-contain mx-auto mb-2" />}
                    <p className="text-xs font-medium text-center line-clamp-2">{set.name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
  
        {selectedSet && <Separator />}
  
        {/* Barre de Filtres et Stats */}
        {selectedSet && !loading && (
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <RarityFilter
              availableRarities={availableRarities}
              selectedRarities={selectedRarities}
              onToggleRarity={r => setSelectedRarities(prev => {
                const s = new Set(prev); s.has(r) ? s.delete(r) : s.add(r); return s;
              })}
              onClearAll={() => setSelectedRarities(new Set())}
              totalCards={totalResults}
              filteredCount={filteredCards.length}
            />
            <div className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
              Page {currentPage} sur {totalPages}
            </div>
          </div>
        )}
  
        {/* Grille de Cartes */}
        {loading ? (
          <div className="flex flex-col items-center py-20"><Loader2 className="w-10 h-10 animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCards.map(card => (
              <CardmarketCardItem key={card.id} card={card} />
            ))}
          </div>
        )}
  
        {/* NAVIGATION DE PAGINATION */}
        {selectedSet && totalPages > 1 && !loading && (
          <div className="flex flex-col items-center gap-4 pt-10 border-t mt-10">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
  
              {/* Affichage intelligent des numéros de page */}
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  // On affiche la 1ere, la dernière, et les pages autour de la courante
                  if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "ghost"}
                        size="sm"
                        className="w-10"
                        onClick={() => goToPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <span key={pageNum} className="px-1">...</span>;
                  }
                  return null;
                })}
              </div>
  
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Affichage des résultats {(currentPage - 1) * 20 + 1} à {Math.min(currentPage * 20, totalResults)} sur {totalResults}
            </p>
          </div>
        )}
      </div>
    )
  }
