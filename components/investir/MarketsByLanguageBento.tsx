"use client";

import { Globe, Store, Coins, Package, AlertTriangle } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BentoGrid, BentoTile } from "@/components/investir/Bento";

type MarketKey = "fr" | "en" | "jp" | "kr" | "cn";

/**
 * Angle : perception & comportement SUR le marché français
 * (langue de la carte/produit → demande FR, liquidité, prime, contraintes)
 */
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
    title: "Cartes FR (marché français)",
    sealed: [
      "Demande locale forte sur certains scellés FR : rupture rapide quand la série est attendue.",
      "Prime possible sur des références “collection” (ETB/UPC/produits marquants), mais très dépendante du set.",
      "Les promos FR spécifiques peuvent créer des poches de rareté, surtout quand elles sont identifiables.",
    ],
    singles: [
      "Liquidité souvent inférieure à l’anglais : moins d’acheteurs “globaux”, surtout sur les grosses chase.",
      "Certaines cartes se vendent très bien en FR (nostalgie/collection locale), mais le prix n’est pas toujours la référence mondiale.",
      "La condition et la confiance (photos, authenticité) pèsent davantage sur la décision d’achat.",
    ],
    platforms: ["Cardmarket", "Vinted", "Leboncoin", "eBay", "Salons/boutiques"],
    watch: [
      "Sur petits tickets : frais/ports pèsent lourd → comparer le net.",
      "Scellé : attention aux retours, re-scells et photos “trop propres”.",
    ],
  },

  en: {
    label: "EN/US",
    title: "Cartes EN (référence internationale)",
    sealed: [
      "Souvent plus simple à comparer : historique de ventes et volume global plus élevé.",
      "Sur certains produits, moins de “prime locale” que le FR, mais une demande plus large.",
      "Le scellé EN/US est très recherché sur les références iconiques, surtout en vintage.",
    ],
    singles: [
      "Langue la plus liquide : c’est souvent la référence de prix sur les chase majeures.",
      "Le grading influence fortement la demande (PSA/CGC/BGS) et la facilité de revente.",
      "Pour les cartes “globales”, l’EN domine généralement en profondeur d’acheteurs.",
    ],
    platforms: ["Cardmarket (EU)", "eBay", "TCGplayer (US)", "Whatnot/streams"],
    watch: [
      "Import, TVA/douanes selon provenance : ça change le net.",
      "Hype internationale : risque de surpayer quand le volume s’emballe.",
    ],
  },

  jp: {
    label: "JP",
    title: "Cartes JP (premium collection)",
    sealed: [
      "Le scellé JP est très collectionné : perception premium, séries et promos souvent spécifiques.",
      "Certaines sorties prennent de l’avance en dynamique : le mouvement peut précéder l’Occident.",
      "Quand ça part, ça part vite — mais l’intérêt peut être cyclique selon les sets.",
    ],
    singles: [
      "Forte demande sur les cartes iconiques et les full arts : prime possible sur l’état/qualité d’impression.",
      "Très bon marché sur les “hits”, plus irrégulier sur le reste : attention aux séries peu suivies en FR.",
      "La liquidité dépend beaucoup de l’audience (acheteurs JP/EN vs acheteurs FR).",
    ],
    platforms: ["eBay", "Boutiques import", "Yahoo! Auctions (via proxy)", "Mercari (via proxy)"],
    watch: [
      "Frais proxy + port + douanes : peuvent coûter très cher.",
      "Authenticité & versions : documenter précisément, surtout sur promos/éditions.",
    ],
  },

  kr: {
    label: "KR",
    title: "Cartes KR (niche en France)",
    sealed: [
      "Souvent plus accessible en prix, mais audience plus étroite en France.",
      "Peut performer ponctuellement quand la demande se déplace vers des alternatives (curiosité / rareté perçue).",
      "À traiter comme un segment opportuniste, pas comme un standard.",
    ],
    singles: [
      "Certaines cartes deviennent recherchées (effet niche), mais beaucoup restent difficiles à écouler au bon prix.",
      "La demande dépend énormément de la communauté : la liquidité est le point clé.",
      "Plus tu es “hors hit”, plus la revente devient incertaine.",
    ],
    platforms: ["eBay", "Communautés", "Boutiques import"],
    watch: [
      "Spreads élevés : achat/revente peut coûter cher, surtout sur petites ventes.",
      "Privilégier des cibles claires (hits, promos, séries cultes) plutôt que du “random”.",
    ],
  },

  cn: {
    label: "CN",
    title: "Cartes CN (très segmenté)",
    sealed: [
      "Beaucoup de variantes/versions : comprendre le produit avant d’acheter (édition, région, packaging).",
      "Certaines exclusivités et promos attirent une demande croissante, mais le marché FR reste de niche.",
      "Potentiel sur des pièces identifiables, mais l’historique de prix est souvent moins lisible.",
    ],
    singles: [
      "Exclusivités/promos peuvent créer de vraies raretés, mais la liquidité est très hétérogène en France.",
      "Le “prix juste” est plus dur à ancrer sans comparables solides.",
      "Segment pour collectionneurs avertis : documentation et provenance sont clés.",
    ],
    platforms: ["Communautés spécialisées", "Boutiques import", "eBay"],
    watch: [
      "Confusion versions/éditions : archiver preuves, références et photos détaillées.",
      "Frais et délais d’import : calculer le net avant d’acheter.",
    ],
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
              {market.title}
            </p>
            <h3 className="mt-1 text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" aria-hidden="true" />
              Scellé : comportement en France
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
          Cartes à l’unité : perception FR
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
          Points d’attention (marché FR)
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
