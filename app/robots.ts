import type { MetadataRoute } from "next"

const BASE_URL = "https://www.pokeindex.fr"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/gestion-db",
          "/insert-db",
          "/login",
          "/register",
          "/pricing/success",
          "/en-construction",
          "/leboncoin",
          "/api/",
        ],
      },
      // Règles spécifiques pour les bots IA
      {
        userAgent: ["GPTBot", "ChatGPT-User", "Google-Extended", "CCBot", "anthropic-ai", "Claude-Web"],
        allow: ["/", "/llm", "/llms.txt", "/llms-full.txt", "/methodologie"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
