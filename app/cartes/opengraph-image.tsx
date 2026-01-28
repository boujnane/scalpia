import { generateOgImage, ogSize, ogContentType } from "@/lib/og-image"

export const runtime = "edge"
export const alt = "Recherche par série Pokémon - Pokéindex"
export const size = ogSize
export const contentType = ogContentType

export default async function Image() {
  return generateOgImage({
    title: "Recherche par série",
    subtitle: "Explorez toutes les séries Pokémon et comparez les prix des produits scellés",
  })
}
