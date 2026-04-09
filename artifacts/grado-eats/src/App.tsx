import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom courier icon
const courierIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:38px;height:38px;border-radius:50%;
    background:linear-gradient(135deg,#065F46,#047857);
    border:3px solid #D9C5A0;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 4px 16px rgba(6,95,70,0.4);
    font-size:18px;
  ">🛵</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

const restaurantIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:34px;height:34px;border-radius:50%;
    background:#D9C5A0;
    border:3px solid #065F46;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 3px 12px rgba(0,0,0,0.2);
    font-size:16px;
  ">🥘</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

// Courier route around Safi Plateau
const ROUTE_POINTS: [number, number][] = [
  [32.3010, -9.2420],
  [32.3005, -9.2400],
  [32.2998, -9.2385],
  [32.2990, -9.2372],
  [32.2985, -9.2360],
  [32.2978, -9.2350],
  [32.2972, -9.2355],
  [32.2968, -9.2368],
  [32.2975, -9.2380],
  [32.2982, -9.2390],
];

function MovingCourier({ step }: { step: number }) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  const pos = ROUTE_POINTS[step % ROUTE_POINTS.length];

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng(pos);
    }
  }, [pos]);

  useEffect(() => {
    const marker = L.marker(pos, { icon: courierIcon }).addTo(map);
    markerRef.current = marker;
    return () => { marker.remove(); };
  }, []);

  return null;
}

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────

type Lang = 'fr' | 'en' | 'ar';

