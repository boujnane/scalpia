import { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "fr.pokeindex.app",
  appName: "Pokeindex",
  webDir: "public",
  server: {
    url: "https://pokeindex.fr",
  },
}

export default config
