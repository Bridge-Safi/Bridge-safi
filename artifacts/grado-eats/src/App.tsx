import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const courierIcon = L.divIcon({
  className: '',
  html: `<div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#065F46,#047857);border:3px solid #D9C5A0;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(6,95,70,0.4);font-size:18px;">🛵</div>`,
  iconSize: [38, 38], iconAnchor: [19, 19],
});
const restaurantIcon = L.divIcon({
  className: '',
  html: `<div style="width:34px;height:34px;border-radius:50%;background:#D9C5A0;border:3px solid #065F46;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(0,0,0,0.2);font-size:16px;">🥘</div>`,
  iconSize: [34, 34], iconAnchor: [17, 17],
});

const ROUTE_POINTS: [number, number][] = [
  [32.3010, -9.2420],[32.3005, -9.2400],[32.2998, -9.2385],
  [32.2990, -9.2372],[32.2985, -9.2360],[32.2978, -9.2350],
  [32.2972, -9.2355],[32.2968, -9.2368],[32.2975, -9.2380],
  [32.2982, -9.2390],
];

function MovingCourier({ step }: { step: number }) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  const pos = ROUTE_POINTS[step % ROUTE_POINTS.length];
  useEffect(() => { if (markerRef.current) markerRef.current.setLatLng(pos); }, [pos]);
  useEffect(() => {
    const m = L.marker(pos, { icon: courierIcon }).addTo(map);
    markerRef.current = m;
    return () => { m.remove(); };
  }, []);
  return null;
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Lang = 'fr' | 'en' | 'ar' | 'amz';

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────

