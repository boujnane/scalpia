// Schemas JSON-LD pour le SEO
// Documentation: https://schema.org

const BASE_URL = "https://www.pokeindex.fr"

// Types pour les breadcrumbs
type BreadcrumbItem = {
  name: string
  url?: string
}

// Génère le schema BreadcrumbList
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url ? `${BASE_URL}${item.url}` : undefined,
    })),
  }
}

// Schema Organisation (pour la page d'accueil)
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Pokéindex",
  url: BASE_URL,
  logo: `${BASE_URL}/logo/logo_pki.png`,
  description: "Observatoire indépendant des prix du marché Pokémon scellé francophone",
  foundingDate: "2024",
  sameAs: [],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    url: `${BASE_URL}/contact`,
    availableLanguage: ["French", "English"],
  },
}

// Schema WebApplication (enrichi)
export const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Pokéindex",
  description:
    "Comparateur de prix indépendant pour le marché secondaire Pokémon scellé. Agrège les données de Cardmarket, eBay, Vinted et LeBonCoin.",
  url: BASE_URL,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  browserRequirements: "Requires JavaScript",
  softwareVersion: "1.0",
  author: {
    "@type": "Organization",
    name: "Pokéindex",
  },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "EUR",
    lowPrice: "0",
    highPrice: "87",
    offerCount: 2,
    offers: [
      {
        "@type": "Offer",
        name: "Gratuit",
        price: "0",
        priceCurrency: "EUR",
        description: "Accès basique aux comparaisons de prix",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "9",
        priceCurrency: "EUR",
        priceValidUntil: "2026-12-31",
        description: "Analyses avancées, alertes prix, historique complet",
      },
    ],
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "150",
    bestRating: "5",
    worstRating: "1",
  },
  featureList: [
    "Comparaison de prix multi-plateformes",
    "Données Cardmarket, eBay, Vinted, LeBonCoin",
    "Analyse de tendances",
    "Alertes de prix",
    "Historique des prix",
    "Indicateurs de volatilité",
  ],
}

// Schema WebSite (pour la recherche sitelinks)
export const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Pokéindex",
  url: BASE_URL,
  description: "Observatoire des prix du marché Pokémon scellé",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/rechercher?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
}

// Schema FAQPage (pour la page LLM et méthodologie)
export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }
}

// Schema Service (pour la page tarifs)
export const pricingServiceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Pokéindex Pro",
  serviceType: "Price Comparison Service",
  provider: {
    "@type": "Organization",
    name: "Pokéindex",
    url: BASE_URL,
  },
  description: "Service d'analyse avancée des prix du marché Pokémon scellé",
  offers: [
    {
      "@type": "Offer",
      name: "Abonnement mensuel",
      price: "9",
      priceCurrency: "EUR",
      priceValidUntil: "2026-12-31",
      availability: "https://schema.org/InStock",
    },
    {
      "@type": "Offer",
      name: "Abonnement annuel",
      price: "87",
      priceCurrency: "EUR",
      priceValidUntil: "2026-12-31",
      availability: "https://schema.org/InStock",
      description: "2 mois offerts",
    },
  ],
  areaServed: {
    "@type": "Place",
    name: "France",
  },
  audience: {
    "@type": "Audience",
    audienceType: "Collectionneurs et investisseurs Pokémon",
  },
}

// Schema Article/Guide (pour la méthodologie)
export const methodologyArticleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Méthodologie Pokéindex - Collecte et analyse des prix",
  description:
    "Comment Pokéindex collecte, normalise et analyse les prix du marché Pokémon scellé depuis Cardmarket, eBay, Vinted et LeBonCoin.",
  author: {
    "@type": "Organization",
    name: "Pokéindex",
    url: BASE_URL,
  },
  publisher: {
    "@type": "Organization",
    name: "Pokéindex",
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/logo/logo_pki.png`,
    },
  },
  datePublished: "2024-01-01",
  dateModified: new Date().toISOString().split("T")[0],
  mainEntityOfPage: `${BASE_URL}/methodologie`,
  articleSection: "Documentation",
  keywords: ["méthodologie", "prix pokémon", "analyse marché", "collecte données"],
}

// Schema SoftwareApplication pour l'outil d'analyse
export const analyseToolSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Pokéindex Analyse",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description:
    "Outil d'analyse du marché Pokémon scellé avec tendances, volatilité et sentiment en temps réel",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
  },
  featureList: [
    "Tendances du marché en temps réel",
    "Indicateur de volatilité",
    "Analyse de sentiment",
    "Top movers (hausses/baisses)",
    "Graphiques interactifs",
  ],
}

// Schema ItemList pour les séries/produits
export function generateItemListSchema(
  items: { name: string; url: string; description?: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: `${BASE_URL}${item.url}`,
      description: item.description,
    })),
  }
}

// Composant JSON-LD réutilisable
export function JsonLd({ data }: { data: object | object[] }) {
  const schemas = Array.isArray(data) ? data : [data]

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}
