import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { valid: [], minPrice: null, rejected: [] },
        { status: 200 }
      );
    }

    const prompt = `
Tu es un expert en produits Pokémon : cartes à l’unité, cartes gradées et produits scellés (boosters, displays, ETB, coffrets, tins).

Mission :
Nettoyer une liste d'annonces eBay vendues correspondant à une recherche utilisateur.
La recherche est : "${query}"
Analyse les objets suivants : ${JSON.stringify(items)}

Table de correspondance pour ETB / Coffret Dresseur D'Elite :
- ETB Rivalités Destinées ↔ EV 10
- ETB Flamme Fantasmagorique ↔ ME 02
- ETB Gardevoir Méga Evolution ↔ ME 01
- ETB Lucario Méga Evolution ↔ ME 01
- ETB Foudre Noire ↔ EV 10.5
- ETB Flamme Blanche ↔ EV 10.5
- ETB Aventures Ensemble ↔ EV 9
- ETB Evolutions Prismatiques ↔ EV 8.5
- ETB Etincelles Déferlantes ↔ EV 8
- ETB Couronne Stéllaire ↔ EV 7
- ETB Fable Nébuleuse ↔ EV 6.5
- ETB Mascarade Crépusculaire ↔ EV 6
- ETB Vert-de-Fer Forces Temporelles ↔ EV 5
- ETB Serpente Eaux Forces Temporelles ↔ EV 5
- ETB Destinées de Paldéa ↔ EV 4.5
- ETB Rugit Faille Paradoxe ↔ EV 4
- ETB Garde Faille Paradoxe ↔ EV 4
- ETB 151 ↔ EV 3.5
- ETB Flamme Obsidiennes ↔ EV 3
- ETB Evolutions à Paldéa ↔ EV 2
- ETB Koraidon Ecarlate et Violet ↔ EV 1
- ETB Miraidon Ecarlate et Violet  ↔ EV 1

Règles :
- Tolérance orthographique pour produits scellés.
- Ignorer les fautes mineures, accents manquants, majuscules/minuscules.
- Exemples valides pour “ETB Rivalités Destinées” :
  - Etb Rivalités destinés
  - Etb rivalité destiné
  - ETB rivalités destinées
  - Etb RIVALITÉS DESTINÉE
- Conserver uniquement les produits **SCELLÉS et COMPLETS** (non ouverts, tous boosters inclus).
- Correspondance ETB / Coffret Dresseur d’Élite.
- Cartes à l’unité strictes (orthographe exacte, édition, langue, variantes).
- Toujours rejeter : lots de cartes, classeurs, sleeves, top loaders, proxies, stickers, codes online.
- Produits scellés complets uniquement (non ouverts, tous boosters inclus).
- Priorité aux produits scellés si la recherche le mentionne.
- Sortie JSON STRICT : { valid: [{title, price, thumbnail, soldDate, condition, seller, url}], rejected: [{title, reason, thumbnail, url}] }
`;

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

    // Calculer minPrice côté serveur pour fiabilité
    if (result.valid && result.valid.length > 0) {
      const prices = result.valid
        .map((i: any) => Number(i.price))
        .filter((p: number) => !isNaN(p));
      result.minPrice = prices.length > 0 ? Math.min(...prices) : null;
    } else {
      result.minPrice = null;
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Erreur inconnue" }, { status: 500 });
  }
}
