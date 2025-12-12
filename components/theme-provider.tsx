// components/theme-provider.tsx

"use client"

import { ThemeProvider as NextThemesProvider, ThemeProviderProps } from "next-themes"

/**
 * Encapsule votre application pour fournir le contexte de thème.
 * Il utilise "class" pour basculer entre les modes "light" et "dark" 
 * en utilisant la classe CSS ".dark" que nous avons définie.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}