import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser, useClerk } from '@clerk/react';
import { useLocation } from 'wouter';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon, useMapEvents } from 'react-leaflet';
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
  [32.3010,-9.2420],[32.3005,-9.2400],[32.2998,-9.2385],
  [32.2990,-9.2372],[32.2985,-9.2360],[32.2978,-9.2350],
  [32.2972,-9.2355],[32.2968,-9.2368],[32.2975,-9.2380],[32.2982,-9.2390],
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

// ─── DELIVERY ZONE ────────────────────────────────────────────────────────────

const DELIVERY_ZONE: [number,number][] = [
  [32.3080,-9.2570], // McDonald's (côte nord-ouest)
  [32.3200,-9.2450], // Remontée nord
  [32.3280,-9.2280], // Ijnnane nord
  [32.3270,-9.2050], // Ijnnane nord-est
  [32.3160,-9.1820], // R206 est
  [32.3020,-9.1700], // Lamia nord
  [32.2880,-9.1750], // Lamia / R204
  [32.2720,-9.1950], // Azib Draï
  [32.2580,-9.2120], // Azib Draï sud
  [32.2420,-9.2310], // Descente sud
  [32.2200,-9.2480], // P2303 / Route Nsa
  [32.2100,-9.2600], // Pointe sud-ouest
  [32.2350,-9.2720], // Côte sud
  [32.2600,-9.2700], // Bordeaux / côte
  [32.2820,-9.2650], // Korten
  [32.3050,-9.2590], // Retour McDonald's
];

function pointInPolygon(lat:number, lng:number, poly:[number,number][]): boolean {
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const [xi,yi]=poly[i]; const [xj,yj]=poly[j];
    if(((yi>lng)!==(yj>lng))&&(lat<(xj-xi)*(lng-yi)/(yj-yi)+xi)) inside=!inside;
  }
  return inside;
}

const clientPinIcon = L.divIcon({
  className:'',
  html:`<div style="width:32px;height:32px;border-radius:50%;background:#4F46E5;border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(79,70,229,0.5);font-size:15px;">📍</div>`,
  iconSize:[32,32],iconAnchor:[16,16],
});

function MapClickLayer({onPick}:{onPick:(lat:number,lng:number,inside:boolean)=>void}) {
  useMapEvents({
    click(e){
      const inside=pointInPolygon(e.latlng.lat,e.latlng.lng,DELIVERY_ZONE);
      onPick(e.latlng.lat,e.latlng.lng,inside);
    }
  });
  return null;
}

