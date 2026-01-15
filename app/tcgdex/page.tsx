"use client";

import { SetFinancePanel, pickGradedSpotlight } from "@/components/cardmarket/SetFinancePanel";
import { mapSeriesNameToFR } from "@/lib/cardmarket/seriesNameMapper";
import { mapSetNameToFR } from "@/lib/cardmarket/setNameMapper";
import { useEffect, useMemo, useState } from "react";

/* =======================
   Icons & UI Assets
======================= */
const ChevronDown = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);
const ArrowLeft = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7 7-7M8 12h13" />
  </svg>
);
const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const XIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);
const ExternalLink = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);
const LoaderSpinner = () => (
  <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

/* =======================
   Types
======================= */
interface CMCard {
  id: number;
  cardmarketId?: number;
  name: string;
  rarity?: string;
  card_number?: string;
  image?: string;
  prices?: {
    fr?: number;
    avg7?: number;
    graded?: {
      psa?: Record<string, number>;
      cgc?: Record<string, number>;
      bgs?: Record<string, number>;
    };
  };
  episode: { name: string };
 cardmarket_url?: string | null;  // ✅ ici
  tcggo_url?: string | null;    
}

interface CMSet {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  series?: { name: string };
}

/* =======================
   Helpers
======================= */
const normalizeRarity = (rarity?: string) => (rarity ? rarity.trim().toLowerCase() : "");

function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}


/* =======================
Sub-Components
======================= */

const CardGridItem = ({ card, onClick }: { card: CMCard; onClick: () => void }) => {
  const gradedSpot = pickGradedSpotlight(card.prices?.graded);

  return (
    <button
      onClick={onClick}
      className="
        group relative flex flex-col w-full h-full text-left
        bg-card text-card-foreground border border-border rounded-xl overflow-hidden
        transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-lg
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
      "
    >
      <div className="relative aspect-[2/3] w-full bg-muted/40 p-2 flex items-center justify-center overflow-hidden">
        {card.image ? (
          <img
            src={card.image}
            alt={card.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.07]"
          />
        ) : (
          <span className="text-4xl">🃏</span>
        )}

        <div
          className="
            absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity
            bg-background/70 text-foreground border border-border/60
            text-[10px] px-2 py-1 rounded-full backdrop-blur
          "
        >
          Voir détails
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-sm line-clamp-1" title={card.name}>
            {card.name}
          </h3>

          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {card.rarity && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border/70 font-medium truncate max-w-[120px]">
                {card.rarity}
              </span>
            )}

            <span className="text-[10px] text-muted-foreground font-mono">
              #{card.card_number}
            </span>

            {/* Graded spotlight (clean, 1 chip only) */}
            {gradedSpot && (
              <span
                title="Prix graded (spotlight)"
                className="
                  text-[10px] px-2 py-0.5 rounded-full
                  bg-muted text-foreground border border-border/70
                  font-mono tabular-nums
                "
              >
                {gradedSpot.label.replace(" ", "")} {Math.round(gradedSpot.value)}€
              </span>
            )}
          </div>
        </div>

        {(card.prices?.avg7 || card.prices?.fr) && (
          <div className="mt-2 pt-2 border-t border-border/60 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Prix moyen</span>
              <span className="font-semibold">
                {card.prices?.avg7 ? `${card.prices.avg7.toFixed(2)} €` : "N/A"}
              </span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Meilleur Cardmarket FR</span>
              <span className="font-bold text-success">
                {card.prices?.fr ? `${card.prices.fr.toFixed(2)} €` : "N/A"}
              </span>
            </div>
          </div>
        )}
      </div>
    </button>
  );
};