const T = {
  fr: {
    appName: 'Bridge Eats', tagline: 'Livraison premium à Safi',
    heroTitle: "L'Excellence Culinaire de Safi",
    heroSub: "Livraison premium au cœur de la cité de l'Atlantique",
    orderBtn: 'Explorer le Menu',
    trackTitle: 'Suivi GPS en Direct', trackZone: 'SAFI · PLATEAU', trackLive: 'EN DIRECT',
    payment: 'Modes de paiement',
    cashLabel: 'Espèces à la livraison', cashDesc: 'Payez en liquide à la réception',
    cardLabel: 'Carte Bancaire / CMI',  cardDesc: 'Paiement sécurisé en ligne',
    stages: ['Reçue', 'En préparation', 'En chemin', 'Livrée'],
    stagesSub: ['Commande confirmée', "Le chef s'affaire", 'Votre livreur arrive', 'Bon appétit !'],
    orderStatus: 'Statut de votre commande', orderNum: 'Commande #BE-2847',
    eta: 'Arrivée estimée', etaTime: '18 min',
    contactTitle: "Besoin d'aide ?", contactSub: 'Notre équipe est disponible 7j/7',
    whatsapp: 'WhatsApp', phone: 'Appeler', email: 'Email', hours: 'Horaires', hoursVal: '8h00 – 23h00',
    navHome: 'Accueil', navTrack: 'Suivi', navContact: 'Contact',
    footer: '© 2026 Bridge Eats · bridge-eats.com', zone: 'Safi, Maroc',
    selected: 'Sélectionné ✓', courierName: 'Youssef A.', courierRating: '4.9',
    menuTitle: 'Notre Menu', addToCart: 'Ajouter', close: 'Fermer',
    safiExcl: 'Spécialité Safi', plateau: 'Plateau · Centre-Ville · Bouzidi',
    teamTitle: 'Notre Équipe', teamSub: 'Passionnés de livraison à Safi depuis 2023',
    cartTitle: 'Votre Panier', cartEmpty: 'Votre panier est vide', total: 'Total',
    checkout: 'Commander', checkoutTitle: 'Finaliser la commande',
    nameLabel: 'Votre prénom', addrLabel: 'Adresse à Safi', phoneLabel: 'Numéro de téléphone',
    namePh: 'Ex: Youssef', addrPh: 'Quartier, rue, numéro...', phonePh: '06 00 00 00 00',
    confirmOrder: 'Confirmer via WhatsApp 🚀', backToCart: '← Retour au panier',
    fillAll: 'Merci de remplir tous les champs',
    waMsgHeader: '🛍️ Nouvelle commande Bridge Eats\n\n📦 Articles:\n',
    waMsgFooter: (total: number, name: string, addr: string, phone: string) =>
      `\n💰 Total: ${total} MAD\n\n👤 Nom: ${name}\n📍 Adresse: ${addr}, Safi\n📞 Tél: ${phone}\n\nMerci de confirmer ma commande ! 🙏`,
  },
  en: {
    appName: 'Bridge Eats', tagline: 'Premium delivery in Safi',
    heroTitle: "Safi's Culinary Excellence",
    heroSub: 'Premium delivery in the heart of the Atlantic city',
    orderBtn: 'Explore Menu',
    trackTitle: 'Live GPS Tracking', trackZone: 'SAFI · PLATEAU', trackLive: 'LIVE',
    payment: 'Payment Methods',
    cashLabel: 'Cash on Delivery', cashDesc: 'Pay with cash when you receive',
    cardLabel: 'Credit Card / CMI',  cardDesc: 'Secure online payment',
    stages: ['Received', 'Preparing', 'On the way', 'Delivered'],
    stagesSub: ['Order confirmed', 'Chef is cooking', 'Courier en route', 'Enjoy your meal!'],
    orderStatus: 'Your order status', orderNum: 'Order #BE-2847',
    eta: 'Estimated arrival', etaTime: '18 min',
    contactTitle: 'Need help?', contactSub: 'Our team is available 7 days a week',
    whatsapp: 'WhatsApp', phone: 'Call us', email: 'Email', hours: 'Hours', hoursVal: '8:00 AM – 11:00 PM',
    navHome: 'Home', navTrack: 'Track', navContact: 'Contact',
    footer: '© 2026 Bridge Eats · bridge-eats.com', zone: 'Safi, Morocco',
    selected: 'Selected ✓', courierName: 'Youssef A.', courierRating: '4.9',
    menuTitle: 'Our Menu', addToCart: 'Add', close: 'Close',
    safiExcl: 'Safi Special', plateau: 'Plateau · City Center · Bouzidi',
    teamTitle: 'Our Team', teamSub: 'Passionate about delivery in Safi since 2023',
    cartTitle: 'Your Cart', cartEmpty: 'Your cart is empty', total: 'Total',
    checkout: 'Order Now', checkoutTitle: 'Complete your order',
    nameLabel: 'Your name', addrLabel: 'Address in Safi', phoneLabel: 'Phone number',
    namePh: 'e.g. Youssef', addrPh: 'Neighbourhood, street, number...', phonePh: '06 00 00 00 00',
    confirmOrder: 'Confirm via WhatsApp 🚀', backToCart: '← Back to cart',
    fillAll: 'Please fill in all fields',
    waMsgHeader: '🛍️ New Bridge Eats order\n\n📦 Items:\n',
    waMsgFooter: (total: number, name: string, addr: string, phone: string) =>
      `\n💰 Total: ${total} MAD\n\n👤 Name: ${name}\n📍 Address: ${addr}, Safi\n📞 Phone: ${phone}\n\nPlease confirm my order! 🙏`,
  },
  ar: {
    appName: 'بريدج إيتس', tagline: 'توصيل راقٍ في آسفي',
    heroTitle: 'التميز في فن الطبخ بآسفي',
    heroSub: 'توصيل راقٍ في قلب مدينة المحيط',
    orderBtn: 'تصفح القائمة',
    trackTitle: 'تتبع GPS مباشر', trackZone: 'آسفي · الهضبة', trackLive: 'مباشر',
    payment: 'طرق الدفع',
    cashLabel: 'نقداً عند الاستلام', cashDesc: 'ادفع نقداً عند استلام طلبك',
    cardLabel: 'بطاقة بنكية / CMI',  cardDesc: 'دفع آمن عبر الإنترنت',
    stages: ['مستلمة', 'قيد التحضير', 'في الطريق', 'تم التوصيل'],
    stagesSub: ['تم تأكيد الطلب', 'الطاهي يعمل', 'المندوب في الطريق', 'بالهناء والشفاء!'],
    orderStatus: 'حالة طلبك', orderNum: 'الطلب #BE-2847',
    eta: 'وقت الوصول المتوقع', etaTime: '18 دقيقة',
    contactTitle: 'هل تحتاج مساعدة؟', contactSub: 'فريقنا متاح 7 أيام في الأسبوع',
    whatsapp: 'واتساب', phone: 'اتصل بنا', email: 'البريد الإلكتروني',
    hours: 'ساعات العمل', hoursVal: '8:00 ص – 11:00 م',
    navHome: 'الرئيسية', navTrack: 'تتبع', navContact: 'تواصل',
    footer: '© 2026 بريدج إيتس · bridge-eats.com', zone: 'آسفي، المغرب',
    selected: 'تم الاختيار ✓', courierName: 'يوسف أ.', courierRating: '4.9',
    menuTitle: 'قائمة الطعام', addToCart: 'أضف', close: 'إغلاق',
    safiExcl: 'تخصص آسفي', plateau: 'الهضبة · وسط المدينة · بوزيدي',
    teamTitle: 'فريقنا', teamSub: 'شغوفون بالتوصيل في آسفي منذ 2023',
    cartTitle: 'سلة الطلبات', cartEmpty: 'السلة فارغة', total: 'المجموع',
    checkout: 'اطلب الآن', checkoutTitle: 'إتمام الطلب',
    nameLabel: 'اسمك', addrLabel: 'عنوانك في آسفي', phoneLabel: 'رقم الهاتف',
    namePh: 'مثال: يوسف', addrPh: 'الحي، الشارع، الرقم...', phonePh: '06 00 00 00 00',
    confirmOrder: 'تأكيد عبر واتساب 🚀', backToCart: 'العودة للسلة ←',
    fillAll: 'يرجى ملء جميع الحقول',
    waMsgHeader: '🛍️ طلب جديد من بريدج إيتس\n\n📦 الطلبات:\n',
    waMsgFooter: (total: number, name: string, addr: string, phone: string) =>
      `\n💰 المجموع: ${total} MAD\n\n👤 الاسم: ${name}\n📍 العنوان: ${addr}، آسفي\n📞 الهاتف: ${phone}\n\nأرجو تأكيد طلبي! 🙏`,
  },
  amz: {
    appName: 'ⴱⵔⵉⴷⵊ ⵉⵢⵜⵙ', tagline: 'ⴰⵙⵙⵍⵎⴷ ⴰⵎⵇⵔⴰⵏ ⵖ ⵙⴰⴼⵉ',
    heroTitle: 'ⵜⴰⵥⵥⵓⵍⵉⵏ ⵏ ⵉⵡⵓⵔⵉⵡⵏ ⵏ ⵙⴰⴼⵉ',
    heroSub: 'ⴰⵙⵙⵍⵎⴷ ⴰⵎⵇⵔⴰⵏ ⴷⴳ ⵓⵍⵍⴰ ⵏ ⵜⵎⴷⵉⵏⵜ',
    orderBtn: 'ⵥⵔ ⵍⵉⵙⵜⴰ',
    trackTitle: 'ⴰⵙⴽⵍⵙ GPS', trackZone: 'ⵙⴰⴼⵉ · ⴰⴱⵍⴰⵟⵓ', trackLive: 'ⴷⴷⴰⵡ',
    payment: 'ⵉⵏⴰⵡⵏ ⵏ ⵓⵙⵙⴼⵍⵍⴷ',
    cashLabel: 'ⴰⴷⵔⵉⵎ ⵎⵎⵉ ⵢⴰⵙⵍⵎⴷ', cashDesc: 'ⵙⵙⴼⵍⵍⴷ ⵙ ⵓⴷⵔⵉⵎ ⵎⵎⵉ ⵜⵔⵎ',
    cardLabel: 'ⵜⴰⴽⴰⵔⴷⵜ ⵏ ⵓⵣⵔⴰⴼ / CMI', cardDesc: 'ⴰⵙⵙⴼⵍⵍⴷ ⴰⵎⵣⵡⴰⵔⵓ',
    stages: ['ⵜⵜⵓⵙⵔⵖⴰ', 'ⵜⴻⵜⵜⵓⵙⴽⴰⵔ', 'ⵖ ⵓⵣⵔⵉⵔⵉ', 'ⵜⵜⵓⵙⵍⵎⴷ'],
    stagesSub: ['ⵜⵜⵓⵙⵛⴷⵃ ⵜⴰⵖⵓⵍⵜ', 'ⴰⵎⵓⵙⵙⵓ ⵉⵜⵜⵓⵙⴽⴰⵔ', 'ⴰⵎⵥⵍⵉ ⵉⵜⵜⴰⵡⵙ', 'ⵜⵙⴼⵓⵍⵍⵓ!'],
    orderStatus: 'ⴰⵙⵉⵡⴷ ⵏ ⵜⴰⵖⵓⵍⵜ', orderNum: 'ⵜⴰⵖⵓⵍⵜ #BE-2847',
    eta: 'ⴰⴽⵓⴷ ⵏ ⵓⵙⵍⵎⴷ', etaTime: '18 ⵜⵉⵎⵉⵏⵉⵜⵉⵏ',
    contactTitle: 'ⵜⵙⵔⴰ ⵜⵉⵡⵉⵙⵉ?', contactSub: 'ⴰⴳⵔⴰⵡ ⴰⵏⵏ ⵉⵍⵍⴰ 7 ⵓⵙⵙⴰⵏ',
    whatsapp: 'WhatsApp', phone: 'ⵙⵓⵍ', email: 'ⵉⵎⴰⵢⵍ',
    hours: 'ⵜⴰⵙⵔⴰⵜ', hoursVal: '8:00 – 23:00',
    navHome: 'ⵜⴰⵣⵡⴰⵔⵜ', navTrack: 'ⴰⵙⴽⵍⵙ', navContact: 'ⴰⵎⵢⴰⵡⴰⴹ',
    footer: '© 2026 ⴱⵔⵉⴷⵊ ⵉⵢⵜⵙ · bridge-eats.com', zone: 'ⵙⴰⴼⵉ, ⵍⵎⵖⵔⵉⴱ',
    selected: 'ⵉⵜⵜⵓⴼⵔⴰ ✓', courierName: 'ⵢⵓⵙⴼ ⴰ.', courierRating: '4.9',
    menuTitle: 'ⵍⵉⵙⵜⴰ ⴰⵏⵏⵖ', addToCart: 'ⵔⵏⵓ', close: 'ⵔⴳⵍ',
    safiExcl: 'ⵏ ⵙⴰⴼⵉ', plateau: 'ⴰⴱⵍⴰⵟⵓ · ⵓⵍⵍⴰ ⵏ ⵜⵎⴷⵉⵏⵜ · ⴱⵓⵣⵉⴷⵉ',
    teamTitle: 'ⴰⴳⵔⴰⵡ ⴰⵏⵏⵖ', teamSub: 'ⵉⵃⵎⵍⵏ ⵓⵙⵙⵍⵎⴷ ⵖ ⵙⴰⴼⵉ ⵙⴳ 2023',
    cartTitle: 'ⵜⵓⴽⴽⵙⴰ', cartEmpty: 'ⵜⵓⴽⴽⵙⴰ ⵉⵔⵉⵔⵉ', total: 'ⴰⵎⵎⴰⵙ',
    checkout: 'ⵔⵏⵓ ⴰⴷ', checkoutTitle: 'ⴰⵙⵙⵍⵎⴷ ⵏ ⵜⴰⵖⵓⵍⵜ',
    nameLabel: 'ⵉⵙⵎ ⵏⵏⴽ', addrLabel: 'ⵜⴰⵙⵓⵏⵜ ⵖ ⵙⴰⴼⵉ', phoneLabel: 'ⴰⵏⵓⵎⵔ ⵏ ⵓⵙⵓⵍ',
    namePh: 'ⴰⵎ: ⵢⵓⵙⴼ', addrPh: 'ⵜⴰⵎⴷⵉⵏⵜ, ⵜⴰⵣⵇⵇⴰ...', phonePh: '06 00 00 00 00',
    confirmOrder: 'ⵙⵙⴼⵍⵍⴷ ⵙ WhatsApp 🚀', backToCart: '← ⵓⵣⵣⵍ ⵏ ⵜⵓⴽⴽⵙⴰ',
    fillAll: 'ⵎⵍⴰ ⵉⵍⵉⵙ ⴽⵓⵍⵍⵓ ⵉⴳⵎⴰⵎⵏ',
    waMsgHeader: '🛍️ ⵜⴰⵖⵓⵍⵜ ⵜⴰⵎⴰⵢⵏⵓⵜ ⵏ ⴱⵔⵉⴷⵊ ⵉⵢⵜⵙ\n\n📦 ⵉⵙⴽⴰⵔⵏ:\n',
    waMsgFooter: (total: number, name: string, addr: string, phone: string) =>
      `\n💰 ⴰⵎⵎⴰⵙ: ${total} MAD\n\n👤 ⵉⵙⵎ: ${name}\n📍 ⵜⴰⵙⵓⵏⵜ: ${addr}, ⵙⴰⴼⵉ\n📞 ⴰⵙⵓⵍ: ${phone}\n\nⵙⵛⴷ ⵜⴰⵖⵓⵍⵜ ⵉⵏⵓ! 🙏`,
  },
};

