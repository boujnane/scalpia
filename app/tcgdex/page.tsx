'use client'

import { useEffect, useMemo, useState } from 'react'

/* =======================
   Icons & UI Assets
======================= */
const ChevronDown = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
const ChevronUp = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
const ArrowLeft = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7 7-7M8 12h13" /></svg>
const SearchIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
const XIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
const FilterIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
const ExternalLink = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>

/* =======================a
   Types
======================= */
interface CMCard {
  id: number
  name: string
  rarity?: string
  card_number?: string
  image?: string
  prices?: {
    fr?: number
    avg7?: number
  }
  episode: { name: string }
  cardmarket_url?: string
  tcggo_url?: string
}

interface CMSet {
  id: number
  name: string
  slug: string
  logo?: string
  series?: { name: string }
}

/* =======================
   Helpers
======================= */
// Fonction sécurisée : gère le null/undefined et nettoie la string
const normalizeRarity = (rarity?: string) => {
  if (!rarity) return ''
  return rarity.trim().toLowerCase()
}

/* =======================
   Sub-Components
======================= */

const CardGridItem = ({ card, onClick }: { card: CMCard; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="group relative flex flex-col bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-blue-400 transition-all text-left w-full h-full"
  >
    <div className="relative aspect-[2/3] w-full bg-slate-100 dark:bg-slate-900 p-2 flex items-center justify-center overflow-hidden">
      {card.image ? (
        <img 
          src={card.image} 
          alt={card.name} 
          loading="lazy"
          className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-300" 
        />
      ) : (
        <span className="text-4xl">🃏</span>
      )}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
        Voir détails
      </div>
    </div>
    
    <div className="p-3 flex-1 flex flex-col justify-between">
      <div>
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-1" title={card.name}>
          {card.name}
        </h3>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {card.rarity && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium truncate max-w-[100px]">
              {card.rarity}
            </span>
          )}
          <span className="text-[10px] text-slate-500 font-mono">#{card.card_number}</span>
        </div>
      </div>
      
      {(card.prices?.avg7 || card.prices?.fr) && (
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Prix moyen</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {card.prices?.avg7 ? `${card.prices.avg7.toFixed(2)} €` : 'N/A'}
            </span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Meilleur cardmarket FR</span>
            <span className="font-bold text-green-600 dark:text-green-400">
              {card.prices?.fr ? `${card.prices.fr.toFixed(2)} €` : 'N/A'}
            </span>
          </div>
        </div>
      )}
    </div>
  </button>
)

