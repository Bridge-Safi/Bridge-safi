import { useEffect, useState } from "react";

const GAME_URL = "https://bridge-safi.replit.app";

export default function App() {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1400);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #010d08 0%, #032218 30%, #054130 60%, #021a10 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Animated background grid */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23D9C5A0' fill-opacity='1'%3E%3Cpath d='M30 0L0 30L30 60L60 30L30 0zm0 10L50 30L30 50L10 30L30 10z'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: "60px 60px",
      }} />

      {/* Top glow */}
      <div style={{
        position: "absolute", top: 0, left: "-20%", right: "-20%", height: "400px",
        background: "radial-gradient(ellipse at 50% 0%, rgba(6,95,70,0.25) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Floating diamonds decoration */}
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: 6, height: 6,
          background: "#D9C5A0",
          transform: "rotate(45deg)",
          opacity: 0.15 + (i % 3) * 0.1,
          left: `${10 + i * 12}%`,
          top: `${15 + (i % 4) * 20}%`,
          animation: `floatDiamond ${3 + i * 0.4}s ease-in-out infinite alternate`,
        }} />
      ))}

      <style>{`
        @keyframes floatDiamond {
          from { transform: rotate(45deg) translateY(0px); }
          to { transform: rotate(45deg) translateY(-12px); }
        }
        @keyframes shimmer {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }
        @keyframes glow {
          0% { box-shadow: 0 0 30px rgba(6,95,70,0.4), 0 20px 60px rgba(0,0,0,0.5); }
          50% { box-shadow: 0 0 60px rgba(6,95,70,0.7), 0 20px 80px rgba(0,0,0,0.5); }
          100% { box-shadow: 0 0 30px rgba(6,95,70,0.4), 0 20px 60px rgba(0,0,0,0.5); }
        }
        .play-btn:hover {
          transform: scale(1.04) !important;
          background: linear-gradient(135deg, #047857 0%, #065F46 100%) !important;
        }
        .play-btn:active {
          transform: scale(0.97) !important;
        }
      `}</style>

      {/* Main card */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "0 24px",
        maxWidth: 420, width: "100%",
      }}>
        {/* Logo */}
        <div style={{
          width: 110, height: 110, borderRadius: "50%", overflow: "hidden",
          border: "3px solid #D9C5A0",
          boxShadow: "0 0 0 8px rgba(217,197,160,0.08), 0 20px 60px rgba(0,0,0,0.5)",
          marginBottom: "1.5rem",
          animation: "glow 2.8s ease-in-out infinite",
        }}>
          <img
            src="/logo_splash_new.png"
            alt="Bridge Game"
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.15)" }}
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>

        {/* Title */}
        <h1 style={{
          color: "white", fontWeight: 900, fontSize: "2rem",
          letterSpacing: "0.5em", margin: "0 0 4px", textAlign: "center",
          textShadow: "0 2px 20px rgba(0,0,0,0.5)",
        }}>
          BRIDGE
        </h1>
        <p style={{
          color: "#D9C5A0", fontSize: "0.65rem", letterSpacing: "0.25em",
          fontWeight: 700, margin: "0 0 6px", opacity: 0.9,
        }}>
          SAFI · MAROC · آسفي · ⵙⴰⴼⵉ
        </p>

        {/* Gold bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
          <div style={{ width: 50, height: 1, background: "linear-gradient(to right, transparent, #D9C5A0)" }} />
          <div style={{ width: 6, height: 6, background: "#D9C5A0", transform: "rotate(45deg)", flexShrink: 0 }} />
          <div style={{ width: 50, height: 1, background: "linear-gradient(to left, transparent, #D9C5A0)" }} />
        </div>

        {/* Diamond display */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(217,197,160,0.2)",
          borderRadius: 20,
          padding: "1rem 2rem",
          marginBottom: "2rem",
          textAlign: "center",
          backdropFilter: "blur(8px)",
        }}>
          <div style={{
            fontSize: "2.5rem", marginBottom: "0.25rem",
            animation: `shimmer 2s ease-in-out infinite`,
          }}>
            💎
          </div>
          <div style={{ color: "#D9C5A0", fontSize: "0.7rem", letterSpacing: "0.15em", fontWeight: 700 }}>
            SAFI RUNNER
          </div>
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.6rem", marginTop: 4, letterSpacing: "0.08em" }}>
            Gagne des diamants · Échange contre des MAD
          </div>
        </div>

        {/* Règles rapides */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10, marginBottom: "2rem", width: "100%",
        }}>
          {[
            { icon: "⏱️", val: "6h", label: "par semaine" },
            { icon: "💎", val: "1000", label: "💎 / heure" },
            { icon: "🛵", val: "300 MAD", label: "bonus livraison" },
          ].map(({ icon, val, label }) => (
            <div key={label} style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(217,197,160,0.12)",
              borderRadius: 14, padding: "0.75rem 0.5rem",
              textAlign: "center", backdropFilter: "blur(8px)",
            }}>
              <div style={{ fontSize: "1.25rem", marginBottom: 4 }}>{icon}</div>
              <div style={{ color: "white", fontWeight: 900, fontSize: "0.8rem" }}>{val}</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.55rem", marginTop: 2, letterSpacing: "0.05em" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* PLAY BUTTON */}
        <a
          href={GAME_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="play-btn"
          style={{
            display: "block", width: "100%", padding: "1.1rem",
            background: "linear-gradient(135deg, #065F46 0%, #033d2c 100%)",
            border: "1.5px solid rgba(217,197,160,0.35)",
            borderRadius: 20, color: "white", fontWeight: 900,
            fontSize: "1.05rem", letterSpacing: "0.12em",
            textDecoration: "none", textAlign: "center",
            boxShadow: "0 0 30px rgba(6,95,70,0.4), 0 20px 60px rgba(0,0,0,0.5)",
            cursor: "pointer", transition: "transform 0.15s ease, background 0.15s ease",
            marginBottom: "1rem",
            animation: "glow 2.8s ease-in-out infinite",
          }}
        >
          🎮 JOUER MAINTENANT
        </a>

        {/* Conversion info */}
        <p style={{
          color: "rgba(217,197,160,0.6)", fontSize: "0.62rem",
          letterSpacing: "0.1em", textAlign: "center", margin: 0, fontWeight: 600,
        }}>
          200 💎 = 1 MAD · 60 000 💎 = 300 MAD
        </p>

        {/* Footer */}
        <p style={{
          color: "rgba(255,255,255,0.15)", fontSize: "0.55rem",
          letterSpacing: "0.15em", textAlign: "center", marginTop: "2.5rem",
        }}>
          © 2026 BRIDGE SAFI · safi-bridge.ma · 🔒 Sécurisé
        </p>
      </div>
    </div>
  );
}
