import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

// Utilise Node.js runtime car Firebase Admin ne fonctionne pas en Edge
export const runtime = "nodejs";

type ISPData = {
  current: number;
  change7d: number | null;
  change30d: number | null;
  trend: "up" | "down" | "stable";
  history: Array<{ date: string; value: number }>;
  lastUpdate: string | null;
};

export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth().verifyIdToken(token);

    if (decoded.admin !== true) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Récupérer les données ISP depuis le body
    const ispData: ISPData = await req.json();

    if (!ispData || typeof ispData.current !== "number") {
      return NextResponse.json({ error: "Données ISP invalides" }, { status: 400 });
    }

    // Générer l'image
    return new ImageResponse(
      <ISPImage data={ispData} />,
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("Error generating ISP image:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération de l'image" },
      { status: 500 }
    );
  }
}

function ISPImage({ data }: { data: ISPData }) {
  const { current, change7d, change30d, history, lastUpdate } = data;

  // Formatage
  const change7dFormatted = change7d !== null
    ? `${change7d >= 0 ? "+" : ""}${(change7d * 100).toFixed(2)}%`
    : "N/A";

  const change30dFormatted = change30d !== null
    ? `${change30d >= 0 ? "+" : ""}${(change30d * 100).toFixed(2)}%`
    : "N/A";

  // Couleurs selon tendance 7j
  const trend7dColor = change7d !== null
    ? change7d > 0.005 ? "#22c55e" : change7d < -0.005 ? "#ef4444" : "#94a3b8"
    : "#94a3b8";
  const trend7dBgColor = change7d !== null
    ? change7d > 0.005 ? "rgba(34, 197, 94, 0.15)" : change7d < -0.005 ? "rgba(239, 68, 68, 0.15)" : "rgba(148, 163, 184, 0.1)"
    : "rgba(148, 163, 184, 0.1)";

  // Statut du marché basé sur la variation 7j
  const marketStatus = change7d !== null
    ? change7d > 0.02 ? "Forte hausse" : change7d > 0.005 ? "Marché haussier" : change7d < -0.02 ? "Forte baisse" : change7d < -0.005 ? "Marché baissier" : "Marché stable"
    : "Marché stable";

  // Préparer les données du mini-graphique (30 derniers jours)
  const chartData = history.slice(-30);
  const minValue = Math.min(...chartData.map(p => p.value));
  const maxValue = Math.max(...chartData.map(p => p.value));
  const valueRange = maxValue - minValue || 1;

  // Générer le path SVG pour le graphique
  const chartWidth = 380;
  const chartHeight = 100;
  const points = chartData.map((point, index) => {
    const x = (index / (chartData.length - 1)) * chartWidth;
    const y = chartHeight - ((point.value - minValue) / valueRange) * (chartHeight - 10) - 5;
    return `${x},${y}`;
  }).join(" ");

  // Date formatée
  const formattedDate = lastUpdate
    ? new Date(lastUpdate).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, #0c0815 0%, #1a1030 50%, #0f0a1e 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
        padding: "48px 56px",
      }}
    >
      {/* Background decorative elements */}
      <div
        style={{
          position: "absolute",
          top: -150,
          right: -100,
          width: 500,
          height: 500,
          background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 60%)",
          borderRadius: 9999,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -200,
          left: -100,
          width: 600,
          height: 600,
          background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 60%)",
          borderRadius: 9999,
        }}
      />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Logo container avec ratio préservé */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(99,102,241,0.1) 100%)",
              border: "1px solid rgba(139,92,246,0.3)",
            }}
          >
            <img
              src="https://www.pokeindex.fr/logo/logo_pki.png"
              alt="Pokéindex"
              width={48}
              height={48}
              style={{
                objectFit: "contain",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-1px",
              }}
            >
              ISP-FR
            </span>
            <span
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.5)",
                letterSpacing: "0.5px",
              }}
            >
              Index des Scellés Pokémon – France
            </span>
          </div>
        </div>

        {/* Date badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "10px 20px",
            borderRadius: 100,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              background: "#22c55e",
              borderRadius: 9999,
              boxShadow: "0 0 12px #22c55e",
            }}
          />
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, fontWeight: 500 }}>
            {formattedDate}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flex: 1,
          gap: 48,
        }}
      >
        {/* Left: Index value */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
          }}
        >
          {/* Current value */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
              Valeur actuelle
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span
                style={{
                  fontSize: 108,
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: "-4px",
                  lineHeight: 1,
                }}
              >
                {current.toFixed(2)}
              </span>
            </div>
            <span style={{ fontSize: 15, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>
              Base 100 = valeur initiale
            </span>
          </div>

          {/* Variation badges */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 32,
            }}
          >
            {/* 7 jours - mise en avant */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: trend7dBgColor,
                border: `2px solid ${trend7dColor}50`,
                padding: "14px 24px",
                borderRadius: 16,
              }}
            >
              <span style={{ fontSize: 28, fontWeight: 800, color: trend7dColor }}>
                {change7dFormatted}
              </span>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
                7 jours
              </span>
            </div>

            {/* 30 jours */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "14px 24px",
                borderRadius: 16,
              }}
            >
              <span style={{ fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>
                {change30dFormatted}
              </span>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.45)" }}>
                30 jours
              </span>
            </div>
          </div>

          {/* Market status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 24,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 9999,
                background: trend7dColor,
                boxShadow: `0 0 8px ${trend7dColor}`,
              }}
            />
            <span style={{ fontSize: 18, color: trend7dColor, fontWeight: 600 }}>
              {marketStatus}
            </span>
          </div>
        </div>

        {/* Right: Mini chart */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: 420,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 420,
              padding: 28,
              background: "rgba(255,255,255,0.03)",
              borderRadius: 24,
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 20, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>
              Évolution 30 jours
            </span>
            <svg
              width={chartWidth}
              height={chartHeight}
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            >
              {/* Gradient fill */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              {/* Area fill */}
              <polygon
                points={`0,${chartHeight} ${points} ${chartWidth},${chartHeight}`}
                fill="url(#chartGradient)"
              />
              {/* Line */}
              <polyline
                points={points}
                fill="none"
                stroke="rgb(129, 140, 248)"
                strokeWidth={3}
              />
              {/* End point */}
              <circle
                cx={chartWidth}
                cy={chartHeight - ((chartData[chartData.length - 1]?.value - minValue) / valueRange) * (chartHeight - 10) - 5}
                r={6}
                fill="rgb(129, 140, 248)"
              />
            </svg>
            {/* Chart labels */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                {chartData[0]?.date ? new Date(chartData[0].date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : ""}
              </span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
                {chartData[chartData.length - 1]?.date ? new Date(chartData[chartData.length - 1].date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 24,
          paddingTop: 24,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>
            Données :
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {["Cardmarket", "eBay", "Vinted", "LeBonCoin"].map((source) => (
              <span
                key={source}
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.5)",
                  background: "rgba(255,255,255,0.05)",
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontWeight: 500,
                }}
              >
                {source}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src="https://www.pokeindex.fr/logo/logo_pki.png"
            alt=""
            width={24}
            height={24}
            style={{ opacity: 0.6 }}
          />
          <span style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: 0.5 }}>
            pokeindex.fr
          </span>
        </div>
      </div>
    </div>
  );
}
