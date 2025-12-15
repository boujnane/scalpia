// file: lib/api.ts
const handleRes = async (res: Response) => {
  if (!res.ok) {
      let errorDetail = res.statusText;
      try {
          // Tente de décoder le corps comme JSON (si votre API renvoie un objet d'erreur)
          const errorJson = await res.json();
          errorDetail = errorJson.error || JSON.stringify(errorJson);
      } catch {
          // Sinon, utilise le texte brut
          errorDetail = await res.text() || res.statusText;
      }
      throw new Error(`Erreur ${res.status}: ${errorDetail}`);
  }
  return res;
  };


export const fetchEbaySearch = async (q: string, signal?: AbortSignal) => {
const res = await fetch(`/api/ebay-search?q=${encodeURIComponent(q)}`, { signal });
await handleRes(res);
return res.text();
};


export const fetchEbaySold = async (q: string, signal?: AbortSignal) => {
const res = await fetch(`/api/ebay-sold?q=${encodeURIComponent(q)}`, { signal });
await handleRes(res);
return res.text();
};


export const postEbayFilter = async (query: string, items: any[], signal?: AbortSignal) => {
const res = await fetch('/api/ebay-filter', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ query, items }),
signal,
});
await handleRes(res);
return res.json();
};


export const fetchVintedSearch = async (q: string, signal?: AbortSignal) => {
const res = await fetch(`/api/vinted-search?q=${encodeURIComponent(q)}`, { signal });
await handleRes(res);
return res.text();
};

export const postVintedFilter = async (query: string, items: any[], signal?: AbortSignal) => {
  const res = await fetch('/api/vinted-filter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, items }),
    signal,
  });
  await handleRes(res);
  return res.json();
};
  
  
  // ------------------------------------------------------------------
  // Fonctions  (Focus de la modification)
  // ------------------------------------------------------------------
  
  /**
   * Récupère les détails complets d'une seule carte via la route /api/tcgdex/card.
   */
  export const fetchTCGCard = async (id: string, signal?: AbortSignal) => {
    const res = await fetch(`/api/tcgdex/card?id=${encodeURIComponent(id)}`, {
      signal,
    })
  
    await handleRes(res)
    // Retourne l'objet de carte nettoyé et complet
    return res.json()
  }
  
  /**
   * 💡 Nouvelle logique d'agrégation : 
   * 1. Recherche les IDs via /api/tcgdex/search.
   * 2. Récupère les détails complets de chaque carte via /api/tcgdex/card en parallèle.
   */
  export const fetchTCGSearch = async (q: string, signal?: AbortSignal) => {
    // 1. Appel initial pour obtenir une liste de résultats avec IDs
    const searchRes = await fetch(`/api/tcgdex/search?q=${encodeURIComponent(q)}`, {
      signal,
    })
  
    await handleRes(searchRes)
    // On suppose que la route /api/tcgdex/search retourne un tableau d'objets avec un champ 'id'
    const initialResults: { id: string }[] = await searchRes.json()
  
    if (initialResults.length === 0) {
        return []
    }
  
    // 2. Extrait les IDs et crée une promesse d'appel de détail pour chaque carte
    const detailPromises = initialResults.map(card => 
      fetchTCGCard(card.id, signal)
    )
  
    try {
      // 3. Exécute toutes les requêtes de détail en parallèle
      const detailedCards = await Promise.all(detailPromises)
      
      // 4. Retourne le tableau des cartes complètes
      return detailedCards
  
    } catch (error) {
      // Si une des requêtes de détail échoue, nous propageons l'erreur
      console.error("Échec d'une requête de détail de carte:", error)
      throw new Error("Échec de la récupération des détails complets des cartes.")
    }
  }

  // ------------------------------------------------------------
// ⭐ LE BON COIN (NOUVEAU)
// ------------------------------------------------------------

export const fetchLeboncoinSearch = async (query: string, signal?: AbortSignal) => {
  const res = await fetch(`/api/leboncoin?q=${encodeURIComponent(query)}`, { signal });
  await handleRes(res);
  return res.json(); 
};

export const postLeboncoinFilter = async (query: string, items: any[], signal?: AbortSignal) => {
  const res = await fetch('/api/leboncoin-filter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, items }),
    signal,
  });
  await handleRes(res);
  return res.json();
};