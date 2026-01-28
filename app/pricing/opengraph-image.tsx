import { generateOgImage, ogSize, ogContentType } from "@/lib/og-image"

export const runtime = "edge"
export const alt = "Tarifs Pokéindex - Gratuit et Pro"
export const size = ogSize
export const contentType = ogContentType

export default async function Image() {
  return generateOgImage({
    title: "Tarifs",
    subtitle: "Accès gratuit ou Pro pour des analyses avancées du marché Pokémon",
    badge: "Gratuit disponible",
  })
}
