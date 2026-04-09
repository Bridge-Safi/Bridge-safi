import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon issue with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const translations = {
  fr: {
    welcome: "L'Excellence Culinaire de Safi",
    subtitle: "Livraison premium au cœur de la cité de l'Atlantique",
    track: "Suivre mon livreur en direct",
    order: "Explorer le Menu",
    cash: "Espèces à la livraison",
    card: "Carte Bancaire / CMI",
    contact: "Besoin d'aide ?",
    footer: "© 2026 Grado Eats · La nouvelle ère de la livraison à Safi",
    live: "EN DIRECT",
    zone: "SAFI · PLATEAU",
    discover: "Découvrir",
    payment: "Modes de paiement",
    tracking: "Suivi GPS",
  },
  en: {
    welcome: "Safi's Culinary Excellence",
    subtitle: "Premium delivery in the heart of the Atlantic city",
    track: "Live Delivery Tracking",
    order: "Explore Menu",
    cash: "Cash on Delivery",
    card: "Credit Card / Secure",
    contact: "Need help?",
    footer: "© 2026 Grado Eats · Safi's New Era of Delivery",
    live: "LIVE",
    zone: "SAFI · PLATEAU",
    discover: "Discover",
    payment: "Payment Methods",
    tracking: "GPS Tracking",
  },
  ar: {
    welcome: "التميز في فن الطبخ بآسفي",
    subtitle: "توصيل راقٍ في قلب مدينة المحيط",
    track: "تتبع مباشر لطلبك",
    order: "تصفح القائمة",
    cash: "نقداً عند الاستلام",
    card: "بطاقة بنكية",
    contact: "مركز المساعدة",
    footer: "© 2026 Grado Eats · عصر جديد للتوصيل في آسفي",
    live: "مباشر",
    zone: "آسفي · الهضبة",
    discover: "استكشف",
    payment: "طرق الدفع",
    tracking: "تتبع GPS",
  },
};

type Lang = 'fr' | 'en' | 'ar';

