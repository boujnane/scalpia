import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true, // facultatif mais recommandé
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.leboncoin.fr",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "assets.tcgdex.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.tcggo.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
