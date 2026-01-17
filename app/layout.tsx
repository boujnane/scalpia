import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar"; 
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/AuthContext";
import { TokenProvider } from "@/context/TokenContext";
import Footer from "@/components/layout/Footer";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pokéindex | Market Analytics",
  description: "L'observatoire des prix du marché Pokémon scellé francophone",
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
        <AuthProvider>
          <TokenProvider>
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
            </ThemeProvider>
          </TokenProvider>
        </AuthProvider>
      </body>
    </html>
  );
}