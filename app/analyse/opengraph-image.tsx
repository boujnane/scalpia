import { generateOgImage, ogSize, ogContentType } from "@/lib/og-image"

export const runtime = "edge"
export const alt = "Analyse du marché Pokémon - Pokéindex"
export const size = ogSize
export const contentType = ogContentType

export default async function Image() {
  return generateOgImage({
    title: "Analyse du marché",
    subtitle: "Tendances, volatilité et sentiment du marché Pokémon scellé en temps réel",
    badge: "Données live",
  })
}
