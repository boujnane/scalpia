import { generateOgImage, ogSize, ogContentType } from "@/lib/og-image"

export const runtime = "edge"
export const alt = "Pokéindex pour LLM et IA"
export const size = ogSize
export const contentType = ogContentType

export default async function Image() {
  return generateOgImage({
    title: "Informations LLM",
    subtitle: "Documentation pour les assistants IA et moteurs de recherche génératifs",
    badge: "Pour IA",
  })
}
