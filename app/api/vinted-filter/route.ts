import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  const body = await req.json();
  const { query, items } = body;
 
  const prompt = `
Tu es un expert en produits Pokémon : cartes à l’unité, cartes gradées et produits scellés (boosters, displays, ETB, coffrets, tins).

Mission :
Nettoyer une liste d'annonces Vinted correspondant à une recherche utilisateur.

La recherche est :
"${query}"

Analyse les objets suivants :
${JSON.stringify(items)}

RÈGLES DE FILTRAGE POUR LES PRODUITS SCELLÉS :

0️⃣ PRINCIPES DE TOLÉRANCE (IMPORTANT)
- Si un item semble correspondre au produit recherché mais que certains détails manquent ou sont ambigus, **garder** l’item.
- Ne rejette que si c’est clairement un autre produit, ouvert/vidé, ou un accessoire.
- Tolère les abréviations (ETB, EV, SWSH, SV), le FR/EN mélangé, et les erreurs mineures.
- Pour les produits scellés, accepter les variantes de taille/format si elles correspondent au même set/série.

1️⃣ Tolérance orthographique
- Ignorer les fautes mineures, accents manquants, majuscules/minuscules.
- Exemples valides pour “ETB Rivalités Destinées” :
  - Etb Rivalités destinés
  - Etb rivalité destinée
  - ETB rivalités destinées
  - Etb RIVALITÉS DESTINÉES
- Conserver uniquement les produits **SCELLÉS et COMPLETS** (non ouverts, tous boosters inclus), IL FAUT EXCLURE TOUT CE QUI EST **RECONDITIONNE**, **VIDE**, **TROU**.

2️⃣ Correspondances ETB / EV / Coffret Dresseur d’Élite
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
- **Note** : ETB = Coffret Dresseur d’Élite, donc accepter toutes les mentions “Coffret Dresseur d’Élite” correspondant à la série EV ou ME.

3️⃣ Displays / Demi‑display / Boîtes de boosters
- Considérer comme **valide** pour une recherche de display :
  - "demi display", "half display", "1/2 display", "display x18", "boîte 18 boosters".
- Ne pas rejeter un item si le titre contient "demi display" + le nom de la série (ex: Faille Paradoxe).
- Rejeter uniquement si c’est un lot mixte ou un produit ouvert/vidé.

4️⃣ Cartes à l’unité
- Plutôt strict mais pas excessif : le nom de la carte doit correspondre, mais tolérer accents, FR/EN,
  et variantes de formulation (ex: "holo" vs "holographique").
- Rejeter si le nom de carte est différent ou si c’est un lot/accessoire.

5️⃣ LOTS et accessoires
- Toujours rejeter : lots de cartes, classeurs, sleeves, top loaders, proxies, stickers, codes online.
- Pour les produits scellés : accepter un lot uniquement si c’est **le même produit scellé**
  (ex: "lot de 2 ETB Rivalités Destinées") et bien scellé. Rejeter les lots mixtes.

6️⃣ Priorité
- Si la recherche est un produit scellé → conserver les produits scellés correspondant au **fuzzy match** ET à la table de correspondance EV/ME.
- Si la recherche est une carte → conserver uniquement les cartes exactes.

7️⃣ FORMAT DE SORTIE
Produire un JSON STRICT, sans texte additionnel :

{
  "valid": [
    { "title": string, "price": number, "thumbnail": string, "url": string}
  ],
  "minPrice": number | null,
  "rejected": [
    { "title": string, "reason": string }
  ]
}

- "minPrice" = prix minimal parmi les objets valides, sinon null.
- "rejected" = liste des items exclus, avec la raison.

`;

const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
  });
  
  // Sécurise le contenu
  const content = completion.choices?.[0]?.message?.content;
  
  if (!content) {
    return NextResponse.json(
      { error: "Réponse vide du modèle Groq" },
      { status: 500 }
    );
  }
  
  // Parse JSON
  let result = JSON.parse(content);

  // Calculer minPrice côté serveur pour plus de fiabilité
  if (result.valid && result.valid.length > 0) {
    const prices = result.valid
      .map((i: any) => Number(i.price))
      .filter((p: number) => !isNaN(p));
    result.minPrice = prices.length > 0 ? Math.min(...prices) : null;
  } else {
    result.minPrice = null;
  }

  return NextResponse.json(result);
}