const CardDetailModal = ({ card: initialCard, onClose }: { card: CMCard; onClose: () => void }) => {
  const [card, setCard] = useState<CMCard>(initialCard);
  const [isScraping, setIsScraping] = useState(false);
  
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    
    const fetchFullDetails = async () => {
      // ⚠️ utiliser l’id CM stable si dispo
      const cmId = initialCard.cardmarketId ?? initialCard.id;

      // déjà présent => rien à faire
  if (initialCard.cardmarket_url) return;

  setIsScraping(true);
  try {
    // ✅ IMPORTANT : déclenche le scraping côté API
    const res = await fetch(`/api/cardmarket/cards/${cmId}?scrape=1`, {
      cache: "no-store",
    });
    
    const data = await res.json().catch(() => null);
    
    console.log("[ui-modal] fetchFullDetails", {
      cmId,
      ok: res.ok,
      status: res.status,
      hasCardmarketUrl: !!data?.cardmarket_url,
      cardmarket_url: data?.cardmarket_url ?? null,
      tcggo_url: data?.tcggo_url ?? null,
    });

    if (res.ok && data?.cardmarket_url) {
      const raw = String(data.cardmarket_url);
      const urlWithLang = raw.includes("?") ? `${raw}&language=2` : `${raw}?language=2`;
      
      setCard((prev) => ({
        ...prev,
        cardmarket_url: urlWithLang,
        // optionnel: on complète tcggo_url si jamais il manquait
        tcggo_url: prev.tcggo_url ?? (data?.tcggo_url ?? null),
      }));
    }
  } catch (err) {
    console.error("[ui-modal] Erreur scraping:", err);
  } finally {
    setIsScraping(false);
  }
};

fetchFullDetails();

return () => {
  document.body.style.overflow = "auto";
  window.removeEventListener("keydown", onKeyDown);
};
}, [initialCard.id, initialCard.cardmarketId, initialCard.cardmarket_url, onClose]);