const T = {
  fr: {
    appName: 'Grado Eats',
    tagline: 'Livraison premium à Safi',
    heroTitle: "L'Excellence Culinaire de Safi",
    heroSub: "Livraison premium au cœur de la cité de l'Atlantique",
    orderBtn: 'Explorer le Menu',
    trackTitle: 'Suivi GPS en Direct',
    trackZone: 'SAFI · PLATEAU',
    trackLive: 'EN DIRECT',
    payment: 'Modes de paiement',
    cashLabel: 'Espèces à la livraison',
    cashDesc: 'Payez en liquide à la réception',
    cardLabel: 'Carte Bancaire / CMI',
    cardDesc: 'Paiement sécurisé en ligne',
    stages: ['Reçue', 'En préparation', 'En chemin', 'Livrée'],
    stagesSub: ['Commande confirmée', 'Le chef s\'affaire', 'Votre livreur arrive', 'Bon appétit !'],
    orderStatus: 'Statut de votre commande',
    orderNum: 'Commande #GE-2847',
    eta: 'Arrivée estimée',
    etaTime: '18 min',
    contactTitle: 'Besoin d\'aide ?',
    contactSub: 'Notre équipe est disponible 7j/7',
    whatsapp: 'WhatsApp',
    phone: 'Appeler',
    email: 'Email',
    hours: 'Horaires',
    hoursVal: '8h00 – 23h00',
    navHome: 'Accueil',
    navTrack: 'Suivi',
    navContact: 'Contact',
    footer: '© 2026 Grado Eats · La nouvelle ère de la livraison à Safi',
    zone: 'Safi, Maroc',
    selectPay: 'Choisir ce mode',
    selected: 'Sélectionné ✓',
    discover: 'Découvrir',
    courierName: 'Youssef A.',
    courierRating: '4.9',
  },
  en: {
    appName: 'Grado Eats',
    tagline: 'Premium delivery in Safi',
    heroTitle: "Safi's Culinary Excellence",
    heroSub: 'Premium delivery in the heart of the Atlantic city',
    orderBtn: 'Explore Menu',
    trackTitle: 'Live GPS Tracking',
    trackZone: 'SAFI · PLATEAU',
    trackLive: 'LIVE',
    payment: 'Payment Methods',
    cashLabel: 'Cash on Delivery',
    cashDesc: 'Pay with cash when you receive',
    cardLabel: 'Credit Card / CMI',
    cardDesc: 'Secure online payment',
    stages: ['Received', 'Preparing', 'On the way', 'Delivered'],
    stagesSub: ['Order confirmed', 'Chef is cooking', 'Courier en route', 'Enjoy your meal!'],
    orderStatus: 'Your order status',
    orderNum: 'Order #GE-2847',
    eta: 'Estimated arrival',
    etaTime: '18 min',
    contactTitle: 'Need help?',
    contactSub: 'Our team is available 7 days a week',
    whatsapp: 'WhatsApp',
    phone: 'Call us',
    email: 'Email',
    hours: 'Hours',
    hoursVal: '8:00 AM – 11:00 PM',
    navHome: 'Home',
    navTrack: 'Track',
    navContact: 'Contact',
    footer: '© 2026 Grado Eats · Safi\'s New Era of Delivery',
    zone: 'Safi, Morocco',
    selectPay: 'Select this',
    selected: 'Selected ✓',
    discover: 'Discover',
    courierName: 'Youssef A.',
    courierRating: '4.9',
  },
  ar: {
    appName: 'غرادو إيتس',
    tagline: 'توصيل راقٍ في آسفي',
    heroTitle: 'التميز في فن الطبخ بآسفي',
    heroSub: 'توصيل راقٍ في قلب مدينة المحيط',
    orderBtn: 'تصفح القائمة',
    trackTitle: 'تتبع GPS مباشر',
    trackZone: 'آسفي · الهضبة',
    trackLive: 'مباشر',
    payment: 'طرق الدفع',
    cashLabel: 'نقداً عند الاستلام',
    cashDesc: 'ادفع نقداً عند استلام طلبك',
    cardLabel: 'بطاقة بنكية / CMI',
    cardDesc: 'دفع آمن عبر الإنترنت',
    stages: ['مستلمة', 'قيد التحضير', 'في الطريق', 'تم التوصيل'],
    stagesSub: ['تم تأكيد الطلب', 'الطاهي يعمل', 'المندوب في الطريق', 'بالهناء والشفاء!'],
    orderStatus: 'حالة طلبك',
    orderNum: 'الطلب #GE-2847',
    eta: 'وقت الوصول المتوقع',
    etaTime: '١٨ دقيقة',
    contactTitle: 'هل تحتاج مساعدة؟',
    contactSub: 'فريقنا متاح 7 أيام في الأسبوع',
    whatsapp: 'واتساب',
    phone: 'اتصل بنا',
    email: 'البريد الإلكتروني',
    hours: 'ساعات العمل',
    hoursVal: '٨:٠٠ ص – ١١:٠٠ م',
    navHome: 'الرئيسية',
    navTrack: 'تتبع',
    navContact: 'تواصل',
    footer: '© 2026 غرادو إيتس · عصر جديد للتوصيل في آسفي',
    zone: 'آسفي، المغرب',
    selectPay: 'اختر هذه الطريقة',
    selected: 'تم الاختيار ✓',
    discover: 'استكشف',
    courierName: 'يوسف أ.',
    courierRating: '٤.٩',
  },
};

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function ZelligeBg({ opacity = 0.03 }: { opacity?: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none zellige-bg"
      style={{ opacity }}
    />
  );
}

function GoldDivider() {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px" style={{ background: '#E5E1D8' }} />
      <div className="w-4 h-4 rotate-45 flex-shrink-0" style={{ background: '#D9C5A0' }} />
      <div className="flex-1 h-px" style={{ background: '#E5E1D8' }} />
    </div>
  );
}

// ─── PAGES ────────────────────────────────────────────────────────────────────

