// file: app/rechercher/page.tsx
'use client';
import SearchPage from '@/components/SearchPage';

export default function Page() {
  return (
    <>
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: "https://www.pokeindex.fr" },
              { "@type": "ListItem", position: 2, name: "Rechercher" },
            ],
          }),
        }}
      />
      {/* SearchResultsPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SearchResultsPage",
            name: "Recherche de produits Pokémon scellés",
            description: "Recherchez et comparez les prix des ETB, displays, coffrets Pokémon sur Cardmarket, eBay, Vinted et LeBonCoin",
            url: "https://www.pokeindex.fr/rechercher",
          }),
        }}
      />
      <SearchPage />
    </>
  );
}