// ─── MENU DATA ────────────────────────────────────────────────────────────────

const CATEGORY_PHOTOS: Record<string, string> = {
  pizza:   'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
  kebab:   'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&q=80',
  seafood: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80',
  tacos:   'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&q=80',
  burgers: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
};

interface MenuItem {
  id: number; emoji: string; category: string;
  names: Record<Lang, string>; price: number; safi?: boolean;
}
interface CartItem extends MenuItem { qty: number; }

const MENU_ITEMS: MenuItem[] = [
  { id:1,  emoji:'🍕', category:'pizza',   price:65, safi:true,
    names:{fr:'Pizza Fruits de Mer Safi', en:'Safi Seafood Pizza', ar:'بيتزا فواكه البحر آسفي', amz:'ⴱⵉⵜⵣⴰ ⵏ ⵡⴰⵍⵍⴰⵏ ⵏ ⵙⴰⴼⵉ'} },
  { id:2,  emoji:'🍕', category:'pizza',   price:55,
    names:{fr:'Pizza Kefta Marocaine', en:'Moroccan Kefta Pizza', ar:'بيتزا الكفتة المغربية', amz:'ⴱⵉⵜⵣⴰ ⵏ ⴽⴼⵜⴰ'} },
  { id:3,  emoji:'🍕', category:'pizza',   price:50,
    names:{fr:'Pizza 4 Fromages', en:'4 Cheese Pizza', ar:'بيتزا 4 أجبان', amz:'ⴱⵉⵜⵣⴰ 4 ⵉⴼⵔⵓⵎⴰⵊⵏ'} },
  { id:4,  emoji:'🍕', category:'pizza',   price:45,
    names:{fr:'Pizza Végétarienne', en:'Vegetarian Pizza', ar:'بيتزا خضروات', amz:'ⴱⵉⵜⵣⴰ ⵏ ⵉⴷⴳⴰⵏ'} },
  { id:5,  emoji:'🌯', category:'kebab',   price:35,
    names:{fr:'Sandwich Kefta Grillé', en:'Grilled Kefta Sandwich', ar:'ساندويش الكفتة المشوية', amz:'ⵙⴰⵏⴷⵡⵉⵜⵛ ⵏ ⴽⴼⵜⴰ'} },
  { id:6,  emoji:'🌯', category:'kebab',   price:40,
    names:{fr:'Wrap Poulet Chermoula', en:'Chermoula Chicken Wrap', ar:'راب دجاج بالشرمولة', amz:'ⵡⵔⴰⴱ ⵏ ⴰⵢⵢⵓⵣ ⵛⵔⵎⵓⵍⴰ'} },
  { id:7,  emoji:'🌯', category:'kebab',   price:35,
    names:{fr:'Panini Merguez', en:'Merguez Panini', ar:'باني مرقاز', amz:'ⴱⴰⵏⵉⵏⵉ ⵏ ⵎⵔⴳⵣ'} },
  { id:8,  emoji:'🌯', category:'kebab',   price:75,
    names:{fr:'Assiette Kebab Mixte', en:'Mixed Kebab Plate', ar:'طبق كباب مشكل', amz:'ⵜⴰⵍⴼⵉⵙⵜ ⵏ ⴽⴱⴰⴱ'} },
  { id:9,  emoji:'🦞', category:'seafood', price:55, safi:true,
    names:{fr:'Chraime de Safi', en:'Safi Chraime Fish', ar:'شرايم آسفي', amz:'ⵛⵔⴰⵉⵎ ⵏ ⵙⴰⴼⵉ'} },
  { id:10, emoji:'🦞', category:'seafood', price:70, safi:true,
    names:{fr:'Tajine de Sole', en:'Sole Fish Tajine', ar:'طاجين السمك المفلطح', amz:'ⵟⴰⵊⵉⵏ ⵏ ⵜⴰⵙⵓⵍⵜ'} },
  { id:11, emoji:'🦞', category:'seafood', price:65, safi:true,
    names:{fr:'Brochettes de Crevettes', en:'Shrimp Skewers', ar:'أسياخ الجمبري', amz:'ⴱⵔⵓⵛⵜ ⵏ ⵜⵖⵍⵍⴰ'} },
  { id:12, emoji:'🦞', category:'seafood', price:40, safi:true,
    names:{fr:'Sardines Grillées Safi', en:'Grilled Safi Sardines', ar:'السردين المشوي آسفي', amz:'ⵙⵔⴷⵉⵏ ⵖ ⵜⴼⵓⵏⴰⵙⵜ'} },
  { id:13, emoji:'🌮', category:'tacos',   price:40,
    names:{fr:'Tacos Poulet Fromage', en:'Chicken Cheese Tacos', ar:'تاكو دجاج وجبن', amz:'ⵜⴰⴽⵓⵙ ⵏ ⴰⵢⵢⵓⵣ'} },
  { id:14, emoji:'🌮', category:'tacos',   price:45,
    names:{fr:'Tacos Viande Hachée', en:'Ground Beef Tacos', ar:'تاكو اللحم المفروم', amz:'ⵜⴰⴽⵓⵙ ⵏ ⴰⴽⵙⵓⵎ'} },
  { id:15, emoji:'🌮', category:'tacos',   price:55, safi:true,
    names:{fr:'Tacos Crevettes Safi', en:'Safi Shrimp Tacos', ar:'تاكو جمبري آسفي', amz:'ⵜⴰⴽⵓⵙ ⵏ ⵜⵖⵍⵍⴰ ⵙⴰⴼⵉ'} },
  { id:16, emoji:'🌮', category:'tacos',   price:35,
    names:{fr:'Tacos Végétarien', en:'Vegetarian Tacos', ar:'تاكو خضروات', amz:'ⵜⴰⴽⵓⵙ ⵏ ⵉⴷⴳⴰⵏ'} },
  { id:17, emoji:'🍔', category:'burgers', price:55,
    names:{fr:'Burger Bridge Spécial', en:'Bridge Special Burger', ar:'برغر بريدج الخاص', amz:'ⴱⵓⵔⴳⵔ ⴱⵔⵉⴷⵊ'} },
  { id:18, emoji:'🍔', category:'burgers', price:65,
    names:{fr:'Burger Double Fromage', en:'Double Cheese Burger', ar:'برغر بجبن مزدوج', amz:'ⴱⵓⵔⴳⵔ ⵙⵉⵏ ⵉⴼⵔⵓⵎⴰⵊⵏ'} },
  { id:19, emoji:'🍔', category:'burgers', price:50,
    names:{fr:'Chicken Burger Chermoula', en:'Chermoula Chicken Burger', ar:'برغر دجاج شرمولة', amz:'ⴱⵓⵔⴳⵔ ⵏ ⴰⵢⵢⵓⵣ ⵛⵔⵎⵓⵍⴰ'} },
  { id:20, emoji:'🍔', category:'burgers', price:55,
    names:{fr:'Burger Kefta Marocain', en:'Moroccan Kefta Burger', ar:'برغر الكفتة المغربية', amz:'ⴱⵓⵔⴳⵔ ⵏ ⴽⴼⵜⴰ'} },
];

