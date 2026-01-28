import { generateOgImage, ogSize, ogContentType } from "@/lib/og-image"

export const runtime = "edge"
export const alt = "Contact Pokéindex"
export const size = ogSize
export const contentType = ogContentType

export default async function Image() {
  return generateOgImage({
    title: "Contact",
    subtitle: "Une question ? Contactez l'équipe Pokéindex",
  })
}
