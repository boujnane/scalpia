import { ImageResponse } from "next/og"

export const runtime = "edge"

export const alt = "Pokéindex - Observatoire des prix Pokémon scellés"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #0f0a1e 0%, #1a1333 40%, #2d1f4e 70%, #1a1333 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decorative elements */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -150,
            left: -150,
            width: 500,
            height: 500,
            background: "radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Subtle grid pattern overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Main content container with glass effect */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "50px 80px",
            background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
            borderRadius: 32,
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 32,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://www.pokeindex.fr/logo/logo_pki.png"
              alt="Pokéindex"
              width={160}
              height={160}
              style={{
                filter: "drop-shadow(0 8px 24px rgba(139,92,246,0.3))",
              }}
            />
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: 72,
              fontWeight: 700,
              background: "linear-gradient(135deg, #ffffff 0%, #e0e7ff 50%, #c4b5fd 100%)",
              backgroundClip: "text",
              color: "transparent",
              margin: 0,
              letterSpacing: "-2px",
              textAlign: "center",
            }}
          >
            Pokéindex
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 26,
              color: "rgba(255,255,255,0.7)",
              margin: "16px 0 0 0",
              textAlign: "center",
              fontWeight: 400,
              letterSpacing: "0.5px",
            }}
          >
            L&apos;observatoire expert des prix Pokémon scellés
          </p>
        </div>

        {/* Data sources badges */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 40,
          }}
        >
          {["Cardmarket", "eBay", "Vinted", "LeBonCoin"].map((source) => (
            <div
              key={source}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "10px 20px",
                borderRadius: 100,
                color: "rgba(255,255,255,0.6)",
                fontSize: 15,
                fontWeight: 500,
              }}
            >
              {source}
            </div>
          ))}
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              background: "#22c55e",
              borderRadius: "50%",
              boxShadow: "0 0 12px #22c55e",
            }}
          />
          <span
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: "1px",
            }}
          >
            pokeindex.fr
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
