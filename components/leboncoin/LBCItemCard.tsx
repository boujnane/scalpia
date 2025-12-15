// components/LBCItemCard.tsx
import React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

export type LBCOffer = {
  title: string;
  price: string;
  location: string;
  category: string;
  link: string | null;
  image?: string | null;
  rejected?: string;
};

interface LBCItemCardProps {
  offer: LBCOffer;
  onClick?: () => void;
}

const LBCItemCard: React.FC<LBCItemCardProps> = ({ offer, onClick }) => {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      className={`
        group border border-border rounded-2xl shadow-md bg-card 
        overflow-hidden p-4 flex flex-row items-center transition-all duration-300
        ${onClick ? "cursor-pointer hover:shadow-xl hover:scale-105" : ""}
      `}
    >
      {/* Image */}
      {offer.image && (
        <div className="w-36 h-36 sm:w-40 sm:h-40 relative flex-shrink-0 flex items-center justify-center bg-secondary/20 rounded-xl overflow-hidden border border-border/50 mr-4">
          <Image
            src={offer.image}
            alt={offer.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-contain hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Contenu texte */}
      <div className="flex flex-col justify-between flex-1 h-full">
        {/* Titre */}
        <h3 className="font-semibold text-lg sm:text-xl text-foreground mb-1 line-clamp-2">
          {offer.title}
        </h3>

        {/* Prix */}
        <span className="text-primary font-bold text-lg sm:text-xl mb-2">{offer.price}</span>

        {/* Catégorie et lieu */}
        <div className="flex flex-col gap-1 text-muted-foreground text-sm mb-2">
          <span>
            <span className="font-semibold">Catégorie :</span> {offer.category}
          </span>
          <span>
            <span className="font-semibold">Lieu :</span> {offer.location}
          </span>
        </div>

        {/* Lien */}
        {offer.link && (
          <a
            href={offer.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline text-sm hover:text-primary/80 mt-auto"
          >
            Voir l'annonce
          </a>
        )}
      </div>
    </div>
  );
};

export default LBCItemCard;