const CardDetailModal = ({ card: initialCard, onClose }: { card: CMCard; onClose: () => void }) => {
  // On utilise un état local pour la carte afin de pouvoir ajouter l'URL scrapée
  const [card, setCard] = useState<CMCard>(initialCard)
  const [isScraping, setIsScraping] = useState(false)

  useEffect(() => {
    // Bloquer le scroll
    document.body.style.overflow = 'hidden'
    
    // Si on n'a pas encore l'URL Cardmarket, on va la chercher sur notre API
    const fetchFullDetails = async () => {
      if (!initialCard.cardmarket_url) {
        setIsScraping(true)
        try {
          const res = await fetch(`/api/cardmarket/cards/${initialCard.id}`)
          if (res.ok) {
            const data = await res.json()
            if (data.cardmarket_url) {
              // On ajoute le paramètre de langue à l'URL récupérée
              const urlWithLang = data.cardmarket_url.includes('?') 
                ? `${data.cardmarket_url}&language=2` 
                : `${data.cardmarket_url}?language=2`
              
              setCard(prev => ({ ...prev, cardmarket_url: urlWithLang }))
            }
          }
        } catch (err) {
          console.error("Erreur scraping:", err)
        } finally {
          setIsScraping(false)
        }
      }
    }

    fetchFullDetails()

    return () => { document.body.style.overflow = 'auto' }
  }, [initialCard.id, initialCard.cardmarket_url])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
        
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white md:text-slate-500 md:bg-transparent md:hover:bg-slate-100">
          <XIcon />
        </button>

        <div className="w-full md:w-1/2 bg-slate-100 dark:bg-slate-950 p-8 flex items-center justify-center">
           <img 
            src={card.image} 
            alt={card.name} 
            className="max-h-[50vh] md:max-h-[70vh] w-auto object-contain drop-shadow-2xl" 
           />
        </div>

        <div className="w-full md:w-1/2 p-6 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{card.name}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
               <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono text-slate-600 dark:text-slate-400">
                 #{card.card_number}
               </span>
               <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 rounded text-xs font-bold text-blue-700 dark:text-blue-300">
                 {card.rarity || 'Common'}
               </span>
               <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/40 rounded text-xs text-purple-700 dark:text-purple-300">
                 {card.episode?.name}
               </span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Prix du marché</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Prix Moyen (30j)</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {card.prices?.avg7 ? `${card.prices.avg7.toFixed(2)} €` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Meilleur prix FR</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {card.prices?.fr ? `${card.prices.fr.toFixed(2)} €` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {isScraping ? (
                <button disabled className="flex items-center justify-center gap-2 w-full py-3 bg-blue-400 text-white rounded-xl font-bold animate-pulse cursor-wait">
                  Recherche sur Cardmarket...
                </button>
              ) : card.cardmarket_url ? (
                <a 
                  href={card.cardmarket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#3366cc] hover:bg-[#2a52a4] text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95"
                >
                  Acheter sur Cardmarket
                  <ExternalLink />
                </a>
              ) : (
                <a 
                  href={card.tcggo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors"
                >
                  Voir sur TCGGO
                  <ExternalLink />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =======================
   Main Component
======================= */
export default function CardmarketSetViewer() {
  const [sets, setSets] = useState<CMSet[]>([])
  const [allCards, setAllCards] = useState<CMCard[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 })
  
  const [selectedSet, setSelectedSet] = useState<CMSet | null>(null)
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set())
  const [selectedCard, setSelectedCard] = useState<CMCard | null>(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRarities, setSelectedRarities] = useState<Set<string>>(new Set())
  const [showFiltersMobile, setShowFiltersMobile] = useState(false)

  // Fetch Sets
  useEffect(() => {
    fetch('/api/cardmarket/sets')
      .then(res => res.json())
      .then(data => {
        const results = Array.isArray(data) ? data : (data.data || [])
        setSets(results)
        if (results.length > 0) {
          const firstSeries = results[0]?.series?.name || 'Autres'
          setExpandedSeries(new Set([firstSeries]))
        }
      })
      .catch(e => console.error(e))
  }, [])

  // Group Sets
  const groupedBySeries = useMemo(() => {
    const grouped: Record<string, CMSet[]> = {}
    sets.forEach(set => {
      const series = set.series?.name ?? 'Autres'
      if (!grouped[series]) grouped[series] = []
      grouped[series].push(set)
    })
    return grouped
  }, [sets])

  // --- CORRECTION 1 : CHARGEMENT & DEDUPLICATION ---
  const fetchAllCards = async (setId: string) => {
    setLoading(true)
    setAllCards([])
    setLoadingProgress({ current: 0, total: 0 })
    
    try {
      const firstRes = await fetch(`/api/cardmarket/sets/${setId}/cards?page=1`)
      const firstJson = await firstRes.json()
      
      const totalPages = firstJson.paging?.total || 1
      const firstPageCards = firstJson.data || []
      
      setLoadingProgress({ current: 1, total: totalPages })
      
      let rawCards = [...firstPageCards]

      if (totalPages > 1) {
        const allPromises = []
        for (let page = 2; page <= totalPages; page++) {
          allPromises.push(
            fetch(`/api/cardmarket/sets/${setId}/cards?page=${page}`)
              .then(res => res.json())
              .then(json => {
                setLoadingProgress(prev => ({ ...prev, current: prev.current + 1 }))
                return json.data || []
              })
          )
        }
        const allPagesResults = await Promise.all(allPromises)
        rawCards = [...rawCards, ...allPagesResults.flat()]
      }

      // --- DEDUPLICATION MAGIQUE ICI ---
      // On utilise un Map pour ne garder qu'une seule carte par ID
      // Si l'API renvoie deux fois l'ID 24054, le deuxième écrasera le premier proprement
      const uniqueCardsMap = new Map()
      rawCards.forEach((card) => {
        if (card && card.id) {
            uniqueCardsMap.set(card.id, card)
        }
      })
      
      const uniqueCards = Array.from(uniqueCardsMap.values()) as CMCard[]
      setAllCards(uniqueCards)

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSet = (set: CMSet) => {
    setSelectedSet(set)
    setSelectedRarities(new Set())
    setSearchQuery('')
    setShowFiltersMobile(false)
    fetchAllCards(String(set.id))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const availableRarities = useMemo(() => {
    const s = new Set<string>()
    allCards.forEach(c => {
        const r = normalizeRarity(c.rarity)
        if(r) s.add(r)
    })
    return Array.from(s).sort()
  }, [allCards])

  // --- CORRECTION 2 : FILTRAGE ROBUSTE ---
  const filteredCards = useMemo(() => {
    let filtered = allCards
    
    // Filtre par Rareté (Sécurisé)
    if (selectedRarities.size > 0) {
      filtered = filtered.filter(c => {
          const r = normalizeRarity(c.rarity)
          return r && selectedRarities.has(r)
      })
    }

    // Filtre de Recherche (Sécurisé avec toString)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(c => {
        const nameMatch = c.name?.toLowerCase().includes(q)
        const numberMatch = c.card_number?.toString().toLowerCase().includes(q)
        return nameMatch || numberMatch
      })
    }
    return filtered
  }, [allCards, selectedRarities, searchQuery])

  const toggleRarity = (r: string) => {
    setSelectedRarities(prev => {
      const s = new Set(prev)
      s.has(r) ? s.delete(r) : s.add(r)
      return s
    })
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className={`
        fixed inset-0 z-40 bg-white dark:bg-slate-800 flex flex-col border-r border-slate-200 dark:border-slate-700 transition-transform duration-300
        md:relative md:w-80 md:translate-x-0
        ${selectedSet ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
      `}>
        <div className="flex-shrink-0 p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
           <h1 className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Explorer
           </h1>
           <p className="text-xs text-slate-500 mt-1">Explorateur de sets & prix</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
          {Object.entries(groupedBySeries).map(([series, seriesSets]) => (
            <div key={series} className="mb-2">
              <button
                onClick={() => setExpandedSeries(prev => {
                  const s = new Set(prev); s.has(series) ? s.delete(series) : s.add(series); return s
                })}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-left transition-colors"
              >
                <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{series}</span>
                {expandedSeries.has(series) ? <ChevronUp /> : <ChevronDown />}
              </button>
              
              {expandedSeries.has(series) && (
                <div className="mt-1 ml-2 space-y-1 pl-3 border-l-2 border-slate-100 dark:border-slate-700">
                  {seriesSets.map(set => (
                    <button
                      key={set.id}
                      onClick={() => handleSelectSet(set)}
                      className={`
                        w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all
                        ${selectedSet?.id === set.id 
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400'}
                      `}
                    >
                      {set.logo && <img src={set.logo} alt="" className="w-6 h-6 object-contain" />}
                      <span className="text-xs font-medium line-clamp-1">{set.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className={`
        flex-1 flex flex-col h-full overflow-hidden transition-all duration-300
        ${selectedSet ? 'opacity-100 translate-x-0' : 'opacity-50 md:opacity-100 translate-x-full md:translate-x-0'}
      `}>
        
        {!selectedSet && (
          <div className="hidden md:flex flex-col items-center justify-center h-full text-slate-400">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl">👈</div>
            <p>Sélectionnez un set dans le menu</p>
          </div>
        )}

        {selectedSet && (
          <>
            <header className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-30 shadow-sm">
              <div className="px-4 py-3 flex items-center gap-3">
                <button 
                  onClick={() => setSelectedSet(null)} 
                  className="md:hidden p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  <ArrowLeft />
                </button>
                
                {selectedSet.logo && <img src={selectedSet.logo} alt="" className="h-8 md:h-10 object-contain" />}
                
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg md:text-xl font-bold truncate text-slate-900 dark:text-white">{selectedSet.name}</h2>
                  <p className="text-xs text-slate-500">
                    {loading ? 'Chargement...' : `${allCards.length} cartes`} 
                    {!loading && filteredCards.length !== allCards.length && ` • ${filteredCards.length} affichées`}
                  </p>
                </div>
              </div>

              {loading && (
                <div className="h-1 w-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
                  />
                </div>
              )}

              <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <div className="relative flex-1 min-w-[150px] max-w-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <SearchIcon />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  />
                  {searchQuery && (
                     <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-2 text-slate-400 hover:text-slate-600">✕</button>
                  )}
                </div>

                <button 
                  onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                  className={`md:hidden p-2 rounded-lg border ${selectedRarities.size > 0 ? 'bg-blue-100 border-blue-300 text-blue-600' : 'bg-white border-slate-200 text-slate-600'} dark:bg-slate-800 dark:border-slate-600`}
                >
                  <FilterIcon />
                </button>

                <div className="hidden md:flex items-center gap-2 overflow-x-auto">
                  {availableRarities.map(r => (
                    <button
                      key={r}
                      onClick={() => toggleRarity(r)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        selectedRarities.has(r) 
                        ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' 
                        : 'bg-white border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-600'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                  {selectedRarities.size > 0 && (
                    <button onClick={() => setSelectedRarities(new Set())} className="text-xs text-red-500 font-medium hover:underline px-2">
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {showFiltersMobile && (
                <div className="md:hidden px-4 pb-3 flex flex-wrap gap-2 animate-in slide-in-from-top-2">
                  {availableRarities.map(r => (
                     <button
                       key={r}
                       onClick={() => toggleRarity(r)}
                       className={`px-3 py-1 rounded-full text-xs border ${
                         selectedRarities.has(r) 
                         ? 'bg-blue-600 text-white border-blue-600' 
                         : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600'
                       }`}
                     >
                       {r}
                     </button>
                  ))}
                </div>
              )}
            </header>

            <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-slate-50 dark:bg-slate-900">
               {loading && allCards.length === 0 ? (
                 <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4 animate-pulse">
                   {[...Array(10)].map((_, i) => (
                     <div key={i} className="aspect-[2/3] bg-slate-200 dark:bg-slate-800 rounded-xl" />
                   ))}
                 </div>
               ) : (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4 pb-20">
                   {filteredCards.map(card => (
                     <CardGridItem key={card.id} card={card} onClick={() => setSelectedCard(card)} />
                   ))}
                   {filteredCards.length === 0 && !loading && (
                     <div className="col-span-full text-center py-12 text-slate-500">
                       Aucune carte ne correspond à votre recherche.
                     </div>
                   )}
                 </div>
               )}
            </div>
          </>
        )}
      </main>

      {selectedCard && (
        <CardDetailModal 
          card={selectedCard} 
          onClose={() => setSelectedCard(null)} 
        />
      )}

    </div>
  )
}