return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card text-card-foreground w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200 border border-border">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/70 border border-border/60 hover:bg-background transition
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Fermer"
        >
          <XIcon />
        </button>

        <div className="w-full md:w-1/2 bg-muted/40 p-6 md:p-8 flex items-center justify-center">
          <img
            src={card.image}
            alt={card.name}
            decoding="async"
            className="max-h-[50vh] md:max-h-[70vh] w-auto object-contain drop-shadow-2xl"
          />
        </div>

        <div className="w-full md:w-1/2 p-6 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold">{card.name}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-1 bg-secondary text-secondary-foreground border border-border/70 rounded text-xs font-mono">
                #{card.card_number}
              </span>
              <span className="px-2 py-1 bg-secondary text-secondary-foreground border border-border/70 rounded text-xs font-bold">
                {card.rarity || "Common"}
              </span>
              <span className="px-2 py-1 bg-muted text-muted-foreground border border-border/60 rounded text-xs">
                {card.episode?.name}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-muted/50 rounded-xl p-4 border border-border/60">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                Prix du marché
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Prix Moyen</p>
                  <p className="text-2xl font-bold">
                    {card.prices?.avg7 ? `${card.prices.avg7.toFixed(2)} €` : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Meilleur prix FR</p>
                  <p className="text-2xl font-bold text-success">
                    {card.prices?.fr ? `${card.prices.fr.toFixed(2)} €` : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* NOTE: graded détails -> à ajouter ici si tu veux, mais tu ne me l'as pas demandé pour le modal */}

            <div className="flex flex-col gap-3">
              {isScraping ? (
                <button
                  disabled
                  className="flex items-center justify-center gap-2 w-full py-3 bg-muted text-muted-foreground border border-border rounded-xl font-semibold animate-pulse cursor-wait"
                >
                  Recherche sur Cardmarket...
                </button>
              ) : card.cardmarket_url ? (
                <a
                  href={card.cardmarket_url ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold
                    bg-cardmarket text-primary-foreground
                    hover:opacity-95 transition active:scale-[0.99]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
                  "
                >
                  Acheter sur Cardmarket
                  <ExternalLink />
                </a>
              ) : (
                <a
                  href={card.tcggo_url ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    flex items-center justify-center gap-2 w-full py-3
                    bg-secondary text-secondary-foreground border border-border
                    rounded-xl font-medium transition hover:bg-secondary/80
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
                  "
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
  );
};

const LoadingOverlay = ({
  progress,
  message
}: {
  progress: { current: number; total: number };
  message: string;
}) => {
  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-2xl border border-border max-w-md w-full mx-4">
        <div className="flex flex-col items-center gap-6">
          <LoaderSpinner />

          <div className="w-full space-y-3">
            <p className="text-center font-semibold text-lg">{message}</p>

            {progress.total > 0 && (
              <>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Page {progress.current} / {progress.total}</span>
                  <span>{percentage}%</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* =======================
   Main Component
======================= */
export default function CardmarketSetViewer() {
  const [sets, setSets] = useState<CMSet[]>([]);
  const [allCards, setAllCards] = useState<CMCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });
  const [loadingMessage, setLoadingMessage] = useState("Chargement...");
  const [loadingSets, setLoadingSets] = useState(true);

  const [selectedSet, setSelectedSet] = useState<CMSet | null>(null);
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());
  const [selectedCard, setSelectedCard] = useState<CMCard | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRarities, setSelectedRarities] = useState<Set<string>>(new Set());
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const [sortByFRPrice, setSortByFRPrice] = useState<"desc" | "asc">("desc");
  // Finance drawer
  const [financeOpen, setFinanceOpen] = useState(false);

 useEffect(() => {
 setLoadingSets(true);
 fetch("/api/cardmarket/sets/available")
    .then((res) => res.json())
    .then((data) => {
      const results = Array.isArray(data) ? data : data.data || [];

      const mapped = results.map((s: CMSet) => ({
        ...s,
        name: mapSetNameToFR(s.name),
      }));

      setSets(mapped);

      if (mapped.length > 0) {
        const firstSeriesRaw = mapped[0]?.series?.name || "Autres";
        const firstSeries = mapSeriesNameToFR(firstSeriesRaw);
        setExpandedSeries(new Set([firstSeries]));
      }
    })
    .catch((e) => console.error(e))
    .finally(() => setLoadingSets(false));
}, []);

// Ordre chronologique des séries (du plus récent au plus ancien)
const SERIES_ORDER = [
  "Méga-Évolution",
  "Écarlate et Violet",
  "Épée et Bouclier",
  "Soleil et Lune",
  "XY",
  "Noir et Blanc",
  "HeartGold & SoulSilver",
  "Platine",
  "Diamant et Perle",
  "EX",
  "E-Card",
  "Neo",
  "Gym",
  "Base",
  "Promos & Autres", // Regroupe NP, Other, POP, etc.
];

// Images des séries (ajouter au fur et à mesure)
const SERIES_IMAGES: Record<string, string> = {
  "Méga-Évolution": "/MEG/MEG.png",
  "Écarlate et Violet": "/EV/SVI.png",
  "Épée et Bouclier": "/EB/SWSH1.webp",
  "Soleil et Lune": "/SL/SM01.webp",
  "XY": "/XY/XY.webp",
  "Noir et Blanc": "/NB/BLW.webp",
  "HeartGold & SoulSilver": "/HGSS/HGSS.webp",
  "Platine": "/Platine/PT.webp",
  "Diamant et Perle": "/DP/DP.webp",
  "EX":"/EX/ex.webp",
  "E-Card":"/Wizards/ecard.png",
  "Neo":"/Neo/neo.png",
  "Gym":"/Wizards/gym.png",
  "Base":"/Wizards/wizards.png",
  "Promos & Autres": "/Wizards/promo.png"
};

// Séries à regrouper dans "Promos & Autres"
const SPECIAL_SERIES = ["NP", "Other", "POP", "Promos Nintendo", "Autres"];

const groupedBySeries = useMemo(() => {
  const grouped: Record<string, CMSet[]> = {};

  sets.forEach((set) => {
    const seriesRaw = set.series?.name ?? "Autres";
    let series = mapSeriesNameToFR(seriesRaw);

    // Regrouper les séries spéciales
    if (SPECIAL_SERIES.includes(series) || SPECIAL_SERIES.includes(seriesRaw)) {
      series = "Promos & Autres";
    }

    if (!grouped[series]) grouped[series] = [];
    grouped[series].push(set);
  });

  // Trier selon l'ordre chronologique défini
  const sortedGrouped: Record<string, CMSet[]> = {};
  SERIES_ORDER.forEach((series) => {
    if (grouped[series]) {
      sortedGrouped[series] = grouped[series];
    }
  });

  // Ajouter les séries non listées à la fin
  Object.keys(grouped).forEach((series) => {
    if (!sortedGrouped[series]) {
      sortedGrouped[series] = grouped[series];
    }
  });

  return sortedGrouped;
}, [sets]);

// components/CardmarketSetViewer.tsx
// Modification de la fonction fetchAllCards pour utiliser la route mappée

// ... (garde tous tes imports et types actuels)

// Remplace seulement cette fonction :

const fetchAllCards = async (setId: string) => {
  setLoading(true);
  setAllCards([]);
  setLoadingProgress({ current: 0, total: 0 });
  setLoadingMessage("Chargement de la première page...");

  try {
    // 1. Première page pour connaître le nombre total ET afficher immédiatement
    const firstRes = await fetch(`/api/cardmarket/sets/${setId}/cards/mapped?page=1`);
    const firstJson = await firstRes.json();

    const totalPages = firstJson.paging?.total || 1;
    const firstPageCards = firstJson.data || [];

    // Afficher immédiatement la première page
    const uniqueCardsMap = new Map<number, CMCard>();
    firstPageCards.forEach((card: CMCard) => {
      if (card && typeof card.id === "number") uniqueCardsMap.set(card.id, card);
    });
    setAllCards(Array.from(uniqueCardsMap.values()));
    setLoadingProgress({ current: 1, total: totalPages });

    // 2. Si une seule page, on a fini
    if (totalPages <= 1) {
      setLoading(false);
      return;
    }

    // 3. Charger toutes les pages restantes en parallèle (max 10 simultanées)
    const BATCH_SIZE = 10;
    const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    let loadedPages = 1;

    for (let i = 0; i < remainingPages.length; i += BATCH_SIZE) {
      const batch = remainingPages.slice(i, i + BATCH_SIZE);

      setLoadingMessage(`Chargement des pages ${loadedPages + 1}-${Math.min(loadedPages + batch.length, totalPages)}/${totalPages}...`);

      const batchResults = await Promise.all(
        batch.map((page) =>
          fetch(`/api/cardmarket/sets/${setId}/cards/mapped?page=${page}`)
            .then((res) => res.json())
            .then((json) => json.data || [])
            .catch((err) => {
              console.error(`Error fetching page ${page}:`, err);
              return [];
            })
        )
      );

      // Accumuler les cartes du batch
      const batchCards = batchResults.flat();
      batchCards.forEach((card: CMCard) => {
        if (card && typeof card.id === "number") uniqueCardsMap.set(card.id, card);
      });

      loadedPages += batch.length;

      // Mise à jour groupée : état + progress en une seule "frame"
      setAllCards(Array.from(uniqueCardsMap.values()));
      setLoadingProgress({ current: loadedPages, total: totalPages });
    }

  } catch (err) {
    console.error('Error fetching cards:', err);
    setLoadingMessage("Erreur lors du chargement");
  } finally {
    setLoading(false);
  }
};

// ... (garde le reste de ton composant identique)

  const handleSelectSet = (set: CMSet) => {
    setSelectedSet(set);
    setSelectedRarities(new Set());
    setSearchQuery("");
    setShowFiltersMobile(false);
    setFinanceOpen(false);
    fetchAllCards(String(set.id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const availableRarities = useMemo(() => {
    const s = new Set<string>();
    allCards.forEach((c) => {
      const r = normalizeRarity(c.rarity);
      if (r) s.add(r);
    });
    return Array.from(s).sort();
  }, [allCards]);

  const filteredCards = useMemo(() => {
    let filtered = allCards;

    if (selectedRarities.size > 0) {
      filtered = filtered.filter((c) => {
        const r = normalizeRarity(c.rarity);
        return r && selectedRarities.has(r);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((c) => {
        const nameMatch = c.name?.toLowerCase().includes(q);
        const numberMatch = c.card_number?.toString().toLowerCase().includes(q);
        return nameMatch || numberMatch;
      });
    }

    return filtered;
  }, [allCards, selectedRarities, searchQuery]);

  const sortedCards = useMemo(() => {
    // 1) on reprend ton filteredCards (déjà filtré par rareté + recherche)
    const arr = [...filteredCards];
  
    // 2) on trie par prix FR (Cardmarket)
    arr.sort((a, b) => {
      const pa = a.prices?.fr;
      const pb = b.prices?.fr;
  
      // On met les cartes sans prix à la fin
      const va = typeof pa === "number" && Number.isFinite(pa) ? pa : -Infinity;
      const vb = typeof pb === "number" && Number.isFinite(pb) ? pb : -Infinity;
  
      return sortByFRPrice === "desc" ? vb - va : va - vb;
    });
  
    return arr;
  }, [filteredCards, sortByFRPrice]);
  

  const toggleRarity = (r: string) => {
    setSelectedRarities((prev) => {
      const s = new Set(prev);
      s.has(r) ? s.delete(r) : s.add(r);
      return s;
    });
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Loading Overlay for initial sets loading */}
      {loadingSets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
          <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-2xl border border-border max-w-md w-full mx-4">
            <div className="flex flex-col items-center gap-6">
              <LoaderSpinner />
              <div className="w-full space-y-2 text-center">
                <p className="font-semibold text-lg">Chargement des sets...</p>
                <p className="text-sm text-muted-foreground">Récupération de la liste des séries et sets disponibles</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay for cards */}
      {loading && (
        <LoadingOverlay progress={loadingProgress} message={loadingMessage} />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed inset-0 z-40 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border transition-transform duration-300
          md:relative md:w-80 md:translate-x-0
          ${selectedSet ? "-translate-x-full md:translate-x-0" : "translate-x-0"}
        `}
      >
        <div className="flex-shrink-0 p-4 border-b border-sidebar-border bg-sidebar/80">
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold text-primary leading-none">Explorer</h1>
            <p className="text-xs text-muted-foreground mt-1 leading-none">
              Explorateur de sets & prix
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {Object.entries(groupedBySeries).map(([series, seriesSets]) => (
            <div key={series} className="mb-2">
              <button
                onClick={() =>
                  setExpandedSeries((prev) => {
                    const s = new Set(prev);
                    s.has(series) ? s.delete(series) : s.add(series);
                    return s;
                  })
                }
                className={`
                  group w-full flex items-center justify-between px-4 py-3 rounded-xl text-left
                  transition-all duration-300 ease-out
                  hover:bg-sidebar-accent/80 hover:shadow-md hover:scale-[1.02]
                  ${expandedSeries.has(series) ? "bg-sidebar-accent/60 shadow-sm" : ""}
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring
                `}
              >
                <div className="flex-1 flex justify-center">
                  {SERIES_IMAGES[series] ? (
                    <img
                      src={SERIES_IMAGES[series]}
                      alt={series}
                      className="h-8 object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="font-semibold text-sm">{series}</span>
                  )}
                </div>
                <div className={`
                  ml-2 p-1 rounded-full transition-all duration-300
                  ${expandedSeries.has(series) ? "bg-sidebar-accent rotate-180" : "group-hover:bg-sidebar-accent/50"}
                `}>
                  <ChevronDown />
                </div>
              </button>

              {expandedSeries.has(series) && (
                <div className="mt-1 ml-2 space-y-1 pl-3 border-l-2 border-sidebar-border">
                  {seriesSets.map((set) => (
                    <button
                      key={set.id}
                      onClick={() => handleSelectSet(set)}
                      className={`
                        w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all
                        ${
                          selectedSet?.id === set.id
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm ring-1 ring-sidebar-ring"
                            : "hover:bg-sidebar-accent text-muted-foreground"
                        }
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
                      `}
                    >
                      {set.logo && <img src={set.logo} alt="" loading="lazy" decoding="async" className="w-6 h-6 object-contain" />}
                      <span className="text-xs font-medium line-clamp-1">{set.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN */}
      <main
        className={`
          flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 min-w-0
          ${selectedSet ? "opacity-100 translate-x-0" : "opacity-50 md:opacity-100 translate-x-full md:translate-x-0"}
        `}
      >
        {!selectedSet && (
          <div className="hidden md:flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-muted flex items-center justify-center text-3xl">
              👈
            </div>
            <p>Sélectionnez un set dans le menu</p>
          </div>
        )}

        {selectedSet && (
          <>
            <header className="flex-shrink-0 bg-card border-b border-border z-30 shadow-sm">
              <div className="px-4 py-3 flex items-center gap-3">
                <button
                  onClick={() => setSelectedSet(null)}
                  className="md:hidden p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label="Retour"
                >
                  <ArrowLeft />
                </button>

                {selectedSet.logo && <img src={selectedSet.logo} alt="" decoding="async" className="h-8 md:h-10 object-contain" />}

                <div className="flex-1 min-w-0">
                  <h2 className="text-lg md:text-xl font-bold truncate">{selectedSet.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {loading ? "Chargement..." : `${allCards.length} cartes`}
                    {!loading && filteredCards.length !== allCards.length && ` • ${filteredCards.length} affichées`}
                  </p>
                </div>

                {/* Mobile finance entrypoint (clean, always visible) */}
                <button
                  onClick={() => setFinanceOpen(true)}
                  className="lg:hidden px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted transition text-sm font-semibold"
                >
                  Finance
                </button>

                {/* Desktop finance entrypoint (optional, also useful) */}
                <button
                  onClick={() => setFinanceOpen(true)}
                  className="hidden lg:inline-flex px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted transition text-sm font-semibold"
                >
                  Ouvrir Finance
                </button>
              </div>

              <div className="px-4 py-3 flex gap-2 overflow-x-auto border-t border-border bg-background/40 backdrop-blur">
                {/* Search */}
                <div className="relative flex-1 min-w-[150px] max-w-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <SearchIcon />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher une carte ou un numéro..."
                    className="
                      w-full pl-9 pr-10 py-2 text-sm rounded-lg
                      bg-background border border-input
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
                    "
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-2 text-muted-foreground hover:text-foreground transition
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
                      aria-label="Effacer la recherche"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filters mobile */}
                <button
                  onClick={() => setShowFiltersMobile(true)}
                  className={`md:hidden p-2 rounded-lg border transition
                    ${
                      selectedRarities.size > 0
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    }
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
                  `}
                  aria-label="Filtres"
                >
                  <FilterIcon />
                </button>

                {/* Filters desktop */}
                <div className="hidden md:flex items-center gap-2 overflow-x-auto">
                  {availableRarities.map((r) => (
                    <button
                      key={r}
                      onClick={() => toggleRarity(r)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition
                        ${
                          selectedRarities.has(r)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:bg-muted"
                        }
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
                      `}
                    >
                      {r}
                    </button>
                  ))}
                  {selectedRarities.size > 0 && (
                    <button
                      onClick={() => setSelectedRarities(new Set())}
                      className="text-xs text-destructive font-medium hover:underline px-2"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <button
                onClick={() => setSortByFRPrice((p) => (p === "desc" ? "asc" : "desc"))}
                className={`
                  inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-semibold whitespace-nowrap
                  transition
                  ${
                    sortByFRPrice
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-muted"
                  }
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
                `}
                aria-label="Trier par prix Cardmarket FR"
              >
                <FilterIcon />
                Prix FR
                <span className="font-mono">{sortByFRPrice === "desc" ? "↓" : "↑"}</span>
              </button>

              </div>
              
            </header>

            <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-background">
              {loading && allCards.length === 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4 animate-pulse">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="aspect-[2/3] bg-muted rounded-xl border border-border/50" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4 pb-20">
                  {sortedCards.map((card) => (
                    <CardGridItem key={card.id} card={card} onClick={() => setSelectedCard(card)} />
                  ))}
                    {filteredCards.length === 0 && !loading && (
                      <div className="col-span-full text-center py-12 text-muted-foreground">
                        Aucune carte ne correspond à votre recherche.
                      </div>
                    )}
                  </div>

                  {loading && allCards.length > 0 && (
                    <div className="flex justify-center items-center py-8 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5">
                          <LoaderSpinner />
                        </div>
                        <span className="text-sm">Chargement de plus de cartes...</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bottom-sheet filters (mobile) */}
            {showFiltersMobile && (
              <div className="fixed inset-0 z-50 md:hidden">
                <div className="absolute inset-0 bg-black/50" onClick={() => setShowFiltersMobile(false)} />
                <div className="absolute bottom-0 left-0 right-0 bg-card text-card-foreground border border-border rounded-t-2xl p-4 animate-in slide-in-from-bottom-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold">Filtres</p>
                    <button
                      className="text-muted-foreground hover:text-foreground transition
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
                      onClick={() => setShowFiltersMobile(false)}
                      aria-label="Fermer"
                    >
                      <XIcon />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {availableRarities.map((r) => (
                      <button
                        key={r}
                        onClick={() => toggleRarity(r)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition
                          ${
                            selectedRarities.has(r)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                          }
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
                        `}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  {selectedRarities.size > 0 && (
                    <button
                      onClick={() => setSelectedRarities(new Set())}
                      className="mt-4 w-full py-2 rounded-xl border border-border bg-muted text-muted-foreground hover:bg-muted/70 transition
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {selectedCard && <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />}

        {/* Finance drawer: mounted only when a set exists */}
        {selectedSet && (
          <SetFinancePanel
            open={financeOpen}
            onOpenChange={setFinanceOpen}
            setName={selectedSet.name}
            setLogo={selectedSet.logo}
            cards={allCards}
          />
        )}
      </main>
    </div>
  );
}