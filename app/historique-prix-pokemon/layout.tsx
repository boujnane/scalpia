import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Historique des prix Pokémon scellés | Pokéindex",
  description:
    "Suivez l'évolution des prix des blisters, displays et coffrets Pokémon scellés. Données historiques du marché secondaire français mises à jour quotidiennement.",
  keywords: [
    "historique prix pokémon",
    "évolution prix pokémon",
    "prix blister pokémon historique",
    "prix display pokémon",
    "tendance marché pokémon",
    "graphique prix pokémon",
    "cours pokémon scellé",
    "prix etb pokémon",
    "prix coffret pokémon",
    "marché secondaire pokémon",
  ],
  openGraph: {
    title: "Historique des prix Pokémon scellés",
    description:
      "Suivez l'évolution des prix des blisters, displays et coffrets Pokémon scellés avec des graphiques interactifs.",
    url: "https://www.pokeindex.fr/historique-prix-pokemon",
    siteName: "Pokéindex",
    locale: "fr_FR",
    type: "article",
    publishedTime: "2025-01-15T00:00:00Z",
    authors: ["Pokéindex"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Historique des prix Pokémon scellés",
    description:
      "Suivez l'évolution des prix des blisters, displays et coffrets Pokémon scellés.",
  },
  alternates: {
    canonical: "https://www.pokeindex.fr/historique-prix-pokemon",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HistoriquePrixPokemonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
