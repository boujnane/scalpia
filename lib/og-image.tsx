import { ImageResponse } from "next/og"

export const runtime = "edge"

export const ogSize = {
  width: 1200,
  height: 630,
}

export const ogContentType = "image/png"

type OgImageProps = {
  title: string
  subtitle?: string
  badge?: string
}

export function generateOgImage({ title, subtitle, badge }: OgImageProps) {
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

        {/* Subtle grid pattern */}
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

        {/* Badge */}
        {badge && (
          <div
            style={{
              position: "absolute",
              top: 40,
              right: 50,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(236,72,153,0.2) 100%)",
              border: "1px solid rgba(255,255,255,0.15)",
              padding: "10px 20px",
              borderRadius: 100,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                background: "#22c55e",
                borderRadius: "50%",
                boxShadow: "0 0 8px #22c55e",
              }}
            />
            <span
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {badge}
            </span>
          </div>
        )}

        {/* Main content container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 60px",
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
              marginBottom: 24,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://www.pokeindex.fr/logo/logo_pki.png"
              alt="Pokéindex"
              width={120}
              height={120}
              style={{
                filter: "drop-shadow(0 8px 24px rgba(139,92,246,0.3))",
              }}
            />
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: 60,
              fontWeight: 700,
              background: "linear-gradient(135deg, #ffffff 0%, #e0e7ff 50%, #c4b5fd 100%)",
              backgroundClip: "text",
              color: "transparent",
              margin: 0,
              letterSpacing: "-1.5px",
              textAlign: "center",
              lineHeight: 1.1,
            }}
          >
            {title}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p
              style={{
                fontSize: 24,
                color: "rgba(255,255,255,0.65)",
                margin: "20px 0 0 0",
                textAlign: "center",
                fontWeight: 400,
                maxWidth: 700,
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Bottom branding */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: 18,
              fontWeight: 500,
              letterSpacing: "0.5px",
            }}
          >
            Pokéindex
          </span>
          <div
            style={{
              width: 4,
              height: 4,
              background: "rgba(255,255,255,0.3)",
              borderRadius: "50%",
            }}
          />
          <span
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: 16,
              fontWeight: 400,
            }}
          >
            pokeindex.fr
          </span>
        </div>
      </div>
    ),
    {
      ...ogSize,
    }
  )
}
