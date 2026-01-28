import { generateOgImage, ogSize, ogContentType } from "@/lib/og-image"

export const runtime = "edge"
export const alt = "Méthodologie Pokéindex - Transparence des données"
export const size = ogSize
export const contentType = ogContentType

export default async function Image() {
  return generateOgImage({
    title: "Méthodologie",
    subtitle: "Comment nous collectons et analysons les prix du marché Pokémon scellé",
    badge: "Transparence",
  })
}
