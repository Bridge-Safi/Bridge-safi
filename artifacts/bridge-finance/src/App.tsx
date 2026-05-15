import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area,
} from "recharts";

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
        {/* Sliders */}
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

        {/* Charts */}
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

      {/* Monthly projection */}
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

  const inputStyle: React.CSSProperties = {
    border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none",
  };

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

      {/* Table charges */}
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
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#94a3b8" }}>
                      ✕
                    </button>
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

        {/* Add charge */}
        <div style={{ marginTop: 20, padding: 16, background: "#f8fafc", borderRadius: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Désignation</label>
            <input style={inputStyle} value={newLabel} onChange={e => setNewLabel(e.target.value)}
              placeholder="Nom de la charge…" onKeyDown={e => e.key === "Enter" && addCharge()} />
          </div>
          <div style={{ flex: "0 1 110px", display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Montant (DH)</label>
            <input type="number" style={inputStyle} value={newMontant} onChange={e => setNewMontant(e.target.value)} placeholder="0" />
          </div>
          <div style={{ flex: "0 1 110px", display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Fréquence</label>
            <select style={inputStyle} value={newFreq} onChange={e => setNewFreq(e.target.value as any)}>
              <option value="mensuel">Mensuel</option>
              <option value="annuel">Annuel</option>
            </select>
          </div>
          <button onClick={addCharge} style={{
            background: "linear-gradient(135deg,#065f46,#10b981)", color: "#fff",
            border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 800, cursor: "pointer", fontSize: 13,
          }}>
            ➕ Ajouter
          </button>
        </div>
      </div>

      {/* Charges bar chart */}
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
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
              💵 Chiffre d'affaires TTC encaissé (DH)
            </label>
            <input
              type="number" value={ttc} onChange={e => setTtc(Number(e.target.value))}
              style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 15, fontWeight: 700, outline: "none" }}
            />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>Taux TVA ventes</label>
              <select value={tvaRate} onChange={e => setTvaRate(Number(e.target.value))}
                style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none" }}>
                <option value={7}>7% (eau, gaz)</option>
                <option value={10}>10% (restauration, hôtel)</option>
                <option value={14}>14% (transport)</option>
                <option value={20}>20% (tech, standard)</option>
              </select>
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #f1f5f9" }} />

          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
              🧾 Achats / charges TTC (déductibles)
            </label>
            <input
              type="number" value={achats} onChange={e => setAchats(Number(e.target.value))}
              style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 15, fontWeight: 700, outline: "none" }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>Taux TVA sur achats</label>
            <select value={aRate} onChange={e => setARate(Number(e.target.value))}
              style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none" }}>
              <option value={7}>7%</option>
              <option value={10}>10%</option>
              <option value={14}>14%</option>
              <option value={20}>20%</option>
            </select>
          </div>

          <div style={{ background: tvaNet >= 0 ? "#fef2f2" : "#ecfdf5", borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
              {tvaNet >= 0 ? "📌 À reverser à la DGI ce trimestre :" : "✅ Crédit de TVA à récupérer :"}
            </p>
            <p style={{ fontSize: 28, fontWeight: 900, color: tvaNet >= 0 ? "#ef4444" : "#10b981" }}>
              {fmt(Math.abs(tvaNet))}
            </p>
            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
              Fournissez les factures d'achats à votre comptable pour confirmer la déductibilité
            </p>
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
            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>* Répartition indicative basée sur les paramètres actuels</p>
          </div>

          <div style={{ background: "linear-gradient(135deg,#1e293b 0%,#334155 100%)", borderRadius: 16, padding: 24, color: "#fff" }}>
            <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 16, color: "#f1f5f9" }}>📝 Récapitulatif comptable</h3>
            {[
              ["CA TTC", fmt(ttc)],
              ["CA HT", fmt(htPercu)],
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
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "CA annuel estimé (auto)", value: fmt(caTotal), color: "#10b981" },
              { label: "Charges deductibles (auto)", value: `- ${fmt(chargesTotal)}`, color: "#ef4444" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f8fafc", borderRadius: 10 }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>{label}</span>
                <span style={{ fontWeight: 800, color }}>{value}</span>
              </div>
            ))}
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
              Charges supplémentaires déductibles (DH)
            </label>
            <input type="number" value={chargesSup} onChange={e => setChargesSup(Number(e.target.value))}
              style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 15, fontWeight: 700, outline: "none" }} />
            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Ex: amortissements, charges non listées ci-dessus</p>
          </div>

          <div style={{ background: "#fef2f2", borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 11, color: "#64748b" }}>Résultat net après IS :</p>
            <p style={{ fontSize: 26, fontWeight: 900, color: beneficeNet - isPayer > 0 ? "#10b981" : "#ef4444" }}>
              {fmt(Math.max(0, beneficeNet - isPayer))}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgb(0 0 0 / .07)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 900, color: "#1e293b", marginBottom: 16 }}>Barème IS Maroc 2024</h3>
            {slabs.map(s => (
              <div key={s.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px", borderRadius: 10, marginBottom: 8,
                background: "#f8fafc", borderLeft: `4px solid ${s.color}`,
              }}>
                <span style={{ fontSize: 12, color: "#475569" }}>{s.label}</span>
                <span style={{ fontWeight: 900, fontSize: 15, color: s.color }}>{s.taux}</span>
              </div>
            ))}
            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>
              + Cotisation minimale 0,5% du CA (min. 3 000 DH) si bénéfice nul
            </p>
          </div>

          <div style={{ background: "linear-gradient(135deg,#1e293b,#334155)", borderRadius: 16, padding: 24, color: "#fff" }}>
            <h3 style={{ fontSize: 14, fontWeight: 900, color: "#f1f5f9", marginBottom: 12 }}>📌 Calendrier IS</h3>
            {[
              { mois: "Mars", desc: "1er acompte (25% IS N-1)" },
              { mois: "Juin", desc: "2ème acompte (25%)" },
              { mois: "Septembre", desc: "3ème acompte (25%)" },
              { mois: "Décembre", desc: "4ème acompte (25%)" },
            ].map(a => (
              <div key={a.mois} style={{ display: "flex", gap: 12, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
                <span style={{ color: "#f59e0b", fontWeight: 800, minWidth: 90, fontSize: 13 }}>{a.mois}</span>
                <span style={{ color: "#94a3b8", fontSize: 12 }}>{a.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── Sidebar ── */
function Sidebar() {
  const today = new Date();
  const prochainPaiement = new Date(today.getFullYear(), today.getMonth() + 1, 5);
  const daysLeft = Math.ceil((prochainPaiement.getTime() - today.getTime()) / 86400000);

  return (
    <div style={{
      width: 260, flexShrink: 0, background: "linear-gradient(180deg,#0f172a 0%,#1e293b 100%)",
      borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 20, color: "#f1f5f9",
      boxShadow: "0 4px 24px rgb(0 0 0 / .25)",
    }}>
      <div style={{ textAlign: "center", paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,.08)" }}>
        <div style={{ fontSize: 36 }}>🚀</div>
        <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: ".06em", marginTop: 4 }}>BRIDGE TECH</div>
        <div style={{ fontSize: 11, color: "#64748b", letterSpacing: ".1em" }}>SAFI · MAROC</div>
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
        <div style={{
          background: "rgba(245,158,11,.12)", border: "1px solid rgba(245,158,11,.3)",
          borderRadius: 10, padding: 12,
        }}>
          <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 800, marginBottom: 4 }}>⚠️ Forfait comptable</div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>400 DH · dans <b style={{ color: "#fbbf24" }}>{daysLeft} jours</b></div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>{prochainPaiement.toLocaleDateString("fr-FR")}</div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: ".08em", marginBottom: 10 }}>OBLIGATIONS TVA (MAROC)</div>
        {["Déclaration mensuelle ou trimestrielle", "Délai : 31 du mois suivant", "Pénalité retard : 10%"].map(t => (
          <div key={t} style={{ fontSize: 11, color: "#64748b", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
            • {t}
          </div>
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
  { id: "previsions", label: "📈 Prévisions CA", sub: "Simulateur Intelaka" },
  { id: "charges", label: "📉 Charges Tech", sub: "Rentabilité" },
  { id: "tva", label: "🧾 TVA", sub: "Déclaration" },
  { id: "is", label: "🏛️ Impôt Société", sub: "IS Maroc" },
];

export default function App() {
  const [tab, setTab] = useState("previsions");

  // Shared state between tabs
  const [prixSite] = useState(8000);
  const [qteSite] = useState(5);
  const [prixApp] = useState(25000);
  const [qteApp] = useState(2);
  const [abonnement] = useState(1500);

  const caTotal = prixSite * qteSite + prixApp * qteApp + abonnement * 12;
  const chargesTotal = (950 + 200 + 400 + 500) * 12 + 300 + 1800;

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(90deg,#0f172a 0%,#1e293b 60%,#0f4c32 100%)",
        padding: "16px 32px", display: "flex", alignItems: "center", gap: 16,
        boxShadow: "0 2px 16px rgb(0 0 0 / .3)",
      }}>
        <span style={{ fontSize: 28 }}>🚀</span>
        <div>
          <div style={{ fontWeight: 900, fontSize: 20, color: "#f1f5f9", letterSpacing: ".04em" }}>
            BRIDGE TECH — Tableau Comptable
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Simulateur financier · Prévisionnel Intelaka · TVA · IS
          </div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "#475569" }}>
          📅 {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, padding: "24px 24px", maxWidth: 1400, margin: "0 auto" }}>
        <Sidebar />

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "10px 20px", borderRadius: 12, border: "none", cursor: "pointer",
                background: tab === t.id
                  ? "linear-gradient(135deg,#065f46,#10b981)"
                  : "rgba(255,255,255,.8)",
                color: tab === t.id ? "#fff" : "#475569",
                fontWeight: tab === t.id ? 800 : 600,
                fontSize: 13, boxShadow: tab === t.id ? "0 4px 16px rgba(16,185,129,.4)" : "0 1px 4px rgb(0 0 0 / .08)",
                transition: "all .2s",
              }}>
                {t.label}
                <div style={{ fontSize: 10, opacity: .75, marginTop: 1 }}>{t.sub}</div>
              </button>
            ))}
          </div>

          {/* Content */}
          {tab === "previsions" && <IntelakaTab />}
          {tab === "charges" && <ChargesTab caTotal={caTotal} />}
          {tab === "tva" && <TvaTab />}
          {tab === "is" && <IsTab caTotal={caTotal} chargesTotal={chargesTotal} />}
        </div>
      </div>
    </div>
  );
}