const CATEGORIES = [
  { id:'pizza',   emoji:'🍕', labels:{fr:'Pizza',        en:'Pizza',   ar:'بيتزا',       amz:'ⴱⵉⵜⵣⴰ'} },
  { id:'kebab',   emoji:'🌯', labels:{fr:'Kebab',        en:'Kebab',   ar:'كباب',         amz:'ⴽⴱⴰⴱ'} },
  { id:'seafood', emoji:'🦞', labels:{fr:'Fruits de Mer',en:'Seafood', ar:'بحريات آسفي', amz:'ⵉⵙⴰⵙ ⵏ ⵙⴰⴼⵉ'} },
  { id:'tacos',   emoji:'🌮', labels:{fr:'Tacos',        en:'Tacos',   ar:'تاكو',         amz:'ⵜⴰⴽⵓⵙ'} },
  { id:'burgers', emoji:'🍔', labels:{fr:'Burgers',      en:'Burgers', ar:'برغر',         amz:'ⴱⵓⵔⴳⵔ'} },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function GoldDivider() {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px" style={{ background: '#E5E1D8' }} />
      <div className="w-3 h-3 rotate-45 flex-shrink-0" style={{ background: '#D9C5A0' }} />
      <div className="flex-1 h-px" style={{ background: '#E5E1D8' }} />
    </div>
  );
}

function fontClass(lang: Lang) {
  if (lang === 'amz') return 'font-tifinagh';
  if (lang === 'ar')  return 'font-arabic';
  return '';
}

// ─── FOOD CARD ────────────────────────────────────────────────────────────────

function FoodCard({ item, lang, onAdd, onView }: {
  item: MenuItem; lang: Lang;
  onAdd: (i: MenuItem) => void;
  onView: (i: MenuItem) => void;
}) {
  const t = T[lang];
  const photo = CATEGORY_PHOTOS[item.category];

  return (
    <div
      onClick={() => onView(item)}
      className="rounded-2xl overflow-hidden cursor-pointer transition-all active:scale-95 hover:shadow-xl"
      style={{ background: '#FDFCF9', border: '1.5px solid #E5E1D8', boxShadow: '0 3px 12px rgba(0,0,0,0.08)' }}
    >
      {/* Photo */}
      <div className="relative h-28 overflow-hidden">
        <img
          src={photo}
          alt={item.names[lang]}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.18) 0%, transparent 60%)' }} />
        {item.safi && (
          <span
            className="absolute top-2 right-2 text-[8px] font-black px-1.5 py-0.5 rounded-full"
            style={{ background: '#D9C5A0', color: '#065F46' }}
          >
            {t.safiExcl}
          </span>
        )}
      </div>
      {/* Info */}
      <div className="p-2.5">
        <p
          className={`text-[11px] font-black leading-tight mb-2 line-clamp-2 ${fontClass(lang)}`}
          style={{ color: '#1A2F23' }}
        >
          {item.names[lang]}
        </p>
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-black" style={{ color: '#065F46' }}>{item.price} MAD</span>
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(item); }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-base transition-all active:scale-90 hover:opacity-90"
            style={{ background: '#4F46E5', flexShrink: 0 }}
            title={t.addToCart}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── QUICK-VIEW MODAL ─────────────────────────────────────────────────────────

