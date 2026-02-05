import Image from "next/image";
import { Package, Sparkles, Layers, Gift } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { BentoGrid, BentoTile } from "@/components/investir/Bento";

export function ProductsBento() {
  return (
    <BentoGrid className="grid-cols-1 md:grid-cols-12">
      <BentoTile
        accent="primary"
        className="md:col-span-7 group relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        tabIndex={0}
      >
        <div className="relative z-10 group-hover:blur-[1.5px] group-hover:opacity-40 group-focus-within:blur-[1.5px] group-focus-within:opacity-40 sm:transition-all sm:duration-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Format le plus “market-fit”</p>
              <h3 className="mt-1 text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" aria-hidden="true" />
                ETB (Coffret Dresseur d'Elite ou Elite Trainer Box)
              </h3>
            </div>
            <Badge variant="secondary" className="text-xs">
              Top performer
            </Badge>
          </div>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Sur le long terme, les ETB sont historiquement les formats les plus performants : elles partent plus vite en rupture que les autres produits et conservent mieux la demande. Leur packaging distinctif, les accessoires inclus et certaines éditions marquantes (Pokémon Center, promos, séries fortes) en font un format privilégié par les collectionneurs, au-delà des usages purement utilitaires.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              Bonne demande
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Facile à stocker
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Giftable
            </Badge>
          </div>
        </div>

        <HoverPhoto src="/ETB/ETBEB10.png" className="right-2 bottom-2 h-32 w-32 sm:h-52 sm:w-52" />
      </BentoTile>

      <BentoTile
        accent="purple"
        className="md:col-span-5 group relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        tabIndex={0}
      >
        <div className="relative z-10 group-hover:blur-[1.5px] group-hover:opacity-40 group-focus-within:blur-[1.5px] group-focus-within:opacity-40 sm:transition-all sm:duration-200">
          <div className="flex items-center gap-2 text-base sm:text-lg font-semibold text-foreground">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" aria-hidden="true" />
            Éditions limitées & anniversaires
          </div>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            UPC, coffrets “anniversaire” et produits exclusifs portent souvent une prime élevée car ils sont plus difficiles à obtenir et très rapidement absorbés par une forte demande. Leur disponibilité limitée et l’attrait des éditions spéciales expliquent l’essentiel de leur valorisation.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              Haut potentiel
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Volatilité
            </Badge>
          </div>
        </div>

        <HoverPhoto
          src="/Coffret/CoffretCelDracaufeu.png"
          className="right-2 bottom-2 h-32 w-32 sm:h-48 sm:w-48"
        />
      </BentoTile>

      <BentoTile
        accent="blue"
        className="md:col-span-4 group relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        tabIndex={0}
      >
        <div className="relative z-10 group-hover:blur-[1.5px] group-hover:opacity-40 group-focus-within:blur-[1.5px] group-focus-within:opacity-40 sm:transition-all sm:duration-200">
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Gift className="w-4 h-4 text-sky-500" aria-hidden="true" />
            Coffrets
          </div>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Format très hétérogène : parfois exclusif magasin, parfois multi-séries, parfois centré sur un seul set. Les coffrets sont un véritable fourre-tout, ce qui rend leur performance très variable et fortement dépendante du contenu, du thème et du timing.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              Premium
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Variable
            </Badge>
          </div>
        </div>

        <HoverPhoto
          src="/Coffret/CoffretEauxFlorissantesEV3.5.png"
          className="-right-2 -bottom-8 sm:-bottom-18 h-48 w-48 sm:h-56 sm:w-56"
        />
      </BentoTile>

      <BentoTile
        accent="neutral"
        className="md:col-span-4 group relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        tabIndex={0}
      >
        <div className="relative z-10 group-hover:blur-[1.5px] group-hover:opacity-40 group-focus-within:blur-[1.5px] group-focus-within:opacity-40 sm:transition-all sm:duration-200">
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Layers className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            Displays (36 boosters)
          </div>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Bon ratio coût/booster et liquidité correcte, mais une croissance plus lente que les ETB. Les displays restent souvent disponibles plus longtemps après la sortie, car largement distribués (kiosques, tabacs), ce qui limite la rareté perçue.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              Bon ratio
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Demande stable
            </Badge>
          </div>
        </div>

        <HoverPhoto src="/Display/DisplayEB8.png" className="right-2 bottom-2 h-32 w-32 sm:h-44 sm:w-44" />
      </BentoTile>

      <BentoTile
        accent="success"
        className="md:col-span-4 group relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        tabIndex={0}
      >
        <div className="relative z-10 group-hover:blur-[1.5px] group-hover:opacity-40 group-focus-within:blur-[1.5px] group-focus-within:opacity-40 sm:transition-all sm:duration-200">
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Package className="w-4 h-4 text-emerald-500" aria-hidden="true" />
            Boosters / blisters
          </div>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Les blisters constituent un segment à part : historiquement en plastique, désormais exclusivement en carton, une différence de prix notable. Les artsets complets se valorisent bien côté collection. À l’inverse, les boosters à l’unité sont surtout destinés à l’ouverture car risque de rescellés.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              Accessible
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Très liquide
            </Badge>
          </div>
        </div>

        <HoverPhoto src="/Blister/illu_blister.png" className="-right-3 bottom-2 sm: h-32 w-32 sm:h-48 sm:w-48" />
      </BentoTile>
    </BentoGrid>
  );
}

function HoverPhoto({
  src,
  className = "",
}: {
  src: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute ${className} z-30 opacity-0 sm:translate-y-2 sm:scale-[0.98] sm:-rotate-2 group-hover:opacity-100 sm:group-hover:translate-y-0 sm:group-hover:scale-100 sm:group-hover:rotate-0 group-focus-within:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:scale-100 sm:group-focus-within:rotate-0 sm:transition-all sm:duration-300 sm:ease-out`}
    >
      <Image src={src} alt="" fill sizes="240px" className="object-contain drop-shadow-xl" />
    </div>
  );
}
