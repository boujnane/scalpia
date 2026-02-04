import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Investir dans les cartes Pokémon : est-ce rentable ? | Pokéindex",
  description:
    "Analyse complète du marché des cartes Pokémon scellées : rentabilité, risques, produits les plus performants et conseils pour investir intelligemment. Données actualisées quotidiennement.",
  keywords: [
    "investir cartes pokémon",
    "cartes pokémon rentable",
    "investissement pokémon",
    "marché pokémon",
    "prix cartes pokémon",
    "pokémon scellé",
    "collection pokémon investissement",
    "display pokémon prix",
    "etb pokémon valeur",
    "booster pokémon investir",
  ],
  openGraph: {
    title: "Investir dans les cartes Pokémon : est-ce rentable ?",
    description:
      "Analyse complète du marché des cartes Pokémon scellées : rentabilité, risques et conseils pour investir.",
    url: "https://www.pokeindex.fr/investir-pokemon",
    siteName: "Pokéindex",
    locale: "fr_FR",
    type: "article",
    publishedTime: "2025-01-15T00:00:00Z",
    authors: ["Pokéindex"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Investir dans les cartes Pokémon : est-ce rentable ?",
    description:
      "Analyse complète du marché des cartes Pokémon scellées : rentabilité, risques et conseils.",
  },
  alternates: {
    canonical: "https://www.pokeindex.fr/investir-pokemon",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function InvestirPokemonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