function QuickViewModal({ item, lang, onClose, onAdd }: {
  item: MenuItem; lang: Lang;
  onClose: () => void; onAdd: (i: MenuItem) => void;
}) {
  const t = T[lang];
  const isAR = lang === 'ar';
  const photo = CATEGORY_PHOTOS[item.category];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end modal-overlay"
      style={{ background: 'rgba(10,30,20,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-auto rounded-t-3xl pb-8 modal-sheet"
        style={{ background: '#FDFCF9' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-52 rounded-t-3xl overflow-hidden">
          <img src={photo} alt={item.names[lang]} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(4,55,38,0.7) 0%, transparent 55%)' }} />
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.5)' }} />
          {item.safi && (
            <span className="absolute top-4 right-4 text-[10px] font-black px-2 py-1 rounded-full" style={{ background: '#D9C5A0', color: '#065F46' }}>
              {t.safiExcl}
            </span>
          )}
        </div>
        <div className="px-6 pt-5" style={{ direction: isAR ? 'rtl' : 'ltr' }}>
          <p className={`text-xl font-black leading-snug mb-1 ${fontClass(lang)}`} style={{ color: '#065F46' }}>
            {item.names[lang]}
          </p>
          <p className="text-2xl font-black mb-5" style={{ color: '#B45309' }}>{item.price} MAD</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl font-black text-sm border-2 transition-all active:scale-95"
              style={{ borderColor: '#E5E1D8', color: '#6B7280', background: 'white' }}
            >
              {t.close}
            </button>
            <button
              onClick={() => { onAdd(item); onClose(); }}
              className="flex-1 py-3.5 rounded-2xl font-black text-sm text-white transition-all active:scale-95"
              style={{ background: '#4F46E5', boxShadow: '0 6px 20px rgba(79,70,229,0.35)' }}
            >
              {t.addToCart} · {item.price} MAD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CHECKOUT DRAWER ──────────────────────────────────────────────────────────

function CheckoutDrawer({ cart, lang, onClose, onQty }: {
  cart: CartItem[]; lang: Lang;
  onClose: () => void; onQty: (id: number, delta: number) => void;
}) {
  const t = T[lang];
  const isAR  = lang === 'ar';
  const fClass = fontClass(lang);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const [step, setStep] = useState<'cart' | 'form'>('cart');
  const [name,  setName]  = useState('');
  const [addr,  setAddr]  = useState('');
  const [phone, setPhone] = useState('');
  const [err,   setErr]   = useState('');

  const buildWhatsAppMsg = () => {
    let lines = t.waMsgHeader;
    cart.forEach((i) => {
      lines += `- ${i.names[lang]} x${i.qty} = ${i.price * i.qty} MAD\n`;
    });
    lines += t.waMsgFooter(total, name.trim(), addr.trim(), phone.trim());
    return lines;
  };

  const confirmOrder = () => {
    if (!name.trim() || !addr.trim() || !phone.trim()) {
      setErr(t.fillAll);
      return;
    }
    const msg = encodeURIComponent(buildWhatsAppMsg());
    window.open(`https://wa.me/212600000000?text=${msg}`, '_blank');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end modal-overlay"
      style={{ background: 'rgba(10,30,20,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-auto rounded-t-3xl modal-sheet"
        style={{ background: '#FDFCF9', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid #E5E1D8' }}>
          <p className={`font-black text-base ${fClass}`} style={{ color: '#065F46' }}>
            {step === 'cart' ? `🛒 ${t.cartTitle}` : `📋 ${t.checkoutTitle}`}
          </p>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center font-black" style={{ background: '#F3F4F6', color: '#6B7280', fontSize: 16 }}>✕</button>
        </div>

        {/* ── STEP 1: Cart ── */}
        {step === 'cart' && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-3" style={{ direction: isAR ? 'rtl' : 'ltr' }}>
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="text-6xl mb-3">🛒</span>
                  <p className={`text-sm font-bold ${fClass}`} style={{ color: '#9CA3AF' }}>{t.cartEmpty}</p>
                </div>
              ) : cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <img
                    src={CATEGORY_PHOTOS[item.category]}
                    alt={item.names[lang]}
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-black truncate ${fClass}`} style={{ color: '#1A2F23' }}>{item.names[lang]}</p>
                    <p className="text-xs font-bold mt-0.5" style={{ color: '#065F46' }}>{item.price * item.qty} MAD</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => onQty(item.id, -1)} className="w-7 h-7 rounded-full flex items-center justify-center font-black text-sm" style={{ background: '#F3F4F6', color: '#6B7280' }}>−</button>
                    <span className="text-sm font-black w-4 text-center" style={{ color: '#1A2F23' }}>{item.qty}</span>
                    <button onClick={() => onQty(item.id, +1)} className="w-7 h-7 rounded-full flex items-center justify-center font-black text-sm text-white" style={{ background: '#4F46E5' }}>+</button>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: '1px solid #E5E1D8' }}>
                <div className="flex justify-between items-center mb-4">
                  <span className={`font-black text-sm ${fClass}`} style={{ color: '#6B7280' }}>{t.total}</span>
                  <span className="font-black text-xl" style={{ color: '#065F46' }}>{total} MAD</span>
                </div>
                <button
                  onClick={() => setStep('form')}
                  className={`w-full py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-95 ${fClass}`}
                  style={{ background: 'linear-gradient(135deg,#065F46,#047857)', boxShadow: '0 6px 20px rgba(6,95,70,0.3)' }}
                >
                  {t.checkout} →
                </button>
              </div>
            )}
          </>
        )}

        {/* ── STEP 2: Checkout form ── */}
        {step === 'form' && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4" style={{ direction: isAR ? 'rtl' : 'ltr' }}>
              {/* Order summary mini */}
              <div className="rounded-2xl p-3 mb-5" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                {cart.map((i) => (
                  <div key={i.id} className="flex justify-between text-xs py-0.5">
                    <span className={`font-bold truncate mr-2 ${fClass}`} style={{ color: '#1A2F23' }}>{i.names[lang]} ×{i.qty}</span>
                    <span className="font-black flex-shrink-0" style={{ color: '#065F46' }}>{i.price * i.qty} MAD</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm mt-2 pt-2" style={{ borderTop: '1px solid #BBF7D0' }}>
                  <span className={`font-black ${fClass}`} style={{ color: '#065F46' }}>{t.total}</span>
                  <span className="font-black" style={{ color: '#065F46' }}>{total} MAD</span>
                </div>
              </div>

              {/* Form fields */}
              {[
                { label: t.nameLabel,  val: name,  set: setName,  ph: t.namePh  },
                { label: t.addrLabel,  val: addr,  set: setAddr,  ph: t.addrPh  },
                { label: t.phoneLabel, val: phone, set: setPhone, ph: t.phonePh, type: 'tel' },
              ].map((f, idx) => (
                <div key={idx} className="mb-4">
                  <label className={`block text-xs font-black mb-1.5 ${fClass}`} style={{ color: '#065F46' }}>{f.label}</label>
                  <input
                    type={(f as any).type || 'text'}
                    value={f.val}
                    onChange={(e) => { f.set(e.target.value); setErr(''); }}
                    placeholder={f.ph}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-bold outline-none transition-all ${fClass}`}
                    style={{
                      background: '#F9F7F2',
                      border: '2px solid #E5E1D8',
                      color: '#1A2F23',
                      fontFamily: lang === 'amz' ? "'Noto Sans Tifinagh', sans-serif" : undefined,
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#065F46'; }}
                    onBlur={(e)  => { e.currentTarget.style.borderColor = '#E5E1D8'; }}
                  />
                </div>
              ))}

              {err && (
                <p className={`text-xs font-bold mb-3 ${fClass}`} style={{ color: '#DC2626' }}>{err}</p>
              )}
            </div>

            <div className="px-5 py-4 flex-shrink-0 flex flex-col gap-2" style={{ borderTop: '1px solid #E5E1D8' }}>
              <button
                onClick={confirmOrder}
                className={`w-full py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-95 ${fClass}`}
                style={{ background: '#25D366', boxShadow: '0 6px 20px rgba(37,211,102,0.35)' }}
              >
                {t.confirmOrder}
              </button>
              <button
                onClick={() => { setStep('cart'); setErr(''); }}
                className={`text-center text-xs font-bold py-2 ${fClass}`}
                style={{ color: '#6B7280' }}
              >
                {t.backToCart}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────

function HomePage({ lang, t, onAddToCart }: {
  lang: Lang; t: typeof T.fr;
  onAddToCart: (i: MenuItem) => void;
}) {
  const [activeCat,   setActiveCat]   = useState('pizza');
  const [modalItem,   setModalItem]   = useState<MenuItem | null>(null);
  const [selectedPay, setSelectedPay] = useState<'cash' | 'card' | null>(null);
  const [courierStep, setCourierStep] = useState(0);
  const isAR  = lang === 'ar';
  const isAMZ = lang === 'amz';
  const fClass = fontClass(lang);

  useEffect(() => {
    const iv = setInterval(() => setCourierStep((s) => (s + 1) % ROUTE_POINTS.length), 2500);
    return () => clearInterval(iv);
  }, []);

  const filtered = MENU_ITEMS.filter((i) => i.category === activeCat);

  return (
    <div>
      {/* ── Hero banner ── */}
      <section className="relative mx-5 mb-6 rounded-3xl overflow-hidden shadow-xl group">
        <img src="/hero.jpeg" alt="Bridge Eats" className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(4,55,38,0.92) 0%, rgba(4,55,38,0.15) 55%, transparent 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full inline-block mb-2" style={{ background: '#D9C5A0', color: '#065F46' }}>
            SAFI · آسفي · ⵙⴰⴼⵉ
          </span>
          <h2 className={`text-xl font-black text-white leading-tight mb-1 ${fClass}`}>{t.heroTitle}</h2>
          <p className="text-white/75 text-xs mb-4">{t.heroSub}</p>
          <button
            onClick={() => document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm transition-all active:scale-95 ${fClass}`}
            style={{ background: 'linear-gradient(135deg,#065F46,#047857)', color: '#FDFCF9', boxShadow: '0 6px 24px rgba(6,95,70,0.4)' }}
          >
            <span>🍽️</span>
            {t.orderBtn}
          </button>
        </div>
      </section>

      {/* ── Menu section ── */}
      <section id="menu-section" className="mb-6" style={{ scrollMarginTop: '80px' }}>
        <div className="px-5 mb-3 flex items-center gap-2">
          <span className="text-lg">🍽️</span>
          <p className={`text-[11px] font-black uppercase tracking-widest ${fClass}`} style={{ color: '#065F46' }}>
            {t.menuTitle}
          </p>
        </div>

        {/* Category scroller */}
        <div className="flex gap-2 px-5 mb-4 overflow-x-auto hide-scrollbar pb-1" style={{ direction: isAR ? 'rtl' : 'ltr' }}>
          {CATEGORIES.map((cat) => {
            const active = activeCat === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl font-black text-[11px] transition-all active:scale-95 ${isAMZ ? 'font-tifinagh' : isAR ? 'font-arabic' : ''}`}
                style={{
                  background: active ? '#065F46' : '#FDFCF9',
                  color: active ? '#FDFCF9' : '#065F46',
                  border: `2px solid ${active ? '#065F46' : '#D9C5A0'}`,
                  boxShadow: active ? '0 4px 14px rgba(6,95,70,0.25)' : 'none',
                }}
              >
                <span>{cat.emoji}</span>
                <span>{cat.labels[lang]}</span>
              </button>
            );
          })}
        </div>

        {/* 2-col food grid */}
        <div className="px-5 grid grid-cols-2 gap-3">
          {filtered.map((item) => (
            <FoodCard key={item.id} item={item} lang={lang} onAdd={onAddToCart} onView={setModalItem} />
          ))}
        </div>
      </section>

      {/* ── Payment modes ── */}
      <section className="px-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">💳</span>
          <p className={`text-[11px] font-black uppercase tracking-widest ${fClass}`} style={{ color: '#B45309' }}>
            {t.payment}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'cash' as const, icon: '🤝', label: t.cashLabel, desc: t.cashDesc },
            { key: 'card' as const, icon: '💳', label: t.cardLabel, desc: t.cardDesc },
          ].map(({ key, icon, label, desc }) => (
            <button
              key={key}
              onClick={() => setSelectedPay(key)}
              className="p-4 rounded-2xl flex flex-col items-center text-center transition-all active:scale-95"
              style={{
                background: selectedPay === key ? '#F0FDF4' : '#FDFCF9',
                border: `2px solid ${selectedPay === key ? '#065F46' : '#E5E1D8'}`,
              }}
            >
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl mb-2"
                style={{ background: selectedPay === key ? '#D1FAE5' : '#F0EDE7' }}>
                {icon}
              </div>
              <p className={`text-[10px] font-black leading-tight ${fClass}`} style={{ color: '#065F46' }}>{label}</p>
              <p className="text-[9px] mt-1" style={{ color: '#9CA3AF' }}>{desc}</p>
              {selectedPay === key && (
                <span className={`mt-1.5 text-[9px] font-black ${fClass}`} style={{ color: '#065F46' }}>{t.selected}</span>
              )}
            </button>
          ))}
        </div>
      </section>

      <GoldDivider />

      {/* ── GPS preview ── */}
      <section className="px-5 mb-6">
        <div className="rounded-3xl overflow-hidden" style={{ border: '1.5px solid #E5E1D8', background: '#FDFCF9' }}>
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${fClass}`} style={{ color: '#065F46' }}>{t.trackTitle}</span>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEF9EE', color: '#B45309' }}>{t.trackLive}</span>
          </div>
          <div className="px-4 pb-2 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0" style={{ background: '#F0FDF4', border: '2px solid #BBF7D0' }}>🛵</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold" style={{ color: '#065F46' }}>{t.courierName}</p>
              <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{t.trackZone}</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-yellow-400 text-xs">★</span>
              <span className="text-xs font-bold" style={{ color: '#1A2F23' }}>{t.courierRating}</span>
            </div>
          </div>
          <div className="h-44 mx-4 mb-4 rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E1D8' }}>
            <MapContainer center={[32.2990, -9.2385]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
              <Marker position={[32.3010, -9.2420]} icon={restaurantIcon}><Popup>🥘 Bridge Eats</Popup></Marker>
              <MovingCourier step={courierStep} />
            </MapContainer>
          </div>
        </div>
      </section>

      {/* ── About / Team ── */}
      <section className="px-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">👥</span>
          <p className={`text-[11px] font-black uppercase tracking-widest ${fClass}`} style={{ color: '#065F46' }}>{t.teamTitle}</p>
        </div>
        <div className="rounded-3xl overflow-hidden relative" style={{ border: '1.5px solid #E5E1D8' }}>
          <img src="/hero.jpeg" alt="Bridge Eats Team" className="w-full h-44 object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(4,55,38,0.88) 0%, transparent 55%)' }} />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className={`text-white font-black text-sm mb-0.5 ${fClass}`}>Bridge Eats · Safi Delivery</p>
            <p className={`text-white/70 text-xs ${fClass}`}>{t.teamSub}</p>
          </div>
        </div>
      </section>

      {modalItem && (
        <QuickViewModal item={modalItem} lang={lang} onClose={() => setModalItem(null)} onAdd={onAddToCart} />
      )}
    </div>
  );
}

// ─── TRACKING PAGE ────────────────────────────────────────────────────────────

function TrackingPage({ lang, t }: { lang: Lang; t: typeof T.fr }) {
  const [activeStage, setActiveStage] = useState(2);
  const [courierStep, setCourierStep] = useState(0);
  const isAR = lang === 'ar';
  const fClass = fontClass(lang);

  useEffect(() => {
    const iv = setInterval(() => setCourierStep((s) => (s + 1) % ROUTE_POINTS.length), 2500);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="px-5">
      <div className="rounded-3xl p-4 mb-5" style={{ background: '#FDFCF9', border: '1.5px solid #E5E1D8', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between mb-1">
          <p className={`text-[10px] font-bold uppercase tracking-wider ${fClass}`} style={{ color: '#9CA3AF' }}>{t.orderStatus}</p>
          <span className="text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: '#D1FAE5', color: '#065F46' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />{t.trackLive}
          </span>
        </div>
        <p className={`font-black text-sm ${fClass}`} style={{ color: '#065F46' }}>{t.orderNum}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-base">⏱️</span>
          <p className="text-sm font-bold" style={{ color: '#1A2F23' }}>
            {t.eta}: <span style={{ color: '#065F46' }}>{t.etaTime}</span>
          </p>
        </div>
      </div>

      <div className="rounded-3xl p-5 mb-5" style={{ background: '#FDFCF9', border: '1.5px solid #E5E1D8', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="relative mb-6">
          <div className="absolute top-4 h-0.5" style={{ left: isAR ? 'auto' : '12%', right: isAR ? '12%' : 'auto', width: '76%', background: '#E5E1D8' }} />
          <div className="absolute top-4 h-0.5 transition-all duration-700"
            style={{ left: isAR ? 'auto' : '12%', right: isAR ? '12%' : 'auto', width: `${(activeStage / 3) * 76}%`, background: 'linear-gradient(to right,#065F46,#059669)' }} />
          <div className={`flex justify-between relative ${isAR ? 'flex-row-reverse' : ''}`}>
            {t.stages.map((stage, i) => (
              <div key={i} className="flex flex-col items-center" style={{ width: '25%' }}>
                <button
                  onClick={() => setActiveStage(i)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-all ${i === activeStage ? 'pulse-active' : ''}`}
                  style={{ background: i <= activeStage ? '#065F46' : '#E5E1D8', color: i <= activeStage ? 'white' : '#9CA3AF', border: i === activeStage ? '3px solid #D9C5A0' : '3px solid transparent', boxShadow: i === activeStage ? '0 4px 16px rgba(6,95,70,0.35)' : 'none', zIndex: 1 }}
                >
                  {i < activeStage ? '✓' : ['📋','👨‍🍳','🛵','✅'][i]}
                </button>
                <p className={`text-[9px] font-black uppercase tracking-tight mt-2 text-center leading-tight ${fClass}`} style={{ color: i <= activeStage ? '#065F46' : '#9CA3AF' }}>
                  {stage}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <div className="text-2xl">{['📋','👨‍🍳','🛵','✅'][activeStage]}</div>
          <div>
            <p className={`text-sm font-black ${fClass}`} style={{ color: '#065F46' }}>{t.stages[activeStage]}</p>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{t.stagesSub[activeStage]}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          {[0,1,2,3].map((i) => (
            <button key={i} onClick={() => setActiveStage(i)}
              className="flex-1 py-1 rounded-lg text-[10px] font-bold transition-all"
              style={{ background: activeStage === i ? '#065F46' : '#F9F7F2', color: activeStage === i ? 'white' : '#6B7280', border: '1px solid #E5E1D8' }}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl overflow-hidden mb-5" style={{ border: '1.5px solid #E5E1D8' }}>
        <div className="h-64">
          <MapContainer center={[32.2990, -9.2385]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl attributionControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            <Marker position={[32.3010, -9.2420]} icon={restaurantIcon}><Popup>🥘 Bridge Eats</Popup></Marker>
            <MovingCourier step={courierStep} />
          </MapContainer>
        </div>
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: '#FDFCF9' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm" style={{ background: '#D1FAE5' }}>🛵</div>
            <div>
              <p className="text-xs font-bold" style={{ color: '#065F46' }}>{t.courierName}</p>
              <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{t.trackZone}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: '#F0FDF4' }}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black" style={{ color: '#065F46' }}>{t.etaTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CONTACT PAGE ─────────────────────────────────────────────────────────────

function ContactPage({ lang, t }: { lang: Lang; t: typeof T.fr }) {
  const isAR  = lang === 'ar';
  const fClass = fontClass(lang);
  const arrow = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2.5" style={{ transform: isAR ? 'scaleX(-1)' : '', flexShrink: 0 }}>
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );

  return (
    <div className="px-5">
      <div className="rounded-3xl overflow-hidden mb-5 relative" style={{ border: '1.5px solid #E5E1D8' }}>
        <img src="/logo.jpeg" className="w-full h-32 object-cover" alt="Bridge Eats" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(4,55,38,0.85) 0%, transparent 55%)' }} />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className={`text-white font-black text-lg ${fClass}`}>{t.contactTitle}</p>
          <p className="text-white/70 text-xs">{t.contactSub}</p>
        </div>
      </div>

      <a href="https://wa.me/212600000000" target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-4 p-4 rounded-2xl mb-3 transition-all active:scale-95"
        style={{ background: '#DCFCE7', border: '1.5px solid #86EFAC', textDecoration: 'none' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#25D366' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.124 1.532 5.859L.036 23.671l5.979-1.567A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.374l-.359-.214-3.728.977 1-3.647-.234-.374A9.818 9.818 0 112 12c0-5.422 4.396-9.818 9.818-9.818 5.421 0 9.818 4.396 9.818 9.818 0 5.421-4.397 9.818-9.818 9.818z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-black text-sm ${fClass}`} style={{ color: '#065F46' }}>{t.whatsapp}</p>
          <p className="text-xs" style={{ color: '#6B7280' }}>+212 6 00 00 00 00</p>
        </div>
        {arrow}
      </a>

      <a href="tel:+212600000000"
        className="flex items-center gap-4 p-4 rounded-2xl mb-3 transition-all active:scale-95"
        style={{ background: '#FDFCF9', border: '1.5px solid #E5E1D8', textDecoration: 'none' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#F0FDF4', border: '2px solid #BBF7D0' }}>
          <span className="text-xl">📞</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-black text-sm ${fClass}`} style={{ color: '#065F46' }}>{t.phone}</p>
          <p className="text-xs" style={{ color: '#6B7280' }}>+212 6 00 00 00 00</p>
        </div>
        {arrow}
      </a>

      <a href="mailto:contact@bridge-eats.com"
        className="flex items-center gap-4 p-4 rounded-2xl mb-3 transition-all active:scale-95"
        style={{ background: '#FDFCF9', border: '1.5px solid #E5E1D8', textDecoration: 'none' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#FEF9EE', border: '2px solid #FDE68A' }}>
          <span className="text-xl">✉️</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-black text-sm ${fClass}`} style={{ color: '#065F46' }}>{t.email}</p>
          <p className="text-xs" style={{ color: '#6B7280' }}>contact@bridge-eats.com</p>
        </div>
        {arrow}
      </a>

      <div className="flex items-center gap-4 p-4 rounded-2xl mb-3" style={{ background: '#FEF9EE', border: '1.5px solid #FDE68A' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#FEF3C7' }}>
          <span className="text-xl">🕐</span>
        </div>
        <div>
          <p className={`font-black text-sm ${fClass}`} style={{ color: '#B45309' }}>{t.hours}</p>
          <p className="text-xs font-bold mt-0.5" style={{ color: '#92400E' }}>{t.hoursVal}</p>
        </div>
      </div>

      <GoldDivider />

      <div className="rounded-2xl p-4 text-center mb-4" style={{ background: '#F9F7F2', border: '1px solid #E5E1D8' }}>
        <p className="text-xl mb-1">📍</p>
        <p className={`font-black text-sm ${fClass}`} style={{ color: '#065F46' }}>{t.zone}</p>
        <p className={`text-xs mt-1 ${fClass}`} style={{ color: '#9CA3AF' }}>{t.plateau}</p>
      </div>
    </div>
  );
}

// ─── SPLASH ───────────────────────────────────────────────────────────────────

function SplashScreen() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setProgress((p) => Math.min(p + 1.8, 100)), 50);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50" style={{ background: '#FDFCF9' }}>
      <div className="flex flex-col items-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full animate-ping opacity-15" style={{ background: '#065F46', transform: 'scale(1.4)' }} />
          <img src="/logo.jpeg" alt="Bridge Eats" className="w-28 h-28 rounded-full object-cover relative z-10"
            style={{ border: '4px solid #D9C5A0', boxShadow: '0 0 0 8px rgba(217,197,160,0.15), 0 16px 48px rgba(6,95,70,0.25)' }} />
        </div>
        <h1 className="font-black tracking-[0.45em] text-xl mb-1" style={{ color: '#065F46' }}>BRIDGE EATS</h1>
        <p className="text-[10px] tracking-widest font-bold mb-1" style={{ color: '#B45309' }}>SAFI · MAROC · آسفي · ⵙⴰⴼⵉ</p>
        <div className="flex items-center gap-2 mb-8 mt-2">
          <div className="w-8 h-px" style={{ background: '#D9C5A0' }} />
          <div className="w-1.5 h-1.5 rotate-45" style={{ background: '#D9C5A0' }} />
          <div className="w-8 h-px" style={{ background: '#D9C5A0' }} />
        </div>
        <div className="w-40 h-1.5 rounded-full overflow-hidden" style={{ background: '#E5E1D8' }}>
          <div className="h-full rounded-full transition-all duration-75"
            style={{ width: `${progress}%`, background: 'linear-gradient(to right,#065F46,#059669)' }} />
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

type Page = 'home' | 'tracking' | 'contact';
const LANG_CYCLE: Lang[]             = ['fr', 'en', 'ar', 'amz'];
const LANG_LABELS: Record<Lang, string> = { fr: 'FR', en: 'EN', ar: 'AR', amz: 'ⴰⵎⵣ' };

export default function App() {
  const [lang,       setLang]       = useState<Lang>('fr');
  const [page,       setPage]       = useState<Page>('home');
  const [showSplash, setShowSplash] = useState(true);
  const [cart,       setCart]       = useState<CartItem[]>([]);
  const [showCart,   setShowCart]   = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const t      = T[lang];
  const isAR   = lang === 'ar';
  const isAMZ  = lang === 'amz';
  const fClass = fontClass(lang);

  const cycleLang = () =>
    setLang((l) => LANG_CYCLE[(LANG_CYCLE.indexOf(l) + 1) % LANG_CYCLE.length]);

  const addToCart = (item: MenuItem) =>
    setCart((prev) => {
      const found = prev.find((i) => i.id === item.id);
      if (found) return prev.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });

  const adjustQty = (id: number, delta: number) =>
    setCart((prev) =>
      prev.flatMap((i) => {
        if (i.id !== id) return [i];
        const q = i.qty + delta;
        return q > 0 ? [{ ...i, qty: q }] : [];
      })
    );

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  if (showSplash) return <SplashScreen />;

  return (
    <div className={`min-h-screen overflow-x-hidden ${isAR ? 'rtl' : 'ltr'}`} style={{ color: '#1A2F23' }}>

      {/* Language toggle */}
      <div className={`fixed top-5 z-50 ${isAR ? 'left-5' : 'right-5'}`}>
        <button
          onClick={cycleLang}
          className={`h-11 px-3 rounded-full flex items-center justify-center font-black text-sm transition-all active:scale-90 hover:scale-110 ${isAMZ ? 'font-tifinagh' : ''}`}
          style={{ background: 'white', border: '2.5px solid #D9C5A0', color: '#065F46', boxShadow: '0 4px 20px rgba(6,95,70,0.15)', minWidth: '44px' }}
        >
          {LANG_LABELS[lang]}
        </button>
      </div>

      {/* Cart button */}
      <div className={`fixed top-5 z-50 ${isAR ? 'right-5' : 'left-5'}`}>
        <button
          onClick={() => setShowCart(true)}
          className="h-11 px-3 rounded-full flex items-center gap-1.5 font-black text-sm transition-all active:scale-90 hover:scale-110"
          style={{ background: 'white', border: '2.5px solid #D9C5A0', color: '#065F46', boxShadow: '0 4px 20px rgba(6,95,70,0.15)', minWidth: '44px' }}
        >
          🛒
          {cartCount > 0 && (
            <span className="text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center" style={{ background: '#4F46E5' }}>
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* WhatsApp float */}
      <a href="https://wa.me/212600000000" target="_blank" rel="noopener noreferrer"
        className={`fixed bottom-28 z-40 w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 hover:scale-110 ${isAR ? 'left-5' : 'right-5'}`}
        style={{ background: '#25D366', boxShadow: '0 6px 24px rgba(37,211,102,0.4)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.124 1.532 5.859L.036 23.671l5.979-1.567A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.374l-.359-.214-3.728.977 1-3.647-.234-.374A9.818 9.818 0 112 12c0-5.422 4.396-9.818 9.818-9.818 5.421 0 9.818 4.396 9.818 9.818 0 5.421-4.397 9.818-9.818 9.818z"/>
        </svg>
      </a>

      {/* Header */}
      <header className="relative pt-14 pb-4 flex flex-col items-center"
        style={{ borderBottom: '1px solid #E5E1D8', background: 'rgba(253,252,249,0.92)', backdropFilter: 'blur(14px)' }}>
        <img src="/logo.jpeg" className="h-14 w-14 rounded-full object-cover"
          alt="Bridge Eats" style={{ border: '2.5px solid #D9C5A0', boxShadow: '0 4px 16px rgba(6,95,70,0.15)' }} />
        <h1 className="mt-2 text-[11px] font-black tracking-[0.45em] uppercase" style={{ color: '#065F46' }}>
          {isAMZ ? 'ⴱⵔⵉⴷⵊ ⵉⵢⵜⵙ' : isAR ? 'بريدج إيتس' : 'Bridge Eats'}
        </h1>
        <p className={`text-[9px] tracking-widest mt-0.5 ${fClass}`} style={{ color: '#B45309' }}>{t.zone}</p>
      </header>

      {/* Pages */}
      <main className="max-w-md mx-auto pt-5 pb-28">
        {page === 'home'     && <HomePage lang={lang} t={t} onAddToCart={addToCart} />}
        {page === 'tracking' && <TrackingPage lang={lang} t={t} />}
        {page === 'contact'  && <ContactPage lang={lang} t={t} />}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-40"
        style={{ background: 'rgba(253,252,249,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid #E5E1D8' }}>
        <div className="max-w-md mx-auto flex">
          {([
            { id: 'home',     label: t.navHome,    icon: '🏠' },
            { id: 'tracking', label: t.navTrack,   icon: '📍' },
            { id: 'contact',  label: t.navContact, icon: '💬' },
          ] as { id: Page; label: string; icon: string }[]).map((tab) => (
            <button key={tab.id} onClick={() => setPage(tab.id)}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-all">
              <span className="text-xl transition-transform" style={{ transform: page === tab.id ? 'scale(1.15)' : 'scale(1)' }}>
                {tab.icon}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-wide ${fClass}`}
                style={{ color: page === tab.id ? '#065F46' : '#9CA3AF' }}>
                {tab.label}
              </span>
              {page === tab.id && <div className="w-5 h-0.5 rounded-full" style={{ background: '#065F46' }} />}
            </button>
          ))}
        </div>
        <p className="text-center text-[9px] pb-2" style={{ color: '#C9BFB2' }}>{t.footer}</p>
      </nav>

      {/* Checkout drawer */}
      {showCart && (
        <CheckoutDrawer cart={cart} lang={lang} onClose={() => setShowCart(false)} onQty={adjustQty} />
      )}
    </div>
  );
}
