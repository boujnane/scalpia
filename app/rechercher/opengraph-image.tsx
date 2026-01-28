import { generateOgImage, ogSize, ogContentType } from "@/lib/og-image"

export const runtime = "edge"
export const alt = "Rechercher des produits Pokémon - Pokéindex"
export const size = ogSize
export const contentType = ogContentType

export default async function Image() {
  return generateOgImage({
    title: "Rechercher",
    subtitle: "Trouvez et comparez les prix des ETB, displays et coffrets Pokémon",
  })
}
