import { useState, useMemo, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area,
} from "recharts";

/* ═══════════════════════════════════════════════════════
   BRIDGE BRAND SVG SYSTEM
   Inspiré du logo Bridge Eats — Kasbah de Safi + le B
═══════════════════════════════════════════════════════ */
const BB = { dark: "#0f172a", red: "#7b1d1d" };

/* Kasbah de Safi */
function Kasbah({ x=0, y=0, w=42, color=BB.red }: { x?:number;y?:number;w?:number;color?:string }) {
  const h  = Math.round(w * 0.72);
  const tw = Math.round(w * 0.26);
  const th = Math.round(h * 0.72);
  const wh = Math.round(h * 0.46);
  const cw = Math.round(w * 0.08);
  const ch = Math.round(h * 0.28);
  const wallX = x + tw + Math.round(w * 0.05);
  const wallW = w - 2 * tw - Math.round(w * 0.1);
  const baseY = y + h;
  return (
    <g>
      <rect x={x} y={baseY-th} width={tw} height={th} rx="1" fill={color}/>
      {[0,1,2].map(i=><rect key={i} x={x+i*(cw+2)} y={baseY-th-ch} width={cw} height={ch} rx="1" fill={color}/>)}
      <rect x={x+w-tw} y={baseY-th} width={tw} height={th} rx="1" fill={color}/>
      {[0,1,2].map(i=><rect key={i} x={x+w-tw+i*(cw+2)} y={baseY-th-ch} width={cw} height={ch} rx="1" fill={color}/>)}
      <rect x={wallX} y={baseY-wh} width={wallW} height={wh} rx="1" fill={color}/>
      <path d={`M${wallX+wallW*0.25} ${baseY} Q${wallX+wallW*0.5} ${baseY-wh*0.55} ${wallX+wallW*0.75} ${baseY}`} fill="rgba(255,255,255,0.9)"/>
    </g>
  );
}

/* The Bridge B letterform — viewBox 0 0 90 100 */
function BridgeBLetter({ color=BB.dark }: { color?:string }) {
  return (
    <g>
      {/* B outer filled shape */}
      <path d="M12 8 L12 92 L45 92 C68 92 80 82 80 68 C80 57 73 51 61 49 C73 47 77 38 77 27 C77 12 65 8 44 8 Z" fill={color}/>
      {/* Top bump cutout (white — where role icon sits) */}
      <path d="M24 18 L42 18 C58 18 65 25 65 34 C65 43 57 47 42 47 L24 47 Z" fill="white"/>
      {/* Bottom bump cutout (white — where Kasbah sits) */}
      <path d="M24 53 L44 53 C61 53 68 59 68 68 C68 80 58 82 43 82 L24 82 Z" fill="white"/>
    </g>
  );
}

/* Role icons — each fits in a ~42×28 box at (0,0) */
function ScooterIcon({ color=BB.red }: { color?:string }) {
  return (
    <g>
      <path d="M5 19 L17 10 L29 10 L33 17 L20 19 Z" fill={color}/>
      <rect x="26" y="7" width="10" height="3" rx="1.5" fill={color}/>
      <rect x="10" y="8" width="12" height="3.5" rx="1.5" fill={color}/>
      <circle cx="9" cy="23" r="6" stroke={color} strokeWidth="2.5" fill="none"/>
      <circle cx="9" cy="23" r="2" fill={color}/>
      <circle cx="34" cy="23" r="6" stroke={color} strokeWidth="2.5" fill="none"/>
      <circle cx="34" cy="23" r="2" fill={color}/>
    </g>
  );
}
function CarIcon({ color=BB.red }: { color?:string }) {
  return (
    <g>
      <path d="M2 18 L7 12 L35 12 L40 18 L40 24 L2 24 Z" fill={color}/>
      <path d="M9 12 L13 5 L29 5 L33 12 Z" fill={color}/>
      <path d="M11 12 L14 6.5 L28 6.5 L31 12 Z" fill="rgba(255,255,255,0.2)"/>
      <circle cx="11" cy="26" r="5" fill={color}/>
      <circle cx="11" cy="26" r="2.5" fill="rgba(255,255,255,0.7)"/>
      <circle cx="31" cy="26" r="5" fill={color}/>
      <circle cx="31" cy="26" r="2.5" fill="rgba(255,255,255,0.7)"/>
    </g>
  );
}
function ClocheIcon({ color=BB.red }: { color?:string }) {
  return (
    <g>
      <rect x="3" y="23" width="36" height="4" rx="2" fill={color}/>
      <path d="M5 23 C5 6 37 6 37 23 Z" fill={color}/>
      <circle cx="21" cy="6" r="3.5" fill={color}/>
    </g>
  );
}
function BriefcaseIcon({ color=BB.red }: { color?:string }) {
  return (
    <g>
      <rect x="3" y="12" width="36" height="20" rx="3" fill={color}/>
      <path d="M14 12 L14 8 C14 5.5 16 4 21 4 C26 4 28 5.5 28 8 L28 12" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round"/>
      <rect x="16" y="20" width="10" height="4" rx="2" fill="rgba(255,255,255,0.7)"/>
      <line x1="3" y1="19" x2="39" y2="19" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
    </g>
  );
}
function ChartBarsIcon({ color=BB.red }: { color?:string }) {
  return (
    <g>
      <rect x="4" y="17" width="8" height="11" rx="2" fill={color}/>
      <rect x="17" y="9" width="8" height="19" rx="2" fill={color}/>
      <rect x="30" y="2" width="8" height="26" rx="2" fill={color}/>
      <rect x="2" y="28" width="38" height="2.5" rx="1" fill={color}/>
    </g>
  );
}

function getRoleIcon(role: string) {
  switch(role) {
    case "Livreur":      return <ScooterIcon/>;
    case "Chauffeur":    return <CarIcon/>;
    case "Restaurateur": return <ClocheIcon/>;
    case "Manager":      return <BriefcaseIcon/>;
    default:             return <ChartBarsIcon/>;
  }
}