function HomePage({ lang, t }: { lang: Lang; t: typeof T.fr }) {
  const [selectedPay, setSelectedPay] = useState<'cash' | 'card' | null>(null);
  const [courierStep, setCourierStep] = useState(0);
  const isAR = lang === 'ar';

  useEffect(() => {
    const interval = setInterval(() => {
      setCourierStep((s) => (s + 1) % ROUTE_POINTS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-active">
      {/* Hero */}
      <section className="relative rounded-3xl overflow-hidden shadow-2xl mb-6 group mx-5">
        <img
          src="/hero.jpeg"
          className="w-full h-72 object-cover transition-transform duration-700 group-hover:scale-105"
          alt="Grado Eats Team"
        />
        <div
          className="absolute inset-0 flex flex-col justify-end p-5"
          style={{ background: 'linear-gradient(to top, rgba(4,55,38,0.92) 0%, rgba(4,55,38,0.1) 60%, transparent 100%)' }}
        >
          <span
            className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full self-start mb-3"
            style={{ background: '#D9C5A0', color: '#065F46' }}
          >
            Safi · آسفي
          </span>
          <h2 className={`text-2xl font-black text-white leading-tight mb-1 ${isAR ? 'font-arabic' : ''}`}>
            {t.heroTitle}
          </h2>
          <p className="text-white/75 text-sm">{t.heroSub}</p>
        </div>
      </section>

      {/* CTA */}
      <div className="px-5 mb-6">
        <button
          className="w-full py-5 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #065F46, #047857)',
            color: '#FDFCF9',
            boxShadow: '0 8px 28px rgba(6,95,70,0.3)',
          }}
        >
          <span className="text-xl">🥘</span>
          {t.orderBtn}
        </button>
      </div>

      {/* GPS MAP */}
      <section className="px-5 mb-6">
        <div
          className="rounded-3xl overflow-hidden card-shadow"
          style={{ border: '1px solid #E5E1D8', background: 'white' }}
        >
          <div className="px-4 pt-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#065F46' }}>
                {t.trackTitle}
              </span>
            </div>
            <span
              className="text-[10px] font-bold px-2 py-1 rounded-full"
              style={{ background: '#FEF9EE', color: '#B45309' }}
            >
              {t.trackLive}
            </span>
          </div>

          {/* Courier card */}
          <div className="px-4 pb-3 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: '#F0FDF4', border: '2px solid #BBF7D0' }}
            >
              🛵
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: '#065F46' }}>{t.courierName}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>{t.trackZone}</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-yellow-400 text-sm">★</span>
              <span className="text-xs font-bold" style={{ color: '#1A2F23' }}>{t.courierRating}</span>
            </div>
          </div>

          <div className="h-52 mx-4 mb-4 rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E1D8' }}>
            <MapContainer
              center={[32.2990, -9.2385]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
              <Marker position={[32.3010, -9.2420]} icon={restaurantIcon}>
                <Popup>Restaurant Grado Eats</Popup>
              </Marker>
              <MovingCourier step={courierStep} />
            </MapContainer>
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="px-5 mb-6">
        <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#B45309' }}>
          {t.payment}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {/* Cash */}
          <button
            onClick={() => setSelectedPay('cash')}
            className="p-4 rounded-2xl flex flex-col items-center text-center transition-all active:scale-95"
            style={{
              background: selectedPay === 'cash' ? '#F0FDF4' : '#F9F7F2',
              border: `2px solid ${selectedPay === 'cash' ? '#065F46' : '#E5E1D8'}`,
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2"
              style={{ background: selectedPay === 'cash' ? '#D1FAE5' : '#F0EDE7' }}
            >
              🤝
            </div>
            <p className="text-[11px] font-black uppercase tracking-tight" style={{ color: '#065F46' }}>
              {t.cashLabel}
            </p>
            <p className="text-[10px] mt-1" style={{ color: '#6B7280' }}>{t.cashDesc}</p>
            {selectedPay === 'cash' && (
              <span className="mt-2 text-[10px] font-black" style={{ color: '#065F46' }}>{t.selected}</span>
            )}
          </button>

          {/* Card */}
          <button
            onClick={() => setSelectedPay('card')}
            className="p-4 rounded-2xl flex flex-col items-center text-center transition-all active:scale-95"
            style={{
              background: selectedPay === 'card' ? '#F0FDF4' : '#F9F7F2',
              border: `2px solid ${selectedPay === 'card' ? '#065F46' : '#E5E1D8'}`,
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2"
              style={{ background: selectedPay === 'card' ? '#D1FAE5' : '#F0EDE7' }}
            >
              💳
            </div>
            <p className="text-[11px] font-black uppercase tracking-tight" style={{ color: '#065F46' }}>
              {t.cardLabel}
            </p>
            <p className="text-[10px] mt-1" style={{ color: '#6B7280' }}>{t.cardDesc}</p>
            {selectedPay === 'card' && (
              <span className="mt-2 text-[10px] font-black" style={{ color: '#065F46' }}>{t.selected}</span>
            )}
          </button>
        </div>
      </section>

      <GoldDivider />

      {/* Brand badge */}
      <div className="px-5 pb-4">
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
            <p className="text-sm font-black" style={{ color: '#065F46' }}>Bridge Delivery Safi</p>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
              {lang === 'ar'
                ? 'الشريك الرسمي للتوصيل في آسفي'
                : lang === 'en'
                ? 'Official delivery partner in Safi'
                : 'Partenaire officiel de livraison à Safi'}
            </p>
            <div className="flex items-center gap-1 mt-1">
              {[1,2,3,4,5].map((i) => (
                <span key={i} className="text-yellow-400 text-xs">★</span>
              ))}
              <span className="text-xs ml-1" style={{ color: '#6B7280' }}>4.9 (312)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackingPage({ lang, t }: { lang: Lang; t: typeof T.fr }) {
  const [activeStage, setActiveStage] = useState(2);
  const [courierStep, setCourierStep] = useState(0);
  const isAR = lang === 'ar';

  useEffect(() => {
    const interval = setInterval(() => {
      setCourierStep((s) => (s + 1) % ROUTE_POINTS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-active px-5">
      {/* Order header */}
      <div
        className="rounded-3xl p-4 mb-5 card-shadow"
        style={{ background: 'white', border: '1px solid #E5E1D8' }}
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>
            {t.orderStatus}
          </p>
          <span
            className="text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{ background: '#D1FAE5', color: '#065F46' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            {t.trackLive}
          </span>
        </div>
        <p className="font-black text-base" style={{ color: '#065F46' }}>{t.orderNum}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-lg">⏱️</span>
          <p className="text-sm font-bold" style={{ color: '#1A2F23' }}>
            {t.eta}: <span style={{ color: '#065F46' }}>{t.etaTime}</span>
          </p>
        </div>
      </div>

      {/* 4-stage progress bar */}
      <div
        className="rounded-3xl p-5 mb-5 card-shadow"
        style={{ background: 'white', border: '1px solid #E5E1D8' }}
      >
        {/* Stage dots */}
        <div className="relative mb-6">
          <div
            className="absolute top-4 h-0.5"
            style={{
              left: isAR ? 'auto' : '12%',
              right: isAR ? '12%' : 'auto',
              width: '76%',
              background: '#E5E1D8',
            }}
          />
          <div
            className="absolute top-4 h-0.5 transition-all duration-700"
            style={{
              left: isAR ? 'auto' : '12%',
              right: isAR ? '12%' : 'auto',
              width: `${(activeStage / 3) * 76}%`,
              background: 'linear-gradient(to right, #065F46, #059669)',
            }}
          />
          <div className={`flex justify-between relative ${isAR ? 'flex-row-reverse' : ''}`}>
            {t.stages.map((stage, i) => (
              <div key={i} className="flex flex-col items-center" style={{ width: '25%' }}>
                <button
                  onClick={() => setActiveStage(i)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-all ${i === activeStage ? 'pulse-active' : ''}`}
                  style={{
                    background: i <= activeStage ? '#065F46' : '#E5E1D8',
                    color: i <= activeStage ? 'white' : '#9CA3AF',
                    border: i === activeStage ? '3px solid #D9C5A0' : '3px solid transparent',
                    boxShadow: i === activeStage ? '0 4px 16px rgba(6,95,70,0.35)' : 'none',
                    zIndex: 1,
                  }}
                >
                  {i < activeStage ? '✓' : i === activeStage ? ['📋','👨‍🍳','🛵','✅'][i] : ['📋','👨‍🍳','🛵','✅'][i]}
                </button>
                <p
                  className={`text-[9px] font-black uppercase tracking-tight mt-2 text-center leading-tight ${isAR ? 'font-arabic' : ''}`}
                  style={{ color: i <= activeStage ? '#065F46' : '#9CA3AF' }}
                >
                  {stage}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Current stage detail */}
        <div
          className="rounded-xl p-3 flex items-center gap-3"
          style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
        >
          <div className="text-2xl">{['📋','👨‍🍳','🛵','✅'][activeStage]}</div>
          <div>
            <p className={`text-sm font-black ${isAR ? 'font-arabic' : ''}`} style={{ color: '#065F46' }}>
              {t.stages[activeStage]}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{t.stagesSub[activeStage]}</p>
          </div>
        </div>

        {/* Stage buttons for demo */}
        <div className="flex gap-2 mt-3">
          {[0,1,2,3].map((i) => (
            <button
              key={i}
              onClick={() => setActiveStage(i)}
              className="flex-1 py-1 rounded-lg text-[10px] font-bold transition-all"
              style={{
                background: activeStage === i ? '#065F46' : '#F9F7F2',
                color: activeStage === i ? 'white' : '#6B7280',
                border: '1px solid #E5E1D8',
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Full tracking map */}
      <div
        className="rounded-3xl overflow-hidden mb-5 card-shadow"
        style={{ border: '1px solid #E5E1D8' }}
      >
        <div className="h-64">
          <MapContainer
            center={[32.2990, -9.2385]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
            attributionControl={false}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            <Marker position={[32.3010, -9.2420]} icon={restaurantIcon}>
              <Popup>🥘 Restaurant Grado Eats</Popup>
            </Marker>
            <MovingCourier step={courierStep} />
          </MapContainer>
        </div>
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'white' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm" style={{ background: '#D1FAE5' }}>🛵</div>
            <div>
              <p className="text-xs font-bold" style={{ color: '#065F46' }}>{t.courierName}</p>
              <p className="text-[10px]" style={{ color: '#6B7280' }}>{t.trackZone}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black" style={{ color: '#065F46' }}>{t.etaTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactPage({ lang, t }: { lang: Lang; t: typeof T.fr }) {
  const isAR = lang === 'ar';

  return (
    <div className="page-active px-5">
      {/* Header card */}
      <div
        className="rounded-3xl overflow-hidden mb-5 relative card-shadow"
        style={{ border: '1px solid #E5E1D8' }}
      >
        <div className="relative">
          <img
            src="/logo.jpeg"
            className="w-full h-36 object-cover"
            alt="Grado Eats"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(4,55,38,0.85) 0%, transparent 60%)' }}
          />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className={`text-white font-black text-xl ${isAR ? 'font-arabic' : ''}`}>{t.contactTitle}</p>
            <p className="text-white/75 text-sm">{t.contactSub}</p>
          </div>
        </div>
      </div>

      {/* WhatsApp */}
      <a
        href="https://wa.me/212600000000"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4 p-4 rounded-2xl mb-3 transition-all active:scale-95"
        style={{
          background: '#DCFCE7',
          border: '1.5px solid #86EFAC',
          textDecoration: 'none',
        }}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#25D366' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.124 1.532 5.859L.036 23.671l5.979-1.567A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.374l-.359-.214-3.728.977 1-3.647-.234-.374A9.818 9.818 0 112 12c0-5.422 4.396-9.818 9.818-9.818 5.421 0 9.818 4.396 9.818 9.818 0 5.421-4.397 9.818-9.818 9.818z"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-black text-sm" style={{ color: '#065F46' }}>{t.whatsapp}</p>
          <p className="text-xs" style={{ color: '#6B7280' }}>+212 6 00 00 00 00</p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2.5" style={{ transform: isAR ? 'scaleX(-1)' : '' }}>
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </a>

      {/* Phone */}
      <a
        href="tel:+212600000000"
        className="flex items-center gap-4 p-4 rounded-2xl mb-3 transition-all active:scale-95"
        style={{
          background: 'white',
          border: '1.5px solid #E5E1D8',
          textDecoration: 'none',
        }}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#F0FDF4', border: '2px solid #BBF7D0' }}>
          <span className="text-xl">📞</span>
        </div>
        <div className="flex-1">
          <p className="font-black text-sm" style={{ color: '#065F46' }}>{t.phone}</p>
          <p className="text-xs" style={{ color: '#6B7280' }}>+212 6 00 00 00 00</p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2.5" style={{ transform: isAR ? 'scaleX(-1)' : '' }}>
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </a>

      {/* Email */}
      <a
        href="mailto:contact@grado-eats.com"
        className="flex items-center gap-4 p-4 rounded-2xl mb-3 transition-all active:scale-95"
        style={{
          background: 'white',
          border: '1.5px solid #E5E1D8',
          textDecoration: 'none',
        }}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#FEF9EE', border: '2px solid #FDE68A' }}>
          <span className="text-xl">✉️</span>
        </div>
        <div className="flex-1">
          <p className="font-black text-sm" style={{ color: '#065F46' }}>{t.email}</p>
          <p className="text-xs" style={{ color: '#6B7280' }}>contact@grado-eats.com</p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2.5" style={{ transform: isAR ? 'scaleX(-1)' : '' }}>
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </a>

      {/* Hours */}
      <div
        className="flex items-center gap-4 p-4 rounded-2xl mb-3"
        style={{ background: '#FEF9EE', border: '1.5px solid #FDE68A' }}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#FEF3C7' }}>
          <span className="text-xl">🕐</span>
        </div>
        <div>
          <p className="font-black text-sm" style={{ color: '#B45309' }}>{t.hours}</p>
          <p className="text-xs font-bold mt-0.5" style={{ color: '#92400E' }}>{t.hoursVal}</p>
        </div>
      </div>

      <GoldDivider />

      {/* Zone info */}
      <div
        className="rounded-2xl p-4 text-center"
        style={{ background: '#F9F7F2', border: '1px solid #E5E1D8' }}
      >
        <p className="text-xl mb-1">📍</p>
        <p className="font-black text-sm" style={{ color: '#065F46' }}>{t.zone}</p>
        <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
          {lang === 'ar' ? 'الهضبة · وسط المدينة · بوزيدي' : lang === 'en' ? 'Plateau · City Center · Bouzidi' : 'Plateau · Centre-Ville · Bouzidi'}
        </p>
      </div>

      <div className="pb-4" />
    </div>
  );
}

// ─── SPLASH ───────────────────────────────────────────────────────────────────

function SplashScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 1.8, 100));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-50 overflow-hidden"
      style={{ background: '#FDFCF9' }}
    >
      <ZelligeBg opacity={0.04} />

      <div className="relative z-10 flex flex-col items-center">
        {/* Glow ring */}
        <div className="relative mb-6">
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-15"
            style={{ background: '#065F46', transform: 'scale(1.4)' }}
          />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(6,95,70,0.12) 0%, transparent 70%)',
              transform: 'scale(2)',
            }}
          />
          <img
            src="/logo.jpeg"
            alt="Grado Eats"
            className="w-32 h-32 rounded-full object-cover relative z-10"
            style={{
              border: '4px solid #D9C5A0',
              boxShadow: '0 0 0 8px rgba(217,197,160,0.15), 0 16px 48px rgba(6,95,70,0.25)',
            }}
          />
        </div>

        <h1 className="font-black tracking-[0.5em] text-2xl mb-1" style={{ color: '#065F46' }}>
          GRADO EATS
        </h1>
        <p className="text-xs tracking-widest font-bold mb-1" style={{ color: '#B45309' }}>
          SAFI · MAROC · آسفي
        </p>

        {/* Gold ornament */}
        <div className="flex items-center gap-2 mb-8 mt-2">
          <div className="w-8 h-px" style={{ background: '#D9C5A0' }} />
          <div className="w-1.5 h-1.5 rotate-45" style={{ background: '#D9C5A0' }} />
          <div className="w-8 h-px" style={{ background: '#D9C5A0' }} />
        </div>

        {/* Progress */}
        <div
          className="w-44 h-1.5 rounded-full overflow-hidden"
          style={{ background: '#E5E1D8' }}
        >
          <div
            className="h-full rounded-full transition-all duration-75"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(to right, #065F46, #059669)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

type Page = 'home' | 'tracking' | 'contact';

export default function App() {
  const [lang, setLang] = useState<Lang>('fr');
  const [page, setPage] = useState<Page>('home');
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3200);
    return () => clearTimeout(timer);
  }, []);

  const t = T[lang];
  const isAR = lang === 'ar';

  const cycleLang = () => {
    setLang((l) => (l === 'fr' ? 'en' : l === 'en' ? 'ar' : 'fr'));
  };

  if (showSplash) return <SplashScreen />;

  return (
    <div
      className={`min-h-screen overflow-x-hidden ${isAR ? 'rtl' : 'ltr'}`}
      style={{ background: '#FDFCF9', color: '#1A2F23' }}
    >
      {/* Global Zellige BG */}
      <div className="fixed inset-0 pointer-events-none zellige-bg" style={{ opacity: 0.025 }} />

      {/* Floating Language Toggle */}
      <div className={`fixed top-5 z-50 ${isAR ? 'left-5' : 'right-5'}`}>
        <button
          onClick={cycleLang}
          className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm transition-all active:scale-90 hover:scale-110"
          style={{
            background: 'white',
            border: '2.5px solid #D9C5A0',
            color: '#065F46',
            boxShadow: '0 4px 20px rgba(6,95,70,0.15)',
          }}
        >
          {lang.toUpperCase()}
        </button>
      </div>

      {/* Floating WhatsApp */}
      <a
        href="https://wa.me/212600000000"
        target="_blank"
        rel="noopener noreferrer"
        className={`fixed bottom-28 z-40 w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 hover:scale-110 whatsapp-glow ${isAR ? 'left-5' : 'right-5'}`}
        style={{ background: '#25D366' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.124 1.532 5.859L.036 23.671l5.979-1.567A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.374l-.359-.214-3.728.977 1-3.647-.234-.374A9.818 9.818 0 112 12c0-5.422 4.396-9.818 9.818-9.818 5.421 0 9.818 4.396 9.818 9.818 0 5.421-4.397 9.818-9.818 9.818z"/>
        </svg>
      </a>

      {/* Header */}
      <header
        className="relative pt-14 pb-4 flex flex-col items-center overflow-hidden"
        style={{ borderBottom: '1px solid #E5E1D8' }}
      >
        <img
          src="/logo.jpeg"
          className="h-16 w-16 rounded-full object-cover relative z-10"
          alt="Grado Eats"
          style={{
            border: '2.5px solid #D9C5A0',
            boxShadow: '0 4px 16px rgba(6,95,70,0.15)',
          }}
        />
        <h1
          className="mt-2 text-[11px] font-black tracking-[0.45em] uppercase relative z-10"
          style={{ color: '#065F46' }}
        >
          {isAR ? 'غرادو إيتس' : 'Grado Eats'}
        </h1>
        <p className="text-[9px] tracking-widest mt-0.5 relative z-10" style={{ color: '#B45309' }}>
          {t.zone}
        </p>
      </header>

      {/* Page content */}
      <main className="max-w-md mx-auto pt-5 pb-28">
        {page === 'home' && <HomePage lang={lang} t={t} />}
        {page === 'tracking' && <TrackingPage lang={lang} t={t} />}
        {page === 'contact' && <ContactPage lang={lang} t={t} />}
      </main>

      {/* Bottom Tab Bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 tab-bar"
        style={{
          background: 'rgba(253,252,249,0.97)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid #E5E1D8',
        }}
      >
        <div className="max-w-md mx-auto flex">
          {([
            { id: 'home', label: t.navHome, icon: '🏠' },
            { id: 'tracking', label: t.navTrack, icon: '📍' },
            { id: 'contact', label: t.navContact, icon: '💬' },
          ] as { id: Page; label: string; icon: string }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPage(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all ${isAR ? 'flex-row-reverse' : ''}`}
              style={{ flexDirection: 'column' }}
            >
              <span
                className="text-xl transition-transform"
                style={{ transform: page === tab.id ? 'scale(1.15)' : 'scale(1)' }}
              >
                {tab.icon}
              </span>
              <span
                className="text-[10px] font-black uppercase tracking-wide"
                style={{ color: page === tab.id ? '#065F46' : '#9CA3AF' }}
              >
                {tab.label}
              </span>
              {page === tab.id && (
                <div
                  className="w-5 h-0.5 rounded-full"
                  style={{ background: '#065F46' }}
                />
              )}
            </button>
          ))}
        </div>
        <p className="text-center text-[9px] pb-2" style={{ color: '#C9BFB2' }}>{t.footer}</p>
      </nav>
    </div>
  );
}
