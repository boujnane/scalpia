import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true, // facultatif mais recommandé
  turbopack: {
    root: path.resolve(__dirname), // indique le vrai root
  },
};

export default nextConfig;
