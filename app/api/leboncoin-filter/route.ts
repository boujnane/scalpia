// app/api/leboncoin-filter/route.ts
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, items } = body;

    if (!query || !items) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const prompt = `
Tu es un expert en produits Pokémon (TCG). Ton objectif est de filtrer une liste d'annonces pour ne garder que les **PRODUITS SCELLÉS** (Boosters, Displays, ETB, Coffrets, Tins, Decks, Blisters).

La recherche utilisateur est : "${query}"

Analyse les objets suivants :
${JSON.stringify(items)}

---

## 🧠 LOGIQUE DE FILTRAGE : PRÉSOMPTION DE VALIDITÉ & FLEXIBILITÉ
**IMPORTANT :** Tu dois adopter une logique permissive sur l'état du scellage et l'orthographe.

1.  **PRÉSOMPTION DE SCELLAGE :** Considère qu'un produit EST SCELLÉ ET NEUF par défaut, sauf si un mot-clé indique EXPLICITEMENT le contraire.
2.  **TOLÉRANCE ORTHOGRAPHIQUE MAXIMALE :** Les vendeurs et les utilisateurs font des fautes.
    * Ignore la casse (Majuscule/minuscule).
    * Ignore les fautes de frappe ou de grammaire (ex: "Flamme" vs "Flammes", "Fantamsagorique" vs "Fantasmagorique").
    * Accepte les approximations phonétiques.
    * Si le titre ressemble à un produit scellé (même mal écrit), c'est **VALIDE**.

---

## 🚫 CRITÈRES D'EXCLUSION (LISTE NOIRE)
Tu ne dois rejeter l'annonce **QUE** si elle tombe dans l'une des catégories suivantes :

### 1. REJET : CE N'EST PAS UN PRODUIT SCELLÉ (Type d'objet incorrect)
Rejette si l'objet est clairement une carte à l'unité ou un lot de cartes en vrac.
* **Mots-clés déclencheurs de rejet :** "Carte seule", "Carte à l'unité", "Gradée", "PCA", "PSA", "AP", "Grade", "Sleeve", "Toploader", "Pochette", "Vrac", "Lot de cartes", "Classeur", "Binder".
* **Ambiguïté :** Si le titre est *uniquement* le nom d'un Pokémon (ex: "Dracaufeu EX"), considère que c'est une carte et rejette-le. Un produit scellé contient généralement un mot contenant (Coffret, ETB, Box, Tin, Booster, Pack, Duo, Tripack).

### 2. REJET : L'ÉTAT N'EST PAS CONFORME (Ouvert ou Abîmé)
Rejette uniquement si l'annonce avoue explicitement un défaut majeur ou une ouverture.
* **Mots-clés déclencheurs de rejet :** "Ouvert", "Opened", "Sans booster", "Vide", "Empty", "Juste la boite", "Sans film", "Descellé", "Unsealed", "Abimé", "Déchiré", "Choc", "Ecrasé", "reconditionné", "incomplet".
* *Note :* Si rien n'est précisé, considère que c'est Mint/Near Mint.

### 3. REJET : CONTENU SPÉCIFIQUE
* **Rejet Goodies/Accessoires seuls :** (ex: "Sleeves ETB 151", "Dés", "Guide", "Code online").
* **Rejet Carte Promo seule :** (ex: "Carte promo de l'ETB").

---

## ✅ EXEMPLES DE VALIDATION (À GARDER MALGRÉ LES FAUTES)
Ces titres sont **VALIDES** car ils désignent des produits scellés, même avec des erreurs :
* "EtB FlAmmes Fantamsagorique" (Valide -> Typo tolérée)
* "Coffret dresseur delite" (Valide -> Phonétique tolérée)
* "Display Zenith Supreme" (Valide)
* "Boster Pokemon" (Valide -> Faute sur Booster tolérée)
* "Pokebox Noel" (Valide)

---

FORMAT DE SORTIE ATTENDU (JSON) :
{
  "valid": [
    { "title": string, "price": number, "thumbnail": string, "url": string }
  ],
  "minPrice": number | null,
  "rejected": [
    { "title": string, "reason": string, "thumbnail": string, "url": string } // Raison courte : "Carte seule", "Ouvert", "Boite vide", etc.
  ]
}
`;

 // --- Appel à l'IA ---
 const completion = await client.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  messages: [{ role: "user", content: prompt }],
  response_format: { type: "json_object" },
});

const content = completion.choices?.[0]?.message?.content;
if (!content) {
  return NextResponse.json({ error: "Réponse vide du modèle Groq" }, { status: 500 });
}

let result = JSON.parse(content);

// --- Nettoyage des prix et génération de rejected ---
const rejected: { title: string; reason: string }[] = [];
if (result.valid && Array.isArray(result.valid)) {
  result.valid = result.valid.map((item: any) => {
    let price = item.price;

    // Nettoyage du prix
    if (typeof price === "string") {
      price = Number(price.replace(/[^\d,.]/g, "").replace(",", "."));
    }

    if (isNaN(price) || price === null) {
      rejected.push({ title: item.title || "Titre inconnu", reason: "Prix invalide" });
      return null; // exclu des valides
    }

    return { ...item, price };
  }).filter(Boolean); // retire les nulls

  // Calcul minPrice côté serveur
  const numericPrices = result.valid
    .map((i: any) => i.price)
    .filter((p: number | null) => p !== null);
  result.minPrice = numericPrices.length > 0 ? Math.min(...numericPrices) : null;
} else {
  result.valid = [];
  result.minPrice = null;
}

// Fusionner les rejets du LLM avec ceux détectés côté serveur (prix invalide)
result.rejected = [...(result.rejected || []), ...rejected];

return NextResponse.json(result);
} catch (err: any) {
console.error("Erreur /api/leboncoin-filter:", err);
return NextResponse.json({ error: err.message || "Erreur inconnue" }, { status: 500 });
}
}
