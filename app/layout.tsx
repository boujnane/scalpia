import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar"; 
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/AuthContext";
import { TokenProvider } from "@/context/TokenContext";
import { CookieConsentProvider } from "@/context/CookieConsentContext";
import { TutorialProvider } from "@/context/TutorialContext";
import Footer from "@/components/layout/Footer";
import CookieBanner from "@/components/CookieBanner";
import { TutorialOverlay } from "@/components/tutorial/TutorialOverlay";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { PostHogProvider } from "./providers";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.pokeindex.fr"),
  title: {
    default: "Pokéindex",
    template: "%s | Pokéindex",
  },
  description: "L'observatoire des prix du marché Pokemon scellé francophone. Pokéindex est un index indépendant des prix Pokémon scellés. Analyse des tendances, historique des prix et données consolidées depuis Cardmarket, eBay, Vinted et LeBonCoin.",
  applicationName: "Pokéindex",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "index pokemon scelle",
    "prix pokemon scelle",
    "analyse marche pokemon",
    "analyse marche scelle pokemon",
    "index items scelles pokemon",
    "pokemon price index",
    "pokemon sealed market",
    "cardmarket pokemon",
    "vinted pokemon",
    "ebay pokemon",
  ],
  openGraph: {
    type: "website",
    url: "https://www.pokeindex.fr",
    siteName: "Pokéindex",
    title: "Pokéindex",
    description: "L'observatoire des prix du marché Pokemon scellé francophone.",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pokéindex",
    description: "L'observatoire des prix du marché Pokemon scellé francophone.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground flex flex-col`}
      >
        <CookieConsentProvider>
          <PostHogProvider>
            <AuthProvider>
              <TokenProvider>
                <TutorialProvider>
                  <ThemeProvider
                      attribute="class"
                      defaultTheme="system"
                      enableSystem
                      disableTransitionOnChange
                      >
                      <Navbar />
                      <main className="flex-1 w-full">
                        {children}
                        <SpeedInsights />
                        <Analytics />
                      </main>
                      <Footer />
                      <CookieBanner />
                      <TutorialOverlay />
                  </ThemeProvider>
                </TutorialProvider>
              </TokenProvider>
            </AuthProvider>
          </PostHogProvider>
        </CookieConsentProvider>
      </body>
    </html>
  );
}
