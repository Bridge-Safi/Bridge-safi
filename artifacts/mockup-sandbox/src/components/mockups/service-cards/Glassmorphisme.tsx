import React from "react";
import { 
  ShoppingBag, Car, Pill, Flower2, Package, 
  ShoppingCart, Croissant, Store, Search, Bell
} from "lucide-react";

export function Glassmorphisme() {
  const services = [
    {
      id: "eats",
      name: "Bridge Eats",
      subtitle: "Livraison rapide",
      status: "OUVERT",
      icon: ShoppingBag,
      gradient: "from-green-500/80 to-emerald-700/80"
    },
    {
      id: "taxi",
      name: "Bridge Taxi",
      subtitle: "Confort & style",
      status: "EN ATTENTE",
      icon: Car,
      gradient: "from-yellow-500/80 to-amber-700/80"
    },
    {
      id: "pharmacie",
      name: "Bridge Pharmacie",
      subtitle: "Ouverte la nuit · Disponible 24h/24",
      status: "EN ATTENTE",
      icon: Pill,
      gradient: "from-blue-500/80 to-indigo-700/80"
    },
    {
      id: "fleurs",
      name: "Bridge Fleurs",
      subtitle: "Fleurs & cadeaux",
      status: "OUVERT",
      icon: Flower2,
      gradient: "from-pink-500/80 to-rose-700/80"
    },
    {
      id: "tabac",
      name: "Bridge Tabac",
      subtitle: "Livraison & retrait",
      status: "EN ATTENTE",
      icon: Package,
      gradient: "from-stone-500/80 to-gray-700/80"
    },
    {
      id: "supermarche",
      name: "Bridge Supermarché",
      subtitle: "Marjane · Carrefour · Bim — livrés chez vous",
      status: "OUVERT",
      icon: ShoppingCart,
      gradient: "from-emerald-500/80 to-teal-700/80"
    },
    {
      id: "boulangerie",
      name: "Bridge Boulangerie",
      subtitle: "Pain & pâtisseries",
      status: "OUVERT",
      icon: Croissant,
      gradient: "from-orange-500/80 to-amber-700/80"
    },
    {
      id: "souk",
      name: "Bridge Souk",
      subtitle: "Vêtements · Parfums · Miel",
      status: "OUVERT",
      icon: Store,
      gradient: "from-purple-500/80 to-fuchsia-700/80"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#04110A] to-[#071C11] text-white overflow-y-auto selection:bg-[#4ADE80] selection:text-[#04110A]">
      <div className="max-w-[420px] mx-auto min-h-screen flex flex-col relative pb-8">
        
        {/* Abstract Background Orbs */}
        <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[30%] bg-[#059669] rounded-full blur-[120px] opacity-20 pointer-events-none" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-[#4ADE80] rounded-full blur-[150px] opacity-10 pointer-events-none" />
        
        {/* Header */}
        <header className="sticky top-0 z-20 px-4 pt-12 pb-4 backdrop-blur-xl bg-[#04110A]/60 border-b border-white/5">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-white/60 text-sm font-medium mb-1">Bienvenue sur</p>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                Bridge Safi
              </h1>
            </div>
            <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md relative hover:bg-white/10 transition-colors">
              <Bell size={18} className="text-white/80" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#FDE047] rounded-full shadow-[0_0_8px_rgba(253,224,71,0.6)]" />
            </button>
          </div>
          
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-white/40 group-focus-within:text-[#4ADE80] transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Rechercher un service..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#4ADE80]/50 focus:bg-white/10 backdrop-blur-md transition-all shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]"
            />
          </div>
        </header>

        {/* Content */}
        <main className="px-4 pt-6 flex-1 flex flex-col gap-4 relative z-10">
          <h2 className="text-white/90 text-lg font-semibold mb-2 flex items-center gap-2">
            Nos Services
            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/5">
              {services.length}
            </span>
          </h2>
          
          <div className="flex flex-col gap-3.5">
            {services.map((service) => {
              const isOpen = service.status === "OUVERT";
              const statusColor = isOpen ? "text-[#4ADE80]" : "text-[#F59E0B]";
              const statusBg = isOpen ? "bg-[#059669]/20" : "bg-[#F59E0B]/20";
              const statusBorder = isOpen ? "border-[#4ADE80]/30" : "border-[#F59E0B]/30";
              const statusGlow = isOpen ? "shadow-[0_0_12px_rgba(5,150,105,0.4)]" : "shadow-[0_0_12px_rgba(245,158,11,0.3)]";
              
              const Icon = service.icon;
              
              return (
                <div 
                  key={service.id}
                  className="group relative rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-md overflow-hidden cursor-pointer hover:shadow-[0_8px_32px_-12px_rgba(74,222,128,0.15)] flex h-28"
                >
                  {/* Glass highlight on top edge */}
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
                  
                  {/* Hover subtle green glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#059669]/0 to-[#059669]/0 group-hover:from-[#059669]/5 group-hover:to-transparent transition-all duration-500" />
                  
                  {/* Image/Icon Area (Left Col) */}
                  <div className="w-28 relative flex-shrink-0 border-r border-white/5 bg-black/20">
                    <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-40 group-hover:opacity-60 transition-opacity duration-300`} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon size={32} className="text-white drop-shadow-md group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />
                    </div>
                  </div>
                  
                  {/* Content Area (Right Col) */}
                  <div className="flex-1 p-3.5 flex flex-col justify-center relative">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-white/95 text-base tracking-tight leading-tight">
                        {service.name}
                      </h3>
                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${statusBg} ${statusBorder} border text-[10px] font-bold tracking-wider ${statusColor} ${statusGlow}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-[#4ADE80]' : 'bg-[#F59E0B]'} animate-pulse`} />
                        {service.status}
                      </div>
                    </div>
                    
                    <p className="text-sm text-white/50 line-clamp-2 leading-snug mt-1 font-medium group-hover:text-white/70 transition-colors">
                      {service.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
