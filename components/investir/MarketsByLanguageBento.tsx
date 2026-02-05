"use client";

import { Globe, Store, Coins, Package, AlertTriangle } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BentoGrid, BentoTile } from "@/components/investir/Bento";

type MarketKey = "fr" | "en" | "jp" | "kr" | "cn";

const markets: Record<
  MarketKey,
  {
    label: string;
    title: string;
    sealed: string[];
    singles: string[];
    platforms: string[];
    watch: string[];
  }
> = {
  fr: {
    label: "FR",
    title: "Francophone",
    sealed: [
      "Prime fréquente sur certains scellés (offre locale plus contrainte, demande FR).",
      "Écarts importants selon série : tout ne surperforme pas.",
      "Revente souvent via audience “collection” (ETB, coffrets, vintage).",
    ],
    singles: [
      "Marché plus petit : prix parfois plus hauts, mais moins de profondeur d’acheteurs.",
      "Les cartes “globales” (ultra recherchées) restent très tirées par l’anglais.",
      "Les promos FR spécifiques peuvent créer des poches de rareté.",
    ],
    platforms: ["Cardmarket", "eBay", "Vinted", "Leboncoin", "Salons/boutiques"],
    watch: [
      "Frais + port : impacte beaucoup le net sur les petits tickets.",
      "Photos/scellage : re-scells et “retours” existent aussi sur le scellé.",
    ],
  },
  en: {
    label: "EN/US",
    title: "Anglophone",
    sealed: [
      "Très grande liquidité sur certaines références, surtout US.",
      "Diffusion plus large : parfois moins de prime, mais plus de volume.",
      "Arbitrage facilité (comparables, historiques, ventes réalisées).",
    ],
    singles: [
      "Langue la plus “globale” : demande internationale, revente plus facile.",
      "Le grading a souvent plus d’impact sur la liquidité (PSA/CGC/BGS).",
      "Sur les cartes phare, l’EN peut être la référence de prix.",
    ],
    platforms: ["eBay", "TCGplayer (US)", "Cardmarket (EU)", "Whatnot/streams"],
    watch: ["Import, TVA/douanes selon provenance.", "Risque de surpayer la hype à l’international."],
  },
  jp: {
    label: "JP",
    title: "Japonais",
    sealed: [
      "Sorties parfois plus tôt : la dynamique peut précéder l’Occident.",
      "Produits JP très collectionnés (qualité perçue, exclusivités).",
      "Le scellé JP se comporte souvent comme un marché “premium” (mais cyclique).",
    ],
    singles: [
      "Cartes JP iconiques très demandées, parfois avec prime d’état.",
      "Liquidité variable hors des “hits” : attention aux séries moins suivies.",
      "La revente dépend fortement de l’audience (FR/EN/JP).",
    ],
    platforms: ["Yahoo! Auctions (via proxy)", "Mercari (via proxy)", "eBay", "Boutiques import"],
    watch: ["Frais proxy + port + douanes peuvent annihiler le rendement.", "S’assurer de l’authenticité des scellés importés."],
  },
  kr: {
    label: "KR",
    title: "Coréen",
    sealed: [
      "Ticket d’entrée souvent plus bas (selon produit) mais audience plus étroite.",
      "Opportunités ponctuelles quand la demande se déplace vers des langues alternatives.",
      "Marché plus “niche” : la liquidité est le point clé.",
    ],
    singles: [
      "Certaines cartes deviennent recherchées par effet de rareté perçue + curiosité.",
      "Mais beaucoup de références restent difficiles à écouler au bon prix.",
      "À traiter comme une position opportuniste, pas un socle.",
    ],
    platforms: ["eBay", "Groupes/communautés", "Import boutiques"],
    watch: ["Spreads élevés : achat/revente peut coûter cher.", "Privilégier des cibles claires (promos, hits, séries cultes)."],
  },
  cn: {
    label: "CN",
    title: "Chinois (en forte traction)",
    sealed: [
      "Marché en expansion : hausse d’attention sur certaines sorties et promos.",
      "Segmentation à comprendre (produits, régions, versions) avant de se positionner.",
      "Potentiel, mais volatilité plus élevée (effet nouveauté).",
    ],
    singles: [
      "Certaines exclusivités/promos peuvent créer des poches de rareté.",
      "Liquidité très hétérogène selon la communauté ciblée.",
      "Le prix “juste” est plus dur à ancrer sans historique solide.",
    ],
    platforms: ["eBay", "Import boutiques", "Communautés spécialisées"],
    watch: ["Risque de confusion versions/éditions : documenter précisément.", "Frais et délais d’import : calculer le net avant d’acheter."],
  },
};

