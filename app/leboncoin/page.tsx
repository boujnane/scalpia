"use client";

import LBCItemCard, { LBCOffer } from "@/components/leboncoin/LBCItemCard";
import { useState } from "react";

export type LBCResult = {
  offers: LBCOffer[];
  rejected: { title: string; reason: string }[];
};


export default function LeboncoinPage() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<LBCResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
  
    try {
      // 1️⃣ Récupérer les offres brutes
      const res = await fetch(`/api/leboncoin?q=${encodeURIComponent(url)}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur inconnue");
      }
      const data = await res.json();
      const offers: LBCOffer[] = data.offers || [];
  
      // 2️⃣ Appeler le filtrage IA
      const filterRes = await fetch('/api/leboncoin-filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: url, items: offers }),
      });
      if (!filterRes.ok) {
        const err = await filterRes.json();
        throw new Error(err.error || "Erreur filtrage inconnue");
      }
      const filteredData = await filterRes.json();
  
      // 3️⃣ Fusionner : garder toutes les infos originales mais ne garder que les offres validées par l'IA
      const validOffers = (filteredData.valid || []).map((validItem: any) => {
        // Chercher l'offre originale correspondante par url (ou un autre identifiant unique)
        const original = offers.find(o => o.link === validItem.url);
        return original ? { ...original } : validItem;
      });
  
      // 4️⃣ Trier par prix croissant
      const sortedOffers = validOffers.slice().sort((a: { price: string | number; }, b: { price: string | number; }) => {
        const parsePrice = (price: string | number) => {
          if (typeof price === "number") return price;
          if (!price) return 0;
          return Number(price.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;
        };
      
        const priceA = parsePrice(a.price);
        const priceB = parsePrice(b.price);
        return priceA - priceB;
      });
  
      setResult({
        offers: sortedOffers,
        rejected: filteredData.rejected || [],
      });
      
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 20 }}>
        Test Scraping Le Bon Coin (Playwright)
      </h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Ex : etb aventures"
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: 16,
          }}
        />

        <button
          onClick={handleSearch}
          disabled={!url || loading}
          style={{
            padding: "10px 16px",
            backgroundColor: "#ff6e14",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 16,
            fontWeight: "bold",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Chargement..." : "Lancer Playwright"}
        </button>
      </div>

      {error && (
        <div style={{ color: "red", marginBottom: 20 }}>
          ❌ Erreur : {error}
        </div>
      )}

      {result && result.offers.length > 0 && (
        <div style={{ marginTop: 20 }}>
          {result.offers.map((offer, index) => (
            <LBCItemCard key={index} offer={offer} />
          ))}
        </div>
      )}

      {result && result.rejected.length > 0 && (
  <div style={{ marginTop: 20, color: "red" }}>
    <h3>Annonces rejetées :</h3>
    <ul>
      {result.rejected.map((item, index) => (
        <li key={index}>
          {item.title} — {item.reason}
        </li>
      ))}
    </ul>
  </div>
)}

      {result && result.offers.length === 0 && (
        <div style={{ marginTop: 20, color: "#555" }}>
          ⚠️ Aucune annonce trouvée pour cette recherche.
        </div>
      )}
    </div>
  );
}
