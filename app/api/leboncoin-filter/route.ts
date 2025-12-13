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
Tu es un expert en produits Pokémon : cartes à l’unité, cartes gradées et **produits scellés uniquement** (boosters, displays, ETB, coffrets, tins, decks, blisters). Ton objectif est de trouver des produits qui sont **neufs, scellés, et dans un état collection (Near Mint)**.

Mission :
Nettoyer une liste d'annonces correspondant à une recherche utilisateur.

La recherche est :
"${query}"

Analyse les objets suivants :
${JSON.stringify(items)}

---
## 🔎 RÈGLES DE FILTRAGE STRICTES (PRODUITS SCELLÉS NEUFS)

### 1. RÈGLES DE REJET FONDAMENTALES (TYPE ET ÉTAT DU PRODUIT)
**TU DOIS IMPÉRATIVEMENT REJETER** toute annonce qui viole les conditions suivantes :

* **Rejet type de produit :** Le produit est clairement une **carte individuelle**, une **carte gradée**, ou un **lot de cartes non scellé** (même si le titre inclut "promo").
    * *Exemple d'exclusion pour "Carte promo Etb aventures ensemble (ev9)" : Le produit est une carte individuelle, pas un produit scellé.*
* **Rejet état du produit (Scellé & Neuf requis) :** Le produit n'est pas scellé ou est décrit comme ayant des défauts.
    * **Rejeter si:** Le produit est décrit comme **ouvert**, **non scellé**, **utilisé**, **sans cellophane d'origine**, **vide**, **reconditionné**, **avec goodies**.
    * **Rejeter si:** Le titre ou la description mentionne un **défaut**, des **dommages**, des **dégâts**, ou des **impacts** (ex: "avec léger défaut", "abîmé"). Nous recherchons un état collection (Near Mint ou Mint).

### 2. RÈGLES DE FILTRAGE SUPPLÉMENTAIRES
* **Rejet termes :** Rejeter les annonces mentionnant des termes de **troc/échange** ou des services.
* **Rejet contrefaçon :** Rejeter si le produit semble être une contrefaçon ou non officiel.

### 3 EXCEPTIONS IMPORTANTES (À NE PAS REJETER)
Certains titres très courts ou abrégés désignent clairement un PRODUIT SCELLÉ, même s’ils ne mentionnent pas “booster”, “display”, etc.

Tu NE DOIS PAS REJETER les annonces dont le titre correspond EXACTEMENT à l’un de ces formats :
- "ETB 151"
- "Coffret dresseur d'elite [nom de série]"
- "etb 151"
- "ETB151"
- "Elite Trainer Box 151"
- "ETB [nom de série]"
- "ETB Pokémon 151"
- ou toute autre forme équivalente désignant clairement une ETB scellée authentique.

👉 **Ces formats doivent être considérés comme des produits scellés valides à moins que le texte mentionne explicitement un état “ouvert”, “non scellé”, “sans cellophane”, “vide”, etc.**

---
FORMAT DE SORTIE STRICT (JSON uniquement) :
{
  "valid": [
    { "title": string, "price": number, "thumbnail": string, "url": string }
  ],
  "minPrice": number | null,
  "rejected": [
    { "title": string, "reason": string }
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

    // --- Nettoyage des prix ---
    if (result.valid && Array.isArray(result.valid)) {
      result.valid = result.valid.map((item: any) => {
        let price = item.price;

        // Si price est une chaîne, enlever les espaces et symboles € puis convertir en nombre
        if (typeof price === "string") {
          price = Number(price.replace(/[^\d,.]/g, "").replace(",", "."));
        }

        // Forcer à null si conversion impossible
        if (isNaN(price)) price = null;

        return { ...item, price };
      });

      // Calcul minPrice côté serveur
      const numericPrices = result.valid
        .map((i: any) => i.price)
        .filter((p: number | null) => p !== null);
      result.minPrice = numericPrices.length > 0 ? Math.min(...numericPrices) : null;
    } else {
      result.valid = [];
      result.minPrice = null;
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Erreur /api/leboncoin-filter:", err);
    return NextResponse.json({ error: err.message || "Erreur inconnue" }, { status: 500 });
  }
}
