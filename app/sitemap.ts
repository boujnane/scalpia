import type { MetadataRoute } from "next"

const BASE_URL = "https://www.pokeindex.fr"

type SitemapEntry = {
  url: string
  lastModified: Date
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  priority: number
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // Pages principales avec haute priorité
  const mainPages: SitemapEntry[] = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/analyse`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/cartes`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/rechercher`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
  ]

  // Pages secondaires
  const secondaryPages: SitemapEntry[] = [
    {
      url: `${BASE_URL}/pricing`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/methodologie`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/a-propos`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ]

  // Pages LLM/SEO
  const seoPages: SitemapEntry[] = [
    {
      url: `${BASE_URL}/llm`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/investir-pokemon`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/historique-prix-pokemon`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ]

  // Pages légales (basse priorité)
  const legalPages: SitemapEntry[] = [
    {
      url: `${BASE_URL}/cgu`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/mentions-legales`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ]

  // Pages exclues du sitemap (non indexées):
  // - /login, /register, /login/confirm (auth)
  // - /admin, /gestion-db, /insert-db (admin)
  // - /pricing/success (post-payment)
  // - /en-construction (placeholder)
  // - /leboncoin (internal tool)
  // - (aucune) pages SEO utilitaires sont indexées

  return [...mainPages, ...secondaryPages, ...seoPages, ...legalPages]
}