export default function App() {
  const [lang, setLang] = useState<Lang>('fr');
  const [showSplash, setShowSplash] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 2;
      });
    }, 55);
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const t = translations[lang];
  const isRTL = lang === 'ar';

  const cycleLang = () => {
    setLang((l) => (l === 'fr' ? 'en' : l === 'en' ? 'ar' : 'fr'));
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50" style={{ background: '#FDFCF9' }}>
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full opacity-20 animate-ping"
            style={{ background: '#065F46', scale: '1.5' }}
          />
          <img
            src="/logo.jpeg"
            alt="Grado Eats"
            className="w-36 h-36 rounded-full object-cover relative z-10 shadow-2xl"
            style={{ border: '3px solid #D9C5A0' }}
          />
        </div>
        <h2 className="mt-6 font-black tracking-[0.4em] text-xl" style={{ color: '#065F46' }}>
          GRADO EATS
        </h2>
        <p className="mt-1 text-xs tracking-widest" style={{ color: '#92400E' }}>
          SAFI · MAROC
        </p>
        <div
          className="w-40 h-1 mt-6 rounded-full overflow-hidden"
          style={{ background: '#E5E1D8' }}
        >
          <div
            className="h-full rounded-full transition-all duration-75"
            style={{ width: `${progress}%`, background: '#065F46' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen overflow-x-hidden ${isRTL ? 'rtl' : 'ltr'}`}
      style={{ background: '#FDFCF9', color: '#1A2F23', fontFamily: 'system-ui, sans-serif' }}
    >
      {/* Floating Language Button */}
      <div className={`fixed top-5 z-50 ${isRTL ? 'left-5' : 'right-5'}`}>
        <button
          onClick={cycleLang}
          className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm shadow-xl transition-transform active:scale-90 hover:scale-110"
          style={{
            background: 'white',
            border: '2px solid #D9C5A0',
            color: '#065F46',
          }}
        >
          {lang.toUpperCase()}
        </button>
      </div>

      {/* Header */}
      <header className="relative pt-10 pb-4 flex flex-col items-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: "url('/zellige.png')",
            backgroundSize: '180px',
            backgroundRepeat: 'repeat',
          }}
        />
        <img
          src="/logo.jpeg"
          className="h-20 w-20 rounded-full object-cover relative z-10 shadow-lg"
          alt="Grado Logo"
          style={{ border: '2px solid #D9C5A0' }}
        />
        <h1
          className="mt-3 text-xs font-black tracking-[0.45em] uppercase relative z-10"
          style={{ color: '#065F46' }}
        >
          Grado Eats
        </h1>
        <div
          className="mt-1 w-8 h-px relative z-10"
          style={{ background: '#D9C5A0' }}
        />
      </header>

      <main className="max-w-md mx-auto px-5 pb-40">
        {/* Hero Section */}
        <section className="relative rounded-3xl overflow-hidden shadow-2xl mb-6 group">
          <img
            src="/hero.jpeg"
            className="w-full h-72 object-cover transition-transform duration-700 group-hover:scale-105"
            alt="Bridge Safi Delivery"
          />
          <div
            className="absolute inset-0 flex flex-col justify-end p-6"
            style={{
              background: 'linear-gradient(to top, rgba(6,79,59,0.92) 0%, rgba(6,79,59,0.15) 55%, transparent 100%)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full"
                style={{ background: '#D9C5A0', color: '#065F46' }}
              >
                Safi · آسفي
              </span>
            </div>
            <h2 className="text-2xl font-black text-white leading-tight mb-1">
              {t.welcome}
            </h2>
            <p className="text-white/75 text-sm">{t.subtitle}</p>
          </div>
        </section>

        {/* GPS Tracking Section */}
        <section className="mb-6">
          <div
            className="rounded-3xl overflow-hidden shadow-sm"
            style={{ border: '1px solid #E5E1D8', background: 'white' }}
          >
            <div className="px-5 pt-4 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="relative flex h-2.5 w-2.5"
                >
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ background: '#EF4444' }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-2.5 w-2.5"
                    style={{ background: '#EF4444' }}
                  />
                </span>
                <span
                  className="text-xs font-black uppercase tracking-widest"
                  style={{ color: '#065F46' }}
                >
                  {t.track}
                </span>
              </div>
              <span
                className="text-[10px] font-bold px-2 py-1 rounded-full"
                style={{ background: '#FEF3C7', color: '#92400E' }}
              >
                {t.zone}
              </span>
            </div>
            <div className="h-52 mx-4 mb-4 rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E1D8' }}>
              <MapContainer
                center={[32.2994, -9.2372]}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                <Marker position={[32.2994, -9.2372]}>
                  <Popup>
                    <div style={{ fontWeight: 'bold', color: '#065F46' }}>Grado Eats</div>
                    <div style={{ fontSize: '12px' }}>Safi Delivery Service</div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        </section>

        {/* Order Button */}
        <section className="mb-4">
          <button
            className="w-full py-5 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl"
            style={{
              background: 'linear-gradient(135deg, #065F46, #047857)',
              color: '#FDFCF9',
              boxShadow: '0 8px 32px rgba(6,95,70,0.3)',
            }}
          >
            <span className="text-xl">🥘</span>
            {t.order}
          </button>
        </section>

        {/* Payment Methods */}
        <section className="mb-4">
          <p
            className="text-[10px] font-black uppercase tracking-widest mb-3 px-1"
            style={{ color: '#92400E' }}
          >
            {t.payment}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div
              className="p-4 rounded-2xl flex flex-col items-center justify-center text-center transition-all hover:shadow-md cursor-pointer"
              style={{
                background: '#F9F7F2',
                border: '1.5px solid #E5E1D8',
              }}
            >
              <span className="text-3xl mb-2">🏦</span>
              <span
                className="text-[10px] font-black uppercase tracking-tight"
                style={{ color: '#065F46' }}
              >
                {t.card}
              </span>
            </div>
            <div
              className="p-4 rounded-2xl flex flex-col items-center justify-center text-center transition-all hover:shadow-md cursor-pointer"
              style={{
                background: '#F9F7F2',
                border: '1.5px solid #E5E1D8',
              }}
            >
              <span className="text-3xl mb-2">🤝</span>
              <span
                className="text-[10px] font-black uppercase tracking-tight"
                style={{ color: '#065F46' }}
              >
                {t.cash}
              </span>
            </div>
          </div>
        </section>

        {/* Zellige Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: '#E5E1D8' }} />
          <div className="w-5 h-5 rotate-45" style={{ background: '#D9C5A0' }} />
          <div className="flex-1 h-px" style={{ background: '#E5E1D8' }} />
        </div>

        {/* Brand Badge */}
        <div
          className="rounded-2xl p-4 flex items-center gap-4"
          style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
        >
          <img
            src="/logo.jpeg"
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
            alt="Bridge Delivery"
            style={{ border: '1px solid #D9C5A0' }}
          />
          <div>
            <p className="text-xs font-black" style={{ color: '#065F46' }}>Bridge Delivery</p>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
              {lang === 'ar'
                ? 'الشريك الرسمي للتوصيل في آسفي'
                : lang === 'en'
                ? 'Official delivery partner in Safi'
                : 'Partenaire officiel de livraison à Safi'}
            </p>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 inset-x-0 flex flex-col items-center gap-2 px-5 pt-4 pb-6 z-40"
        style={{
          background: 'rgba(253,252,249,0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid #E5E1D8',
        }}
      >
        <a
          href="https://wa.me/212600000000"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full max-w-xs py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
          style={{
            background: '#25D366',
            color: 'white',
            boxShadow: '0 4px 20px rgba(37,211,102,0.35)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.124 1.532 5.859L.036 23.671l5.979-1.567A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.374l-.359-.214-3.728.977 1-3.647-.234-.374A9.818 9.818 0 112 12c0-5.422 4.396-9.818 9.818-9.818 5.421 0 9.818 4.396 9.818 9.818 0 5.421-4.397 9.818-9.818 9.818z"/>
          </svg>
          {t.contact}
        </a>
        <p className="text-[10px]" style={{ color: '#9CA3AF' }}>
          {t.footer}
        </p>
      </nav>
    </div>
  );
}
