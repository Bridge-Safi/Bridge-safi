import React from "react";
import { ShoppingBag, Car, Pill, Flower2, Package, ShoppingCart, Croissant, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const SERVICES = [
  {
    id: 1,
    name: "Bridge Eats",
    subtitle: "Livraison rapide",
    status: "OUVERT",
    icon: ShoppingBag,
    gradient: "from-emerald-500 via-teal-500 to-cyan-500", // Teal/Green
  },
  {
    id: 2,
    name: "Bridge Taxi",
    subtitle: "Confort & style",
    status: "EN ATTENTE",
    icon: Car,
    gradient: "from-violet-600 via-purple-600 to-fuchsia-600", // Purple
  },
  {
    id: 3,
    name: "Bridge Pharmacie",
    subtitle: "Ouverte la nuit · Disponible 24h/24",
    status: "EN ATTENTE",
    icon: Pill,
    gradient: "from-blue-600 via-blue-500 to-sky-500", // Blue
  },
  {
    id: 4,
    name: "Bridge Fleurs",
    subtitle: "Fleurs & cadeaux",
    status: "OUVERT",
    icon: Flower2,
    gradient: "from-rose-500 via-pink-500 to-red-500", // Pink/Red
  },
  {
    id: 5,
    name: "Bridge Tabac",
    subtitle: "Livraison & retrait",
    status: "EN ATTENTE",
    icon: Package,
    gradient: "from-slate-700 via-slate-600 to-slate-800", // Slate/Dark
  },
  {
    id: 6,
    name: "Bridge Supermarché",
    subtitle: "Marjane · Carrefour · Bim — livrés chez vous",
    status: "OUVERT",
    icon: ShoppingCart,
    gradient: "from-amber-500 via-orange-500 to-red-500", // Orange/Red
  },
  {
    id: 7,
    name: "Bridge Boulangerie",
    subtitle: "Pain & pâtisseries",
    status: "OUVERT",
    icon: Croissant,
    gradient: "from-yellow-500 via-amber-500 to-orange-500", // Yellow/Orange
  },
  {
    id: 8,
    name: "Bridge Souk",
    subtitle: "Vêtements · Parfums · Miel",
    status: "OUVERT",
    icon: Store,
    gradient: "from-indigo-500 via-blue-500 to-cyan-500", // Indigo/Cyan
  }
];

export function GradientBold() {
  return (
    <div className="min-h-screen bg-[#04110A] text-white p-4 font-sans max-w-[420px] mx-auto pb-12 w-full">
      <div className="mb-6 flex justify-between items-center px-1 pt-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Services</h1>
          <p className="text-sm text-zinc-400 font-medium mt-1">L'essentiel, à portée de main.</p>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {SERVICES.map((service) => (
          <div 
            key={service.id}
            className={cn(
              "relative h-48 rounded-[2rem] overflow-hidden shadow-2xl p-6 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]",
              "bg-gradient-to-br",
              service.gradient
            )}
          >
            {/* Grain / Noise Overlay for extra texture */}
            <div 
              className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
                backgroundRepeat: "repeat",
                backgroundSize: "100px 100px",
              }}
            ></div>
            
            {/* Top row: Icon and empty space */}
            <div className="relative z-10 flex justify-end">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-inner border border-white/10">
                <service.icon className="w-7 h-7 text-white drop-shadow-md" strokeWidth={2.5} />
              </div>
            </div>

            {/* Bottom row: Info & Status */}
            <div className="relative z-10 flex flex-col gap-2">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-[1.75rem] font-black text-white tracking-tight leading-none drop-shadow-md">
                  {service.name}
                </h3>
                <p className="text-white/90 text-sm font-medium leading-snug max-w-[90%] drop-shadow-sm line-clamp-1">
                  {service.subtitle}
                </p>
              </div>
              
              <div className="mt-1">
                {service.status === "OUVERT" ? (
                  <span className="inline-flex items-center gap-1.5 bg-white/25 text-white backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                    Ouvert
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-black/25 text-white backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                    En attente
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
