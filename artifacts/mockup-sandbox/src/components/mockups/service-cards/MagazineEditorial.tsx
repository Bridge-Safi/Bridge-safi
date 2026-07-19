import React from 'react';
import { 
  Utensils, 
  Car, 
  Pill, 
  Flower2, 
  Package, 
  ShoppingCart, 
  Croissant, 
  Store,
  ChevronRight,
  Clock,
  Menu,
  Search
} from 'lucide-react';

const services = [
  {
    id: 1,
    name: "Bridge Eats",
    subtitle: "Livraison rapide",
    status: "OUVERT",
    icon: Utensils,
    color: "#F97316",
    imgGradient: "from-orange-600/80 to-orange-900/90"
  },
  {
    id: 2,
    name: "Bridge Taxi",
    subtitle: "Confort & style",
    status: "EN ATTENTE",
    icon: Car,
    color: "#EAB308",
    imgGradient: "from-yellow-600/80 to-yellow-900/90"
  },
  {
    id: 3,
    name: "Bridge Pharmacie",
    subtitle: "Ouverte la nuit · Disponible 24h/24",
    status: "EN ATTENTE",
    icon: Pill,
    color: "#10B981",
    imgGradient: "from-emerald-600/80 to-emerald-900/90"
  },
  {
    id: 4,
    name: "Bridge Fleurs",
    subtitle: "Fleurs & cadeaux",
    status: "OUVERT",
    icon: Flower2,
    color: "#EC4899",
    imgGradient: "from-pink-600/80 to-pink-900/90"
  },
  {
    id: 5,
    name: "Bridge Tabac",
    subtitle: "Livraison & retrait",
    status: "EN ATTENTE",
    icon: Package,
    color: "#64748B",
    imgGradient: "from-slate-600/80 to-slate-900/90"
  },
  {
    id: 6,
    name: "Bridge Supermarché",
    subtitle: "Marjane · Carrefour · Bim — livrés chez vous",
    status: "OUVERT",
    icon: ShoppingCart,
    color: "#3B82F6",
    imgGradient: "from-blue-600/80 to-blue-900/90"
  },
  {
    id: 7,
    name: "Bridge Boulangerie",
    subtitle: "Pain & pâtisseries",
    status: "OUVERT",
    icon: Croissant,
    color: "#D97706",
    imgGradient: "from-amber-600/80 to-amber-900/90"
  },
  {
    id: 8,
    name: "Bridge Souk",
    subtitle: "Vêtements · Parfums · Miel",
    status: "OUVERT",
    icon: Store,
    color: "#8B5CF6",
    imgGradient: "from-violet-600/80 to-violet-900/90"
  }
];

export function MagazineEditorial() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#04110A] to-[#071C11] text-white font-sans overflow-y-auto selection:bg-[#4ADE80]/30 selection:text-white">
      <div className="w-full max-w-[420px] mx-auto pb-16 min-h-screen bg-[#04110A]/30 backdrop-blur-[2px] shadow-2xl border-x border-white/5">
        
        {/* Header */}
        <header className="sticky top-0 z-10 bg-[#04110A]/80 backdrop-blur-xl px-6 py-5 flex items-center justify-between border-b border-white/5">
          <Menu className="w-5 h-5 text-emerald-100/70 hover:text-white transition-colors cursor-pointer" />
          <h1 className="font-serif text-lg font-medium tracking-[0.15em] uppercase text-white/90">
            Éditorial
          </h1>
          <Search className="w-5 h-5 text-emerald-100/70 hover:text-white transition-colors cursor-pointer" />
        </header>

        {/* Hero Section */}
        <div className="px-6 pt-10 pb-8 border-b border-white/5 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#4ADE80]/10 rounded-full blur-[80px] pointer-events-none" />
          <h2 className="font-serif text-4xl leading-[1.1] mb-4 text-white">
            Découvrez<br/>
            <span className="italic text-[#4ADE80] font-light">l'Excellence.</span>
          </h2>
          <p className="text-sm text-emerald-100/60 max-w-[280px] font-light leading-relaxed">
            Une sélection de services premium, curatée pour vous et livrée avec une attention singulière.
          </p>
        </div>

        {/* Cards List */}
        <div className="px-5 space-y-5">
          {services.map((service) => (
            <div 
              key={service.id}
              className={`group relative flex h-[140px] w-full overflow-hidden bg-[#0F1F16] border-y border-r border-white/5 shadow-2xl transition-all duration-300 active:scale-[0.98] cursor-pointer
                ${service.status === 'EN ATTENTE' ? 'opacity-80 grayscale-[0.2]' : 'hover:border-white/10'}
              `}
              style={{ borderLeftColor: service.color, borderLeftWidth: '3px' }}
            >
              {/* Image Area (~40%) */}
              <div className="relative w-[42%] h-full shrink-0 overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${service.imgGradient} opacity-90 transition-transform duration-700 group-hover:scale-110`} />
                <div className="absolute inset-0 bg-black/30 mix-blend-overlay" />
                
                {/* Subtle vignette/gradient over image */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0F1F16]/40" />
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <service.icon className="w-10 h-10 text-white/90 drop-shadow-xl transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105" strokeWidth={1} />
                </div>
                
                {/* Status Badge */}
                <div className="absolute top-2.5 right-2.5">
                  {service.status === "OUVERT" ? (
                    <span className="bg-[#059669]/90 backdrop-blur-md text-white text-[8px] font-medium px-2 py-1 shadow-lg tracking-widest uppercase rounded-[2px] border border-[#059669]/50">
                      Ouvert
                    </span>
                  ) : (
                    <span className="bg-[#b45309]/90 backdrop-blur-md text-white/90 text-[8px] font-medium px-2 py-1 shadow-lg tracking-widest uppercase rounded-[2px] border border-[#b45309]/50">
                      Attente
                    </span>
                  )}
                </div>
              </div>

              {/* Content Area (~58%) */}
              <div className="w-[58%] h-full p-4 flex flex-col justify-between relative bg-gradient-to-l from-transparent to-black/20">
                <div>
                  <h3 className="text-2xl font-serif font-medium leading-[1.1] text-white/95 mb-1.5 flex flex-col">
                    <span className="text-[9px] font-sans uppercase tracking-[0.2em] text-white/40 mb-1.5 font-semibold">
                      Bridge
                    </span>
                    {service.name.replace('Bridge ', '')}
                  </h3>
                  <p className="text-[12px] italic text-emerald-100/50 leading-snug line-clamp-2 mt-1 font-serif">
                    "{service.subtitle}"
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                  <span className="text-[9px] uppercase tracking-widest text-white/40 flex items-center gap-1.5 font-medium">
                    <Clock className="w-3 h-3 text-white/30" />
                    {service.status === "OUVERT" ? "Immédiat" : "Bientôt"}
                  </span>
                  <div className="w-6 h-6 flex items-center justify-end">
                    <ChevronRight className="w-4 h-4 text-white/30 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white/80" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div className="mt-16 text-center pb-8 opacity-40">
          <Store className="w-4 h-4 mx-auto mb-3" />
          <p className="text-[10px] uppercase tracking-[0.25em] font-serif">
            Grado Eats · Édition
          </p>
          <p className="text-[9px] font-sans text-emerald-100 mt-2">
            © 2025 BRIDGE SAFI
          </p>
        </div>
      </div>
    </div>
  );
}