function MarketPanel({ marketKey }: { marketKey: MarketKey }) {
  const market = markets[marketKey];

  return (
    <BentoGrid className="grid-cols-1 md:grid-cols-12">
      <BentoTile accent="primary" className="md:col-span-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" aria-hidden="true" />
              Marché {market.title}
            </p>
            <h3 className="mt-1 text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" aria-hidden="true" />
              Scellé : comment ça bouge
            </h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {market.label}
          </Badge>
        </div>
        <ul className="mt-4 space-y-2 text-xs sm:text-sm text-muted-foreground">
          {market.sealed.map((item) => (
            <li key={item} className="leading-relaxed">
              • {item}
            </li>
          ))}
        </ul>
      </BentoTile>

      <BentoTile accent="neutral" className="md:col-span-5">
        <div className="flex items-center gap-2 text-base sm:text-lg font-semibold text-foreground">
          <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" aria-hidden="true" />
          Cartes à l’unité : la réalité
        </div>
        <ul className="mt-4 space-y-2 text-xs sm:text-sm text-muted-foreground">
          {market.singles.map((item) => (
            <li key={item} className="leading-relaxed">
              • {item}
            </li>
          ))}
        </ul>
      </BentoTile>

      <BentoTile accent="blue" className="md:col-span-4">
        <div className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Store className="w-4 h-4 text-sky-500" aria-hidden="true" />
          Plateformes typiques
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {market.platforms.map((p) => (
            <Badge key={p} variant="secondary" className="text-xs">
              {p}
            </Badge>
          ))}
        </div>
      </BentoTile>

      <BentoTile accent="warning" className="md:col-span-8">
        <div className="flex items-center gap-2 text-base font-semibold text-foreground">
          <AlertTriangle className="w-4 h-4 text-amber-500" aria-hidden="true" />
          À surveiller avant d’investir
        </div>
        <ul className="mt-3 space-y-2 text-xs sm:text-sm text-muted-foreground">
          {market.watch.map((item) => (
            <li key={item} className="leading-relaxed">
              • {item}
            </li>
          ))}
        </ul>
      </BentoTile>
    </BentoGrid>
  );
}

export function MarketsByLanguageBento() {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="fr">
        <TabsList className="w-full justify-between sm:justify-start sm:gap-1">
          <TabsTrigger value="fr">FR</TabsTrigger>
          <TabsTrigger value="en">EN/US</TabsTrigger>
          <TabsTrigger value="jp">JP</TabsTrigger>
          <TabsTrigger value="kr">KR</TabsTrigger>
          <TabsTrigger value="cn">CN</TabsTrigger>
        </TabsList>

        <TabsContent value="fr" className="mt-4">
          <MarketPanel marketKey="fr" />
        </TabsContent>
        <TabsContent value="en" className="mt-4">
          <MarketPanel marketKey="en" />
        </TabsContent>
        <TabsContent value="jp" className="mt-4">
          <MarketPanel marketKey="jp" />
        </TabsContent>
        <TabsContent value="kr" className="mt-4">
          <MarketPanel marketKey="kr" />
        </TabsContent>
        <TabsContent value="cn" className="mt-4">
          <MarketPanel marketKey="cn" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