/* Complete role badge — B + Kasbah + role icon */
function BridgeRoleBadge({ role, size=56, light=false }: { role:string; size?:number; light?:boolean }) {
  const bColor = light ? "rgba(255,255,255,0.92)" : BB.dark;
  const kColor = light ? "#ef4444" : BB.red;
  const iColor = light ? "#10b981" : BB.red;
  return (
    <svg viewBox="0 0 90 100" width={size} height={Math.round(size*100/90)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <BridgeBLetter color={bColor}/>
      <Kasbah x={26} y={53} w={40} color={kColor}/>
      <g transform="translate(24,18)">{getRoleIcon(role) && <g>{
        role === "Livreur"      ? <ScooterIcon color={iColor}/> :
        role === "Chauffeur"    ? <CarIcon color={iColor}/> :
        role === "Restaurateur" ? <ClocheIcon color={iColor}/> :
        role === "Manager"      ? <BriefcaseIcon color={iColor}/> :
                                  <ChartBarsIcon color={iColor}/>
      }</g>}</g>
    </svg>
  );
}

/* Finance app header logo */
function BridgeFinanceHeaderLogo() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
      <BridgeRoleBadge role="Finance" size={54} light/>
      <div>
        <div style={{ fontWeight:900, fontSize:18, color:"#f1f5f9", letterSpacing:".1em", lineHeight:1 }}>BRIDGE</div>
        <div style={{ fontWeight:700, fontSize:10, color:"#10b981", letterSpacing:".25em", marginTop:3 }}>FINANCE</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── helpers ── */
const fmt = (n: number) =>
  new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(n) + " DH";

const COLORS = ["#10b981", "#8b5cf6", "#f59e0b", "#06b6d4", "#ef4444"];

const GRADIENT_CARDS = [
  "linear-gradient(135deg,#065f46 0%,#10b981 100%)",
  "linear-gradient(135deg,#4c1d95 0%,#8b5cf6 100%)",
  "linear-gradient(135deg,#92400e 0%,#f59e0b 100%)",
  "linear-gradient(135deg,#0c4a6e 0%,#06b6d4 100%)",
];

const inp: React.CSSProperties = {
  border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 14px",
  fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box",
  background: "#fff", color: "#1e293b", fontFamily: "inherit",
};

/* ─────────────────────────────────────── KPI card ── */
function KpiCard({ label, value, sub, gradient, emoji }: {
  label: string; value: string; sub?: string; gradient: string; emoji: string;
}) {
  return (
    <div style={{
      background: gradient, borderRadius: 16, padding: "20px 24px",
      color: "#fff", boxShadow: "0 4px 24px rgb(0 0 0 / .18)",
      display: "flex", flexDirection: "column", gap: 4, minWidth: 0,
    }}>
      <div style={{ fontSize: 28 }}>{emoji}</div>
      <div style={{ fontSize: 11, fontWeight: 700, opacity: .75, letterSpacing: ".06em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, opacity: .7, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/* ─────────────────────────────────────── custom tooltip ── */
function CT({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "10px 14px" }}>
      <p style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color, fontWeight: 700, fontSize: 13 }}>
          {p.name} : {fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────── Slider ── */
function Slider({ label, value, min, max, step, onChange, unit = "DH" }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; unit?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{label}</label>
        <span style={{
          background: "linear-gradient(135deg,#065f46,#10b981)", color: "#fff",
          borderRadius: 8, padding: "2px 10px", fontSize: 12, fontWeight: 800,
        }}>
          {value.toLocaleString("fr-MA")} {unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: "100%", accentColor: "#10b981", height: 6, cursor: "pointer",
          background: `linear-gradient(90deg, #10b981 ${pct}%, #e2e8f0 ${pct}%)`,
          borderRadius: 99, outline: "none", border: "none",
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9ca3af" }}>
        <span>{min.toLocaleString("fr-MA")}</span>
        <span>{max.toLocaleString("fr-MA")}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── Intelaka tab ── */
/* ─────────────────────────────────── Réel Tab (synchronisé) ── */
// Chiffres RÉELS tirés du Manager (toutes les commandes Bridge : Eats, Pharmacie,
// Tabac, Fleurs, Boulangerie, Souk...). Répartition confirmée par zabi :
// articles -> restaurateurs · 6,5 DH service -> Bridge · livraison 12 = 6 livreur
// (fixe toutes distances) + 6 Bridge · surcharge km -> Bridge.
type FinSplit = { encaisse: number; commandes: number; bridge: number; livreurs: number; restaurateurs: number };
type FinSummary = {
  jour: FinSplit; global: FinSplit;
  params: { livreurParCourse: number; fraisService: number; partLivraisonBridge: number; netBridgeParCommande: number };
};

function ReelTab() {
  const [data, setData] = useState<FinSummary | null>(null);
  const [err, setErr] = useState(false);
  const [scope, setScope] = useState<"jour" | "global">("jour");

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("https://www.safi-bridge.ma/api/finance/summary")
        .then(r => (r.ok ? r.json() : Promise.reject()))
        .then(d => { if (alive) { setData(d); setErr(false); } })
        .catch(() => { if (alive) setErr(true); });
    load();
    const t = setInterval(load, 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const s = data ? data[scope] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>💸 Revenus réels Bridge</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Synchronisé avec Eats · Livreurs · Restaurants (via Manager) — rafraîchi toutes les 30 s</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, background: "#fff", borderRadius: 12, padding: 4, boxShadow: "0 1px 4px rgb(0 0 0 / .08)" }}>
          {(["jour", "global"] as const).map(k => (
            <button key={k} onClick={() => setScope(k)} style={{
              padding: "8px 16px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 800,
              background: scope === k ? "linear-gradient(135deg,#065f46,#10b981)" : "transparent",
              color: scope === k ? "#fff" : "#64748b",
            }}>
              {k === "jour" ? "Aujourd'hui" : "Global"}
            </button>
          ))}
        </div>
      </div>

      {err && (
        <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 12, padding: 14, fontSize: 13, color: "#b91c1c" }}>
          ⚠️ Impossible de joindre le Manager pour le moment — réessaie dans quelques secondes.
        </div>
      )}

      {s && data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
            <KpiCard label="Encaissé (tous services)" value={fmt(s.encaisse)} sub={`${s.commandes} commande(s) livrée(s)`} gradient={GRADIENT_CARDS[0]} emoji="💰" />
            <KpiCard label="TON NET BRIDGE" value={fmt(s.bridge)} sub="6% des articles + 6,5 service + 6 livraison / commande" gradient={GRADIENT_CARDS[1]} emoji="🚀" />
            <KpiCard label="Part restaurateurs" value={fmt(s.restaurateurs)} sub="94% des articles (prix basés Glovo)" gradient={GRADIENT_CARDS[2]} emoji="🍽️" />
            <KpiCard label="Gains livreurs" value={fmt(s.livreurs)} sub={`${data.params.livreurParCourse} DH / course, toutes distances`} gradient={GRADIENT_CARDS[3 % GRADIENT_CARDS.length]} emoji="🛵" />
          </div>

          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 6px rgb(0 0 0 / .07)" }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: "#0f172a", marginBottom: 10 }}>📐 Comment c'est calculé (par commande livrée)</div>
            {[
              ["🍽️ Articles (prix basés Glovo)", "→ 94% restaurateur / commerçant · 6% Bridge (toi)"],
              ["🧾 Frais de service 6,5 DH", "→ Bridge (toi)"],
              ["🚚 Frais de livraison 12 DH", "→ 6 DH livreur (fixe, toutes distances) + 6 DH Bridge"],
              ["🛣️ Surcharge distance 1 DH/km (silencieuse)", "→ Bridge (toi)"],
            ].map(([a, b]) => (
              <div key={a as string} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: 12.5 }}>
                <span style={{ color: "#334155" }}>{a}</span>
                <span style={{ color: "#059669", fontWeight: 700, textAlign: "right" }}>{b}</span>
              </div>
            ))}
            <div style={{ marginTop: 10, fontSize: 11.5, color: "#64748b" }}>
              💡 Ton net = <b>6% des articles + 12,5 DH × commandes livrées</b> (hors surcharge km). Les restaurateurs touchent 94% des articles.
              Ces chiffres alimentent ta base pour la TVA et l'IS : ton CA imposable = ton net Bridge (pas le total encaissé).
            </div>
          </div>
        </>
      )}
      {!s && !err && <div style={{ fontSize: 13, color: "#64748b" }}>Chargement des chiffres réels…</div>}
    </div>
  );
}

function IntelakaTab() {
  const [prixSite, setPrixSite] = useState(8000);
  const [qteSite, setQteSite] = useState(5);
  const [prixApp, setPrixApp] = useState(25000);
  const [qteApp, setQteApp] = useState(2);
  const [abonnement, setAbonnement] = useState(1500);
  const [prixMaint, setPrixMaint] = useState(500);
  const [qteMaint, setQteMaint] = useState(3);

  const caSites = prixSite * qteSite;
  const caApps = prixApp * qteApp;
  const caAbonnements = abonnement * 12;
  const caMaint = prixMaint * qteMaint * 12;
  const caTotal = caSites + caApps + caAbonnements + caMaint;

  const barData = [
    { name: "Sites Web", Revenus: caSites },
    { name: "Apps Mobiles", Revenus: caApps },
    { name: "Abonnements", Revenus: caAbonnements },
    { name: "Maintenance", Revenus: caMaint },
  ];

  const pieData = barData.map(d => ({ name: d.name, value: d.Revenus })).filter(d => d.value > 0);

  const monthlyData = useMemo(() => {
    const months = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
    return months.map((m, i) => ({
      month: m,
      CA: Math.round((caAbonnements + caMaint) / 12
        + (i % 4 === 2 ? (caSites + caApps) * 0.5 : (caSites + caApps) * 0.05)),
    }));
  }, [caSites, caApps, caAbonnements, caMaint]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <KpiCard label="CA annuel estimé" value={fmt(caTotal)} sub={`${fmt(Math.round(caTotal/12))} / mois`} gradient={GRADIENT_CARDS[0]} emoji="📈" />
        <KpiCard label="Sites web" value={fmt(caSites)} sub={`${qteSite} × ${fmt(prixSite)}`} gradient={GRADIENT_CARDS[1]} emoji="🌐" />
        <KpiCard label="Apps mobiles" value={fmt(caApps)} sub={`${qteApp} × ${fmt(prixApp)}`} gradient={GRADIENT_CARDS[2]} emoji="📱" />
        <KpiCard label="Récurrents" value={fmt(caAbonnements + caMaint)} sub="Abonnements + maintenance" gradient={GRADIENT_CARDS[3]} emoji="🔄" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgb(0 0 0 / .07)", display: "flex", flexDirection: "column", gap: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 900, color: "#065f46", marginBottom: 4 }}>⚙️ Paramètres du prévisionnel</h3>
          <Slider label="Prix unitaire site web" value={prixSite} min={2000} max={30000} step={500} onChange={setPrixSite} />
          <Slider label="Nombre de sites / an" value={qteSite} min={0} max={30} step={1} onChange={setQteSite} unit="sites" />
          <Slider label="Prix unitaire app mobile" value={prixApp} min={5000} max={80000} step={1000} onChange={setPrixApp} />
          <Slider label="Nombre d'apps / an" value={qteApp} min={0} max={15} step={1} onChange={setQteApp} unit="apps" />
          <Slider label="Revenus plateformes / mois" value={abonnement} min={0} max={10000} step={100} onChange={setAbonnement} />
          <Slider label="Prix maintenance / client / mois" value={prixMaint} min={0} max={2000} step={50} onChange={setPrixMaint} />
          <Slider label="Clients maintenance" value={qteMaint} min={0} max={20} step={1} onChange={setQteMaint} unit="clients" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgb(0 0 0 / .07)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 900, color: "#1e293b", marginBottom: 16 }}>Répartition du CA</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 4, right: 4, left: -10, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={v => v >= 1000 ? `${v/1000}k` : String(v)} />
                <Tooltip content={<CT />} />
                <Bar dataKey="Revenus" radius={[6,6,0,0]}>
                  {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {pieData.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgb(0 0 0 / .07)" }}>
              <h3 style={{ fontSize: 14, fontWeight: 900, color: "#1e293b", marginBottom: 16 }}>Camembert des revenus</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} innerRadius={35} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgb(0 0 0 / .07)" }}>
        <h3 style={{ fontSize: 14, fontWeight: 900, color: "#1e293b", marginBottom: 16 }}>📅 Projection mensuelle (indicative)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -10, bottom: 4 }}>
            <defs>
              <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} />
            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={v => v >= 1000 ? `${v/1000}k` : String(v)} />
            <Tooltip content={<CT />} />
            <Area type="monotone" dataKey="CA" stroke="#10b981" strokeWidth={2.5} fill="url(#caGrad)" />
          </AreaChart>
        </ResponsiveContainer>
        <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>
          * Projection indicative — basée sur une répartition lissée des projets ponctuels
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── Charges tab ── */
type Charge = { id: number; label: string; freq: "mensuel" | "annuel"; montant: number };