function DeliveryMap({onSet,pin}:{onSet:(coords:string,inside:boolean)=>void; pin:[number,number]|null}) {
  return (
    <MapContainer center={[32.2994,-9.2372]} zoom={13}
      style={{height:220,borderRadius:14,marginBottom:12,zIndex:0}} scrollWheelZoom={false}
      maxBounds={[[32.18,-9.265],[32.36,-9.13]]} maxBoundsViscosity={1.0} minZoom={12}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://osm.org">OpenStreetMap</a>'/>
      <Polygon positions={DELIVERY_ZONE} pathOptions={{color:'#065F46',fillColor:'#2ecc71',fillOpacity:0.18,weight:2,dashArray:'6,4'}}/>
      <MapClickLayer onPick={(lat,lng,inside)=>{onSet(`${lat.toFixed(5)},${lng.toFixed(5)}`,inside);}}/>
      {pin&&<Marker position={pin} icon={clientPinIcon}/>}
    </MapContainer>
  );
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

// URL du site livreur Bridge Logistique (où arrivent toutes les commandes)
const DRIVER_APP_URL = 'https://406ae05e-3483-4224-927f-5b1b34d56fb4-00-1ym1ya1fn7mhc.worf.replit.dev';

type Lang = 'fr' | 'en' | 'ar' | 'amz';
type ML   = Record<Lang, string>;

interface OptionChoice { id: string; names: ML; price: number; }
interface OptionGroup  { id: string; names: ML; type: 'radio'|'checkbox'; required: boolean; choices: OptionChoice[]; }
interface MenuItem     { id: string; names: ML; price: number; photo: string; safi?: boolean; options?: OptionGroup[]; }
interface MenuCategory { id: string; emoji: string; names: ML; items: MenuItem[]; }
interface Restaurant   {
  id: string; name: string; tagline: ML; logo: string; cover: string;
  cuisine: ML; rating: number; deliveryTime: string; minOrder: number;
  tags: string[];
  categories: MenuCategory[];
}

interface CartItem {
  cartId: string; restaurantId: string; restaurantName: string;
  item: MenuItem; qty: number;
  selectedOptions: Record<string, string[]>;
  extraPrice: number; totalPerUnit: number;
}

interface UserProfile { name:string; address:string; phone:string; cardNumber:string; cardExpiry:string; cardName:string; onboardingComplete?:boolean; }

// ─── PROFILE STORAGE ──────────────────────────────────────────────────────────

const PROFILE_KEY = 'bridge_eats_profile';
const emptyProfile = (): UserProfile => ({ name:'', address:'', phone:'', cardNumber:'', cardExpiry:'', cardName:'', onboardingComplete:false });

function useProfile() {
  const [profile, setProfileState] = useState<UserProfile>(() => {
    try { return { ...emptyProfile(), ...JSON.parse(localStorage.getItem(PROFILE_KEY)||'{}') }; }
    catch { return emptyProfile(); }
  });
  const saveProfile = useCallback((p: UserProfile) => {
    setProfileState(p); localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  }, []);
  return { profile, saveProfile };
}

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────

const T = {
  fr: {
    appName:'Bridge Safi', zone:'Safi, Maroc',
    heroSub:'Vos restaurants préférés, livrés chez vous',
    restaurantsTitle:'Nos Restaurants', nearYou:'Près de vous · Safi',
    openNow:'Ouvert', minOrder:'Min.', delivMin:'min',
    menuTitle:'Notre Menu', addToCart:'Ajouter', close:'Fermer', back:'← Retour',
    customize:'Personnaliser', required:'Requis', optional:'Optionnel',
    addWithOptions:'Ajouter au panier', totalLabel:'Total',
    cartTitle:'Votre Panier', cartEmpty:'Votre panier est vide', total:'Total',
    checkout:'Commander', checkoutTitle:'Vos coordonnées',
    nameLabel:'Votre prénom', addrLabel:'Adresse à Safi', phoneLabel:'Numéro de téléphone',
    namePh:'Ex: Youssef', addrPh:'Ex: Plateau, Av. Hassan II, Safi', phonePh:'06 00 00 00 00',
    fillAll:'Merci de remplir tous les champs', continueBtn:'Continuer →',
    payModeTitle:'Mode de Paiement',
    cashOption:'Paiement à la livraison', cashOptionDesc:'Payez en espèces à la réception · Gratuit',
    cardOption:'Paiement par Carte Bancaire', cardOptionDesc:'Visa / Mastercard · CMI · Sécurisé',
    cardFormTitle:'Données de Carte', cardNumberLabel:'Numéro de carte',
    cardExpiryLabel:"Date d'expiration", cardCVVLabel:'CVV', cardNameLabel:'Nom sur la carte',
    cardNumberPh:'1234 5678 9012 3456', cardExpiryPh:'MM/AA', cardCVVPh:'123', cardNamePh:'YOUSSEF ALAMI',
    payNow:'Payer maintenant 🔒', confirmWhatsApp:'Confirmer la commande 🚀',
    successTitle:'Commande Confirmée ! 🎉', successSub:'Votre commande a bien été reçue.',
    trackingLabel:'Numéro de suivi', deliveryEta:'Livraison estimée dans 18–25 min', newOrder:'Nouvelle commande',
    autoFilled:'Rempli depuis votre profil ✓',
    delivOption:'🚚 Livraison à domicile', delivOptionDesc:'Livré chez vous · Zone Safi',
    collectOption:'🏪 Click & Collect', collectOptionDesc:'Retrait au restaurant · +2.99 MAD',
    collectAddress:'Adresse retrait : Plateau, Safi (le restaurant vous contacte)',
    profileTitle:'Mon Profil', profileSub:'Vos informations enregistrées',
    profileSave:'Enregistrer le profil', profileSaved:'Profil enregistré ✓',
    savedPayment:'Carte bancaire enregistrée', signOut:'🚪 Se déconnecter',
    trackTitle:'Suivi GPS en Direct', trackZone:'SAFI · PLATEAU', trackLive:'EN DIRECT',
    stages:['Reçue','En préparation','En chemin','Livrée'],
    stagesSub:['Commande confirmée',"Le chef s'affaire",'Votre livreur arrive','Bon appétit !'],
    orderStatus:'Statut de votre commande', orderNum:'Commande #BE-2847',
    eta:'Arrivée estimée', etaTime:'18 min', courierName:'Youssef A.', courierRating:'4.9',
    contactTitle:"Besoin d'aide ?", contactSub:'Notre équipe est disponible 7j/7',
    whatsapp:'WhatsApp Business', phone:'Appeler', email:'Email', hours:'Horaires', hoursVal:'8h00 – 23h00',
    navHome:'Accueil', navTrack:'Suivi', navContact:'Contact', navCart:'Panier',
    footer:'© 2026 Bridge Safi · safi-bridge.ma', plateau:'Plateau · Centre-Ville · Bouzidi',
    safiExcl:'Spécialité Safi', selected:'Sélectionné ✓',
    waMsgHeader:'🛍️ Nouvelle commande Bridge Safi\n\n📦 Articles:\n',
    waMsgFooter:(total:number,name:string,addr:string,phone:string)=>`\n💰 Total: ${total} MAD\n\n👤 Nom: ${name}\n📍 Adresse: ${addr}, Safi\n📞 Tél: ${phone}\n\nMerci de confirmer ma commande ! 🙏`,
    chooseService:'Choisissez votre service',
    deliverySub:'Livraison rapide', taxiSub:'Confort & style',
    taxiSoon:'Service disponible très bientôt',
    taxiDesc:'Bridge Taxi Confort — trajets premium à Safi, en toute élégance.',
    taxiBook:'Réserver sur WhatsApp Business',
    tabacSub:'Livraison & retrait',
    tabacSoon:'Bientôt disponible',
    tabacDesc:'Bridge Tabac — cigarettes, boissons & produits premium au cœur de Safi.',
    tabacBook:'Envoyer via WhatsApp Business',
    tabacCollectAddress:'Adresse retrait : Plateau, Safi (la boutique vous contacte)',
    tabacSend:'Envoyer la commande 🚀',
    paymentCash:'💵 Paiement : Espèces à la livraison',
    paymentCard:'💳 Paiement : Carte Bancaire',
    sslBadge:'256-bit SSL · Paiement 100% sécurisé',
    cardHolderLabel:'👤 Titulaire',
    onboardTitle:'Complétez votre profil',
    onboardSub:'Quelques infos pour une expérience fluide',
    onboardSkip:'Passer pour l\'instant',
    onboardSave:'Enregistrer et continuer',
    onboardPhone:'📱 Numéro de téléphone', onboardPhoneSub:'Pour le livreur',
    onboardAddr:'📍 Adresse de livraison', onboardAddrSub:'Votre adresse à Safi',
    onboardCard:'💳 Carte bancaire', onboardCardSub:'Paiement rapide & sécurisé',
    onboardId:'🪪 Identité', onboardIdSub:'Vérification du compte',
    onboardCardNum:'Numéro de carte', onboardCardExp:'Date d\'expiration', onboardCardHolder:'Nom sur la carte',
    onboardIdNote:'Fonctionnalité disponible prochainement. Votre compte est actif.',
  },
  en: {
    appName:'Bridge Safi', zone:'Safi, Morocco',
    heroSub:'Your favourite restaurants, delivered to you',
    restaurantsTitle:'Our Restaurants', nearYou:'Near you · Safi',
    openNow:'Open', minOrder:'Min.', delivMin:'min',
    menuTitle:'Our Menu', addToCart:'Add', close:'Close', back:'← Back',
    customize:'Customize', required:'Required', optional:'Optional',
    addWithOptions:'Add to cart', totalLabel:'Total',
    cartTitle:'Your Cart', cartEmpty:'Your cart is empty', total:'Total',
    checkout:'Order Now', checkoutTitle:'Your Details',
    nameLabel:'Your name', addrLabel:'Address in Safi', phoneLabel:'Phone number',
    namePh:'e.g. Youssef', addrPh:'e.g. Plateau, Av. Hassan II, Safi', phonePh:'06 00 00 00 00',
    fillAll:'Please fill in all fields', continueBtn:'Continue →',
    payModeTitle:'Payment Method',
    cashOption:'Cash on Delivery', cashOptionDesc:'Pay cash upon receipt · Free',
    cardOption:'Pay by Credit Card', cardOptionDesc:'Visa / Mastercard · CMI · Secured',
    cardFormTitle:'Card Details', cardNumberLabel:'Card number',
    cardExpiryLabel:'Expiry date', cardCVVLabel:'CVV', cardNameLabel:'Name on card',
    cardNumberPh:'1234 5678 9012 3456', cardExpiryPh:'MM/YY', cardCVVPh:'123', cardNamePh:'YOUSSEF ALAMI',
    payNow:'Pay now 🔒', confirmWhatsApp:'Confirm order 🚀',
    successTitle:'Order Confirmed! 🎉', successSub:'Your order has been received.',
    trackingLabel:'Tracking number', deliveryEta:'Estimated delivery in 18–25 min', newOrder:'New order',
    autoFilled:'Pre-filled from your profile ✓',
    delivOption:'🚚 Home Delivery', delivOptionDesc:'Delivered to you · Safi zone',
    collectOption:'🏪 Click & Collect', collectOptionDesc:'Pick up at restaurant · +2.99 MAD',
    collectAddress:'Pick-up address: Plateau, Safi (restaurant will contact you)',
    profileTitle:'My Profile', profileSub:'Your saved information',
    profileSave:'Save profile', profileSaved:'Profile saved ✓', savedPayment:'Saved credit card', signOut:'🚪 Sign out',
    trackTitle:'Live GPS Tracking', trackZone:'SAFI · PLATEAU', trackLive:'LIVE',
    stages:['Received','Preparing','On the way','Delivered'],
    stagesSub:['Order confirmed','Chef is cooking','Courier en route','Enjoy your meal!'],
    orderStatus:'Your order status', orderNum:'Order #BE-2847',
    eta:'Estimated arrival', etaTime:'18 min', courierName:'Youssef A.', courierRating:'4.9',
    contactTitle:'Need help?', contactSub:'Our team is available 7 days a week',
    whatsapp:'WhatsApp Business', phone:'Call us', email:'Email', hours:'Hours', hoursVal:'8:00 AM – 11:00 PM',
    navHome:'Home', navTrack:'Track', navContact:'Contact', navCart:'Cart',
    footer:'© 2026 Bridge Safi · safi-bridge.ma', plateau:'Plateau · City Center · Bouzidi',
    safiExcl:'Safi Special', selected:'Selected ✓',
    waMsgHeader:'🛍️ New Bridge Safi order\n\n📦 Items:\n',
    waMsgFooter:(total:number,name:string,addr:string,phone:string)=>`\n💰 Total: ${total} MAD\n\n👤 Name: ${name}\n📍 Address: ${addr}, Safi\n📞 Phone: ${phone}\n\nPlease confirm my order! 🙏`,
    chooseService:'Choose your service',
    deliverySub:'Fast delivery', taxiSub:'Comfort & style',
    taxiSoon:'Service coming soon',
    taxiDesc:'Bridge Taxi Confort — premium rides in Safi, in pure elegance.',
    taxiBook:'Book on WhatsApp Business',
    tabacSub:'Delivery & pick-up',
    tabacSoon:'Coming soon',
    tabacDesc:'Bridge Tabac — cigarettes, drinks & premium products in Safi.',
    tabacBook:'Send via WhatsApp Business',
    tabacCollectAddress:'Pick-up address: Plateau, Safi (the shop will contact you)',
    tabacSend:'Send order 🚀',
    paymentCash:'💵 Payment: Cash on delivery',
    paymentCard:'💳 Payment: Credit Card',
    sslBadge:'256-bit SSL · 100% Secure Payment',
    cardHolderLabel:'👤 Cardholder',
    onboardTitle:'Complete your profile',
    onboardSub:'A few details for a smooth experience',
    onboardSkip:'Skip for now',
    onboardSave:'Save & continue',
    onboardPhone:'📱 Phone number', onboardPhoneSub:'For your delivery rider',
    onboardAddr:'📍 Delivery address', onboardAddrSub:'Your address in Safi',
    onboardCard:'💳 Bank card', onboardCardSub:'Fast & secure payment',
    onboardId:'🪪 Identity', onboardIdSub:'Account verification',
    onboardCardNum:'Card number', onboardCardExp:'Expiry date', onboardCardHolder:'Name on card',
    onboardIdNote:'Coming soon. Your account is already active.',
  },
  ar: {
    appName:'بريدج سافي', zone:'آسفي، المغرب',
    heroSub:'مطاعمك المفضلة، نوصلها إليك',
    restaurantsTitle:'مطاعمنا', nearYou:'قريب منك · آسفي',
    openNow:'مفتوح', minOrder:'أدنى', delivMin:'دقيقة',
    menuTitle:'قائمة الطعام', addToCart:'أضف', close:'إغلاق', back:'→ رجوع',
    customize:'تخصيص', required:'مطلوب', optional:'اختياري',
    addWithOptions:'أضف إلى السلة', totalLabel:'المجموع',
    cartTitle:'سلة الطلبات', cartEmpty:'السلة فارغة', total:'المجموع',
    checkout:'اطلب الآن', checkoutTitle:'بياناتك',
    nameLabel:'اسمك', addrLabel:'عنوانك في آسفي', phoneLabel:'رقم الهاتف',
    namePh:'مثال: يوسف', addrPh:'مثال: الهضبة، ش. الحسن الثاني، آسفي', phonePh:'06 00 00 00 00',
    fillAll:'يرجى ملء جميع الحقول', continueBtn:'متابعة →',
    payModeTitle:'طريقة الدفع',
    cashOption:'الدفع عند الاستلام', cashOptionDesc:'ادفع نقداً عند استلام طلبك · مجاني',
    cardOption:'الدفع ببطاقة بنكية', cardOptionDesc:'Visa / Mastercard · CMI · آمن',
    cardFormTitle:'بيانات البطاقة', cardNumberLabel:'رقم البطاقة',
    cardExpiryLabel:'تاريخ الانتهاء', cardCVVLabel:'CVV', cardNameLabel:'الاسم على البطاقة',
    cardNumberPh:'1234 5678 9012 3456', cardExpiryPh:'MM/AA', cardCVVPh:'123', cardNamePh:'YOUSSEF ALAMI',
    payNow:'ادفع الآن 🔒', confirmWhatsApp:'تأكيد الطلب 🚀',
    successTitle:'تم تأكيد الطلب! 🎉', successSub:'تم استلام طلبك بنجاح.',
    trackingLabel:'رقم التتبع', deliveryEta:'التوصيل المتوقع خلال 18–25 دقيقة', newOrder:'طلب جديد',
    autoFilled:'مُعبَّأ من ملفك الشخصي ✓',
    delivOption:'🚚 التوصيل للمنزل', delivOptionDesc:'يوصل إليك · منطقة آسفي',
    collectOption:'🏪 Click & Collect', collectOptionDesc:'الاستلام من المطعم · +2.99 MAD',
    collectAddress:'عنوان الاستلام : الهضبة، آسفي (سيتصل بك المطعم)',
    profileTitle:'ملفي الشخصي', profileSub:'معلوماتك المحفوظة',
    profileSave:'حفظ الملف الشخصي', profileSaved:'تم الحفظ ✓', savedPayment:'بطاقة بنكية محفوظة', signOut:'🚪 تسجيل الخروج',
    trackTitle:'تتبع GPS مباشر', trackZone:'آسفي · الهضبة', trackLive:'مباشر',
    stages:['مستلمة','قيد التحضير','في الطريق','تم التوصيل'],
    stagesSub:['تم تأكيد الطلب','الطاهي يعمل','المندوب في الطريق','بالهناء والشفاء!'],
    orderStatus:'حالة طلبك', orderNum:'الطلب #BE-2847',
    eta:'وقت الوصول المتوقع', etaTime:'18 دقيقة', courierName:'يوسف أ.', courierRating:'4.9',
    contactTitle:'هل تحتاج مساعدة؟', contactSub:'فريقنا متاح 7 أيام في الأسبوع',
    whatsapp:'واتساب بيزنس', phone:'اتصل بنا', email:'البريد الإلكتروني',
    hours:'ساعات العمل', hoursVal:'8:00 ص – 11:00 م',
    navHome:'الرئيسية', navTrack:'تتبع', navContact:'تواصل', navCart:'السلة',
    footer:'© 2026 بريدج سافي · safi-bridge.ma', plateau:'الهضبة · وسط المدينة · بوزيدي',
    safiExcl:'تخصص آسفي', selected:'تم الاختيار ✓',
    waMsgHeader:'🛍️ طلب جديد من بريدج إيتس\n\n📦 الطلبات:\n',
    waMsgFooter:(total:number,name:string,addr:string,phone:string)=>`\n💰 المجموع: ${total} MAD\n\n👤 الاسم: ${name}\n📍 العنوان: ${addr}، آسفي\n📞 الهاتف: ${phone}\n\nأرجو تأكيد طلبي! 🙏`,
    chooseService:'اختر خدمتك',
    deliverySub:'توصيل سريع', taxiSub:'راحة وأناقة',
    taxiSoon:'الخدمة قادمة قريباً',
    taxiDesc:'بريدج تاكسي كونفور — رحلات مميزة في آسفي بأناقة.',
    taxiBook:'احجز عبر واتساب بيزنس',
    tabacSub:'توصيل واستلام',
    tabacSoon:'قريباً',
    tabacDesc:'بريدج طباق — سجائر، مشروبات ومنتجات مميزة في آسفي.',
    tabacBook:'إرسال عبر واتساب بيزنس',
    tabacCollectAddress:'عنوان الاستلام : الهضبة، آسفي (ستتصل بك البوتيك)',
    tabacSend:'إرسال الطلب 🚀',
    paymentCash:'💵 الدفع: نقداً عند الاستلام',
    paymentCard:'💳 الدفع: بطاقة بنكية',
    sslBadge:'256-bit SSL · دفع آمن 100%',
    cardHolderLabel:'👤 حامل البطاقة',
    onboardTitle:'أكمل ملفك الشخصي',
    onboardSub:'بعض المعلومات لتجربة سلسة',
    onboardSkip:'تخطي الآن',
    onboardSave:'حفظ ومتابعة',
    onboardPhone:'📱 رقم الهاتف', onboardPhoneSub:'للتواصل مع المندوب',
    onboardAddr:'📍 عنوان التوصيل', onboardAddrSub:'عنوانك في آسفي',
    onboardCard:'💳 بطاقة بنكية', onboardCardSub:'دفع سريع وآمن',
    onboardId:'🪪 الهوية', onboardIdSub:'التحقق من الحساب',
    onboardCardNum:'رقم البطاقة', onboardCardExp:'تاريخ الانتهاء', onboardCardHolder:'الاسم على البطاقة',
    onboardIdNote:'قريباً. حسابك مفعّل.',
  },
  amz: {
    appName:'ⴱⵔⵉⴷⵊ ⵉⵢⵜⵙ', zone:'ⵙⴰⴼⵉ, ⵍⵎⵖⵔⵉⴱ',
    heroSub:'ⵉⵎⵣⴷⴰⵖⵏ ⵏⵏⴽ ⵉⵃⵎⵍⵏ, ⴷ ⵜⴰⵖⵔⵎⵜ ⵏⵏⴽ',
    restaurantsTitle:'ⵉⵎⵣⴷⴰⵖⵏ ⴰⵏⵏⵖ', nearYou:'ⵉⵇⵇⴰⵏ ⵖⵉⴽ · ⵙⴰⴼⵉ',
    openNow:'ⵉⵍⵍⴰ', minOrder:'ⴰⵎⵓ', delivMin:'ⵜⵉⵎⵉⵏⵉⵜ',
    menuTitle:'ⵍⵉⵙⵜⴰ ⴰⵏⵏⵖ', addToCart:'ⵔⵏⵓ', close:'ⵔⴳⵍ', back:'← ⵓⵣⵣⵍ',
    customize:'ⵙⵏⴼⵍ', required:'ⵉⵍⵍⴰ', optional:'ⴰⵎⴰⵣⴰⵔ',
    addWithOptions:'ⵔⵏⵓ ⵖ ⵜⵓⴽⴽⵙⴰ', totalLabel:'ⴰⵎⵎⴰⵙ',
    cartTitle:'ⵜⵓⴽⴽⵙⴰ', cartEmpty:'ⵜⵓⴽⴽⵙⴰ ⵉⵔⵉⵔⵉ', total:'ⴰⵎⵎⴰⵙ',
    checkout:'ⵔⵏⵓ ⴰⴷ', checkoutTitle:'ⵉⵙⴼⴰⵡⵏ ⵏⵏⴽ',
    nameLabel:'ⵉⵙⵎ ⵏⵏⴽ', addrLabel:'ⵜⴰⵙⵓⵏⵜ ⵖ ⵙⴰⴼⵉ', phoneLabel:'ⴰⵏⵓⵎⵔ ⵏ ⵓⵙⵓⵍ',
    namePh:'ⴰⵎ: ⵢⵓⵙⴼ', addrPh:'ⴰⵎ: ⴰⴱⵍⴰⵟⵓ, ⵙⴰⴼⵉ', phonePh:'06 00 00 00 00',
    fillAll:'ⵎⵍⴰ ⵉⵍⵉⵙ ⴽⵓⵍⵍⵓ ⵉⴳⵎⴰⵎⵏ', continueBtn:'ⵙⴷⴷⵉⴷ →',
    payModeTitle:'ⴰⵏⴰⵡ ⵏ ⵓⵙⵙⴼⵍⵍⴷ',
    cashOption:'ⴰⴷⵔⵉⵎ ⵎⵎⵉ ⵢⴰⵙⵍⵎⴷ', cashOptionDesc:'ⵙⵙⴼⵍⵍⴷ ⵙ ⵓⴷⵔⵉⵎ · ⵉⵥⵍⵉ',
    cardOption:'ⵜⴰⴽⴰⵔⴷⵜ ⵏ ⵓⵣⵔⴰⴼ', cardOptionDesc:'Visa / Mastercard · CMI · ⴰⵎⵣⵡⴰⵔⵓ',
    cardFormTitle:'ⵉⵙⴼⴰⵡⵏ ⵏ ⵜⴽⴰⵔⴷⵜ', cardNumberLabel:'ⴰⵏⵓⵎⵔ ⵏ ⵜⴽⴰⵔⴷⵜ',
    cardExpiryLabel:'ⴰⵙⵙ ⵏ ⵓⵙⵓⵔⴼ', cardCVVLabel:'CVV', cardNameLabel:'ⵉⵙⵎ ⵖ ⵜⴽⴰⵔⴷⵜ',
    cardNumberPh:'1234 5678 9012 3456', cardExpiryPh:'MM/AA', cardCVVPh:'123', cardNamePh:'YOUSSEF ALAMI',
    payNow:'ⵙⵙⴼⵍⵍⴷ ⴷⵉⵖ 🔒', confirmWhatsApp:'ⵙⵛⴷ ⵉⴽⴽⵉⵏ 🚀',
    successTitle:'ⵜⵜⵓⵙⵛⴷⵃ ⵜⴰⵖⵓⵍⵜ! 🎉', successSub:'ⵜⵜⵓⵙⵔⵖ ⵜⴰⵖⵓⵍⵜ ⵏⵏⴽ.',
    trackingLabel:'ⴰⵏⵓⵎⵔ ⵏ ⵓⵙⴽⵍⵙ', deliveryEta:'ⴰⵙⵍⵎⴷ ⵖ 18–25 ⵜⵉⵎⵉⵏⵉⵜⵉⵏ', newOrder:'ⵜⴰⵖⵓⵍⵜ ⵜⴰⵎⴰⵢⵏⵓⵜ',
    autoFilled:'ⵉⵜⵜⵓⵎⵍⴰ ⵙⴳ ⵓⵎⵍⵉ ⵏⵏⴽ ✓',
    delivOption:'🚚 ⴰⵙⵙⵓⴼⵖ ⵙ ⵓⴽⴰⵎⴰⵢ', delivOptionDesc:'ⵉⵜⵜⵓⴽⵛⵎ ⵖⵉⴽ · ⵙⴰⴼⵉ',
    collectOption:'🏪 Click & Collect', collectOptionDesc:'ⴰⵔⵣⵣⵓ ⴳ ⵓⵣⵉⴳⵣ · +2.99 MAD',
    collectAddress:'ⵜⴰⵏⵙⴰ ⵏ ⵓⵔⵣⵣⵓ : ⴰⴱⵍⴰⵟⵓ, ⵙⴰⴼⵉ',
    profileTitle:'ⴰⵎⵍⵉ ⵏⵓ', profileSub:'ⵉⵙⴼⴰⵡⵏ ⵏⵏⴽ ⵉⵜⵜⵓⵙⵎⴷⵏ',
    profileSave:'ⵙⵎⴷ ⴰⵎⵍⵉ', profileSaved:'ⵜⵜⵓⵙⵎⴷ ✓', savedPayment:'ⵜⴰⴽⴰⵔⴷⵜ ⵉⵜⵜⵓⵙⵎⴷⵏ', signOut:'🚪 ⴼⴼⵖ',
    trackTitle:'ⴰⵙⴽⵍⵙ GPS', trackZone:'ⵙⴰⴼⵉ · ⴰⴱⵍⴰⵟⵓ', trackLive:'ⴷⴷⴰⵡ',
    stages:['ⵜⵜⵓⵙⵔⵖⴰ','ⵜⴻⵜⵜⵓⵙⴽⴰⵔ','ⵖ ⵓⵣⵔⵉⵔⵉ','ⵜⵜⵓⵙⵍⵎⴷ'],
    stagesSub:['ⵜⵜⵓⵙⵛⴷⵃ ⵜⴰⵖⵓⵍⵜ','ⴰⵎⵓⵙⵙⵓ ⵉⵜⵜⵓⵙⴽⴰⵔ','ⴰⵎⵥⵍⵉ ⵉⵜⵜⴰⵡⵙ','ⵜⵙⴼⵓⵍⵍⵓ!'],
    orderStatus:'ⴰⵙⵉⵡⴷ ⵏ ⵜⴰⵖⵓⵍⵜ', orderNum:'ⵜⴰⵖⵓⵍⵜ #BE-2847',
    eta:'ⴰⴽⵓⴷ ⵏ ⵓⵙⵍⵎⴷ', etaTime:'18 ⵜⵉⵎⵉⵏⵉⵜⵉⵏ', courierName:'ⵢⵓⵙⴼ ⴰ.', courierRating:'4.9',
    contactTitle:'ⵜⵙⵔⴰ ⵜⵉⵡⵉⵙⵉ?', contactSub:'ⴰⴳⵔⴰⵡ ⴰⵏⵏ ⵉⵍⵍⴰ 7 ⵓⵙⵙⴰⵏ',
    whatsapp:'WA Business', phone:'ⵙⵓⵍ', email:'ⵉⵎⴰⵢⵍ',
    hours:'ⵜⴰⵙⵔⴰⵜ', hoursVal:'8:00 – 23:00',
    navHome:'ⵜⴰⵣⵡⴰⵔⵜ', navTrack:'ⴰⵙⴽⵍⵙ', navContact:'ⴰⵎⵢⴰⵡⴰⴹ', navCart:'ⴰⵙⵡⵉⵔ',
    footer:'© 2026 ⴱⵔⵉⴷⵊ ⵙⴰⴼⵉ · safi-bridge.ma', plateau:'ⴰⴱⵍⴰⵟⵓ · ⵓⵍⵍⴰ ⵏ ⵜⵎⴷⵉⵏⵜ · ⴱⵓⵣⵉⴷⵉ',
    safiExcl:'ⵏ ⵙⴰⴼⵉ', selected:'ⵉⵜⵜⵓⴼⵔⴰ ✓',
    waMsgHeader:'🛍️ ⵜⴰⵖⵓⵍⵜ ⵜⴰⵎⴰⵢⵏⵓⵜ ⵏ ⴱⵔⵉⴷⵊ ⵉⵢⵜⵙ\n\n📦 ⵉⵙⴽⴰⵔⵏ:\n',
    waMsgFooter:(total:number,name:string,addr:string,phone:string)=>`\n💰 ⴰⵎⵎⴰⵙ: ${total} MAD\n\n👤 ⵉⵙⵎ: ${name}\n📍 ⵜⴰⵙⵓⵏⵜ: ${addr}, ⵙⴰⴼⵉ\n📞 ⴰⵙⵓⵍ: ${phone}\n\nⵙⵛⴷ ⵜⴰⵖⵓⵍⵜ ⵉⵏⵓ! 🙏`,
    chooseService:'ⴼⵔ ⵜⴰⵎⵙⴽⴰⵔⵜ',
    deliverySub:'ⴰⵙⵙⵓⴼⵖ ⵣⵔⵉⵔⵉ', taxiSub:'ⵓⵏⵍⵍⵉ ⴷ ⵓⵙⵏⴼⵍ',
    taxiSoon:'ⵜⴰⵎⵙⴽⴰⵔⵜ ⵜⴰⵖ ⴷ ⵓⴳⵉⵏ',
    taxiDesc:'ⴱⵔⵉⴷⵊ ⵜⴰⴽⵙⵉ — ⵜⵉⵔⴰⵡⵉⵏ ⵜⵉⴼⵓⵍⴽⵉⵏ ⵖ ⵙⴰⴼⵉ.',
    taxiBook:'ⵙⵇⵇⵔ ⵙ WhatsApp Business',
    tabacSub:'ⴰⵙⵙⵓⴼⵖ ⴷ ⵓⵔⵣⵣⵓ',
    tabacSoon:'ⵜⴰⵖ ⴷ ⵓⴳⵉⵏ',
    tabacDesc:'ⴱⵔⵉⴷⵊ ⵟⴱⴰⵇ — ⵜⵉⴳⴰⵔ, ⵉⵙⵡⵉⵡⵏ ⴷ ⵉⵙⴽⴰⵔⵏ ⵉⴼⵓⵍⴽⵉⵏ ⵖ ⵙⴰⴼⵉ.',
    tabacBook:'ⵙⵙⵉⴼⵍ ⵙ WhatsApp Business',
    tabacCollectAddress:'ⵜⴰⵏⵙⴰ ⵏ ⵓⵔⵣⵣⵓ : ⴰⴱⵍⴰⵟⵓ, ⵙⴰⴼⵉ',
    tabacSend:'ⵙⵙⵉⴼⵍ ⵜⴰⵖⵓⵍⵜ 🚀',
    paymentCash:'💵 ⴰⴷⴼⴰⵏ: ⴰⴷⵔⵉⵎ ⵎⵎⵉ ⵢⴰⵙⵍⵎⴷ',
    paymentCard:'💳 ⴰⴷⴼⴰⵏ: ⵜⴰⴽⴰⵔⴷⵜ',
    sslBadge:'256-bit SSL · ⴰⴷⴼⴰⵏ ⵉⵣⴷⵉⴳⵏ 100%',
    cardHolderLabel:'👤 ⴰⵎⵙⴽⴽⵉ',
    onboardTitle:'ⵙⵎⴷ ⴰⵎⵍⵉ ⵏⵏⴽ',
    onboardSub:'ⵉⵙⴼⴰⵡⵏ ⵏ ⵜⵎⵓⵔⵉ ⵏⵏⴽ',
    onboardSkip:'ⵙⵎⴰⵍ ⴰⵙⵙⴰ',
    onboardSave:'ⵙⵎⴷ ⴷ ⴽⵛⵎ',
    onboardPhone:'📱 ⵓⵟⵟⵓⵏ ⵏ ⵜⵙⵍⵍⴰⵢⵜ', onboardPhoneSub:'ⵉ ⵓⵙⴽⵍⴰ',
    onboardAddr:'📍 ⵜⴰⵏⵙⴰ ⵏ ⵓⵣⵣⵏⵣ', onboardAddrSub:'ⵜⴰⵏⵙⴰ ⵏⵏⴽ ⵙ ⵙⴰⴼⵉ',
    onboardCard:'💳 ⵜⴰⴽⴰⵔⴷⵜ ⵏ ⵓⵙⵔⴰⵡ', onboardCardSub:'ⴰⴷⴼⴰⵏ ⴰⵣⴷⵉⴳ',
    onboardId:'🪪 ⵜⵉⵎⵙⵙⵉⵔⴰ', onboardIdSub:'ⵜⴰⵙⵍⵎⴷⵜ ⵏ ⵓⵃⵙⴰⴱ',
    onboardCardNum:'ⵓⵟⵟⵓⵏ ⵏ ⵜⴰⴽⴰⵔⴷⵜ', onboardCardExp:'ⴰⵙⴽⵓ ⵏ ⵓⵙⵎⵙⵉⵡⴷ', onboardCardHolder:'ⵉⵙⵎ ⵖⴼ ⵜⴰⴽⴰⵔⴷⵜ',
    onboardIdNote:'ⵉⵍⴻⵍⵍⵉ ⴰⵙⵙ. ⵓⵃⵙⴰⴱ ⵏⵏⴽ ⵉⵜⵜⵓⵙⵎⴷ.',
  },
};

// ─── OPTION GROUPS ────────────────────────────────────────────────────────────

const OPT = {
  pizzaSize: ():OptionGroup => ({ id:'size', names:{fr:'Taille',en:'Size',ar:'الحجم',amz:'ⴰⵎⵔⴰⵡ'}, type:'radio', required:true, choices:[
    {id:'30',names:{fr:'30 cm',en:'30 cm',ar:'30 سم',amz:'30 cm'},price:0},
    {id:'40',names:{fr:'40 cm (+15 MAD)',en:'40 cm (+15 MAD)',ar:'40 سم (+15)',amz:'40 cm (+15)'},price:15},
  ]}),
  pizzaSauce: ():OptionGroup => ({ id:'sauce_pizza', names:{fr:'Sauce',en:'Sauce',ar:'الصلصة',amz:'ⴰⵙⴰⴽ'}, type:'radio', required:true, choices:[
    {id:'tomate',names:{fr:'Tomate',en:'Tomato',ar:'طماطم',amz:'ⴰⵎⵥⵢⴰⵏ'},price:0},
    {id:'blanche',names:{fr:'Blanche (crème)',en:'White (cream)',ar:'بيضاء (كريمة)',amz:'ⴰⵎⵍⵍⴰⵍ'},price:0},
    {id:'bbq',names:{fr:'BBQ',en:'BBQ',ar:'باربيكيو',amz:'BBQ'},price:0},
  ]}),
  pizzaExtras: ():OptionGroup => ({ id:'extras_pizza', names:{fr:'Suppléments',en:'Extras',ar:'إضافات',amz:'ⵉⴼⵙⵙⴰⵢⵏ'}, type:'checkbox', required:false, choices:[
    {id:'xcheese',names:{fr:'Extra Fromage (+10 MAD)',en:'Extra Cheese (+10 MAD)',ar:'جبن إضافي (+10)',amz:'ⴰⴼⵔⵓⵎⴰⵊ (+10)'},price:10},
    {id:'xmeat',names:{fr:'Extra Viande (+15 MAD)',en:'Extra Meat (+15 MAD)',ar:'لحم إضافي (+15)',amz:'ⴰⴽⵙⵓⵎ (+15)'},price:15},
    {id:'xolives',names:{fr:'Extra Olives (+5 MAD)',en:'Extra Olives (+5 MAD)',ar:'زيتون إضافي (+5)',amz:'ⵜⵉⵣⵉⵡⵉⵏ (+5)'},price:5},
  ]}),
  tacosSauce: ():OptionGroup => ({ id:'sauce_tacos', names:{fr:'Sauce',en:'Sauce',ar:'الصلصة',amz:'ⴰⵙⴰⴽ'}, type:'radio', required:true, choices:[
    {id:'alg',names:{fr:'Algérienne',en:'Algerian',ar:'جزائرية',amz:'ⵜⴰⵣⵣⴰⵢⵔⵉⵜ'},price:0},
    {id:'mayo',names:{fr:'Mayonnaise',en:'Mayo',ar:'مايونيز',amz:'ⵎⴰⵢⵓ'},price:0},
    {id:'piq',names:{fr:'Piquante',en:'Spicy',ar:'حارة',amz:'ⵜⴰⵇⵇⵓⵍⵜ'},price:0},
    {id:'harissa',names:{fr:'Harissa',en:'Harissa',ar:'هريسة',amz:'ⵀⴰⵔⵉⵙⴰ'},price:0},
    {id:'bbq',names:{fr:'BBQ',en:'BBQ',ar:'باربيكيو',amz:'BBQ'},price:0},
  ]}),
  tacosExtras: ():OptionGroup => ({ id:'extras_tacos', names:{fr:'Suppléments',en:'Extras',ar:'إضافات',amz:'ⵉⴼⵙⵙⴰⵢⵏ'}, type:'checkbox', required:false, choices:[
    {id:'xcheese',names:{fr:'Extra Fromage (+10 MAD)',en:'Extra Cheese (+10 MAD)',ar:'جبن إضافي (+10)',amz:'ⴰⴼⵔⵓⵎⴰⵊ (+10)'},price:10},
    {id:'xmeat',names:{fr:'Extra Viande (+15 MAD)',en:'Extra Meat (+15 MAD)',ar:'لحم إضافي (+15)',amz:'ⴰⴽⵙⵓⵎ (+15)'},price:15},
    {id:'xsauce',names:{fr:'Double Sauce (+5 MAD)',en:'Double Sauce (+5 MAD)',ar:'صلصة مضاعفة (+5)',amz:'ⵙⴰⵙ (+5)'},price:5},
  ]}),
  kebabBread: ():OptionGroup => ({ id:'bread', names:{fr:'Pain',en:'Bread',ar:'الخبز',amz:'ⴰⵖⵔⵓⵎ'}, type:'radio', required:true, choices:[
    {id:'baguette',names:{fr:'Baguette',en:'Baguette',ar:'باغيت',amz:'ⴱⴰⴳⵉⵜ'},price:0},
    {id:'rond',names:{fr:'Pain Rond',en:'Round Bread',ar:'خبز دائري',amz:'ⴰⵖⵔⵓⵎ ⴰⴳⴰⵢⵢⵓⵔ'},price:0},
  ]}),
  kebabSauce: ():OptionGroup => ({ id:'sauce_kebab', names:{fr:'Sauce',en:'Sauce',ar:'الصلصة',amz:'ⴰⵙⴰⴽ'}, type:'radio', required:true, choices:[
    {id:'alg',names:{fr:'Algérienne',en:'Algerian',ar:'جزائرية',amz:'ⵜⴰⵣⵣⴰⵢⵔⵉⵜ'},price:0},
    {id:'mayo',names:{fr:'Mayonnaise',en:'Mayo',ar:'مايونيز',amz:'ⵎⴰⵢⵓ'},price:0},
    {id:'piq',names:{fr:'Piquante',en:'Spicy',ar:'حارة',amz:'ⵜⴰⵇⵇⵓⵍⵜ'},price:0},
    {id:'harissa',names:{fr:'Harissa',en:'Harissa',ar:'هريسة',amz:'ⵀⴰⵔⵉⵙⴰ'},price:0},
  ]}),
  kebabSalad: ():OptionGroup => ({ id:'salad', names:{fr:'Garniture',en:'Toppings',ar:'الإضافات',amz:'ⵉⵙⵓⵎⵙⵏ'}, type:'checkbox', required:false, choices:[
    {id:'tomate',names:{fr:'Tomate',en:'Tomato',ar:'طماطم',amz:'ⴰⵎⵥⵢⴰⵏ'},price:0},
    {id:'oignon',names:{fr:'Oignon',en:'Onion',ar:'بصل',amz:'ⵜⵉⴱⵙⵍⵉⵏ'},price:0},
    {id:'cornichon',names:{fr:'Cornichon',en:'Pickle',ar:'مخلل',amz:'ⵍⵎⵅⵍⵍ'},price:0},
    {id:'salade',names:{fr:'Salade Verte',en:'Lettuce',ar:'خس',amz:'ⵓⵍⵓⴼ'},price:0},
  ]}),
  burgerCooking: ():OptionGroup => ({ id:'cooking', names:{fr:'Cuisson',en:'Cooking',ar:'الطهي',amz:'ⴰⵙⵙⵓⵜⵔ'}, type:'radio', required:true, choices:[
    {id:'bc',names:{fr:'Bien cuit',en:'Well done',ar:'مطبوخ جيداً',amz:'ⵉⵜⵜⵓⵙⵙⵓⵜⵔ'},price:0},
    {id:'ap',names:{fr:'À point',en:'Medium',ar:'متوسط',amz:'ⴰⵎⵎⴰⵙ'},price:0},
  ]}),
  burgerExtras: ():OptionGroup => ({ id:'extras_burger', names:{fr:'Suppléments',en:'Extras',ar:'إضافات',amz:'ⵉⴼⵙⵙⴰⵢⵏ'}, type:'checkbox', required:false, choices:[
    {id:'xcheese',names:{fr:'Extra Fromage (+10 MAD)',en:'Extra Cheese (+10 MAD)',ar:'جبن إضافي (+10)',amz:'ⴰⴼⵔⵓⵎⴰⵊ (+10)'},price:10},
    {id:'xmeat',names:{fr:'Double Steak (+20 MAD)',en:'Double Steak (+20 MAD)',ar:'ستيك مزدوج (+20)',amz:'ⵙⵜⵉⴽ (+20)'},price:20},
    {id:'egg',names:{fr:'Oeuf (+8 MAD)',en:'Egg (+8 MAD)',ar:'بيضة (+8)',amz:'ⵜⴰⵍⵖⴰ (+8)'},price:8},
  ]}),
  burgerSauce: ():OptionGroup => ({ id:'sauce_burger', names:{fr:'Sauce(s)',en:'Sauce(s)',ar:'الصلصة',amz:'ⴰⵙⴰⴽ'}, type:'checkbox', required:false, choices:[
    {id:'ketchup',names:{fr:'Ketchup',en:'Ketchup',ar:'كاتشاب',amz:'ⴽⵉⵜⵛⵓⴱ'},price:0},
    {id:'mayo',names:{fr:'Mayo',en:'Mayo',ar:'مايونيز',amz:'ⵎⴰⵢⵓ'},price:0},
    {id:'bbq',names:{fr:'BBQ',en:'BBQ',ar:'باربيكيو',amz:'BBQ'},price:0},
    {id:'mustard',names:{fr:'Moutarde',en:'Mustard',ar:'خردل',amz:'ⵜⴰⵎⵓⵙⵜⴰⵔⴷ'},price:0},
  ]}),
  drinkFlavor: ():OptionGroup => ({ id:'flavor', names:{fr:'Saveur',en:'Flavor',ar:'النكهة',amz:'ⴰⵥⵡⴰⵏ'}, type:'radio', required:true, choices:[
    {id:'cola',names:{fr:'Coca-Cola',en:'Coca-Cola',ar:'كوكا كولا',amz:'ⴽⵓⵍⴰ'},price:0},
    {id:'fanta',names:{fr:'Fanta Orange',en:'Fanta Orange',ar:'فانتا برتقال',amz:'ⴼⴰⵏⵜⴰ'},price:0},
    {id:'sprite',names:{fr:'Sprite',en:'Sprite',ar:'سبرايت',amz:'ⵙⴱⵔⵉⵜ'},price:0},
    {id:'citron',names:{fr:'7up Citron',en:'7up Lemon',ar:'7up ليمون',amz:'7up'},price:0},
  ]}),
  drinkSize: ():OptionGroup => ({ id:'size_drink', names:{fr:'Format',en:'Size',ar:'الحجم',amz:'ⴰⵎⵔⴰⵡ'}, type:'radio', required:true, choices:[
    {id:'25',names:{fr:'Petite 25cl',en:'Small 25cl',ar:'صغيرة 25cl',amz:'ⴰⵎⵥⵢⴰⵏ 25cl'},price:0},
    {id:'50',names:{fr:'Moyenne 50cl (+5 MAD)',en:'Medium 50cl (+5 MAD)',ar:'متوسطة 50cl (+5)',amz:'ⴰⵎⵎⴰⵙ 50cl (+5)'},price:5},
    {id:'1l',names:{fr:'Grande 1L (+10 MAD)',en:'Large 1L (+10 MAD)',ar:'كبيرة 1L (+10)',amz:'ⵜⴰⵎⵇⵇⵔⴰⵏⵜ 1L (+10)'},price:10},
  ]}),
};

// ─── RESTAURANT DATA ──────────────────────────────────────────────────────────

// ─── McDONALD'S OPTION GROUPS ─────────────────────────────────────────────────

const MCD = {
  menuSize: ():OptionGroup => ({ id:'menu_size', names:{fr:'Format du Menu',en:'Menu Size',ar:'حجم الوجبة',amz:'ⴰⵎⵔⴰⵡ'}, type:'radio', required:true, choices:[
    {id:'medium',names:{fr:'Menu Medium',en:'Medium Meal',ar:'وجبة وسط',amz:'ⵎⵉⴷⵢⵓⵎ'},price:0},
    {id:'maxi',  names:{fr:'Menu Large (+7 MAD)',en:'Large Meal (+7 MAD)',ar:'وجبة كبيرة (+7)',amz:'ⵎⴰⴽⵙⵉ (+7)'},price:7},
  ]}),
  menuDrink: ():OptionGroup => ({ id:'menu_drink', names:{fr:'Boisson',en:'Drink',ar:'المشروب',amz:'ⴰⵙⵡ'}, type:'radio', required:true, choices:[
    {id:'cola',   names:{fr:'Coca-Cola',      en:'Coca-Cola',      ar:'كوكا كولا',   amz:'ⴽⵓⵍⴰ'},       price:0},
    {id:'fanta',  names:{fr:'Fanta Orange',   en:'Fanta Orange',   ar:'فانتا برتقال',amz:'ⴼⴰⵏⵜⴰ'},      price:0},
    {id:'sprite', names:{fr:'Sprite',         en:'Sprite',         ar:'سبرايت',      amz:'ⵙⴱⵔⵉⵜ'},      price:0},
    {id:'7up',    names:{fr:'7UP',            en:'7UP',            ar:'7UP',          amz:'7UP'},          price:0},
    {id:'nestea', names:{fr:'Nestea',         en:'Nestea',         ar:'نيستي',        amz:'ⵏⵉⵙⵜⵉ'},      price:0},
    {id:'eau',    names:{fr:'Eau Minérale',   en:'Still Water',    ar:'ماء معدني',   amz:'ⴰⵎⴰⵏ'},        price:0},
  ]}),
  removals: ():OptionGroup => ({ id:'removals', names:{fr:'Retirer (optionnel)',en:'Remove (optional)',ar:'إزالة (اختياري)',amz:'ⵙⵔⵔⵓ'}, type:'checkbox', required:false, choices:[
    {id:'no_pickle', names:{fr:'Sans cornichons',  en:'No pickles',   ar:'بدون خيار',     amz:'ⵓⵔ ⵉⴼⵔⵓⵔⵏ'},  price:0},
    {id:'no_onion',  names:{fr:'Sans oignons',     en:'No onions',    ar:'بدون بصل',      amz:'ⵓⵔ ⵜⵉⴱⵙⵍⵉⵏ'}, price:0},
    {id:'no_salad',  names:{fr:'Sans salade',      en:'No lettuce',   ar:'بدون خس',       amz:'ⵓⵔ ⵓⵍⵓⴼ'},    price:0},
    {id:'no_tomato', names:{fr:'Sans tomate',      en:'No tomato',    ar:'بدون طماطم',    amz:'ⵓⵔ ⴰⵎⵥⵢⴰⵏ'},   price:0},
    {id:'no_sauce',  names:{fr:'Sans sauce',       en:'No sauce',     ar:'بدون صلصة',     amz:'ⵓⵔ ⴰⵙⴰⴽ'},    price:0},
    {id:'no_cheese', names:{fr:'Sans fromage',     en:'No cheese',    ar:'بدون جبن',      amz:'ⵓⵔ ⴰⴼⵔⵓⵎⴰⵊ'}, price:0},
  ]}),
  dipSauce: ():OptionGroup => ({ id:'dip', names:{fr:'Sauce Dip',en:'Dipping Sauce',ar:'صلصة التغميس',amz:'ⴰⵙⴰⴽ'}, type:'radio', required:true, choices:[
    {id:'ketchup',  names:{fr:'Ketchup',       en:'Ketchup',       ar:'كاتشاب',     amz:'ⴽⵉⵜⵛⵓⴱ'},    price:0},
    {id:'bbq',      names:{fr:'Barbecue',      en:'BBQ',           ar:'باربيكيو',   amz:'BBQ'},          price:0},
    {id:'honey',    names:{fr:'Miel-Moutarde', en:'Honey Mustard', ar:'عسل خردل',   amz:'ⴰⵎⵎⵉⵙ'},      price:0},
    {id:'curry',    names:{fr:'Sauce Curry',   en:'Curry Sauce',   ar:'كاري',       amz:'ⴽⴰⵔⵉ'},       price:0},
    {id:'sweet',    names:{fr:'Sweet Chili',   en:'Sweet Chili',   ar:'تشيلي حلو',  amz:'ⵜⵛⵉⵍⵉ'},     price:0},
  ]}),
  nuggetsQty: ():OptionGroup => ({ id:'nuggets_qty', names:{fr:'Nombre de pièces',en:'Number of pieces',ar:'عدد القطع',amz:'ⴰⵏⵓⵎⵔ'}, type:'radio', required:true, choices:[
    {id:'6', names:{fr:'6 pièces',en:'6 pieces',ar:'6 قطع',amz:'6'},price:0},
    {id:'9', names:{fr:'9 pièces (+15 MAD)',en:'9 pieces (+15 MAD)',ar:'9 قطع (+15)',amz:'9 (+15)'},price:15},
    {id:'20',names:{fr:'20 pièces (+55 MAD)',en:'20 pieces (+55 MAD)',ar:'20 قطع (+55)',amz:'20 (+55)'},price:55},
  ]}),
  happyMealDessert: ():OptionGroup => ({ id:'hm_dessert', names:{fr:'Dessert',en:'Dessert',ar:'الحلوى',amz:'ⴰⵎⴰⴳⵓ'}, type:'radio', required:true, choices:[
    {id:'icecream',names:{fr:'Glace Vanille',   en:'Vanilla Ice Cream', ar:'بوظة فانيلا', amz:'ⵜⴰⵍⴰⵢⵜ'},price:0},
    {id:'apple',   names:{fr:'Apple Pie',       en:'Apple Pie',         ar:'فطيرة التفاح', amz:'ⴰⴱⵍⴰ'},   price:0},
    {id:'mcflurry',names:{fr:'McFlurry Oreo',   en:'McFlurry Oreo',     ar:'ماك فلوري أوريو',amz:'ⵎⴽⴼⵍⵓⵔⵉ'},price:5},
  ]}),
  happyMealToy: ():OptionGroup => ({ id:'hm_toy', names:{fr:'Jouet Happy Meal',en:'Happy Meal Toy',ar:'لعبة وجبة الأطفال',amz:'ⴰⵣⴰⵡⴰⵏ'}, type:'radio', required:true, choices:[
    {id:'boy',  names:{fr:'Garçon',en:"Boy's toy",ar:'ولد',amz:'ⴰⵣⴰⵡⴰⵏ ⵏ ⵢⵉⵖⵔⵎ'},price:0},
    {id:'girl', names:{fr:'Fille', en:"Girl's toy",ar:'بنت',amz:'ⴰⵣⴰⵡⴰⵏ ⵏ ⵜⴼⴰⵜ'}, price:0},
  ]}),
  drinkSize: ():OptionGroup => ({ id:'drink_size', names:{fr:'Format',en:'Size',ar:'الحجم',amz:'ⴰⵎⵔⴰⵡ'}, type:'radio', required:true, choices:[
    {id:'s', names:{fr:'Small (30cl)',   en:'Small (30cl)',   ar:'صغير (30cl)',  amz:'ⴰⵎⵥⵢⴰⵏ'},  price:0},
    {id:'m', names:{fr:'Medium (50cl)', en:'Medium (50cl)', ar:'وسط (50cl)',   amz:'ⴰⵎⵎⴰⵙ (+5)'},price:5},
    {id:'l', names:{fr:'Large (1L)',    en:'Large (1L)',     ar:'كبير (1L +10)',amz:'ⵜⴰⵎⵇⵇⵔⴰⵏⵜ (+10)'},price:10},
  ]}),
  drinkIce: ():OptionGroup => ({ id:'ice', names:{fr:'Glaçons',en:'Ice',ar:'الثلج',amz:'ⴰⵎⴽⵙⴰ'}, type:'radio', required:false, choices:[
    {id:'with_ice',  names:{fr:'Avec glaçons',  en:'With ice',    ar:'مع ثلج',     amz:'ⵙ ⵓⵎⴽⵙⴰ'},   price:0},
    {id:'no_ice',    names:{fr:'Sans glaçons',  en:'Without ice', ar:'بدون ثلج',   amz:'ⵓⵔ ⵓⵎⴽⵙⴰ'},  price:0},
  ]}),
};

const MCDO_COVER   = '/mcdo_cover.jpg';
const MCDO_BIGMAC  = '/mcdo_burger.jpg';
const MCDO_CHICKEN = 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&q=80';
const MCDO_CRISPY  = 'https://images.unsplash.com/photo-1596956470007-2bf6095e7e16?w=600&q=80';
const MCDO_CHEESE  = 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80';
const MCDO_FISH    = 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&q=80';
const MCDO_SIGN    = 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&q=80';
const MCDO_NUGGETS = 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=80';
const MCDO_WINGS   = 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&q=80';
const MCDO_FRIES   = 'https://images.unsplash.com/photo-1576107232684-1279f55e14cf?w=600&q=80';
const MCDO_WEDGES  = 'https://images.unsplash.com/photo-1630431341973-02e1b662ec35?w=600&q=80';
const MCDO_HAPPY   = 'https://images.unsplash.com/photo-1619881589316-24831c9e0b2d?w=600&q=80';
const MCDO_MCFLURRY= 'https://images.unsplash.com/photo-1576039638882-cc2ca1d23c4f?w=600&q=80';
const MCDO_SUNDAE  = 'https://images.unsplash.com/photo-1614088685112-0a760b71a3c8?w=600&q=80';
const MCDO_PIE     = 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&q=80';
const MCDO_MILK    = 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80';
const MCDO_COOKIE  = 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&q=80';
const MCDO_COLA    = 'https://images.unsplash.com/photo-1574914629385-46448b488c3c?w=600&q=80';
const MCDO_JUICE   = 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=80';
const MCDO_COFFEE  = 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=600&q=80';
const MCDO_WATER   = 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&q=80';

const RESTAURANTS: Restaurant[] = [
  // ─── McDONALD'S SAFI (Featured · Pinned #1) ──────────────────────────────
  {
    id:'mcdonalds-safi',
    name:"McDonald's Safi",
    tagline:{fr:'Le goût que vous aimez, livré à Safi',en:'The taste you love, delivered in Safi',ar:'الطعم الذي تحبه، يُوصَّل إليك في آسفي',amz:'ⴰⵥⵡⴰⵏ ⵉⵃⵎⵍⵏ, ⴷ ⵙⴰⴼⵉ'},
    logo:'🍟',
    cover: MCDO_COVER,
    cuisine:{fr:'Burgers · Menus · Fast Food',en:'Burgers · Meals · Fast Food',ar:'برغر · وجبات · فاست فود',amz:'ⴱⵓⵔⴳⵔ · ⵎⵉⵏⵓ'},
    tags:['burger','fast-food'],
    rating:4.5, deliveryTime:'20–30', minOrder:49,
    categories:[
      {
        id:'menus', emoji:'🥡',
        names:{fr:'Menus',en:'Meals',ar:'الوجبات الكاملة',amz:'ⵉⵎⵏⵓⵏ'},
        items:[
          {id:'mc1',names:{fr:'Menu Big Mac',en:'Big Mac Meal',ar:'وجبة بيج ماك',amz:'ⴱⵉⴳ ⵎⴰⴽ ⵎⵉⵏⵓ'},price:69,photo:MCDO_BIGMAC,options:[MCD.menuSize(),MCD.menuDrink(),MCD.removals()]},
          {id:'mc2',names:{fr:'Menu McChicken',en:'McChicken Meal',ar:'وجبة ماك تشيكن',amz:'ⵎⴽⵜⵛⵉⴽⵏ ⵎⵉⵏⵓ'},price:67,photo:MCDO_CHICKEN,options:[MCD.menuSize(),MCD.menuDrink(),MCD.removals()]},
          {id:'mc3',names:{fr:'Menu Double Cheeseburger',en:'Double Cheeseburger Meal',ar:'وجبة دبل تشيزبرغر',amz:'ⴷⴱⵍ ⵛⵉⵣⴱⵓⵔⴳⵔ ⵎⵉⵏⵓ'},price:56,photo:MCDO_CHEESE,options:[MCD.menuSize(),MCD.menuDrink(),MCD.removals()]},
          {id:'mc4',names:{fr:'Menu Filet-O-Fish',en:'Filet-O-Fish Meal',ar:'وجبة فيليه أو فيش',amz:'ⴼⵉⵍⵉⵜ ⵎⵉⵏⵓ'},price:62,photo:MCDO_FISH,options:[MCD.menuSize(),MCD.menuDrink(),MCD.removals()]},
          {id:'mc5',names:{fr:'Menu Grand Chicken Classic',en:'Grand Chicken Classic Meal',ar:'وجبة غراند تشيكن كلاسيك',amz:'ⴳⵔⴰⵏⴷ ⵛⵉⴽⵏ ⵎⵉⵏⵓ'},price:81,photo:MCDO_CRISPY,options:[MCD.menuSize(),MCD.menuDrink(),MCD.removals()]},
          {id:'mc6',names:{fr:'Menu McNuggets 9 pcs',en:'9 McNuggets Meal',ar:'وجبة ماك نجتس 9 قطع',amz:'ⵏⴳⵜⵙ 9 ⵎⵉⵏⵓ'},price:66,photo:MCDO_NUGGETS,options:[MCD.menuSize(),MCD.menuDrink(),MCD.dipSauce()]},
          {id:'mc7',names:{fr:'Menu Signature Smoky BBQ',en:'Signature Smoky BBQ Meal',ar:'وجبة سيغنيتشر سموكي',amz:'ⵙⵉⴳⵏⵉⵜⵛⵔ ⵎⵉⵏⵓ'},price:99,photo:MCDO_SIGN,options:[MCD.menuDrink(),MCD.removals()]},
        ],
      },
      {
        id:'sandwiches', emoji:'🍔',
        names:{fr:'Sandwiches',en:'Sandwiches',ar:'الساندويشات',amz:'ⵉⵙⵙⴰⵏⴷⵡⵉⵜⵛⵏ'},
        items:[
          {id:'ms1',names:{fr:'Big Mac',en:'Big Mac',ar:'بيج ماك',amz:'ⴱⵉⴳ ⵎⴰⴽ'},price:52,photo:MCDO_BIGMAC,options:[MCD.removals()]},
          {id:'ms2',names:{fr:'McChicken',en:'McChicken',ar:'ماك تشيكن',amz:'ⵎⴽⵜⵛⵉⴽⵏ'},price:50,photo:MCDO_CHICKEN,options:[MCD.removals()]},
          {id:'ms3',names:{fr:'Double Cheeseburger',en:'Double Cheeseburger',ar:'دبل تشيزبرغر',amz:'ⴷⴱⵍ ⵛⵉⵣⴱⵓⵔⴳⵔ'},price:33,photo:MCDO_CHEESE,options:[MCD.removals()]},
          {id:'ms4',names:{fr:'Cheeseburger',en:'Cheeseburger',ar:'تشيزبرغر',amz:'ⵛⵉⵣⴱⵓⵔⴳⵔ'},price:19,photo:MCDO_CHEESE,options:[MCD.removals()]},
          {id:'ms5',names:{fr:'Chicken Burger',en:'Chicken Burger',ar:'برغر دجاج',amz:'ⵛⵉⴽⵏ ⴱⵓⵔⴳⵔ'},price:19,photo:MCDO_CHICKEN,options:[MCD.removals()]},
          {id:'ms6',names:{fr:'Filet-O-Fish',en:'Filet-O-Fish',ar:'فيليه أو فيش',amz:'ⴼⵉⵍⵉⵜ'},price:45,photo:MCDO_FISH,options:[MCD.removals()]},
          {id:'ms7',names:{fr:'Grand Chicken Classic',en:'Grand Chicken Classic',ar:'غراند تشيكن كلاسيك',amz:'ⴳⵔⴰⵏⴷ ⵛⵉⴽⵏ'},price:64,photo:MCDO_CRISPY,options:[MCD.removals()]},
          {id:'ms8',names:{fr:'Grand Chicken Special',en:'Grand Chicken Special',ar:'غراند تشيكن سبيشال',amz:'ⴳⵔⴰⵏⴷ ⵛⵉⴽⵏ ⵙⴱⵉⵛⴰⵍ'},price:69,photo:MCDO_CRISPY,options:[MCD.removals()]},
          {id:'ms9',names:{fr:'Signature Smoky BBQ',en:'Signature Smoky BBQ',ar:'سيغنيتشر سموكي BBQ',amz:'ⵙⵉⴳⵏⵉⵜⵛⵔ ⴱⴱⵇ'},price:82,photo:MCDO_SIGN,options:[MCD.removals()]},
        ],
      },
      {
        id:'nuggets_wings', emoji:'🍗',
        names:{fr:'Nuggets & Wings',en:'Nuggets & Wings',ar:'نجتس والأجنحة',amz:'ⵏⴳⵜⵙ ⴷ ⵉⴱⵓⵔⵎⴰⵏ'},
        items:[
          {id:'mnw1',names:{fr:'McNuggets 6 pcs',en:'6 McNuggets',ar:'ماك نجتس 6 قطع',amz:'ⵏⴳⵜⵙ 6'},price:39,photo:MCDO_NUGGETS,options:[MCD.dipSauce()]},
          {id:'mnw2',names:{fr:'McNuggets 9 pcs',en:'9 McNuggets',ar:'ماك نجتس 9 قطع',amz:'ⵏⴳⵜⵙ 9'},price:49,photo:MCDO_NUGGETS,options:[MCD.dipSauce()]},
          {id:'mnw3',names:{fr:'Chicken Wings 4 pcs',en:'4 Chicken Wings',ar:'أجنحة دجاج 4 قطع',amz:'ⵉⴱⵓⵔⵎⴰⵏ 4'},price:32,photo:MCDO_WINGS,options:[MCD.dipSauce()]},
          {id:'mnw4',names:{fr:'Chicken Wings 6 pcs',en:'6 Chicken Wings',ar:'أجنحة دجاج 6 قطع',amz:'ⵉⴱⵓⵔⵎⴰⵏ 6'},price:44,photo:MCDO_WINGS,options:[MCD.dipSauce()]},
          {id:'mnw5',names:{fr:'Mixed Box Nuggets & Wings',en:'Mixed Nuggets & Wings Box',ar:'صندوق مشكل نجتس وأجنحة',amz:'ⴱⵓⴽⵙ ⵎⵉⴽⵙ'},price:75,photo:MCDO_NUGGETS,options:[MCD.dipSauce()]},
        ],
      },
      {
        id:'happy_meal', emoji:'🎉',
        names:{fr:'Happy Meal',en:'Happy Meal',ar:'هابي ميل',amz:'ⵀⴰⴱⵉ ⵎⵉⵍ'},
        items:[
          {id:'mhm1',names:{fr:'Happy Meal Cheeseburger',en:'Cheeseburger Happy Meal',ar:'هابي ميل تشيزبرغر',amz:'ⵀⴰⴱⵉ ⵎⵉⵍ ⵛⵉⵣ'},price:35,photo:MCDO_HAPPY,options:[MCD.menuDrink(),MCD.happyMealDessert(),MCD.happyMealToy()]},
          {id:'mhm2',names:{fr:'Happy Meal Chicken Burger',en:'Chicken Burger Happy Meal',ar:'هابي ميل برغر دجاج',amz:'ⵀⴰⴱⵉ ⵎⵉⵍ ⵛⵉⴽⵏ'},price:35,photo:MCDO_HAPPY,options:[MCD.menuDrink(),MCD.happyMealDessert(),MCD.happyMealToy()]},
          {id:'mhm3',names:{fr:'Happy Meal McNuggets',en:'McNuggets Happy Meal',ar:'هابي ميل ماك نجتس',amz:'ⵀⴰⴱⵉ ⵎⵉⵍ ⵏⴳⵜⵙ'},price:35,photo:MCDO_NUGGETS,options:[MCD.menuDrink(),MCD.dipSauce(),MCD.happyMealDessert(),MCD.happyMealToy()]},
        ],
      },
      {
        id:'sides', emoji:'🍟',
        names:{fr:'Accompagnements',en:'Sides',ar:'المشتهيات',amz:'ⵉⵙⴳⵓⵎⴰⵏ'},
        items:[
          {id:'msi1',names:{fr:'Frites Small',en:'Small Fries',ar:'بطاطس صغير',amz:'ⴼⵔⵉⵜⵙ ⵙⵎⴰⵍ'},price:18,photo:MCDO_FRIES},
          {id:'msi2',names:{fr:'Frites Medium',en:'Medium Fries',ar:'بطاطس وسط',amz:'ⴼⵔⵉⵜⵙ ⵎⵉⴷⵢⵓⵎ'},price:24,photo:MCDO_FRIES},
          {id:'msi3',names:{fr:'Frites Large',en:'Large Fries',ar:'بطاطس كبير',amz:'ⴼⵔⵉⵜⵙ ⵍⴰⵔⵊ'},price:29,photo:MCDO_FRIES},
          {id:'msi4',names:{fr:'Potato Wedges',en:'Potato Wedges',ar:'قطع البطاطا',amz:'ⴱⵓⵍⵉⵢⵢⴰ'},price:26,photo:MCDO_WEDGES},
        ],
      },
      {
        id:'desserts_mcd', emoji:'🍨',
        names:{fr:'Desserts',en:'Desserts',ar:'الحلويات',amz:'ⵉⵎⴰⴳⴰⵏ'},
        items:[
          {id:'mde1',names:{fr:'McFlurry Oreo',en:'McFlurry Oreo',ar:'ماك فلوري أوريو',amz:'ⵎⴽⴼⵍⵓⵔⵉ ⵓⵔⵉⵢⵓ'},price:32,photo:MCDO_MCFLURRY},
          {id:'mde2',names:{fr:'McFlurry KitKat',en:'McFlurry KitKat',ar:'ماك فلوري كيت كات',amz:'ⵎⴽⴼⵍⵓⵔⵉ ⴽⵉⵜⴽⴰⵜ'},price:32,photo:MCDO_MCFLURRY},
          {id:'mde3',names:{fr:'McFlurry Smarties',en:'McFlurry Smarties',ar:'ماك فلوري سمارتيز',amz:'ⵎⴽⴼⵍⵓⵔⵉ ⵙⵎⴰⵔⵜⵉⵣ'},price:32,photo:MCDO_MCFLURRY},
          {id:'mde4',names:{fr:'Sundae Chocolat',en:'Chocolate Sundae',ar:'سانداي شوكولاتة',amz:'ⵙⴰⵏⴷⴰⵢ ⵛⵓⴽⵓⵍⴰ'},price:22,photo:MCDO_SUNDAE},
          {id:'mde5',names:{fr:'Sundae Caramel',en:'Caramel Sundae',ar:'سانداي كراميل',amz:'ⵙⴰⵏⴷⴰⵢ ⴽⴰⵔⴰⵎⵉⵍ'},price:22,photo:MCDO_SUNDAE},
          {id:'mde6',names:{fr:'Sundae Fraise',en:'Strawberry Sundae',ar:'سانداي فراولة',amz:'ⵙⴰⵏⴷⴰⵢ ⵜⴰⴽⵍⵉⵎⵜ'},price:22,photo:MCDO_SUNDAE},
          {id:'mde7',names:{fr:'Apple Pie',en:'Apple Pie',ar:'فطيرة التفاح',amz:'ⴰⴱⵍⴰ ⴱⵉ'},price:16,photo:MCDO_PIE},
          {id:'mde8',names:{fr:'Milkshake Vanille',en:'Vanilla Milkshake',ar:'ميلكشيك فانيلا',amz:'ⵎⵉⵍⴽⵛⵉⴽ ⴼⴰⵏⵉⵍⴰ'},price:25,photo:MCDO_MILK},
          {id:'mde9',names:{fr:'Milkshake Chocolat',en:'Chocolate Milkshake',ar:'ميلكشيك شوكولا',amz:'ⵎⵉⵍⴽⵛⵉⴽ ⵛⵓⴽⵓⵍⴰ'},price:25,photo:MCDO_MILK},
          {id:'mde10',names:{fr:'Milkshake Fraise',en:'Strawberry Milkshake',ar:'ميلكشيك فراولة',amz:'ⵎⵉⵍⴽⵛⵉⴽ ⵜⴰⴽⵍⵉⵎⵜ'},price:25,photo:MCDO_MILK},
          {id:'mde11',names:{fr:'Cookie',en:'Cookie',ar:'كوكي',amz:'ⴽⵓⴽⵉ'},price:18,photo:MCDO_COOKIE},
        ],
      },
      {
        id:'drinks_mcd', emoji:'🥤',
        names:{fr:'Boissons',en:'Drinks',ar:'المشروبات',amz:'ⴰⵙⵡ'},
        items:[
          {id:'mdr1',names:{fr:'Coca-Cola',en:'Coca-Cola',ar:'كوكا كولا',amz:'ⴽⵓⵍⴰ'},price:17,photo:MCDO_COLA,options:[MCD.drinkSize(),MCD.drinkIce()]},
          {id:'mdr2',names:{fr:'Fanta Orange',en:'Fanta Orange',ar:'فانتا برتقال',amz:'ⴼⴰⵏⵜⴰ'},price:17,photo:MCDO_COLA,options:[MCD.drinkSize(),MCD.drinkIce()]},
          {id:'mdr3',names:{fr:'Sprite',en:'Sprite',ar:'سبرايت',amz:'ⵙⴱⵔⵉⵜ'},price:17,photo:MCDO_COLA,options:[MCD.drinkSize(),MCD.drinkIce()]},
          {id:'mdr4',names:{fr:'Jus d\'Orange',en:'Orange Juice',ar:'عصير برتقال',amz:'ⵜⴰⵎⵓⵖⵓⵏⵜ'},price:22,photo:MCDO_JUICE},
          {id:'mdr5',names:{fr:'Café Espresso',en:'Espresso',ar:'إسبريسو',amz:'ⵇⴰⵀⵡⴰ'},price:15,photo:MCDO_COFFEE},
          {id:'mdr6',names:{fr:'Eau Sidi Ali',en:'Sidi Ali Water',ar:'سيدي علي',amz:'ⴰⵎⴰⵏ ⵙⵉⴷⵉ ⵄⵍⵉ'},price:10,photo:MCDO_WATER},
        ],
      },
    ],
  },
  // ─── OTHER RESTAURANTS ────────────────────────────────────────────────────
  {
    id:'bridge-pizza',
    name:'Bridge Pizza & Tacos',
    tagline:{fr:'Pizzas artisanales & Tacos généreux',en:'Artisan pizzas & generous tacos',ar:'بيتزا حرفية وتاكو كريم',amz:'ⴱⵉⵜⵣⴰ ⵏ ⵓⵣⵣⵓⵔⵉ ⴷ ⵜⴰⴽⵓⵙ'},
    logo:'🍕', cover:'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=700&q=80',
    cuisine:{fr:'Pizzas · Tacos · Italien',en:'Pizzas · Tacos · Italian',ar:'بيتزا · تاكو · إيطالي',amz:'ⴱⵉⵜⵣⴰ · ⵜⴰⴽⵓⵙ'},
    tags:['pizza','tacos'],
    rating:4.8, deliveryTime:'20–30', minOrder:35,
    categories:[
      { id:'appetizers', emoji:'🥗', names:{fr:'Entrées',en:'Appetizers',ar:'مقبلات',amz:'ⵉⴼⵔⴰⵏ'}, items:[
        {id:'ap1',names:{fr:'Salade Marocaine',en:'Moroccan Salad',ar:'سلطة مغربية',amz:'ⵜⴰⵙⴰⵍⴰⴷⵜ'},price:25,photo:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80'},
        {id:'ap2',names:{fr:'Soupe Harira',en:'Harira Soup',ar:'حريرة',amz:'ⵜⴰⵎⵔⵜ ⵏ ⵔⵔⴱⵉⵄ'},price:20,photo:'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80'},
        {id:'ap3',names:{fr:'Frites Maison',en:'Homemade Fries',ar:'بطاطس مقلية',amz:'ⴱⵓⵍⵉⵢⵢⴰ'},price:15,photo:'https://images.unsplash.com/photo-1576107232684-1279f55e14cf?w=400&q=80'},
      ]},
      { id:'pizzas', emoji:'🍕', names:{fr:'Pizzas',en:'Pizzas',ar:'بيتزا',amz:'ⴱⵉⵜⵣⴰ'}, items:[
        {id:'pz1',safi:true,names:{fr:'Pizza Fruits de Mer Safi',en:'Safi Seafood Pizza',ar:'بيتزا فواكه البحر آسفي',amz:'ⴱⵉⵜⵣⴰ ⵙⴰⴼⵉ'},price:65,photo:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',options:[OPT.pizzaSize(),OPT.pizzaSauce(),OPT.pizzaExtras()]},
        {id:'pz2',names:{fr:'Pizza Kefta Marocaine',en:'Moroccan Kefta Pizza',ar:'بيتزا الكفتة المغربية',amz:'ⴱⵉⵜⵣⴰ ⵏ ⴽⴼⵜⴰ'},price:55,photo:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',options:[OPT.pizzaSize(),OPT.pizzaSauce(),OPT.pizzaExtras()]},
        {id:'pz3',names:{fr:'Pizza 4 Fromages',en:'4 Cheese Pizza',ar:'بيتزا 4 أجبان',amz:'ⴱⵉⵜⵣⴰ 4 ⵉⴼⵔⵓⵎⴰⵊⵏ'},price:50,photo:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',options:[OPT.pizzaSize(),OPT.pizzaSauce(),OPT.pizzaExtras()]},
        {id:'pz4',names:{fr:'Pizza Végétarienne',en:'Vegetarian Pizza',ar:'بيتزا خضروات',amz:'ⴱⵉⵜⵣⴰ ⵏ ⵉⴷⴳⴰⵏ'},price:45,photo:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',options:[OPT.pizzaSize(),OPT.pizzaSauce(),OPT.pizzaExtras()]},
      ]},
      { id:'tacos', emoji:'🌮', names:{fr:'Tacos',en:'Tacos',ar:'تاكو',amz:'ⵜⴰⴽⵓⵙ'}, items:[
        {id:'tc1',names:{fr:'Tacos Poulet Fromage',en:'Chicken Cheese Tacos',ar:'تاكو دجاج وجبن',amz:'ⵜⴰⴽⵓⵙ ⵏ ⴰⵢⵢⵓⵣ'},price:40,photo:'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&q=80',options:[OPT.tacosSauce(),OPT.tacosExtras()]},
        {id:'tc2',names:{fr:'Tacos Viande Hachée',en:'Ground Beef Tacos',ar:'تاكو اللحم المفروم',amz:'ⵜⴰⴽⵓⵙ ⵏ ⴰⴽⵙⵓⵎ'},price:45,photo:'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&q=80',options:[OPT.tacosSauce(),OPT.tacosExtras()]},
        {id:'tc3',safi:true,names:{fr:'Tacos Crevettes Safi',en:'Safi Shrimp Tacos',ar:'تاكو جمبري آسفي',amz:'ⵜⴰⴽⵓⵙ ⵏ ⵜⵖⵍⵍⴰ ⵙⴰⴼⵉ'},price:55,photo:'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&q=80',options:[OPT.tacosSauce(),OPT.tacosExtras()]},
        {id:'tc4',names:{fr:'Tacos Végétarien',en:'Vegetarian Tacos',ar:'تاكو خضروات',amz:'ⵜⴰⴽⵓⵙ ⵏ ⵉⴷⴳⴰⵏ'},price:35,photo:'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&q=80',options:[OPT.tacosSauce(),OPT.tacosExtras()]},
      ]},
      { id:'desserts', emoji:'🍰', names:{fr:'Desserts',en:'Desserts',ar:'حلويات',amz:'ⵉⵎⴰⴳⴰⵏ'}, items:[
        {id:'ds1',names:{fr:'Tiramisu',en:'Tiramisu',ar:'تيراميسو',amz:'ⵜⵉⵔⴰⵎⵉⵙⵓ'},price:30,photo:'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&q=80'},
        {id:'ds2',names:{fr:'Crème Brûlée',en:'Crème Brûlée',ar:'كريم بروليه',amz:'ⴽⵔⵉⵎ ⴱⵔⵓⵍⵉ'},price:28,photo:'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=400&q=80'},
      ]},
      { id:'drinks', emoji:'🥤', names:{fr:'Boissons',en:'Drinks',ar:'مشروبات',amz:'ⴰⵙⵡ'}, items:[
        {id:'dr1',names:{fr:'Soda',en:'Soda',ar:'صودا',amz:'ⵙⵓⴷⴰ'},price:10,photo:'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80',options:[OPT.drinkFlavor(),OPT.drinkSize()]},
        {id:'dr2',names:{fr:'Jus de Fruits',en:'Fruit Juice',ar:'عصير فواكه',amz:'ⵜⴰⵎⵓⵖⵓⵏⵜ ⵏ ⵉⵎⴷⵔⵉⵙⵏ'},price:15,photo:'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80'},
        {id:'dr3',names:{fr:'Eau Minérale',en:'Water',ar:'ماء معدني',amz:'ⴰⵎⴰⵏ'},price:5,photo:'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80'},
      ]},
    ],
  },
  {
    id:'safi-seafood',
    name:'Safi Seafood Palace',
    tagline:{fr:'Les trésors de la mer d\'Atlantique',en:'Atlantic Ocean seafood treasures',ar:'كنوز المحيط الأطلسي',amz:'ⵉⵙⴰⵙ ⵏ ⵡⴰⵟⵍⴰⵙ'},
    logo:'🦞', cover:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&q=80',
    cuisine:{fr:'Poissons · Fruits de mer · Marocain',en:'Fish · Seafood · Moroccan',ar:'سمك · بحريات · مغربي',amz:'ⵉⵙⴰⵙ · ⵎⴰⵕⵕⵓⴽⵉ'},
    tags:['seafood'],
    rating:4.9, deliveryTime:'25–35', minOrder:40,
    categories:[
      { id:'appetizers', emoji:'🥗', names:{fr:'Entrées',en:'Appetizers',ar:'مقبلات',amz:'ⵉⴼⵔⴰⵏ'}, items:[
        {id:'sap1',safi:true,names:{fr:'Soupe de Poisson Safi',en:'Safi Fish Soup',ar:'شوربة السمك آسفي',amz:'ⵜⴰⵎⵔⵜ ⵏ ⵉⵙⵍⵎ'},price:35,photo:'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80'},
        {id:'sap2',names:{fr:'Salade de Crevettes',en:'Shrimp Salad',ar:'سلطة جمبري',amz:'ⵜⴰⵙⴰⵍⴰⴷⵜ ⵏ ⵜⵖⵍⵍⴰ'},price:40,photo:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80'},
        {id:'sap3',safi:true,names:{fr:'Sardines Froides Safi',en:'Safi Cold Sardines',ar:'سردين بارد آسفي',amz:'ⵙⵔⴷⵉⵏ ⵏ ⵙⴰⴼⵉ'},price:30,photo:'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80'},
      ]},
      { id:'seafood', emoji:'🦞', names:{fr:'Fruits de Mer',en:'Seafood',ar:'بحريات آسفي',amz:'ⵉⵙⴰⵙ ⵏ ⵙⴰⴼⵉ'}, items:[
        {id:'sf1',safi:true,names:{fr:'Chraime de Safi',en:'Safi Chraime Fish',ar:'شرايم آسفي',amz:'ⵛⵔⴰⵉⵎ ⵏ ⵙⴰⴼⵉ'},price:55,photo:'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80'},
        {id:'sf2',safi:true,names:{fr:'Tajine de Sole',en:'Sole Fish Tajine',ar:'طاجين السمك المفلطح',amz:'ⵟⴰⵊⵉⵏ ⵏ ⵜⴰⵙⵓⵍⵜ'},price:70,photo:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80'},
        {id:'sf3',names:{fr:'Brochettes de Crevettes',en:'Shrimp Skewers',ar:'أسياخ الجمبري',amz:'ⴱⵔⵓⵛⵜ ⵏ ⵜⵖⵍⵍⴰ'},price:65,photo:'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80'},
        {id:'sf4',safi:true,names:{fr:'Sardines Grillées Safi',en:'Grilled Safi Sardines',ar:'السردين المشوي آسفي',amz:'ⵙⵔⴷⵉⵏ ⵖ ⵜⴼⵓⵏⴰⵙⵜ'},price:40,photo:'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80'},
        {id:'sf5',names:{fr:'Calamars Grillés',en:'Grilled Calamari',ar:'حبار مشوي',amz:'ⵜⴰⵍⵓⵜ ⵜⴰⵎⵥⵥⵓⵢⵜ'},price:60,photo:'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80'},
      ]},
      { id:'mains', emoji:'🍽️', names:{fr:'Plats',en:'Main Courses',ar:'أطباق رئيسية',amz:'ⵉⴽⵙⵓⴳⴰⵏ'}, items:[
        {id:'mn1',names:{fr:'Riz aux Fruits de Mer',en:'Seafood Rice',ar:'أرز بحريات',amz:'ⴰⵔⵣ ⵏ ⵉⵙⴰⵙ'},price:55,photo:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80'},
        {id:'mn2',safi:true,names:{fr:'Couscous Poisson Safi',en:'Safi Fish Couscous',ar:'كسكس سمك آسفي',amz:'ⴽⵙⴽⵙ ⵏ ⵉⵙⵍⵎ ⵏ ⵙⴰⴼⵉ'},price:65,photo:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80'},
      ]},
      { id:'desserts', emoji:'🍰', names:{fr:'Desserts',en:'Desserts',ar:'حلويات',amz:'ⵉⵎⴰⴳⴰⵏ'}, items:[
        {id:'sds1',names:{fr:'Pastilla au Lait',en:'Milk Pastilla',ar:'بسطيلة باللبن',amz:'ⴱⵙⵟⵉⵍⴰ'},price:35,photo:'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&q=80'},
        {id:'sds2',names:{fr:'Fruits de Saison',en:'Seasonal Fruits',ar:'فواكه الموسم',amz:'ⵉⵎⴷⵔⵉⵙⵏ'},price:25,photo:'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&q=80'},
      ]},
      { id:'drinks', emoji:'🥤', names:{fr:'Boissons',en:'Drinks',ar:'مشروبات',amz:'ⴰⵙⵡ'}, items:[
        {id:'sdr1',names:{fr:'Thé à la Menthe',en:'Mint Tea',ar:'أتاي بالنعناع',amz:'ⴰⵜⴰⵢ ⵏ ⵜⵉⵔⴼⴰⵙ'},price:10,photo:'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80'},
        {id:'sdr2',names:{fr:'Jus Maison',en:'House Juice',ar:'عصير منزلي',amz:'ⵜⴰⵎⵓⵖⵓⵏⵜ'},price:20,photo:'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80'},
        {id:'sdr3',names:{fr:'Eau Minérale',en:'Water',ar:'ماء معدني',amz:'ⴰⵎⴰⵏ'},price:5,photo:'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80'},
      ]},
    ],
  },
  {
    id:'kebab-express',
    name:'Kebab Express Safi',
    tagline:{fr:'Sandwichs généreux & grillades au feu de bois',en:'Generous sandwiches & wood-fired grills',ar:'ساندويشات سخية ومشاوي',amz:'ⵙⴰⵏⴷⵡⵉⵜⵛ ⴷ ⵉⵣⵎⵎⵉⵡⵏ'},
    logo:'🌯', cover:'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=700&q=80',
    cuisine:{fr:'Kebab · Sandwichs · Grillades',en:'Kebab · Sandwiches · Grills',ar:'كباب · ساندويش · مشاوي',amz:'ⴽⴱⴰⴱ · ⵙⴰⵏⴷⵡⵉⵜⵛ'},
    tags:['kebab'],
    rating:4.7, deliveryTime:'15–25', minOrder:30,
    categories:[
      { id:'appetizers', emoji:'🥗', names:{fr:'Entrées',en:'Appetizers',ar:'مقبلات',amz:'ⵉⴼⵔⴰⵏ'}, items:[
        {id:'kap1',names:{fr:'Frites Maison',en:'Homemade Fries',ar:'بطاطس مقلية',amz:'ⴱⵓⵍⵉⵢⵢⴰ'},price:15,photo:'https://images.unsplash.com/photo-1576107232684-1279f55e14cf?w=400&q=80'},
        {id:'kap2',names:{fr:'Soupe Harira',en:'Harira Soup',ar:'حريرة',amz:'ⵜⴰⵎⵔⵜ ⵏ ⵔⵔⴱⵉⵄ'},price:20,photo:'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80'},
        {id:'kap3',names:{fr:'Salade Fraîche',en:'Fresh Salad',ar:'سلطة طازجة',amz:'ⵜⴰⵙⴰⵍⴰⴷⵜ'},price:22,photo:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80'},
      ]},
      { id:'kebabs', emoji:'🌯', names:{fr:'Kebabs & Sandwichs',en:'Kebabs & Sandwiches',ar:'كباب وساندويشات',amz:'ⴽⴱⴰⴱ'}, items:[
        {id:'kb1',names:{fr:'Sandwich Kefta Grillé',en:'Grilled Kefta Sandwich',ar:'ساندويش الكفتة المشوية',amz:'ⵙⴰⵏⴷⵡⵉⵜⵛ ⵏ ⴽⴼⵜⴰ'},price:35,photo:'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&q=80',options:[OPT.kebabBread(),OPT.kebabSauce(),OPT.kebabSalad()]},
        {id:'kb2',names:{fr:'Wrap Poulet Chermoula',en:'Chermoula Chicken Wrap',ar:'راب دجاج بالشرمولة',amz:'ⵡⵔⴰⴱ ⵏ ⴰⵢⵢⵓⵣ ⵛⵔⵎⵓⵍⴰ'},price:40,photo:'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&q=80',options:[OPT.kebabBread(),OPT.kebabSauce(),OPT.kebabSalad()]},
        {id:'kb3',names:{fr:'Panini Merguez',en:'Merguez Panini',ar:'باني مرقاز',amz:'ⴱⴰⵏⵉⵏⵉ ⵏ ⵎⵔⴳⵣ'},price:35,photo:'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&q=80',options:[OPT.kebabBread(),OPT.kebabSauce(),OPT.kebabSalad()]},
        {id:'kb4',names:{fr:'Assiette Kebab Mixte',en:'Mixed Kebab Plate',ar:'طبق كباب مشكل',amz:'ⵜⴰⵍⴼⵉⵙⵜ ⵏ ⴽⴱⴰⴱ'},price:75,photo:'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&q=80',options:[OPT.kebabSauce(),OPT.kebabSalad()]},
        {id:'kb5',names:{fr:'Sandwich Poulet Rôti',en:'Roast Chicken Sandwich',ar:'ساندويش دجاج مشوي',amz:'ⵙⴰⵏⴷⵡⵉⵜⵛ ⵏ ⴰⵢⵢⵓⵣ'},price:38,photo:'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&q=80',options:[OPT.kebabBread(),OPT.kebabSauce(),OPT.kebabSalad()]},
      ]},
      { id:'desserts', emoji:'🍰', names:{fr:'Pâtisseries',en:'Pastries',ar:'حلويات',amz:'ⵉⵎⴰⴳⴰⵏ'}, items:[
        {id:'kds1',names:{fr:'Baklava',en:'Baklava',ar:'بقلاوة',amz:'ⴱⵇⵍⴰⵡⴰ'},price:25,photo:'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&q=80'},
        {id:'kds2',names:{fr:'Cornes de Gazelle',en:'Gazelle Horns',ar:'قرون الغزال',amz:'ⵜⵉⴼⵉⵔⴰⵙ ⵏ ⴰⵖⵢⵓⵍ'},price:20,photo:'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&q=80'},
      ]},
      { id:'drinks', emoji:'🥤', names:{fr:'Boissons',en:'Drinks',ar:'مشروبات',amz:'ⴰⵙⵡ'}, items:[
        {id:'kdr1',names:{fr:'Soda',en:'Soda',ar:'صودا',amz:'ⵙⵓⴷⴰ'},price:10,photo:'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80',options:[OPT.drinkFlavor(),OPT.drinkSize()]},
        {id:'kdr2',names:{fr:'Jus Frais',en:'Fresh Juice',ar:'عصير طازج',amz:'ⵜⴰⵎⵓⵖⵓⵏⵜ'},price:15,photo:'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80'},
        {id:'kdr3',names:{fr:'Eau',en:'Water',ar:'ماء',amz:'ⴰⵎⴰⵏ'},price:5,photo:'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80'},
      ]},
    ],
  },
  {
    id:'burger-corner',
    name:'Burger Corner Safi',
    tagline:{fr:'Burgers XXL & milkshakes gourmands',en:'XXL burgers & indulgent milkshakes',ar:'برغر XXL وميلكشيك شهي',amz:'ⴱⵓⵔⴳⵔ XXL ⴷ ⵎⵉⵍⴽⵛⵉⴽ'},
    logo:'🍔', cover:'https://images.unsplash.com/photo-1550547660-d9450f859349?w=700&q=80',
    cuisine:{fr:'Burgers · Américain · Fast Food',en:'Burgers · American · Fast Food',ar:'برغر · أمريكي',amz:'ⴱⵓⵔⴳⵔ · ⴰⵎⵉⵔⵉⴽⴰⵏⵉ'},
    tags:['burger','fast-food'],
    rating:4.6, deliveryTime:'20–30', minOrder:35,
    categories:[
      { id:'appetizers', emoji:'🥗', names:{fr:'Entrées',en:'Appetizers',ar:'مقبلات',amz:'ⵉⴼⵔⴰⵏ'}, items:[
        {id:'bap1',names:{fr:'Nuggets de Poulet (6 pcs)',en:'Chicken Nuggets (6 pcs)',ar:'نجتس دجاج (6 قطع)',amz:'ⵏⴳⵜⵙ ⵏ ⴰⵢⵢⵓⵣ'},price:25,photo:'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80'},
        {id:'bap2',names:{fr:'Onion Rings',en:'Onion Rings',ar:'حلقات البصل',amz:'ⵜⵉⴱⵙⵍⵉⵏ'},price:20,photo:'https://images.unsplash.com/photo-1576107232684-1279f55e14cf?w=400&q=80'},
        {id:'bap3',names:{fr:'Frites Maison',en:'Homemade Fries',ar:'بطاطس مقلية',amz:'ⴱⵓⵍⵉⵢⵢⴰ'},price:15,photo:'https://images.unsplash.com/photo-1576107232684-1279f55e14cf?w=400&q=80'},
      ]},
      { id:'burgers', emoji:'🍔', names:{fr:'Burgers',en:'Burgers',ar:'برغر',amz:'ⴱⵓⵔⴳⵔ'}, items:[
        {id:'bg1',names:{fr:'Bridge Spécial',en:'Bridge Special',ar:'برغر بريدج الخاص',amz:'ⴱⵓⵔⴳⵔ ⴱⵔⵉⴷⵊ'},price:55,photo:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',options:[OPT.burgerCooking(),OPT.burgerExtras(),OPT.burgerSauce()]},
        {id:'bg2',names:{fr:'Double Fromage',en:'Double Cheeseburger',ar:'برغر بجبن مزدوج',amz:'ⴱⵓⵔⴳⵔ ⵙⵉⵏ ⵉⴼⵔⵓⵎⴰⵊⵏ'},price:65,photo:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',options:[OPT.burgerCooking(),OPT.burgerExtras(),OPT.burgerSauce()]},
        {id:'bg3',names:{fr:'Chicken Burger Chermoula',en:'Chermoula Chicken Burger',ar:'برغر دجاج شرمولة',amz:'ⴱⵓⵔⴳⵔ ⵏ ⴰⵢⵢⵓⵣ ⵛⵔⵎⵓⵍⴰ'},price:50,photo:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',options:[OPT.burgerCooking(),OPT.burgerExtras(),OPT.burgerSauce()]},
        {id:'bg4',names:{fr:'Burger Kefta Marocain',en:'Moroccan Kefta Burger',ar:'برغر الكفتة المغربية',amz:'ⴱⵓⵔⴳⵔ ⵏ ⴽⴼⵜⴰ'},price:55,photo:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',options:[OPT.burgerCooking(),OPT.burgerExtras(),OPT.burgerSauce()]},
        {id:'bg5',names:{fr:'Végétarien Délice',en:'Veggie Burger',ar:'برغر نباتي',amz:'ⴱⵓⵔⴳⵔ ⵏ ⵉⴷⴳⴰⵏ'},price:45,photo:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',options:[OPT.burgerCooking(),OPT.burgerExtras(),OPT.burgerSauce()]},
      ]},
      { id:'salads', emoji:'🥗', names:{fr:'Salades',en:'Salads',ar:'سلطات',amz:'ⵜⵓⴼⴽⵉⵡⵉⵏ'}, items:[
        {id:'bsl1',names:{fr:'Salade César',en:'Caesar Salad',ar:'سلطة سيزر',amz:'ⵙⵉⵣⴰⵔ'},price:30,photo:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80'},
        {id:'bsl2',names:{fr:'Coleslaw Maison',en:'Homemade Coleslaw',ar:'كول سلو منزلي',amz:'ⴽⵓⵍⵙⵍⵓ'},price:20,photo:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80'},
      ]},
      { id:'desserts', emoji:'🍰', names:{fr:'Desserts',en:'Desserts',ar:'حلويات',amz:'ⵉⵎⴰⴳⴰⵏ'}, items:[
        {id:'bds1',names:{fr:'Milkshake (Vanille/Choco/Fraise)',en:'Milkshake (Vanilla/Choco/Strawberry)',ar:'ميلكشيك (فانيلا/شوكولا/فراولة)',amz:'ⵎⵉⵍⴽⵛⵉⴽ'},price:30,photo:'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80'},
        {id:'bds2',names:{fr:'Sundae Glacé',en:'Ice Cream Sundae',ar:'سانديه بوظة',amz:'ⵙⴰⵏⴷⵉ'},price:25,photo:'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&q=80'},
      ]},
      { id:'drinks', emoji:'🥤', names:{fr:'Boissons',en:'Drinks',ar:'مشروبات',amz:'ⴰⵙⵡ'}, items:[
        {id:'bdr1',names:{fr:'Soda',en:'Soda',ar:'صودا',amz:'ⵙⵓⴷⴰ'},price:10,photo:'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80',options:[OPT.drinkFlavor(),OPT.drinkSize()]},
        {id:'bdr2',names:{fr:'Jus Pressé',en:'Fresh Juice',ar:'عصير طازج',amz:'ⵜⴰⵎⵓⵖⵓⵏⵜ'},price:15,photo:'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80'},
        {id:'bdr3',names:{fr:'Eau Minérale',en:'Water',ar:'ماء معدني',amz:'ⴰⵎⴰⵏ'},price:5,photo:'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80'},
      ]},
    ],
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function fontClass(lang: Lang) {
  if (lang==='amz') return 'font-tifinagh';
  if (lang==='ar')  return 'font-arabic';
  return '';
}
function GoldDivider() {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px" style={{background:'#E5E1D8'}}/>
      <div className="w-3 h-3 rotate-45 flex-shrink-0" style={{background:'#D9C5A0'}}/>
      <div className="flex-1 h-px" style={{background:'#E5E1D8'}}/>
    </div>
  );
}
function Field({label,value,onChange,placeholder,type='text',lang,error}:{label:string;value:string;onChange:(v:string)=>void;placeholder:string;type?:string;lang:Lang;error?:boolean}) {
  const fClass=fontClass(lang);
  return (
    <div className="mb-4">
      <label className={`block text-xs font-black mb-1.5 ${fClass}`} style={{color:'#065F46'}}>{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all ${fClass}`}
        style={{background:error?'#FEF2F2':'#F9F7F2',border:`2px solid ${error?'#FCA5A5':'#E5E1D8'}`,color:'#1A2F23'}}
        onFocus={e=>{e.currentTarget.style.borderColor='#065F46';}}
        onBlur={e=>{e.currentTarget.style.borderColor=error?'#FCA5A5':'#E5E1D8';}}/>
    </div>
  );
}

// ─── ADDRESS AUTOCOMPLETE (Photon / OSM) ──────────────────────────────────────

function AddressAutocomplete({label,value,onChange,placeholder,lang,error}:{
  label:string; value:string; onChange:(v:string)=>void;
  placeholder:string; lang:Lang; error?:boolean;
}) {
  const fClass=fontClass(lang);
  const [suggestions,setSuggestions]=useState<string[]>([]);
  const [open,setOpen]=useState(false);
  const [loading,setLoading]=useState(false);
  const timerRef=useRef<ReturnType<typeof setTimeout>|null>(null);
  const wrapRef=useRef<HTMLDivElement>(null);

  useEffect(()=>{
    const h=(e:MouseEvent)=>{if(wrapRef.current&&!wrapRef.current.contains(e.target as Node))setOpen(false);};
    document.addEventListener('mousedown',h);
    return()=>document.removeEventListener('mousedown',h);
  },[]);

  const fetchSuggestions=(q:string)=>{
    if(q.length<2){setSuggestions([]);setOpen(false);return;}
    if(timerRef.current)clearTimeout(timerRef.current);
    timerRef.current=setTimeout(async()=>{
      setLoading(true);
      try{
        // Nominatim — filtré strictement sur Maroc (countrycodes=ma) + boîte Safi (bounded=1)
        const url=`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q+' Safi')}&format=json&countrycodes=ma&viewbox=-9.35,32.42,-9.10,32.15&bounded=1&limit=6&addressdetails=1&accept-language=fr`;
        const res=await fetch(url,{headers:{'Accept-Language':'fr'}});
        const data:any[]=await res.json();
        const items=data.map((f:any)=>{
          const a=f.address||{};
          const parts=[
            a.road||a.pedestrian||a.footway||'',
            a.house_number||'',
            a.suburb||a.quarter||a.neighbourhood||'',
            a.city||a.town||a.village||'Safi',
          ].filter(Boolean);
          return parts.join(', ');
        }).filter(Boolean);
        const unique=[...new Set(items)];
        setSuggestions(unique);
        setOpen(unique.length>0);
      }catch{setSuggestions([]);}
      finally{setLoading(false);}
    },400);
  };

  return(
    <div className="mb-4 relative" ref={wrapRef}>
      <label className={`block text-xs font-black mb-1.5 ${fClass}`} style={{color:'#065F46'}}>{label}</label>
      <div className="relative">
        <input type="text" value={value} autoComplete="off"
          onChange={e=>{onChange(e.target.value);fetchSuggestions(e.target.value);}}
          placeholder={placeholder}
          className={`w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all ${fClass}`}
          style={{background:error?'#FEF2F2':'#F9F7F2',border:`2px solid ${error?'#FCA5A5':'#E5E1D8'}`,color:'#1A2F23',paddingRight:'40px'}}
          onFocus={e=>{e.currentTarget.style.borderColor='#065F46';}}
          onBlur={e=>{e.currentTarget.style.borderColor=error?'#FCA5A5':'#E5E1D8';}}/>
        {loading
          ?<div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 animate-spin" style={{borderColor:'#065F46',borderTopColor:'transparent'}}/>
          :value&&<button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-base leading-none"
              onClick={()=>{onChange('');setSuggestions([]);setOpen(false);}}>✕</button>
        }
      </div>
      {open&&suggestions.length>0&&(
        <div className="absolute z-[200] w-full mt-1 rounded-xl overflow-hidden"
          style={{background:'#FDFCF9',border:'1.5px solid #E5E1D8',boxShadow:'0 8px 28px rgba(0,0,0,0.13)'}}>
          {suggestions.map((s,i)=>(
            <button key={i} type="button"
              className={`w-full text-left px-4 py-3 text-xs font-medium transition-colors active:bg-green-50 hover:bg-green-50 ${fClass}`}
              style={{color:'#1A2F23',borderBottom:i<suggestions.length-1?'1px solid #F3F4F6':'none'}}
              onMouseDown={()=>{onChange(s);setOpen(false);setSuggestions([]);}}>
              <span className="mr-1.5" style={{color:'#065F46'}}>📍</span>{s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── RESTAURANT CARD (Home) ───────────────────────────────────────────────────

function RestaurantCard({r,lang,t,onClick,compact=false}:{r:Restaurant;lang:Lang;t:typeof T.fr;onClick:()=>void;compact?:boolean}) {
  const fClass=fontClass(lang);
  const isFeatured = r.id === 'mcdonalds-safi';
  if(compact){
    return(
      <button onClick={onClick}
        className="w-full text-left rounded-2xl overflow-hidden transition-all active:scale-95"
        style={{background:'#FDFCF9',border:`1.5px solid ${isFeatured?'#D9C5A0':'#E5E1D8'}`,boxShadow:'0 4px 14px rgba(0,0,0,0.08)'}}>
        <div className="relative h-28 overflow-hidden">
          <img src={r.cover} alt={r.name} className="w-full h-full object-cover" loading="lazy"/>
          <div className="absolute inset-0" style={{background:'linear-gradient(to top,rgba(4,55,38,0.9) 0%,rgba(4,55,38,0.05) 60%,transparent 100%)'}}/>
          <div className="absolute top-2 left-2 w-8 h-8 rounded-xl flex items-center justify-center text-lg"
            style={{background:'rgba(253,252,249,0.95)',backdropFilter:'blur(8px)',boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>
            {r.logo}
          </div>
          {isFeatured&&(
            <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full" style={{background:'#D9C5A0'}}>
              <span className="text-[9px]">⭐</span>
              <span className="text-[9px] font-black" style={{color:'#065F46'}}>#1</span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2">
            <h3 className={`font-black text-white text-xs leading-tight mb-0.5 ${fClass}`}>{r.name}</h3>
            <p className={`text-white/65 text-[10px] leading-tight line-clamp-1 ${fClass}`}>{r.tagline[lang]}</p>
          </div>
        </div>
        <div className="px-2.5 py-2 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-yellow-400 text-xs">★</span>
            <span className="text-[10px] font-black" style={{color:'#1A2F23'}}>{r.rating}</span>
            <div className="w-0.5 h-0.5 rounded-full mx-0.5" style={{background:'#D9C5A0'}}/>
            <span className="text-[10px]" style={{color:'#6B7280'}}>⏱{r.deliveryTime}{t.delivMin}</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full flex-shrink-0" style={{background:'#F0FDF4'}}>
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"/>
            <span className="text-[9px] font-black" style={{color:'#065F46'}}>{t.openNow}</span>
          </div>
        </div>
      </button>
    );
  }
  return (
    <button onClick={onClick}
      className="w-full text-left rounded-3xl overflow-hidden transition-all active:scale-95 hover:shadow-2xl"
      style={{background:'#FDFCF9',border:`1.5px solid ${isFeatured?'#D9C5A0':'#E5E1D8'}`,boxShadow:isFeatured?'0 6px 24px rgba(217,197,160,0.35)':'0 4px 16px rgba(0,0,0,0.07)'}}>
      <div className="relative h-44 overflow-hidden">
        <img src={r.cover} alt={r.name} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" loading="lazy"/>
        <div className="absolute inset-0" style={{background:'linear-gradient(to top,rgba(4,55,38,0.85) 0%,rgba(4,55,38,0.1) 55%,transparent 100%)'}}/>
        <div className="absolute top-3 left-3 w-12 h-12 rounded-2xl flex items-center justify-center text-3xl"
          style={{background:'rgba(253,252,249,0.95)',backdropFilter:'blur(8px)',boxShadow:'0 4px 12px rgba(0,0,0,0.15)'}}>
          {r.logo}
        </div>
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          {isFeatured&&(
            <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{background:'#D9C5A0'}}>
              <span className="text-[10px]">⭐</span>
              <span className="text-[10px] font-black" style={{color:'#065F46'}}>Safi #1</span>
            </div>
          )}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full"
            style={{background:'rgba(253,252,249,0.95)',backdropFilter:'blur(8px)'}}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
            <span className="text-[10px] font-black" style={{color:'#065F46'}}>{t.openNow}</span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-black text-white text-base leading-tight mb-0.5">{r.name}</h3>
          <p className={`text-white/70 text-xs ${fClass}`}>{r.tagline[lang]}</p>
        </div>
      </div>
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-yellow-400 text-sm">★</span>
            <span className="text-xs font-black" style={{color:'#1A2F23'}}>{r.rating}</span>
          </div>
          <div className="w-1 h-1 rounded-full" style={{background:'#D9C5A0'}}/>
          <span className="text-xs" style={{color:'#6B7280'}}>⏱ {r.deliveryTime} {t.delivMin}</span>
          <div className="w-1 h-1 rounded-full" style={{background:'#D9C5A0'}}/>
          <span className="text-xs" style={{color:'#6B7280'}}>{t.minOrder} {r.minOrder} MAD</span>
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background:'#F0FDF4'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>
    </button>
  );
}

// ─── ITEM OPTIONS MODAL ───────────────────────────────────────────────────────

function ItemOptionsModal({item,lang,t,onClose,onAdd}:{
  item:MenuItem; lang:Lang; t:typeof T.fr;
  onClose:()=>void; onAdd:(selected:Record<string,string[]>,extra:number)=>void;
}) {
  const fClass=fontClass(lang); const isAR=lang==='ar';
  const [selected,setSelected]=useState<Record<string,string[]>>({});
  const [errors,setErrors]=useState<Set<string>>(new Set());

  const toggle=(groupId:string,choiceId:string,type:'radio'|'checkbox')=>{
    setSelected(prev=>{
      const cur=prev[groupId]||[];
      if(type==='radio') return {...prev,[groupId]:[choiceId]};
      const next=cur.includes(choiceId)?cur.filter(x=>x!==choiceId):[...cur,choiceId];
      return {...prev,[groupId]:next};
    });
    setErrors(e=>{const n=new Set(e);n.delete(groupId);return n;});
  };

  const extraPrice=()=>{
    if(!item.options) return 0;
    return item.options.reduce((sum,g)=>{
      const sel=selected[g.id]||[];
      return sum+g.choices.filter(c=>sel.includes(c.id)).reduce((s,c)=>s+c.price,0);
    },0);
  };

  const handleAdd=()=>{
    const missing=new Set<string>();
    (item.options||[]).forEach(g=>{if(g.required&&(!selected[g.id]||selected[g.id].length===0))missing.add(g.id);});
    if(missing.size>0){setErrors(missing);return;}
    onAdd(selected,extraPrice());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end modal-overlay" style={{background:'rgba(10,30,20,0.65)',backdropFilter:'blur(6px)'}} onClick={onClose}>
      <div className="w-full max-w-md mx-auto rounded-t-3xl modal-sheet" style={{background:'#FDFCF9',maxHeight:'90vh',display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
        {/* Item header */}
        <div className="relative h-44 rounded-t-3xl overflow-hidden flex-shrink-0">
          <img src={item.photo} alt={item.names[lang]} className="w-full h-full object-cover"/>
          <div className="absolute inset-0" style={{background:'linear-gradient(to top,rgba(4,55,38,0.8) 0%,transparent 55%)'}}/>
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full" style={{background:'rgba(255,255,255,0.4)'}}/>
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center font-black" style={{background:'rgba(253,252,249,0.9)',color:'#6B7280',fontSize:16}}>✕</button>
          {item.safi&&<span className="absolute top-4 left-4 text-[9px] font-black px-2 py-1 rounded-full" style={{background:'#D9C5A0',color:'#065F46'}}>★ Safi</span>}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className={`font-black text-white text-lg leading-tight ${fClass}`}>{item.names[lang]}</p>
            <p className="text-white/80 font-black text-sm">{item.price} MAD</p>
          </div>
        </div>

        {/* Options */}
        <div className="flex-1 overflow-y-auto px-5 py-4" style={{direction:isAR?'rtl':'ltr'}}>
          {(!item.options||item.options.length===0)?(
            <div className="py-4 text-center">
              <p className={`text-sm font-bold ${fClass}`} style={{color:'#9CA3AF'}}>{t.customize}</p>
            </div>
          ):item.options.map(group=>(
            <div key={group.id} className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <p className={`font-black text-sm ${fClass}`} style={{color:'#065F46'}}>{group.names[lang]}</p>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${fClass}`}
                  style={{background:group.required?'#FEF3C7':'#F0FDF4',color:group.required?'#B45309':'#065F46'}}>
                  {group.required?t.required:t.optional}
                </span>
              </div>
              {errors.has(group.id)&&(
                <p className="text-[10px] font-bold mb-2" style={{color:'#DC2626'}}>⚠ {t.fillAll}</p>
              )}
              <div className="grid gap-2">
                {group.choices.map(choice=>{
                  const sel=(selected[group.id]||[]).includes(choice.id);
                  return (
                    <button key={choice.id} onClick={()=>toggle(group.id,choice.id,group.type)}
                      className="flex items-center gap-3 p-3 rounded-xl transition-all text-left"
                      style={{background:sel?'#F0FDF4':'#F9F7F2',border:`1.5px solid ${errors.has(group.id)?'#FCA5A5':sel?'#065F46':'#E5E1D8'}`}}>
                      <div className={`flex-shrink-0 flex items-center justify-center transition-all ${group.type==='radio'?'w-5 h-5 rounded-full':'w-5 h-5 rounded-md'}`}
                        style={{border:`2px solid ${sel?'#065F46':'#D1D5DB'}`,background:sel?'#065F46':'transparent'}}>
                        {sel&&<div className={`bg-white ${group.type==='radio'?'w-2 h-2 rounded-full':'w-2.5 h-2.5 rounded-sm'} flex items-center justify-center`}>
                          {group.type==='checkbox'&&<svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="#065F46" strokeWidth="2.5"><path d="M1 6l4 4 6-8"/></svg>}
                        </div>}
                      </div>
                      <span className={`flex-1 text-sm font-bold ${fClass}`} style={{color:sel?'#065F46':'#1A2F23'}}>{choice.names[lang]}</span>
                      {choice.price>0&&<span className="text-xs font-black flex-shrink-0" style={{color:'#B45309'}}>+{choice.price}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Add button */}
        <div className="px-5 py-4 flex-shrink-0" style={{borderTop:'1px solid #E5E1D8'}}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm font-black ${fClass}`} style={{color:'#6B7280'}}>{t.totalLabel}</span>
            <span className="text-xl font-black" style={{color:'#065F46'}}>{item.price+extraPrice()} MAD</span>
          </div>
          <button onClick={handleAdd}
            className={`w-full py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-95 ${fClass}`}
            style={{background:'linear-gradient(135deg,#4F46E5,#6366F1)',boxShadow:'0 6px 20px rgba(79,70,229,0.35)'}}>
            {t.addWithOptions} · {item.price+extraPrice()} MAD
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── RESTAURANT PAGE ──────────────────────────────────────────────────────────

function RestaurantPage({restaurant,lang,t,onBack,onAddToCart}:{
  restaurant:Restaurant; lang:Lang; t:typeof T.fr;
  onBack:()=>void; onAddToCart:(ci:CartItem)=>void;
}) {
  const [activeCategory,setActiveCategory]=useState(restaurant.categories[0]?.id||'');
  const [optionsItem,setOptionsItem]=useState<MenuItem|null>(null);
  const fClass=fontClass(lang); const isAR=lang==='ar';

  const activeCat=restaurant.categories.find(c=>c.id===activeCategory);

  const handleAddItem=(item:MenuItem,selected:Record<string,string[]>,extra:number)=>{
    const cartItem:CartItem={
      cartId:`${item.id}-${Date.now()}`,
      restaurantId:restaurant.id,
      restaurantName:restaurant.name,
      item, qty:1,
      selectedOptions:selected,
      extraPrice:extra,
      totalPerUnit:item.price+extra,
    };
    onAddToCart(cartItem);
    setOptionsItem(null);
  };

  return (
    <div>
      {/* Restaurant hero */}
      <section className="relative mx-5 mb-5 rounded-3xl overflow-hidden" style={{boxShadow:'0 8px 32px rgba(0,0,0,0.12)'}}>
        <img src={restaurant.cover} alt={restaurant.name} className="w-full h-52 object-cover"/>
        <div className="absolute inset-0" style={{background:'linear-gradient(to top,rgba(4,55,38,0.9) 0%,rgba(4,55,38,0.2) 55%,transparent 100%)'}}/>
        <button onClick={onBack}
          className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-full font-black text-sm transition-all active:scale-90"
          style={{background:'rgba(253,252,249,0.92)',backdropFilter:'blur(8px)',color:'#065F46'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          {t.back}
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{background:'rgba(253,252,249,0.95)',backdropFilter:'blur(8px)'}}>
              {restaurant.logo}
            </div>
            <div>
              <h2 className="font-black text-white text-lg leading-tight">{restaurant.name}</h2>
              <p className={`text-white/70 text-xs ${fClass}`}>{restaurant.cuisine[lang]}</p>
            </div>
          </div>
          <div className="flex items-center gap-3" style={{direction:'ltr'}}>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{background:'rgba(253,252,249,0.15)'}}>
              <span className="text-yellow-400 text-xs">★</span>
              <span className="text-white text-xs font-black">{restaurant.rating}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{background:'rgba(253,252,249,0.15)'}}>
              <span className="text-white text-xs">⏱</span>
              <span className="text-white text-xs font-black">{restaurant.deliveryTime} min</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{background:'rgba(253,252,249,0.15)'}}>
              <span className="text-white text-xs font-black">{t.minOrder} {restaurant.minOrder} MAD</span>
            </div>
          </div>
        </div>
      </section>

      {/* Category tabs */}
      <div className="flex gap-2 px-5 mb-5 overflow-x-auto hide-scrollbar pb-1" style={{direction:isAR?'rtl':'ltr'}}>
        {restaurant.categories.map(cat=>{const active=activeCategory===cat.id; return(
          <button key={cat.id} onClick={()=>setActiveCategory(cat.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-black text-[11px] transition-all active:scale-95 ${fClass}`}
            style={{background:active?'#065F46':'#FDFCF9',color:active?'#FDFCF9':'#065F46',border:`2px solid ${active?'#065F46':'#D9C5A0'}`,boxShadow:active?'0 4px 14px rgba(6,95,70,0.25)':'none'}}>
            <span>{cat.emoji}</span><span>{cat.names[lang]}</span>
          </button>
        );})}
      </div>

      {/* Items grid */}
      {activeCat&&(
        <div className="px-5 grid grid-cols-2 gap-3 mb-6" style={{direction:isAR?'rtl':'ltr'}}>
          {activeCat.items.map(item=>(
            <button key={item.id} onClick={()=>setOptionsItem(item)}
              className="text-left rounded-2xl overflow-hidden transition-all active:scale-95 hover:shadow-xl"
              style={{background:'#FDFCF9',border:'1.5px solid #E5E1D8',boxShadow:'0 3px 12px rgba(0,0,0,0.07)'}}>
              <div className="relative h-28 overflow-hidden">
                <img src={item.photo} alt={item.names[lang]} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" loading="lazy"/>
                <div className="absolute inset-0" style={{background:'linear-gradient(to top,rgba(0,0,0,0.15) 0%,transparent 60%)'}}/>
                {item.safi&&<span className="absolute top-2 right-2 text-[8px] font-black px-1.5 py-0.5 rounded-full" style={{background:'#D9C5A0',color:'#065F46'}}>{t.safiExcl}</span>}
                {item.options&&item.options.length>0&&(
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{background:'rgba(79,70,229,0.9)'}}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" fill="white"/></svg>
                    <span className="text-white text-[8px] font-black">{t.customize}</span>
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className={`text-[11px] font-black leading-tight mb-2 line-clamp-2 ${fClass}`} style={{color:'#1A2F23'}}>{item.names[lang]}</p>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-black" style={{color:'#065F46'}}>{item.price} MAD</span>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-base" style={{background:'#4F46E5',flexShrink:0}}>+</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {optionsItem&&(
        <ItemOptionsModal item={optionsItem} lang={lang} t={t} onClose={()=>setOptionsItem(null)}
          onAdd={(sel,extra)=>handleAddItem(optionsItem,sel,extra)}/>
      )}
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────

const CUISINE_FILTERS = [
  {id:'all',    emoji:'⭐', label:{fr:'Tout',       en:'All',      ar:'الكل',    amz:'ⴽⵓⵍⵍ'}},
  {id:'burger', emoji:'🍔', label:{fr:'Burger',     en:'Burger',   ar:'برغر',    amz:'ⴱⵓⵔⴳⵔ'}},
  {id:'pizza',  emoji:'🍕', label:{fr:'Pizza',      en:'Pizza',    ar:'بيتزا',   amz:'ⴱⵉⵜⵣⴰ'}},
  {id:'kebab',  emoji:'🌯', label:{fr:'Kebab',      en:'Kebab',    ar:'كباب',    amz:'ⴽⴱⴰⴱ'}},
  {id:'tacos',  emoji:'🌮', label:{fr:'Tacos',      en:'Tacos',    ar:'تاكو',    amz:'ⵜⴰⴽⵓⵙ'}},
  {id:'seafood',emoji:'🦞', label:{fr:'Mer',        en:'Seafood',  ar:'بحريات',  amz:'ⵉⵙⴰⵙ'}},
  {id:'fast-food',emoji:'🍟',label:{fr:'Fast Food', en:'Fast Food',ar:'فاست فود',amz:'ⴼⴰⵙⵜ'}},
] as const;

type FilterId = typeof CUISINE_FILTERS[number]['id'];

function HomePage({lang,t,onSelectRestaurant}:{lang:Lang;t:typeof T.fr;onSelectRestaurant:(r:Restaurant)=>void}) {
  const fClass=fontClass(lang);
  const [activeFilter,setActiveFilter]=useState<FilterId>('all');

  const filtered = activeFilter==='all'
    ? RESTAURANTS
    : RESTAURANTS.filter(r=>r.tags.includes(activeFilter));

  return (
    <div>
      {/* Hero banner */}
      <section className="relative mx-5 mb-5 rounded-3xl overflow-hidden" style={{boxShadow:'0 8px 32px rgba(6,95,70,0.18)'}}>
        <img src="/hero.jpeg" alt="Bridge Safi" className="w-full h-52 object-cover"/>
        <div className="absolute inset-0" style={{background:'linear-gradient(to top,rgba(4,55,38,0.92) 0%,rgba(4,55,38,0.25) 60%,transparent 100%)'}}/>
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full inline-block mb-2" style={{background:'#D9C5A0',color:'#065F46'}}>SAFI · آسفي · ⵙⴰⴼⵉ</span>
          <h2 className={`text-xl font-black text-white leading-tight mb-1 ${fClass}`}>{t.restaurantsTitle}</h2>
          <p className="text-white/75 text-xs">{t.heroSub}</p>
        </div>
      </section>

      {/* Category filter chips */}
      <div className="mb-4" style={{overflowX:'auto',WebkitOverflowScrolling:'touch',scrollbarWidth:'none'}}>
        <div className="flex gap-2 px-4" style={{width:'max-content'}}>
          {CUISINE_FILTERS.map(f=>{
            const isActive=activeFilter===f.id;
            return (
              <button
                key={f.id}
                onClick={()=>setActiveFilter(f.id as FilterId)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 select-none ${fClass}`}
                style={isActive
                  ? {background:'#065F46',color:'#FDFCF9',boxShadow:'0 4px 14px rgba(6,95,70,0.35)',transform:'scale(1.06)'}
                  : {background:'#F0EDE6',color:'#374151',boxShadow:'0 2px 6px rgba(0,0,0,0.06)'}
                }
              >
                <span style={{fontSize:'15px',lineHeight:1}}>{f.emoji}</span>
                <span>{f.label[lang]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Near you label */}
      <div className="px-5 mb-3 flex items-center gap-2">
        <span className="text-base">📍</span>
        <p className={`text-[11px] font-black uppercase tracking-widest ${fClass}`} style={{color:'#065F46'}}>{t.nearYou}</p>
        {activeFilter!=='all' && (
          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{background:'#D9C5A0',color:'#065F46'}}>
            {filtered.length} resto{filtered.length>1?'s':''}
          </span>
        )}
      </div>

      {/* Restaurant cards — 2-column grid, featured full-width */}
      {filtered.length===0
        ? (
          <div className="mx-5 py-10 flex flex-col items-center gap-3 rounded-2xl" style={{background:'#F0EDE6'}}>
            <span style={{fontSize:'40px'}}>🍽️</span>
            <p className={`text-sm font-semibold text-center ${fClass}`} style={{color:'#374151'}}>
              {lang==='fr'?'Aucun restaurant dans cette catégorie'
               :lang==='en'?'No restaurants in this category'
               :lang==='ar'?'لا يوجد مطعم في هذه الفئة'
               :'ⵓⵔ ⵍⵍⵉ ⵉⵎⵟⵟⴰⵡⵏ'}
            </p>
          </div>
        )
        : (
          <div className="px-4 grid grid-cols-2 gap-3 mb-6">
            {filtered.map(r=>{
              const isFeatured=r.id==='mcdonalds-safi' && activeFilter==='all';
              return(
                <div key={r.id} className={isFeatured?'col-span-2':''}>
                  <RestaurantCard r={r} lang={lang} t={t} onClick={()=>onSelectRestaurant(r)} compact={!isFeatured}/>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}

// ─── PROFILE MODAL ────────────────────────────────────────────────────────────

function ProfileModal({lang,profile,onSave,onClose}:{lang:Lang;profile:UserProfile;onSave:(p:UserProfile)=>void;onClose:()=>void}) {
  const t=T[lang]; const fClass=fontClass(lang); const isAR=lang==='ar';
  const [form,setForm]=useState<UserProfile>({...profile});
  const [saved,setSaved]=useState(false);
  const { signOut } = useClerk();
  const [, navigate] = useLocation();

  const handleSave=()=>{onSave(form);setSaved(true);setTimeout(()=>setSaved(false),2000);};
  const handleSignOut=async()=>{ await signOut(); navigate('/sign-in'); onClose(); };
  const set=(k:keyof UserProfile)=>(v:string)=>setForm(f=>({...f,[k]:v}));
  const fmtCard=(v:string)=>v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
  const fmtExp=(v:string)=>{const d=v.replace(/\D/g,'').slice(0,4);return d.length>2?`${d.slice(0,2)}/${d.slice(2)}`:d;};

  return (
    <div className="fixed inset-0 z-50 modal-overlay" style={{background:'rgba(10,30,20,0.55)',backdropFilter:'blur(6px)'}} onClick={onClose}>
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm h-full overflow-y-auto"
        style={{background:'#FDFCF9',boxShadow:'-8px 0 40px rgba(0,0,0,0.15)',animation:'slideInRight 0.28s cubic-bezier(0.34,1,0.64,1)'}} onClick={e=>e.stopPropagation()}>
        <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between" style={{background:'rgba(253,252,249,0.96)',backdropFilter:'blur(12px)',borderBottom:'1px solid #E5E1D8'}}>
          <div>
            <p className={`font-black text-base ${fClass}`} style={{color:'#065F46'}}>👤 {t.profileTitle}</p>
            <p className={`text-[10px] mt-0.5 ${fClass}`} style={{color:'#9CA3AF'}}>{t.profileSub}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center font-black" style={{background:'#F3F4F6',color:'#6B7280',fontSize:16}}>✕</button>
        </div>
        <div className="px-5 py-5" style={{direction:isAR?'rtl':'ltr'}}>
          <div className="rounded-2xl p-4 mb-5" style={{background:'#F0FDF4',border:'1px solid #BBF7D0'}}>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${fClass}`} style={{color:'#065F46'}}>👤 {t.nameLabel}</p>
            <Field label={t.nameLabel} value={form.name} onChange={set('name')} placeholder={t.namePh} lang={lang}/>
            <Field label={t.addrLabel} value={form.address} onChange={set('address')} placeholder={t.addrPh} lang={lang}/>
            <Field label={t.phoneLabel} value={form.phone} onChange={set('phone')} placeholder={t.phonePh} type="tel" lang={lang}/>
          </div>
          <div className="rounded-2xl p-4 mb-5" style={{background:'#EEF2FF',border:'1px solid #C7D2FE'}}>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${fClass}`} style={{color:'#4F46E5'}}>💳 {t.savedPayment}</p>
            {form.cardNumber&&(
              <div className="rounded-2xl p-4 mb-4 relative overflow-hidden" style={{background:'linear-gradient(135deg,#065F46,#047857)',minHeight:100}}>
                <div className="absolute inset-0 opacity-10" style={{backgroundImage:'repeating-linear-gradient(45deg,white 0,white 1px,transparent 0,transparent 50%)',backgroundSize:'8px 8px'}}/>
                <p className="text-white/60 text-[10px] font-bold mb-2">💳 BRIDGE EATS</p>
                <p className="text-white font-black text-base tracking-widest mb-2">{fmtCard(form.cardNumber)||'•••• •••• •••• ••••'}</p>
                <div className="flex justify-between items-end">
                  <div><p className="text-white/50 text-[9px]">NAME</p><p className="text-white text-xs font-bold">{form.cardName||'—'}</p></div>
                  <div className="text-right"><p className="text-white/50 text-[9px]">EXPIRES</p><p className="text-white text-xs font-bold">{form.cardExpiry||'—'}</p></div>
                </div>
              </div>
            )}
            <Field label={t.cardNumberLabel} value={fmtCard(form.cardNumber)} onChange={v=>set('cardNumber')(v.replace(/\s/g,''))} placeholder={t.cardNumberPh} type="tel" lang={lang}/>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t.cardExpiryLabel} value={form.cardExpiry} onChange={v=>set('cardExpiry')(fmtExp(v))} placeholder={t.cardExpiryPh} type="tel" lang={lang}/>
              <Field label={t.cardCVVLabel} value={form.cardNumber?'•••':''} onChange={()=>{}} placeholder={t.cardCVVPh} type="password" lang={lang}/>
            </div>
            <Field label={t.cardNameLabel} value={form.cardName} onChange={v=>set('cardName')(v.toUpperCase())} placeholder={t.cardNamePh} lang={lang}/>
          </div>
          <button onClick={handleSave}
            className={`w-full py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-95 ${fClass}`}
            style={{background:saved?'#059669':'linear-gradient(135deg,#065F46,#047857)',boxShadow:'0 6px 20px rgba(6,95,70,0.3)'}}>
            {saved?t.profileSaved:t.profileSave}
          </button>
          <button onClick={handleSignOut}
            className={`w-full py-3.5 mt-3 rounded-2xl font-black text-sm transition-all active:scale-95 ${fClass}`}
            style={{background:'#FEF2F2',color:'#DC2626',border:'1.5px solid #FECACA'}}>
            {t.signOut}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CHECKOUT DRAWER ──────────────────────────────────────────────────────────

type CheckoutStep='cart'|'form'|'payment'|'card'|'success';

function CheckoutDrawer({cart,lang,onClose,onQty,profile,onClearCart,restaurantName}:{
  cart:CartItem[]; lang:Lang; onClose:()=>void;
  onQty:(cartId:string,delta:number)=>void;
  profile:UserProfile; onClearCart:()=>void; restaurantName?:string;
}) {
  const { isSignedIn } = useUser();
  const [, navigate] = useLocation();
  const t=T[lang]; const isAR=lang==='ar'; const fClass=fontClass(lang);
  const [delivMode,setDelivMode]=useState<'delivery'|'collect'>('delivery');
  const baseTotal=cart.reduce((s,i)=>s+i.totalPerUnit*i.qty,0);
  const total=baseTotal+(delivMode==='collect'?2.99:0);
  const [step,setStep]=useState<CheckoutStep>('cart');
  const [name,setName]=useState(profile.name);
  const [addr,setAddr]=useState(profile.address);
  const [phone,setPhone]=useState(profile.phone);
  const [err,setErr]=useState('');
  const [gpsCoords,setGpsCoords]=useState('');
  const [mapPin,setMapPin]=useState<[number,number]|null>(null);
  const [outsideZone,setOutsideZone]=useState(false);
  const [payMethod,setPayMethod]=useState<'cash'|'card'|null>(null);
  const [cardNum,setCardNum]=useState('');
  const [cardExp,setCardExp]=useState(profile.cardExpiry);
  const [cardCVV,setCardCVV]=useState('');
  const [cardName,setCardName]=useState(profile.cardName);
  const [orderRef]=useState(`BE-${Math.floor(1000+Math.random()*9000)}`);
  const [cardErr,setCardErr]=useState('');

  const autoFilled=!!(profile.name||profile.address||profile.phone);

  const sendOrderToAPI=async(paymentMethod:string)=>{
    try{
      const items=cart.map(i=>({name:i.item.names['fr'],qty:i.qty,price:i.totalPerUnit,options:Object.entries(i.selectedOptions).flatMap(([,ids])=>ids)}));
      await fetch('/api/orders',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          ref:orderRef,
          service:'delivery',
          customerName:name.trim(),
          customerPhone:phone.trim(),
          customerAddress:delivMode==='collect'?`Click & Collect — ${addr.trim()||'Plateau, Safi'}`:addr.trim(),
          items,
          total:Math.round(total*100)/100,
          deliveryMode:delivMode,
          paymentMethod,
          restaurantName:restaurantName||null,
        }),
      });
    }catch(_){/* silent */}
  };

  // Envoie la commande directement au site livreur Bridge Logistique
  const sendOrderToDriverApp=async(paymentMethod:string)=>{
    try{
      const itemsList=cart.map(i=>{
        const opts=Object.entries(i.selectedOptions).flatMap(([,ids])=>ids);
        return `${i.item.names['fr']} x${i.qty}${opts.length>0?` (${opts.join(', ')})`:''}`;
      }).join(' | ');
      const payLabel=paymentMethod==='cash'?'Espèces à la livraison':'Carte bancaire (payé)';
      const navLink=gpsCoords
        ?` | GPS: https://maps.google.com/?q=${gpsCoords}`
        :addr.trim()?` | Maps: https://maps.google.com/?q=${encodeURIComponent(addr.trim()+', Safi, Maroc')}`:'';
      const notes=`🛒 ${itemsList}\n💰 Total: ${total} MAD\n💳 ${payLabel}${navLink}`;
      const r=await fetch(`${DRIVER_APP_URL}/api/deliveries`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          trackingNumber:orderRef,
          customerName:name.trim(),
          customerPhone:phone.trim(),
          pickupAddress:restaurantName?`${restaurantName} — Safi`:"McDonald's Safi",
          deliveryAddress:delivMode==='collect'
            ?`Click & Collect — Retrait au restaurant${addr.trim()?` (${addr.trim()})`:''}`
            :`${addr.trim()}, Safi, Maroc`,
          priority:'normal',
          notes,
        }),
      });
      if(!r.ok) console.warn('[Bridge→Livreur] non-OK',r.status,await r.text().catch(()=>''));
    }catch(e){console.warn('[Bridge→Livreur] envoi échoué',e);}
  };

  const fmtCard=(v:string)=>v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
  const fmtExp=(v:string)=>{const d=v.replace(/\D/g,'').slice(0,4);return d.length>2?`${d.slice(0,2)}/${d.slice(2)}`:d;};

  const STEP_BACK:Partial<Record<CheckoutStep,CheckoutStep>>={form:'cart',payment:'form',card:'payment'};

  return (
    <div className="fixed inset-0 z-50 flex items-end modal-overlay" style={{background:'rgba(10,30,20,0.6)',backdropFilter:'blur(4px)'}} onClick={step==='success'?undefined:onClose}>
      <div className="w-full max-w-md mx-auto rounded-t-3xl modal-sheet" style={{background:'#FDFCF9',maxHeight:'92vh',display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 flex items-center gap-3 flex-shrink-0" style={{borderBottom:'1px solid #E5E1D8'}}>
          {step!=='cart'&&step!=='success'&&(
            <button onClick={()=>setStep(STEP_BACK[step]!)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{background:'#F3F4F6',color:'#065F46',fontSize:14,fontWeight:900}}>←</button>
          )}
          <p className={`font-black text-sm flex-1 ${fClass}`} style={{color:'#065F46'}}>
            {step==='cart'?`🛒 ${t.cartTitle}`:step==='form'?`📋 ${t.checkoutTitle}`:step==='payment'?`💳 ${t.payModeTitle}`:step==='card'?`🔒 ${t.cardFormTitle}`:`✅`}
          </p>
          {step!=='success'&&<button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{background:'#F3F4F6',color:'#6B7280',fontSize:16,fontWeight:900}}>✕</button>}
        </div>
        {/* Progress */}
        {step!=='success'&&(
          <div className="flex items-center justify-center gap-2 py-2 flex-shrink-0">
            {(['cart','form','payment'] as CheckoutStep[]).map((s,i)=>(
              <div key={s} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full transition-all" style={{background:['cart','form','payment','card','success'].indexOf(step)>=i?'#065F46':'#E5E1D8',transform:step===s?'scale(1.4)':'scale(1)'}}/>
                {i<2&&<div className="w-6 h-px" style={{background:'#E5E1D8'}}/>}
              </div>
            ))}
          </div>
        )}

        {/* CART */}
        {step==='cart'&&(
          <>
            <div className="flex-1 overflow-y-auto px-5 py-3" style={{direction:isAR?'rtl':'ltr'}}>
              {cart.length===0?(
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="text-6xl mb-3">🛒</span>
                  <p className={`text-sm font-bold ${fClass}`} style={{color:'#9CA3AF'}}>{t.cartEmpty}</p>
                </div>
              ):cart.map(ci=>(
                <div key={ci.cartId} className="py-3" style={{borderBottom:'1px solid #F3F4F6'}}>
                  <div className="flex items-center gap-3">
                    <img src={ci.item.photo} alt={ci.item.names[lang]} className="w-12 h-12 rounded-xl object-cover flex-shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-black truncate ${fClass}`} style={{color:'#1A2F23'}}>{ci.item.names[lang]}</p>
                      <p className="text-[10px]" style={{color:'#9CA3AF'}}>{ci.restaurantName}</p>
                      <p className="text-xs font-bold mt-0.5" style={{color:'#065F46'}}>{ci.totalPerUnit*ci.qty} MAD</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={()=>onQty(ci.cartId,-1)} className="w-7 h-7 rounded-full flex items-center justify-center font-black text-sm" style={{background:'#F3F4F6',color:'#6B7280'}}>−</button>
                      <span className="text-sm font-black w-4 text-center" style={{color:'#1A2F23'}}>{ci.qty}</span>
                      <button onClick={()=>onQty(ci.cartId,+1)} className="w-7 h-7 rounded-full flex items-center justify-center font-black text-sm text-white" style={{background:'#4F46E5'}}>+</button>
                    </div>
                  </div>
                  {/* Selected options summary */}
                  {Object.keys(ci.selectedOptions).length>0&&(
                    <div className="mt-1.5 ml-15 flex flex-wrap gap-1 pl-[60px]">
                      {Object.values(ci.selectedOptions).flat().map((id,i)=>(
                        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{background:'#F0FDF4',color:'#065F46',border:'1px solid #BBF7D0'}}>{id}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {cart.length>0&&(
              <div className="px-5 py-4 flex-shrink-0" style={{borderTop:'1px solid #E5E1D8'}}>
                <div className="flex justify-between items-center mb-4">
                  <span className={`font-black text-sm ${fClass}`} style={{color:'#6B7280'}}>{t.total}</span>
                  <span className="font-black text-xl" style={{color:'#065F46'}}>{total} MAD</span>
                </div>
                <button onClick={()=>{
                  if(!isSignedIn){onClose();navigate('/sign-in');}
                  else setStep('form');
                }} className={`w-full py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-95 ${fClass}`}
                  style={{background:'linear-gradient(135deg,#065F46,#047857)',boxShadow:'0 6px 20px rgba(6,95,70,0.3)'}}>
                  {isSignedIn ? `${t.checkout} →` : `🔒 Se connecter pour commander`}
                </button>
              </div>
            )}
          </>
        )}

        {/* FORM */}
        {step==='form'&&(
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4" style={{direction:isAR?'rtl':'ltr'}}>
              {/* Delivery mode selector */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {([
                  {key:'delivery'as const,label:t.delivOption,desc:t.delivOptionDesc,color:'#065F46',selBg:'#D1FAE5',bg:'#F0FDF4'},
                  {key:'collect'as const,label:t.collectOption,desc:t.collectOptionDesc,color:'#B45309',selBg:'#FEF3C7',bg:'#FFFBEB'},
                ]).map(opt=>(
                  <button key={opt.key} onClick={()=>{setDelivMode(opt.key);setErr('');if(opt.key==='collect'&&payMethod==='cash')setPayMethod(null);}}
                    className="flex flex-col items-start p-3 rounded-2xl text-left transition-all active:scale-95"
                    style={{background:delivMode===opt.key?opt.selBg:opt.bg,border:`2px solid ${delivMode===opt.key?opt.color:'#E5E1D8'}`}}>
                    <p className={`font-black text-xs leading-tight mb-0.5 ${fClass}`} style={{color:opt.color}}>{opt.label}</p>
                    <p className={`text-[10px] leading-tight ${fClass}`} style={{color:'#9CA3AF'}}>{opt.desc}</p>
                  </button>
                ))}
              </div>

              {/* Click & Collect info box */}
              {delivMode==='collect'&&(
                <div className="flex items-start gap-2 px-3 py-3 rounded-xl mb-4" style={{background:'#FEF3C7',border:'1px solid #FDE68A'}}>
                  <span className="text-lg flex-shrink-0">🏪</span>
                  <div>
                    <p className={`text-[11px] font-black mb-1 ${fClass}`} style={{color:'#B45309'}}>Click & Collect — +2.99 MAD</p>
                    <p className={`text-[10px] ${fClass}`} style={{color:'#92400E'}}>{t.collectAddress}</p>
                  </div>
                </div>
              )}

              {autoFilled&&(
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4" style={{background:'#F0FDF4',border:'1px solid #BBF7D0'}}>
                  <span>✨</span>
                  <p className={`text-[10px] font-bold ${fClass}`} style={{color:'#065F46'}}>{t.autoFilled}</p>
                </div>
              )}

              {/* Delivery map (hidden in collect mode) */}
              {delivMode==='delivery'&&(<>
                <p className={`text-[10px] font-black uppercase tracking-wider mb-2 ${fClass}`} style={{color:'#065F46'}}>
                  {lang==='ar'?'📍 اختر موقعك على الخريطة':lang==='amz'?'📍 ⵙⵜⵜⵉ ⵜⴰⵙⵓⵏⵜ ⵖ ⵓⵙⴽⴽⵉⵍ':'📍 Cliquez sur la carte pour épingler votre adresse'}
                </p>
                <DeliveryMap
                  pin={mapPin}
                  onSet={(coords,inside)=>{
                    const parts=coords.split(',');
                    setMapPin([parseFloat(parts[0]),parseFloat(parts[1])]);
                    setGpsCoords(coords);
                    setOutsideZone(!inside);
                  }}
                />
                {outsideZone&&mapPin&&(
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3" style={{background:'#FEF2F2',border:'1px solid #FECACA'}}>
                    <span>⚠️</span>
                    <p className={`text-[10px] font-bold ${fClass}`} style={{color:'#DC2626'}}>
                      {lang==='ar'?'هذه المنطقة خارج نطاق التوصيل. يمكنك اختيار الاستلام من المطعم.':lang==='amz'?'ⵜⴰⵙⵓⵏⵜ ⴰⴷ ⵓⵔ ⵜⵍⵍⵉ ⵖ ⵜⴰⵙⵓⵏⵜ ⵏ ⵓⵙⵙⵓⴼⵖ.':'Zone non couverte par la livraison. Vous pouvez choisir le Click & Collect.'}
                    </p>
                  </div>
                )}
                {mapPin&&!outsideZone&&(
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3" style={{background:'#F0FDF4',border:'1px solid #BBF7D0'}}>
                    <span>✅</span>
                    <p className={`text-[10px] font-bold ${fClass}`} style={{color:'#065F46'}}>
                      {lang==='ar'?'موقعك في منطقة التوصيل ✓':lang==='amz'?'ⵜⴰⵙⵓⵏⵜ ⵏⵏⴽ ⵖ ⵜⴰⵙⵓⵏⵜ ⵏ ⵓⵙⵙⵓⴼⵖ ✓':'Votre position est dans la zone de livraison ✓'}
                    </p>
                  </div>
                )}
              </>)}

              <Field label={t.nameLabel} value={name} onChange={v=>{setName(v);setErr('');}} placeholder={t.namePh} lang={lang} error={!!err&&!name.trim()}/>
              {delivMode==='delivery'&&(
                <AddressAutocomplete label={t.addrLabel} value={addr} onChange={v=>{setAddr(v);setErr('');}} placeholder={t.addrPh} lang={lang} error={!!err&&!addr.trim()}/>
              )}
              <Field label={t.phoneLabel} value={phone} onChange={v=>{setPhone(v);setErr('');}} placeholder={t.phonePh} type="tel" lang={lang} error={!!err&&!phone.trim()}/>
              {err&&<p className="text-xs font-bold -mt-2 mb-3" style={{color:'#DC2626'}}>{err}</p>}
            </div>
            <div className="px-5 py-4 flex-shrink-0" style={{borderTop:'1px solid #E5E1D8'}}>
              <button onClick={()=>{
                const needAddr=delivMode==='delivery';
                if(!name.trim()||(needAddr&&!addr.trim())||!phone.trim()){setErr(t.fillAll);return;}
                setErr('');setStep('payment');
              }}
                className={`w-full py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-95 ${fClass}`}
                style={{background:'linear-gradient(135deg,#065F46,#047857)',boxShadow:'0 6px 20px rgba(6,95,70,0.3)'}}>
                {t.continueBtn}
              </button>
            </div>
          </>
        )}

        {/* PAYMENT CHOICE */}
        {step==='payment'&&(
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="rounded-2xl p-3 mb-5" style={{background:'#F9F7F2',border:'1px solid #E5E1D8'}}>
                {cart.map(i=>(
                  <div key={i.cartId} className="flex justify-between text-xs py-0.5">
                    <span className={`font-bold truncate mr-2 ${fClass}`} style={{color:'#1A2F23'}}>{i.item.names[lang]} ×{i.qty}</span>
                    <span className="font-black flex-shrink-0" style={{color:'#065F46'}}>{i.totalPerUnit*i.qty} MAD</span>
                  </div>
                ))}
                {delivMode==='collect'&&(
                  <div className="flex justify-between text-xs pt-1 pb-1">
                    <span className={`font-bold ${fClass}`} style={{color:'#B45309'}}>🏪 Click & Collect</span>
                    <span className="font-bold" style={{color:'#B45309'}}>+2.99 MAD</span>
                  </div>
                )}
                <div className="flex justify-between text-sm mt-2 pt-2" style={{borderTop:'1px solid #E5E1D8'}}>
                  <span className={`font-black ${fClass}`} style={{color:'#065F46'}}>{t.total}</span>
                  <span className="font-black" style={{color:'#065F46'}}>{total} MAD</span>
                </div>
              </div>
              {([{key:'cash'as const,icon:'🤝',label:t.cashOption,desc:t.cashOptionDesc,color:'#065F46',bg:'#F0FDF4',selBg:'#D1FAE5'},{key:'card'as const,icon:'💳',label:t.cardOption,desc:t.cardOptionDesc,color:'#4F46E5',bg:'#EEF2FF',selBg:'#E0E7FF'}] as const).filter(opt=>!(delivMode==='collect'&&opt.key==='cash')).map(opt=>(
                <button key={opt.key} onClick={()=>setPayMethod(opt.key)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl mb-3 text-left transition-all active:scale-95"
                  style={{background:payMethod===opt.key?opt.selBg:'#FDFCF9',border:`2px solid ${payMethod===opt.key?opt.color:'#E5E1D8'}`}}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0" style={{background:payMethod===opt.key?opt.selBg:opt.bg}}>{opt.icon}</div>
                  <div className="flex-1 text-left">
                    <p className={`font-black text-sm ${fClass}`} style={{color:opt.color}}>{opt.label}</p>
                    <p className={`text-xs mt-0.5 ${fClass}`} style={{color:'#9CA3AF'}}>{opt.desc}</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{borderColor:payMethod===opt.key?opt.color:'#D1D5DB',background:payMethod===opt.key?opt.color:'transparent'}}>
                    {payMethod===opt.key&&<div className="w-2 h-2 rounded-full bg-white"/>}
                  </div>
                </button>
              ))}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl mt-2" style={{background:'#F9F7F2'}}>
                <span>🔒</span><p className="text-[10px]" style={{color:'#9CA3AF'}}>{t.sslBadge}</p>
              </div>
            </div>
            <div className="px-5 py-4 flex-shrink-0" style={{borderTop:'1px solid #E5E1D8'}}>
              <button
                onClick={()=>{
                  if(!payMethod)return;
                  if(payMethod==='cash'){sendOrderToAPI('cash');sendOrderToDriverApp('cash');setStep('success');}
                  else setStep('card');
                }}
                disabled={!payMethod}
                className={`w-full py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-95 ${fClass}`}
                style={{background:!payMethod?'#E5E1D8':payMethod==='cash'?'#25D366':'#4F46E5',boxShadow:payMethod?'0 6px 20px rgba(0,0,0,0.2)':'none',cursor:payMethod?'pointer':'not-allowed'}}>
                {payMethod==='cash'?t.confirmWhatsApp:payMethod==='card'?`${t.cardFormTitle} →`:t.continueBtn}
              </button>
            </div>
          </>
        )}

        {/* CARD FORM */}
        {step==='card'&&(
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4" style={{direction:isAR?'rtl':'ltr'}}>
              <div className="rounded-2xl p-5 mb-5 relative overflow-hidden" style={{background:'linear-gradient(135deg,#065F46,#047857)',minHeight:120}}>
                <div className="absolute inset-0 opacity-10" style={{backgroundImage:'repeating-linear-gradient(45deg,white 0,white 1px,transparent 0,transparent 50%)',backgroundSize:'8px 8px'}}/>
                <div className="flex justify-between items-start mb-4">
                  <p className="text-white/60 text-[10px] font-bold">💳 BRIDGE EATS</p>
                  <div className="flex gap-1"><div className="w-6 h-6 rounded-full bg-white/20"/><div className="w-6 h-6 rounded-full bg-white/40 -ml-2"/></div>
                </div>
                <p className="text-white font-black text-base tracking-widest mb-3">{cardNum?fmtCard(cardNum):'•••• •••• •••• ••••'}</p>
                <div className="flex justify-between items-end">
                  <div><p className="text-white/40 text-[9px]">CARDHOLDER</p><p className="text-white text-xs font-bold">{cardName||'—'}</p></div>
                  <div className="text-right"><p className="text-white/40 text-[9px]">EXPIRES</p><p className="text-white text-xs font-bold">{cardExp||'—'}</p></div>
                </div>
              </div>
              {profile.cardNumber&&(
                <button onClick={()=>{setCardNum(profile.cardNumber);setCardExp(profile.cardExpiry);setCardName(profile.cardName);}}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-4 w-full text-left ${fClass}`} style={{background:'#EEF2FF',border:'1px solid #C7D2FE'}}>
                  <span>✨</span><p className="text-[11px] font-bold" style={{color:'#4F46E5'}}>{t.autoFilled}</p>
                </button>
              )}
              <Field label={t.cardNumberLabel} value={fmtCard(cardNum)} onChange={v=>setCardNum(v.replace(/\s/g,''))} placeholder={t.cardNumberPh} type="tel" lang={lang}/>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t.cardExpiryLabel} value={cardExp} onChange={v=>setCardExp(fmtExp(v))} placeholder={t.cardExpiryPh} type="tel" lang={lang}/>
                <Field label={t.cardCVVLabel} value={cardCVV} onChange={v=>setCardCVV(v.slice(0,3))} placeholder={t.cardCVVPh} type="password" lang={lang} error={!!cardErr&&cardCVV.length<3}/>
              </div>
              <Field label={t.cardNameLabel} value={cardName} onChange={v=>setCardName(v.toUpperCase())} placeholder={t.cardNamePh} lang={lang}/>
              {cardErr&&<p className="text-xs font-bold -mt-2 mb-3" style={{color:'#DC2626'}}>{cardErr}</p>}
            </div>
            <div className="px-5 py-4 flex-shrink-0" style={{borderTop:'1px solid #E5E1D8'}}>
              <div className="flex items-center justify-center gap-2 mb-3">
                <span>🔒</span><p className="text-[10px]" style={{color:'#9CA3AF'}}>{t.sslBadge} · PCI DSS</p>
              </div>
              <button onClick={()=>{
                if(!cardCVV||cardCVV.length<3){setCardErr(t.fillAll);return;}
                setCardErr('');
                sendOrderToAPI('card');
                sendOrderToDriverApp('card');
                setStep('success');
              }}
                className={`w-full py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-95 ${fClass}`}
                style={{background:'#4F46E5',boxShadow:'0 6px 20px rgba(79,70,229,0.35)'}}>
                {t.payNow} — {total} MAD
              </button>
            </div>
          </>
        )}

        {/* SUCCESS */}
        {step==='success'&&(
          <div className="flex-1 flex flex-col items-center justify-center px-8 py-10 text-center">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl" style={{background:'linear-gradient(135deg,#F0FDF4,#D1FAE5)',border:'3px solid #BBF7D0'}}>✅</div>
              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-lg">🎉</div>
            </div>
            <h2 className={`text-xl font-black mb-2 ${fClass}`} style={{color:'#065F46'}}>{t.successTitle}</h2>
            <p className={`text-sm mb-6 ${fClass}`} style={{color:'#6B7280'}}>{t.successSub}</p>
            <div className="w-full rounded-2xl p-4 mb-4" style={{background:'#F0FDF4',border:'1.5px solid #BBF7D0'}}>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${fClass}`} style={{color:'#065F46'}}>{t.trackingLabel}</p>
              <p className="text-2xl font-black tracking-widest" style={{color:'#065F46'}}>{orderRef}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                <p className={`text-xs font-bold ${fClass}`} style={{color:'#059669'}}>{t.deliveryEta}</p>
              </div>
            </div>
            <button onClick={()=>{onClearCart();onClose();}}
              className={`w-full py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-95 ${fClass}`}
              style={{background:'linear-gradient(135deg,#065F46,#047857)',boxShadow:'0 6px 20px rgba(6,95,70,0.3)'}}>
              {t.newOrder} 🍽️
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TRACKING PAGE ────────────────────────────────────────────────────────────

function TrackingPage({lang,t}:{lang:Lang;t:typeof T.fr}) {
  const [activeStage,setActiveStage]=useState(2);
  const [courierStep,setCourierStep]=useState(0);
  const isAR=lang==='ar'; const fClass=fontClass(lang);
  useEffect(()=>{const iv=setInterval(()=>setCourierStep(s=>(s+1)%ROUTE_POINTS.length),2500);return()=>clearInterval(iv);},[]);
  return (
    <div className="px-5">
      <div className="rounded-3xl p-4 mb-5" style={{background:'#FDFCF9',border:'1.5px solid #E5E1D8',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
        <div className="flex items-center justify-between mb-1">
          <p className={`text-[10px] font-bold uppercase tracking-wider ${fClass}`} style={{color:'#9CA3AF'}}>{t.orderStatus}</p>
          <span className="text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1" style={{background:'#D1FAE5',color:'#065F46'}}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"/>{t.trackLive}
          </span>
        </div>
        <p className={`font-black text-sm ${fClass}`} style={{color:'#065F46'}}>{t.orderNum}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-base">⏱️</span>
          <p className="text-sm font-bold" style={{color:'#1A2F23'}}>{t.eta}: <span style={{color:'#065F46'}}>{t.etaTime}</span></p>
        </div>
      </div>
      <div className="rounded-3xl p-5 mb-5" style={{background:'#FDFCF9',border:'1.5px solid #E5E1D8',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
        <div className="relative mb-6">
          <div className="absolute top-4 h-0.5" style={{left:isAR?'auto':'12%',right:isAR?'12%':'auto',width:'76%',background:'#E5E1D8'}}/>
          <div className="absolute top-4 h-0.5 transition-all duration-700" style={{left:isAR?'auto':'12%',right:isAR?'12%':'auto',width:`${(activeStage/3)*76}%`,background:'linear-gradient(to right,#065F46,#059669)'}}/>
          <div className={`flex justify-between relative ${isAR?'flex-row-reverse':''}`}>
            {t.stages.map((stage,i)=>(
              <div key={i} className="flex flex-col items-center" style={{width:'25%'}}>
                <button onClick={()=>setActiveStage(i)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-all ${i===activeStage?'pulse-active':''}`}
                  style={{background:i<=activeStage?'#065F46':'#E5E1D8',color:i<=activeStage?'white':'#9CA3AF',border:i===activeStage?'3px solid #D9C5A0':'3px solid transparent',boxShadow:i===activeStage?'0 4px 16px rgba(6,95,70,0.35)':'none',zIndex:1}}>
                  {i<activeStage?'✓':['📋','👨‍🍳','🛵','✅'][i]}
                </button>
                <p className={`text-[9px] font-black uppercase tracking-tight mt-2 text-center leading-tight ${fClass}`} style={{color:i<=activeStage?'#065F46':'#9CA3AF'}}>{stage}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl p-3 flex items-center gap-3" style={{background:'#F0FDF4',border:'1px solid #BBF7D0'}}>
          <div className="text-2xl">{['📋','👨‍🍳','🛵','✅'][activeStage]}</div>
          <div>
            <p className={`text-sm font-black ${fClass}`} style={{color:'#065F46'}}>{t.stages[activeStage]}</p>
            <p className="text-xs mt-0.5" style={{color:'#6B7280'}}>{t.stagesSub[activeStage]}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          {[0,1,2,3].map(i=>(
            <button key={i} onClick={()=>setActiveStage(i)} className="flex-1 py-1 rounded-lg text-[10px] font-bold transition-all"
              style={{background:activeStage===i?'#065F46':'#F9F7F2',color:activeStage===i?'white':'#6B7280',border:'1px solid #E5E1D8'}}>{i+1}</button>
          ))}
        </div>
      </div>
      <div className="rounded-3xl overflow-hidden mb-5" style={{border:'1.5px solid #E5E1D8'}}>
        <div className="h-64">
          <MapContainer center={[32.2990,-9.2385]} zoom={15} style={{height:'100%',width:'100%'}} zoomControl attributionControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"/>
            <Marker position={[32.3010,-9.2420]} icon={restaurantIcon}><Popup>🥘 Bridge Safi</Popup></Marker>
            <MovingCourier step={courierStep}/>
          </MapContainer>
        </div>
        <div className="px-4 py-3 flex items-center justify-between" style={{background:'#FDFCF9'}}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm" style={{background:'#D1FAE5'}}>🛵</div>
            <div><p className="text-xs font-bold" style={{color:'#065F46'}}>{t.courierName}</p><p className="text-[10px]" style={{color:'#9CA3AF'}}>{t.trackZone}</p></div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{background:'#F0FDF4'}}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
            <span className="text-[10px] font-black" style={{color:'#065F46'}}>{t.etaTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CONTACT PAGE ─────────────────────────────────────────────────────────────

function ContactPage({lang,t}:{lang:Lang;t:typeof T.fr}) {
  const isAR=lang==='ar'; const fClass=fontClass(lang);
  const arrow=(<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2.5" style={{transform:isAR?'scaleX(-1)':'',flexShrink:0}}><path d="M5 12h14M12 5l7 7-7 7"/></svg>);
  return (
    <div className="px-5">
      <div className="rounded-3xl overflow-hidden mb-5 relative" style={{border:'1.5px solid #E5E1D8'}}>
        <img src="/logo.jpeg" className="w-full h-32 object-cover" alt="Bridge Safi"/>
        <div className="absolute inset-0" style={{background:'linear-gradient(to top,rgba(4,55,38,0.85) 0%,transparent 55%)'}}/>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className={`text-white font-black text-lg ${fClass}`}>{t.contactTitle}</p>
          <p className="text-white/70 text-xs">{t.contactSub}</p>
        </div>
      </div>
      {[
        {href:'https://wa.me/212764794856',bg:'#DCFCE7',border:'#86EFAC',iconBg:'#25D366',icon:(
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.124 1.532 5.859L.036 23.671l5.979-1.567A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.374l-.359-.214-3.728.977 1-3.647-.234-.374A9.818 9.818 0 112 12c0-5.422 4.396-9.818 9.818-9.818 5.421 0 9.818 4.396 9.818 9.818 0 5.421-4.397 9.818-9.818 9.818z"/></svg>
        ),label:t.whatsapp,sub:'+212 7 64 79 48 56'},
        {href:'tel:+212764794856',bg:'#FDFCF9',border:'#E5E1D8',iconBg:'#F0FDF4',iconBorder:'#BBF7D0',icon:<span className="text-xl">📞</span>,label:t.phone,sub:'+212 7 64 79 48 56'},
        {href:'mailto:contact@safi-bridge.ma',bg:'#FDFCF9',border:'#E5E1D8',iconBg:'#FEF9EE',iconBorder:'#FDE68A',icon:<span className="text-xl">✉️</span>,label:t.email,sub:'contact@safi-bridge.ma'},
      ].map((item,i)=>(
        <a key={i} href={item.href} target={item.href.startsWith('http')?'_blank':undefined} rel="noopener noreferrer"
          className="flex items-center gap-4 p-4 rounded-2xl mb-3 transition-all active:scale-95"
          style={{background:item.bg,border:`1.5px solid ${item.border}`,textDecoration:'none'}}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{background:item.iconBg,border:(item as any).iconBorder?`2px solid ${(item as any).iconBorder}`:undefined}}>{item.icon}</div>
          <div className="flex-1 min-w-0">
            <p className={`font-black text-sm ${fClass}`} style={{color:'#065F46'}}>{item.label}</p>
            <p className="text-xs" style={{color:'#6B7280'}}>{item.sub}</p>
          </div>{arrow}
        </a>
      ))}
      <div className="flex items-center gap-4 p-4 rounded-2xl mb-3" style={{background:'#FEF9EE',border:'1.5px solid #FDE68A'}}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{background:'#FEF3C7'}}><span className="text-xl">🕐</span></div>
        <div><p className={`font-black text-sm ${fClass}`} style={{color:'#B45309'}}>{t.hours}</p><p className="text-xs font-bold mt-0.5" style={{color:'#92400E'}}>{t.hoursVal}</p></div>
      </div>
      <GoldDivider/>
      <div className="rounded-2xl p-4 text-center mb-4" style={{background:'#F9F7F2',border:'1px solid #E5E1D8'}}>
        <p className="text-xl mb-1">📍</p>
        <p className={`font-black text-sm ${fClass}`} style={{color:'#065F46'}}>{t.zone}</p>
        <p className={`text-xs mt-1 ${fClass}`} style={{color:'#9CA3AF'}}>{t.plateau}</p>
      </div>
    </div>
  );
}

// ─── SERVICE SELECT PAGE ──────────────────────────────────────────────────────

function ServiceSelectPage({onSelect,lang,cycleLang}:{onSelect:(s:'delivery'|'taxi'|'tabac')=>void;lang:Lang;cycleLang:()=>void}) {
  const [pressed,setPressed]=useState<'delivery'|'taxi'|'tabac'|null>(null);
  const t=T[lang]; const fClass=fontClass(lang); const isAR=lang==='ar';
  const LANG_LABELS:Record<Lang,string>={fr:'FR',en:'EN',ar:'AR',amz:'ⴰⵎⵣ'};
  const choose=(s:'delivery'|'taxi'|'tabac')=>{setPressed(s);setTimeout(()=>onSelect(s),320);};
  return(
    <div className={`fixed inset-0 flex flex-col items-center justify-center z-40 px-6 ${isAR?'rtl':'ltr'}`}
      style={{background:'#FDFCF9'}}>
      {/* Background watermark */}
      <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:'url(/image_1.png)',backgroundSize:'cover',backgroundPosition:'center'}}/>

      {/* Language button */}
      <div className={`absolute top-5 z-50 ${isAR?'left-5':'right-5'}`}>
        <button onClick={cycleLang}
          className={`rounded-full flex items-center justify-center font-black text-sm transition-all active:scale-90 hover:scale-110 px-3 ${lang==='amz'?'font-tifinagh':''}`}
          style={{background:'white',border:'2.5px solid #D9C5A0',color:'#065F46',boxShadow:'0 4px 20px rgba(6,95,70,0.15)',height:'38px',fontSize:'13px'}}>
          {LANG_LABELS[lang]}
        </button>
      </div>

      <div className="relative flex flex-col items-center w-full max-w-sm">
        {/* Title */}
        <h1 className="font-black tracking-[0.5em] text-3xl mb-1" style={{color:'#065F46'}}>BRIDGE</h1>
        <p className="text-[11px] tracking-widest font-bold mb-1" style={{color:'#B45309'}}>SAFI · MAROC · آسفي · ⵙⴰⴼⵉ</p>
        <div className="flex items-center gap-2 mb-8 mt-2">
          <div className="w-10 h-px" style={{background:'#D9C5A0'}}/>
          <div className="w-1.5 h-1.5 rotate-45" style={{background:'#D9C5A0'}}/>
          <div className="w-10 h-px" style={{background:'#D9C5A0'}}/>
        </div>
        <p className={`text-[11px] font-black tracking-widest uppercase mb-8 ${fClass}`} style={{color:'#6B7280'}}>
          {t.chooseService}
        </p>

        {/* Three service cards */}
        <div className="flex items-start justify-center gap-2 w-full">
          {([
            {key:'delivery' as const, src:'/logo_delivery.jpeg', label:'Bridge Delivery', sub:t.deliverySub, emoji:'🛵', fallbackBg:'#D1FAE5', pending:false, active:true,
             activeColor:'#065F46', activeShadow:'0 0 0 5px rgba(6,95,70,0.15),0 10px 28px rgba(6,95,70,0.3)', labelColor:'#065F46'},
            {key:'taxi' as const, src:'/logo_taxi.jpeg', label:'Bridge Taxi', sub:t.taxiSub, emoji:'🚖', fallbackBg:'#FEF3C7', pending:true,
             activeColor:'#B45309', activeShadow:'0 0 0 5px rgba(180,83,9,0.15),0 10px 28px rgba(180,83,9,0.25)', labelColor:'#B45309'},
            {key:'tabac' as const, src:'/logo_tabac.jpeg', label:'Bridge Tabac', sub:t.tabacSub, emoji:'🚬', fallbackBg:'#7D4F2E', pending:true,
             activeColor:'#7D4F2E', activeShadow:'0 0 0 5px rgba(125,79,46,0.15),0 10px 28px rgba(125,79,46,0.25)', labelColor:'#7D4F2E'},
          ]).reduce<React.ReactNode[]>((acc,item,i)=>{
            if(i>0) acc.push(
              <div key={`div${i}`} className="flex flex-col items-center gap-1 flex-shrink-0" style={{marginTop:'52px'}}>
                <div className="w-px h-6" style={{background:'#E5E1D8'}}/>
                <div className="w-1.5 h-1.5 rotate-45" style={{background:'#D9C5A0'}}/>
                <div className="w-px h-6" style={{background:'#E5E1D8'}}/>
              </div>
            );
            const isPressed=pressed===item.key;
            const S=104;
            acc.push(
              <button key={item.key} onClick={()=>choose(item.key)}
                className="flex flex-col items-center gap-2.5 flex-shrink-0 transition-all duration-300 active:scale-95"
                style={{transform:isPressed?'scale(0.93)':'scale(1)',width:S,opacity:item.pending?0.82:1}}>
                <div className="relative flex-shrink-0" style={{width:S,height:S}}>
                  <div className="rounded-full overflow-hidden" style={{
                    width:S,height:S,
                    background:item.fallbackBg,
                    border:isPressed?`3.5px solid ${item.activeColor}`:'3px solid #D9C5A0',
                    boxShadow:isPressed?item.activeShadow:'0 6px 22px rgba(6,95,70,0.15)',
                    transition:'all 0.25s',
                  }}>
                    <img src={item.key==='tabac'?'/bridge-tabac-logo.jpeg':item.src} alt={item.label} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top',display:'block'}}/>
                  </div>
                  {/* "En attente" badge */}
                  {item.pending&&(
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full flex items-center gap-1 whitespace-nowrap"
                      style={{background:'#DC2626',boxShadow:'0 2px 8px rgba(220,38,38,0.5)'}}>
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"/>
                      <span className="text-white font-black" style={{fontSize:'9px',letterSpacing:'0.05em'}}>EN ATTENTE</span>
                    </div>
                  )}
                  {/* "Activé" badge */}
                  {!item.pending&&(item as any).active&&(
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full flex items-center gap-1 whitespace-nowrap"
                      style={{background:'#059669',boxShadow:'0 2px 8px rgba(5,150,105,0.55)'}}>
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"/>
                      <span className="text-white font-black" style={{fontSize:'9px',letterSpacing:'0.05em'}}>ACTIVÉ</span>
                    </div>
                  )}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-sm"
                    style={{background:'#FDFCF9',border:'2px solid #D9C5A0',boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
                    {item.emoji}
                  </div>
                </div>
                <div className="text-center mt-1">
                  <p className={`font-black text-[10px] tracking-[0.1em] uppercase ${fClass}`} style={{color:item.pending?'#9CA3AF':item.labelColor}}>{item.label}</p>
                  <p className={`font-bold text-[9px] tracking-wide mt-0.5 ${fClass}`} style={{color:'#9CA3AF'}}>{item.sub}</p>
                </div>
              </button>
            );
            return acc;
          },[])}
        </div>
      </div>
    </div>
  );
}

// ─── TAXI PAGE ────────────────────────────────────────────────────────────────

function TaxiPage({onBack,lang,cycleLang,profile,saveProfile}:{
  onBack:()=>void; lang:Lang; cycleLang:()=>void;
  profile:UserProfile; saveProfile:(p:UserProfile)=>void;
}) {
  const [showProfile,setShowProfile]=useState(false);
  const isAR=lang==='ar'; const isAMZ=lang==='amz'; const fClass=fontClass(lang);
  const pillStyle:React.CSSProperties={
    background:'white',border:'2.5px solid #D9C5A0',color:'#065F46',
    boxShadow:'0 4px 20px rgba(6,95,70,0.15)',height:'44px',minWidth:'44px',
  };
  const LANG_LABELS:Record<Lang,string>={fr:'FR',en:'EN',ar:'AR',amz:'ⴰⵎⵣ'};
  const navItems=[
    {label:{fr:'Accueil',en:'Home',ar:'الرئيسية',amz:'ⵜⴰⵣⵡⴰⵔⵜ'},icon:'🏠'},
    {label:{fr:'Suivi',en:'Track',ar:'تتبع',amz:'ⴰⵙⴽⵍⵙ'},icon:'📍'},
    {label:{fr:'Panier',en:'Cart',ar:'السلة',amz:'ⴰⵙⵡⵉⵔ'},icon:'🛒'},
  ];



  return(
    <div className={`min-h-screen overflow-x-hidden ${isAR?'rtl':'ltr'}`} style={{background:'#FDFCF9',color:'#1A2F23'}}>
      <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:'url(/image_1.png)',backgroundSize:'cover',backgroundPosition:'center'}}/>

      {/* ── Top-left: back to services ── */}
      <div className={`fixed top-5 z-50 ${isAR?'right-5':'left-5'}`}>
        <button onClick={onBack}
          className="flex items-center gap-0.5 px-1.5 rounded-full transition-all active:scale-90 hover:scale-110"
          style={{...pillStyle,height:'24px',minWidth:'unset'}}>
          <span style={{fontSize:'9px',lineHeight:1}}>🛵</span>
          <span style={{fontSize:'8px',color:'#D9C5A0',fontWeight:900}}>|</span>
          <span style={{fontSize:'9px',lineHeight:1}}>🚬</span>
          <span style={{fontSize:'8px',lineHeight:1,color:'#9CA3AF'}}>←</span>
        </button>
      </div>

      {/* ── Top-right: profile + lang ── */}
      <div className={`fixed top-5 z-50 flex items-center gap-2 ${isAR?'left-5':'right-5'}`}>
        <button onClick={()=>setShowProfile(true)}
          className="rounded-full flex items-center justify-center font-black text-sm transition-all active:scale-90 hover:scale-110 relative"
          style={{...pillStyle,width:'44px',fontSize:'18px'}}>
          👤
          {profile.name&&<span className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white" style={{background:'#10B981'}}/>}
        </button>
        <button onClick={cycleLang}
          className={`rounded-full flex items-center justify-center font-black text-sm transition-all active:scale-90 hover:scale-110 px-3 ${isAMZ?'font-tifinagh':''}`}
          style={{...pillStyle,fontSize:'13px'}}>
          {LANG_LABELS[lang]}
        </button>
      </div>

      {/* ── Content ── */}
      <div className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-20 pb-28">
        <div className="w-full max-w-sm text-center">
          <div className="rounded-full overflow-hidden mx-auto mb-6" style={{width:160,height:160,border:'3px solid #D9C5A0',boxShadow:'0 10px 36px rgba(180,83,9,0.2)'}}>
            <img src="/logo_taxi.jpeg" alt="Bridge Taxi"
              style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top',display:'block'}}/>
          </div>
          <h1 className="font-black tracking-[0.35em] text-xl mb-1" style={{color:'#B45309'}}>BRIDGE TAXI</h1>
          <p className="font-black text-sm tracking-widest mb-1" style={{color:'#065F46'}}>CONFORT</p>
          <div className="flex items-center justify-center gap-2 mb-6 mt-2">
            <div className="w-8 h-px" style={{background:'#D9C5A0'}}/>
            <div className="w-1.5 h-1.5 rotate-45" style={{background:'#D9C5A0'}}/>
            <div className="w-8 h-px" style={{background:'#D9C5A0'}}/>
          </div>
          <div className="rounded-2xl p-5 mb-6 w-full" style={{background:'#FEF9EE',border:'1.5px solid #FDE68A'}}>
            <p className="text-4xl mb-3">🚖</p>
            <p className={`font-black text-sm mb-1 ${fClass}`} style={{color:'#B45309'}}>{T[lang].taxiSoon}</p>
            <p className={`text-xs font-medium ${fClass}`} style={{color:'#78716C'}}>{T[lang].taxiDesc}</p>
          </div>
          <a href="https://wa.me/212764794856?text=Bonjour%2C%20je%20voudrais%20r%C3%A9server%20un%20Bridge%20Taxi%20Confort%20%F0%9F%9A%96"
            target="_blank" rel="noopener noreferrer"
            className="w-full py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 mb-3 active:scale-95 transition-all"
            style={{background:'#25D366',boxShadow:'0 6px 20px rgba(37,211,102,0.3)'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.124 1.532 5.859L.036 23.671l5.979-1.567A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
            {T[lang].taxiBook}
          </a>
        </div>
      </div>

      {/* ── Bottom nav (same as delivery) ── */}
      <nav className="fixed bottom-0 inset-x-0 z-40"
        style={{background:'rgba(253,252,249,0.97)',backdropFilter:'blur(20px)',borderTop:'1px solid #E5E1D8'}}>
        <div className="max-w-md mx-auto flex">
          {navItems.map((tab,i)=>(
            <button key={i}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-all active:scale-90">
              <span className="text-xl">{tab.icon}</span>
              <span className={`text-[10px] font-black uppercase tracking-wide ${fClass}`} style={{color:'#9CA3AF'}}>
                {tab.label[lang]}
              </span>
            </button>
          ))}
        </div>
        <p className="text-center text-[9px] pb-2" style={{color:'#C9BFB2'}}>© 2026 Bridge Safi · safi-bridge.ma</p>
      </nav>

      {showProfile&&<ProfileModal lang={lang} profile={profile} onSave={saveProfile} onClose={()=>setShowProfile(false)}/>}
    </div>
  );
}

// ─── SPLASH ───────────────────────────────────────────────────────────────────

// ─── PROFILE ONBOARDING SCREEN ────────────────────────────────────────────────

function ProfileOnboardingScreen({lang,profile,saveProfile,onDone}:{
  lang:Lang; profile:UserProfile;
  saveProfile:(p:UserProfile)=>void; onDone:()=>void;
}) {
  const t=T[lang]; const fClass=fontClass(lang); const isAR=lang==='ar';
  const [phone,setPhone]=useState(profile.phone||'');
  const [address,setAddress]=useState(profile.address||'');
  const completedCount=[phone,address].filter(Boolean).length;
  const total=2;

  const handleSave=()=>{
    saveProfile({...profile,phone,address,onboardingComplete:true});
    onDone();
  };
  const handleSkip=()=>{
    saveProfile({...profile,onboardingComplete:true});
    onDone();
  };

  return (
    <div className={`min-h-screen flex flex-col ${isAR?'rtl':'ltr'}`}
      style={{background:'linear-gradient(160deg,#011c15 0%,#054130 30%,#065F46 60%,#033d2c 100%)'}}>

      {/* Background zellige pattern */}
      <div style={{position:'fixed',inset:0,opacity:0.04,
        backgroundImage:`url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23D9C5A0'%3E%3Cpath d='M30 0L0 30L30 60L60 30L30 0zm0 10L50 30L30 50L10 30L30 10z'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize:'60px 60px',pointerEvents:'none'}}/>

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center pt-12 pb-8 px-5">
        <div style={{width:68,height:68,borderRadius:'50%',overflow:'hidden',
          border:'3px solid #D9C5A0',
          boxShadow:'0 0 0 6px rgba(217,197,160,0.12),0 12px 40px rgba(0,0,0,0.4)',
          marginBottom:14}}>
          <img src="/logo_splash.jpeg" alt="Bridge" style={{width:'100%',height:'100%',objectFit:'cover',transform:'scale(1.2)'}}/>
        </div>
        <h2 className={`font-black text-white text-2xl tracking-tight ${fClass}`} style={{margin:0}}>{t.onboardTitle}</h2>
        <p className={`text-xs mt-1 ${fClass}`} style={{color:'rgba(217,197,160,0.8)'}}>{t.onboardSub}</p>

        {/* Progress bar */}
        <div style={{display:'flex',gap:8,marginTop:18,alignItems:'center'}}>
          {Array.from({length:total},(_,i)=>(
            <div key={i} style={{
              width:i<completedCount?32:10,height:8,borderRadius:4,
              background:i<completedCount?'#D9C5A0':'rgba(255,255,255,0.15)',
              transition:'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }}/>
          ))}
          <span style={{color:'rgba(255,255,255,0.4)',fontSize:'0.58rem',marginLeft:4,fontWeight:700}}>
            {completedCount}/{total}
          </span>
        </div>
      </div>

      {/* Sections */}
      <div className="relative z-10 flex-1 px-4 pb-8" style={{maxWidth:460,margin:'0 auto',width:'100%'}}>
        <div style={{
          background:'#FDFCF9',border:'2px solid #E5E1D8',borderRadius:20,padding:16,marginBottom:14,
          boxShadow:'0 6px 24px rgba(6,95,70,0.08)'
        }}>
          <Field label={t.onboardPhone} value={phone} onChange={setPhone}
            placeholder="06 00 00 00 00" type="tel" lang={lang}/>
        </div>

        <div style={{
          background:'#FDFCF9',border:'2px solid #E5E1D8',borderRadius:20,padding:16,marginBottom:14,
          boxShadow:'0 6px 24px rgba(6,95,70,0.08)'
        }}>
          <AddressAutocomplete label={t.onboardAddr} value={address} onChange={setAddress}
            placeholder="Ex: Plateau, Av. Hassan II, Safi" lang={lang}/>
        </div>

        <div style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(217,197,160,0.2)',borderRadius:16,padding:'14px 16px',marginBottom:16,display:'flex',gap:12,alignItems:'center'}}>
          <div style={{fontSize:22,flexShrink:0}}>💳 🪪</div>
          <div>
            <p style={{color:'rgba(255,255,255,0.7)',fontSize:'0.72rem',margin:0,fontWeight:700}}>
              Carte & identité dans votre profil
            </p>
            <p style={{color:'rgba(255,255,255,0.4)',fontSize:'0.62rem',margin:'3px 0 0'}}>
              Ajoutez-les plus tard depuis l’icône 👤
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <button onClick={handleSave}
          className={`w-full font-black text-sm tracking-wider ${fClass}`}
          style={{height:54,borderRadius:18,
            background:completedCount===total
              ?'linear-gradient(135deg,#D9C5A0,#C9B48C)'
              :'rgba(217,197,160,0.35)',
            color:completedCount===total?'#1A2F23':'rgba(255,255,255,0.6)',
            border:`2px solid ${completedCount===total?'transparent':'rgba(217,197,160,0.3)'}`,
            cursor:'pointer',
            boxShadow:completedCount===total?'0 8px 32px rgba(217,197,160,0.3)':'none',
            transition:'all 0.3s',marginBottom:10}}>
          {completedCount===total?`✓ ${t.onboardSave}`:`${t.onboardSave} (${completedCount}/${total})`}
        </button>

        <button onClick={handleSkip}
          className={`w-full text-xs ${fClass}`}
          style={{height:40,borderRadius:14,background:'transparent',
            color:'rgba(255,255,255,0.4)',border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer'}}>
          {t.onboardSkip} →
        </button>
      </div>
    </div>
  );
}

function SplashScreen() {
  const [progress,setProgress]=useState(0);
  const [dots,setDots]=useState(0);
  useEffect(()=>{const iv=setInterval(()=>setProgress(p=>Math.min(p+1.8,100)),50);return()=>clearInterval(iv);},[]);
  useEffect(()=>{const iv=setInterval(()=>setDots(d=>(d+1)%4),420);return()=>clearInterval(iv);},[]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50" style={{background:'#FDFCF9'}}>
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.035]"
        style={{backgroundImage:'url(/image_1.png)',backgroundSize:'cover',backgroundPosition:'center'}}/>

      <div className="relative flex flex-col items-center">
        {/* Main logo circle */}
        <div className="relative mb-8">
          {/* Outer pulse ring */}
          <div className="absolute inset-0 rounded-full animate-pulse"
            style={{background:'radial-gradient(circle,rgba(217,197,160,0.35) 0%,transparent 70%)',transform:'scale(1.55)'}}/>
          {/* Logo */}
          <div className="relative rounded-full overflow-hidden"
            style={{width:120,height:120,background:'#D1FAE5',border:'3px solid #D9C5A0',boxShadow:'0 12px 40px rgba(6,95,70,0.2)'}}>
            <img src="/logo_splash.jpeg" alt="Bridge"
              style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center',display:'block',transform:'scale(1.22)'}}/>
          </div>
          {/* Download badge */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 flex items-center gap-1"
            style={{background:'#065F46',boxShadow:'0 4px 12px rgba(6,95,70,0.35)'}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
              <path d="M12 16l-6-6h4V4h4v6h4l-6 6z"/><rect x="4" y="18" width="16" height="2" rx="1" fill="white"/>
            </svg>
            <span className="text-[9px] font-black tracking-widest text-white">APP</span>
          </div>
        </div>

        {/* Brand name */}
        <h1 className="font-black tracking-[0.55em] text-3xl mb-1" style={{color:'#065F46'}}>BRIDGE</h1>
        <p className="text-[10px] tracking-widest font-bold" style={{color:'#B45309'}}>SAFI · MAROC · آسفي · ⵙⴰⴼⵉ</p>

        {/* Gold divider */}
        <div className="flex items-center gap-2 my-5">
          <div className="w-10 h-px" style={{background:'#D9C5A0'}}/>
          <div className="w-1.5 h-1.5 rotate-45" style={{background:'#D9C5A0'}}/>
          <div className="w-10 h-px" style={{background:'#D9C5A0'}}/>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1.5 rounded-full overflow-hidden mb-2" style={{background:'#E5E1D8'}}>
          <div className="h-full rounded-full transition-all duration-75"
            style={{width:`${progress}%`,background:'linear-gradient(to right,#065F46,#059669)'}}/>
        </div>

        {/* Loading dots */}
        <p className="text-[9px] tracking-[0.3em] font-black" style={{color:'#B8AFA4'}}>
          CHARGEMENT{'·'.repeat(dots)}
        </p>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

type Page = 'home'|'restaurant'|'tracking'|'contact';
const LANG_CYCLE:Lang[]=['fr','en','ar','amz'];
const LANG_LABELS:Record<Lang,string>={fr:'FR',en:'EN',ar:'AR',amz:'ⴰⵎⵣ'};

const NAV_KEY='bridge_nav_state';
// ─── TABAC PAGE ───────────────────────────────────────────────────────────────

function TabacPage({onBack,lang,cycleLang,profile,saveProfile}:{
  onBack:()=>void; lang:Lang; cycleLang:()=>void;
  profile:UserProfile; saveProfile:(p:UserProfile)=>void;
}) {
  const [showProfile,setShowProfile]=useState(false);
  const [delivMode,setDelivMode]=useState<'delivery'|'collect'>('delivery');
  const [name,setName]=useState(profile.name??'');
  const [addr,setAddr]=useState(profile.address??'');
  const [phone,setPhone]=useState(profile.phone??'');
  const [err,setErr]=useState('');

  const isAR=lang==='ar'; const isAMZ=lang==='amz'; const fClass=fontClass(lang);
  const t=T[lang];
  const pillStyle:React.CSSProperties={
    background:'white',border:'2.5px solid #D9C5A0',color:'#065F46',
    boxShadow:'0 4px 20px rgba(6,95,70,0.15)',height:'44px',minWidth:'44px',
  };
  const LANG_LABELS:Record<Lang,string>={fr:'FR',en:'EN',ar:'AR',amz:'ⴰⵎⵣ'};

  const WA_SVG=<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.124 1.532 5.859L.036 23.671l5.979-1.567A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>;

  const handleSend=()=>{
    if(!name.trim()||!phone.trim()||(delivMode==='delivery'&&!addr.trim())){
      setErr('*');return;
    }
    let msg=`🚬 Bridge Tabac — ${delivMode==='delivery'?t.delivOption:t.collectOption}\n\n`;
    if(delivMode==='delivery'){
      msg+=`👤 ${t.nameLabel}: ${name.trim()}\n📍 ${t.addrLabel}: ${addr.trim()}, Safi\n📞 ${t.phoneLabel}: ${phone.trim()}`;
    } else {
      msg+=`👤 ${t.nameLabel}: ${name.trim()}\n📞 ${t.phoneLabel}: ${phone.trim()}\n\n🏪 ${t.tabacCollectAddress}`;
    }
    msg+=`\n\n${t.tabacBook} 🙏`;
    window.open(`https://wa.me/212764794856?text=${encodeURIComponent(msg)}`,'_blank','noopener,noreferrer');
  };

  const inputCls=`w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all ${fClass}`;
  const inputStyle=(hasErr:boolean):React.CSSProperties=>({
    background:'#F9F6F0',border:`1.5px solid ${hasErr?'#EF4444':'#E5E1D8'}`,color:'#1A2F23',
  });

  return(
    <div className={`min-h-screen flex flex-col ${isAR?'rtl':'ltr'}`} style={{background:'#FDFCF9',color:'#1A2F23'}}>
      {/* Header */}
      <div className={`fixed top-5 z-50 ${isAR?'right-5':'left-5'}`}>
        <button onClick={onBack}
          className="flex items-center gap-0.5 px-1.5 rounded-full transition-all active:scale-90 hover:scale-110"
          style={{...pillStyle,height:'24px',minWidth:'unset'}}>
          <span style={{fontSize:'9px',lineHeight:1}}>🛵</span>
          <span style={{fontSize:'8px',color:'#D9C5A0',fontWeight:900}}>|</span>
          <span style={{fontSize:'9px',lineHeight:1}}>🚖</span>
          <span style={{fontSize:'8px',lineHeight:1,color:'#9CA3AF'}}>←</span>
        </button>
      </div>
      <div className={`fixed top-5 z-50 flex items-center gap-2 ${isAR?'left-5':'right-5'}`}>
        <button onClick={cycleLang}
          className={`rounded-full flex items-center justify-center font-black text-sm transition-all active:scale-90 hover:scale-110 px-3 ${isAMZ?'font-tifinagh':''}`}
          style={{...pillStyle,fontSize:'13px'}}>
          {LANG_LABELS[lang]}
        </button>
        <button onClick={()=>setShowProfile(true)}
          className="rounded-full flex items-center justify-center font-black text-xl transition-all active:scale-90 hover:scale-110"
          style={{...pillStyle,width:'44px',padding:0}}>
          👤
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center px-5 pt-24 pb-12 max-w-sm mx-auto w-full">
        {/* Logo */}
        <div className="w-24 h-24 rounded-full overflow-hidden mb-4 flex-shrink-0"
          style={{boxShadow:'0 8px 32px rgba(125,79,46,0.3)',border:'3px solid #D9C5A0'}}>
          <img src="/bridge-tabac-logo.jpeg" alt="Bridge Tabac" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center center',display:'block'}}/>
        </div>
        <h1 className={`font-black text-xl tracking-wider mb-0.5 ${fClass}`} style={{color:'#7D4F2E'}}>BRIDGE TABAC</h1>
        <p className="text-[10px] tracking-widest font-bold mb-5" style={{color:'#B45309'}}>SAFI · MAROC · آسفي · ⵙⴰⴼⵉ</p>

        {/* Mode selector */}
        <div className="flex gap-2 w-full mb-5">
          {([
            {key:'delivery'as const, label:t.delivOption, desc:t.delivOptionDesc, color:'#065F46', selBg:'#D1FAE5', bg:'#F0FDF4'},
            {key:'collect'as const,  label:t.collectOption, desc:t.collectOptionDesc, color:'#B45309', selBg:'#FEF3C7', bg:'#FFFBEB'},
          ]).map(opt=>{
            const sel=delivMode===opt.key;
            return(
              <button key={opt.key} onClick={()=>{setDelivMode(opt.key);setErr('');}}
                className={`flex-1 rounded-2xl p-3 text-left transition-all duration-200 active:scale-95 ${isAR?'text-right':''}`}
                style={{background:sel?opt.selBg:opt.bg,border:`2px solid ${sel?opt.color:'#E5E1D8'}`}}>
                <p className={`font-black text-[11px] leading-tight ${fClass}`} style={{color:opt.color}}>{opt.label}</p>
                <p className={`text-[9px] mt-0.5 ${fClass}`} style={{color:'#9CA3AF'}}>{opt.desc}</p>
                {sel&&<div className="mt-1.5 w-3 h-3 rounded-full flex items-center justify-center" style={{background:opt.color}}>
                  <svg width="7" height="7" viewBox="0 0 10 10" fill="white"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>
                </div>}
              </button>
            );
          })}
        </div>

        {/* Form */}
        <div className="w-full flex flex-col gap-3 mb-5">
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${fClass}`} style={{color:'#065F46'}}>👤 {t.nameLabel}</p>
            <input className={inputCls} style={inputStyle(!!err&&!name.trim())}
              placeholder={t.namePh} value={name} onChange={e=>{setName(e.target.value);setErr('');}}/>
          </div>
          {delivMode==='delivery'&&(
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${fClass}`} style={{color:'#065F46'}}>📍 {t.addrLabel}</p>
              <input className={inputCls} style={inputStyle(!!err&&!addr.trim())}
                placeholder={t.addrPh} value={addr} onChange={e=>{setAddr(e.target.value);setErr('');}}/>
            </div>
          )}
          {delivMode==='collect'&&(
            <div className="rounded-xl px-4 py-3" style={{background:'#FEF3C7',border:'1.5px solid #FDE68A'}}>
              <p className={`text-[10px] font-medium ${fClass}`} style={{color:'#92400E'}}>🏪 {t.tabacCollectAddress}</p>
            </div>
          )}
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${fClass}`} style={{color:'#065F46'}}>📞 {t.phoneLabel}</p>
            <input className={inputCls} style={inputStyle(!!err&&!phone.trim())}
              placeholder={t.phonePh} value={phone} type="tel"
              onChange={e=>{setPhone(e.target.value);setErr('');}}/>
          </div>
          {err&&<p className={`text-xs font-bold ${fClass}`} style={{color:'#EF4444'}}>⚠️ {lang==='ar'?'يرجى ملء جميع الحقول المطلوبة':lang==='en'?'Please fill in all required fields':lang==='amz'?'ⵔⵏⵓ ⵉⵙⵡⵓⵔⵉⵡⵏ ⵉⵍⴰⵎⵎⴰⵏ':'Veuillez remplir tous les champs requis'}</p>}
        </div>

        {/* Send button */}
        <button onClick={handleSend}
          className={`w-full py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 active:scale-95 transition-all ${fClass}`}
          style={{background:'#25D366',boxShadow:'0 6px 20px rgba(37,211,102,0.3)'}}>
          {WA_SVG}
          {t.tabacSend}
        </button>
      </div>

      {showProfile&&<ProfileModal lang={lang} profile={profile} onSave={saveProfile} onClose={()=>setShowProfile(false)}/>}
    </div>
  );
}

function loadNav() {
  try {
    const raw=localStorage.getItem(NAV_KEY);
    if(!raw) return null;
    return JSON.parse(raw) as {lang:Lang;service:'none'|'delivery'|'taxi'|'tabac';page:Page;restaurantId:string|null};
  } catch { return null; }
}

export default function App() {
  const saved = loadNav();
  const { isLoaded, isSignedIn } = useUser();
  const [, navigate] = useLocation();

  const [lang,setLang]         = useState<Lang>(saved?.lang??'fr');
  const [page,setPage]         = useState<Page>(saved?.page??'home');
  // splashDone becomes true after 3s; we also wait for Clerk to load
  const [splashDone,setSplashDone] = useState(false);
  const [service,setService]       = useState<'none'|'delivery'|'taxi'|'tabac'>(saved?.service??'none');
  const [cart,setCart]         = useState<CartItem[]>([]);
  const [showCart,setShowCart] = useState(false);
  const [showProfile,setShowProfile] = useState(false);
  const [showDriver,setShowDriver] = useState(false);
  const [selectedRestaurant,setSelectedRestaurant] = useState<Restaurant|null>(
    saved?.restaurantId ? (RESTAURANTS.find(r=>r.id===saved.restaurantId)??null) : null
  );
  const {profile,saveProfile}  = useProfile();

  // Splash timer — 3 seconds
  useEffect(()=>{
    const t=setTimeout(()=>setSplashDone(true),3000);
    return()=>clearTimeout(t);
  },[]);

  // Redirect to sign-in if Clerk loaded and not signed in
  useEffect(()=>{
    if(isLoaded && !isSignedIn) navigate('/sign-in');
  },[isLoaded,isSignedIn]);

  // Persist nav state on every relevant change
  useEffect(()=>{
    try {
      localStorage.setItem(NAV_KEY,JSON.stringify({
        lang, service, page,
        restaurantId: selectedRestaurant?.id ?? null,
      }));
    } catch {}
  },[lang,service,page,selectedRestaurant]);

  const t=T[lang]; const isAR=lang==='ar'; const isAMZ=lang==='amz'; const fClass=fontClass(lang);
  const cycleLang=()=>setLang(l=>LANG_CYCLE[(LANG_CYCLE.indexOf(l)+1)%LANG_CYCLE.length]);

  const addToCart=(ci:CartItem)=>setCart(prev=>{
    const found=prev.find(x=>x.cartId===ci.cartId||
      (x.item.id===ci.item.id&&JSON.stringify(x.selectedOptions)===JSON.stringify(ci.selectedOptions)));
    if(found) return prev.map(x=>x.cartId===found.cartId?{...x,qty:x.qty+1}:x);
    return [...prev,ci];
  });

  const adjustQty=(cartId:string,delta:number)=>setCart(prev=>
    prev.flatMap(i=>{if(i.cartId!==cartId)return[i];const q=i.qty+delta;return q>0?[{...i,qty:q}]:[];})
  );

  const clearCart=()=>setCart([]);
  const cartCount=cart.reduce((s,i)=>s+i.qty,0);

  const handleSelectRestaurant=(r:Restaurant)=>{setSelectedRestaurant(r);setPage('restaurant');};
  const handleBack=()=>{setPage('home');setSelectedRestaurant(null);};

  const TABS:Page[]=['home','tracking','contact'];

  // Show splash while timer running OR Clerk still loading
  const showSplash = !splashDone || !isLoaded;
  if(showSplash) return <SplashScreen/>;

  // useEffect above handles navigate('/sign-in') — return null while redirecting
  if(!isSignedIn) return null;

  // Profile onboarding after first sign-in
  if(!profile.onboardingComplete) return (
    <ProfileOnboardingScreen
      lang={lang}
      profile={profile}
      saveProfile={saveProfile}
      onDone={()=>saveProfile({...profile,onboardingComplete:true})}
    />
  );

  if(service==='none') return <ServiceSelectPage onSelect={s=>setService(s)} lang={lang} cycleLang={cycleLang}/>;
  if(service==='taxi') return <TaxiPage onBack={()=>setService('none')} lang={lang} cycleLang={cycleLang} profile={profile} saveProfile={saveProfile}/>;
  if(service==='tabac') return <TabacPage onBack={()=>setService('none')} lang={lang} cycleLang={cycleLang} profile={profile} saveProfile={saveProfile}/>;

  // Pill button style (shared between lang + profile)
  const pillStyle:React.CSSProperties={
    background:'white',border:'2.5px solid #D9C5A0',color:'#065F46',
    boxShadow:'0 4px 20px rgba(6,95,70,0.15)',height:'44px',minWidth:'44px',
  };

  return (
    <div className={`min-h-screen overflow-x-hidden ${isAR?'rtl':'ltr'}`} style={{color:'#1A2F23'}}>

      {/* ── Top-left: Services back + Driver ── */}
      <div className={`fixed top-5 z-50 flex items-center gap-2 ${isAR?'right-5':'left-5'}`}>
        <button onClick={()=>setService('none')}
          className="flex items-center gap-0.5 px-1.5 rounded-full transition-all active:scale-90 hover:scale-110"
          style={{...pillStyle, height:'24px', minWidth:'unset'}}>
          <span style={{fontSize:'9px', lineHeight:1}}>🚬</span>
          <span style={{fontSize:'8px', color:'#D9C5A0', fontWeight:900}}>|</span>
          <span style={{fontSize:'9px', lineHeight:1}}>🚖</span>
          <span style={{fontSize:'8px', lineHeight:1, color:'#9CA3AF'}}>←</span>
        </button>
        <button onClick={()=>setShowDriver(true)}
          className="flex items-center gap-1 px-2 rounded-full transition-all active:scale-90 hover:scale-110 font-black text-[10px]"
          style={{...pillStyle, height:'24px', minWidth:'unset', color:'#065F46'}}>
          <span style={{fontSize:'11px'}}>🛵</span>
        </button>
      </div>

      {/* ── Top-right: Profile + Language ── */}
      <div className={`fixed top-5 z-50 flex items-center gap-2 ${isAR?'left-5':'right-5'}`}>
        <button onClick={()=>setShowProfile(true)}
          className="rounded-full flex items-center justify-center font-black text-sm transition-all active:scale-90 hover:scale-110 relative"
          style={{...pillStyle,width:'44px',fontSize:'18px'}}>
          👤
          {profile.name&&<span className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white" style={{background:'#10B981'}}/>}
        </button>
        <button onClick={cycleLang}
          className={`rounded-full flex items-center justify-center font-black text-sm transition-all active:scale-90 hover:scale-110 px-3 ${isAMZ?'font-tifinagh':''}`}
          style={{...pillStyle,fontSize:'13px'}}>
          {LANG_LABELS[lang]}
        </button>
      </div>


      {/* ── Header ── */}
      <header className="relative pt-14 pb-4 flex flex-col items-center"
        style={{borderBottom:'1px solid #E5E1D8',background:'rgba(253,252,249,0.93)',backdropFilter:'blur(14px)'}}>
        <img src="/logo.jpeg" alt="Bridge" className="h-14 w-14 rounded-full object-cover"
          style={{border:'2.5px solid #D9C5A0',boxShadow:'0 4px 16px rgba(6,95,70,0.15)'}}/>
        <h1 className="mt-2 text-[11px] font-black tracking-[0.45em] uppercase" style={{color:'#065F46'}}>
          {isAMZ?'ⴱⵔⵉⴷⵊ':isAR?'بريدج':'Bridge'}
        </h1>
        <p className={`text-[9px] tracking-widest mt-0.5 ${fClass}`} style={{color:'#B45309'}}>{t.zone}</p>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-md mx-auto pt-5 pb-28">
        {page==='home'&&<HomePage lang={lang} t={t} onSelectRestaurant={handleSelectRestaurant}/>}
        {page==='restaurant'&&selectedRestaurant&&(
          <RestaurantPage restaurant={selectedRestaurant} lang={lang} t={t} onBack={handleBack} onAddToCart={addToCart}/>
        )}
        {page==='tracking'&&<TrackingPage lang={lang} t={t}/>}
        {page==='contact'&&<ContactPage lang={lang} t={t}/>}
      </main>

      {/* ── Bottom nav ── */}
      <nav className="fixed bottom-0 inset-x-0 z-40"
        style={{background:'rgba(253,252,249,0.97)',backdropFilter:'blur(20px)',borderTop:'1px solid #E5E1D8'}}>
        <div className="max-w-md mx-auto flex">
          {([
            {id:'home' as Page,label:t.navHome,icon:'🏠'},
            {id:'tracking' as Page,label:t.navTrack,icon:'📍'},
          ]).map(tab=>(
            <button key={tab.id} onClick={()=>{setPage(tab.id);if(tab.id==='home')setSelectedRestaurant(null);}}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-all">
              <span className="text-xl transition-transform" style={{transform:page===tab.id&&!(page==='home'&&selectedRestaurant)?'scale(1.15)':'scale(1)'}}>{tab.icon}</span>
              <span className={`text-[10px] font-black uppercase tracking-wide ${fClass}`} style={{color:page===tab.id&&!(tab.id==='home'&&selectedRestaurant&&page==='restaurant')?'#065F46':'#9CA3AF'}}>{tab.label}</span>
              {page===tab.id&&tab.id!=='home'&&<div className="w-5 h-0.5 rounded-full" style={{background:'#065F46'}}/>}
              {tab.id==='home'&&page!=='restaurant'&&page==='home'&&<div className="w-5 h-0.5 rounded-full" style={{background:'#065F46'}}/>}
            </button>
          ))}
          {/* Panier — 3e onglet */}
          <button onClick={()=>setShowCart(true)}
            className="flex-1 flex flex-col items-center gap-1 py-3 transition-all active:scale-90 relative">
            <span className="text-xl relative">
              🛒
              {cartCount>0&&(
                <span className="absolute -top-1 -right-2 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center" style={{background:'#4F46E5'}}>{cartCount}</span>
              )}
            </span>
            <span className={`text-[10px] font-black uppercase tracking-wide ${fClass}`} style={{color:cartCount>0?'#4F46E5':'#9CA3AF'}}>
              {t.navCart||'Panier'}
            </span>
          </button>
        </div>
        <p className="text-center text-[9px] pb-2" style={{color:'#C9BFB2'}}>{t.footer}</p>
      </nav>

      {showCart&&<CheckoutDrawer cart={cart} lang={lang} onClose={()=>setShowCart(false)} onQty={adjustQty} profile={profile} onClearCart={clearCart} restaurantName={selectedRestaurant?.name}/>}
      {showProfile&&<ProfileModal lang={lang} profile={profile} onSave={saveProfile} onClose={()=>setShowProfile(false)}/>}

      {showDriver&&(
        <div className="fixed inset-0 z-50 flex items-end" style={{background:'rgba(10,30,20,0.7)',backdropFilter:'blur(6px)'}} onClick={()=>setShowDriver(false)}>
          <div className="w-full max-w-md mx-auto rounded-t-3xl p-6" style={{background:'#FDFCF9',boxShadow:'0 -20px 60px rgba(0,0,0,0.3)'}} onClick={e=>e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{background:'linear-gradient(135deg,#065F46,#047857)'}}>🛵</div>
              <div>
                <p className="font-black text-sm" style={{color:'#065F46'}}>Bridge Logistique</p>
                <p className="text-xs" style={{color:'#9CA3AF'}}>Portail livreurs · Tableau de bord</p>
              </div>
            </div>
            <p className="text-xs mb-4 leading-relaxed" style={{color:'#6B7280'}}>
              Accès réservé aux livreurs Bridge. Gérez vos livraisons, suivez vos commandes en temps réel.
            </p>
            <a href={DRIVER_APP_URL} target="_blank" rel="noopener noreferrer"
              className="block w-full py-3.5 rounded-2xl text-center font-black text-sm text-white"
              style={{background:'linear-gradient(135deg,#065F46,#047857)',boxShadow:'0 6px 20px rgba(6,95,70,0.3)'}}>
              Ouvrir l'app livreur →
            </a>
            <button onClick={()=>setShowDriver(false)} className="block w-full mt-3 py-3 rounded-2xl text-center text-xs font-bold" style={{color:'#9CA3AF',background:'#F3F4F6'}}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
