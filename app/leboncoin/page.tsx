// LeboncoinPage.tsx

"use client";

import LBCItemCard from "@/components/leboncoin/LBCItemCard";
import { useState } from "react";
import { useLeboncoinSearch } from "@/hooks/useLeboncoinSearch"; // Assurez-vous d'ajuster le chemin d'import
import ProtectedPage from "@/components/ProtectedPage";

export default function LeboncoinPage() {
  const [url, setUrl] = useState("");
  // 🪄 Utilisation du Hook personnalisé
  const { result, loading, error, search } = useLeboncoinSearch();

  const handleSearch = () => {
    // Le Hook gère l'état, la logique et les erreurs
    search(url);
  };
  
  return (
    <ProtectedPage>
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
          {/* Affichage des offres validées et triées */}
          {result.offers.map((offer, index) => (
            <LBCItemCard key={index} offer={offer} />
          ))}
        </div>
      )}

      {result && result.rejected.length > 0 && (
        <div style={{ marginTop: 20, color: "red" }}>
          <h3>Annonces rejetées :</h3>
          <ul>
            {/* Affichage des annonces rejetées par l'IA */}
            {result.rejected.map((item, index) => (
              <li key={index}>
                {item.title} — {item.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result && result.offers.length === 0 && result.rejected.length === 0 && !loading && (
        <div style={{ marginTop: 20, color: "#555" }}>
          ⚠️ Aucune annonce trouvée pour cette recherche.
        </div>
      )}
      </div>
    </ProtectedPage>
  );
}