const CHARGES_DEFAULT: Charge[] = [
  { id: 1, label: "Serveurs / Hébergement (Replit Pro, etc.)", freq: "mensuel", montant: 950 },
  { id: 2, label: "Domaine safi-bridge.ma + SSL", freq: "annuel", montant: 300 },
  { id: 3, label: "Domiciliation Safi (SARL)", freq: "annuel", montant: 1800 },
  { id: 4, label: "Forfait comptable mensuel", freq: "mensuel", montant: 400 },
  { id: 5, label: "Logiciels & abonnements (Adobe, etc.)", freq: "mensuel", montant: 200 },
  { id: 6, label: "Marketing & pub (Facebook Ads, etc.)", freq: "mensuel", montant: 500 },
];

function ChargesTab({ caTotal }: { caTotal: number }) {
  const [charges, setCharges] = useState<Charge[]>(CHARGES_DEFAULT);
  const [newLabel, setNewLabel] = useState("");
  const [newMontant, setNewMontant] = useState("");
  const [newFreq, setNewFreq] = useState<"mensuel"|"annuel">("mensuel");

  const totalAnnuel = charges.reduce((s, c) => s + (c.freq === "mensuel" ? c.montant * 12 : c.montant), 0);
  const benefice = caTotal - totalAnnuel;

  const addCharge = () => {
    if (!newLabel.trim() || !newMontant) return;
    setCharges(prev => [...prev, { id: Date.now(), label: newLabel.trim(), freq: newFreq, montant: Number(newMontant) }]);
    setNewLabel(""); setNewMontant("");
  };

  const barData = charges.map(c => ({
    name: c.label.length > 22 ? c.label.slice(0, 22) + "…" : c.label,
    Charges: c.freq === "mensuel" ? c.montant * 12 : c.montant,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <KpiCard label="CA annuel estimé" value={fmt(caTotal)} sub="Via onglet Prévisions" gradient={GRADIENT_CARDS[0]} emoji="💰" />
        <KpiCard label="Total charges / an" value={fmt(totalAnnuel)} sub={`${fmt(Math.round(totalAnnuel/12))} / mois`} gradient="linear-gradient(135deg,#7f1d1d,#ef4444)" emoji="📉" />
        <KpiCard
          label={benefice >= 0 ? "Bénéfice net estimé" : "Déficit estimé"}
          value={fmt(Math.abs(benefice))}
          sub={benefice >= 0 ? "Avant IS (impôt société)" : "⚠️ Ajustez vos tarifs !"}
          gradient={benefice >= 0 ? "linear-gradient(135deg,#065f46,#10b981)" : "linear-gradient(135deg,#92400e,#f59e0b)"}
          emoji={benefice >= 0 ? "📊" : "⚠️"}
        />
        <KpiCard label="Ratio charges / CA" value={caTotal > 0 ? `${Math.round((totalAnnuel/caTotal)*100)} %` : "—"} sub={caTotal > 0 && totalAnnuel/caTotal < 0.6 ? "Sain 👍" : "À surveiller"} gradient={GRADIENT_CARDS[3]} emoji="⚖️" />
      </div>

      <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgb(0 0 0 / .07)" }}>
        <h3 style={{ fontSize: 15, fontWeight: 900, color: "#1e293b", marginBottom: 16 }}>🛠️ Détail des charges</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 800, color: "#475569", fontSize: 11, letterSpacing: ".04em" }}>DÉSIGNATION</th>
                <th style={{ textAlign: "center", padding: "10px 12px", fontWeight: 800, color: "#475569", fontSize: 11 }}>FRÉQUENCE</th>
                <th style={{ textAlign: "right", padding: "10px 12px", fontWeight: 800, color: "#475569", fontSize: 11 }}>MONTANT</th>
                <th style={{ textAlign: "right", padding: "10px 12px", fontWeight: 800, color: "#475569", fontSize: 11 }}>/ AN</th>
                <th style={{ padding: "10px 8px" }}></th>
              </tr>
            </thead>
            <tbody>
              {charges.map((c, i) => (
                <tr key={c.id} style={{ borderTop: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                  <td style={{ padding: "10px 12px", color: "#1e293b" }}>{c.label}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                    <span style={{
                      background: c.freq === "mensuel" ? "#ecfdf5" : "#eff6ff",
                      color: c.freq === "mensuel" ? "#065f46" : "#1e40af",
                      borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700,
                    }}>
                      {c.freq}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{fmt(c.montant)}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: "#ef4444" }}>
                    {fmt(c.freq === "mensuel" ? c.montant * 12 : c.montant)}
                  </td>
                  <td style={{ padding: "10px 8px", textAlign: "center" }}>
                    <button onClick={() => setCharges(prev => prev.filter(x => x.id !== c.id))}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#94a3b8" }}>✕</button>
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: "2px solid #e2e8f0", background: "#f8fafc" }}>
                <td colSpan={2} style={{ padding: "12px", fontWeight: 900, fontSize: 14, color: "#1e293b" }}>TOTAL</td>
                <td></td>
                <td style={{ padding: "12px", textAlign: "right", fontWeight: 900, fontSize: 15, color: "#ef4444" }}>{fmt(totalAnnuel)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 20, padding: 16, background: "#f8fafc", borderRadius: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Désignation</label>
            <input style={inp} value={newLabel} onChange={e => setNewLabel(e.target.value)}
              placeholder="Nom de la charge…" onKeyDown={e => e.key === "Enter" && addCharge()} />
          </div>
          <div style={{ flex: "0 1 110px", display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Montant (DH)</label>
            <input type="number" style={inp} value={newMontant} onChange={e => setNewMontant(e.target.value)} placeholder="0" />
          </div>
          <div style={{ flex: "0 1 110px", display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Fréquence</label>
            <select style={inp} value={newFreq} onChange={e => setNewFreq(e.target.value as any)}>
              <option value="mensuel">Mensuel</option>
              <option value="annuel">Annuel</option>
            </select>
          </div>
          <button onClick={addCharge} style={{
            background: "linear-gradient(135deg,#065f46,#10b981)", color: "#fff",
            border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 800, cursor: "pointer", fontSize: 13,
          }}>➕ Ajouter</button>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgb(0 0 0 / .07)" }}>
        <h3 style={{ fontSize: 14, fontWeight: 900, color: "#1e293b", marginBottom: 16 }}>Charges annuelles par poste</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} margin={{ top: 4, right: 4, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#64748b" }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={v => v >= 1000 ? `${v/1000}k` : String(v)} />
            <Tooltip content={<CT />} />
            <Bar dataKey="Charges" radius={[6,6,0,0]}>
              {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── TVA tab ── */
function TvaTab() {
  const [ttc, setTtc] = useState(12000);
  const [tvaRate, setTvaRate] = useState(20);
  const [achats, setAchats] = useState(3000);
  const [aRate, setARate] = useState(20);

  const htPercu = ttc / (1 + tvaRate / 100);
  const tvaCollectee = ttc - htPercu;
  const tvaDed = achats * (aRate / 100);
  const tvaNet = tvaCollectee - tvaDed;

  const trimData = [
    { trim: "T1", TVA: Math.round(tvaNet * 0.9) },
    { trim: "T2", TVA: Math.round(tvaNet * 1.1) },
    { trim: "T3", TVA: Math.round(tvaNet * 0.8) },
    { trim: "T4", TVA: Math.round(tvaNet * 1.2) },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <KpiCard label="TVA collectée (facturée)" value={fmt(tvaCollectee)} sub={`HT : ${fmt(htPercu)}`} gradient={GRADIENT_CARDS[0]} emoji="📋" />
        <KpiCard label="TVA déductible (achats)" value={fmt(tvaDed)} sub={`Base HT : ${fmt(achats)}`} gradient={GRADIENT_CARDS[1]} emoji="🧾" />
        <KpiCard
          label={tvaNet >= 0 ? "TVA nette à reverser" : "Crédit de TVA"}
          value={fmt(Math.abs(tvaNet))}
          sub={tvaNet >= 0 ? "À payer à l'État" : "À récupérer"}
          gradient={tvaNet >= 0 ? "linear-gradient(135deg,#7f1d1d,#ef4444)" : GRADIENT_CARDS[3]}
          emoji={tvaNet >= 0 ? "🏛️" : "✅"}
        />
        <KpiCard label="Pression TVA" value={ttc > 0 ? `${((tvaNet/ttc)*100).toFixed(1)} %` : "—"} sub="du CA TTC" gradient={GRADIENT_CARDS[2]} emoji="📊" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgb(0 0 0 / .07)", display: "flex", flexDirection: "column", gap: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 900, color: "#065f46" }}>⚙️ Paramètres TVA</h3>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>💵 CA TTC encaissé (DH)</label>
            <input type="number" value={ttc} onChange={e => setTtc(Number(e.target.value))} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>Taux TVA ventes</label>
            <select value={tvaRate} onChange={e => setTvaRate(Number(e.target.value))} style={inp}>
              <option value={7}>7% (eau, gaz)</option>
              <option value={10}>10% (restauration, hôtel)</option>
              <option value={14}>14% (transport)</option>
              <option value={20}>20% (tech, standard)</option>
            </select>
          </div>
          <hr style={{ border: "none", borderTop: "1px solid #f1f5f9" }} />
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>🧾 Achats / charges TTC déductibles</label>
            <input type="number" value={achats} onChange={e => setAchats(Number(e.target.value))} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>Taux TVA sur achats</label>
            <select value={aRate} onChange={e => setARate(Number(e.target.value))} style={inp}>
              <option value={7}>7%</option><option value={10}>10%</option>
              <option value={14}>14%</option><option value={20}>20%</option>
            </select>
          </div>
          <div style={{ background: tvaNet >= 0 ? "#fef2f2" : "#ecfdf5", borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
              {tvaNet >= 0 ? "📌 À reverser à la DGI :" : "✅ Crédit de TVA :"}
            </p>
            <p style={{ fontSize: 28, fontWeight: 900, color: tvaNet >= 0 ? "#ef4444" : "#10b981" }}>{fmt(Math.abs(tvaNet))}</p>
            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Fournissez les factures à votre comptable</p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgb(0 0 0 / .07)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 900, color: "#1e293b", marginBottom: 16 }}>📅 Projection trimestrielle</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trimData} margin={{ top: 4, right: 4, left: -10, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="trim" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={v => v >= 1000 ? `${v/1000}k` : String(v)} />
                <Tooltip content={<CT />} />
                <Bar dataKey="TVA" fill="#8b5cf6" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: "linear-gradient(135deg,#1e293b 0%,#334155 100%)", borderRadius: 16, padding: 24, color: "#fff" }}>
            <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 16, color: "#f1f5f9" }}>📝 Récapitulatif comptable</h3>
            {[
              ["CA TTC", fmt(ttc)], ["CA HT", fmt(htPercu)],
              [`TVA collectée (${tvaRate}%)`, fmt(tvaCollectee)],
              [`TVA déductible (${aRate}%)`, fmt(tvaDed)],
              ["TVA nette", fmt(tvaNet)],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
                <span style={{ color: "#94a3b8", fontSize: 13 }}>{k}</span>
                <span style={{ fontWeight: 800, fontSize: 13, color: "#f1f5f9" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── IS Tab ── */
function IsTab({ caTotal, chargesTotal }: { caTotal: number; chargesTotal: number }) {
  const [chargesSup, setChargesSup] = useState(0);
  const beneficeNet = caTotal - chargesTotal - chargesSup;
  const is = beneficeNet <= 0 ? 0
    : beneficeNet <= 300000 ? beneficeNet * 0.10
    : beneficeNet <= 1000000 ? 30000 + (beneficeNet - 300000) * 0.20
    : 170000 + (beneficeNet - 1000000) * 0.31;
  const cm = caTotal * 0.005;
  const isPayer = Math.max(is, cm);

  const slabs = [
    { label: "≤ 300 000 DH", taux: "10%", color: COLORS[0] },
    { label: "300 001 – 1 000 000 DH", taux: "20%", color: COLORS[1] },
    { label: "> 1 000 000 DH", taux: "31%", color: COLORS[2] },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16 }}>
        <KpiCard label="Bénéfice imposable" value={fmt(Math.max(0, beneficeNet))} sub={beneficeNet < 0 ? "Déficit — pas d'IS" : "Avant IS"} gradient={GRADIENT_CARDS[0]} emoji="💰" />
        <KpiCard label="IS calculé" value={fmt(is)} sub="Sur le bénéfice" gradient={beneficeNet > 0 ? "linear-gradient(135deg,#7f1d1d,#ef4444)" : GRADIENT_CARDS[3]} emoji="🏛️" />
        <KpiCard label="Cotis. minimale (0.5% CA)" value={fmt(cm)} sub="Minimum obligatoire" gradient={GRADIENT_CARDS[2]} emoji="📋" />
        <KpiCard label="IS à payer (max des deux)" value={fmt(isPayer)} sub="= max(IS, CM)" gradient="linear-gradient(135deg,#7c3aed,#8b5cf6)" emoji="⚠️" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgb(0 0 0 / .07)", display: "flex", flexDirection: "column", gap: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 900, color: "#065f46" }}>⚙️ Paramètres IS</h3>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>Charges supplémentaires déductibles (DH)</label>
            <input type="number" value={chargesSup} onChange={e => setChargesSup(Number(e.target.value))} style={inp} />
          </div>
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              ["CA", fmt(caTotal)],
              ["Charges fixes", fmt(chargesTotal)],
              ["Charges sup.", fmt(chargesSup)],
              ["= Bénéfice net", fmt(Math.max(0, beneficeNet))],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>{k}</span>
                <span style={{ fontWeight: 800, color: "#1e293b" }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ background: "linear-gradient(135deg,#7c3aed,#8b5cf6)", borderRadius: 12, padding: 16, color: "#fff" }}>
            <p style={{ fontSize: 11, opacity: .8, marginBottom: 4 }}>IS à régler (max IS / Cotis. Min.)</p>
            <p style={{ fontSize: 32, fontWeight: 900 }}>{fmt(isPayer)}</p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgb(0 0 0 / .07)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 900, color: "#1e293b", marginBottom: 16 }}>📊 Barème IS Maroc 2024</h3>
            {slabs.map(s => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: 13, color: "#475569" }}>{s.label}</span>
                <span style={{ background: s.color, color: "#fff", borderRadius: 8, padding: "3px 12px", fontWeight: 800, fontSize: 14 }}>{s.taux}</span>
              </div>
            ))}
            <div style={{ marginTop: 16, background: "#f8fafc", borderRadius: 10, padding: 12 }}>
              <p style={{ fontSize: 11, color: "#64748b" }}>⚠️ Cotisation minimale = 0,5% du CA (minimum 3 000 DH/an)</p>
            </div>
          </div>
          <div style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", borderRadius: 16, padding: 24, color: "#fff" }}>
            <h3 style={{ fontSize: 13, fontWeight: 900, marginBottom: 12, color: "#94a3b8" }}>ACOMPTES PROVISIONNELS</h3>
            {["Mars", "Juin", "Septembre", "Décembre"].map((m, i) => (
              <div key={m} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                <span style={{ color: "#64748b", fontSize: 12 }}>Acompte {i+1} — {m}</span>
                <span style={{ fontWeight: 800, fontSize: 13 }}>{fmt(isPayer / 4)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   CONTRATS & FICHES DE PAIE
═══════════════════════════════════════════════════════ */

type Role = "Livreur" | "Chauffeur" | "Restaurateur" | "Manager";
type TypeContrat = "CDI" | "CDD";

interface Employe {
  id: number;
  nom: string;
  prenom: string;
  cin: string;
  tel: string;
  role: Role;
  type: TypeContrat;
  salaire: number;
  dateDebut: string;
  duree: string;
  cnss: string;
  actif: boolean;
}

const ROLE_META: Record<Role, { color: string; bg: string }> = {
  Livreur:      { color: "#065f46", bg: "#ecfdf5" },
  Chauffeur:    { color: "#1e40af", bg: "#eff6ff" },
  Restaurateur: { color: "#92400e", bg: "#fef3c7" },
  Manager:      { color: "#7c3aed", bg: "#f5f3ff" },
};

/* ── IR Maroc mensuel ── */
function calcIR(netImposable: number): number {
  if (netImposable <= 2500) return 0;
  if (netImposable <= 4166) return netImposable * 0.10 - 250;
  if (netImposable <= 5000) return netImposable * 0.20 - 666.67;
  if (netImposable <= 6666) return netImposable * 0.30 - 1166.67;
  if (netImposable <= 15000) return netImposable * 0.34 - 1433.33;
  return netImposable * 0.38 - 2033.33;
}

function calcFiche(salaire: number, heuresSup: number, commissions: number, primes: number, absences: number) {
  const brutTotal = salaire + heuresSup * (salaire / 191) * 1.25 + commissions + primes - absences;
  const cnss = Math.min(brutTotal, 6000) * 0.0448;
  const amo  = brutTotal * 0.0226;
  const fraisPro = Math.min(brutTotal * 0.20, 2500);
  const netImposable = brutTotal - cnss - amo - fraisPro;
  const ir = Math.max(0, calcIR(netImposable));
  const net = brutTotal - cnss - amo - ir;
  return { brutTotal, cnss, amo, fraisPro, netImposable, ir, net };
}

/* ── Print contract ── */
function printContrat(e: Employe) {
  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) return;
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const dureeClause = e.type === "CDI"
    ? `<p>Le présent contrat est conclu pour une durée <strong>indéterminée</strong>, conformément aux dispositions du Code du Travail marocain.</p>`
    : `<p>Le présent contrat est conclu pour une durée déterminée de <strong>${e.duree}</strong>, à compter du <strong>${e.dateDebut}</strong>.</p>`;

  w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
  <title>Contrat ${e.type} — ${e.prenom} ${e.nom}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',Arial,sans-serif; color:#1e293b; background:#fff; padding:40px 60px; font-size:13px; line-height:1.7; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #10b981; padding-bottom:20px; margin-bottom:30px; }
    .logo { font-size:22px; font-weight:900; color:#065f46; letter-spacing:.03em; }
    .logo span { color:#10b981; }
    .badge { background:linear-gradient(135deg,#065f46,#10b981); color:#fff; border-radius:8px; padding:6px 16px; font-size:13px; font-weight:800; }
    h1 { font-size:18px; font-weight:900; color:#065f46; text-align:center; margin:24px 0 8px; text-transform:uppercase; letter-spacing:.08em; }
    .ref { text-align:center; color:#64748b; font-size:12px; margin-bottom:28px; }
    .section { margin-bottom:22px; }
    .section-title { font-size:11px; font-weight:800; color:#475569; letter-spacing:.08em; text-transform:uppercase; border-bottom:1px solid #e2e8f0; padding-bottom:6px; margin-bottom:12px; }
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px 30px; }
    .field label { font-size:11px; color:#64748b; font-weight:700; display:block; }
    .field span { font-size:13px; font-weight:800; color:#1e293b; }
    .box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px 18px; margin-bottom:12px; }
    .salaire { font-size:24px; font-weight:900; color:#10b981; }
    .sign-row { display:flex; justify-content:space-between; margin-top:50px; }
    .sign-block { width:200px; text-align:center; }
    .sign-block .line { border-top:1px solid #cbd5e1; margin-top:50px; padding-top:6px; font-size:11px; color:#64748b; }
    .footer { text-align:center; color:#94a3b8; font-size:10px; margin-top:40px; border-top:1px solid #f1f5f9; padding-top:14px; }
    p { margin-bottom:8px; }
    @media print { body { padding:20px 30px; } }
  </style></head><body>
  <div class="header">
    <div>
      <div class="logo">BRIDGE <span>TECH</span></div>
      <div style="font-size:11px;color:#64748b;margin-top:3px;">Safi · Maroc</div>
    </div>
    <div class="badge">CONTRAT ${e.type}</div>
  </div>
  <h1>Contrat de Travail ${e.type}</h1>
  <div class="ref">Réf : BT-${e.type}-${String(e.id).padStart(4,"0")} &nbsp;·&nbsp; Safi, le ${today}</div>

  <div class="section">
    <div class="section-title">Entre les parties</div>
    <div class="box">
      <strong>BRIDGE TECH SARL</strong>, société à responsabilité limitée, immatriculée au RC de Safi,
      représentée par son gérant, ci-après dénommée <em>« l'Employeur »</em>.
    </div>
    <div class="box">
      <strong>${e.prenom} ${e.nom}</strong>, titulaire de la CIN n° <strong>${e.cin || "—"}</strong>,
      téléphone : <strong>${e.tel || "—"}</strong>, N° CNSS : <strong>${e.cnss || "—"}</strong>,
      ci-après dénommé(e) <em>« l'Employé(e) »</em>.
    </div>
  </div>

  <div class="section">
    <div class="section-title">Poste & conditions</div>
    <div class="grid2">
      <div class="field"><label>Poste</label><span>${e.role}</span></div>
      <div class="field"><label>Type de contrat</label><span>${e.type}</span></div>
      <div class="field"><label>Date de début</label><span>${e.dateDebut || "—"}</span></div>
      <div class="field"><label>Durée</label><span>${e.type === "CDI" ? "Indéterminée" : e.duree}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Durée du contrat</div>
    ${dureeClause}
  </div>

  <div class="section">
    <div class="section-title">Rémunération</div>
    <div class="box" style="text-align:center">
      <div style="font-size:11px;color:#64748b;margin-bottom:4px">SALAIRE BRUT MENSUEL</div>
      <div class="salaire">${new Intl.NumberFormat("fr-MA").format(e.salaire)} DH</div>
      <div style="font-size:11px;color:#94a3b8;margin-top:4px">Soumis aux cotisations CNSS (4,48%) et AMO (2,26%)</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Obligations légales</div>
    <p>Les deux parties s'engagent à respecter les dispositions du <strong>Code du Travail marocain (Loi n° 65-99)</strong>
    ainsi que la convention collective applicable.</p>
    <p>Toute résiliation doit respecter le préavis légal et les procédures prévues par la législation en vigueur.</p>
  </div>

  <div class="sign-row">
    <div class="sign-block">
      <div class="line">L'Employeur<br><strong>BRIDGE TECH SARL</strong></div>
    </div>
    <div class="sign-block">
      <div class="line">L'Employé(e)<br><strong>${e.prenom} ${e.nom}</strong></div>
    </div>
  </div>

  <div class="footer">Document généré par Bridge Tech Finance · ${today} · Confidentiel</div>
  <script>window.onload=()=>{window.print();}</script>
  </body></html>`);
  w.document.close();
}

/* ── Print payslip ── */
function printFiche(e: Employe, mois: string, calc: ReturnType<typeof calcFiche>, heuresSup: number, commissions: number, primes: number, absences: number) {
  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) return;
  const n2 = (v: number) => new Intl.NumberFormat("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  const { brutTotal, cnss, amo, ir, net, fraisPro, netImposable } = calc;

  w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
  <title>Fiche de paie — ${e.prenom} ${e.nom} — ${mois}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',Arial,sans-serif; color:#1e293b; background:#fff; padding:36px 50px; font-size:12.5px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; background:linear-gradient(135deg,#065f46,#10b981); color:#fff; border-radius:12px; padding:20px 28px; margin-bottom:24px; }
    .logo { font-size:20px; font-weight:900; letter-spacing:.04em; }
    .periode { text-align:right; font-size:11px; opacity:.85; }
    .periode strong { font-size:16px; font-weight:900; display:block; }
    .emp-box { display:grid; grid-template-columns:1fr 1fr; gap:6px 30px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px 18px; margin-bottom:20px; }
    .emp-box .field label { font-size:10px; color:#94a3b8; font-weight:700; text-transform:uppercase; letter-spacing:.04em; display:block; }
    .emp-box .field span { font-size:13px; font-weight:800; color:#1e293b; }
    table { width:100%; border-collapse:collapse; font-size:12.5px; margin-bottom:16px; }
    th { background:#0f172a; color:#94a3b8; font-size:10px; font-weight:800; letter-spacing:.06em; padding:9px 14px; text-align:left; text-transform:uppercase; }
    th:last-child { text-align:right; }
    td { padding:9px 14px; border-bottom:1px solid #f1f5f9; }
    td:last-child { text-align:right; font-weight:700; }
    tr.sub td { color:#64748b; font-size:11.5px; }
    tr.total td { background:#f8fafc; font-weight:900; font-size:14px; border-top:2px solid #e2e8f0; }
    tr.debit td { color:#ef4444; }
    .net-box { background:linear-gradient(135deg,#065f46,#10b981); border-radius:12px; padding:20px 28px; color:#fff; display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
    .net-box .label { font-size:12px; opacity:.8; font-weight:700; text-transform:uppercase; letter-spacing:.06em; }
    .net-box .amount { font-size:32px; font-weight:900; }
    .mention { font-size:10.5px; color:#94a3b8; text-align:center; margin-top:16px; border-top:1px solid #f1f5f9; padding-top:12px; }
    @media print { body { padding:16px 24px; } }
  </style></head><body>
  <div class="header">
    <div>
      <div class="logo">🚀 BRIDGE TECH</div>
      <div style="font-size:11px;opacity:.75;margin-top:4px">Safi · Maroc — SARL</div>
    </div>
    <div class="periode">
      <span>FICHE DE PAIE</span>
      <strong>${mois}</strong>
    </div>
  </div>

  <div class="emp-box">
    <div class="field"><label>Nom complet</label><span>${e.prenom} ${e.nom}</span></div>
    <div class="field"><label>CIN</label><span>${e.cin || "—"}</span></div>
    <div class="field"><label>Poste</label><span>${e.role}</span></div>
    <div class="field"><label>N° CNSS</label><span>${e.cnss || "—"}</span></div>
    <div class="field"><label>Type contrat</label><span>${e.type}</span></div>
    <div class="field"><label>Date d'entrée</label><span>${e.dateDebut || "—"}</span></div>
  </div>

  <table>
    <thead><tr><th>LIBELLÉ</th><th>BASE</th><th style="text-align:right">MONTANT (DH)</th></tr></thead>
    <tbody>
      <tr><td colspan="2"><strong>RÉMUNÉRATIONS</strong></td><td></td></tr>
      <tr class="sub"><td>Salaire de base</td><td>—</td><td>${n2(e.salaire)}</td></tr>
      ${heuresSup > 0 ? `<tr class="sub"><td>Heures supplémentaires (×1,25)</td><td>${heuresSup}h</td><td>${n2(heuresSup * (e.salaire/191) * 1.25)}</td></tr>` : ""}
      ${commissions > 0 ? `<tr class="sub"><td>Commissions</td><td>—</td><td>${n2(commissions)}</td></tr>` : ""}
      ${primes > 0 ? `<tr class="sub"><td>Primes</td><td>—</td><td>${n2(primes)}</td></tr>` : ""}
      ${absences > 0 ? `<tr class="sub debit"><td>Retenues absences</td><td>—</td><td>- ${n2(absences)}</td></tr>` : ""}
      <tr class="total"><td colspan="2">SALAIRE BRUT</td><td>${n2(brutTotal)}</td></tr>

      <tr><td colspan="3" style="padding-top:14px"><strong>COTISATIONS SALARIALES</strong></td></tr>
      <tr class="sub debit"><td>CNSS (4,48% — plafond 6 000 DH)</td><td>—</td><td>- ${n2(cnss)}</td></tr>
      <tr class="sub debit"><td>AMO (2,26%)</td><td>—</td><td>- ${n2(amo)}</td></tr>
      <tr class="sub"><td style="color:#64748b;font-size:11px">Frais professionnels déduits (20% / plaf. 2 500)</td><td></td><td style="color:#10b981">- ${n2(fraisPro)}</td></tr>
      <tr class="sub"><td style="color:#64748b;font-size:11px">Base IR imposable</td><td></td><td>${n2(netImposable)}</td></tr>
      <tr class="sub debit"><td>IR (barème progressif mensuel)</td><td>—</td><td>- ${n2(ir)}</td></tr>
    </tbody>
  </table>

  <div class="net-box">
    <div><div class="label">NET À PAYER</div><div style="font-size:11px;opacity:.7;margin-top:2px">${mois}</div></div>
    <div class="amount">${n2(net)} DH</div>
  </div>

  <div class="mention">
    Document établi par Bridge Tech SARL · ${mois} · Généré le ${new Date().toLocaleDateString("fr-FR")} ·
    À conserver par le salarié comme justificatif de salaire
  </div>
  <script>window.onload=()=>{window.print();}</script>
  </body></html>`);
  w.document.close();
}

/* ─────────────────────────────────────── CONTRATS TAB ── */
const EMPLOYES_DEMO: Employe[] = [
  { id: 1, nom: "Benali", prenom: "Youssef", cin: "BJ123456", tel: "0612345678", role: "Livreur", type: "CDI", salaire: 3200, dateDebut: "2025-01-15", duree: "", cnss: "1234567", actif: true },
  { id: 2, nom: "Tazi", prenom: "Fatima", cin: "BK987654", tel: "0698765432", role: "Chauffeur", type: "CDD", salaire: 4500, dateDebut: "2025-06-01", duree: "6 mois", cnss: "7654321", actif: true },
  { id: 3, nom: "El Amrani", prenom: "Hassan", cin: "BE456789", tel: "0661234567", role: "Restaurateur", type: "CDI", salaire: 5000, dateDebut: "2024-09-01", duree: "", cnss: "", actif: true },
  { id: 4, nom: "Idrissi", prenom: "Salma", cin: "BH321654", tel: "0677654321", role: "Manager", type: "CDI", salaire: 7500, dateDebut: "2024-01-01", duree: "", cnss: "9876543", actif: true },
];

const EMPTY_EMP: Omit<Employe, "id"> = {
  nom: "", prenom: "", cin: "", tel: "", role: "Livreur", type: "CDI",
  salaire: 3000, dateDebut: "", duree: "", cnss: "", actif: true,
};

function ContratTab({ employes, setEmployes, onFiche }: {
  employes: Employe[];
  setEmployes: React.Dispatch<React.SetStateAction<Employe[]>>;
  onFiche: (id: number) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Employe, "id">>(EMPTY_EMP);

  const nbLivreurs    = employes.filter(e => e.role === "Livreur").length;
  const nbChauffeurs  = employes.filter(e => e.role === "Chauffeur").length;
  const nbRestau      = employes.filter(e => e.role === "Restaurateur").length;
  const masseSalariale = employes.filter(e => e.actif).reduce((s, e) => s + e.salaire, 0);

  const saveEmp = () => {
    if (!form.nom.trim() || !form.prenom.trim()) return;
    setEmployes(prev => [...prev, { ...form, id: Date.now() }]);
    setForm(EMPTY_EMP);
    setShowForm(false);
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        <KpiCard label="Total employés" value={String(employes.length)} sub={`${employes.filter(e=>e.actif).length} actifs`} gradient={GRADIENT_CARDS[0]} emoji="👥" />
        <KpiCard label="Livreurs" value={String(nbLivreurs)} sub="Bridge Eats" gradient={GRADIENT_CARDS[1]} emoji="🛵" />
        <KpiCard label="Chauffeurs" value={String(nbChauffeurs)} sub="Bridge Taxi" gradient={GRADIENT_CARDS[2]} emoji="🚗" />
        <KpiCard label="Masse salariale" value={fmt(masseSalariale)} sub="Brut / mois" gradient="linear-gradient(135deg,#7f1d1d,#ef4444)" emoji="💸" />
      </div>

      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 16, fontWeight: 900, color: "#1e293b" }}>📋 Registre du personnel</h2>
        <button onClick={() => setShowForm(s => !s)} style={{
          background: "linear-gradient(135deg,#065f46,#10b981)", color: "#fff",
          border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 800,
          cursor: "pointer", fontSize: 13, boxShadow: "0 4px 16px rgba(16,185,129,.35)",
        }}>
          {showForm ? "✕ Annuler" : "＋ Nouvel employé"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{
          background: "#fff", borderRadius: 16, padding: 28,
          boxShadow: "0 8px 40px rgba(16,185,129,.15)", border: "2px solid #d1fae5",
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 900, color: "#065f46", marginBottom: 20 }}>✍️ Nouveau contrat</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
            <Field label="Prénom *"><input style={inp} value={form.prenom} onChange={e => setForm(f => ({...f, prenom: e.target.value}))} placeholder="Prénom" /></Field>
            <Field label="Nom *"><input style={inp} value={form.nom} onChange={e => setForm(f => ({...f, nom: e.target.value}))} placeholder="Nom de famille" /></Field>
            <Field label="CIN"><input style={inp} value={form.cin} onChange={e => setForm(f => ({...f, cin: e.target.value}))} placeholder="AB123456" /></Field>
            <Field label="Téléphone"><input style={inp} value={form.tel} onChange={e => setForm(f => ({...f, tel: e.target.value}))} placeholder="06xxxxxxxx" /></Field>
            <Field label="N° CNSS"><input style={inp} value={form.cnss} onChange={e => setForm(f => ({...f, cnss: e.target.value}))} placeholder="Optionnel" /></Field>
            <Field label="Rôle">
              <select style={inp} value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value as Role}))}>
                <option>Livreur</option><option>Chauffeur</option><option>Restaurateur</option><option>Manager</option>
              </select>
            </Field>
            <Field label="Type contrat">
              <select style={inp} value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value as TypeContrat}))}>
                <option>CDI</option><option>CDD</option>
              </select>
            </Field>
            <Field label="Salaire brut (DH)"><input type="number" style={inp} value={form.salaire} onChange={e => setForm(f => ({...f, salaire: Number(e.target.value)}))} /></Field>
            <Field label="Date de début"><input type="date" style={inp} value={form.dateDebut} onChange={e => setForm(f => ({...f, dateDebut: e.target.value}))} /></Field>
            {form.type === "CDD" && (
              <Field label="Durée du CDD"><input style={inp} value={form.duree} onChange={e => setForm(f => ({...f, duree: e.target.value}))} placeholder="ex: 6 mois" /></Field>
            )}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button onClick={saveEmp} style={{
              background: "linear-gradient(135deg,#065f46,#10b981)", color: "#fff",
              border: "none", borderRadius: 10, padding: "11px 28px", fontWeight: 800, cursor: "pointer", fontSize: 13,
            }}>
              ✅ Enregistrer le contrat
            </button>
            <button onClick={() => setShowForm(false)} style={{
              background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 10,
              padding: "11px 20px", fontWeight: 700, cursor: "pointer", fontSize: 13,
            }}>Annuler</button>
          </div>
        </div>
      )}

      {/* Employee cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 16 }}>
        {employes.map(e => {
          const meta = ROLE_META[e.role];
          return (
            <div key={e.id} style={{
              background: "#fff", borderRadius: 16, padding: 22,
              boxShadow: "0 2px 16px rgb(0 0 0 / .08)",
              border: "1.5px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 14,
            }}>
              {/* Top row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ flexShrink: 0 }}>
                    <BridgeRoleBadge role={e.role} size={52}/>
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 15, color: "#1e293b" }}>{e.prenom} {e.nom}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{e.cin && `CIN: ${e.cin}`}</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                  <span style={{ background: meta.bg, color: meta.color, borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 800 }}>
                    {e.role}
                  </span>
                  <span style={{
                    background: e.type === "CDI" ? "#ecfdf5" : "#fef3c7",
                    color: e.type === "CDI" ? "#065f46" : "#92400e",
                    borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 800,
                  }}>{e.type}</span>
                </div>
              </div>

              {/* Details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  ["📞", e.tel || "—"],
                  ["📅", e.dateDebut || "—"],
                  ["🏦", e.cnss ? `CNSS: ${e.cnss}` : "CNSS: —"],
                  ["⏱️", e.type === "CDD" ? e.duree || "—" : "Indéterminé"],
                ].map(([icon, val]) => (
                  <div key={icon} style={{ fontSize: 12, color: "#64748b", display: "flex", gap: 5 }}>
                    <span>{icon}</span><span>{val}</span>
                  </div>
                ))}
              </div>

              {/* Salary */}
              <div style={{
                background: "linear-gradient(135deg,#f0fdf4,#dcfce7)",
                borderRadius: 10, padding: "10px 14px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#065f46" }}>SALAIRE BRUT</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: "#065f46" }}>{fmt(e.salaire)}</span>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => printContrat(e)} style={{
                  flex: 1, background: "linear-gradient(135deg,#065f46,#10b981)", color: "#fff",
                  border: "none", borderRadius: 8, padding: "9px 0", fontWeight: 800, cursor: "pointer", fontSize: 12,
                }}>
                  🖨️ Imprimer contrat
                </button>
                <button onClick={() => onFiche(e.id)} style={{
                  flex: 1, background: "linear-gradient(135deg,#4c1d95,#8b5cf6)", color: "#fff",
                  border: "none", borderRadius: 8, padding: "9px 0", fontWeight: 800, cursor: "pointer", fontSize: 12,
                }}>
                  💰 Fiche de paie
                </button>
                <button onClick={() => setEmployes(prev => prev.filter(x => x.id !== e.id))} style={{
                  background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: 8,
                  padding: "9px 12px", fontWeight: 800, cursor: "pointer", fontSize: 13,
                }}>✕</button>
              </div>
            </div>
          );
        })}
      </div>

      {employes.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
          <div style={{ fontSize: 48 }}>👤</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 12 }}>Aucun employé enregistré</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Cliquez sur « Nouvel employé » pour ajouter un contrat</div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────── FICHE PAIE TAB ── */
function FichePayeTab({ employes }: { employes: Employe[] }) {
  const MOIS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const now = new Date();

  const [empId, setEmpId] = useState<number | null>(employes[0]?.id ?? null);
  const [moisIdx, setMoisIdx] = useState(now.getMonth());
  const [annee, setAnnee] = useState(now.getFullYear());
  const [heuresSup, setHeuresSup] = useState(0);
  const [commissions, setCommissions] = useState(0);
  const [primes, setPrimes] = useState(0);
  const [absences, setAbsences] = useState(0);

  const emp = employes.find(e => e.id === empId) ?? null;
  const moisLabel = `${MOIS[moisIdx]} ${annee}`;

  const calc = emp ? calcFiche(emp.salaire, heuresSup, commissions, primes, absences) : null;
  const n2 = (v: number) => new Intl.NumberFormat("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  const Row = ({ label, value, color, bold, sub }: { label: string; value: string; color?: string; bold?: boolean; sub?: boolean }) => (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: sub ? "7px 16px 7px 28px" : "10px 16px",
      borderBottom: "1px solid #f1f5f9",
      background: sub ? "#fafbfc" : "#fff",
    }}>
      <span style={{ fontSize: sub ? 12 : 13, color: sub ? "#64748b" : "#374151" }}>{label}</span>
      <span style={{ fontSize: sub ? 12 : 13, fontWeight: bold ? 900 : 700, color: color ?? "#1e293b" }}>{value}</span>
    </div>
  );

  if (employes.length === 0) return (
    <div style={{ textAlign: "center", padding: 80, color: "#94a3b8" }}>
      <div style={{ fontSize: 48 }}>📋</div>
      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 12 }}>Aucun employé</div>
      <div style={{ fontSize: 13, marginTop: 4 }}>Ajoutez d'abord des employés dans l'onglet Contrats</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>

        {/* ── Left: settings ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Employee selector */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 2px 12px rgb(0 0 0 / .07)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 900, color: "#065f46", marginBottom: 16 }}>👤 Sélectionner l'employé</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {employes.map(e => {
                const meta = ROLE_META[e.role];
                const selected = e.id === empId;
                return (
                  <button key={e.id} onClick={() => setEmpId(e.id)} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                    border: selected ? "2px solid #10b981" : "2px solid #f1f5f9",
                    borderRadius: 10, background: selected ? "#ecfdf5" : "#f8fafc",
                    cursor: "pointer", textAlign: "left",
                  }}>
                    <BridgeRoleBadge role={e.role} size={38}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 13, color: selected ? "#065f46" : "#1e293b" }}>
                        {e.prenom} {e.nom}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{e.role} · {e.type} · {fmt(e.salaire)}/mois</div>
                    </div>
                    {selected && <span style={{ color: "#10b981", fontWeight: 900 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Period */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 2px 12px rgb(0 0 0 / .07)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 900, color: "#065f46", marginBottom: 16 }}>📅 Période</h3>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Mois</label>
                <select style={inp} value={moisIdx} onChange={e => setMoisIdx(Number(e.target.value))}>
                  {MOIS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Année</label>
                <input type="number" style={inp} value={annee} onChange={e => setAnnee(Number(e.target.value))} />
              </div>
            </div>
          </div>

          {/* Elements variables */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 2px 12px rgb(0 0 0 / .07)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 900, color: "#065f46", marginBottom: 16 }}>⚙️ Éléments variables</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Heures supplémentaires", value: heuresSup, set: setHeuresSup, unit: "h", max: 80 },
                { label: "Commissions (DH)", value: commissions, set: setCommissions, unit: "DH", max: 5000 },
                { label: "Primes (DH)", value: primes, set: setPrimes, unit: "DH", max: 5000 },
                { label: "Retenues absences (DH)", value: absences, set: setAbsences, unit: "DH", max: 5000 },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{f.label}</label>
                    <span style={{
                      background: f.label.includes("Retenues") ? "linear-gradient(135deg,#7f1d1d,#ef4444)" : "linear-gradient(135deg,#065f46,#10b981)",
                      color: "#fff", borderRadius: 6, padding: "1px 8px", fontSize: 11, fontWeight: 800,
                    }}>{f.value.toLocaleString("fr-MA")} {f.unit}</span>
                  </div>
                  <input type="range" min={0} max={f.max} value={f.value} onChange={e => f.set(Number(e.target.value))}
                    style={{ width: "100%", accentColor: f.label.includes("Retenues") ? "#ef4444" : "#10b981", cursor: "pointer" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9ca3af" }}>
                    <span>0</span><span>{f.max} {f.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: payslip preview ── */}
        {emp && calc ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Header preview */}
            <div style={{
              background: "linear-gradient(135deg,#065f46,#10b981)",
              borderRadius: 16, padding: "20px 24px", color: "#fff",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 12, opacity: .75, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>Fiche de paie</div>
                <div style={{ fontSize: 20, fontWeight: 900, marginTop: 2 }}>{emp.prenom} {emp.nom}</div>
                <div style={{ fontSize: 12, opacity: .8, marginTop: 2 }}>{emp.role} · {emp.type}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, opacity: .75 }}>Période</div>
                <div style={{ fontSize: 16, fontWeight: 900 }}>{moisLabel}</div>
              </div>
            </div>

            {/* Breakdown */}
            <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgb(0 0 0 / .07)" }}>
              {/* Gains */}
              <div style={{ padding: "12px 16px 8px", background: "#f0fdf4", borderBottom: "2px solid #bbf7d0" }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: "#065f46", letterSpacing: ".06em", textTransform: "uppercase" }}>
                  ▲ GAINS
                </span>
              </div>
              <Row label="Salaire de base" value={`${n2(emp.salaire)} DH`} />
              {heuresSup > 0 && <Row label={`Heures sup. (${heuresSup}h × 1,25)`} value={`+ ${n2(heuresSup * (emp.salaire/191) * 1.25)} DH`} color="#10b981" sub />}
              {commissions > 0 && <Row label="Commissions" value={`+ ${n2(commissions)} DH`} color="#10b981" sub />}
              {primes > 0 && <Row label="Primes" value={`+ ${n2(primes)} DH`} color="#10b981" sub />}
              {absences > 0 && <Row label="Retenues absences" value={`- ${n2(absences)} DH`} color="#ef4444" sub />}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "11px 16px", background: "#f0fdf4", borderTop: "2px solid #bbf7d0", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ fontWeight: 900, fontSize: 13, color: "#065f46" }}>SALAIRE BRUT</span>
                <span style={{ fontWeight: 900, fontSize: 15, color: "#065f46" }}>{n2(calc.brutTotal)} DH</span>
              </div>

              {/* Cotisations */}
              <div style={{ padding: "12px 16px 8px", background: "#fef2f2", borderBottom: "2px solid #fecaca" }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: "#b91c1c", letterSpacing: ".06em", textTransform: "uppercase" }}>
                  ▼ COTISATIONS & IR
                </span>
              </div>
              <Row label="CNSS salariale (4,48%)" value={`- ${n2(calc.cnss)} DH`} color="#ef4444" sub />
              <Row label="AMO (2,26%)" value={`- ${n2(calc.amo)} DH`} color="#ef4444" sub />
              <Row label="Frais prof. déduits (20%/plaf. 2 500)" value={`- ${n2(calc.fraisPro)} DH`} color="#64748b" sub />
              <Row label={`Base imposable IR`} value={`${n2(calc.netImposable)} DH`} color="#475569" sub />
              <Row label="IR (barème progressif)" value={`- ${n2(calc.ir)} DH`} color="#ef4444" sub />
              <div style={{ display: "flex", justifyContent: "space-between", padding: "11px 16px", background: "#fef2f2", borderTop: "2px solid #fecaca" }}>
                <span style={{ fontWeight: 900, fontSize: 13, color: "#b91c1c" }}>TOTAL RETENUES</span>
                <span style={{ fontWeight: 900, fontSize: 15, color: "#b91c1c" }}>{n2(calc.cnss + calc.amo + calc.ir)} DH</span>
              </div>
            </div>

            {/* NET */}
            <div style={{
              background: "linear-gradient(135deg,#1e293b,#334155)",
              borderRadius: 16, padding: "22px 28px", color: "#fff",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 12, opacity: .6, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>Net à payer</div>
                <div style={{ fontSize: 11, opacity: .5, marginTop: 3 }}>{moisLabel}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: "#10b981", lineHeight: 1 }}>{n2(calc.net)}</div>
                <div style={{ fontSize: 14, color: "#64748b", marginTop: 2 }}>DH</div>
              </div>
            </div>

            {/* Print button */}
            <button onClick={() => printFiche(emp, moisLabel, calc, heuresSup, commissions, primes, absences)} style={{
              background: "linear-gradient(135deg,#4c1d95,#8b5cf6)", color: "#fff",
              border: "none", borderRadius: 12, padding: "14px 0", fontWeight: 900,
              cursor: "pointer", fontSize: 14, boxShadow: "0 6px 20px rgba(139,92,246,.4)",
              letterSpacing: ".04em",
            }}>
              🖨️ Imprimer / Télécharger la fiche de paie
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", borderRadius: 16, minHeight: 300, color: "#94a3b8" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40 }}>👈</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 10 }}>Sélectionnez un employé</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── Sidebar ── */
function Sidebar() {
  const prochainPaiement = new Date("2026-06-05");
  const daysLeft = Math.ceil((prochainPaiement.getTime() - Date.now()) / 86400000);

  return (
    <div style={{
      width: 220, flexShrink: 0, background: "linear-gradient(180deg,#0f172a 0%,#1e293b 100%)",
      borderRadius: 20, padding: "24px 16px", display: "flex", flexDirection: "column", gap: 22,
      boxShadow: "0 8px 32px rgb(0 0 0 / .25)", color: "#f1f5f9", minHeight: 600,
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40 }}>🚀</div>
        <div style={{ fontWeight: 900, fontSize: 15, marginTop: 6, letterSpacing: ".06em" }}>BRIDGE TECH</div>
        <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>SAFI · MAROC</div>
      </div>

      <div>
        <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: ".08em", marginBottom: 10 }}>STATUT ADMINISTRATIF</div>
        {[
          { label: "RC (Registre Commerce)", status: "⏳ En cours", color: "#f59e0b" },
          { label: "Certificat Négatif", status: "⏳ En attente", color: "#f59e0b" },
          { label: "Compte bancaire", status: "📋 À ouvrir", color: "#06b6d4" },
          { label: "IF (Identifiant Fiscal)", status: "📋 Après RC", color: "#64748b" },
          { label: "Patente", status: "📋 Après IF", color: "#64748b" },
        ].map(item => (
          <div key={item.label} style={{
            padding: "8px 10px", borderRadius: 8, marginBottom: 6,
            background: "rgba(255,255,255,.04)", display: "flex", justifyContent: "space-between", gap: 8,
          }}>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{item.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: item.color, flexShrink: 0 }}>{item.status}</span>
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: ".08em", marginBottom: 10 }}>ALERTES & ÉCHÉANCES</div>
        <div style={{ background: "rgba(245,158,11,.12)", border: "1px solid rgba(245,158,11,.3)", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 800, marginBottom: 4 }}>⚠️ Forfait comptable</div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>400 DH · dans <b style={{ color: "#fbbf24" }}>{daysLeft} jours</b></div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>{prochainPaiement.toLocaleDateString("fr-FR")}</div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: ".08em", marginBottom: 10 }}>OBLIGATIONS TVA (MAROC)</div>
        {["Déclaration mensuelle ou trimestrielle", "Délai : 31 du mois suivant", "Pénalité retard : 10%"].map(t => (
          <div key={t} style={{ fontSize: 11, color: "#64748b", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,.04)" }}>• {t}</div>
        ))}
      </div>

      <div style={{ marginTop: "auto", padding: "12px", background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.2)", borderRadius: 10 }}>
        <div style={{ fontSize: 11, color: "#10b981", fontWeight: 700, marginBottom: 4 }}>💡 Conseil Intelaka</div>
        <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>
          Préparez un prévisionnel sur 3 ans pour maximiser vos chances d'obtenir le financement.
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── App ── */
const TABS = [
  { id: "reel",      label: "🔴 Réel · Bridge",    sub: "Synchronisé Eats/Livreurs" },
  { id: "previsions", label: "📈 Prévisions CA",   sub: "Simulateur Intelaka" },
  { id: "charges",   label: "📉 Charges Tech",     sub: "Rentabilité" },
  { id: "tva",       label: "🧾 TVA",              sub: "Déclaration" },
  { id: "is",        label: "🏛️ Impôt Société",   sub: "IS Maroc" },
  { id: "contrats",  label: "📋 Contrats",         sub: "Personnel Bridge" },
  { id: "paie",      label: "💰 Fiches de paie",   sub: "CNSS · AMO · IR" },
];

export default function App() {
  const [tab, setTab] = useState("reel");
  // Personnel synchronisé : les vrais livreurs/chauffeurs (base Manager) avec
  // leur paie réelle du mois (courses livrées × 6 DH). Les employés ajoutés à
  // la main (id < 10000) sont conservés.
  const [employes, setEmployes] = useState<Employe[]>([]);
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("https://www.safi-bridge.ma/api/finance/staff")
        .then(r => (r.ok ? r.json() : Promise.reject()))
        .then((rows: { driverId: number; name: string; phone?: string | null; monthDeliveries: number; payMonth: number; totalDeliveries?: number }[]) => {
          if (!alive || !Array.isArray(rows)) return;
          setEmployes(prev => {
            const manuels = prev.filter(e => e.id < 10000);
            const synced: Employe[] = rows.map(r => ({
              id: 10000 + r.driverId,
              nom: r.name,
              prenom: "",
              cin: "",
              tel: r.phone ?? "",
              role: "Livreur",
              type: "CDD",
              salaire: r.payMonth ?? 0,
              dateDebut: "",
              duree: `${r.monthDeliveries ?? 0} course(s) ce mois × 6 DH — ${r.totalDeliveries ?? 0} au total`,
              cnss: "",
              actif: true,
            }));
            return [...synced, ...manuels];
          });
        })
        .catch(() => {});
    load();
    const t = setInterval(load, 60000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const [prixSite] = useState(8000);
  const [qteSite]  = useState(5);
  const [prixApp]  = useState(25000);
  const [qteApp]   = useState(2);
  const [abonnement] = useState(1500);

  const caTotal      = prixSite * qteSite + prixApp * qteApp + abonnement * 12;
  const chargesTotal = (950 + 200 + 400 + 500) * 12 + 300 + 1800;

  const goToFiche = (id: number) => {
    setTab("paie");
    setTimeout(() => {
      const el = document.getElementById(`emp-${id}`);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 80);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(90deg,#0f172a 0%,#1e293b 60%,#0f4c32 100%)",
        padding: "16px 32px", display: "flex", alignItems: "center", gap: 16,
        boxShadow: "0 2px 16px rgb(0 0 0 / .3)",
      }}>
        <BridgeFinanceHeaderLogo />
        <div style={{ width: 1, height: 40, background: "rgba(255,255,255,.1)", margin: "0 4px" }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9", letterSpacing: ".06em", textTransform: "uppercase" }}>
            Tableau Comptable
          </div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
            Intelaka · Charges · TVA · IS · Contrats · Paie
          </div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "#475569" }}>
          📅 {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, padding: "24px 24px", maxWidth: 1440, margin: "0 auto" }}>
        <Sidebar />

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "10px 18px", borderRadius: 12, border: "none", cursor: "pointer",
                background: tab === t.id
                  ? t.id === "contrats" ? "linear-gradient(135deg,#065f46,#10b981)"
                  : t.id === "paie"     ? "linear-gradient(135deg,#4c1d95,#8b5cf6)"
                  : "linear-gradient(135deg,#065f46,#10b981)"
                  : "rgba(255,255,255,.8)",
                color: tab === t.id ? "#fff" : "#475569",
                fontWeight: tab === t.id ? 800 : 600,
                fontSize: 13,
                boxShadow: tab === t.id ? "0 4px 16px rgba(16,185,129,.35)" : "0 1px 4px rgb(0 0 0 / .08)",
                transition: "all .2s",
              }}>
                {t.label}
                <div style={{ fontSize: 10, opacity: .75, marginTop: 1 }}>{t.sub}</div>
              </button>
            ))}
          </div>

          {/* Content */}
          {tab === "reel"       && <ReelTab />}
          {tab === "previsions" && <IntelakaTab />}
          {tab === "charges"   && <ChargesTab caTotal={caTotal} />}
          {tab === "tva"       && <TvaTab />}
          {tab === "is"        && <IsTab caTotal={caTotal} chargesTotal={chargesTotal} />}
          {tab === "contrats"  && <ContratTab employes={employes} setEmployes={setEmployes} onFiche={goToFiche} />}
          {tab === "paie"      && <FichePayeTab employes={employes} />}
        </div>
      </div>
    </div>
  );
}
