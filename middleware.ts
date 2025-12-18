// middleware.ts
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

/**
 * Routes à mettre "en chantier".
 * - exact: bloque uniquement /dashboard
 * - prefix: bloque /analyse-v2 et tout ce qui commence par /analyse-v2/...
 */
const UNDER_CONSTRUCTION = {
  exact: [
    // "/dashboard",
    // "/settings",
    "/rechercher"
  ],
  prefix: [
    // "/analyse-v2",
    // "/admin",
  ],
}

/**
 * Page cible (ta page "En construction")
 */
const MAINTENANCE_PATH = "/en-construction"

/**
 * Optionnel : permettre de bypass avec un paramètre ?preview=1
 * (utile pour toi, pour tester en prod sans bloquer)
 */
const ALLOW_PREVIEW_QUERY_KEY = "preview"

function isStaticAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") || // enlève ceci si tu veux aussi bloquer des routes API
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.includes(".") // images, fonts, etc.
  )
}

function isBlocked(pathname: string) {
  if (UNDER_CONSTRUCTION.exact.includes(pathname)) return true
  return UNDER_CONSTRUCTION.prefix.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  )
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Laisse passer les assets / Next internals
  if (isStaticAsset(pathname)) return NextResponse.next()

  // Ne boucle pas sur la page de maintenance
  if (pathname === MAINTENANCE_PATH) return NextResponse.next()

  // Bypass optionnel
  const preview = req.nextUrl.searchParams.get(ALLOW_PREVIEW_QUERY_KEY)
  if (preview === "1") return NextResponse.next()

  // Si route bloquée → redirect
  if (isBlocked(pathname)) {
    const url = req.nextUrl.clone()
    url.pathname = MAINTENANCE_PATH

    // Optionnel : garder l’URL demandée pour l’afficher sur la page
    url.searchParams.set("from", pathname)

    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

/**
 * Matcher global : on intercepte toutes les routes
 * (les exclusions sont gérées par isStaticAsset)
 */
export const config = {
  matcher: ["/:path*"],
}
