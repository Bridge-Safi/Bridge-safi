import React from "react";
import {
  ShoppingBag,
  Car,
  Pill,
  Flower2,
  Package,
  ShoppingCart,
  Croissant,
  Store,
  MapPin,
  ChevronRight,
} from "lucide-react";

const services = [
  {
    id: "eats",
    name: "Bridge Eats",
    subtitle: "Livraison rapide",
    status: "OUVERT",
    icon: ShoppingBag,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
  },
  {
    id: "taxi",
    name: "Bridge Taxi",
    subtitle: "Confort & style",
    status: "EN ATTENTE",
    icon: Car,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
  },
  {
    id: "pharmacie",
    name: "Bridge Pharmacie",
    subtitle: "Ouverte la nuit · Disponible 24h/24",
    status: "EN ATTENTE",
    icon: Pill,
    iconColor: "text-rose-600",
    iconBg: "bg-rose-100",
  },
  {
    id: "fleurs",
    name: "Bridge Fleurs",
    subtitle: "Fleurs & cadeaux",
    status: "OUVERT",
    icon: Flower2,
    iconColor: "text-pink-600",
    iconBg: "bg-pink-100",
  },
  {
    id: "tabac",
    name: "Bridge Tabac",
    subtitle: "Livraison & retrait",
    status: "EN ATTENTE",
    icon: Package,
    iconColor: "text-slate-600",
    iconBg: "bg-slate-100",
  },
  {
    id: "supermarche",
    name: "Bridge Supermarché",
    subtitle: "Marjane · Carrefour · Bim — livrés chez vous",
    status: "OUVERT",
    icon: ShoppingCart,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
  },
  {
    id: "boulangerie",
    name: "Bridge Boulangerie",
    subtitle: "Pain & pâtisseries",
    status: "OUVERT",
    icon: Croissant,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-100",
  },
  {
    id: "souk",
    name: "Bridge Souk",
    subtitle: "Vêtements · Parfums · Miel",
    status: "OUVERT",
    icon: Store,
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-100",
  },
];

export function MinimalEpure() {
  return (
    <div className="min-h-[100dvh] bg-[#F9F9F8] p-4 sm:p-6 overflow-y-auto flex flex-col items-center font-sans">
      <div className="w-full max-w-[420px] pb-12">
        <header className="mb-8 mt-4 px-1">
          <div className="flex items-center gap-2 text-[13px] font-medium text-slate-500 mb-3">
            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
              <span className="text-xs">👋</span>
            </div>
            <span>Livraison à</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              Safi, Maroc <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900 leading-tight">
            Tous nos services,<br />
            <span className="text-slate-400 font-medium">en un seul clic.</span>
          </h1>
        </header>

        <div className="flex flex-col gap-3">
          {services.map((service) => {
            const isOuvert = service.status === "OUVERT";
            return (
              <button
                key={service.id}
                className="group relative flex items-center w-full bg-white p-4 rounded-2xl border border-black/[0.04] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] hover:border-black/[0.08] hover:-translate-y-[1px] transition-all duration-200 text-left active:scale-[0.98]"
              >
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${service.iconBg} ${service.iconColor} mr-4 transition-transform group-hover:scale-105`}
                >
                  <service.icon className="w-5 h-5 stroke-[1.8]" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-3">
                  <h3 className="text-[15px] font-bold text-slate-900 truncate mb-0.5">
                    {service.name}
                  </h3>
                  <p className="text-[13px] text-slate-500 leading-snug line-clamp-2">
                    {service.subtitle}
                  </p>
                </div>

                {/* Status Pill & Chevron */}
                <div className="flex flex-col items-end gap-2.5 shrink-0">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-[0.02em] uppercase ${
                      isOuvert
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : "bg-amber-50 text-amber-600 border border-amber-100"
                    }`}
                  >
                    {isOuvert && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 shadow-[0_0_4px_rgba(16,185,129,0.4)]" />
                    )}
                    {!isOuvert && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 shadow-[0_0_4px_rgba(245,158,11,0.4)]" />
                    )}
                    {service.status}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
