import { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from 'react';
import { useUser, useClerk, useAuth } from '@clerk/react';
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

// ── Dark mode context ────────────────────────────────────────────────────────
const DARK_KEY = 'bridge_dark';
interface DarkCtxValue { dark: boolean; toggle: () => void }
const DarkModeCtx = createContext<DarkCtxValue>({ dark: false, toggle: () => {} });
export function useDark() { return useContext(DarkModeCtx); } function goToSignIn(){window.history.pushState({},'','/sign-in');window.dispatchEvent(new PopStateEvent('popstate'));}

function useAuthHeaders() {
  const { getToken } = useAuth();
  return useCallback(async (): Promise<HeadersInit> => {
    const token = await getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [getToken]);
}

function DarkToggle({ size = 44 }: { size?: number }) {
  const { dark, toggle } = useDark();
  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Mode clair' : 'Mode sombre'}
      className="rounded-full flex items-center justify-center font-black transition-all active:scale-90 hover:scale-110"
      style={{
        background: 'var(--c-card)', border: '2.5px solid #D9C5A0',
        color: '#065F46', boxShadow: '0 4px 20px rgba(6,95,70,0.15)',
        height: size, width: size, fontSize: size * 0.42,
      }}>
      {dark ? '☀️' : '🌙'}
    </button>
  );
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

// Reverse geocoding via Nominatim — returns a short readable address
async function reverseGeocode(lat:number,lng:number):Promise<string> {
  try {
    const res=await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`,
      {headers:{'User-Agent':'BridgeSafi/1.0'}}
    );
    if(!res.ok) return '';
    const d=await res.json();
    const a=d.address||{};
    const parts=[
      a.house_number,
      a.road||a.pedestrian||a.footway||a.path,
      a.neighbourhood||a.suburb||a.quarter||a.city_district,
    ].filter(Boolean);
    return parts.length>=2 ? parts.join(' ') : (d.display_name||'').split(',').slice(0,2).join(',').trim();
  } catch(_){return '';}
}

// Draggable pin marker — updates when dragged
function DraggablePin({pos,onDragEnd}:{pos:[number,number];onDragEnd:(lat:number,lng:number)=>void}) {
  const markerRef=useRef<L.Marker|null>(null);
  return (
    <Marker
      position={pos}
      icon={clientPinIcon}
      draggable
      ref={markerRef}
      eventHandlers={{
        dragend(){
          const m=markerRef.current;
          if(m){const {lat,lng}=m.getLatLng();onDragEnd(lat,lng);}
        }
      }}
    />
  );
}

function DeliveryMap({onSet,onAddress,pin}:{
  onSet:(coords:string,inside:boolean)=>void;
  onAddress:(addr:string)=>void;
  pin:[number,number]|null;
}) {
  const [geocoding,setGeocoding]=useState(false);

  const handlePick=async(lat:number,lng:number)=>{
    const inside=pointInPolygon(lat,lng,DELIVERY_ZONE);
    onSet(`${lat.toFixed(5)},${lng.toFixed(5)}`,inside);
    setGeocoding(true);
    const addr=await reverseGeocode(lat,lng);
    setGeocoding(false);
    if(addr) onAddress(addr);
  };

  return (
    <div className="relative mb-3">
      <MapContainer center={[32.2994,-9.2372]} zoom={13}
        style={{height:220,borderRadius:14,zIndex:0}} scrollWheelZoom={false}
        maxBounds={[[32.18,-9.265],[32.36,-9.13]]} maxBoundsViscosity={1.0} minZoom={12}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://osm.org">OpenStreetMap</a>'/>
        <Polygon positions={DELIVERY_ZONE} pathOptions={{color:'#065F46',fillColor:'#2ecc71',fillOpacity:0.18,weight:2,dashArray:'6,4'}}/>
        <MapClickLayer onPick={handlePick}/>
        {pin&&<DraggablePin pos={pin} onDragEnd={handlePick}/>}
      </MapContainer>
      {geocoding&&(
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1.5"
          style={{background:'rgba(6,95,70,0.85)',backdropFilter:'blur(4px)',zIndex:1000}}>
          <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse"/>
          Adresse en cours…
        </div>
      )}
    </div>
  );
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

// URL du site livreur Bridge Logistique (où arrivent toutes les commandes)
const DRIVER_APP_URL = 'https://livreur.safi-bridge.ma';
// ⬇ URL encodée dans le QR de paiement — à remplacer par le lien de votre banque
const BRIDGE_QR_PAY_URL = 'https://safi-bridge.ma/pay';

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

interface UserProfile { name:string; address:string; phone:string; email:string; cardNumber:string; cardExpiry:string; cardName:string; paymentMethod?:'card'|'paypal'; paypalEmail?:string; onboardingComplete?:boolean; avatar?:string; coupon?:string; }

// ─── BRIDGE ID — identifiant universel partagé partout ────────────────────────
// Formule : BR- + 6 premiers chiffres du téléphone + 1ère lettre du prénom
export function getBridgeId(phone: string|undefined|null, name?: string|undefined|null): string {
  const digits = (phone||'').replace(/\D/g,'').slice(0,6);
  if (digits.length < 1) return 'BR-???????';
  const letter = (name||'').trim().replace(/^(\S).*/,'$1').toUpperCase() || '?';
  return `BR-${digits}${letter}`;
}

// ─── PROFILE STORAGE ──────────────────────────────────────────────────────────

const PROFILE_KEY_PREFIX = 'bridge_eats_profile_';
const PROFILE_KEY_LEGACY = 'bridge_eats_profile'; // old generic key — migrated once
const AVATAR_KEY_PREFIX  = 'bridge_eats_avatar_';  // separate key so large base64 never inflates profile JSON
const emptyProfile = (): UserProfile => ({ name:'', address:'', phone:'', email:'', cardNumber:'', cardExpiry:'', cardName:'', paymentMethod:'card', paypalEmail:'', onboardingComplete:true, coupon:'' });

function profileKey(userId: string) { return `${PROFILE_KEY_PREFIX}${userId}`; }
function avatarKey(userId: string)  { return `${AVATAR_KEY_PREFIX}${userId}`; }

// Compress a base64 image to ≤200×200 JPEG — prevents localStorage quota errors
function compressAvatarDataUrl(dataUrl: string, quality = 0.72, maxPx = 220): Promise<string> {
  return new Promise(resolve => {
    if (!dataUrl?.startsWith('data:')) { resolve(dataUrl); return; }
    if (dataUrl.length < 80_000) { resolve(dataUrl); return; } // already small enough
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d')!.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// ── Card type detection ────────────────────────────────────────────────────────
type CardType = 'visa'|'mastercard'|'unknown';
function detectCard(n:string): CardType {
  const d=n.replace(/\D/g,'');
  if(/^4/.test(d)) return 'visa';
  if(/^5[1-5]/.test(d)||(/^2[2-7]/.test(d)&&parseInt(d.slice(0,4),10)>=2221&&parseInt(d.slice(0,4),10)<=2720)) return 'mastercard';
  return 'unknown';
}
function isValidCardType(_n:string):boolean { return true; }
function luhnCheck(_n:string):boolean{ return true; }
function isRealCard(n:string):boolean{
  const d=n.replace(/\D/g,'');
  return d.length>=13&&d.length<=19;
}
const PROMO_CODES:Record<string,number>={
  'BRIDGE10':10,'BIENVENUE':15,'SAFI5':5,'FLEURS20':20,'CADEAUX12':12,'BRIDGE20':20
};
const DELIVERY_FEE = 12;   // MAD — frais livraison de base (affiché au client)
const KM_RATE      = 1;    // MAD/km — silencieux, non affiché au client
const RESTAURANT_LAT = 32.2994; // Centre-ville Safi (point de départ calcul distance)
const RESTAURANT_LNG = -9.2372;
const SERVICE_FEE  = 6.5;  // MAD — frais service obligatoires

function haversineKm(lat1:number,lng1:number,lat2:number,lng2:number):number{
  const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

// SVG logos inline (tiny)
const VisaLogo=()=>(
  <svg viewBox="0 0 60 20" width="44" height="15" fill="none">
    <text x="0" y="16" fontFamily="Arial" fontWeight="900" fontSize="18" fill="white" letterSpacing="-1">VISA</text>
  </svg>
);
const MastercardLogo=()=>(
  <svg viewBox="0 0 38 24" width="38" height="24">
    <circle cx="14" cy="12" r="12" fill="#EB001B"/>
    <circle cx="24" cy="12" r="12" fill="#F79E1B"/>
    <path d="M19 4.8a12 12 0 0 1 0 14.4A12 12 0 0 1 19 4.8z" fill="#FF5F00"/>
  </svg>
);

// Read profile from localStorage without the avatar field (avatar lives in its own key)
function readProfileFromStorage(key: string): UserProfile {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '{}');
    const { avatar: _av, ...rest } = raw; // strip avatar — stored separately
    return { ...emptyProfile(), ...rest };
  } catch { return emptyProfile(); }
}

// Read avatar from its own key (avoids inflating profile JSON and hitting quota)
function readAvatarFromStorage(aKey: string): string {
  try { return localStorage.getItem(aKey) || ''; } catch { return ''; }
}

// Write profile without avatar to main key, avatar to its own key
function writeProfileToStorage(key: string, aKey: string, p: UserProfile) {
  try {
    const { avatar, ...rest } = p;
    localStorage.setItem(key, JSON.stringify(rest));
    if (avatar) localStorage.setItem(aKey, avatar);
  } catch (e: unknown) {
    // If quota still hit (e.g. other data), remove avatar and retry
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      try { localStorage.removeItem(aKey); } catch {}
    }
  }
}

function useProfile(userId?: string) {
  // Guests get a dedicated localStorage key so their info persists across visits
  const key  = profileKey(userId ?? 'guest');
  const aKey = avatarKey(userId ?? 'guest');
  const { getToken } = useAuth();

  // Show localStorage data instantly while server loads (good UX)
  const [profile, setProfileState] = useState<UserProfile>(() => {
    const p = readProfileFromStorage(key);
    p.avatar = readAvatarFromStorage(aKey);
    // Migration: if old profile has a large avatar embedded, move it to the avatar key
    try {
      const raw = JSON.parse(localStorage.getItem(key) || '{}');
      if (raw.avatar && !localStorage.getItem(aKey)) {
        compressAvatarDataUrl(raw.avatar).then(compressed => {
          try {
            localStorage.setItem(aKey, compressed);
            const { avatar: _av, ...rest } = raw;
            localStorage.setItem(key, JSON.stringify(rest));
          } catch {}
        });
        p.avatar = raw.avatar; // use it in state immediately
      }
    } catch {}
    return p;
  });

  // Always fetch from server when userId is available — server is source of truth.
  // Avatar is loaded from its own localStorage key (never from server).
  useEffect(() => {
    if (!userId) {
      // Guest: localStorage only — no server fetch needed
      const p = readProfileFromStorage(key);
      p.avatar = readAvatarFromStorage(aKey);
      setProfileState(p);
      return;
    }
    // Show cached data immediately while server responds
    const cached = readProfileFromStorage(key);
    cached.avatar = readAvatarFromStorage(aKey);
    setProfileState(cached);

    let cancelled = false;
    const loadFromServer = async () => {
      for (let attempt = 0; attempt < 4; attempt++) {
        if (cancelled) return;
        if (attempt > 0) await new Promise(r => setTimeout(r, 1000 * attempt));
        try {
          const token = await getToken();
          if (!token) continue;
          const r = await fetch('/api/profile', {
            credentials: 'include',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!r.ok) continue;
          const d = await r.json();
          if (cancelled) return;
          if (d && (d.name || d.phone || d.address)) {
            // Merge server fields (name/phone/address) with local cache
            const local = readProfileFromStorage(key);
            let localAvatar = readAvatarFromStorage(aKey);
            // If no avatar in localStorage, try fetching from server (handles new device / cache cleared)
            if (!localAvatar && userId) {
              try {
                const ar = await fetch(`/api/profile/avatar/${userId}`, { credentials: 'include' });
                if (ar.ok && ar.headers.get('content-type')?.startsWith('image/')) {
                  const blob = await ar.blob();
                  const reader = new FileReader();
                  localAvatar = await new Promise<string>(res => {
                    reader.onload = () => res(reader.result as string);
                    reader.readAsDataURL(blob);
                  });
                  try { localStorage.setItem(aKey, localAvatar); } catch {}
                }
              } catch { /* best-effort */ }
            }
            const merged: UserProfile = {
              ...emptyProfile(),
              ...local,
              name:    d.name    || local.name    || '',
              phone:   d.phone   || local.phone   || '',
              address: d.address || local.address || '',
              onboardingComplete: !!(d.name || d.phone || local.name || local.phone),
              avatar: localAvatar,
            };
            setProfileState(merged);
            writeProfileToStorage(key, aKey, merged);
          }
          return;
        } catch { /* retry */ }
      }
    };
    loadFromServer();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const saveProfile = useCallback((p: UserProfile) => {
    setProfileState(p);
    writeProfileToStorage(key, aKey, p);
  }, [key, aKey]);

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
    nameLabel:'Votre prénom', addrLabel:'Adresse à Safi', phoneLabel:'Numéro de téléphone', emailLabel:'Adresse e-mail',
    namePh:'Ex: Mohamed', addrPh:'Ex: Plateau, Av. Hassan II, Safi', phonePh:'06 00 00 00 00', emailPh:'exemple@email.com',
    fillAll:'Merci de remplir tous les champs', continueBtn:'Continuer →',
    payModeTitle:'Mode de Paiement',
    cashOption:'Paiement à la livraison', cashOptionDesc:'Payez en espèces à la réception · Gratuit',
    cardOption:'Paiement par Carte Bancaire', cardOptionDesc:'Visa / Mastercard · CMI · Sécurisé',
    cardFormTitle:'Données de Carte', cardNumberLabel:'Numéro de carte',
    cardExpiryLabel:"Date d'expiration", cardCVVLabel:'CVV', cardNameLabel:'Nom sur la carte',
    cardNumberPh:'1234 5678 9012 3456', cardExpiryPh:'MM/AA', cardCVVPh:'123', cardNamePh:'MOHAMED ALAMI',
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
    gameId:'ID Joueur', gamePts:'pts', gameTitle:'Bridge Game',
    errName:'Entrez votre prénom et nom (ex: Mohamed Alaoui)',
    errPhone:'Numéro invalide (ex: +212 612 345 678 ou 0612345678)',
    errCard:'Numéro de carte invalide (16 chiffres requis)',
    errCardType:'Carte non acceptée — Visa ou Mastercard uniquement',
    errLuhn:'Numéro de carte invalide — vérifiez les chiffres',
    promoLabel:'Code promo / Cadeau', promoPh:'Ex : BRIDGE10', promoApply:'Appliquer',
    promoOk:(d:number)=>`-${d} MAD appliqué 🎉`, promoErr:'Code invalide ou déjà utilisé',
    diamondsSection:'💎 Mes Diamants Bridge', diamondsAvail:(n:number)=>`${n} pts disponibles (= ${Math.floor(n/200)} MAD)`,
    diamondsUse:'Convertir en réduction', diamondsNone:'Aucun diamant pour l\'instant — jouez !',
    discountRow:(d:number)=>`Réduction appliquée : -${d} MAD`,
    deliveryFeeRow:'Frais de livraison',
    serviceFeeRow:'Frais de service',
    serviceFeeToggle:'Ajouter frais de service',
    serviceFeeDesc:'Contribution pour le maintien de la plateforme',
    errExpiry:'Date invalide (format MM/AA, non expirée)',
    errCardName:'Nom du titulaire requis (comme sur la carte)',
    paymentTabCard:'💳 Carte', paymentTabPaypal:'🅿️ PayPal',
    paypalEmailLabel:'Email PayPal', paypalPh:'exemple@paypal.com',
    errPaypal:'Adresse email PayPal invalide',
    savedPaypalLabel:'PayPal enregistré',
    changePwd:'🔑 Changer le mot de passe', currentPwd:'Mot de passe actuel',
    newPwd:'Nouveau mot de passe (8 car. min.)', confirmPwd:'Confirmer le nouveau mot de passe',
    pwdChanged:'Mot de passe modifié ✓', pwdMismatch:'Les mots de passe ne correspondent pas.',
    pwdWeak:'Mot de passe trop faible (8 caractères min.).', pwdWrong:'Mot de passe actuel incorrect.',
    pwdSave:'Mettre à jour le mot de passe',
    trackTitle:'Suivi GPS en Direct', trackZone:'SAFI · PLATEAU', trackLive:'EN DIRECT',
    stages:['Reçue','En préparation','En chemin','Livrée'],
    stagesSub:['Commande confirmée',"Le chef s'affaire",'Votre livreur arrive','Bon appétit !'],
    orderStatus:'Statut de votre commande', orderNum:'Commande #BE-2847',
    eta:'Arrivée estimée', courierName:'Livreur Bridge',
    contactTitle:"Besoin d'aide ?", contactSub:'Notre équipe est disponible 7j/7',
    whatsapp:'WhatsApp Business', phone:'Appeler', email:'Email', hours:'Horaires', hoursVal:'8h00 – 23h00',
    navHome:'Accueil', navTrack:'Suivi', navContact:'Contact', navCart:'Panier',
    footer:'© 2026 Bridge Safi · safi-bridge.ma', plateau:'Plateau · Centre-Ville · Bouzidi',
    safiExcl:'Spécialité Safi', selected:'Sélectionné ✓',
    waMsgHeader:'🛍️ Nouvelle commande Bridge Safi\n\n📦 Articles:\n',
    waMsgFooter:(total:number,name:string,addr:string,phone:string)=>`\n💰 Total: ${total} MAD\n\n👤 Nom: ${name}\n📍 Adresse: ${addr}, Safi\n📞 Tél: ${phone}\n\nMerci de confirmer ma commande ! 🙏`,
    chooseService:'Choisissez votre service',
    deliverySub:'Livraison rapide', taxiSub:'Confort & style', fleursSub:'Fleurs & cadeaux',
    pharmaeSub:'De nuit & de jour 🌙',
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
    qrOption:'Paiement QR Code 📲', qrOptionDesc:'Scannez le QR · Virement bancaire instantané',
    qrModalTitle:'Scanner pour payer', qrModalSub:'Ouvrez votre appli bancaire et scannez le QR',
    qrAmountLabel:'Montant à régler', qrPaid:'J\'ai payé ✅', qrCancel:'Annuler',
    qrNote:'Le virement est instantané · Bridge Safi',
    hubServices:'Services', hubServicesSub:'Eats · Taxi · Tabac · Fleurs · Pharmacie',
    hubGame:'Jouer & Gagner', hubGameSub:'Récoltez des diamants 💎 → menus offerts',
    hubWelcome:'Bienvenue',
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
    nameLabel:'Your name', addrLabel:'Address in Safi', phoneLabel:'Phone number', emailLabel:'Email address',
    namePh:'e.g. Mohamed', addrPh:'e.g. Plateau, Av. Hassan II, Safi', phonePh:'06 00 00 00 00', emailPh:'example@email.com',
    fillAll:'Please fill in all fields', continueBtn:'Continue →',
    payModeTitle:'Payment Method',
    cashOption:'Cash on Delivery', cashOptionDesc:'Pay cash upon receipt · Free',
    cardOption:'Pay by Credit Card', cardOptionDesc:'Visa / Mastercard · CMI · Secured',
    cardFormTitle:'Card Details', cardNumberLabel:'Card number',
    cardExpiryLabel:'Expiry date', cardCVVLabel:'CVV', cardNameLabel:'Name on card',
    cardNumberPh:'1234 5678 9012 3456', cardExpiryPh:'MM/YY', cardCVVPh:'123', cardNamePh:'MOHAMED ALAMI',
    payNow:'Pay now 🔒', confirmWhatsApp:'Confirm order 🚀',
    successTitle:'Order Confirmed! 🎉', successSub:'Your order has been received.',
    trackingLabel:'Tracking number', deliveryEta:'Estimated delivery in 18–25 min', newOrder:'New order',
    autoFilled:'Pre-filled from your profile ✓',
    delivOption:'🚚 Home Delivery', delivOptionDesc:'Delivered to you · Safi zone',
    collectOption:'🏪 Click & Collect', collectOptionDesc:'Pick up at restaurant · +2.99 MAD',
    collectAddress:'Pick-up address: Plateau, Safi (restaurant will contact you)',
    profileTitle:'My Profile', profileSub:'Your saved information',
    profileSave:'Save profile', profileSaved:'Profile saved ✓', savedPayment:'Saved credit card', signOut:'🚪 Sign out',
    gameId:'Player ID', gamePts:'pts', gameTitle:'Bridge Game',
    errName:'Enter your first and last name (e.g. Mohamed Alaoui)',
    errPhone:'Invalid number (e.g. +212 612 345 678 or 0612345678)',
    errCard:'Invalid card number (16 digits required)',
    errCardType:'Card not accepted — Visa or Mastercard only',
    errLuhn:'Invalid card number — please check the digits',
    promoLabel:'Promo code / Gift', promoPh:'E.g.: BRIDGE10', promoApply:'Apply',
    promoOk:(d:number)=>`-${d} MAD applied 🎉`, promoErr:'Invalid or already used code',
    diamondsSection:'💎 My Bridge Diamonds', diamondsAvail:(n:number)=>`${n} pts available (= ${Math.floor(n/200)} MAD)`,
    diamondsUse:'Convert to discount', diamondsNone:'No diamonds yet — play to earn!',
    discountRow:(d:number)=>`Discount applied: -${d} MAD`,
    deliveryFeeRow:'Delivery fee',
    serviceFeeRow:'Service fee',
    serviceFeeToggle:'Add service fee',
    serviceFeeDesc:'Contribution to platform maintenance',
    errExpiry:'Invalid date (MM/YY format, not expired)',
    errCardName:'Cardholder name required (as on the card)',
    paymentTabCard:'💳 Card', paymentTabPaypal:'🅿️ PayPal',
    paypalEmailLabel:'PayPal Email', paypalPh:'example@paypal.com',
    errPaypal:'Invalid PayPal email address',
    savedPaypalLabel:'PayPal saved',
    changePwd:'🔑 Change password', currentPwd:'Current password',
    newPwd:'New password (min. 8 chars)', confirmPwd:'Confirm new password',
    pwdChanged:'Password updated ✓', pwdMismatch:'Passwords do not match.',
    pwdWeak:'Password too weak (8 characters min.).', pwdWrong:'Current password is incorrect.',
    pwdSave:'Update password',
    trackTitle:'Live GPS Tracking', trackZone:'SAFI · PLATEAU', trackLive:'LIVE',
    stages:['Received','Preparing','On the way','Delivered'],
    stagesSub:['Order confirmed','Chef is cooking','Courier en route','Enjoy your meal!'],
    orderStatus:'Your order status', orderNum:'Order #BE-2847',
    eta:'Estimated arrival', courierName:'Bridge Driver',
    contactTitle:'Need help?', contactSub:'Our team is available 7 days a week',
    whatsapp:'WhatsApp Business', phone:'Call us', email:'Email', hours:'Hours', hoursVal:'8:00 AM – 11:00 PM',
    navHome:'Home', navTrack:'Track', navContact:'Contact', navCart:'Cart',
    footer:'© 2026 Bridge Safi · safi-bridge.ma', plateau:'Plateau · City Center · Bouzidi',
    safiExcl:'Safi Special', selected:'Selected ✓',
    waMsgHeader:'🛍️ New Bridge Safi order\n\n📦 Items:\n',
    waMsgFooter:(total:number,name:string,addr:string,phone:string)=>`\n💰 Total: ${total} MAD\n\n👤 Name: ${name}\n📍 Address: ${addr}, Safi\n📞 Phone: ${phone}\n\nPlease confirm my order! 🙏`,
    chooseService:'Choose your service',
    deliverySub:'Fast delivery', taxiSub:'Comfort & style', fleursSub:'Flowers & gifts',
    pharmaeSub:'Night & day 🌙',
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
    qrOption:'QR Code Payment 📲', qrOptionDesc:'Scan QR · Instant bank transfer',
    qrModalTitle:'Scan to pay', qrModalSub:'Open your banking app and scan the QR code',
    qrAmountLabel:'Amount to pay', qrPaid:'I have paid ✅', qrCancel:'Cancel',
    qrNote:'Instant transfer · Bridge Safi',
    hubServices:'Services', hubServicesSub:'Eats · Taxi · Tabac · Flowers · Pharmacy',
    hubGame:'Play & Win', hubGameSub:'Collect diamonds 💎 → free menus',
    hubWelcome:'Welcome',
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
    nameLabel:'اسمك', addrLabel:'عنوانك في آسفي', phoneLabel:'رقم الهاتف', emailLabel:'البريد الإلكتروني',
    namePh:'مثال: يوسف', addrPh:'مثال: الهضبة، ش. الحسن الثاني، آسفي', phonePh:'06 00 00 00 00', emailPh:'مثال@email.com',
    fillAll:'يرجى ملء جميع الحقول', continueBtn:'متابعة →',
    payModeTitle:'طريقة الدفع',
    cashOption:'الدفع عند الاستلام', cashOptionDesc:'ادفع نقداً عند استلام طلبك · مجاني',
    cardOption:'الدفع ببطاقة بنكية', cardOptionDesc:'Visa / Mastercard · CMI · آمن',
    cardFormTitle:'بيانات البطاقة', cardNumberLabel:'رقم البطاقة',
    cardExpiryLabel:'تاريخ الانتهاء', cardCVVLabel:'CVV', cardNameLabel:'الاسم على البطاقة',
    cardNumberPh:'1234 5678 9012 3456', cardExpiryPh:'MM/AA', cardCVVPh:'123', cardNamePh:'MOHAMED ALAMI',
    payNow:'ادفع الآن 🔒', confirmWhatsApp:'تأكيد الطلب 🚀',
    successTitle:'تم تأكيد الطلب! 🎉', successSub:'تم استلام طلبك بنجاح.',
    trackingLabel:'رقم التتبع', deliveryEta:'التوصيل المتوقع خلال 18–25 دقيقة', newOrder:'طلب جديد',
    autoFilled:'مُعبَّأ من ملفك الشخصي ✓',
    delivOption:'🚚 التوصيل للمنزل', delivOptionDesc:'يوصل إليك · منطقة آسفي',
    collectOption:'🏪 Click & Collect', collectOptionDesc:'الاستلام من المطعم · +2.99 MAD',
    collectAddress:'عنوان الاستلام : الهضبة، آسفي (سيتصل بك المطعم)',
    profileTitle:'ملفي الشخصي', profileSub:'معلوماتك المحفوظة',
    profileSave:'حفظ الملف الشخصي', profileSaved:'تم الحفظ ✓', savedPayment:'بطاقة بنكية محفوظة', signOut:'🚪 تسجيل الخروج',
    gameId:'معرّف اللاعب', gamePts:'نقاط', gameTitle:'Bridge Game',
    errName:'أدخل اسمك الكامل (مثال: محمد العلوي)',
    errPhone:'رقم غير صالح (مثال: 212612345678+ أو 0612345678)',
    errCard:'رقم البطاقة غير صالح (مطلوب 16 رقماً)',
    errCardType:'البطاقة غير مقبولة — Visa أو Mastercard فقط',
    errLuhn:'رقم البطاقة غير صالح — تحقق من الأرقام',
    promoLabel:'رمز ترويجي / هدية', promoPh:'مثال: BRIDGE10', promoApply:'تطبيق',
    promoOk:(d:number)=>`تم تطبيق -${d} MAD 🎉`, promoErr:'الرمز غير صالح أو مستخدم',
    diamondsSection:'💎 ماساتي Bridge', diamondsAvail:(n:number)=>`${n} نقطة (= ${Math.floor(n/200)} MAD)`,
    diamondsUse:'تحويل إلى خصم', diamondsNone:'لا توجد نقاط بعد — العب لتكسبها!',
    discountRow:(d:number)=>`الخصم المطبق: -${d} MAD`,
    deliveryFeeRow:'رسوم التوصيل',
    serviceFeeRow:'رسوم الخدمة',
    serviceFeeToggle:'إضافة رسوم الخدمة',
    serviceFeeDesc:'مساهمة في صيانة المنصة',
    errExpiry:'تاريخ غير صالح (صيغة MM/AA وغير منتهية)',
    errCardName:'اسم حامل البطاقة مطلوب',
    paymentTabCard:'💳 بطاقة', paymentTabPaypal:'🅿️ PayPal',
    paypalEmailLabel:'بريد PayPal الإلكتروني', paypalPh:'example@paypal.com',
    errPaypal:'عنوان البريد الإلكتروني لـ PayPal غير صالح',
    savedPaypalLabel:'PayPal محفوظ',
    changePwd:'🔑 تغيير كلمة المرور', currentPwd:'كلمة المرور الحالية',
    newPwd:'كلمة مرور جديدة (8 أحرف على الأقل)', confirmPwd:'تأكيد كلمة المرور الجديدة',
    pwdChanged:'تم تغيير كلمة المرور ✓', pwdMismatch:'كلمتا المرور غير متطابقتين.',
    pwdWeak:'كلمة المرور ضعيفة (8 أحرف على الأقل).', pwdWrong:'كلمة المرور الحالية غير صحيحة.',
    pwdSave:'تحديث كلمة المرور',
    trackTitle:'تتبع GPS مباشر', trackZone:'آسفي · الهضبة', trackLive:'مباشر',
    stages:['مستلمة','قيد التحضير','في الطريق','تم التوصيل'],
    stagesSub:['تم تأكيد الطلب','الطاهي يعمل','المندوب في الطريق','بالهناء والشفاء!'],
    orderStatus:'حالة طلبك', orderNum:'الطلب #BE-2847',
    eta:'وقت الوصول المتوقع', courierName:'سائق بريدج',
    contactTitle:'هل تحتاج مساعدة؟', contactSub:'فريقنا متاح 7 أيام في الأسبوع',
    whatsapp:'واتساب بيزنس', phone:'اتصل بنا', email:'البريد الإلكتروني',
    hours:'ساعات العمل', hoursVal:'8:00 ص – 11:00 م',
    navHome:'الرئيسية', navTrack:'تتبع', navContact:'تواصل', navCart:'السلة',
    footer:'© 2026 بريدج سافي · safi-bridge.ma', plateau:'الهضبة · وسط المدينة · بوزيدي',
    safiExcl:'تخصص آسفي', selected:'تم الاختيار ✓',
    waMsgHeader:'🛍️ طلب جديد من بريدج إيتس\n\n📦 الطلبات:\n',
    waMsgFooter:(total:number,name:string,addr:string,phone:string)=>`\n💰 المجموع: ${total} MAD\n\n👤 الاسم: ${name}\n📍 العنوان: ${addr}، آسفي\n📞 الهاتف: ${phone}\n\nأرجو تأكيد طلبي! 🙏`,
    chooseService:'اختر خدمتك',
    deliverySub:'توصيل سريع', taxiSub:'راحة وأناقة', fleursSub:'ورود وهدايا',
    pharmaeSub:'ليلاً ونهاراً 🌙',
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
    qrOption:'الدفع بـ QR Code 📲', qrOptionDesc:'امسح الـ QR · تحويل بنكي فوري',
    qrModalTitle:'امسح للدفع', qrModalSub:'افتح تطبيق بنكك وامسح رمز QR',
    qrAmountLabel:'المبلغ المطلوب', qrPaid:'دفعت ✅', qrCancel:'إلغاء',
    qrNote:'التحويل فوري · Bridge Safi',
    hubServices:'الخدمات', hubServicesSub:'إيتس · تاكسي · تاباك · زهور · صيدلية',
    hubGame:'العب واربح', hubGameSub:'اجمع الماسات 💎 ← وجبات مجانية',
    hubWelcome:'مرحباً',
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
    nameLabel:'ⵉⵙⵎ ⵏⵏⴽ', addrLabel:'ⵜⴰⵙⵓⵏⵜ ⵖ ⵙⴰⴼⵉ', phoneLabel:'ⴰⵏⵓⵎⵔ ⵏ ⵓⵙⵓⵍ', emailLabel:'ⵉⵎⴰⵢⵍ',
    namePh:'ⴰⵎ: ⵢⵓⵙⴼ', addrPh:'ⴰⵎ: ⴰⴱⵍⴰⵟⵓ, ⵙⴰⴼⵉ', phonePh:'06 00 00 00 00', emailPh:'mail@email.com',
    fillAll:'ⵎⵍⴰ ⵉⵍⵉⵙ ⴽⵓⵍⵍⵓ ⵉⴳⵎⴰⵎⵏ', continueBtn:'ⵙⴷⴷⵉⴷ →',
    payModeTitle:'ⴰⵏⴰⵡ ⵏ ⵓⵙⵙⴼⵍⵍⴷ',
    cashOption:'ⴰⴷⵔⵉⵎ ⵎⵎⵉ ⵢⴰⵙⵍⵎⴷ', cashOptionDesc:'ⵙⵙⴼⵍⵍⴷ ⵙ ⵓⴷⵔⵉⵎ · ⵉⵥⵍⵉ',
    cardOption:'ⵜⴰⴽⴰⵔⴷⵜ ⵏ ⵓⵣⵔⴰⴼ', cardOptionDesc:'Visa / Mastercard · CMI · ⴰⵎⵣⵡⴰⵔⵓ',
    cardFormTitle:'ⵉⵙⴼⴰⵡⵏ ⵏ ⵜⴽⴰⵔⴷⵜ', cardNumberLabel:'ⴰⵏⵓⵎⵔ ⵏ ⵜⴽⴰⵔⴷⵜ',
    cardExpiryLabel:'ⴰⵙⵙ ⵏ ⵓⵙⵓⵔⴼ', cardCVVLabel:'CVV', cardNameLabel:'ⵉⵙⵎ ⵖ ⵜⴽⴰⵔⴷⵜ',
    cardNumberPh:'1234 5678 9012 3456', cardExpiryPh:'MM/AA', cardCVVPh:'123', cardNamePh:'MOHAMED ALAMI',
    payNow:'ⵙⵙⴼⵍⵍⴷ ⴷⵉⵖ 🔒', confirmWhatsApp:'ⵙⵛⴷ ⵉⴽⴽⵉⵏ 🚀',
    successTitle:'ⵜⵜⵓⵙⵛⴷⵃ ⵜⴰⵖⵓⵍⵜ! 🎉', successSub:'ⵜⵜⵓⵙⵔⵖ ⵜⴰⵖⵓⵍⵜ ⵏⵏⴽ.',
    trackingLabel:'ⴰⵏⵓⵎⵔ ⵏ ⵓⵙⴽⵍⵙ', deliveryEta:'ⴰⵙⵍⵎⴷ ⵖ 18–25 ⵜⵉⵎⵉⵏⵉⵜⵉⵏ', newOrder:'ⵜⴰⵖⵓⵍⵜ ⵜⴰⵎⴰⵢⵏⵓⵜ',
    autoFilled:'ⵉⵜⵜⵓⵎⵍⴰ ⵙⴳ ⵓⵎⵍⵉ ⵏⵏⴽ ✓',
    delivOption:'🚚 ⴰⵙⵙⵓⴼⵖ ⵙ ⵓⴽⴰⵎⴰⵢ', delivOptionDesc:'ⵉⵜⵜⵓⴽⵛⵎ ⵖⵉⴽ · ⵙⴰⴼⵉ',
    collectOption:'🏪 Click & Collect', collectOptionDesc:'ⴰⵔⵣⵣⵓ ⴳ ⵓⵣⵉⴳⵣ · +2.99 MAD',
    collectAddress:'ⵜⴰⵏⵙⴰ ⵏ ⵓⵔⵣⵣⵓ : ⴰⴱⵍⴰⵟⵓ, ⵙⴰⴼⵉ',
    profileTitle:'ⴰⵎⵍⵉ ⵏⵓ', profileSub:'ⵉⵙⴼⴰⵡⵏ ⵏⵏⴽ ⵉⵜⵜⵓⵙⵎⴷⵏ',
    profileSave:'ⵙⵎⴷ ⴰⵎⵍⵉ', profileSaved:'ⵜⵜⵓⵙⵎⴷ ✓', savedPayment:'ⵜⴰⴽⴰⵔⴷⵜ ⵉⵜⵜⵓⵙⵎⴷⵏ', signOut:'🚪 ⴼⴼⵖ',
    gameId:'ⴰⵡⵏⴰⴽ', gamePts:'ⵜⵉⵏⵓⴹⵉⵡⵉⵏ', gameTitle:'Bridge Game',
    errName:'ⵙⵎⴷ ⵉⵙⵎ ⵏⵏⴽ ⴰⵎⴰⵜⴰⵢ (ex: Mohamed Alaoui)',
    errPhone:'ⴰⵏⵎⵔ ⵓⵔ ⵉⵙⵀⵡⴰ (ex: +212 612 345 678)',
    errCard:'ⵜⴰⴽⴰⵔⴷⵜ ⵓⵔ ⵜⵙⵀⵡⴰ (16 ⵉⵏⵎⵎⴰⵔⵏ)',
    errCardType:'ⵜⴰⴽⴰⵔⴷⵜ ⵓⵔ ⵜⵜⵓⵇⴱⵍ — Visa ⵏⵖ Mastercard',
    errLuhn:'ⴰⵏⵓⵎⵔ ⵏ ⵜⴰⴽⴰⵔⴷⵜ ⵓⵔ ⵉⵍⵓⵍ — ⵅⵛⵎ ⵉⵎⵔⴰⵡⵏ',
    promoLabel:'ⴰⵙⵉⴼⴼⴰⵖ / ⵜⵉⵡⵍⴰⴼⵜ', promoPh:'ⴰⵎⴷⵢⴰ: BRIDGE10', promoApply:'ⵙⴱⴷⴷ',
    promoOk:(d:number)=>` -${d} MAD ⵜⵓⵙⵉⵏ 🎉`, promoErr:'ⴰⵙⵉⴼⴼⴰⵖ ⵓⵔ ⵉⵍⵓⵍ',
    diamondsSection:'💎 ⵉⵎⴰⵙⵙⵏ ⵉⵏⵓ Bridge', diamondsAvail:(n:number)=>`${n} ⵏⵇⴰⵟ (= ${Math.floor(n/200)} MAD)`,
    diamondsUse:'ⵙⴱⴷⴷ ⵖ ⵜⵙⵇⵇⵉⵎⵜ', diamondsNone:'ⵓⵔ ⵉⵍⵍⴰ ⵉⵎⴰⵙ — ⵉⵍⵓ !',
    discountRow:(d:number)=>`ⵜⴰⵙⵇⵇⵉⵎⵜ: -${d} MAD`,
    deliveryFeeRow:'ⵉⵎⵙⴽⴰⵔⵏ ⵏ ⵓⵙⵙⵓⴼⵖ',
    serviceFeeRow:'ⵉⵎⵙⴽⴰⵔⵏ ⵏ ⵓⵙⵙⵉⵍⵓ',
    serviceFeeToggle:'ⵔⵏⵓ ⵉⵎⵙⴽⴰⵔⵏ ⵏ ⵓⵙⵙⵉⵍⵓ',
    serviceFeeDesc:'ⵜⴰⵙⴽⵉⵡⵉⵏⵜ ⵏ ⵜⵏⵙⴽⵉⵡⵜ',
    errExpiry:'ⴰⵣⵎⵣ ⵓⵔ ⵉⵙⵀⵡⴰ (MM/AA)',
    errCardName:'ⵉⵙⵎ ⵏ ⵓⵎⵙⴽⴽⵉ ⵉⵍⵍⴰ',
    paymentTabCard:'💳 ⵜⴰⴽⴰⵔⴷⵜ', paymentTabPaypal:'🅿️ PayPal',
    paypalEmailLabel:'ⵉⵎⵉⵍ PayPal', paypalPh:'example@paypal.com',
    errPaypal:'ⵉⵎⵉⵍ PayPal ⵓⵔ ⵉⵙⵀⵡⴰ',
    savedPaypalLabel:'PayPal ⵉⵜⵜⵓⵙⵎⴷ',
    changePwd:'🔑 ⵙⵏⴼⵍ ⵜⴰⴱⵔⵉⴷⵜ', currentPwd:'ⵜⴰⴱⵔⵉⴷⵜ ⵜⴰⵎⵣⵡⴰⵔⵓⵜ',
    newPwd:'ⵜⴰⴱⵔⵉⴷⵜ ⵜⴰⵎⴰⵢⵏⵓⵜ (8 ⵉⵙⴽⴽⵉⵍⵏ)', confirmPwd:'ⵙⵙⴽⴷⵃ ⵜⴰⴱⵔⵉⴷⵜ ⵜⴰⵎⴰⵢⵏⵓⵜ',
    pwdChanged:'ⵜⵜⵓⵙⵏⴼⵍ ✓', pwdMismatch:'ⵜⵉⴱⵔⵉⴷⵉⵏ ⵓⵔ ⵏⵎⵎⴰⵍⵏ.',
    pwdWeak:'ⵜⴰⴱⵔⵉⴷⵜ ⵓⵔ ⵜⵙⵀⵡⴰ (8 ⵉⵙⴽⴽⵉⵍⵏ).', pwdWrong:'ⵜⴰⴱⵔⵉⴷⵜ ⵜⴰⵎⵣⵡⴰⵔⵓⵜ ⵓⵔ ⵜⵙⵀⵡⴰ.',
    pwdSave:'ⵙⵙⴽⴷⵃ ⵜⴰⴱⵔⵉⴷⵜ',
    trackTitle:'ⴰⵙⴽⵍⵙ GPS', trackZone:'ⵙⴰⴼⵉ · ⴰⴱⵍⴰⵟⵓ', trackLive:'ⴷⴷⴰⵡ',
    stages:['ⵜⵜⵓⵙⵔⵖⴰ','ⵜⴻⵜⵜⵓⵙⴽⴰⵔ','ⵖ ⵓⵣⵔⵉⵔⵉ','ⵜⵜⵓⵙⵍⵎⴷ'],
    stagesSub:['ⵜⵜⵓⵙⵛⴷⵃ ⵜⴰⵖⵓⵍⵜ','ⴰⵎⵓⵙⵙⵓ ⵉⵜⵜⵓⵙⴽⴰⵔ','ⴰⵎⵥⵍⵉ ⵉⵜⵜⴰⵡⵙ','ⵜⵙⴼⵓⵍⵍⵓ!'],
    orderStatus:'ⴰⵙⵉⵡⴷ ⵏ ⵜⴰⵖⵓⵍⵜ', orderNum:'ⵜⴰⵖⵓⵍⵜ #BE-2847',
    eta:'ⴰⴽⵓⴷ ⵏ ⵓⵙⵍⵎⴷ', courierName:'ⴰⵎⵥⵍⵉ Bridge',
    contactTitle:'ⵜⵙⵔⴰ ⵜⵉⵡⵉⵙⵉ?', contactSub:'ⴰⴳⵔⴰⵡ ⴰⵏⵏ ⵉⵍⵍⴰ 7 ⵓⵙⵙⴰⵏ',
    whatsapp:'WA Business', phone:'ⵙⵓⵍ', email:'ⵉⵎⴰⵢⵍ',
    hours:'ⵜⴰⵙⵔⴰⵜ', hoursVal:'8:00 – 23:00',
    navHome:'ⵜⴰⵣⵡⴰⵔⵜ', navTrack:'ⴰⵙⴽⵍⵙ', navContact:'ⴰⵎⵢⴰⵡⴰⴹ', navCart:'ⴰⵙⵡⵉⵔ',
    footer:'© 2026 ⴱⵔⵉⴷⵊ ⵙⴰⴼⵉ · safi-bridge.ma', plateau:'ⴰⴱⵍⴰⵟⵓ · ⵓⵍⵍⴰ ⵏ ⵜⵎⴷⵉⵏⵜ · ⴱⵓⵣⵉⴷⵉ',
    safiExcl:'ⵏ ⵙⴰⴼⵉ', selected:'ⵉⵜⵜⵓⴼⵔⴰ ✓',
    waMsgHeader:'🛍️ ⵜⴰⵖⵓⵍⵜ ⵜⴰⵎⴰⵢⵏⵓⵜ ⵏ ⴱⵔⵉⴷⵊ ⵉⵢⵜⵙ\n\n📦 ⵉⵙⴽⴰⵔⵏ:\n',
    waMsgFooter:(total:number,name:string,addr:string,phone:string)=>`\n💰 ⴰⵎⵎⴰⵙ: ${total} MAD\n\n👤 ⵉⵙⵎ: ${name}\n📍 ⵜⴰⵙⵓⵏⵜ: ${addr}, ⵙⴰⴼⵉ\n📞 ⴰⵙⵓⵍ: ${phone}\n\nⵙⵛⴷ ⵜⴰⵖⵓⵍⵜ ⵉⵏⵓ! 🙏`,
    chooseService:'ⴼⵔ ⵜⴰⵎⵙⴽⴰⵔⵜ',
    deliverySub:'ⴰⵙⵙⵓⴼⵖ ⵣⵔⵉⵔⵉ', taxiSub:'ⵓⵏⵍⵍⵉ ⴷ ⵓⵙⵏⴼⵍ', fleursSub:'ⵉⵣⵓⵍⴰⵏ ⴷ ⵉⵡⴰⵔⴳⵉⵡⵏ',
    pharmaeSub:'ⵉⴹ ⴷ ⵡⴰⵙⵙ 🌙',
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
    qrOption:'ⴰⵣⵔⴼ QR 📲', qrOptionDesc:'ⵙⵃⵓ QR · ⴰⵙⵎⴰⵡ ⵏ ⵓⵙⵉⴷⴼ ⵉⵎⵉⵙⵙⵓ',
    qrModalTitle:'ⵙⵃⵓ ⵉⵍⵍⵉ ⵜⵥⵖ', qrModalSub:'ⵙⵉⵡⵍ ⵉⴱⵔⵉⴷ ⵏ ⵓⴱⴰⵏⴽ ⵏⵏⴽ',
    qrAmountLabel:'ⴰⵣⵔⴼ ⵉⵍⴰⵎⵎⴰⵏ', qrPaid:'ⵥⵖⵖ ✅', qrCancel:'ⴽⵛⵎ',
    qrNote:'ⴰⵙⵎⴰⵡ ⵉⵙⵔⵓⵙ · Bridge Safi',
    hubServices:'ⵉⵙⵙⵓⵜⵓⵔⵏ', hubServicesSub:'ⵉⵜⵙ · ⵜⴰⴽⵙⵉ · ⵜⴰⴱⴰⴽ · ⵉⵥⵓⵍⴰⵏ · ⵜⵉⵙⵙⵏⵜⵉⵜ',
    hubGame:'ⴰⵎⵢⴰⴳⵓ · ⴳⵓⵍⵉ', hubGameSub:'ⵙⵎⵓⵏ ⵉⵎⴰⵙⵙⵏ 💎 → ⵉⵎⵏⵙⵉ ⴰⵎⵙⵜⵓ',
    hubWelcome:'ⵎⵔⵓⵃⴱⴰ',
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

// ─── HELPERS DATA GLOVO ─────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _n=(s:string)=>({fr:s,en:s,ar:s,amz:s}) as ML;

const _ue=(s:string)=>{try{return JSON.parse('"'+s+'"');}catch{return s;}};
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
  // ─── OTHER RESTAURANTS
  // ─── RESTAURANTS SAFI (Glovo) ───────────────────────────────────────────────
  {
    id:"les-maitres-du-pain-boulangerie-patisserie-asf",name:"Les Ma\\u00eetres du Pain",
    tagline:_n("Les Maîtres du Pain · Safi"),
    logo:"\\ud83e\\udd50",cover:_gp("6abaa6dac9b8907ecc7f35e62f9b788a29c27920a828db6c4f07f1f80e983074"),
    cuisine:_n("Bakery & Pastry"),tags:["bakery", "breakfast"],
    rating:0,deliveryTime:"15\\u201325",minOrder:25,
    address:'Safi, Maroc',
    categories:[
      {id:"topdesvent_0",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Top des ventes"),items:[
        {id:"lesm_0_0",names:_n("Trompe l'oeil mangue"),price:32,photo:_gp("")},
        {id:"lesm_0_1",names:_n("Miellefille Praliné"),price:23,photo:_gp("")},
        {id:"lesm_0_2",names:_n("Pecaramel"),price:29,photo:_gp("")},
        {id:"lesm_0_3",names:_n("Croquant amande"),price:29,photo:_gp("")},
        {id:"lesm_0_4",names:_n("Trompe l'oeil citron"),price:32,photo:_gp("")},
        {id:"lesm_0_5",names:_n("Miellefille café"),price:23,photo:_gp("")},
        {id:"lesm_0_6",names:_n("Royal chocolat"),price:32,photo:_gp("")},
        {id:"lesm_0_7",names:_n("Tout chocolat"),price:32,photo:_gp("")},
      ]},
      {id:"viennoiser_1",emoji:"\\ud83e\\udd50",names:_n("Viennoiseries"),items:[
        {id:"lesm_1_0",names:_n("Mini chausson aux amandes"),price:8,photo:_gp("")},
        {id:"lesm_1_1",names:_n("Pain au chocolat"),price:9,photo:_gp("6abaa6dac9b8907ecc7f35e62f9b788a29c27920a828db6c4f07f1f80e983074")},
        {id:"lesm_1_2",names:_n("Mini pain au chocolat"),price:6,photo:_gp("ca317cc15611b19506daafd65e85a9a3dfef0bf637a2bb9e84ec93cd7e54f505")},
      ]},
      {id:"flashmille_2",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Flash millefeuille"),items:[
        {id:"lesm_2_0",names:_n("Miellefille Praliné"),price:23,photo:_gp("")},
        {id:"lesm_2_1",names:_n("Miellefille café"),price:23,photo:_gp("")},
      ]},
      {id:"ptisserie_3",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Pâtisserie"),items:[
        {id:"lesm_3_0",names:_n("Tarte poire"),price:26,photo:_gp("")},
        {id:"lesm_3_1",names:_n("Tarte peche"),price:26,photo:_gp("")},
        {id:"lesm_3_2",names:_n("Tarte fruis secs"),price:26,photo:_gp("")},
        {id:"lesm_3_3",names:_n("Trompe l'oeil mangue"),price:32,photo:_gp("")},
        {id:"lesm_3_4",names:_n("Trompe l'oeil orange"),price:28,photo:_gp("")},
        {id:"lesm_3_5",names:_n("Tout chocolat"),price:32,photo:_gp("")},
        {id:"lesm_3_6",names:_n("Croquant amande"),price:29,photo:_gp("")},
        {id:"lesm_3_7",names:_n("Forêt-noire"),price:29,photo:_gp("")},
        {id:"lesm_3_8",names:_n("Sacher framboise"),price:32,photo:_gp("")},
        {id:"lesm_3_9",names:_n("Exotique"),price:30,photo:_gp("")},
        {id:"lesm_3_10",names:_n("Royal chocolat"),price:32,photo:_gp("")},
        {id:"lesm_3_11",names:_n("neige au citron"),price:29,photo:_gp("")},
        {id:"lesm_3_12",names:_n("Pecaramel"),price:29,photo:_gp("")},
        {id:"lesm_3_13",names:_n("Casse noisette"),price:29,photo:_gp("")},
        {id:"lesm_3_14",names:_n("Charlotte"),price:32,photo:_gp("")},
        {id:"lesm_3_15",names:_n("Cheesecake citron"),price:29,photo:_gp("")},
        {id:"lesm_3_16",names:_n("cheesecake framboise"),price:29,photo:_gp("")},
        {id:"lesm_3_17",names:_n("Trompe l'oeil citron"),price:32,photo:_gp("")},
        {id:"lesm_3_18",names:_n("Tarte citron"),price:26,photo:_gp("")},
      ]},
      {id:"sal_4",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Salé"),items:[
        {id:"lesm_4_0",names:_n("Croissant jambon fromage"),price:22,photo:_gp("")},
      ]},
      {id:"cafeteria_5",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Cafeteria"),items:[
        {id:"lesm_5_0",names:_n("Espresso"),price:17,photo:_gp("")},
        {id:"lesm_5_1",names:_n("Espresso aromatisé"),price:21,photo:_gp("")},
        {id:"lesm_5_2",names:_n("Double espresso"),price:22,photo:_gp("")},
        {id:"lesm_5_3",names:_n("Americano"),price:17,photo:_gp("")},
        {id:"lesm_5_4",names:_n("Café crème"),price:21,photo:_gp("")},
        {id:"lesm_5_5",names:_n("Lait au chocolat"),price:18,photo:_gp("")},
        {id:"lesm_5_6",names:_n("Cappuccino"),price:22,photo:_gp("")},
        {id:"lesm_5_7",names:_n("cappuccino"),price:26,photo:_gp("")},
        {id:"lesm_5_8",names:_n("Chocolat fondu"),price:26,photo:_gp("")},
        {id:"lesm_5_9",names:_n("Chocolat fondu"),price:28,photo:_gp("")},
        {id:"lesm_5_10",names:_n("Ice latè"),price:28,photo:_gp("")},
        {id:"lesm_5_11",names:_n("Spanish latè"),price:30,photo:_gp("")},
        {id:"lesm_5_12",names:_n("Ice spanish"),price:32,photo:_gp("")},
      ]},
      {id:"jusfrais_6",emoji:"\\ud83e\\uddc3",names:_n("Jus frais"),items:[
        {id:"lesm_6_0",names:_n("Jus citron"),price:20,photo:_gp("")},
        {id:"lesm_6_1",names:_n("jus orange"),price:21,photo:_gp("")},
        {id:"lesm_6_2",names:_n("Jus citron gingembre"),price:21,photo:_gp("")},
        {id:"lesm_6_3",names:_n("Jus banane"),price:22,photo:_gp("")},
        {id:"lesm_6_4",names:_n("jus fraise"),price:28,photo:_gp("")},
        {id:"lesm_6_5",names:_n("Jus avocat"),price:31,photo:_gp("")},
        {id:"lesm_6_6",names:_n("Panachè"),price:28,photo:_gp("")},
      ]},
      {id:"lesmojitos_7",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Les mojitos"),items:[
        {id:"lesm_7_0",names:_n("Mojito classic"),price:26,photo:_gp("")},
        {id:"lesm_7_1",names:_n("Mojito Fraise"),price:28,photo:_gp("")},
        {id:"lesm_7_2",names:_n("Mojito Bleu"),price:28,photo:_gp("")},
        {id:"lesm_7_3",names:_n("Mojito Tropical"),price:32,photo:_gp("")},
        {id:"lesm_7_4",names:_n("Mojito fruit rouge"),price:32,photo:_gp("")},
      ]},
      {id:"cakes_8",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Cakes"),items:[
        {id:"lesm_8_0",names:_n("Moyen cake"),price:41,photo:_gp("")},
        {id:"lesm_8_1",names:_n("Mini cake"),price:26,photo:_gp("")},
      ]},
      {id:"entremets_9",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Entremets"),items:[
        {id:"lesm_9_0",names:_n("Casse noisette"),price:296,photo:_gp("")},
        {id:"lesm_9_1",names:_n("Pecaramel"),price:296,photo:_gp("")},
        {id:"lesm_9_2",names:_n("Exotique"),price:296,photo:_gp("")},
        {id:"lesm_9_3",names:_n("Sacher framboise"),price:296,photo:_gp("")},
      ]},
      {id:"lesplateau_10",emoji:"\\ud83d\\udca7",names:_n("Les plateaux"),items:[
        {id:"lesm_10_0",names:_n("Plateau gâteaux de soirée"),price:218,photo:_gp("")},
        {id:"lesm_10_1",names:_n("Plateau gâteaux marocaine amande"),price:314,photo:_gp("")},
      ]},
    ],
  },
  {
    id:"karam-al-cham",name:"Karam Al Cham",
    tagline:_n("Karam Al Cham · Safi"),
    logo:"\\ud83e\\udd59",cover:_gp("806f8a171e5a0cd882039cdcc7f7eb776a8388d4e184295edc64a11d564bb7c3"),
    cuisine:_n("Syrian Cuisine"),tags:["syrian", "chawarma"],
    rating:0,deliveryTime:"25\\u201335",minOrder:40,
    address:'Safi, Maroc',
    categories:[
      {id:"promotions_0",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Promotions"),items:[
        {id:"kara_0_0",names:_n("Sandwich Shawarma Mixte +Kefta Chamia + 2 Dessert & Limonade Libanaise"),price:135,photo:_gp("806f8a171e5a0cd882039cdcc7f7eb776a8388d4e184295edc64a11d564bb7c3")},
        {id:"kara_0_1",names:_n("Sandwich Shawarma Poulet + Dessert + Limonade Libanaise"),price:86,photo:_gp("748084c67643824f75d2cabf1d45587a72f7525d7db17494e9150b3bbf089462")},
        {id:"kara_0_2",names:_n("Sandwich Sarokhe Shawarma Mixte + Dessert + Limonade Libanaise"),price:100,photo:_gp("1cab7d39aca017abdf2b1351d4c62d0ffaba2979389b8ff3f3b7c78ad34a2a97")},
      ]},
      {id:"pizza_1",emoji:"\\ud83c\\udf55",names:_n("Pizza"),items:[
        {id:"kara_1_0",names:_n("Pizza Fruits De Mer"),price:86,photo:_gp("f5380597fbdcf4aabb621a0673db0cb00ebab34c08252767c1dbbc1ddedfd310")},
        {id:"kara_1_1",names:_n("Pizza 4 Saisons"),price:86,photo:_gp("1461c21a4fce9da16624370de0764a22abe275584d614f4a39f58280f09a9d3e")},
        {id:"kara_1_2",names:_n("Pizza Royale"),price:86,photo:_gp("f86a6c02e6541c88ae3e0347507d8f27de9c84d74de0c1c466fb09936ea4c09b")},
        {id:"kara_1_3",names:_n("Pizza Viande Hachée"),price:65,photo:_gp("c8bab7d28a76287509fbf9881dced592ef4556b112def1b34546eb7bacf1c176")},
        {id:"kara_1_4",names:_n("Pizza Poulet"),price:59,photo:_gp("bbc4855024de5a6f76e822ab50a4e4781d80d1700ba560bd85c9a2b0380fc861")},
        {id:"kara_1_5",names:_n("Pizza Végétarienne"),price:57,photo:_gp("350b2e7bb589c372e3658f9d41361e7d819b1cc7ec53024ab852b714ec472b73")},
        {id:"kara_1_6",names:_n("Pizza Thon"),price:55,photo:_gp("a6f149450f04b0796f0b704eb528d59d020c1641484db127bc9f7b138b5053cb")},
        {id:"kara_1_7",names:_n("Pizza Margherita"),price:47,photo:_gp("062e7c2b19e72258d006573e350c430bd4621a80619dd205a078d6081efe5dc5")},
      ]},
      {id:"platsturcs_2",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Plats Turcs"),items:[
        {id:"kara_2_0",names:_n("Kebab Adana"),price:86,photo:_gp("e4314654a71b95f35f9fe69ebd7884a4277a08af549f4b950889b8aab2308b0c")},
        {id:"kara_2_1",names:_n("Kebab Urfa"),price:86,photo:_gp("76cabee25501886a382850aca03944750fbca0572435302b4446f1d24862c3c8")},
        {id:"kara_2_2",names:_n("Kebab à l'Aubergine"),price:86,photo:_gp("001a6ca7c8fdcf21c6ab2f4213c97a18ff90ebd6ec62e9c53a9ed88e388af632")},
        {id:"kara_2_3",names:_n("Lahmacun Turc"),price:86,photo:_gp("e96114ec12737e3df29daee2c35a53069df32c5816b70b152402bc41664ad32a")},
        {id:"kara_2_4",names:_n("Tochka"),price:86,photo:_gp("e7a0b835032176638f6244f86cec9992f4c9c66dde99086d25ae4d5db20f083c")},
        {id:"kara_2_5",names:_n("Coquelet Poulet"),price:85,photo:_gp("27ff6674f626b40333e691c5aa537957f5f0c1975bfadacb80376744c3f95d18")},
        {id:"kara_2_6",names:_n("Chawarma Turc Poulet"),price:65,photo:_gp("1512931776d286c8229119404706a01ae1d43aa9b1bce1a3ca05ca46bfc90d95")},
      ]},
      {id:"platskhali_3",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Plats Khaliji"),items:[
        {id:"kara_3_0",names:_n("Extra Kabsah Poulet"),price:174,photo:_gp("1c8c7167a996ca291fc399b3e37817323d6ed1aaa37350839c8d277fb36ebb0f")},
        {id:"kara_3_1",names:_n("Kabsah Poulet Extra"),price:170,photo:_gp("ec2ae26cf79e2765963550f406f6b11692d5c6b53f166440d120ea3fa42184f9")},
        {id:"kara_3_2",names:_n("Kabsah Kefta Grillée"),price:122,photo:_gp("bdbbff5e2c4b4168ed483a5372ab983e99a12e206650ef41e972fcfc45dd2e8e")},
        {id:"kara_3_3",names:_n("Kabsah Kabab Khachkhach"),price:122,photo:_gp("8cc37ff58af20d1c4a582224d3a341ffcb1f875ba7e8ece33ab33cff01157fdd")},
        {id:"kara_3_4",names:_n("Kabsah Chiche Taouk"),price:122,photo:_gp("09939b779e2c233d5fae1f4958e4945aea2f86f13194290e77d713eea0db08c2")},
        {id:"kara_3_5",names:_n("Kabsah Poulet Extra (127)"),price:110,photo:_gp("4119323c2370125dbe8e04a2998d941b63d4e9ac4b96b6ca3be43bc477625745")},
        {id:"kara_3_6",names:_n("Kabsah Kefta Poulet"),price:110,photo:_gp("7447ba80c2bc3e16c58fb86135ba8b8c74ecdb174f5aee4f4b8f40d952becc35")},
        {id:"kara_3_7",names:_n("Kabsah Crispy"),price:110,photo:_gp("4fdb671f48757a76dd0211cfd449c82f1fe85bf4fbdf85c18861ee7ca3ba7977")},
        {id:"kara_3_8",names:_n("Kabsah Wings Grillés"),price:110,photo:_gp("8d5abe433be626c10a9c3e485da1a99f037baa8bc16f5f732c12b0cc71c3b8dd")},
        {id:"kara_3_9",names:_n("Kabsah Poulet"),price:108,photo:_gp("ecec405be6f645a88e11018bec564f5df769851831a72f688628c84e04af2a03")},
        {id:"kara_3_10",names:_n("Plat Riz"),price:57,photo:_gp("6cef1b52f3077ed8854ea8792ebc5e8eae7196dcde830e58b5b1e3c047865d36")},
      ]},
      {id:"glovopromo_4",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Glovopromos"),items:[
        {id:"kara_4_0",names:_n("Sandwich Shawarma Mixte +Kefta Chamia + 2 Dessert & Limonade Libanaise"),price:135,photo:_gp("806f8a171e5a0cd882039cdcc7f7eb776a8388d4e184295edc64a11d564bb7c3")},
        {id:"kara_4_1",names:_n("Plat Chawarma Poulet + Dessert + Limonade Libanaise"),price:126,photo:_gp("68a41efa1d1496e951534fae79361d5a4406e84dea830919069c7016b9795534")},
        {id:"kara_4_2",names:_n("Sandwich Sarokhe Shawarma Mixte + Dessert + Limonade Libanaise"),price:100,photo:_gp("1cab7d39aca017abdf2b1351d4c62d0ffaba2979389b8ff3f3b7c78ad34a2a97")},
        {id:"kara_4_3",names:_n("Sandwich Sarokhe Shawarma Poulet + Dessert + Limonade Libanaise"),price:93,photo:_gp("d580731f44f0e0fcf432556f738a62bbfd5c979a4c2da59533f62a8684598b09")},
        {id:"kara_4_4",names:_n("Sandwich Viande Hachée Libanaise + Dessert + Limonade Libanaise"),price:92,photo:_gp("de624f045bb6dcdfefdb059d865e610e4fa1d549959a34cb9b686529f32fff1d")},
        {id:"kara_4_5",names:_n("Sandwich Shawarma Poulet + Dessert + Limonade Libanaise"),price:86,photo:_gp("748084c67643824f75d2cabf1d45587a72f7525d7db17494e9150b3bbf089462")},
      ]},
      {id:"menusspcia_5",emoji:"\\ud83e\\udd61",names:_n("Menus Spéciaux"),items:[
        {id:"kara_5_0",names:_n("Sandwich Au Choix"),price:56,photo:_gp("1907a0a125f62c6652172bce9c89b263690483b5d81cf59cc3dea126bf812b23")},
        {id:"kara_5_1",names:_n("Humburger"),price:54,photo:_gp("ca6970906c604e9faa294371c03b7d6a927df19167358c08695d3417063c5338")},
      ]},
      {id:"salades_6",emoji:"\\ud83e\\udd57",names:_n("Salades"),items:[
        {id:"kara_6_0",names:_n("Salade Chawarma"),price:44,photo:_gp("99068fa008a7028f0de4e8747e9dafbec42a8b2a79d84e776297d9f5418f4f70")},
      ]},
      {id:"nossalades_7",emoji:"\\ud83e\\udd57",names:_n("Nos Salades"),items:[
        {id:"kara_7_0",names:_n("Salade de Thon"),price:45,photo:_gp("533213cf2615409ffb7738ac9a307e362fd76766c70942bf5e9b55602a2a4b0e")},
        {id:"kara_7_1",names:_n("Salade de Poulet"),price:45,photo:_gp("bf1a6574c8aa32a37f18ce035b4617389d536fdb6b8cfad1874c57c64edddd9d")},
        {id:"kara_7_2",names:_n("Fattouche"),price:33,photo:_gp("cac793107a3b2cddbc59e88fcb34dc4c38efe768e4259528b91fe5704f1ae76f")},
        {id:"kara_7_3",names:_n("Salade Chamia"),price:33,photo:_gp("a8a7f67ea9037ca6eb350eb389a928207268cedbce31de021350a37b6c7c1c7c")},
      ]},
      {id:"nosentresf_8",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Nos Entrées Froides"),items:[
        {id:"kara_8_0",names:_n("Plat Mezze Libanaise Mixte"),price:102,photo:_gp("376b066af8a371d80e96d83b35744a017095a6c482942d4bb38f89ce9d4ca8e9")},
        {id:"kara_8_1",names:_n("Warak Inab"),price:42,photo:_gp("8c6ba0e5459c2b8cef1327bc2568595a9d4937ee80fa71472e677fed3058138e")},
        {id:"kara_8_2",names:_n("Hommos Tahina"),price:36,photo:_gp("f49ebd9464bcdbdc081f351c638c1e12a1ac88a9b2a954681b5cec077f93e1de")},
        {id:"kara_8_3",names:_n("Baba Ghanouj"),price:36,photo:_gp("5e4d6d781517f5e9a614d2601215d7c210f6f473dd8555ea0b29e737dc7f35bf")},
        {id:"kara_8_4",names:_n("Assiette à l'ail"),price:22,photo:_gp("17c9c06746e6a98648ee78735bba8a7f9881ff3665c1bff9c9b9b5653424a163")},
      ]},
      {id:"nosentresc_9",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Nos Entrées Chaudes"),items:[
        {id:"kara_9_0",names:_n("Kebbé"),price:56,photo:_gp("c82fc9d31becf34b7d88e158e5d8acb6282d4d229a7cb286e447e93a4212477c")},
        {id:"kara_9_1",names:_n("Plat Falafel"),price:50,photo:_gp("c3704ceb5a8403f757bd8e0f8dde2486477e7bef2407d6fbbcf42e351a6f926a")},
        {id:"kara_9_2",names:_n("Fatayer aux épinards"),price:43,photo:_gp("71507103e560fd8cd6febac1633a5e7d1a5920c71ed8c771b8b243c79d149841")},
        {id:"kara_9_3",names:_n("Sambousek à la viande"),price:43,photo:_gp("eb482ca5798cd4e91d504656ec13d92c8de152d7f3de667b634b55d7448ba4ef")},
        {id:"kara_9_4",names:_n("Fatayer au fromage"),price:43,photo:_gp("f66cd64ddbdb923057d2b7d01f4401117bd82b9befb9e13a2688b2f3c8686a57")},
      ]},
      {id:"nosplats_10",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Nos Plats"),items:[
        {id:"kara_10_0",names:_n("Plat Grillade Mixte - 1 Kg"),price:385,photo:_gp("c3af75ac0b0e0f45e633a08b3fa21035004439199406f4cc74e6f8587a9be15a")},
        {id:"kara_10_1",names:_n("Plat Grillade Mixte - 1/2 Kg"),price:205,photo:_gp("f2cf697e52cc5cb64a31f65e47e9f9a18d85421f0da7fdd3240530a7f312a670")},
        {id:"kara_10_2",names:_n("Plat Mixte Grillades Extra - 4 Brochettes"),price:130,photo:_gp("d97a7dac17d5d2e238b1e3f1bea24cef2f69bd540e6ecf15e8b68f08a1be17a8")},
        {id:"kara_10_3",names:_n("Plat Grillade Mixte - 3 Brochettes"),price:107,photo:_gp("896de0c96170cc04a79f32961170f67990b13f1d11ef3f996449e9b54f315e61")},
        {id:"kara_10_4",names:_n("Plat Kefta Chamia"),price:84,photo:_gp("f440ddc1b86f0d3be02f502bf771d2280612630e848b4ad692beac3260b41faf")},
        {id:"kara_10_5",names:_n("Plat Kebab d'aubergines"),price:84,photo:_gp("ccb41917e2f08d78afe1eac5c08b9ddf5f5334f0c41e9161ddf21f5eced785cb")},
        {id:"kara_10_6",names:_n("Plat Sojok Viande"),price:84,photo:_gp("7056444a30d999d65a2cde07b05abe52a407df6c291c4969e542f224c0996223")},
        {id:"kara_10_7",names:_n("Plat Kabab Khachkhach"),price:84,photo:_gp("1d4459ff67addeaa8c2186eb7d4e1704faba2a1e6fdd42f2666d47fd9345c241")},
        {id:"kara_10_8",names:_n("Plat Shawarma Poulet"),price:82,photo:_gp("4058cdf72fea75c946a9ab546e911220089769e8c1e52811ec10c963d9b89855")},
        {id:"kara_10_9",names:_n("Plat Shawarma Poulet Arabi"),price:82,photo:_gp("b5ee89bc0869c32ba1731f1f652311da3fce0b8fe715241f7c2d838cb46b474c")},
        {id:"kara_10_10",names:_n("Plat Hummus Shawarma Poulet"),price:82,photo:_gp("229d4d091b33083db079eabe535e9ec7e32ba07f41d066c866787af58e659924")},
        {id:"kara_10_11",names:_n("Plat Poulet Kefta Mexicain"),price:82,photo:_gp("732a68c664263a039ee3dcb3f169b854da14a961e3abdabf9d5a7842e360bc6d")},
        {id:"kara_10_12",names:_n("Plat Crispy"),price:82,photo:_gp("b30dd534571d0de2186b7b73c2be35f095482a8729354f61f197dfbe520d0f02")},
        {id:"kara_10_13",names:_n("Plat Chich Taouk"),price:82,photo:_gp("98429b70067a269ca68fa190db86606f2fd83236729993c80f52e18aab89e048")},
        {id:"kara_10_14",names:_n("Plat Ailes de Poulet"),price:78,photo:_gp("aaf762d73bbfc1ff126186de7d4d847db1c541998a2429c36372e5320db5e31b")},
      ]},
      {id:"sandwichs_11",emoji:"\\ud83e\\udd59",names:_n("Sandwichs"),items:[
        {id:"kara_11_0",names:_n("Sandwich Sarokhe Chawarma Poulet"),price:51,photo:_gp("8a22cbc31d76551bcd1ad145a98de70f770ac9bc12dd2beaae4911fa18060546")},
        {id:"kara_11_1",names:_n("Sandwich Kefta Poulet Mexicain"),price:47,photo:_gp("de66e2a2204358c945e7a93878050e13f24a6e2b551c61347c1ea675c86faff1")},
        {id:"kara_11_2",names:_n("Sandwich Crispy"),price:47,photo:_gp("f8e19cfcec7690fc76021cf7926cd8fcfe8686f10c9965aba55dfdedd91111c5")},
        {id:"kara_11_3",names:_n("Sandwich Viande Hachée Libanaise"),price:47,photo:_gp("5a712d5c3a1ef211b95592949bb506ec13b491aaee533abe1acfbb949bfa28ee")},
        {id:"kara_11_4",names:_n("Sandwich Kebab Khachkhach"),price:47,photo:_gp("59adee5c8c006dd2f1ed0b77cd9b0b61034b6fa0dbc72a8370da8825f58cb625")},
        {id:"kara_11_5",names:_n("Sandwich Sojok Viande"),price:47,photo:_gp("6e3221eae90f145ff5e9eb86dc5c9be2692739a5124f215f382d678a37aa95b8")},
        {id:"kara_11_6",names:_n("Sandwich Chiche Taouk"),price:47,photo:_gp("8bcc6a742385eeb0d918975c00dd86cec54f76918a8439d84d71cdbed770133d")},
        {id:"kara_11_7",names:_n("Sandwich Chawarma Poulet"),price:45,photo:_gp("eb874f704d59909354c0cb520316c1f0e0b34933ac18cf1ddf27b4c0b0f3e9d0")},
        {id:"kara_11_8",names:_n("Sandwich Falafel"),price:33,photo:_gp("e4ae8ed9091797b574ff6a717f1a95a211ff353da40cca6bb057285a9d93e631")},
      ]},
      {id:"burgers_12",emoji:"\\ud83c\\udf54",names:_n("Burgers"),items:[
        {id:"kara_12_0",names:_n("Burger Dinosaure Viande"),price:57,photo:_gp("15cc745a7c97fc60068c829bb7f53daf72d2956ce65d24b4df626232cba3c9ae")},
        {id:"kara_12_1",names:_n("Burger Dinosaure Poulet"),price:51,photo:_gp("3ef47b444e3073c0f2ade15e6c54b85b6c043f5a77b7e6dc57c7d585871e71ed")},
      ]},
      {id:"tacos_13",emoji:"\\ud83c\\udf2e",names:_n("Tacos"),items:[
        {id:"kara_13_0",names:_n("Tacos Viande"),price:51,photo:_gp("c209a3c6b3ddeca6b7bdb162e0cc53228fe1d35ab0f32ccf8a5dc61649431169")},
        {id:"kara_13_1",names:_n("Tacos Mixte"),price:51,photo:_gp("c209a3c6b3ddeca6b7bdb162e0cc53228fe1d35ab0f32ccf8a5dc61649431169")},
        {id:"kara_13_2",names:_n("Tacos Crispy"),price:50,photo:_gp("c209a3c6b3ddeca6b7bdb162e0cc53228fe1d35ab0f32ccf8a5dc61649431169")},
        {id:"kara_13_3",names:_n("Tacos Poulet"),price:47,photo:_gp("c209a3c6b3ddeca6b7bdb162e0cc53228fe1d35ab0f32ccf8a5dc61649431169")},
        {id:"kara_13_4",names:_n("Tacos Falafel"),price:44,photo:_gp("c209a3c6b3ddeca6b7bdb162e0cc53228fe1d35ab0f32ccf8a5dc61649431169")},
      ]},
      {id:"boissons_14",emoji:"\\ud83e\\udd64",names:_n("Boissons"),items:[
        {id:"kara_14_0",names:_n("Laban Ayran"),price:18,photo:_gp("ae0a1bfe10b5109e64d47917139cd74d53d655e958cbcd54affec0e73b8bcc8c")},
        {id:"kara_14_1",names:_n("Jus D'orange Naturel"),price:18,photo:_gp("1e4a6420f5b20bf54abc82fd25f4966c2e7a4bed9c10bec5e2d738f6734b098c")},
        {id:"kara_14_2",names:_n("Limonade Libanaise"),price:14,photo:_gp("d9f8424dd3f1405ad86b359bfd1157bf62edad8ca30f96f9b5b717b0e38d7ef7")},
        {id:"kara_14_3",names:_n("Soda 33 Cl"),price:13,photo:_gp("6a56248046035d2260372a48a8593de6f0bf0c8042610bbedaa0dcaabf1edebc")},
        {id:"kara_14_4",names:_n("Eau Minérale"),price:8,photo:_gp("cde37ff9608be88615605d87872e489cfb458301660b027e51f3e11ab6541162")},
        {id:"kara_14_5",names:_n("Oulmès"),price:8,photo:_gp("016298ea66073282c63ac4f9b3ece22318843f459024689327ee734641c5dba1")},
      ]},
      {id:"desserts_15",emoji:"\\ud83c\\udf70",names:_n("Desserts"),items:[
        {id:"kara_15_0",names:_n("Mahalabia Chamia"),price:22,photo:_gp("27bd032ef1171fe68279c84f409965f1526b750af1d7c952d3b0dd8e7be7e6ea")},
        {id:"kara_15_1",names:_n("Baklawa Au Noix"),price:20,photo:_gp("53d3f5f8b4057351159530238df620f23f1d4e4d8ee80ec65ecfb1c5f1999f66")},
        {id:"kara_15_2",names:_n("Basboussa aux fruits secs"),price:20,photo:_gp("8ce3ad10d52a835e41cc9a154f199670917519809a8d6e04e23f0bb32a2625a9")},
        {id:"kara_15_3",names:_n("Konafa à la Crème"),price:20,photo:_gp("7fd9f847f4f5f8e793f01cb579b97a2a96f5738bc33aebfcdaa87ebf15c4ba36")},
        {id:"kara_15_4",names:_n("Ouch El Boulboul"),price:20,photo:_gp("5c60f61aeeb1bbb13348a68e0b4a1df24fd0ebf06df6e8f4b2fea1424c90f981")},
      ]},
    ],
  },
  {
    id:"cheese-taste-asf",name:"Cheese taste",
    tagline:_n("Cheese taste · Safi"),
    logo:"\\ud83e\\uddc0",cover:_gp("0bf904b5052a4e638504a45838f0f3e11f63700558bb59eb3747c0f5a9f81004"),
    cuisine:_n("Cheese & Fast Food"),tags:["burger", "cheese"],
    rating:0,deliveryTime:"20\\u201330",minOrder:35,
    address:'Safi, Maroc',
    categories:[
      {id:"topdesvent_0",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Top des ventes"),items:[
        {id:"chee_0_0",names:_n("Tacos Poulet"),price:35,photo:_gp("0bf904b5052a4e638504a45838f0f3e11f63700558bb59eb3747c0f5a9f81004")},
        {id:"chee_0_1",names:_n("Pizza Poulet"),price:35,photo:_gp("d62a4680568793c57b044e581f358ec5bc5e7c494b3e11e0ee3f5b16c3559fae")},
        {id:"chee_0_2",names:_n("pizza 4 saison"),price:48,photo:_gp("a8b7034736a529e16fa0e5d486f5daacbb373a2176fb0a57cc4c5e82348782db")},
      ]},
      {id:"sandwichs_1",emoji:"\\ud83e\\udd59",names:_n("Sandwichs"),items:[
        {id:"chee_1_0",names:_n("Sandwich Fruit De Mer"),price:35,photo:_gp("94ec22f5489d100fe7e60e2a0786304f06b943dc934e0e688e27c5b1d682b363")},
        {id:"chee_1_1",names:_n("Sandwich Poulet"),price:31,photo:_gp("a7eee522341d771bfe3db1f9f00171a034d7c3783509969560de19f0fc8a64ae")},
        {id:"chee_1_2",names:_n("Sandwich Viande Hachée"),price:31,photo:_gp("7abd4cbe065c8a5f7d84b8dc9fe54fbdfa9e92c2b19ad18e2aacc7499392e3c6")},
        {id:"chee_1_3",names:_n("Sandwich Thon"),price:29,photo:_gp("adcace4e3c8a8dd933bf795a1e2546fdec162f4421d6f73bfbc73cabc381d487")},
      ]},
      {id:"tacos_2",emoji:"\\ud83c\\udf2e",names:_n("Tacos"),items:[
        {id:"chee_2_0",names:_n("Tacos Viande Hachée"),price:39,photo:_gp("b0b0427f0a1f23f84ba87dc9899e509356612df26e74ee8cfa4192c0f74ae94d")},
        {id:"chee_2_1",names:_n("Tacos Mixte"),price:39,photo:_gp("0895dacc86f56d99d34fc6d502929769148b209f496711e8ecca4c91c4b76463")},
        {id:"chee_2_2",names:_n("Tacos Fruit De Mer"),price:39,photo:_gp("326f0d84efd87944a6999d7fc479b239c786e28e76b4ad986eb7bca6f4b225ba")},
        {id:"chee_2_3",names:_n("Tacos Cordon Bleu"),price:39,photo:_gp("c9b2b1c28120f477d069c0d7cdc5b34fabac0c7ce7a0f66f4beb0b19b78e003d")},
        {id:"chee_2_4",names:_n("Tacos Poulet"),price:35,photo:_gp("0bf904b5052a4e638504a45838f0f3e11f63700558bb59eb3747c0f5a9f81004")},
        {id:"chee_2_5",names:_n("Tacos Nugget"),price:35,photo:_gp("9d4be346ab44082e49ba8bcf0bd2d5f7f2f97b0509ed8c8a4c9262ec568a28f2")},
      ]},
      {id:"burgers_3",emoji:"\\ud83c\\udf54",names:_n("Burgers"),items:[
        {id:"chee_3_0",names:_n("Cheese Taste Burger"),price:48,photo:_gp("453c67515d009ac11bb8a7b621dc81a32bf19e75e996fcb2a540023f8b0b53b0")},
        {id:"chee_3_1",names:_n("Chicken Burger"),price:35,photo:_gp("5afcfde194295fcbd352fe53be0146b49e21ef951719c8cb18e9abf9a059f70b")},
        {id:"chee_3_2",names:_n("Beef Burger"),price:35,photo:_gp("e1e39ce7db932c0af8f16c28283dc5e42cde342f2c4ec88b284bce2c3341c1f0")},
      ]},
      {id:"pasticcios_4",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Pasticcios"),items:[
        {id:"chee_4_0",names:_n("Pasticcio Fruit De Mer"),price:39,photo:_gp("cf025171112a914d40e2a7cfd0538bc142b8ad31873f93d6f8920d1218a7d4ca")},
        {id:"chee_4_1",names:_n("Pasticcio Mixte"),price:35,photo:_gp("646da2ce94d28d0ead968874154845f33d3d142edfef024efa165b48b331fc2f")},
        {id:"chee_4_2",names:_n("Pasticcio Viande Hachée"),price:31,photo:_gp("b01b5b1606d675195a4fdd765d994f52b21722da60572ce76ac5ee36ba388a22")},
        {id:"chee_4_3",names:_n("Pasticcio Charcuterie"),price:26,photo:_gp("23492f2c38bf15380896a0a4f86d4474867d98003b0297f451394e18a160630c")},
        {id:"chee_4_4",names:_n("Pasticcio Poulet"),price:26,photo:_gp("311e7decd2e4a5c4975178557a6102439228d1ce609aba9c3dd9b92b9833805b")},
      ]},
      {id:"kumpir_5",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Kumpir"),items:[
        {id:"chee_5_0",names:_n("kumpir mixte"),price:44,photo:_gp("8d107db8c76616e20041462e2629532a6ae75655d9b8a587f36308ee99859bc1")},
        {id:"chee_5_1",names:_n("Kumpir Jambon"),price:39,photo:_gp("d27a8778d2b80b952dfc05270d4f33ea8d3ffc6bbf34c02084a523541c0892ef")},
        {id:"chee_5_2",names:_n("Kumpir Poulet"),price:39,photo:_gp("8a57b2977b4fe366a235554d44631c132304b18e0f93522f2c2ba025fc30372e")},
        {id:"chee_5_3",names:_n("Kumpir Viande Hachée"),price:39,photo:_gp("cee2725d5dbea11a26a98df6f3c86a98888474626548ccb947c408b7e6e308b4")},
        {id:"chee_5_4",names:_n("kumpir thon"),price:31,photo:_gp("8d107db8c76616e20041462e2629532a6ae75655d9b8a587f36308ee99859bc1")},        {id:"chee_5_5",names:_n("Kumpir Végétarien"),price:26,photo:_gp("cab9d696e62d0e5f966f3a229c8c4722e89134e035f355c79a9e88984e88b09b")},
      ]},
      {id:"pokebowl10_6",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Poke Bowl 100 % Healthy"),items:[
        {id:"chee_6_0",names:_n("Poke Bowl Saumon"),price:48,photo:_gp("73d9e18bd7de2e957cdf7db9b67305873c664f18cd0a2427ffb4a658a32dfc64")},
        {id:"chee_6_1",names:_n("Poke Bowl Fruit De Mer"),price:39,photo:_gp("376dd3bc1ec638d2904546f2235905f76a22b9ab93fa22edad6e875b0383e3e9")},
        {id:"chee_6_2",names:_n("Poke Bowl Hawaï"),price:35,photo:_gp("9969eb32ca722dff8bb39eb341b147ff20ddc51d25a943be04b2dbaa04dc328d")},
      ]},
      {id:"pizzas_7",emoji:"\\ud83c\\udf55",names:_n("Pizzas"),items:[
        {id:"chee_7_0",names:_n("pizza 4 saison"),price:48,photo:_gp("a8b7034736a529e16fa0e5d486f5daacbb373a2176fb0a57cc4c5e82348782db")},
        {id:"chee_7_1",names:_n("Pizza Saumon"),price:48,photo:_gp("7bd0fb98894d8385f6bffb190b73d4d20da4ec1cd0040063d0df40fcbc342c65")},
        {id:"chee_7_2",names:_n("Pizza Fruit De Mer"),price:44,photo:_gp("cdae79b75167b7205bc6ddde02c8273224f847e31d07fd7037bbae9cb7d4ae8d")},
        {id:"chee_7_3",names:_n("Pizza 4 Fromage"),price:39,photo:_gp("d37d60d67079df21d3e227b4d305c857ff54ef40bfc55debe3ba38d7396a3be6")},
        {id:"chee_7_4",names:_n("Pizza Salami"),price:39,photo:_gp("c7ed5d004ebc7593ac5c7515bf591b1f2a6e071056687970c47aa95274f41ee9")},
        {id:"chee_7_5",names:_n("Pizza Hawaï"),price:39,photo:_gp("a8197c663222fcf8eb4b4ff158b72ee5223b0ec5c9b492e44fec8648f91d91e5")},
        {id:"chee_7_6",names:_n("Pizza Viande Hachée"),price:39,photo:_gp("0e5385046f75c567006454a1f85c6e63da2f7ff4b6c5c571d351ac90f8ba37d5")},
        {id:"chee_7_7",names:_n("Pizza Poulet"),price:35,photo:_gp("d62a4680568793c57b044e581f358ec5bc5e7c494b3e11e0ee3f5b16c3559fae")},
        {id:"chee_7_8",names:_n("Pizza Tono"),price:35,photo:_gp("a0d1bd0b9ab2daad5e45e8e19df02f9251054e380a0847cf12649b43f1f406d3")},
        {id:"chee_7_9",names:_n("Pizza Margherita"),price:31,photo:_gp("5862cee0e8511f3cbbe1fdd66b93cec1c8d916398bab61f24eaead2962c9931a")},
      ]},
      {id:"calzones_8",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Calzones"),items:[
        {id:"chee_8_0",names:_n("Calzone Viande"),price:48,photo:_gp("6a96793ace94d8b8f390fd6c9b9c15ff8fd5fa0068eb8ca5e7b5eab820d57d8b")},
        {id:"chee_8_1",names:_n("Calzone Mixte"),price:48,photo:_gp("1995bc5a68e36a3650efe1c2fca3efda6b1880a08bd83f30d55cfd54c4714f95")},
        {id:"chee_8_2",names:_n("Calzone Poulet"),price:39,photo:_gp("3914f5221a359c60675b8616eef4b065d59bd7187ed2f7204683dd8107974934")},
      ]},
      {id:"lespates_9",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Les Pates"),items:[
        {id:"chee_9_0",names:_n("Lasagne"),price:52,photo:_gp("a99554ab1677778045b7b84f9585682c7afa1d328754e823acc6243fcafb0206")},
        {id:"chee_9_1",names:_n("Pâte Fruit De Mer"),price:48,photo:_gp("2e4fac767bc53508d49fdb6f11dd4a8b032063126b1c4177de32b35785db6572")},
        {id:"chee_9_2",names:_n("Pâte Poulet"),price:44,photo:_gp("f6a3ab9b49b35d1d14be016783de82deae280624cd5f9ebfd4b64f4d4df027cc")},
        {id:"chee_9_3",names:_n("Pâte 4 Fromages"),price:44,photo:_gp("4e76a57116c280bd881dccbd9642cd15844e1716e236cbbb83c3a35d46702083")},
        {id:"chee_9_4",names:_n("Pâte Bolognaise"),price:39,photo:_gp("1be09a8d5edb2ab07eff6f161dec6ccaa9cac0c9914e1247df15366eca176504")},
      ]},
      {id:"lesplats_10",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Les Plats"),items:[
        {id:"chee_10_0",names:_n("Cordon Bleu"),price:57,photo:_gp("f90e16196aee98934f6abcf690676751a18c017a6fd01961b6054c6a34613772")},
        {id:"chee_10_1",names:_n("Emince De Poulet"),price:52,photo:_gp("a7f451d3811fd3989caa8d784b6565af4ca1a06d50aeb8fb7fbcd410f62e1864")},
        {id:"chee_10_2",names:_n("Crispy Chicken"),price:48,photo:_gp("9d12d23095c65368c49271b114525acf355b4740b0da92269024baa63a359ec4")},
        {id:"chee_10_3",names:_n("Chicken Wings"),price:39,photo:_gp("e2cc8ec2abfa184c5f233559a5ce5d595eeddb2435f2ed748aec9923bafc1a3e")},
        {id:"chee_10_4",names:_n("Filet Dinde"),price:39,photo:_gp("6aa0946d340526e50ba36ed63abfa3ffc62bc9e49de5a4178e6320686a146ceb")},
      ]},
      {id:"gratins_11",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Gratins"),items:[
        {id:"chee_11_0",names:_n("Gratin Fruit De Mer"),price:48,photo:_gp("10012b4df0faff15342da400d0d63d2b9910cd626d7d05baaf5ab90c1a051d45")},
        {id:"chee_11_1",names:_n("Gratin Viande Hachée"),price:44,photo:_gp("f059dde3fa14e75b7f216e3ba753485592e6f04f8f40f2ee7cf0b8b4b004f919")},
        {id:"chee_11_2",names:_n("Gratin Poulet"),price:39,photo:_gp("3eff37e6ec3159bc04280bed17be65cae4dfa9b9893765c954f865e34fb3c37a")},
      ]},
      {id:"cheesyfrie_12",emoji:"\\ud83c\\udf5f",names:_n("Cheesy Fries"),items:[
        {id:"chee_12_0",names:_n("Poulet"),price:35,photo:_gp("69695c431514ac13e29d52821e481be2fa210cb823971f7d23ad0dc941d76741")},
        {id:"chee_12_1",names:_n("Charcuterie"),price:33,photo:_gp("a5a07148de679b0e1449de1fecd7bdb85546e7412676eb5bcf13e6bf32852661")},
        {id:"chee_12_2",names:_n("Fromage"),price:31,photo:_gp("0aa47cf0a603e8ad28be78ada0b395c8a6ff205eaa93e9799af1df836ec1c763")},
      ]},
      {id:"tajines_13",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Tajines"),items:[
        {id:"chee_13_0",names:_n("Tajine Bœuf"),price:48,photo:_gp("7cd7a50714a19f6d3807f072ca5819285993f56fc4685bb3f59173a5d8258c0b")},
        {id:"chee_13_1",names:_n("Tajine Fruit De Mer"),price:48,photo:_gp("ecd8f7b5f11ab3cf0f05cf1d310fdecec526c1872d89114f9bc2de6b36a5a0fb")},
      ]},
      {id:"desserts_14",emoji:"\\ud83c\\udf70",names:_n("Desserts"),items:[
        {id:"chee_14_0",names:_n("Salade Fruit"),price:26,photo:_gp("3a514234005ff495d8475ac606375cf2c4025441e459ba555e2efabeb0838866")},
        {id:"chee_14_1",names:_n("Tiramisu"),price:22,photo:_gp("2c06a0b5bb1ad4e447ffb25efaf0bafc77d0a92dab44cda78adc0d76a0a79ce2")},
        {id:"chee_14_2",names:_n("Cheese Cake"),price:22,photo:_gp("2e269a1e9888db2796ce613f973c0199b766db94e7b9ec0163909a4ebbbe6a6b")},
      ]},
      {id:"lescrpessa_15",emoji:"\\ud83e\\udd5e",names:_n("Les Crêpes Salées"),items:[
        {id:"chee_15_0",names:_n("Crêpe Poulet Champinion"),price:39,photo:_gp("504f025e331562c0371a5337801862a279ff85479ea4be12b4924920d406f630")},
      ]},
      {id:"jus_16",emoji:"\\ud83e\\uddc3",names:_n("Jus"),items:[
        {id:"chee_16_0",names:_n("Zaazaa"),price:35,photo:_gp("4b38b3093e1bb24607c615f717f019efab250c72deddbe71600271e88d89faeb")},
        {id:"chee_16_1",names:_n("Jus De Fraise"),price:26,photo:_gp("c67bbdfe7932105d80ce92a1b61d1d1e24843fdad79ffa00fcaf911c346af6bf")},
        {id:"chee_16_2",names:_n("Jus D'avocat Fruits Secs"),price:26,photo:_gp("df8bdddfece5077f11ac1920f8449fe302a5a5e634d49ef7d48f9b0b9c3e887b")},
        {id:"chee_16_3",names:_n("Jus De Mangue"),price:22,photo:_gp("3cad78c8ed86203dff20f7af09143b0d1ff403b7a2703f2dff7424e37130c21c")},
        {id:"chee_16_4",names:_n("Jus De Panache"),price:22,photo:_gp("eb765ce73d74f206027e29fb2a5b0d79192adafe18ae027d10d77e5a1448dcd3")},
        {id:"chee_16_5",names:_n("Jus D'avocat"),price:22,photo:_gp("d0c9e5916dd2457a75c33396cfbc512a6ebfd1d2ca11dd4e147c8a293552f1c1")},
        {id:"chee_16_6",names:_n("Citronade Gengembre"),price:22,photo:_gp("27bc40da94bfefdaeac30d7c397267c3f898ea5d430c6855b947d934e9c6c4fd")},
        {id:"chee_16_7",names:_n("Jus D'ananas"),price:22,photo:_gp("e35b76b45894f5956ca5dd18d649345d10c3a70c5b8898b8f51698d780877e9b")},
        {id:"chee_16_8",names:_n("Jus D'orange"),price:18,photo:_gp("62fa27dda9cc487fca436a83a0b9084a6e205ecb0284388ce3334d10191f8653")},
      ]},
      {id:"coctails_17",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Coctails"),items:[
        {id:"chee_17_0",names:_n("Cocktail Pina Colada"),price:26,photo:_gp("6c71c0fcce2d257b122ecbf0cdc681a03d4f0dab145743eca227fa2f2b756db9")},
        {id:"chee_17_1",names:_n("Cocktail Exotic"),price:26,photo:_gp("bd294075a76a7f3270aa568465ec584d43cb2243c787ed21ab37cdc56a2429a0")},
        {id:"chee_17_2",names:_n("Cocktail Mojito Bleu"),price:26,photo:_gp("67cc0f298d09293875e61cc19e7266a6bdbd73b27883cf6a479cfea59feceee1")},
        {id:"chee_17_3",names:_n("Cocktail Mojito Fraise"),price:26,photo:_gp("ca7d89c656d64c5afd272dc7993673d158999e5b7470bbde7f9eb7c6ce899223")},
        {id:"chee_17_4",names:_n("Cocktail Mojito"),price:23,photo:_gp("1babfbbb63c134c3be3a5f230035e42f02907405b0d19e38a858d5a42d301b55")},
      ]},
      {id:"boissons_18",emoji:"\\ud83e\\udd64",names:_n("Boissons"),items:[
        {id:"chee_18_0",names:_n("Eau Minérale 1,5l"),price:13,photo:_gp("e55707e7a80be56a476d3a9a9e9d4bc3457257ae21e302462534076b49e73d75")},
        {id:"chee_18_1",names:_n("Coca Cola Originale Canette 25cl"),price:7,photo:_gp("f55d13956362d093bfffbdef38c3d854bd4012f83d95312f0794cdd0f8b0ac61")},
        {id:"chee_18_2",names:_n("Coca Cola Zéro Canette 25cl"),price:7,photo:_gp("bfcabc7f17ab95456a07c0786416db9de0184c0b57fca3e08f9859f50501997f")},
        {id:"chee_18_3",names:_n("Pom's Canette 25cl"),price:7,photo:_gp("acbe0de74215d13a32a002799d331c4030dbf9ea298aa39378556f6192cf17bb")},
        {id:"chee_18_4",names:_n("Sprite Canette 25cl"),price:7,photo:_gp("21a6618796fe7152fb0f21c100f7d4dfcc8e4ae78f5e1ffe6ae7bb21964688ff")},
        {id:"chee_18_5",names:_n("Hawaï Tropical Canette 25cl"),price:7,photo:_gp("3d81b10ab2a8da26bee873d70fffcedc9b8b98fde9d3c1a8a0dc44f051dd54ca")},
      ]},
    ],
  },
  {
    id:"blacktop-coffee-asf",name:"BLACKTOP COFFEE",
    tagline:_n("BLACKTOP COFFEE · Safi"),
    logo:"\\u2615",cover:_gp("de66e91b469c78d3c9ea8ffc63b1b7f0b0e3e035529c8669e26510cfa27306d5"),
    cuisine:_n("Coffee & Brunch"),tags:["coffee", "brunch"],
    rating:0,deliveryTime:"15\\u201320",minOrder:25,
    address:'Safi, Maroc',
    categories:[
      {id:"topdesvent_0",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Top des ventes"),items:[
        {id:"blac_0_0",names:_n("Blacktop Signature"),price:52,photo:_gp("")},
        {id:"blac_0_1",names:_n("Power Breakfast"),price:54,photo:_gp("")},
        {id:"blac_0_2",names:_n("Gaufre spéculos"),price:39,photo:_gp("")},
      ]},
      {id:"petitdjeun_1",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Petit Déjeuner"),items:[
        {id:"blac_1_0",names:_n("Power Breakfast"),price:54,photo:_gp("")},
        {id:"blac_1_1",names:_n("Blacktop Signature"),price:52,photo:_gp("")},
        {id:"blac_1_2",names:_n("Urban Energy"),price:48,photo:_gp("")},
        {id:"blac_1_3",names:_n("Moroccan Vibes"),price:44,photo:_gp("")},
        {id:"blac_1_4",names:_n("Black Morning"),price:39,photo:_gp("")},
        {id:"blac_1_5",names:_n("Kids Morning"),price:35,photo:_gp("")},
      ]},
      {id:"donuts_2",emoji:"\\ud83c\\udf69",names:_n("Donuts"),items:[
        {id:"blac_2_0",names:_n("Donut spéculos"),price:44,photo:_gp("")},
        {id:"blac_2_1",names:_n("Donut trois chocolats"),price:35,photo:_gp("")},
      ]},
      {id:"sandwich_3",emoji:"\\ud83e\\udd59",names:_n("Sandwich"),items:[
        {id:"blac_3_0",names:_n("BLACKTOP SIGNATURE"),price:37,photo:_gp("")},
        {id:"blac_3_1",names:_n("TUNA FRESH"),price:36,photo:_gp("")},
        {id:"blac_3_2",names:_n("AVOCADO & EGG"),price:35,photo:_gp("")},
        {id:"blac_3_3",names:_n("TURKEY & CHEESE"),price:34,photo:_gp("")},
        {id:"blac_3_4",names:_n("CAPRESE STYLE"),price:33,photo:_gp("")},
        {id:"blac_3_5",names:_n("CLASSIC CHEESE"),price:31,photo:_gp("")},
      ]},
      {id:"icedrinks_4",emoji:"\\ud83e\\udd64",names:_n("Ice Drinks"),items:[
        {id:"blac_4_0",names:_n("Iced Pistachio Mocha"),price:35,photo:_gp("")},
        {id:"blac_4_1",names:_n("Iced White Mocha"),price:33,photo:_gp("")},
        {id:"blac_4_2",names:_n("Iced Caramel Mocha"),price:33,photo:_gp("")},
        {id:"blac_4_3",names:_n("Iced Spanish Latte"),price:31,photo:_gp("")},
        {id:"blac_4_4",names:_n("Iced Mocha"),price:31,photo:_gp("")},
        {id:"blac_4_5",names:_n("Iced Latte"),price:28,photo:_gp("")},
        {id:"blac_4_6",names:_n("Iced Americano"),price:26,photo:_gp("")},
      ]},
      {id:"gauffres_5",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Gauffres"),items:[
        {id:"blac_5_0",names:_n("Gaufre spéculos"),price:39,photo:_gp("")},
        {id:"blac_5_1",names:_n("Gaufre Oreo"),price:39,photo:_gp("")},
        {id:"blac_5_2",names:_n("Gaufre 3 Chocolat"),price:35,photo:_gp("")},
      ]},
      {id:"pancakes_6",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Pancakes"),items:[
        {id:"blac_6_0",names:_n("Pancake Fraise Banane"),price:48,photo:_gp("de66e91b469c78d3c9ea8ffc63b1b7f0b0e3e035529c8669e26510cfa27306d5")},
        {id:"blac_6_1",names:_n("Pancake Oreo"),price:44,photo:_gp("9f0d9d3f9dad351e1f15b51aab019c68313d25fa1919b1d2c206b30293dd3797")},
        {id:"blac_6_2",names:_n("Pancake croquant"),price:39,photo:_gp("")},
      ]},
      {id:"cocktails_7",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Cocktails"),items:[
        {id:"blac_7_0",names:_n("Blacktop"),price:35,photo:_gp("b432ebce73ccb40d12d6d8d87cd12a9a4034f45f9e43cffbb6163e533b72b1dc")},
        {id:"blac_7_1",names:_n("Loca Loca"),price:35,photo:_gp("9f24e0c6f73e82a7f8cc03b5d2d24c242acb65daab7ee1db11e23fe88f2f7c6f")},
        {id:"blac_7_2",names:_n("Happy Sunset"),price:35,photo:_gp("")},
      ]},
      {id:"mojitos_8",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Mojitos"),items:[
        {id:"blac_8_0",names:_n("Classic"),price:33,photo:_gp("59ba05acd9d37fcdbe96e0303c6ef69c64bec1a00e0739b482aebdc1a08b14cd")},
        {id:"blac_8_1",names:_n("Fruit Rouge"),price:33,photo:_gp("9985516b6f70ddb7f59303ac0f351ed6be4ba9335edba48cb4309a812df3886f")},
        {id:"blac_8_2",names:_n("Mango"),price:33,photo:_gp("dadb38e25a977923deb1b17561a02063f6fb21595818115d03897dbafe2045a1")},
      ]},
      {id:"hotdrinks_9",emoji:"\\ud83e\\udd64",names:_n("Hot drinks"),items:[
        {id:"blac_9_0",names:_n("Matcha"),price:35,photo:_gp("")},
        {id:"blac_9_1",names:_n("Ube Latte"),price:31,photo:_gp("")},
        {id:"blac_9_2",names:_n("Pistachio Mocha"),price:29,photo:_gp("")},
        {id:"blac_9_3",names:_n("Chocolat Chaud"),price:28,photo:_gp("")},
        {id:"blac_9_4",names:_n("Pistachio Latte"),price:26,photo:_gp("")},
        {id:"blac_9_5",names:_n("Affogato"),price:26,photo:_gp("")},
        {id:"blac_9_6",names:_n("Latte Macchiato"),price:26,photo:_gp("")},
        {id:"blac_9_7",names:_n("Caramel Mocha"),price:26,photo:_gp("")},
        {id:"blac_9_8",names:_n("White Mocha"),price:26,photo:_gp("")},
        {id:"blac_9_9",names:_n("Mochaccino"),price:26,photo:_gp("")},
        {id:"blac_9_10",names:_n("Spanish Latte"),price:24,photo:_gp("")},
        {id:"blac_9_11",names:_n("Cortado"),price:23,photo:_gp("")},
        {id:"blac_9_12",names:_n("Double Espresso"),price:22,photo:_gp("")},
        {id:"blac_9_13",names:_n("Cappuccino"),price:22,photo:_gp("")},
        {id:"blac_9_14",names:_n("Latte"),price:20,photo:_gp("")},
        {id:"blac_9_15",names:_n("The a la Menthe"),price:20,photo:_gp("")},
        {id:"blac_9_16",names:_n("Americano"),price:19,photo:_gp("")},
        {id:"blac_9_17",names:_n("Espresso"),price:18,photo:_gp("")},
      ]},
    ],
  },
  {
    id:"food-kennedy-asf",name:"Food Kennedy",
    tagline:_n("Food Kennedy · Safi"),
    logo:"\\ud83c\\udf2e",cover:_gp("bbee3d4c322a44af5f7413b9a7afcde88445a96e7a7c9e43b7b2402cc35d0b50"),
    cuisine:_n("Tacos & Fast Food"),tags:["tacos", "fast-food"],
    rating:0,deliveryTime:"20\\u201330",minOrder:35,
    address:'Safi, Maroc',
    categories:[
      {id:"promotions_0",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Promotions"),items:[
        {id:"food_0_0",names:_n("Plat Brochette Mixte"),price:43,photo:_gp("bbee3d4c322a44af5f7413b9a7afcde88445a96e7a7c9e43b7b2402cc35d0b50")},
        {id:"food_0_1",names:_n("Virgin mojito"),price:22,photo:_gp("")},
        {id:"food_0_2",names:_n("Mogito tropical mango"),price:24,photo:_gp("")},
      ]},
      {id:"topdesvent_1",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Top des ventes"),items:[
        {id:"food_1_0",names:_n("Tacos Mixte"),price:35,photo:_gp("d222ca67fe080896e763662316b658618013b0ba3ab2b5a1944a503f25c505b9")},
        {id:"food_1_1",names:_n("1/4 ربع دجاجه محمرة بالدغميرة"),price:42,photo:_gp("c2e917029c1ff7f8b1b5f6c8de9b6c5392e9189c32cc7261b8ea74d84aa4ad67")},
        {id:"food_1_2",names:_n("Tacos Dinde"),price:35,photo:_gp("4449f611235ca3cd8919e3341c5fb7d0e2055baa31e8b8214625c13efc27f03a")},
      ]},
      {id:"packfamily_2",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Pack family"),items:[
        {id:"food_2_0",names:_n("كل العائلة (Pack 1)"),price:113,photo:_gp("")},
        {id:"food_2_1",names:_n("كل العائلة (Pack 2)"),price:109,photo:_gp("")},
        {id:"food_2_2",names:_n("كل العائلة (Pack 3)"),price:105,photo:_gp("")},
        {id:"food_2_3",names:_n("لكل العائلة"),price:86,photo:_gp("")},
      ]},
      {id:"platmaroca_3",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Plat marocain"),items:[
        {id:"food_3_0",names:_n("دجاجه محمرة بالدغميرة"),price:149,photo:_gp("7cfc0e9e79d7e730bf8ecb19d06fac3fb41e664fd1fb999ef0a4b94846d39dca")},
        {id:"food_3_1",names:_n("نص دجاجه محمرة بالدغميرة 1/2"),price:79,photo:_gp("3a3039d777120d8058655e34c2a9916cd2cb3f181ce986b421254d97e2cac51e")},
        {id:"food_3_2",names:_n("كورعين بالحمص"),price:52,photo:_gp("b22b0803d4e2b107be6e7d305a9a9f22df999656b6772585e173c3785ecb2bd7")},
        {id:"food_3_3",names:_n("1/4 ربع دجاجه محمرة بالدغميرة"),price:42,photo:_gp("c2e917029c1ff7f8b1b5f6c8de9b6c5392e9189c32cc7261b8ea74d84aa4ad67")},
        {id:"food_3_4",names:_n("تقلية"),price:35,photo:_gp("fa72b05ee1d4a3f879b6066187268f064de5556e06a996d75eac3d64b9f72e23")},
      ]},
      {id:"entrefroid_4",emoji:"\\ud83e\\udd57",names:_n("Entrée froid Salades"),items:[
        {id:"food_4_0",names:_n("Salade Pâtes Thon"),price:24,photo:_gp("b1bfc4a1fd6fd5bcf441085af94e9c0e965476e9c98f38548cf18da435515817")},
        {id:"food_4_1",names:_n("Salade mexicaine"),price:22,photo:_gp("7345b327756926bffc04f6307e9a696f66a337f312631765706b74c1177d81ce")},
        {id:"food_4_2",names:_n("Salade Variée"),price:18,photo:_gp("f2c0f2db8f5f1ce813bff48627bd06daf9afda10c0ebb5d1d1f7df369b9e201c")},
        {id:"food_4_3",names:_n("Salade marocaine"),price:13,photo:_gp("396facf6e6976177f8bc6262ad70862ae853c23c200d7dec8810b73390d37605")},
      ]},
      {id:"tacos_5",emoji:"\\ud83c\\udf2e",names:_n("Tacos"),items:[
        {id:"food_5_0",names:_n("Tacos Spécial XL"),price:96,photo:_gp("3ada307694a3d63e1372066df0b4bb177e023ed8f44e50a6a86086234c0370e8")},
        {id:"food_5_1",names:_n("Tacos Viande Hachée XL"),price:79,photo:_gp("e02b826e8296692d6a9ad82f10417a6d3814180be5a186936d85d8442ed38f29")},
        {id:"food_5_2",names:_n("Tacos Dinde XL"),price:70,photo:_gp("9fc77f8c497ada842b18541b3e2045ce75f164c3d1b154a9c4dcd4495212edfe")},
        {id:"food_5_3",names:_n("Tacos fruit mere"),price:52,photo:_gp("21a8b8a9a6bc9c26b6ec8d06692eb1d10f0dddafa6cf4424757bce070e993949")},
        {id:"food_5_4",names:_n("Tacos Spécial"),price:44,photo:_gp("07a94e0779ad640c49bfe1979cb1fcdc548b8f4ed79080b69c105016e15e9c95")},
        {id:"food_5_5",names:_n("Tacos Cordon Bleu"),price:39,photo:_gp("b796712b502dbe6b99f2da579ec3bd5a029ebf6781857943a268f4d04cc96a72")},
        {id:"food_5_6",names:_n("طاكوص بالدغميرة والدجاج"),price:39,photo:_gp("d4f9dd61d12ba5ca0b30d590648d54ade28aee3198e550d698cd91aa364176f2")},
        {id:"food_5_7",names:_n("Tacos Nuggets"),price:35,photo:_gp("4c81f49caeb4dc710838faab4e589557d6db50df5ea6cb37d78b7e3d3501df6f")},
        {id:"food_5_8",names:_n("Tacos Dinde"),price:35,photo:_gp("4449f611235ca3cd8919e3341c5fb7d0e2055baa31e8b8214625c13efc27f03a")},
        {id:"food_5_9",names:_n("Tacos Viande Hachée"),price:35,photo:_gp("261b468a795c2739d1f028ce39d36abe0a81711e6d8e7d9cddf49ca1fca6184c")},
        {id:"food_5_10",names:_n("Tacos Mixte"),price:35,photo:_gp("d222ca67fe080896e763662316b658618013b0ba3ab2b5a1944a503f25c505b9")},
      ]},
      {id:"burgers_6",emoji:"\\ud83c\\udf54",names:_n("Burgers"),items:[
        {id:"food_6_0",names:_n("Burger cordon bleu"),price:57,photo:_gp("")},
        {id:"food_6_1",names:_n("Big burger"),price:46,photo:_gp("")},
        {id:"food_6_2",names:_n("Duo burger"),price:43,photo:_gp("")},
        {id:"food_6_3",names:_n("Cheese Burger"),price:35,photo:_gp("")},
        {id:"food_6_4",names:_n("Chiken burger"),price:33,photo:_gp("")},
      ]},
      {id:"sandwichs_7",emoji:"\\ud83e\\udd59",names:_n("Sandwichs"),items:[
        {id:"food_7_0",names:_n("Sandwich Fruits De Mer"),price:35,photo:_gp("747ddb2f6e26d126de332a0b8f16cf2f246feda3e89506cc82ae39abb4a9f0e0")},
        {id:"food_7_1",names:_n("Sandwich dinde avec crème"),price:26,photo:_gp("1bccfff8a4f5f03b7bfafe4fb3618cd0af3f031d7e16b4c93b53454d879cd435")},
        {id:"food_7_2",names:_n("Sandwich Viande Hachée"),price:26,photo:_gp("f00e713a62e2f9210bce72ae84b3c1270a402f72a7c049db5c3120a9fbdda420")},
        {id:"food_7_3",names:_n("Sandwich Mixte"),price:26,photo:_gp("27f849db9169dcc1b733a10104d3a8c84ea6ee179f9028946e66ebfd08d90b02")},
        {id:"food_7_4",names:_n("Sandwich Thon spécial"),price:22,photo:_gp("453aefbec218296d350110e9e3d5b7352092bee2f36a861006bc600dd14b8001")},
        {id:"food_7_5",names:_n("Sandwich Dinde"),price:22,photo:_gp("058601e78d2e23c1633dd6fecef105b00ad4f7aa19f45188a6a6db7f3d3e74d2")},
        {id:"food_7_6",names:_n("Sandwich Saucisses"),price:22,photo:_gp("7c6d695b16f534510aa94ecbb3e20f42b17736b97bd5740870339f78019eaa12")},
        {id:"food_7_7",names:_n("Sandwich tortilla"),price:13,photo:_gp("d9e1c5394cc4cba5a37d920052deebd0c11f17d0fd317986923c0e93b5731012")},
      ]},
      {id:"paninis_8",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Paninis"),items:[
        {id:"food_8_0",names:_n("Panini Fruits De Mer"),price:31,photo:_gp("a832767cf8a5e18b8fb097f4f387cafbf5b2579ed97067c775c1047c2055b90c")},
        {id:"food_8_1",names:_n("Panini Viande Hachée"),price:23,photo:_gp("09d0ea1f90d2e6157601f7dadf469316c848b8ab65102ca397115a17eda022fc")},
        {id:"food_8_2",names:_n("Panini Mixte"),price:23,photo:_gp("4c79614702b24c6c326f859ffa00757d2d251b0a6e2c3061f428dce2919d7a9f")},
        {id:"food_8_3",names:_n("Panini Thon spécial"),price:20,photo:_gp("8dc739c9b328ffb3a7bdf70a852d007335f16c695fb6589d0f1ff88ae149667f")},
        {id:"food_8_4",names:_n("Panini Dinde"),price:20,photo:_gp("d8239acbe8b700f58d6ba2c393536fb60f128cbe2c1031138109b2b93b682a91")},
        {id:"food_8_5",names:_n("Panini Saucisses"),price:20,photo:_gp("8dc739c9b328ffb3a7bdf70a852d007335f16c695fb6589d0f1ff88ae149667f")},
        {id:"food_8_6",names:_n("Panini tortilla"),price:14,photo:_gp("299186fbea34e8e5de89c2be23e5289290ac0a8cd8a0e20b47f1891a0bc08ef2")},
        {id:"food_8_7",names:_n("Panini omelette"),price:13,photo:_gp("299186fbea34e8e5de89c2be23e5289290ac0a8cd8a0e20b47f1891a0bc08ef2")},
        {id:"food_8_8",names:_n("Panini fromage"),price:13,photo:_gp("299186fbea34e8e5de89c2be23e5289290ac0a8cd8a0e20b47f1891a0bc08ef2")},
      ]},
      {id:"potchis_9",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Potchis"),items:[
        {id:"food_9_0",names:_n("Potchi nuggets"),price:39,photo:_gp("519256ba82f1a520d7eef7be74c7ad08f0eda5f89b76066986941c981078b7c7")},
        {id:"food_9_1",names:_n("Potchi Mixte"),price:39,photo:_gp("374d3cfbf18eac7a2de249f48980755679cdd893334109b703809f08632603d1")},
        {id:"food_9_2",names:_n("Potchi Viande Hachée"),price:35,photo:_gp("3075e800bec8c7caea8467fbcd9d3dcc01e3c3efa6399c5336891bf1cc1e4e32")},
        {id:"food_9_3",names:_n("Potchis thone"),price:33,photo:_gp("66565224655e4b3bd6096d8951139b8b4bc24e98dc696d1aebe6a68e1f4f12b6")},
        {id:"food_9_4",names:_n("Potchis dinde fumé"),price:33,photo:_gp("2123437ef319bd1c0e74afae98209bcaee53d997a8a7aaaaf53f275e3fdb6d9c")},
        {id:"food_9_5",names:_n("Potchi Dinde"),price:33,photo:_gp("13e5cb664972b49429346154eb833855908670c08c4d9730bf345583d810c148")},
        {id:"food_9_6",names:_n("Potchi Saucisses"),price:33,photo:_gp("6e95509cc5b759b0512d57a8521122cb0f3b4962280c7f546ce9745401056023")},
      ]},
      {id:"pizzasmoye_10",emoji:"\\ud83c\\udf55",names:_n("Pizzas moyen"),items:[
        {id:"food_10_0",names:_n("Pizza Fruits De Mer"),price:48,photo:_gp("9a1882a46bd8bae2c6325b0f8b986af1a4af2215da13a22aa33e048ae668cdf1")},
        {id:"food_10_1",names:_n("Pizza 4 Saisons"),price:39,photo:_gp("e8d75e51c9c113d10ed90509cd0ece740b62d0740078978480c5da6d09bbc376")},
        {id:"food_10_2",names:_n("Pizza Dinde"),price:35,photo:_gp("b258ff16f0fca435678c7adc68c3c01b4ae31981b6d2cf1aff4f83086a292420")},
        {id:"food_10_3",names:_n("Pizza Viande Hachée"),price:35,photo:_gp("0d631547c0358577f4453f9ddc0206d78efc1469158db51da4c617e767a508bd")},
        {id:"food_10_4",names:_n("Pizza 4 Fromages"),price:35,photo:_gp("49c790651f338a11b6aa5b5d6d1a2add54d26cb56bd9c373554a7647be355fe9")},
        {id:"food_10_5",names:_n("Pizza Thon"),price:31,photo:_gp("f1070ee552c38a59875dd589f27c4e6f1a7b90ed9fdf72f9e9bbf9e08e151216")},
        {id:"food_10_6",names:_n("Pizza Margarita"),price:22,photo:_gp("2c16353057a5dfcc2c5dee6bf7f91e2f113c76cca36b8a041a17c43496043f2f")},
      ]},
      {id:"ptes_11",emoji:"\\ud83c\\udf5d",names:_n("Pâtes"),items:[
        {id:"food_11_0",names:_n("Pâtes Fruits De Mer"),price:48,photo:_gp("af8504b6cdc199c22feeea9a003ef2c2e4fd4a1f71bc6bc672978d4b7aacbcdf")},
        {id:"food_11_1",names:_n("Pâtes Bolognaise"),price:35,photo:_gp("81b0062ee2c6cb0f0db784c1fefbdf48d8e6c90bb3ec73b83cf00e59c910868a")},
        {id:"food_11_2",names:_n("Pâtes Poulet champignons"),price:35,photo:_gp("adbb9b8501b5de65587aafc50eec24f48eecd491da10da91feeae361eec6237d")},
        {id:"food_11_3",names:_n("Pâtes Carbonara"),price:31,photo:_gp("09cb3ff55337e573115bbfc43f360f94aee424ea76f6d418a00655852dbcd96a")},
        {id:"food_11_4",names:_n("Arrabiata"),price:26,photo:_gp("b94a00fb13b9a4ec25b12335ced7fead55b4ecb6e839cffe6fd0db85bf5264f1")},
      ]},
      {id:"pasticcios_12",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Pasticcios"),items:[
        {id:"food_12_0",names:_n("Pasticcios fruit de mer"),price:44,photo:_gp("c1e5f06d28f2d051983f305eddbb1075101f2c00af73e6f96fe2117cff1dc60f")},
        {id:"food_12_1",names:_n("Kennedy"),price:35,photo:_gp("bf98005fa1acaba7b513bb6f18806bd0bfe840d5909755e76b58db766d7d53dc")},
        {id:"food_12_2",names:_n("mixte"),price:33,photo:_gp("d5c6204d2e0644f8ed480da0c98ab45cf86cad9dcf9818f3e0d77155c24a5e61")},
        {id:"food_12_3",names:_n("viande hachée"),price:31,photo:_gp("920508f60f0c37b1579cb29d631685218d69891e10bf2a93c53a9f43afa9f94b")},        {id:"food_12_4",names:_n("Dinde"),price:31,photo:_gp("f59f2cf292dbb40498f837333073846f971d89c4e1991df06e018b26284d7fee")},
        {id:"food_12_5",names:_n("charcuterie"),price:26,photo:_gp("ae892b4488bebc3efc8fa84cfc3fda55bd34b883146cfde38d84475851afd4a0")},
      ]},
      {id:"nuggets_13",emoji:"\\ud83c\\udf57",names:_n("Nuggets"),items:[
        {id:"food_13_0",names:_n("Nuggets - 9 Pièces"),price:31,photo:_gp("d592e4ff8ee279ef3c513297c8321658578b4772fa7a98cd02f840d89c1a099c")},
        {id:"food_13_1",names:_n("Nuggets - 6 Pièces"),price:22,photo:_gp("d592e4ff8ee279ef3c513297c8321658578b4772fa7a98cd02f840d89c1a099c")},
      ]},
      {id:"crpes_14",emoji:"\\ud83e\\udd5e",names:_n("Crêpes"),items:[
        {id:"food_14_0",names:_n("Crêpes pistache et kunafa"),price:38,photo:_gp("")},
        {id:"food_14_1",names:_n("Crêpes fruit sec"),price:30,photo:_gp("")},
        {id:"food_14_2",names:_n("Crêpes kunafa"),price:30,photo:_gp("")},
        {id:"food_14_3",names:_n("Crêpes lotus"),price:30,photo:_gp("")},
        {id:"food_14_4",names:_n("Crêpes oreo"),price:30,photo:_gp("")},
        {id:"food_14_5",names:_n("Crêpes KitKat"),price:30,photo:_gp("")},
        {id:"food_14_6",names:_n("Nutella banane"),price:28,photo:_gp("")},
        {id:"food_14_7",names:_n("Crêpes Nutella"),price:25,photo:_gp("")},
      ]},
      {id:"plats_15",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Plats"),items:[
        {id:"food_15_0",names:_n("Plat Émincé De Poulet"),price:43,photo:_gp("217429def69088c9224750e066e972866abfd4905724d37fd8fbe1079f06eec1")},
        {id:"food_15_1",names:_n("Plat Cordon Bleu"),price:39,photo:_gp("8920990ced95d0301f56311325ad3c3276c5d94b86520bef2944c790a7859d32")},
        {id:"food_15_2",names:_n("Plat Brochette Viande hachée"),price:39,photo:_gp("21ca8cbb18d34218acfdc766e70e2e789054eab9a3c9136297dfd4a609de286f")},
        {id:"food_15_3",names:_n("Plat Brochette Mixte"),price:43,photo:_gp("bbee3d4c322a44af5f7413b9a7afcde88445a96e7a7c9e43b7b2402cc35d0b50")},
        {id:"food_15_4",names:_n("Plat Brochette Dinde"),price:39,photo:_gp("039f635e9ba3b73f1557c199337fe20416c77fd44de33390b55eea94de443ef7")},
      ]},
      {id:"boissons_16",emoji:"\\ud83e\\udd64",names:_n("Boissons"),items:[
        {id:"food_16_0",names:_n("Hawaii"),price:6,photo:_gp("2b00d05ea7c66720570a083f0f44a9a5bfd4cd9eb7cdd73ddcf0a3947e80befb")},
        {id:"food_16_1",names:_n("Coca cola"),price:6,photo:_gp("")},
        {id:"food_16_2",names:_n("Eau Minérale"),price:5,photo:_gp("5ac774b5a76a0971e80bad3e5968f28a9c65db1ea2276b2c824478e14054b025")},
      ]},
      {id:"tajine_17",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Tajine"),items:[
        {id:"food_17_0",names:_n("طاجين كفتة"),price:35,photo:_gp("bfd4cfc2c925fb81ed6a7f9cff93e09108d9a397617219b9b677e87f8cc89395")},
      ]},
      {id:"jus_18",emoji:"\\ud83e\\uddc3",names:_n("Jus"),items:[
        {id:"food_18_0",names:_n("Jus D'orange"),price:15,photo:_gp("392660f991b8dee64d44d4035c50a121e0c00d735364b3db55f10015f8fe648e")},
      ]},
      {id:"mogito_19",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Mogito"),items:[
        {id:"food_19_0",names:_n("Mogito tropical mango"),price:24,photo:_gp("")},
        {id:"food_19_1",names:_n("Mojito fruit de la passion"),price:24,photo:_gp("")},
        {id:"food_19_2",names:_n("Mojito blue Curacao"),price:24,photo:_gp("")},
        {id:"food_19_3",names:_n("Mojito strawberry"),price:24,photo:_gp("")},
        {id:"food_19_4",names:_n("Virgin mojito"),price:22,photo:_gp("")},
      ]},
    ],
  },
  {
    id:"snack-indomi-asf",name:"Pizza Hot",
    tagline:_n("Pizza Hot · Safi"),
    logo:"\\ud83c\\udf55",cover:_gp("cb7dda4c68574a528745e965611d2097025e0715e3c2b02742b4765191070736"),
    cuisine:_n("Pizza & Snacks"),tags:["pizza", "snack"],
    rating:0,deliveryTime:"20\\u201330",minOrder:35,
    address:'Safi, Maroc',
    categories:[
      {id:"topdesvent_0",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Top des ventes"),items:[
        {id:"snac_0_0",names:_n("PIZZA POULET"),price:38,photo:_gp("cb7dda4c68574a528745e965611d2097025e0715e3c2b02742b4765191070736")},
        {id:"snac_0_1",names:_n("PIZZA 4 SAISON"),price:50,photo:_gp("ba3bd1a6cfdbf7025e3c07478925d27bd8d710afc9526ce82bd9343743838ef9")},
        {id:"snac_0_2",names:_n("PIZZA VIANDE HACHEE"),price:38,photo:_gp("33b1f2c3a7953094a6a4fb42f9496114379ad591924766eda1bf34b7c26604ba")},
      ]},
      {id:"tacos_1",emoji:"\\ud83c\\udf2e",names:_n("Tacos"),items:[
        {id:"snac_1_0",names:_n("TACOS HOT"),price:44,photo:_gp("e18ad739109d76ea9adcc9d9f90d5873f344d587dd366428eea604b4a422b129")},
        {id:"snac_1_1",names:_n("TACCOS CORDON BLEU"),price:42,photo:_gp("5308a75c201a438ba6ec951f203c842cf8e1d91b2287b94292aea1269812b161")},
        {id:"snac_1_2",names:_n("Tacos Mixte"),price:41,photo:_gp("245ecec7a15dde45586d16bde32e7ebb4c1fcc3dccdb16ae0d529a579e8e9f4f")},
        {id:"snac_1_3",names:_n("Tacos Viande Haché"),price:38,photo:_gp("eb323258e2d6c6371a434b03ae7c9b5e1dc7d932546332556cdca8a8941cc2fc")},
        {id:"snac_1_4",names:_n("Tacos Dinde"),price:38,photo:_gp("9cbc4b01f08352feb9795344869cd9ecc748fcdbc78378a03a833dd073b61505")},
        {id:"snac_1_5",names:_n("TACCOS CHAWARMA"),price:38,photo:_gp("66954be7213a40e999521bb9065a56cb21b2d884a5bef8c176f2d0720f4a831b")},
        {id:"snac_1_6",names:_n("TACCOS NUGGET"),price:38,photo:_gp("a7d6039d5fac2ca33a392282f61c48afbd003d61357ac7b3450d1a392bc3f198")},
      ]},
      {id:"pizza_2",emoji:"\\ud83c\\udf55",names:_n("PIZZA"),items:[
        {id:"snac_2_0",names:_n("PIZZA ROYAL"),price:54,photo:_gp("22267271fb0c9eacdbeb4b9a350a92cf7c0be3d9f6ea9f42688b674e3abbe610")},
        {id:"snac_2_1",names:_n("PIZZA 4 SAISON"),price:50,photo:_gp("ba3bd1a6cfdbf7025e3c07478925d27bd8d710afc9526ce82bd9343743838ef9")},
        {id:"snac_2_2",names:_n("PIZZA FRUIT DE MER"),price:50,photo:_gp("72d4322689086c011163a11091ceb6f25b184b3e749b77a4c5ec4458cf4f4095")},
        {id:"snac_2_3",names:_n("PIZZA VEGIT"),price:46,photo:_gp("d41a8fd13c53ccd6314f63776604a2fb12a770ba11ce9ed953c2a15dba55a121")},
        {id:"snac_2_4",names:_n("PIZZA 4 FROMAGE"),price:39,photo:_gp("d07361faafc0c921277746ef258f59ffc1d76342006ebb49c810d0c96bb7e929")},
        {id:"snac_2_5",names:_n("PIZZA JOMBON"),price:38,photo:_gp("01f1c111c7fbff0f150a8d38cc4892436733790d9149edda9f0710407a139440")},
        {id:"snac_2_6",names:_n("PIZZA VIANDE HACHEE"),price:38,photo:_gp("33b1f2c3a7953094a6a4fb42f9496114379ad591924766eda1bf34b7c26604ba")},
        {id:"snac_2_7",names:_n("PIZZA POULET"),price:38,photo:_gp("cb7dda4c68574a528745e965611d2097025e0715e3c2b02742b4765191070736")},
        {id:"snac_2_8",names:_n("PIZZA CHAWARMA"),price:38,photo:_gp("5e965d647e76f08fde696e2e85302620b2149771489ed036b8cea2293d732f54")},
        {id:"snac_2_9",names:_n("PIZZA THON"),price:38,photo:_gp("52c760ac94625d6462fa72d6e224dc6301f8c06870a6fed053060bd93a28cd41")},
        {id:"snac_2_10",names:_n("PIZZA MARGARITA"),price:30,photo:_gp("dc9db13b210282c65c42577de93d76a569edf448c1e2377f585284e2a1b55961")},
      ]},
      {id:"pasticcio_3",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Pasticcio"),items:[
        {id:"snac_3_0",names:_n("PASTICCIO FRUIT DE MER"),price:50,photo:_gp("b81cdeec3cbafc13fd7bc922dc2f5f4aa0f0f51e13adba3e31ab97e04f2e0530")},
        {id:"snac_3_1",names:_n("PASTICCIO MIXTE"),price:40,photo:_gp("57151b9664ad0630f8dc8b59c17c424ed6a7114edf14f7d5cd9968314a2616bd")},
        {id:"snac_3_2",names:_n("PASTICCIO DINDE"),price:36,photo:_gp("1cd73697d720d3f46f0cf8a5a7c5ae350a507fb3274d0ea7c0f2a866dd804826")},
        {id:"snac_3_3",names:_n("PASTICCIO VIANDE HACHHE"),price:36,photo:_gp("d0a8b1d18a08bff019035d27699e186bd83138e0e62a13790ea302c82cd39d59")},
        {id:"snac_3_4",names:_n("PASTICCIO CHARCUTERIE"),price:33,photo:_gp("22206ce197856c7057667fe3e86def94d37afb89e418b4715562cfdec7dee79d")},
      ]},
      {id:"shawarma_4",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("SHAWARMA"),items:[
        {id:"snac_4_0",names:_n("CHAWARMA PLAT"),price:44,photo:_gp("4f191613503f06b1c517357e340832279c3c6924b8a98ed07643e6b890c7d6ce")},
        {id:"snac_4_1",names:_n("CHAWARMA EXTRA"),price:36,photo:_gp("a192ca0747d82bb97adbe8d7d0e852ee2cbf34dcaef63aef7b313c9e58fb9791")},
        {id:"snac_4_2",names:_n("CHAWARMA MIXTE"),price:33,photo:_gp("23f1f808805076eb5954a2aedb03059a74b6a8c96d4551bd59545e24e689bd30")},
        {id:"snac_4_3",names:_n("CHAWARMA DOUBLE FROMAGE"),price:28,photo:_gp("547ba847799331eba538fc07b0791377a97f54eece74a73311a5b97a9d0257e8")},
        {id:"snac_4_4",names:_n("CHAWARMA FROMAGE"),price:26,photo:_gp("4f4dda435a2193bfa83aea24ecb54548066fa38c43dd8d2458b64182cb3764bb")},
        {id:"snac_4_5",names:_n("CHAWARMA NORMAL"),price:24,photo:_gp("14ecb07feb579f8e84c4351ed3fa67b7f90a18802a80964ba07acf5ae042325d")},
      ]},
      {id:"lesplats_5",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("LES PLATS"),items:[
        {id:"snac_5_0",names:_n("CORDEN BLEU"),price:52,photo:_gp("0c5e2accc833f20f0d6c9a933fb10d22f98609fddf80372322d1a1b621e62185")},
        {id:"snac_5_1",names:_n("PLAT MIXTE"),price:52,photo:_gp("addf51b60a370e1f6d000f06c7346fc93a2b62feda767c6fe9576975960ec408")},
        {id:"snac_5_2",names:_n("PLAT BROCHETTE POULET"),price:48,photo:_gp("142c1dcc78e79563b13dce8c37fa59ceb85d5feb2de9017c4e7de60cc7bf23c5")},
        {id:"snac_5_3",names:_n("PLAT BROCHETTE VIANDE HACHEE"),price:48,photo:_gp("4de32b761e2964619944f0722dc97fb00d997cbefb47b9b222e9b4388857d7f8")},
        {id:"snac_5_4",names:_n("HAUTE CHIKEN"),price:48,photo:_gp("8b6b22494382512e298dc4cdca3694d1242f483dbd6b80d0c609dfb64ac2664a")},
        {id:"snac_5_5",names:_n("PLAT EMINCE POULET"),price:48,photo:_gp("be16762528ae9b4243cf0632301a4dcd94aa167f515e2cf2efe5c4647de72f09")},
      ]},
      {id:"burger_6",emoji:"\\ud83c\\udf54",names:_n("BURGER"),items:[
        {id:"snac_6_0",names:_n("BIG BURGER"),price:39,photo:_gp("0812c6a3c3e8d79ebefb511aba9790098929d7f5eb6cd5208e1750ba209572ad")},
        {id:"snac_6_1",names:_n("CHEESE BURGER"),price:30,photo:_gp("8bead6c2da3fa3d766b366a514fe2c69434b98113e7698f5187044b8e946cc90")},
        {id:"snac_6_2",names:_n("CHIKEN BURGER"),price:30,photo:_gp("c263918396a7e73e4bd12908df6567ba255110be79fdf9bf24cc8dfb5ca3e1e1")},
      ]},
      {id:"pates_7",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("PATES"),items:[
        {id:"snac_7_0",names:_n("PATES FRUIT DE MER"),price:48,photo:_gp("ee69035385d2c9e2707363002bb9c7d1739892a4d6716abb5ea7c14f92eab15f")},
        {id:"snac_7_1",names:_n("PATES BOLONAISE"),price:36,photo:_gp("b1192341d4f1f5db2b91923a00c12afdd34fe87cd6bed8d7bff44455b76e6a76")},
        {id:"snac_7_2",names:_n("PATES A LA SAUCE"),price:29,photo:_gp("24b6de06e92c44e02cff87effcc97498ba07b66d69c1fbaf83fd39619790eca3")},
      ]},
      {id:"panini_8",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("PANINI"),items:[
        {id:"snac_8_0",names:_n("PANINI MIXTE"),price:21,photo:_gp("648408d370214f2a82c95a965ded4996c5c54ef4d3234b520c73ad49c00b1bd1")},
        {id:"snac_8_1",names:_n("PANINI POULET"),price:20,photo:_gp("2e2c6d1d9bf23a13da0f4b708f240d31a6a964c4cd17641ba7743fe235845be7")},
        {id:"snac_8_2",names:_n("PANINI VIANDE HACHEE"),price:20,photo:_gp("db20e60924140875747658151fb4da39a0749bff816051e64eaa52dfea628ebb")},
        {id:"snac_8_3",names:_n("PANINI THON"),price:18,photo:_gp("09d7d12c0edab95729cc7522e886712ffbadb98591af9391f091bce00107ae44")},
        {id:"snac_8_4",names:_n("PANINI FROMAGE"),price:16,photo:_gp("90ffeb79d53a18fcf46e6c544b9cadb0faf69e8e4a1286a13ea33485bbdf571e")},
        {id:"snac_8_5",names:_n("PANINI CHARCUTERIE"),price:16,photo:_gp("22776ff81c4228ef6b38f444653daada0dc9e9194444c416146945d32b1b9e39")},
      ]},
      {id:"sandwitch_9",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("SANDWITCH"),items:[
        {id:"snac_9_0",names:_n("SANDWITCH MIXTE"),price:20,photo:_gp("d2bd4907a9ab8c5b4a419e5dd5abbb2c81fb04a7972cf9862a45f2f6da2513d1")},
        {id:"snac_9_1",names:_n("SANDWITCH POULET"),price:18,photo:_gp("07b18cae644d74b72cb41d9eb2e87f37c16f8bde93a17474fc93faf9da1bcf96")},
        {id:"snac_9_2",names:_n("SANDWITCH VIANDE HACHEE"),price:18,photo:_gp("73ce431c316ec8f770caf5a7eeeb94ed47dac118c7c37fba506ff208f01c95f0")},
        {id:"snac_9_3",names:_n("SANDWITCH THON"),price:16,photo:_gp("b134012bc5a1f35c449ea09f81b0f564618d643fae0d57541b549fc170916a3a")},
        {id:"snac_9_4",names:_n("SANDWITCH FROMAGE"),price:14,photo:_gp("74ca3d6d4004e650dde3ea5c6352fb59ecb9a6fd3f5cd30b3c5b50067a6d4538")},
        {id:"snac_9_5",names:_n("SANDWITCH CHARCUTERIE"),price:14,photo:_gp("c83445493bbd1d1f4a71e97284e2b70dcf2b9107f13e9bee1972e8ae41e982c5")},
      ]},
      {id:"3ich_10",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("3ICH"),items:[
        {id:"snac_10_0",names:_n("3ICH MIXTE"),price:22,photo:_gp("3f1b699f0747698b74ced405951e5bb678e38fdb00fb8da647f0e519dfb5f549")},
      ]},
      {id:"jus_11",emoji:"\\ud83e\\uddc3",names:_n("JUS"),items:[
        {id:"snac_11_0",names:_n("ZA3ZA3"),price:39,photo:_gp("c95c12dc85613c1ad8808de9b43e204c4d13ce4792e9a67ddd23be39c7bbe4b3")},
        {id:"snac_11_1",names:_n("JUS PANACHE"),price:21,photo:_gp("48df1492618a503767ccd83021a59bbe1023c5812d3367d009e9ad9d2375f958")},
      ]},
      {id:"menuenfant_12",emoji:"\\ud83e\\udd61",names:_n("MENU ENFANTS"),items:[
        {id:"snac_12_0",names:_n("MENU ENFANT NUGGET"),price:31,photo:_gp("a4e061a093bf1d7c95a95b19f698a99eaaa7ce172be7a2434ea9b2acda84393f")},
      ]},
      {id:"tajinem9il_13",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("TAJINE / M9ILA"),items:[
        {id:"snac_13_0",names:_n("M9ILA FRUIT DE MER"),price:50,photo:_gp("34f4b3c57188bf8e74259f635ab74e7ddf2b02597168b283c0a0129f1332d456")},
        {id:"snac_13_1",names:_n("VIANDE HACHE"),price:36,photo:_gp("ca685edf17451fd2033084aaac8ae830bb0dd03d70b9e6eb5c9723479ad2c6e5")},
      ]},
      {id:"wrap_14",emoji:"\\ud83c\\udf54",names:_n("WRAP"),items:[
        {id:"snac_14_0",names:_n("WRAP CORDON BLEU"),price:42,photo:_gp("82d8b46fd3c09d34ce1e431d2051d78ace89d0c9c51091918f6432e03ab1320e")},
        {id:"snac_14_1",names:_n("WRAP MIXTE"),price:40,photo:_gp("f9c81af9dad2cc85d95c1530ebb2003ce7465208ab398cfa34b337a7b7177707")},
        {id:"snac_14_2",names:_n("WRAP CHAWARMA"),price:38,photo:_gp("95e4ec2ea57024971ca80d31d08f90597f9ca8a38e154d5dd3ef73e2c9b766f9")},
        {id:"snac_14_3",names:_n("WRAP CHIKEN"),price:38,photo:_gp("589ded37a622f7f736be238741f3fae913c0dfec35773960cdd2e95b3c70a357")},
        {id:"snac_14_4",names:_n("WRAP VIANDE HACHEE"),price:38,photo:_gp("4c53b160b7e9bc38975a5c176df4b7d4c4c9cd85f55f8f5c7c46c0d6b7a74193")},
        {id:"snac_14_5",names:_n("WRAP NUGGET"),price:38,photo:_gp("8e5a3841dd5461d19922c91755a2b5cd709c43ed04dbc9d495c37ec4c2109c41")},
        {id:"snac_14_6",names:_n("WRAP THON"),price:37,photo:_gp("f513cf54a231104c961aa9c99ef776dbe3474db12e786e82ce7f2808f4f8c5e7")},
      ]},
      {id:"salades_15",emoji:"\\ud83e\\udd57",names:_n("SALADES"),items:[
        {id:"snac_15_0",names:_n("SALADE Royal"),price:57,photo:_gp("3dc1bcbad85444481df51d0746a5c75ef21440864ba728402ab7f59fd733c0a6")},
        {id:"snac_15_1",names:_n("RIZ AUX FRUITS DE MER"),price:44,photo:_gp("0a750284491fc21e4acb349e76ca7404a4674b3666eab01bf0fdb1231804c5f3")},
        {id:"snac_15_2",names:_n("CEZAR"),price:26,photo:_gp("f8f5e6c68c5c6486d273d96b629d472033120ea5bd2e543056016cc4795d2495")},
        {id:"snac_15_3",names:_n("MEXICAINE"),price:21,photo:_gp("a1218921bbbc927a26b9ab647fdf1ed46119f0bf14357867042d0bbeed89c0ad")},
        {id:"snac_15_4",names:_n("NICOISE"),price:20,photo:_gp("9b099ad426252bbdb97bc42fa78659b966cb0e87a67fa7505bf923e94e277f43")},
      ]},
      {id:"jus_16",emoji:"\\ud83e\\uddc3",names:_n("Jus"),items:[
        {id:"snac_16_0",names:_n("Jus D'avocat Fruits Secs"),price:28,photo:_gp("4d620c9565e6786cba1c9294b06fd3603029ce19ba70110a4968c73b9c30ddbe")},
        {id:"snac_16_1",names:_n("Jus D'avocat Milka"),price:28,photo:_gp("bc7c4c224cbe4deb522761fdebdbd9246a2641e5cdeb61068bf55a38e149d731")},
        {id:"snac_16_2",names:_n("Jus D'avocat"),price:24,photo:_gp("4d620c9565e6786cba1c9294b06fd3603029ce19ba70110a4968c73b9c30ddbe")},
        {id:"snac_16_3",names:_n("Jus Panaché"),price:21,photo:_gp("bc7c4c224cbe4deb522761fdebdbd9246a2641e5cdeb61068bf55a38e149d731")},
        {id:"snac_16_4",names:_n("Jus D'ananas"),price:21,photo:_gp("4d620c9565e6786cba1c9294b06fd3603029ce19ba70110a4968c73b9c30ddbe")},
        {id:"snac_16_5",names:_n("Jus De Mangue"),price:21,photo:_gp("bc7c4c224cbe4deb522761fdebdbd9246a2641e5cdeb61068bf55a38e149d731")},
        {id:"snac_16_6",names:_n("Jus De Pomme"),price:20,photo:_gp("bc7c4c224cbe4deb522761fdebdbd9246a2641e5cdeb61068bf55a38e149d731")},
        {id:"snac_16_7",names:_n("Jus De Banane"),price:20,photo:_gp("bc7c4c224cbe4deb522761fdebdbd9246a2641e5cdeb61068bf55a38e149d731")},
        {id:"snac_16_8",names:_n("Jus D'orange"),price:18,photo:_gp("66235451167e91ff642a174a3df371019c4948ff74c39a895a0bf6fe2a490482")},
      ]},
      {id:"boissons_17",emoji:"\\ud83e\\udd64",names:_n("Boissons"),items:[
        {id:"snac_17_0",names:_n("Schweppes Citron 33cl"),price:14,photo:_gp("99b0de444453a274686a33947cbd0c32eb60795b10503d94e2fd804595328a8d")},
        {id:"snac_17_1",names:_n("Schweppes Tonic 33cl"),price:14,photo:_gp("9391fef2a8370bb9398e03cd6904df22c13442f49a728e419675f0f7a55d3dfd")},
        {id:"snac_17_2",names:_n("Coca Cola 25cl"),price:7,photo:_gp("23869489bab2d8d9d505c785b1a4ff70e96bf881026c311b9a241c3a069576ac")},
        {id:"snac_17_3",names:_n("Hawaï 25cl"),price:7,photo:_gp("d0e9a5b4bdba0b1c369a8c239fab0da3ce507fdc04a011bbd1edba398c5c5aaa")},
        {id:"snac_17_4",names:_n("7up 25cl"),price:7,photo:_gp("c86d9019d4206d58aebb6e83d9acb70d064d6cf0ffc41d507bf330353d36519a")},
        {id:"snac_17_5",names:_n("Pepsi 25cl"),price:7,photo:_gp("60da5d88f7302ba91b70346b4c7ea3091f9fe45b932d93940073a0d4d15d473a")},
        {id:"snac_17_6",names:_n("Miranda Orange 25cl"),price:7,photo:_gp("09396db2297e880b0f170f518e4d568a5fc8d4e2083de74ccd8d452690467fd8")},
        {id:"snac_17_7",names:_n("Miranda Pomme 25cl"),price:7,photo:_gp("7f95efb407275688c7ad2434da457b7111feab5667f1e838d0c05e90de065ffc")},
      ]},
    ],
  },
  {
    id:"bubbles-boost-asf",name:"Bubbles & boost",
    tagline:_n("Bubbles & boost · Safi"),
    logo:"\\ud83e\\uddcb",cover:_gp("e3008dde1cb32e292b9201adf51d4319ded70472be7f1220e4d9652988d48468"),
    cuisine:_n("Bubble Tea & Smoothies"),tags:["bubble-tea", "smoothies"],
    rating:0,deliveryTime:"15\\u201320",minOrder:30,
    address:'Safi, Maroc',
    categories:[
      {id:"promotions_0",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Promotions"),items:[
        {id:"bubb_0_0",names:_n("Café Espresso"),price:16,photo:_gp("e3008dde1cb32e292b9201adf51d4319ded70472be7f1220e4d9652988d48468")},
        {id:"bubb_0_1",names:_n("Cappucinno"),price:25,photo:_gp("7f2300057644bcdf4b6eb30dfc234d3520dc458f26f3af2d077d3656c4cf55b0")},
        {id:"bubb_0_2",names:_n("Café Crème"),price:18,photo:_gp("b63ee861195b9ba1365d0a39e9c0e1bbfcaa40b2cdd5b41af277557e5e3b222e")},
      ]},
      {id:"topdesvent_1",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Top des ventes"),items:[
        {id:"bubb_1_0",names:_n("BUBBLES MILKSHAKE"),price:43,photo:_gp("")},
        {id:"bubb_1_1",names:_n("Crêpe twix"),price:36,photo:_gp("")},
        {id:"bubb_1_2",names:_n("BUBBLES ICE TEA"),price:39,photo:_gp("")},
      ]},
      {id:"bubblesice_2",emoji:"\\ud83e\\uddcb",names:_n("BUBBLES ICE TEA"),items:[
        {id:"bubb_2_0",names:_n("BUBBLES ICE TEA"),price:39,photo:_gp("")},
      ]},
      {id:"bubblesmil_3",emoji:"\\ud83e\\udd64",names:_n("BUBBLES MILKSHAKE"),items:[
        {id:"bubb_3_0",names:_n("BUBBLES MILKSHAKE"),price:43,photo:_gp("")},
      ]},
      {id:"freakshake_4",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("FreakShake"),items:[
        {id:"bubb_4_0",names:_n("FreakShake kinder Bueno"),price:36,photo:_gp("")},
        {id:"bubb_4_1",names:_n("Freakshake twix"),price:36,photo:_gp("")},
        {id:"bubb_4_2",names:_n("FreakShake kitkat"),price:36,photo:_gp("")},
        {id:"bubb_4_3",names:_n("FreakShake snickers"),price:36,photo:_gp("")},
      ]},
      {id:"matchaboos_5",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("MATCHA BOOST"),items:[
        {id:"bubb_5_0",names:_n("matcha honey lime"),price:43,photo:_gp("")},
        {id:"bubb_5_1",names:_n("big matcha energy"),price:39,photo:_gp("")},
        {id:"bubb_5_2",names:_n("MATCHA CARAMEL"),price:36,photo:_gp("")},
        {id:"bubb_5_3",names:_n("Matcha mango ice latte"),price:36,photo:_gp("")},
        {id:"bubb_5_4",names:_n("Matcha caramel cannelle ice latte"),price:36,photo:_gp("")},
        {id:"bubb_5_5",names:_n("Matcha amlou signature"),price:36,photo:_gp("")},
        {id:"bubb_5_6",names:_n("MATCHA FRAPPE"),price:34,photo:_gp("")},
        {id:"bubb_5_7",names:_n("MATCHA ICE LATTE STRAWBERY"),price:34,photo:_gp("")},
        {id:"bubb_5_8",names:_n("Matcha ice pistache"),price:34,photo:_gp("")},
        {id:"bubb_5_9",names:_n("MATCHA LATTE"),price:31,photo:_gp("")},
        {id:"bubb_5_10",names:_n("MATCHA ICE LATTE"),price:31,photo:_gp("")},
      ]},
      {id:"stressdown_6",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("STRESS DOWN"),items:[
        {id:"bubb_6_0",names:_n("DESTRESS"),price:39,photo:_gp("")},
        {id:"bubb_6_1",names:_n("IRON MAN"),price:39,photo:_gp("")},
        {id:"bubb_6_2",names:_n("SPORTS JUICE"),price:33,photo:_gp("")},
        {id:"bubb_6_3",names:_n("GO TENNIS"),price:33,photo:_gp("")},
        {id:"bubb_6_4",names:_n("PRINCE OF GREEN"),price:33,photo:_gp("")},
        {id:"bubb_6_5",names:_n("PICK ME UP"),price:33,photo:_gp("")},
      ]},
      {id:"healthypow_7",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("healthy power"),items:[
        {id:"bubb_7_0",names:_n("the nutty"),price:39,photo:_gp("")},
        {id:"bubb_7_1",names:_n("unicorn tears"),price:39,photo:_gp("")},
        {id:"bubb_7_2",names:_n("big matcha energy"),price:39,photo:_gp("")},
        {id:"bubb_7_3",names:_n("beets beries"),price:36,photo:_gp("")},
        {id:"bubb_7_4",names:_n("desert sunset"),price:33,photo:_gp("")},
        {id:"bubb_7_5",names:_n("smoot basilic"),price:33,photo:_gp("")},
        {id:"bubb_7_6",names:_n("tahiti"),price:31,photo:_gp("")},
        {id:"bubb_7_7",names:_n("chocolate flex"),price:31,photo:_gp("")},
      ]},
      {id:"specialesh_8",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("SPECIALE SHAKES"),items:[
        {id:"bubb_8_0",names:_n("AVO SHAKE"),price:34,photo:_gp("")},
        {id:"bubb_8_1",names:_n("POWER SHAKE"),price:31,photo:_gp("")},
      ]},
      {id:"crpes_9",emoji:"\\ud83e\\udd5e",names:_n("Crêpes"),items:[
        {id:"bubb_9_0",names:_n("Crêpe magnum"),price:48,photo:_gp("")},
        {id:"bubb_9_1",names:_n("Crêpe Double chocolat"),price:39,photo:_gp("")},
        {id:"bubb_9_2",names:_n("Kids crêpe"),price:39,photo:_gp("")},
        {id:"bubb_9_3",names:_n("Crêpe snickers"),price:36,photo:_gp("")},
        {id:"bubb_9_4",names:_n("Crêpe twix"),price:36,photo:_gp("")},
        {id:"bubb_9_5",names:_n("Crêpe nutella banane Oreo"),price:33,photo:_gp("")},
        {id:"bubb_9_6",names:_n("Crêpe au nutella et banane"),price:31,photo:_gp("")},
        {id:"bubb_9_7",names:_n("Crêpe au Nutella kitkat et chocolat blanc"),price:31,photo:_gp("")},
        {id:"bubb_9_8",names:_n("Crêpe au Nutella et lotus"),price:31,photo:_gp("")},
        {id:"bubb_9_9",names:_n("Crêpe oreo nutella"),price:31,photo:_gp("")},
        {id:"bubb_9_10",names:_n("Crêpe nutella"),price:29,photo:_gp("")},
      ]},
      {id:"creperolls_10",emoji:"\\ud83c\\udf63",names:_n("CREPE ROLLS KOUNAFA DUBAI"),items:[
        {id:"bubb_10_0",names:_n("Crêpe Dubai roulée kounafa banane"),price:51,photo:_gp("")},
        {id:"bubb_10_1",names:_n("CREPE ROLLS KOUNAFA MAGNUM"),price:57,photo:_gp("")},
        {id:"bubb_10_2",names:_n("CREPE ROLLS KOUNAFA LOTUS"),price:48,photo:_gp("")},
        {id:"bubb_10_3",names:_n("CREPE ROLLS KOUNAFA OREO"),price:48,photo:_gp("")},
        {id:"bubb_10_4",names:_n("CREPE ROLLS KOUNAFA PISTACHE"),price:48,photo:_gp("")},
      ]},
      {id:"crepesroll_11",emoji:"\\ud83c\\udf63",names:_n("CREPES ROLLS chocolat"),items:[
        {id:"bubb_11_0",names:_n("CREPE ROLLS MAGNUM"),price:48,photo:_gp("")},
        {id:"bubb_11_1",names:_n("CREPES ROLLS TROIS CHOCOLATS"),price:39,photo:_gp("")},
        {id:"bubb_11_2",names:_n("CREPE ROLLS PISTACHE Nutella"),price:34,photo:_gp("")},
        {id:"bubb_11_3",names:_n("CREPE ROLLS LOTUS Nutella caramel"),price:34,photo:_gp("")},
        {id:"bubb_11_4",names:_n("Crêpe ROLLS Nutella crème Kinder Bueno"),price:34,photo:_gp("")},
        {id:"bubb_11_5",names:_n("CREPE ROLLS OReo Nutella et chocolat BLANC"),price:31,photo:_gp("")},
        {id:"bubb_11_6",names:_n("CREPE ROLLS KITKAT"),price:31,photo:_gp("")},
        {id:"bubb_11_7",names:_n("Crêpe ROLLS Nutella Maltesers"),price:31,photo:_gp("")},
        {id:"bubb_11_8",names:_n("Crêpe ROLLS nutella et M&ms"),price:31,photo:_gp("")},
        {id:"bubb_11_9",names:_n("CREPE ROLLS NUTELLA"),price:29,photo:_gp("")},
        {id:"bubb_11_10",names:_n("CREPE ROLLS double chocolats BANANE"),price:28,photo:_gp("")},
      ]},
      {id:"icetea_12",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("ICE TEA"),items:[        {id:"bubb_12_0",names:_n("Ice tea au choix"),price:31,photo:_gp("")},
      ]},
      {id:"milkshake_13",emoji:"\\ud83e\\udd64",names:_n("Milkshake"),items:[
        {id:"bubb_13_0",names:_n("MILKSHAKE FRAISE"),price:34,photo:_gp("")},
        {id:"bubb_13_1",names:_n("MILKSHAKE CARAMEL"),price:34,photo:_gp("")},
        {id:"bubb_13_2",names:_n("MILKSHAKE VANILLE"),price:34,photo:_gp("")},
        {id:"bubb_13_3",names:_n("MILKSHAKE NOISETTE"),price:34,photo:_gp("")},
        {id:"bubb_13_4",names:_n("MILKSHAKE CHOCOLAT"),price:34,photo:_gp("")},
        {id:"bubb_13_5",names:_n("MILKSHAKE OREO"),price:34,photo:_gp("")},
        {id:"bubb_13_6",names:_n("MILKSHAKE BLUEBERRY"),price:34,photo:_gp("")},
        {id:"bubb_13_7",names:_n("MILKSHAKE CAFE"),price:34,photo:_gp("")},
        {id:"bubb_13_8",names:_n("MILKSHAKE COCO"),price:34,photo:_gp("")},
        {id:"bubb_13_9",names:_n("MILKSHAKE ANANAS"),price:34,photo:_gp("")},
        {id:"bubb_13_10",names:_n("MILKSHAKE POMME VERTE"),price:34,photo:_gp("")},
        {id:"bubb_13_11",names:_n("MILKSHAKE FRUIT DE DRAGON"),price:34,photo:_gp("")},
        {id:"bubb_13_12",names:_n("MILKSHAKE AVOCADO"),price:34,photo:_gp("")},
      ]},
      {id:"mojitos_14",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("MOJITOS"),items:[
        {id:"bubb_14_0",names:_n("MOJITO RED BULL"),price:43,photo:_gp("")},
        {id:"bubb_14_1",names:_n("MOJITO BURN"),price:34,photo:_gp("")},
        {id:"bubb_14_2",names:_n("MOJITO PINA COLADA"),price:34,photo:_gp("")},
        {id:"bubb_14_3",names:_n("MOJITO PESCA"),price:34,photo:_gp("")},
        {id:"bubb_14_4",names:_n("MOJITO FRUIT ROUGE"),price:34,photo:_gp("")},
        {id:"bubb_14_5",names:_n("MOJITO MANGUE"),price:31,photo:_gp("")},
        {id:"bubb_14_6",names:_n("MOJITO VIRGIN"),price:31,photo:_gp("")},
        {id:"bubb_14_7",names:_n("MOJITO COCO"),price:31,photo:_gp("")},
        {id:"bubb_14_8",names:_n("MOJITO BLEU"),price:31,photo:_gp("")},
      ]},
      {id:"jusfrais_15",emoji:"\\ud83e\\uddc3",names:_n("JUS FRAIS"),items:[
        {id:"bubb_15_0",names:_n("TROPICAL"),price:31,photo:_gp("")},
        {id:"bubb_15_1",names:_n("PINA COLADA"),price:31,photo:_gp("")},
        {id:"bubb_15_2",names:_n("PANACHE DE FRUIT"),price:31,photo:_gp("")},
        {id:"bubb_15_3",names:_n("Jus MANGUE"),price:31,photo:_gp("")},
        {id:"bubb_15_4",names:_n("JUS ANANAS"),price:31,photo:_gp("")},
        {id:"bubb_15_5",names:_n("JUS AVOCAT"),price:31,photo:_gp("")},
        {id:"bubb_15_6",names:_n("JUS FRAISE"),price:28,photo:_gp("")},
        {id:"bubb_15_7",names:_n("JUS BETTRAVE"),price:25,photo:_gp("")},
        {id:"bubb_15_8",names:_n("JUS CAROTTE"),price:25,photo:_gp("")},
        {id:"bubb_15_9",names:_n("JUS BANANE"),price:22,photo:_gp("")},
        {id:"bubb_15_10",names:_n("JUS POMME"),price:22,photo:_gp("")},
        {id:"bubb_15_11",names:_n("JUS ORANGE"),price:22,photo:_gp("")},
      ]},
      {id:"icelatte_16",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("ICE LATTE"),items:[
        {id:"bubb_16_0",names:_n("ice latte caramel"),price:31,photo:_gp("")},
        {id:"bubb_16_1",names:_n("ice latte vanille"),price:31,photo:_gp("")},
        {id:"bubb_16_2",names:_n("ice latte chocolat"),price:31,photo:_gp("")},
        {id:"bubb_16_3",names:_n("ice latte noisette"),price:31,photo:_gp("")},
        {id:"bubb_16_4",names:_n("Amlou Ice coffee"),price:31,photo:_gp("")},
        {id:"bubb_16_5",names:_n("Spanish Ice latté"),price:31,photo:_gp("")},
        {id:"bubb_16_6",names:_n("ice latte fraise"),price:31,photo:_gp("")},
        {id:"bubb_16_7",names:_n("ice latte mangue"),price:31,photo:_gp("")},
        {id:"bubb_16_8",names:_n("ICE COFFEE CORTADO"),price:28,photo:_gp("")},
        {id:"bubb_16_9",names:_n("ice coffee"),price:25,photo:_gp("")},
      ]},
      {id:"dubaicups_17",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Dubai cups"),items:[
        {id:"bubb_17_0",names:_n("Dubai banana cup"),price:39,photo:_gp("")},
      ]},
      {id:"cafschocol_18",emoji:"\\u2615",names:_n("Cafés / chocolats"),items:[
        {id:"bubb_18_0",names:_n("Illy"),price:25,photo:_gp("")},
        {id:"bubb_18_1",names:_n("Cappucinno"),price:25,photo:_gp("7f2300057644bcdf4b6eb30dfc234d3520dc458f26f3af2d077d3656c4cf55b0")},
        {id:"bubb_18_2",names:_n("Chocolat Fondue"),price:25,photo:_gp("8557260e884f682db18f9bf65345cfcb7f3ec37386d961ed881008efc43bd1fb")},
        {id:"bubb_18_3",names:_n("Macchiatto"),price:22,photo:_gp("c8cbb18e94ce42135c06a78f43cb1d2e50a3b8e90d534552a79a279c8d30aa1b")},
        {id:"bubb_18_4",names:_n("Nespresso"),price:20,photo:_gp("")},
        {id:"bubb_18_5",names:_n("Café Crème"),price:18,photo:_gp("b63ee861195b9ba1365d0a39e9c0e1bbfcaa40b2cdd5b41af277557e5e3b222e")},
        {id:"bubb_18_6",names:_n("Café Espresso"),price:16,photo:_gp("e3008dde1cb32e292b9201adf51d4319ded70472be7f1220e4d9652988d48468")},
      ]},
    ],
  },
  {
    id:"taco",name:"TACO",
    tagline:_n("TACO · Safi"),
    logo:"\\ud83c\\udf2e",cover:_gp("7ad7ea9bd358d6a6ef88ab75587a2ad669c14e5c468cf82ea9cb57cad9252119"),
    cuisine:_n("Tacos & Mexican"),tags:["tacos", "mexican"],
    rating:0,deliveryTime:"20\\u201330",minOrder:35,
    address:'Safi, Maroc',
    categories:[
      {id:"promotions_0",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Promotions"),items:[
        {id:"taco_0_0",names:_n("Offre 5"),price:99,photo:_gp("7ad7ea9bd358d6a6ef88ab75587a2ad669c14e5c468cf82ea9cb57cad9252119")},
        {id:"taco_0_1",names:_n("Offre 1"),price:82,photo:_gp("3d111794740e9a7837957d9b03de284b2089323fb129a58172be6ce82f57afd1")},
        {id:"taco_0_2",names:_n("Offre 3"),price:82,photo:_gp("37a67cd6342133eca7c373c60ad900be6c54411079352a8b8a721b5b3a80ff48")},
      ]},
      {id:"topdesvent_1",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Top des ventes"),items:[
        {id:"taco_1_0",names:_n("Tacos Taco"),price:43,photo:_gp("cac496424d0f2b8c09b1abadfd466cc35b730a326f7f7da842296b23a7be3cb0")},
        {id:"taco_1_1",names:_n("Tacos New York"),price:43,photo:_gp("9c6fcf5e17b549a6aebc9395c69cd43995c8794ae388ad28891a45b77928da22")},
        {id:"taco_1_2",names:_n("Marcopolo"),price:57,photo:_gp("37152dca0c88807ee637b4e58e85456efd5828f1a75643627cbc78bf59f955dc")},
      ]},
      {id:"glovopromo_2",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Glovopromos"),items:[
        {id:"taco_2_0",names:_n("Offre 5"),price:99,photo:_gp("7ad7ea9bd358d6a6ef88ab75587a2ad669c14e5c468cf82ea9cb57cad9252119")},
        {id:"taco_2_1",names:_n("Offre 1"),price:82,photo:_gp("3d111794740e9a7837957d9b03de284b2089323fb129a58172be6ce82f57afd1")},
        {id:"taco_2_2",names:_n("Offre 2"),price:82,photo:_gp("99a19007ded0d0af3faf75239d1f6126c0fa3057acb234369fb21dadcb6b5b03")},
        {id:"taco_2_3",names:_n("Offre 3"),price:82,photo:_gp("37a67cd6342133eca7c373c60ad900be6c54411079352a8b8a721b5b3a80ff48")},
        {id:"taco_2_4",names:_n("Offre 4"),price:82,photo:_gp("df40dd95e2bccaf36fdbcbc53889533400d0675bb14f3782f41c4271117292ee")},
      ]},
      {id:"tacosseul_3",emoji:"\\ud83c\\udf2e",names:_n("Tacos Seul"),items:[
        {id:"taco_3_0",names:_n("Tacos Cordon Bleu"),price:43,photo:_gp("1dcccfc775acfd68b24bda0e55f6fda94a8f55b2758f0ef8505da175dc2d842f")},
        {id:"taco_3_1",names:_n("Tacos Taco"),price:43,photo:_gp("cac496424d0f2b8c09b1abadfd466cc35b730a326f7f7da842296b23a7be3cb0")},
        {id:"taco_3_2",names:_n("Tacos New York"),price:43,photo:_gp("9c6fcf5e17b549a6aebc9395c69cd43995c8794ae388ad28891a45b77928da22")},
        {id:"taco_3_3",names:_n("Tacos Nuggets"),price:39,photo:_gp("09e13c51c98ec13c7c4572365013d68b786637becc3c26373fabfdaaf3ba7bc7")},
        {id:"taco_3_4",names:_n("Tacos Italien"),price:38,photo:_gp("0c0af2ef43584448f82d8b864e0aacafc0399fea5bd01a991d5e94ba3e8f6e06")},
        {id:"taco_3_5",names:_n("Tacos mixte"),price:33,photo:_gp("66bc04431f784b31d98cad781714be8ae8735e04f7cfb405fe78a1bb4cf86376")},
      ]},
      {id:"burgersseu_4",emoji:"\\ud83c\\udf54",names:_n("Burgers Seul"),items:[
        {id:"taco_4_0",names:_n("Super Délice"),price:43,photo:_gp("")},
        {id:"taco_4_1",names:_n("Cordon Bleu Ciabatta"),price:43,photo:_gp("4dee441d975c71f53bb001ae2151d92fd8ff70ac633b4be9b53c31b4e9e4b22b")},
        {id:"taco_4_2",names:_n("Beef Ciabatta"),price:43,photo:_gp("e7240c472b3e9cab9b7cb0e948dd978ede8268f867d3569584416ab2ed020f88")},
        {id:"taco_4_3",names:_n("Onion burger"),price:43,photo:_gp("")},
        {id:"taco_4_4",names:_n("Pepperoni burger"),price:43,photo:_gp("")},
        {id:"taco_4_5",names:_n("Double Cheese"),price:40,photo:_gp("1a596f63ded8ec5e0e88b9bd80e6550abc91271614b7231f487b137057add781")},
        {id:"taco_4_6",names:_n("Taco Burger"),price:40,photo:_gp("72ac74229e7561b39bc4f74a4797d44e8beac921582b14acd5a062eee38d17b4")},
        {id:"taco_4_7",names:_n("Chicken Burger"),price:33,photo:_gp("5581ec6ec72af2d4ae4ab314e9cd5cd9c1de5d30bb7e690ec9124f0c2fb32b02")},
      ]},
      {id:"pizzeriata_5",emoji:"\\ud83c\\udf2e",names:_n("Pizzeria Taco"),items:[
        {id:"taco_5_0",names:_n("Pizza Taco"),price:56,photo:_gp("14a22a13c3352f8e13c1b3d454a77e7ee2a19d5707f56391d0e2e531ca5f681e")},
        {id:"taco_5_1",names:_n("Pizza 4 Fromages"),price:48,photo:_gp("")},
        {id:"taco_5_2",names:_n("Pizza Pêcheur"),price:48,photo:_gp("")},
        {id:"taco_5_3",names:_n("Pizza Extra"),price:48,photo:_gp("")},
        {id:"taco_5_4",names:_n("Pizza Veggie"),price:39,photo:_gp("")},
        {id:"taco_5_5",names:_n("Pizza Thon"),price:39,photo:_gp("")},
        {id:"taco_5_6",names:_n("Pizza Viande Hachée"),price:39,photo:_gp("")},
        {id:"taco_5_7",names:_n("Pizza Poulet"),price:39,photo:_gp("")},
      ]},
      {id:"platsetgra_6",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Plats et Gratins"),items:[
        {id:"taco_6_0",names:_n("Marcopolo"),price:57,photo:_gp("37152dca0c88807ee637b4e58e85456efd5828f1a75643627cbc78bf59f955dc")},
        {id:"taco_6_1",names:_n("Emincé de Poulet"),price:52,photo:_gp("4e3a168794a8ef7beb7cc525a0e0991e6006008b68420680a63857949ced9e90")},
        {id:"taco_6_2",names:_n("Chicken Taco"),price:52,photo:_gp("")},
        {id:"taco_6_3",names:_n("Patatchio"),price:34,photo:_gp("a7cdbc10be0fb4a437cee35cccf3ffccc5adeaf519750c8a8b1420f448056803")},
      ]},
      {id:"petitesfai_7",emoji:"\\ud83c\\udf71",names:_n("Petites Faims"),items:[
        {id:"taco_7_0",names:_n("9 Pieces Nuggets"),price:32,photo:_gp("faf4ebbc8078be526298a17a5cb77a7c85553d5ff67431e8db8e1e17d8cbbe87")},
        {id:"taco_7_1",names:_n("6 Pieces Nuggets"),price:26,photo:_gp("618dff04d86224dff38a32f1ce5b221c985e40b666aa4b844fc606db1eaacd4b")},
        {id:"taco_7_2",names:_n("Croquettes Fromage"),price:25,photo:_gp("1797c5e8a5ad058a6a6a9eeea6ecd157a63f4b9f6d7330682aec85f25bbd1f1c")},
        {id:"taco_7_3",names:_n("Mozza Sticks"),price:24,photo:_gp("5f82a4c68ad67562db02e360dfa13019baf66c0e2dc79f5de4ae91cf5a6a1800")},
        {id:"taco_7_4",names:_n("Onion Rings"),price:22,photo:_gp("e051b1e65ec05215d16c16bec13f086d1f7ec4882dd1b8d91241071e69c9a9db")},
        {id:"taco_7_5",names:_n("4 Pieces Nuggets"),price:22,photo:_gp("68e4f5c5ddbf48006002315d0864e066f856ecdbc865011aa0dff2583d03079f")},
        {id:"taco_7_6",names:_n("Potatoes"),price:13,photo:_gp("bb1d2398c3d77738a69429cd149f0447b9b82894fddb0d4c389dc6452488ac43")},
        {id:"taco_7_7",names:_n("Frites"),price:10,photo:_gp("83c6a84371e15deea49c7208002ac94937ccf48edf5dee92645f0725e8fba929")},
      ]},
      {id:"boissons_8",emoji:"\\ud83e\\udd64",names:_n("Boissons"),items:[
        {id:"taco_8_0",names:_n("Boisson gazeuse"),price:13,photo:_gp("59f0aef8e4ad54600d25991d645c47d2bbecde6404b8cb9f11e92f5143a16e04")},
      ]},
    ],
  },
  {
    id:"la-parrilla-asf",name:"La Parrilla",
    tagline:_n("La Parrilla · Safi"),
    logo:"\\ud83e\\udd69",cover:_gp("d510f964b70c91a61ea21b2d4a161e2aaece38b6c3fca609b11cd2c12067e481"),
    cuisine:_n("Grills & BBQ"),tags:["grill", "bbq"],
    rating:0,deliveryTime:"25\\u201335",minOrder:45,
    address:'Safi, Maroc',
    categories:[
      {id:"topdesvent_0",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Top des ventes"),items:[
        {id:"lapa_0_0",names:_n("Chawarma sandwich xl"),price:73,photo:_gp("d510f964b70c91a61ea21b2d4a161e2aaece38b6c3fca609b11cd2c12067e481")},
        {id:"lapa_0_1",names:_n("Shawarma XL & Frites & Boisson"),price:86,photo:_gp("296d2518795b9bfc5644dd525ff2552dca392c52e547f9aee1cbe8790b200f2f")},
        {id:"lapa_0_2",names:_n("Shawarma L & Frites & Boisson"),price:67,photo:_gp("296d2518795b9bfc5644dd525ff2552dca392c52e547f9aee1cbe8790b200f2f")},
      ]},
      {id:"pomoglovo_1",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Pomo Glovo"),items:[
        {id:"lapa_1_0",names:_n("Shawarma XL & Frites & Boisson"),price:86,photo:_gp("296d2518795b9bfc5644dd525ff2552dca392c52e547f9aee1cbe8790b200f2f")},
        {id:"lapa_1_1",names:_n("Shawarma Plat & Frites & Boisson"),price:77,photo:_gp("296d2518795b9bfc5644dd525ff2552dca392c52e547f9aee1cbe8790b200f2f")},
        {id:"lapa_1_2",names:_n("Shawarma L & Frites & Boisson"),price:67,photo:_gp("296d2518795b9bfc5644dd525ff2552dca392c52e547f9aee1cbe8790b200f2f")},
        {id:"lapa_1_3",names:_n("Shawarma M & Frites & Boisson"),price:65,photo:_gp("296d2518795b9bfc5644dd525ff2552dca392c52e547f9aee1cbe8790b200f2f")},
      ]},
      {id:"chawarmas_2",emoji:"\\ud83e\\udd59",names:_n("Chawarmas"),items:[
        {id:"lapa_2_0",names:_n("Chawarma sandwich xl"),price:73,photo:_gp("d510f964b70c91a61ea21b2d4a161e2aaece38b6c3fca609b11cd2c12067e481")},
        {id:"lapa_2_1",names:_n("Chawarma plat"),price:64,photo:_gp("5e0d3e9acddcc329f4aeacd5ad9cb1f5557969748e1b97bbe32ecdedf049f9ae")},
        {id:"lapa_2_2",names:_n("Chawarma sandwich L"),price:54,photo:_gp("b4cdfa7eb58101cfe4cb1e6147975c75687ab7f7aa8eaefedd677c1e12022243")},
        {id:"lapa_2_3",names:_n("Chawarma M"),price:51,photo:_gp("be22b88da1b24d52933c406db869cc6f776373c5dd3f23388c2710caed5d0b69")},
      ]},
      {id:"wrapmexica_3",emoji:"\\ud83c\\udf54",names:_n("Wrap mexican"),items:[
        {id:"lapa_3_0",names:_n("Wrap tikka"),price:56,photo:_gp("cfc35d2b61bc94d40beb6fd3aef4ce13cb872ef2ab74c8db38bfefbb0eb4bc1a")},
        {id:"lapa_3_1",names:_n("Crispy chiken"),price:51,photo:_gp("")},
        {id:"lapa_3_2",names:_n("Wrap mexican"),price:51,photo:_gp("")},
      ]},
      {id:"tacos_4",emoji:"\\ud83c\\udf2e",names:_n("Tacos"),items:[
        {id:"lapa_4_0",names:_n("Tacos mixte"),price:54,photo:_gp("6f047dea5f472fa42821885c763c8d861b72a4df0097dc83c4b884a5dab278fa")},
        {id:"lapa_4_1",names:_n("Tacos cordon bleu"),price:53,photo:_gp("85f2a22edd27bff9e1595fd5f3b4e748aba312dfe773e76a213cdc8dfb4e1058")},
        {id:"lapa_4_2",names:_n("Tacos viande hachée"),price:52,photo:_gp("4b00dd6cdf245c6a9d5430af835f9290219821f97dc826c07bf13234b4a54208")},
        {id:"lapa_4_3",names:_n("Tacos nuggets"),price:52,photo:_gp("76d1a2fd09229d7e1ce355f04f1f3554191b25e39a9c74ac6d4e9aa0a5233343")},
        {id:"lapa_4_4",names:_n("Tacos poulet"),price:49,photo:_gp("9e94554cbd854eaafa42f385c8f9ff2be733f6b8a0daeeedf8309955d18815be")},
      ]},
      {id:"burgers_5",emoji:"\\ud83c\\udf54",names:_n("Burgers"),items:[
        {id:"lapa_5_0",names:_n("Burger Tiger"),price:71,photo:_gp("cd5eb67710c145a0de07da93c31035c30a60a6ff428d7d42503ca20b8fb647ea")},
        {id:"lapa_5_1",names:_n("Burger Buffalo"),price:71,photo:_gp("80bcdaf3e026106a1bb8f3d5f1f96e896bed5195737e82140aad1464f9ebc03e")},
        {id:"lapa_5_2",names:_n("Burger Italiano"),price:71,photo:_gp("5f71f9e2d2a8d7af6789094987fed68fd15d864f600d789552cccea92c9bc0f5")},
        {id:"lapa_5_3",names:_n("Burger Savora"),price:60,photo:_gp("0dac62c4694588411aeacd1d8348184f976ce736fc1c7c797ed6f4d971e23b29")},
        {id:"lapa_5_4",names:_n("Burger Bling Bling"),price:60,photo:_gp("1bdc15e3a45b3db4cd65fe95227b29f57a7d2d1e3cdc0c957f4ea5151c459aeb")},
        {id:"lapa_5_5",names:_n("Burger Kids"),price:50,photo:_gp("d079641664c79ed96a6b387207732a0d50c6f39fb51ffde360d20f2328df0453")},
      ]},
      {id:"grillades_6",emoji:"\\ud83e\\udd69",names:_n("Grillades"),items:[
        {id:"lapa_6_0",names:_n("Brochette mixte"),price:82,photo:_gp("165f369f72ac0c0b4559bec96fb25771c16f0d76fbbe8b5814c19b18a0aaaf5b")},
        {id:"lapa_6_1",names:_n("Brochette merguez"),price:78,photo:_gp("")},
        {id:"lapa_6_2",names:_n("Brochette viande hachée"),price:71,photo:_gp("2559a3a7675bc9a85bc2265954d974c1beef2478ea2d8c89eb764e9ff2f0fc4b")},
        {id:"lapa_6_3",names:_n("Brochette poulet"),price:71,photo:_gp("597b5a0fdca005484e90be035f67ab4309f1272f598054218ee6165ea7b5f08f")},
      ]},
    ],
  },
  {
    id:"ali-baba-asf",name:"Ali Baba",
    tagline:_n("Ali Baba · Safi"),
    logo:"\\ud83e\\udd59",cover:_gp("647b3fdff62c6bc88aff89eca6f98b342b15f8f3e0bc5615e426afda1908a73b"),
    cuisine:_n("Oriental Cuisine"),tags:["oriental", "chawarma"],
    rating:0,deliveryTime:"20\\u201330",minOrder:40,
    address:'Safi, Maroc',
    categories:[
      {id:"promotions_0",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Promotions"),items:[
        {id:"alib_0_0",names:_n("Pizza Royal"),price:52,photo:_gp("")},
        {id:"alib_0_1",names:_n("Pizza 4 Saisons"),price:52,photo:_gp("")},
        {id:"alib_0_2",names:_n("Shawarma Super"),price:52,photo:_gp("")},
      ]},
      {id:"topdesvent_1",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Top des ventes"),items:[
        {id:"alib_1_0",names:_n("Shawarma Sec Double Fromage"),price:39,photo:_gp("")},
        {id:"alib_1_1",names:_n("Shawarma Super"),price:52,photo:_gp("")},
        {id:"alib_1_2",names:_n("Tacos Ali Baba"),price:52,photo:_gp("647b3fdff62c6bc88aff89eca6f98b342b15f8f3e0bc5615e426afda1908a73b")},
      ]},
      {id:"salades_2",emoji:"\\ud83e\\udd57",names:_n("Salades"),items:[
        {id:"alib_2_0",names:_n("Salade Ali Baba"),price:39,photo:_gp("")},
        {id:"alib_2_1",names:_n("Salade De Pâtes"),price:31,photo:_gp("")},
        {id:"alib_2_2",names:_n("Salade Mexicaine"),price:26,photo:_gp("")},
        {id:"alib_2_3",names:_n("Salade Niçoise"),price:26,photo:_gp("")},
        {id:"alib_2_4",names:_n("Salade Thon"),price:22,photo:_gp("")},
      ]},
      {id:"pizzas_3",emoji:"\\ud83c\\udf55",names:_n("Pizzas"),items:[
        {id:"alib_3_0",names:_n("Pizza Royal"),price:52,photo:_gp("")},
        {id:"alib_3_1",names:_n("Pizza 4 Saisons"),price:52,photo:_gp("")},
        {id:"alib_3_2",names:_n("Pizza Fruits De Mer"),price:48,photo:_gp("")},
        {id:"alib_3_3",names:_n("Pizza 4 Fromages"),price:39,photo:_gp("")},
        {id:"alib_3_4",names:_n("Pizza Poulet"),price:39,photo:_gp("")},
        {id:"alib_3_5",names:_n("Pizza Viande Hachée"),price:39,photo:_gp("")},
        {id:"alib_3_6",names:_n("Pizza Cozamia"),price:39,photo:_gp("")},
        {id:"alib_3_7",names:_n("Pizza Végétarienne"),price:39,photo:_gp("")},
        {id:"alib_3_8",names:_n("Pizza Thon"),price:39,photo:_gp("")},
        {id:"alib_3_9",names:_n("Pizza Calzone"),price:39,photo:_gp("")},
        {id:"alib_3_10",names:_n("Pizza Margherita"),price:26,photo:_gp("")},
      ]},
      {id:"tacos_4",emoji:"\\ud83c\\udf2e",names:_n("Tacos"),items:[
        {id:"alib_4_0",names:_n("Tacos Viande Hachée"),price:48,photo:_gp("")},
        {id:"alib_4_1",names:_n("Tacos Crispy"),price:48,photo:_gp("")},
        {id:"alib_4_2",names:_n("Tacos Ali Baba"),price:52,photo:_gp("647b3fdff62c6bc88aff89eca6f98b342b15f8f3e0bc5615e426afda1908a73b")},
        {id:"alib_4_3",names:_n("Tacos Mixte"),price:52,photo:_gp("")},
        {id:"alib_4_4",names:_n("Tacos Shawarma"),price:48,photo:_gp("")},
        {id:"alib_4_5",names:_n("Tacos Cordon Bleu"),price:48,photo:_gp("")},
        {id:"alib_4_6",names:_n("Tacos Dinde"),price:39,photo:_gp("")},
        {id:"alib_4_7",names:_n("Tacos Saucisse"),price:39,photo:_gp("")},
        {id:"alib_4_8",names:_n("Tacos Nuggets"),price:39,photo:_gp("")},
      ]},
      {id:"pastas_5",emoji:"\\ud83c\\udf5d",names:_n("Pastas"),items:[
        {id:"alib_5_0",names:_n("Pasta Spaghetti Fruits De Mer"),price:61,photo:_gp("")},
        {id:"alib_5_1",names:_n("Pasta Penne Bolognaise"),price:48,photo:_gp("")},
        {id:"alib_5_2",names:_n("Pasta Spaghetti Bolognaise"),price:48,photo:_gp("")},
        {id:"alib_5_3",names:_n("Pasta Penne Poulet Aux Champignons"),price:48,photo:_gp("")},
        {id:"alib_5_4",names:_n("Pasta Spaghetti Carbonara"),price:48,photo:_gp("")},
      ]},
      {id:"sandwiches_6",emoji:"\\ud83e\\udd59",names:_n("Sandwiches"),items:[
        {id:"alib_6_0",names:_n("Sandwich Fruits De Mer"),price:35,photo:_gp("")},
        {id:"alib_6_1",names:_n("Sandwich Mixte"),price:31,photo:_gp("")},
        {id:"alib_6_2",names:_n("Sandwich Viande Hachée"),price:26,photo:_gp("")},
        {id:"alib_6_3",names:_n("Sandwich Dinde"),price:26,photo:_gp("")},
        {id:"alib_6_4",names:_n("Sandwich Saucisse"),price:26,photo:_gp("")},
        {id:"alib_6_5",names:_n("Sandwich Italien"),price:26,photo:_gp("")},
        {id:"alib_6_6",names:_n("Sandwich Thon Spécial"),price:22,photo:_gp("")},
        {id:"alib_6_7",names:_n("Sandwich Thon"),price:18,photo:_gp("")},
        {id:"alib_6_8",names:_n("Sandwich Omelette"),price:18,photo:_gp("")},
      ]},
      {id:"burgers_7",emoji:"\\ud83c\\udf54",names:_n("Burgers"),items:[
        {id:"alib_7_0",names:_n("Burger Double Black Royal"),price:70,photo:_gp("")},
        {id:"alib_7_1",names:_n("Burger Double Black + Œuf"),price:57,photo:_gp("")},
        {id:"alib_7_2",names:_n("Burger Double Black"),price:52,photo:_gp("")},
        {id:"alib_7_3",names:_n("Cheeseburger + Œuf"),price:39,photo:_gp("")},
        {id:"alib_7_4",names:_n("Simple Burger + Œuf"),price:39,photo:_gp("")},
        {id:"alib_7_5",names:_n("Cheeseburger"),price:39,photo:_gp("")},
        {id:"alib_7_6",names:_n("Chicken Burger"),price:39,photo:_gp("")},
        {id:"alib_7_7",names:_n("Simple Burger"),price:35,photo:_gp("")},
      ]},
      {id:"pasticcios_8",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Pasticcios"),items:[
        {id:"alib_8_0",names:_n("Pasticcio Shawarma"),price:48,photo:_gp("")},
        {id:"alib_8_1",names:_n("Pasticcio Mixte"),price:48,photo:_gp("")},
        {id:"alib_8_2",names:_n("Pasticcio Viande Hachée"),price:48,photo:_gp("")},
        {id:"alib_8_3",names:_n("Pasticcio Dinde"),price:39,photo:_gp("")},
        {id:"alib_8_4",names:_n("Pasticcio Charcuterie"),price:39,photo:_gp("")},
      ]},
      {id:"shawarmas_9",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Shawarmas"),items:[        {id:"alib_9_0",names:_n("Shawarma Super"),price:52,photo:_gp("")},
        {id:"alib_9_1",names:_n("Shawarma Normal"),price:35,photo:_gp("")},
        {id:"alib_9_2",names:_n("Shawarma Sec Aux Fromages"),price:39,photo:_gp("")},
        {id:"alib_9_3",names:_n("Shawarma Sec Double Fromage"),price:39,photo:_gp("")},
        {id:"alib_9_4",names:_n("Shawarma Mix Aux Fromages"),price:39,photo:_gp("")},
        {id:"alib_9_5",names:_n("Shawarma Fromage"),price:35,photo:_gp("")},
        {id:"alib_9_6",names:_n("Shawarma Sec"),price:35,photo:_gp("")},
      ]},
      {id:"boissons_10",emoji:"\\ud83e\\udd64",names:_n("Boissons"),items:[
        {id:"alib_10_0",names:_n("Coca Cola - 25cl Canette"),price:8,photo:_gp("")},
        {id:"alib_10_1",names:_n("Coca Cola Zero - 25cl Canette"),price:8,photo:_gp("")},
        {id:"alib_10_2",names:_n("Sprite Classique - 25cl Canette"),price:8,photo:_gp("")},
        {id:"alib_10_3",names:_n("Fanta Citron - 25cl Canette"),price:8,photo:_gp("")},
        {id:"alib_10_4",names:_n("Fanta Orange - 25cl Canette"),price:8,photo:_gp("")},
        {id:"alib_10_5",names:_n("Pom's Pomme - 25cl Canette"),price:8,photo:_gp("")},
        {id:"alib_10_6",names:_n("Hawaï Tropical - 25cl Canette"),price:8,photo:_gp("")},
        {id:"alib_10_7",names:_n("Sidi Ali 50cl"),price:7,photo:_gp("")},
      ]},
    ],
  },
  {
    id:"snack-feast-cook-asf",name:"Snack Feast Cook",
    tagline:_n("Snack Feast Cook · Safi"),
    logo:"\\ud83c\\udf71",cover:_gp("7e72b28f559705116a2bbe0cb3e817b825af904f5c9d579a9296616d7ec7cb44"),
    cuisine:_n("Snacks & Fast Food"),tags:["snack", "fast-food"],
    rating:0,deliveryTime:"20\\u201330",minOrder:30,
    address:'Safi, Maroc',
    categories:[
      {id:"promotions_0",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Promotions"),items:[
        {id:"snac_0_0",names:_n("Duo Pizza Pasticcio"),price:95,photo:_gp("7e72b28f559705116a2bbe0cb3e817b825af904f5c9d579a9296616d7ec7cb44")},
        {id:"snac_0_1",names:_n("Duo Saucisses"),price:52,photo:_gp("4a2033d0e0cab4c0b10c4046d2eaf848a1d7c36858d3c60ee9e07e42a045af37")},
        {id:"snac_0_2",names:_n("Trio Feast Cook"),price:113,photo:_gp("e90257a4a2fec15652e752ac3f2dfdae4d6ef5ebc97cfba8e8cc1f2052efb2b3")},
      ]},
      {id:"topdesvent_1",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Top des ventes"),items:[
        {id:"snac_1_0",names:_n("Chawarma Extra"),price:31,photo:_gp("4f98273db9aa45b048dc56005617178f44856484a8b3ec5bac21a94ff1467256")},
        {id:"snac_1_1",names:_n("Tacos Dinde"),price:31,photo:_gp("e68b9fe35904305df0638d22452f09aa8f33e22f2a58f13dd94c1cc61a1c8999")},
        {id:"snac_1_2",names:_n("Duo Saucisses"),price:52,photo:_gp("4a2033d0e0cab4c0b10c4046d2eaf848a1d7c36858d3c60ee9e07e42a045af37")},
      ]},
      {id:"combos_2",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Combos"),items:[
        {id:"snac_2_0",names:_n("Trio Feast Cook"),price:113,photo:_gp("e90257a4a2fec15652e752ac3f2dfdae4d6ef5ebc97cfba8e8cc1f2052efb2b3")},
        {id:"snac_2_1",names:_n("Duo Pizza Pasticcio"),price:95,photo:_gp("7e72b28f559705116a2bbe0cb3e817b825af904f5c9d579a9296616d7ec7cb44")},
        {id:"snac_2_2",names:_n("Duo Kefta"),price:65,photo:_gp("736785f26706e97b3aacd486ede735dd1836b48513b56755d0ed190154986f72")},
        {id:"snac_2_3",names:_n("Duo Dinde"),price:61,photo:_gp("928967925cb277c4ed5601f740a7fc62ce208cf43c4c60db94d87f40955aaebb")},
        {id:"snac_2_4",names:_n("Duo Saucisses"),price:52,photo:_gp("4a2033d0e0cab4c0b10c4046d2eaf848a1d7c36858d3c60ee9e07e42a045af37")},
      ]},
      {id:"salades_3",emoji:"\\ud83e\\udd57",names:_n("Salades"),items:[
        {id:"snac_3_0",names:_n("Salade Feast Cook"),price:26,photo:_gp("4030f01e39d1c8c8b516acd3a812beb3dfa22b4746f721d926419f80c4348948")},
        {id:"snac_3_1",names:_n("Cordon bleu"),price:24,photo:_gp("")},
        {id:"snac_3_2",names:_n("Salade Chicken"),price:22,photo:_gp("9aff6eab261597a9b5ab287448d1aa2bcceee4192b0df284c78acf4a7b6eaec3")},
        {id:"snac_3_3",names:_n("Salade Niçoise"),price:18,photo:_gp("1edf539064ee899eb3719a1d2d30e05312e47d4ad7e931d41e6d2f992b7cad8b")},
      ]},
      {id:"sandwichs_4",emoji:"\\ud83e\\udd59",names:_n("Sandwichs"),items:[
        {id:"snac_4_0",names:_n("Sandwich Mixte"),price:22,photo:_gp("08adb95732a2c6e48a5bc599144439e7746c982167f7e0f184c9d1dbc9aef979")},
        {id:"snac_4_1",names:_n("Sandwich Nuggets"),price:20,photo:_gp("08adb95732a2c6e48a5bc599144439e7746c982167f7e0f184c9d1dbc9aef979")},
        {id:"snac_4_2",names:_n("Sandwich Viande Hachée"),price:20,photo:_gp("08adb95732a2c6e48a5bc599144439e7746c982167f7e0f184c9d1dbc9aef979")},
        {id:"snac_4_3",names:_n("Sandwich Dinde"),price:18,photo:_gp("08adb95732a2c6e48a5bc599144439e7746c982167f7e0f184c9d1dbc9aef979")},
        {id:"snac_4_4",names:_n("Sandwich Merguez"),price:15,photo:_gp("08adb95732a2c6e48a5bc599144439e7746c982167f7e0f184c9d1dbc9aef979")},
        {id:"snac_4_5",names:_n("Sandwich Thon"),price:13,photo:_gp("08adb95732a2c6e48a5bc599144439e7746c982167f7e0f184c9d1dbc9aef979")},
      ]},
      {id:"paninis_5",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Paninis"),items:[
        {id:"snac_5_0",names:_n("Panini Mixte"),price:24,photo:_gp("143dc0a7530db6a85bed775e6ea1b2f45fa3be95c77f7e613153abc02e729e9a")},
        {id:"snac_5_1",names:_n("Panini Nuggets"),price:22,photo:_gp("143dc0a7530db6a85bed775e6ea1b2f45fa3be95c77f7e613153abc02e729e9a")},
        {id:"snac_5_2",names:_n("Panini Viande Hachée"),price:22,photo:_gp("143dc0a7530db6a85bed775e6ea1b2f45fa3be95c77f7e613153abc02e729e9a")},
        {id:"snac_5_3",names:_n("Panini Dinde"),price:20,photo:_gp("143dc0a7530db6a85bed775e6ea1b2f45fa3be95c77f7e613153abc02e729e9a")},
        {id:"snac_5_4",names:_n("Panini Merguez"),price:18,photo:_gp("143dc0a7530db6a85bed775e6ea1b2f45fa3be95c77f7e613153abc02e729e9a")},
        {id:"snac_5_5",names:_n("Panini Thon"),price:16,photo:_gp("143dc0a7530db6a85bed775e6ea1b2f45fa3be95c77f7e613153abc02e729e9a")},
      ]},
      {id:"tacos_6",emoji:"\\ud83c\\udf2e",names:_n("Tacos"),items:[
        {id:"snac_6_0",names:_n("Tacos Gratiné"),price:36,photo:_gp("bc0cbbba9d62cec7c46f59006c318e42ac06780915e1f84ad57760d0ba2449a7")},
        {id:"snac_6_1",names:_n("Tacos Mixte"),price:35,photo:_gp("6b3b51e39a68b06975a0cb550b3d6331eb987ca53d4efa922e34d9da6d4e80f0")},
        {id:"snac_6_2",names:_n("Tacos Nuggets"),price:33,photo:_gp("cbf05d521ceb08b1029d943a2209ca77f5f9ab91efc1a0a7ceb9812c84070a6b")},
        {id:"snac_6_3",names:_n("Tacos Dinde"),price:31,photo:_gp("e68b9fe35904305df0638d22452f09aa8f33e22f2a58f13dd94c1cc61a1c8999")},
        {id:"snac_6_4",names:_n("Tacos Viande Hachée"),price:31,photo:_gp("b9e00006bcc9b44b968834586c63f612affc6277b6d9272fe6ed23f0c2c9548f")},
        {id:"snac_6_5",names:_n("Tacos Chawarma"),price:31,photo:_gp("b8a7d3290d59b53e12149b506127faeb76c4c414562697ddfb670047abc67ea5")},
        {id:"snac_6_6",names:_n("Tacos Merguez"),price:26,photo:_gp("46000b34447f6a9fe8e29540606b79cae72a5de062a5fb3f67c50c0a0ae45667")},
      ]},
      {id:"chawarmas_7",emoji:"\\ud83e\\udd59",names:_n("Chawarmas"),items:[
        {id:"snac_7_0",names:_n("Chawarma Extra"),price:31,photo:_gp("4f98273db9aa45b048dc56005617178f44856484a8b3ec5bac21a94ff1467256")},
        {id:"snac_7_1",names:_n("Chawarma Fromage"),price:23,photo:_gp("833ad6b08407ddd6d5e75722ea2d08f6f569862cec84711d6e34e67d1199acea")},
        {id:"snac_7_2",names:_n("Chawarma Normale"),price:22,photo:_gp("197dd52c4c2324bfa23992f837038268c3ccc49277aad2aac4dca147b25d8523")},
      ]},
      {id:"burgers_8",emoji:"\\ud83c\\udf54",names:_n("Burgers"),items:[
        {id:"snac_8_0",names:_n("Royal Burger"),price:33,photo:_gp("cdc61f7a4f7a79306186a86e502c1aade14bb7910ff04806790948851b28a271")},
        {id:"snac_8_1",names:_n("Double Cheese Burger"),price:31,photo:_gp("cdc61f7a4f7a79306186a86e502c1aade14bb7910ff04806790948851b28a271")},
        {id:"snac_8_2",names:_n("Double Chicken Burger"),price:31,photo:_gp("3854f42f0194bcefda4f102ed8845ef2cc8af82bbcc8c0ce7dac76db704ff148")},
        {id:"snac_8_3",names:_n("Double Burger"),price:29,photo:_gp("f2e918cdfc506ae73d48bb2e968436fbcfc63f5b083f569bf3d299fee5d72a18")},
        {id:"snac_8_4",names:_n("Egg & Cheese Burger"),price:26,photo:_gp("f2e918cdfc506ae73d48bb2e968436fbcfc63f5b083f569bf3d299fee5d72a18")},
        {id:"snac_8_5",names:_n("Cheese Burger"),price:23,photo:_gp("cdc61f7a4f7a79306186a86e502c1aade14bb7910ff04806790948851b28a271")},
        {id:"snac_8_6",names:_n("Chicken Burger"),price:23,photo:_gp("3854f42f0194bcefda4f102ed8845ef2cc8af82bbcc8c0ce7dac76db704ff148")},
        {id:"snac_8_7",names:_n("Hamburger"),price:22,photo:_gp("cdc61f7a4f7a79306186a86e502c1aade14bb7910ff04806790948851b28a271")},
      ]},
      {id:"pizzas_9",emoji:"\\ud83c\\udf55",names:_n("Pizzas"),items:[
        {id:"snac_9_0",names:_n("Pizza Feast Cook (mixte)"),price:35,photo:_gp("d26adf245b660fb9150189496f132bffb4bc4646af6cf6b563332cdfc9ff3be5")},
        {id:"snac_9_1",names:_n("Pizza Tropical Hawaiienne"),price:31,photo:_gp("2fca932d2302f24527cca6bd45420f2042aad6f6a3d25af133a1440596eb5843")},
        {id:"snac_9_2",names:_n("Pizza Fruits de Mer"),price:31,photo:_gp("18dc2adc84e96d34194ada6aadea1882783fcd764bd467836707f8e0d65c5a5b")},
        {id:"snac_9_3",names:_n("Pizza Portofino (Viande Hachée)"),price:28,photo:_gp("20ec0d77d94d3b7514e3c5eb218412cc641cbdeed16867a71305906c3b56b9df")},
        {id:"snac_9_4",names:_n("Pizza Dinde Fumée"),price:28,photo:_gp("2ea2e41dc16815e712d2c702bf76073040822e131050875b20055569b69d4cab")},
        {id:"snac_9_5",names:_n("Pizza Végétarienne"),price:26,photo:_gp("ae693513b5f5e6cdb7aee41aa1d779c3930c8137e4e4a6f85490cc52c75ea51a")},
        {id:"snac_9_6",names:_n("Pizza Dinde"),price:24,photo:_gp("fb82a8a7d4df62b0152aaf59d4434fcdf1d1c29ec448dfdc004168f5552316a2")},
        {id:"snac_9_7",names:_n("Pizza Saucisse"),price:24,photo:_gp("e82e93b5e550bd44ad3ea4e587999c7e4f62abb44b75d7b00feee3570fb6042a")},
        {id:"snac_9_8",names:_n("Pizza Thon"),price:23,photo:_gp("12ed8fcc94ac25b8cae100e18808c8d67e99ed37453cc800932c8f56fbac3159")},
        {id:"snac_9_9",names:_n("Pizza Margarita"),price:22,photo:_gp("dabe6da3613aae405b4cdc417bceb94cd6fd8f251188af7bf2ac1b5478027f79")},
      ]},
      {id:"calzone_10",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Calzone"),items:[
        {id:"snac_10_0",names:_n("Calzone Mixte"),price:39,photo:_gp("197f0e48e74e36ec442c8d3e9584645d8bf8f22752d6c97a057beb2dd66a22c5")},
        {id:"snac_10_1",names:_n("Calzone Fruits De Mer"),price:36,photo:_gp("197f0e48e74e36ec442c8d3e9584645d8bf8f22752d6c97a057beb2dd66a22c5")},
        {id:"snac_10_2",names:_n("Calzone Viande Hachée"),price:35,photo:_gp("197f0e48e74e36ec442c8d3e9584645d8bf8f22752d6c97a057beb2dd66a22c5")},
        {id:"snac_10_3",names:_n("Calzone Dinde"),price:33,photo:_gp("197f0e48e74e36ec442c8d3e9584645d8bf8f22752d6c97a057beb2dd66a22c5")},
        {id:"snac_10_4",names:_n("Calzone Thon"),price:29,photo:_gp("197f0e48e74e36ec442c8d3e9584645d8bf8f22752d6c97a057beb2dd66a22c5")},
      ]},
      {id:"pasticcios_11",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Pasticcios"),items:[
        {id:"snac_11_0",names:_n("Pasticcio Mixte"),price:39,photo:_gp("c1ac1949c8bae5efed99b6c2fa3fa310b62882faab483c06b32d87988d60b1b7")},
        {id:"snac_11_1",names:_n("Pasticcio Fruits De Mer"),price:35,photo:_gp("584da32dcc1cc58e5651f52d0bab0c0015371b266cf7d0fb20b754da134b36e5")},
        {id:"snac_11_2",names:_n("Pasticcio Viande Hachée"),price:33,photo:_gp("584da32dcc1cc58e5651f52d0bab0c0015371b266cf7d0fb20b754da134b36e5")},
        {id:"snac_11_3",names:_n("Pasticcio Dinde Fumé"),price:33,photo:_gp("584da32dcc1cc58e5651f52d0bab0c0015371b266cf7d0fb20b754da134b36e5")},
        {id:"snac_11_4",names:_n("Pasticcio Dinde"),price:31,photo:_gp("584da32dcc1cc58e5651f52d0bab0c0015371b266cf7d0fb20b754da134b36e5")},
        {id:"snac_11_5",names:_n("Pasticcio Merguez"),price:28,photo:_gp("d6c989f160c8b0df986aa1a58bc781e4dbd798022a1f2b10d16f392cfa8ef0fd")},
      ]},
      {id:"piattos_12",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Piattos"),items:[
        {id:"snac_12_0",names:_n("Piatto Mixte"),price:39,photo:_gp("18652381450132c449f868e392f151af6185e6b6d3fec55b86ca5aa367d03104")},
        {id:"snac_12_1",names:_n("Piatto Dinde"),price:35,photo:_gp("bfe71f062ff69b66601c103c2cb2abd21c18e26da45efccdaedbf9309aa913e1")},
        {id:"snac_12_2",names:_n("Piatto Escalope"),price:35,photo:_gp("d44507112e2292d76c8ad1d1bd09f0985b5dc625f2f0099fbd72d9e214ae7a58")},
        {id:"snac_12_3",names:_n("Piatto Viande Hachée"),price:35,photo:_gp("a107209be9081f833df7bb08c46f491e1178d2973d07d3007291ce2cc0f7f044")},
      ]},
      {id:"plats_13",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Plats"),items:[
        {id:"snac_13_0",names:_n("Plat Mixte"),price:39,photo:_gp("940dd188276ae332a6d6b44e22c8c069713ebb36a2c4e01b3ca2ec1b7c202240")},
        {id:"snac_13_1",names:_n("Plat Nuggets"),price:36,photo:_gp("4c6585c135b399b9d3702870b9b9a79c446a86bfdc702afd3f3369566226b47a")},
        {id:"snac_13_2",names:_n("Plat Dinde"),price:35,photo:_gp("9e32197e6101f991e653f601977cf6cef63f2de9582d39e37df9fdab457c4429")},
        {id:"snac_13_3",names:_n("Plat Viande Hachée"),price:35,photo:_gp("44c5043a707dd2ecb55db16bbe74e642e734c83216ff883caf0069d069fc3680")},
        {id:"snac_13_4",names:_n("Plat Merguez"),price:33,photo:_gp("bb0472f11db6feee1c66169c4b527ec5e9d6f6152cbacb99f5bcaa3e705756ee")},
      ]},
      {id:"boissons_14",emoji:"\\ud83e\\udd64",names:_n("Boissons"),items:[
        {id:"snac_14_0",names:_n("Eaux Minérale 1,5L"),price:7,photo:_gp("e55707e7a80be56a476d3a9a9e9d4bc3457257ae21e302462534076b49e73d75")},
        {id:"snac_14_1",names:_n("Pepsi"),price:6,photo:_gp("a74deaa3352413222f0c237d90acb4c248f97680bcc53447f8f24ce4225e613e")},
        {id:"snac_14_2",names:_n("7 up"),price:6,photo:_gp("52707d6fe583f6f5582530d62a75f619e5ef50c50ddaf4973dc1614cf01e0114")},
        {id:"snac_14_3",names:_n("Mirinda orange"),price:6,photo:_gp("c4301dfbdcec206e1a908ee14c8f9a43fc32becae9ca0211d64b3eca53544169")},
        {id:"snac_14_4",names:_n("Mirinda ananas"),price:6,photo:_gp("9319dff2994e0a90fcf7709f4fd90ee74cece37d7dc4deee40fdb3f4f1a50d0e")},
        {id:"snac_14_5",names:_n("Mirinda citron"),price:6,photo:_gp("85ca2b19aa2335903722a48972a19b0fcf70d8afc8989cfa1e9dc93def16f14c")},
        {id:"snac_14_6",names:_n("Mirinda pomme"),price:6,photo:_gp("5d4bd93f21582b559447caf05dff820cec0923aba62fb4564b5344e49611fedf")},
        {id:"snac_14_7",names:_n("Eaux Minérale 50cl"),price:4,photo:_gp("8325e5e5f2a364fcaab5e6d9beb4f402094b5144182e5e7c0d0154c0d88e70a6")},
      ]},
      {id:"menuenfant_15",emoji:"\\ud83e\\udd61",names:_n("Menu Enfants"),items:[
        {id:"snac_15_0",names:_n("Mini Tacos enfant"),price:33,photo:_gp("77c316bbb18ff32c7d7af659e8c4e1e274a92db1d161abc0606ae5bf3fd2976a")},
        {id:"snac_15_1",names:_n("Mini Pizza enfant"),price:33,photo:_gp("857d872f0eb16be3e8f2ffad7552cf4af6d330ce3d2c0a0c7503417bd82de151")},
        {id:"snac_15_2",names:_n("Burger enfant"),price:33,photo:_gp("34445e3d83a02b28f6ffe68069ae928d8fd45db8c27397d60ed43de68c26f760")},
      ]},
      {id:"supplment_16",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Supplément"),items:[
        {id:"snac_16_0",names:_n("Nuggets 6 pièces"),price:18,photo:_gp("9382703db569607e2adae39576a1148dac632ace2ba64241812e6bcdb4efc3e8")},
        {id:"snac_16_1",names:_n("Sauces"),price:3,photo:_gp("d77e634c39428fbc420b6e5401c2b132f7cc53b7371514e9df3f192fdf0442e7")},
      ]},
    ],
  },
  {
    id:"restaurant-4-saisons2",name:"Restaurant 4 Saisons 2",
    tagline:_n("Restaurant 4 Saisons 2 · Safi"),
    logo:"\\ud83c\\udf7d\\ufe0f",cover:_gp("ceb5d2f7364ac4054ace82b6e95a3b0d50c5edf1d8b6f7f86cd5464f0ffffe16"),
    cuisine:_n("Moroccan & Mediterranean"),tags:["moroccan", "mediterranean"],
    rating:0,deliveryTime:"25\\u201335",minOrder:45,
    address:'Safi, Maroc',
    categories:[
      {id:"topdesvent_0",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Top des ventes"),items:[
        {id:"rest_0_0",names:_n("Tacos Mixte"),price:39,photo:_gp("ceb5d2f7364ac4054ace82b6e95a3b0d50c5edf1d8b6f7f86cd5464f0ffffe16")},
        {id:"rest_0_1",names:_n("Pizza 4 Saisons"),price:35,photo:_gp("2a5921943084cfc23438bfb7d0a83fa3a41ccd603fe803f9f3ac16789ca67b6b")},
        {id:"rest_0_2",names:_n("Pizza Fruit De Mer"),price:35,photo:_gp("12e23932cd30464d64a900c1ace548eea7b5a6a9497b9690bb99c8aa1c162719")},
      ]},
      {id:"salades_1",emoji:"\\ud83e\\udd57",names:_n("Salades"),items:[
        {id:"rest_1_0",names:_n("Salade César"),price:35,photo:_gp("d02abfcbf9bc767fb45737ec16cba4bbd2ac7692a622a743de376d5a5faa4669")},
        {id:"rest_1_1",names:_n("Salade Variée"),price:35,photo:_gp("165269c93e261ee065e6d330a8c8c540d407ba94b099b026d0be1f7d776d05ca")},
        {id:"rest_1_2",names:_n("Salade Mexicaine"),price:26,photo:_gp("cd14c6d2661f87b57c46b235677942d4971a7851f1192e787110bda2bf504872")},
      ]},
      {id:"plats_2",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Plats"),items:[
        {id:"rest_2_0",names:_n("Plat Crunchic"),price:57,photo:_gp("da270e269d659e67bfd86cd2ffc079033767eb11c0cfeac531475285dce823bc")},
        {id:"rest_2_1",names:_n("Plat Crispy"),price:52,photo:_gp("2c07cb68300a875503314b2306c556ea142e92c8a880cef3e4287c54f03666a6")},
        {id:"rest_2_2",names:_n("Paella Fruit De Mer"),price:52,photo:_gp("a582669a69966a5d9c53542b170dc5720b8da306bc4c4a00fbaac4d4c8bc9c14")},
        {id:"rest_2_3",names:_n("Plat Émincé De Poulet"),price:44,photo:_gp("476c0069901f3816f2c02c4c4d9968df10e32d936a4b278f1fabe1a65ff7a474")},
        {id:"rest_2_4",names:_n("Plat Brochette De Poulet"),price:39,photo:_gp("156acdf7037a0caed6f8ce84114d9363408e40cab1d92c99e4139dd0bf9e55ae")},
        {id:"rest_2_5",names:_n("Paella Poulet"),price:39,photo:_gp("f58988b030d8060a38661a5d601a2d60279df6f6bc1ace52425ca84a298a9ae0")},
      ]},
      {id:"tenders_3",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Tenders"),items:[
        {id:"rest_3_0",names:_n("Nugget 7pcs + Frites"),price:31,photo:_gp("40420a7ea7e69dca7364858f45a6ef1d04af6c94558bff3eefba20402ebc5d71")},
      ]},
      {id:"tajines_4",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Tajines"),items:[
        {id:"rest_4_0",names:_n("Tajine Fruit De Mer"),price:52,photo:_gp("aebd961b54d30d94f5069702ab994e27789803044847850702cf04972e0b8426")},
        {id:"rest_4_1",names:_n("Tajine Viande Hachée"),price:44,photo:_gp("4f76bfda122d94a3bf32a258acc60570a1152ec09713bd836c484a68ab866760")},
      ]},
      {id:"pizzas_5",emoji:"\\ud83c\\udf55",names:_n("Pizzas"),items:[
        {id:"rest_5_0",names:_n("Pizza Pepperoni"),price:35,photo:_gp("d3a395c2fa78b4ce706fdc676db292242a122f56cce85f54c0d10003ebd01685")},
        {id:"rest_5_1",names:_n("Pizza Royal"),price:35,photo:_gp("0058faede492b369e0d5d0661c4ef67cee0885d65a7fda3ddc6d054994559543")},
        {id:"rest_5_2",names:_n("Pizza 4 Saisons"),price:35,photo:_gp("2a5921943084cfc23438bfb7d0a83fa3a41ccd603fe803f9f3ac16789ca67b6b")},
        {id:"rest_5_3",names:_n("Pizza L'orientale"),price:35,photo:_gp("4f671ac5470fb82c095292d5dfd10f6249a6e525a64ed81b77912940677176f1")},
        {id:"rest_5_4",names:_n("Pizza Fruit De Mer"),price:35,photo:_gp("12e23932cd30464d64a900c1ace548eea7b5a6a9497b9690bb99c8aa1c162719")},
        {id:"rest_5_5",names:_n("Pizza Forest"),price:31,photo:_gp("753fbeddbd81c11fef63eeb1911a75c860ebedee6fa90babc7b0c84c039d2881")},
        {id:"rest_5_6",names:_n("Pizza 4 Fromage"),price:31,photo:_gp("99eb5f1fa0f9bae070e13055809fa3efc75f5a91e885cfd8585faf14e7a700c1")},
        {id:"rest_5_7",names:_n("Pizza Floride"),price:31,photo:_gp("14246f7fdbd3641acc33bd03881cce55a313bcc4c76902846d56c7234c0038ca")},
        {id:"rest_5_8",names:_n("Pizza Chicago"),price:31,photo:_gp("31968016c1a33ed2c2afb49475c19865d43fd41173f85f007532dceff59fda48")},
        {id:"rest_5_9",names:_n("Pizza Margarita"),price:26,photo:_gp("89b429987cb72699c7b54aa65d803319ef4a2a3d1cd250b5e79f7d240ec4823c")},
        {id:"rest_5_10",names:_n("Pizza Thon"),price:26,photo:_gp("ba893e62c9fca516a838a141810ca4233ec0b274a5674e752a5db6a9314dd46b")},
        {id:"rest_5_11",names:_n("Pizza Vaggie"),price:26,photo:_gp("4a76dd5c40245c746230b7e7c87f5d9cb9fd0fa4d314c62a1cd6c5aa365ae0fa")},
        {id:"rest_5_12",names:_n("Pizza La Charcuterie"),price:26,photo:_gp("d2250465af4bd1bd8aaa6a8a86c3a92c0bf10cb801af6a8cd60372de5c9a7589")},
      ]},
      {id:"ptes_6",emoji:"\\ud83c\\udf5d",names:_n("Pâtes"),items:[
        {id:"rest_6_0",names:_n("Tagliatelle Aux Fruits De Mer"),price:48,photo:_gp("c816c2b11a8d9722af034d9508667f82f431dda87990456316b96a372d427412")},
        {id:"rest_6_1",names:_n("Penne 4 Saisons"),price:44,photo:_gp("efbc56f6c2f971e56ba2bd6015896f908ca79aac5d72bf509d4ad4dedda2b841")},
        {id:"rest_6_2",names:_n("Tagliatelle Carbonara"),price:42,photo:_gp("3f1dd936ef3a1898874c91fe23aa7adce60a00b1b64ceee98efff612c2940ef4")},
        {id:"rest_6_3",names:_n("Penne Forestière"),price:39,photo:_gp("c186b6f4372d8e59b7b3cf5c3458a406f2953b5a662d4a69269c622ed434b01f")},
        {id:"rest_6_4",names:_n("Spaghetti Bolognaise"),price:35,photo:_gp("211f5770da157e6c408d9a940320dfdef85edc3bbc91c08523f10ca47865dceb")},
        {id:"rest_6_5",names:_n("Penne 4 Fromages"),price:35,photo:_gp("eec26fe2da5761460d16e7918ead423eeaa7248a1fedc2af68ec3635115594d6")},
        {id:"rest_6_6",names:_n("Penne Au Thon"),price:31,photo:_gp("9999115c2b0d9ff1cb33393dc9e30e4609422dbd087122eac840fc0456cc730f")},
      ]},
      {id:"ptesgratin_7",emoji:"\\ud83c\\udf5d",names:_n("Pâtes Gratinées"),items:[
        {id:"rest_7_0",names:_n("Gratin Aux Fruits De Mer"),price:48,photo:_gp("c5e2d6f9e83daed780d2dd372c6b9447d9b36b0aa7ec043604d4ef4fecfaa3a4")},
        {id:"rest_7_1",names:_n("Penne 4 Saisons Gratinée"),price:44,photo:_gp("40729f75c6a221cae7dcb64b985664f7181d360dbc9e2f47b63780b058f14c6b")},
        {id:"rest_7_2",names:_n("Penne Viande Hachée"),price:39,photo:_gp("6ddbc51003c875b25e065d1c23f8184f6be5cffa5d86bba20020470f12f55126")},
        {id:"rest_7_3",names:_n("Penne Poulet Champignons"),price:39,photo:_gp("929216081e336a9becefac2e49666aeb5120abfc36318d5b4fbb8c009a73533d")},
        {id:"rest_7_4",names:_n("Penne Charcuterie"),price:35,photo:_gp("8e528ee16a6937efc086d8ed0d353e44176420f0861c3c2e1975d4171fa1d4c6")},
      ]},
      {id:"pasticcios_8",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Pasticcios"),items:[
        {id:"rest_8_0",names:_n("Pasticcio Saisons (Mixe)"),price:44,photo:_gp("704f9d6e14d24f7cacace768aa53a53c5211bdc61597e05c082815867cc19ad6")},
        {id:"rest_8_1",names:_n("Pasticcio Fruits De Mer"),price:44,photo:_gp("704f9d6e14d24f7cacace768aa53a53c5211bdc61597e05c082815867cc19ad6")},
        {id:"rest_8_2",names:_n("Pasticcio Viande Hachée"),price:35,photo:_gp("704f9d6e14d24f7cacace768aa53a53c5211bdc61597e05c082815867cc19ad6")},
        {id:"rest_8_3",names:_n("Pasticcio Charcuterie"),price:35,photo:_gp("704f9d6e14d24f7cacace768aa53a53c5211bdc61597e05c082815867cc19ad6")},
        {id:"rest_8_4",names:_n("Pasticcio Poulet"),price:31,photo:_gp("704f9d6e14d24f7cacace768aa53a53c5211bdc61597e05c082815867cc19ad6")},
      ]},
      {id:"tacos_9",emoji:"\\ud83c\\udf2e",names:_n("Tacos"),items:[
        {id:"rest_9_0",names:_n("Tacos Méga"),price:52,photo:_gp("08df9da586a35ff95ae3c68347a02ab054971d602e1150b45f21710aafa273d1")},
        {id:"rest_9_1",names:_n("Tacos Mixte"),price:39,photo:_gp("ceb5d2f7364ac4054ace82b6e95a3b0d50c5edf1d8b6f7f86cd5464f0ffffe16")},
        {id:"rest_9_2",names:_n("Tacos 4 Saisons"),price:39,photo:_gp("ceb5d2f7364ac4054ace82b6e95a3b0d50c5edf1d8b6f7f86cd5464f0ffffe16")},
        {id:"rest_9_3",names:_n("Tacos Viande Hachée"),price:35,photo:_gp("a0372cdc7bcecc480940226054ceeeb5ba024eda22bf4db865edae28d18a5a7d")},
        {id:"rest_9_4",names:_n("Tacos Poulet"),price:35,photo:_gp("a0372cdc7bcecc480940226054ceeeb5ba024eda22bf4db865edae28d18a5a7d")},
        {id:"rest_9_5",names:_n("Tacos Nuggets"),price:35,photo:_gp("202e43c4afbd33fe4599ae435fac96e592acfc8368969dadc034eba8c5a153f3")},
      ]},
      {id:"sandwichs_10",emoji:"\\ud83e\\udd59",names:_n("Sandwichs"),items:[
        {id:"rest_10_0",names:_n("Sandwich 4 Saisons"),price:39,photo:_gp("bba754a3a34ec77e972e62136035331b8bdb254a505a48b09d888986a740fae5")},
        {id:"rest_10_1",names:_n("Sandwich Crispy"),price:35,photo:_gp("1f49b138e805a3507af767e9f82270c9d293d9271a9801c407c7d7a218b486ef")},
        {id:"rest_10_2",names:_n("Sandwich Le Sublime"),price:31,photo:_gp("78b8ab9d36dbc342aa983c238a4ca602db8c2e8941bd61bd0ff17a3cbf041d8b")},
        {id:"rest_10_3",names:_n("Sandwich Américain"),price:31,photo:_gp("ee7e3dfb00161e90c15f35e8b1fcec60c84971a98f00227ae753909f9498b6ab")},
        {id:"rest_10_4",names:_n("Sandwich Tandoori"),price:26,photo:_gp("6aab324cd09ffc2db668e026e7064842318439e9009e72da26942dbc590cb00b")},
        {id:"rest_10_5",names:_n("Sandwich L'oriental"),price:26,photo:_gp("c0eb692942b6b62336fc4677b5cc490ec82177763aa77294a91e617b437fc156")},
      ]},
      {id:"jus_11",emoji:"\\ud83e\\uddc3",names:_n("Jus"),items:[
        {id:"rest_11_0",names:_n("Jus Ananas Orange"),price:22,photo:_gp("21faa8233f8374d2eb6b1015bfc00100d3ae5d5a5a5ac9890fec0f04b538abce")},
        {id:"rest_11_1",names:_n("Jus Mangue"),price:22,photo:_gp("1908d636fa90133933af2bb5966a46d538026c6aae1c98c1f7cae60b4d9687b9")},
        {id:"rest_11_2",names:_n("Avocat fruits sec"),price:22,photo:_gp("")},
        {id:"rest_11_3",names:_n("Jus Panache"),price:22,photo:_gp("505a3fffd77c6310e6edbc19d70978e139e3e018ab91a1a7ccb5e94b9ef4edb3")},
        {id:"rest_11_4",names:_n("Jus banane Au Lait"),price:18,photo:_gp("1f5c219cf6e5ff2f6b9ef542dc0e7af9d3d71e7f033ec34f027441647ef334c1")},
        {id:"rest_11_5",names:_n("Jus banane Orange"),price:18,photo:_gp("9e22da4854374fa1467979567b18ba6b30190cf6a0feca348a5ee6635b205964")},
        {id:"rest_11_6",names:_n("Avocat"),price:18,photo:_gp("")},
      ]},
      {id:"boissons_12",emoji:"\\ud83e\\udd64",names:_n("Boissons"),items:[
        {id:"rest_12_0",names:_n("Canette 25cl"),price:6,photo:_gp("76f8f39d1e7a8dbbe769be42bd6a90a0ae8b4458208f7edd04ddad033065edab")},
        {id:"rest_12_1",names:_n("Eau Minérale 33cl"),price:5,photo:_gp("8f2050d8d89efa23ee55a9c631fea293dbfb3c264c33484b82fd033decedd1ce")},
      ]},
    ],
  },
  {
    id:"amore-italiano-asf",name:"Amor\\u00e9 Italiano",
    tagline:_n("Amoré Italiano · Safi"),
    logo:"\\ud83c\\udf5d",cover:_gp("d8f15c604220715e9c7995d768ea4c8f3c67d68e5f815ba91a629639c4023f72"),
    cuisine:_n("Italian Cuisine"),tags:["italian", "pizza", "pasta"],
    rating:0,deliveryTime:"25\\u201335",minOrder:40,
    address:'Safi, Maroc',
    categories:[
      {id:"topdesvent_0",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Top des ventes"),items:[
        {id:"amor_0_0",names:_n("Ciabatta Mixte"),price:57,photo:_gp("")},
        {id:"amor_0_1",names:_n("Pizza Amore Italiano"),price:86,photo:_gp("")},
        {id:"amor_0_2",names:_n("Ciabatta Viande hachée"),price:54,photo:_gp("")},
      ]},
      {id:"salades_1",emoji:"\\ud83e\\udd57",names:_n("Salades"),items:[
        {id:"amor_1_0",names:_n("Salade Fruits De Mer"),price:56,photo:_gp("d8f15c604220715e9c7995d768ea4c8f3c67d68e5f815ba91a629639c4023f72")},
        {id:"amor_1_1",names:_n("Salade Poulet"),price:53,photo:_gp("")},
        {id:"amor_1_2",names:_n("Salade Thon"),price:50,photo:_gp("")},
        {id:"amor_1_3",names:_n("Salade Niçoise"),price:46,photo:_gp("")},
        {id:"amor_1_4",names:_n("Salade Classique"),price:39,photo:_gp("")},
      ]},
      {id:"ciabatta_2",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("CIABATTA"),items:[
        {id:"amor_2_0",names:_n("Ciabatta Mixte"),price:57,photo:_gp("")},
        {id:"amor_2_1",names:_n("Ciabatta Viande hachée"),price:54,photo:_gp("")},
        {id:"amor_2_2",names:_n("Ciabatta Merguez"),price:53,photo:_gp("")},
        {id:"amor_2_3",names:_n("Ciabatta Poulet"),price:50,photo:_gp("")},
        {id:"amor_2_4",names:_n("Ciabatta thon"),price:47,photo:_gp("")},        {id:"amor_2_5",names:_n("Portion de frites"),price:18,photo:_gp("")},
      ]},
      {id:"calzone_3",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("CALZONE"),items:[
        {id:"amor_3_0",names:_n("Calzone fruits de mer"),price:54,photo:_gp("")},
        {id:"amor_3_1",names:_n("Calzone poulet champignon"),price:51,photo:_gp("")},
        {id:"amor_3_2",names:_n("Calzone Thon"),price:47,photo:_gp("")},
        {id:"amor_3_3",names:_n("Calzone Végétarienne"),price:44,photo:_gp("")},
      ]},
      {id:"pizzamdopi_4",emoji:"\\ud83c\\udf55",names:_n("Pizza M Dopio"),items:[
        {id:"amor_4_0",names:_n("Pizza Fruit De Mer"),price:87,photo:_gp("")},
        {id:"amor_4_1",names:_n("Pizza Amore Italiano"),price:86,photo:_gp("")},
        {id:"amor_4_2",names:_n("Pizza Mamma Mia (D)"),price:86,photo:_gp("0e431cca4ed1fa6655a4240e035e9a946b3220eaec6188a9b19f880b5bce7de6")},
        {id:"amor_4_3",names:_n("PIZZA REGINA D"),price:83,photo:_gp("")},
        {id:"amor_4_4",names:_n("Pizza Viande Hachee (D)"),price:83,photo:_gp("")},
        {id:"amor_4_5",names:_n("Pizza Poulet D"),price:83,photo:_gp("")},
        {id:"amor_4_6",names:_n("Pizza Thon D"),price:83,photo:_gp("")},
        {id:"amor_4_7",names:_n("Pizza PEPPERONI D"),price:83,photo:_gp("")},
        {id:"amor_4_8",names:_n("Pizza Salmone (D)"),price:79,photo:_gp("")},
        {id:"amor_4_9",names:_n("Pizza Mamma Mia (D2)"),price:78,photo:_gp("")},
        {id:"amor_4_10",names:_n("PIZZA VEGETARIENNE D"),price:70,photo:_gp("")},
        {id:"amor_4_11",names:_n("pizza 5 fromage D"),price:69,photo:_gp("")},
        {id:"amor_4_12",names:_n("Pizza Margherita (D)"),price:65,photo:_gp("")},
      ]},
      {id:"pizzasolo_5",emoji:"\\ud83c\\udf55",names:_n("Pizza solo"),items:[
        {id:"amor_5_0",names:_n("PIZZA SALMONE S"),price:59,photo:_gp("")},
        {id:"amor_5_1",names:_n("Pizza Frutti Di Mare S"),price:59,photo:_gp("32f9ad61d3d7430feaf86d59a3c3b848479eb654528de55f4456b9f8f46a1662")},
        {id:"amor_5_2",names:_n("PIZZAC POULET S"),price:52,photo:_gp("")},
        {id:"amor_5_3",names:_n("PIZZA VIANDE HACHEE S"),price:52,photo:_gp("")},
        {id:"amor_5_4",names:_n("Pizza Mamma Mia S"),price:51,photo:_gp("")},
        {id:"amor_5_5",names:_n("Pizza Regina S"),price:51,photo:_gp("24ea4682cd5c24237e35340013f9b59604f9f97e25c8398da306c01ca1241d08")},
        {id:"amor_5_6",names:_n("PIZZA 4 FROMAGE S"),price:50,photo:_gp("")},
        {id:"amor_5_7",names:_n("PIZZA PEPPERONI S"),price:47,photo:_gp("")},
        {id:"amor_5_8",names:_n("Pizza Thon S"),price:47,photo:_gp("")},
        {id:"amor_5_9",names:_n("pizza margarita s"),price:44,photo:_gp("")},
        {id:"amor_5_10",names:_n("Pizza Vegetariana S"),price:44,photo:_gp("")},
      ]},
      {id:"pasta_6",emoji:"\\ud83c\\udf5d",names:_n("Pasta"),items:[
        {id:"amor_6_0",names:_n("Pâtes Frutti Di Mare"),price:83,photo:_gp("31764abdb0a6b9ee058ed5d81fd8d059ca80ce10a4eeccfdaddbb1285b47a1fb")},
        {id:"amor_6_1",names:_n("Pâtes Tonno"),price:74,photo:_gp("b3694700349d21dd22796213e2820da7e40ef00b235a5f9b5a462e55efe6d67e")},
        {id:"amor_6_2",names:_n("Pâtes Bolognaises"),price:74,photo:_gp("3938ff8bac1252bf9b401fdcfd644686f39001d490f19a4e85f7ae4c0a31201a")},
        {id:"amor_6_3",names:_n("Pâtes Carbonara"),price:74,photo:_gp("dc43c435be393e1fdc7ac54d87f5593732248c84c750877f5b7794605a3fe54c")},
        {id:"amor_6_4",names:_n("Pâtes saumon"),price:72,photo:_gp("")},
        {id:"amor_6_5",names:_n("Pâtes 5 Fromaggio"),price:70,photo:_gp("08491c3f909cb67a6c5eb174920c618ce7821c9111bddb437709ed0f3ffd2438")},
        {id:"amor_6_6",names:_n("Pâtes Poulet Champignon"),price:65,photo:_gp("90d4529206ab945943aa06e28b9f4c8639db34de7cf744b1d21b17cebaf7deea")},
        {id:"amor_6_7",names:_n("Pâtes Pesto"),price:59,photo:_gp("f5cf95c416b143500c5a04861b0a1432bea8111f91d2122f5b1b5824a38da5c5")},
        {id:"amor_6_8",names:_n("Pâtes Arrabiata"),price:54,photo:_gp("")},
        {id:"amor_6_9",names:_n("Pâtes végétariennes"),price:54,photo:_gp("")},
        {id:"amor_6_10",names:_n("Pâtes Pomodoro"),price:48,photo:_gp("e3464d1bd2e6bd5b8685a400273c1b9cba6cd0173a55ac6c63b713e8b83c94cd")},
      ]},
      {id:"plats_7",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Plats"),items:[
        {id:"amor_7_0",names:_n("Ravioli Fruit Del Mare"),price:74,photo:_gp("8fa6fef1600c8841fa8f996e013c96cb13e3cbaf728480f63b603b3c74fb5d18")},
        {id:"amor_7_1",names:_n("Cordon Bleu"),price:69,photo:_gp("a3302925f2f778363166255d1df8d316be06537f7093b99794a469c9bb9097d4")},
        {id:"amor_7_2",names:_n("Ravioli"),price:68,photo:_gp("96ec06e5f493d747f567fcb025d2b480f8b68c19889fef6f8cab8168a057ad10")},
        {id:"amor_7_3",names:_n("Émincé De Poulet"),price:65,photo:_gp("cd160a41312d771022fda7748fc9e03853298e59f66184832bd7d67ff8960523")},
        {id:"amor_7_4",names:_n("Lasagne"),price:59,photo:_gp("56fe048a496af78792dee6905c68fa87ab334e299e8fd9d535ab3ff3cdec6907")},
      ]},
      {id:"jus_8",emoji:"\\ud83e\\uddc3",names:_n("Jus"),items:[
        {id:"amor_8_0",names:_n("Jus Mangue"),price:34,photo:_gp("6aa7a2f0e213bb0d882820d91d3e2d103cd7cc755315f2b3bb468e1cfb079b20")},
        {id:"amor_8_1",names:_n("VERGIN MOJITO"),price:33,photo:_gp("")},
        {id:"amor_8_2",names:_n("JUS BANANE"),price:31,photo:_gp("")},
        {id:"amor_8_3",names:_n("JUS POMME"),price:31,photo:_gp("")},
        {id:"amor_8_4",names:_n("JUS D'ORANGE"),price:28,photo:_gp("")},
        {id:"amor_8_5",names:_n("JUS CITRON"),price:26,photo:_gp("")},
      ]},
      {id:"boissons_9",emoji:"\\ud83e\\udd64",names:_n("Boissons"),items:[
        {id:"amor_9_0",names:_n("EAU MINIRALES 1.5L"),price:18,photo:_gp("")},
        {id:"amor_9_1",names:_n("PEPSI ZERO"),price:13,photo:_gp("")},
        {id:"amor_9_2",names:_n("MERINDA POMME"),price:13,photo:_gp("")},
        {id:"amor_9_3",names:_n("MERINDA ORANGE"),price:13,photo:_gp("")},
        {id:"amor_9_4",names:_n("MERINDA CITRON"),price:13,photo:_gp("")},
        {id:"amor_9_5",names:_n("PEPSI"),price:13,photo:_gp("")},
        {id:"amor_9_6",names:_n("7UP"),price:13,photo:_gp("")},
        {id:"amor_9_7",names:_n("Eau Minirale 50cl"),price:8,photo:_gp("218ab699d56c706fa3d2f8f3bd2e7aaf1f17ee02d83c18a27bc79db8c5361e17")},
      ]},
      {id:"dessert_10",emoji:"\\ud83c\\udf70",names:_n("DESSERT"),items:[
        {id:"amor_10_0",names:_n("TIRAMISU TRANCHE"),price:33,photo:_gp("")},
        {id:"amor_10_1",names:_n("GENOISE PISTACHE"),price:31,photo:_gp("")},
        {id:"amor_10_2",names:_n("CHEESECAKE KITKAT"),price:31,photo:_gp("")},
        {id:"amor_10_3",names:_n("CHEESECAKE CITRON"),price:31,photo:_gp("")},
        {id:"amor_10_4",names:_n("GENOISE PRALINE"),price:31,photo:_gp("")},
      ]},
    ],
  },
  {
    id:"cafe-restaurant-malak-rouh-safi-asf",name:"Malak Rouh Safi Sushi",
    tagline:_n("Malak Rouh Safi Sushi · Safi"),
    logo:"\\ud83c\\udf63",cover:_gp(""),
    cuisine:_n("Sushi & Asian"),tags:["sushi", "asian"],
    rating:0,deliveryTime:"25\\u201335",minOrder:45,
    address:'Safi, Maroc',
    categories:[
      {id:"topdesvent_0",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Top des ventes"),items:[
        {id:"cafe_0_0",names:_n("Spécial roll 16 pièces"),price:147,photo:_gp("")},
        {id:"cafe_0_1",names:_n("30 pièces"),price:199,photo:_gp("")},
        {id:"cafe_0_2",names:_n("16 Pièces"),price:99,photo:_gp("")},
      ]},
      {id:"nossalades_1",emoji:"\\ud83e\\udd57",names:_n("Nos Salades"),items:[
        {id:"cafe_1_0",names:_n("Salade Mr"),price:73,photo:_gp("")},
        {id:"cafe_1_1",names:_n("Salades Thai"),price:73,photo:_gp("")},
        {id:"cafe_1_2",names:_n("Salade Viet"),price:68,photo:_gp("")},
        {id:"cafe_1_3",names:_n("Salades Poulet"),price:63,photo:_gp("")},
        {id:"cafe_1_4",names:_n("Salade japonaise"),price:32,photo:_gp("")},
      ]},
      {id:"menuramada_2",emoji:"\\ud83e\\udd61",names:_n("Menu Ramadan"),items:[
        {id:"cafe_2_0",names:_n("SOLO ESSENTIAL"),price:82,photo:_gp("")},
      ]},
      {id:"specialpac_3",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Special Pack"),items:[
        {id:"cafe_3_0",names:_n("PACK MIDI"),price:135,photo:_gp("")},
      ]},
      {id:"nossoupes_4",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Nos Soupes"),items:[
        {id:"cafe_4_0",names:_n("Soupe Fruit de Mer"),price:63,photo:_gp("")},
        {id:"cafe_4_1",names:_n("Soupe Vietnamienne"),price:63,photo:_gp("")},
        {id:"cafe_4_2",names:_n("Soupe Poulet"),price:52,photo:_gp("")},
      ]},
      {id:"nosnems_5",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Nos Nems"),items:[
        {id:"cafe_5_0",names:_n("Nems Mixte"),price:68,photo:_gp("")},
        {id:"cafe_5_1",names:_n("Nems Crevettes"),price:58,photo:_gp("")},
        {id:"cafe_5_2",names:_n("Nems Poulet"),price:52,photo:_gp("")},
        {id:"cafe_5_3",names:_n("Nems vegitarien"),price:47,photo:_gp("")},
      ]},
      {id:"owok_6",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("O'Wok"),items:[
        {id:"cafe_6_0",names:_n("Wok Mixte"),price:105,photo:_gp("")},
        {id:"cafe_6_1",names:_n("Wok au Crevettes"),price:94,photo:_gp("")},
        {id:"cafe_6_2",names:_n("Wok poulet"),price:84,photo:_gp("")},
      ]},
      {id:"pokbowl_7",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Pok Bowl"),items:[
        {id:"cafe_7_0",names:_n("Pok mr"),price:84,photo:_gp("")},
        {id:"cafe_7_1",names:_n("Pok Bowl Crevette"),price:79,photo:_gp("")},
        {id:"cafe_7_2",names:_n("Pok Bowl Saumon"),price:73,photo:_gp("")},
      ]},
      {id:"mrtartare_8",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("MR Tartare"),items:[
        {id:"cafe_8_0",names:_n("Tartare mr"),price:89,photo:_gp("")},
        {id:"cafe_8_1",names:_n("Tartare Saumon"),price:73,photo:_gp("")},
        {id:"cafe_8_2",names:_n("Tartare Crevette"),price:68,photo:_gp("")},
      ]},
      {id:"tempura_9",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Tempura"),items:[
        {id:"cafe_9_0",names:_n("Tempura Mixte"),price:68,photo:_gp("")},
        {id:"cafe_9_1",names:_n("Ebi Tempura"),price:63,photo:_gp("")},
        {id:"cafe_9_2",names:_n("Calamar Rings"),price:58,photo:_gp("")},
        {id:"cafe_9_3",names:_n("Chicken Fry"),price:58,photo:_gp("")},
      ]},
      {id:"fritures_10",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Fritures"),items:[
        {id:"cafe_10_0",names:_n("Beignets Mixte"),price:47,photo:_gp("")},
        {id:"cafe_10_1",names:_n("Croquettes Saumons"),price:47,photo:_gp("")},
        {id:"cafe_10_2",names:_n("Beignets De Crevettes"),price:42,photo:_gp("")},
        {id:"cafe_10_3",names:_n("Croquettes Fromages"),price:36,photo:_gp("")},
      ]},
      {id:"assortimen_11",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Assortiment Brochettes"),items:[
        {id:"cafe_11_0",names:_n("Big box"),price:236,photo:_gp("")},
        {id:"cafe_11_1",names:_n("Middle Box"),price:157,photo:_gp("")},
        {id:"cafe_11_2",names:_n("Little Box"),price:84,photo:_gp("")},
      ]},
      {id:"nosbrochet_12",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Nos Brochettes"),items:[
        {id:"cafe_12_0",names:_n("Brochettes Saumon"),price:68,photo:_gp("")},
        {id:"cafe_12_1",names:_n("Brochettes Ebi"),price:63,photo:_gp("")},
        {id:"cafe_12_2",names:_n("Boeuf fromage"),price:58,photo:_gp("")},
        {id:"cafe_12_3",names:_n("Brochettes Tsukune"),price:47,photo:_gp("")},
        {id:"cafe_12_4",names:_n("Brochettes poulet"),price:47,photo:_gp("")},
      ]},
      {id:"maki6pcs_13",emoji:"\\ud83c\\udf63",names:_n("Maki 6pcs"),items:[
        {id:"cafe_13_0",names:_n("Maki crevettes"),price:42,photo:_gp("")},
        {id:"cafe_13_1",names:_n("Maki saumon"),price:42,photo:_gp("")},
        {id:"cafe_13_2",names:_n("Maki avocat"),price:36,photo:_gp("")},
        {id:"cafe_13_3",names:_n("Maki concombre"),price:32,photo:_gp("")},
      ]},
      {id:"rizcantona_14",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Riz Cantonais"),items:[
        {id:"cafe_14_0",names:_n("Riz Cantonais mixte"),price:94,photo:_gp("")},
        {id:"cafe_14_1",names:_n("Riz Cantonais Boeuf"),price:89,photo:_gp("")},
      ]},
      {id:"assortimen_15",emoji:"\\ud83c\\udf63",names:_n("Assortiment Spécial Roll"),items:[
        {id:"cafe_15_0",names:_n("100 pièces"),price:733,photo:_gp("")},
        {id:"cafe_15_1",names:_n("80 pièces"),price:566,photo:_gp("")},
        {id:"cafe_15_2",names:_n("60 pièces"),price:461,photo:_gp("")},
        {id:"cafe_15_3",names:_n("50 pièces"),price:356,photo:_gp("")},
        {id:"cafe_15_4",names:_n("30 pièces"),price:252,photo:_gp("")},
        {id:"cafe_15_5",names:_n("Spécial roll 16 pièces"),price:147,photo:_gp("")},
      ]},
      {id:"assortimen_16",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Assortiment Thaishi"),items:[
        {id:"cafe_16_0",names:_n("100 pièces"),price:524,photo:_gp("")},
        {id:"cafe_16_1",names:_n("80 pièces"),price:450,photo:_gp("")},
        {id:"cafe_16_2",names:_n("60 pièces"),price:345,photo:_gp("")},
        {id:"cafe_16_3",names:_n("50 pièces"),price:304,photo:_gp("")},
        {id:"cafe_16_4",names:_n("30 pièces"),price:199,photo:_gp("")},
        {id:"cafe_16_5",names:_n("16 Pièces"),price:99,photo:_gp("")},
      ]},
      {id:"nigirisash_17",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Nigiri & Sashimi 2pcs"),items:[
        {id:"cafe_17_0",names:_n("Sashimi paisson blanc"),price:47,photo:_gp("")},
        {id:"cafe_17_1",names:_n("Sashimi Saumon"),price:47,photo:_gp("")},
        {id:"cafe_17_2",names:_n("Sashimi crevettes"),price:42,photo:_gp("")},
        {id:"cafe_17_3",names:_n("Nigiri paisson blanc"),price:42,photo:_gp("")},
        {id:"cafe_17_4",names:_n("Nigiri Saumon"),price:42,photo:_gp("")},
        {id:"cafe_17_5",names:_n("Nigiri Crevettes"),price:36,photo:_gp("")},
      ]},
      {id:"aromakipan_18",emoji:"\\ud83c\\udf63",names:_n("Aromaki pané 8pcs"),items:[
        {id:"cafe_18_0",names:_n("Croquette Saumon"),price:68,photo:_gp("")},
        {id:"cafe_18_1",names:_n("Aromaki pané"),price:68,photo:_gp("")},
        {id:"cafe_18_2",names:_n("Dragon Eye"),price:63,photo:_gp("")},
        {id:"cafe_18_3",names:_n("Spring White"),price:63,photo:_gp("")},
      ]},
      {id:"crespymaki_19",emoji:"\\ud83c\\udf63",names:_n("Crespy maki 8pcs"),items:[
        {id:"cafe_19_0",names:_n("Crabe"),price:58,photo:_gp("")},
        {id:"cafe_19_1",names:_n("Saumon"),price:58,photo:_gp("")},
        {id:"cafe_19_2",names:_n("Crevettes"),price:52,photo:_gp("")},
      ]},
      {id:"ourcrunchy_20",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Our Crunchy 8 pcs"),items:[
        {id:"cafe_20_0",names:_n("Kani Fry"),price:63,photo:_gp("")},
        {id:"cafe_20_1",names:_n("Shaké Fry"),price:63,photo:_gp("")},
        {id:"cafe_20_2",names:_n("Ocrunchy"),price:58,photo:_gp("")},
        {id:"cafe_20_3",names:_n("Fry ebi Fry"),price:58,photo:_gp("")},
      ]},
      {id:"freshrolls_21",emoji:"\\ud83c\\udf63",names:_n("Fresh Rolls 4pcs"),items:[
        {id:"cafe_21_0",names:_n("Fresh Ebi crabe"),price:68,photo:_gp("")},
        {id:"cafe_21_1",names:_n("Fresh green"),price:68,photo:_gp("")},
        {id:"cafe_21_2",names:_n("Fresh Saumon"),price:63,photo:_gp("")},
        {id:"cafe_21_3",names:_n("Fresh Saumon avocat"),price:63,photo:_gp("")},
      ]},
      {id:"california_22",emoji:"\\ud83c\\udf63",names:_n("California Roll 4pcs"),items:[
        {id:"cafe_22_0",names:_n("Crabe"),price:52,photo:_gp("")},
        {id:"cafe_22_1",names:_n("Cream cheese"),price:47,photo:_gp("")},
        {id:"cafe_22_2",names:_n("Saumon"),price:42,photo:_gp("")},
        {id:"cafe_22_3",names:_n("Shaké yaki"),price:42,photo:_gp("")},
        {id:"cafe_22_4",names:_n("Crevette"),price:42,photo:_gp("")},
        {id:"cafe_22_5",names:_n("Classic"),price:32,photo:_gp("")},
      ]},
      {id:"futomaki5p_23",emoji:"\\ud83c\\udf63",names:_n("FUTOMAKI 5pcs"),items:[
        {id:"cafe_23_0",names:_n("Futomaki crabe"),price:63,photo:_gp("")},
        {id:"cafe_23_1",names:_n("Futomaki Saumon"),price:58,photo:_gp("")},
        {id:"cafe_23_2",names:_n("Futomaki crevette"),price:58,photo:_gp("")},
      ]},
      {id:"lesjus_24",emoji:"\\ud83e\\uddc3",names:_n("Les Jus"),items:[
        {id:"cafe_24_0",names:_n("jus de kiwi"),price:39,photo:_gp("")},
        {id:"cafe_24_1",names:_n("jus d'avocat"),price:39,photo:_gp("")},
        {id:"cafe_24_2",names:_n("jus de mangue"),price:39,photo:_gp("")},
        {id:"cafe_24_3",names:_n("panaché"),price:39,photo:_gp("")},
        {id:"cafe_24_4",names:_n("jus de fraise"),price:35,photo:_gp("")},
        {id:"cafe_24_5",names:_n("jus de citron"),price:31,photo:_gp("")},
        {id:"cafe_24_6",names:_n("jus de banane"),price:31,photo:_gp("")},
        {id:"cafe_24_7",names:_n("jus de pomme"),price:31,photo:_gp("")},
        {id:"cafe_24_8",names:_n("jus d'orange"),price:26,photo:_gp("")},
      ]},
      {id:"boissonsfr_25",emoji:"\\ud83e\\udd64",names:_n("Boissons Fraîches"),items:[
        {id:"cafe_25_0",names:_n("Redbull"),price:44,photo:_gp("")},
        {id:"cafe_25_1",names:_n("Eau Minérale 1l"),price:26,photo:_gp("")},
        {id:"cafe_25_2",names:_n("Soda"),price:18,photo:_gp("")},
        {id:"cafe_25_3",names:_n("eau minérale 50 cl"),price:18,photo:_gp("")},
        {id:"cafe_25_4",names:_n("Oulmès"),price:14,photo:_gp("")},
        {id:"cafe_25_5",names:_n("eau minérale 33 cl"),price:8,photo:_gp("")},
      ]},
    ],
  },
  {
    id:"sushi-safi",name:"Sushi Safi",
    tagline:_n("Sushi Safi · Safi"),
    logo:"\\ud83c\\udf63",cover:_gp(""),
    cuisine:_n("Sushi & Japanese"),tags:["sushi", "japanese"],
    rating:0,deliveryTime:"25\\u201335",minOrder:45,
    address:'Safi, Maroc',
    categories:[
      {id:"topdesvent_0",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Top des ventes"),items:[
        {id:"sush_0_0",names:_n("Ebi supreme 16 pcs"),price:121,photo:_gp("")},
        {id:"sush_0_1",names:_n("Shinobu smart 16 pcs"),price:121,photo:_gp("")},
        {id:"sush_0_2",names:_n("MR fusion mix 24 pcs"),price:183,photo:_gp("")},
      ]},
      {id:"nosassorti_1",emoji:"\\ud83c\\udf63",names:_n("Nos assortiments sushi"),items:[
        {id:"sush_1_0",names:_n("Color elite 60 pcs"),price:497,photo:_gp("")},
        {id:"sush_1_1",names:_n("Sensation mix 60 pcs"),price:497,photo:_gp("")},
        {id:"sush_1_2",names:_n("Signature 48 pcs"),price:377,photo:_gp("")},
        {id:"sush_1_3",names:_n("Katana club 48 pcs"),price:377,photo:_gp("")},
        {id:"sush_1_4",names:_n("Harmony deluxe 40 pcs"),price:309,photo:_gp("")},
        {id:"sush_1_5",names:_n("Prestige kai 36 pcs"),price:309,photo:_gp("")},
        {id:"sush_1_6",names:_n("Color wave 36 pcs"),price:309,photo:_gp("")},
        {id:"sush_1_7",names:_n("Fusion trio 40 pcs"),price:309,photo:_gp("")},
        {id:"sush_1_8",names:_n("Signature saito 24 pcs"),price:241,photo:_gp("")},
        {id:"sush_1_9",names:_n("Fusion lovers 30 pcs"),price:241,photo:_gp("")},
        {id:"sush_1_10",names:_n("Harmony mix 30 pcs"),price:241,photo:_gp("")},
        {id:"sush_1_11",names:_n("Gourmet deluxe 30 pcs"),price:241,photo:_gp("")},
        {id:"sush_1_12",names:_n("Tropic sunset 20 pcs"),price:183,photo:_gp("")},
        {id:"sush_1_13",names:_n("Dual signature 24 pcs"),price:183,photo:_gp("")},
        {id:"sush_1_14",names:_n("California master 24 pcs"),price:183,photo:_gp("")},
        {id:"sush_1_15",names:_n("Ebi crunchy fest 24 pcs"),price:183,photo:_gp("")},        {id:"sush_1_16",names:_n("Aromaki selection 24 pcs"),price:183,photo:_gp("")},
        {id:"sush_1_17",names:_n("MR fusion mix 24 pcs"),price:183,photo:_gp("")},
        {id:"sush_1_18",names:_n("Ryu crazy 18 pcs"),price:121,photo:_gp("")},
        {id:"sush_1_19",names:_n("Kin premium 12 pcs"),price:121,photo:_gp("")},
        {id:"sush_1_20",names:_n("Tora tasty 16 pcs"),price:121,photo:_gp("")},
        {id:"sush_1_21",names:_n("Sakura soft 16 pcs"),price:121,photo:_gp("")},
        {id:"sush_1_22",names:_n("Shinobu smart 16 pcs"),price:121,photo:_gp("")},
        {id:"sush_1_23",names:_n("Ebi supreme 16 pcs"),price:121,photo:_gp("")},
        {id:"sush_1_24",names:_n("Miyako mix 16 pcs"),price:121,photo:_gp("")},
        {id:"sush_1_25",names:_n("Hana club 16 pcs"),price:121,photo:_gp("")},
      ]},
      {id:"menuramada_2",emoji:"\\ud83e\\udd61",names:_n("Menu Ramadan"),items:[
        {id:"sush_2_0",names:_n("FAMILY PREMIUM"),price:467,photo:_gp("")},
        {id:"sush_2_1",names:_n("FAMILY ESSENTIAL"),price:303,photo:_gp("")},
        {id:"sush_2_2",names:_n("DUO PREMIUM"),price:251,photo:_gp("")},
        {id:"sush_2_3",names:_n("SOLO PREMIUM"),price:121,photo:_gp("")},
        {id:"sush_2_4",names:_n("SOLO ESSENTIAL"),price:82,photo:_gp("")},
      ]},
      {id:"specialpac_3",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Special Pack"),items:[
        {id:"sush_3_0",names:_n("PACK MIDI"),price:135,photo:_gp("")},
      ]},
      {id:"nossalades_4",emoji:"\\ud83e\\udd57",names:_n("Nos Salades"),items:[
        {id:"sush_4_0",names:_n("Salade Mr"),price:73,photo:_gp("")},
        {id:"sush_4_1",names:_n("Salades Thai"),price:73,photo:_gp("")},
        {id:"sush_4_2",names:_n("Salade Viet"),price:68,photo:_gp("")},
        {id:"sush_4_3",names:_n("Salades Poulet"),price:63,photo:_gp("")},
        {id:"sush_4_4",names:_n("Salade japonaise"),price:32,photo:_gp("")},
      ]},
      {id:"nossoupes_5",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Nos Soupes"),items:[
        {id:"sush_5_0",names:_n("Soupe Fruit de Mer"),price:63,photo:_gp("")},
        {id:"sush_5_1",names:_n("Soupe MR"),price:63,photo:_gp("")},
        {id:"sush_5_2",names:_n("Soupe Poulet"),price:52,photo:_gp("")},
      ]},
      {id:"nosnems_6",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Nos Nems"),items:[
        {id:"sush_6_0",names:_n("Nems Mixte"),price:68,photo:_gp("")},
        {id:"sush_6_1",names:_n("Nems Crevettes"),price:58,photo:_gp("")},
        {id:"sush_6_2",names:_n("Nems Poulet Thai"),price:52,photo:_gp("")},
        {id:"sush_6_3",names:_n("Nems Poulet"),price:52,photo:_gp("")},
        {id:"sush_6_4",names:_n("Nems vegitarien"),price:47,photo:_gp("")},
      ]},
      {id:"noswoks_7",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Nos woks"),items:[
        {id:"sush_7_0",names:_n("Wok Mixte"),price:105,photo:_gp("")},
        {id:"sush_7_1",names:_n("Wok au Crevettes"),price:94,photo:_gp("")},
        {id:"sush_7_2",names:_n("Wok au boeuf"),price:94,photo:_gp("")},
        {id:"sush_7_3",names:_n("Wok poulet"),price:84,photo:_gp("")},
      ]},
      {id:"pokbowl_8",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Pok Bowl"),items:[
        {id:"sush_8_0",names:_n("Poke MR"),price:84,photo:_gp("")},
        {id:"sush_8_1",names:_n("Pok Bowl Crevette"),price:79,photo:_gp("")},
        {id:"sush_8_2",names:_n("Pok Bowl Saumon"),price:73,photo:_gp("")},
      ]},
      {id:"tartare_9",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Tartare"),items:[
        {id:"sush_9_0",names:_n("Tartare Saumon"),price:73,photo:_gp("")},
        {id:"sush_9_1",names:_n("Tartare Crevette"),price:68,photo:_gp("")},
      ]},
      {id:"tempura_10",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Tempura"),items:[
        {id:"sush_10_0",names:_n("Tempura Mixte"),price:68,photo:_gp("")},
        {id:"sush_10_1",names:_n("Ebi Tempura"),price:63,photo:_gp("")},
        {id:"sush_10_2",names:_n("Calamar Rings"),price:58,photo:_gp("")},
        {id:"sush_10_3",names:_n("Chicken Fry"),price:58,photo:_gp("")},
      ]},
      {id:"fritures_11",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Fritures"),items:[
        {id:"sush_11_0",names:_n("Croquettes crabes"),price:52,photo:_gp("")},
        {id:"sush_11_1",names:_n("Beignets Mixte"),price:47,photo:_gp("")},
        {id:"sush_11_2",names:_n("Beignets De Crevettes"),price:47,photo:_gp("")},
        {id:"sush_11_3",names:_n("Croquettes Fromages"),price:36,photo:_gp("")},
      ]},
      {id:"assortimen_12",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Assortiment Brochettes"),items:[
        {id:"sush_12_0",names:_n("Big box"),price:236,photo:_gp("")},
        {id:"sush_12_1",names:_n("Middle Box"),price:157,photo:_gp("")},
        {id:"sush_12_2",names:_n("Little Box"),price:84,photo:_gp("")},
      ]},
      {id:"nosbrochet_13",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Nos Brochettes"),items:[
        {id:"sush_13_0",names:_n("Brochettes Saumon"),price:68,photo:_gp("")},
        {id:"sush_13_1",names:_n("Brochettes Ebi"),price:63,photo:_gp("")},
        {id:"sush_13_2",names:_n("Boeuf fromage"),price:58,photo:_gp("")},
        {id:"sush_13_3",names:_n("Brochettes Tsukune"),price:47,photo:_gp("")},
        {id:"sush_13_4",names:_n("Brochettes poulet"),price:47,photo:_gp("")},
      ]},
      {id:"nosplatsth_14",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Nos plats thaï"),items:[
        {id:"sush_14_0",names:_n("Ananas Pavé Saumon"),price:94,photo:_gp("")},
        {id:"sush_14_1",names:_n("Ananas Fruits de Mer"),price:89,photo:_gp("")},
        {id:"sush_14_2",names:_n("Ananas Boeuf"),price:89,photo:_gp("")},
        {id:"sush_14_3",names:_n("Poulet ananas"),price:73,photo:_gp("")},
      ]},
      {id:"nosplatssa_15",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Nos plats saté"),items:[
        {id:"sush_15_0",names:_n("Saté Mixte"),price:94,photo:_gp("")},
        {id:"sush_15_1",names:_n("Saté Fruits de mer"),price:89,photo:_gp("")},
        {id:"sush_15_2",names:_n("Saté de poulet"),price:73,photo:_gp("")},
      ]},
      {id:"maki6pcs_16",emoji:"\\ud83c\\udf63",names:_n("Maki 6pcs"),items:[
        {id:"sush_16_0",names:_n("Maki crabe"),price:47,photo:_gp("")},
        {id:"sush_16_1",names:_n("Maki crevettes"),price:42,photo:_gp("")},
        {id:"sush_16_2",names:_n("Maki saumon"),price:42,photo:_gp("")},
        {id:"sush_16_3",names:_n("Maki avocat"),price:36,photo:_gp("")},
        {id:"sush_16_4",names:_n("Maki concombre"),price:32,photo:_gp("")},
      ]},
      {id:"rizcantona_17",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Riz Cantonais"),items:[
        {id:"sush_17_0",names:_n("Riz Cantonais mixte"),price:94,photo:_gp("")},
        {id:"sush_17_1",names:_n("Riz Cantonais fruits de mer"),price:89,photo:_gp("")},
        {id:"sush_17_2",names:_n("Riz Cantonais Crevettes"),price:89,photo:_gp("")},
        {id:"sush_17_3",names:_n("Riz Cantonais Boeuf"),price:89,photo:_gp("")},
        {id:"sush_17_4",names:_n("Riz Cantonais Poulet"),price:73,photo:_gp("")},
      ]},
      {id:"nigirisash_18",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Nigiri & Sashimi 2pcs"),items:[
        {id:"sush_18_0",names:_n("Sashimi paisson blanc"),price:47,photo:_gp("")},
        {id:"sush_18_1",names:_n("Sashimi Saumon"),price:47,photo:_gp("")},
        {id:"sush_18_2",names:_n("Sashimi crevettes"),price:42,photo:_gp("")},
        {id:"sush_18_3",names:_n("Nigiri paisson blanc"),price:42,photo:_gp("")},
        {id:"sush_18_4",names:_n("Nigiri Saumon"),price:42,photo:_gp("")},
        {id:"sush_18_5",names:_n("Nigiri Crevettes"),price:36,photo:_gp("")},
      ]},
      {id:"crespymaki_19",emoji:"\\ud83c\\udf63",names:_n("Crespy maki 8pcs"),items:[
        {id:"sush_19_0",names:_n("Crespy maki Saumon"),price:58,photo:_gp("")},
        {id:"sush_19_1",names:_n("Crevettes"),price:52,photo:_gp("")},
      ]},
      {id:"ourcrunchy_20",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Our Crunchy 8 pcs"),items:[
        {id:"sush_20_0",names:_n("Ocrunchy"),price:58,photo:_gp("")},
        {id:"sush_20_1",names:_n("Fry ebi Fry"),price:58,photo:_gp("")},
        {id:"sush_20_2",names:_n("Salmon fry"),price:52,photo:_gp("")},
      ]},
      {id:"freshrolls_21",emoji:"\\ud83c\\udf63",names:_n("Fresh Rolls 4pcs"),items:[
        {id:"sush_21_0",names:_n("Ebi crabe"),price:68,photo:_gp("")},
        {id:"sush_21_1",names:_n("Fresh green"),price:68,photo:_gp("")},
        {id:"sush_21_2",names:_n("Saumon"),price:63,photo:_gp("")},
        {id:"sush_21_3",names:_n("Saumon avocat"),price:63,photo:_gp("")},
      ]},
      {id:"california_22",emoji:"\\ud83c\\udf63",names:_n("California Roll 4pcs"),items:[
        {id:"sush_22_0",names:_n("Cream cheese"),price:47,photo:_gp("")},
        {id:"sush_22_1",names:_n("Saumon"),price:42,photo:_gp("")},
        {id:"sush_22_2",names:_n("Shaké yaki"),price:42,photo:_gp("")},
        {id:"sush_22_3",names:_n("Crevette"),price:42,photo:_gp("")},
        {id:"sush_22_4",names:_n("Classic"),price:32,photo:_gp("")},
      ]},
      {id:"futomaki5p_23",emoji:"\\ud83c\\udf63",names:_n("FUTOMAKI 5pcs"),items:[
        {id:"sush_23_0",names:_n("Futomaki Saumon"),price:58,photo:_gp("")},
        {id:"sush_23_1",names:_n("Futomaki crevette"),price:58,photo:_gp("")},
      ]},
      {id:"lesjus_24",emoji:"\\ud83e\\uddc3",names:_n("Les Jus"),items:[
        {id:"sush_24_0",names:_n("jus de kiwi"),price:39,photo:_gp("")},
        {id:"sush_24_1",names:_n("jus d'avocat"),price:39,photo:_gp("")},
        {id:"sush_24_2",names:_n("jus d'ananas"),price:39,photo:_gp("")},
        {id:"sush_24_3",names:_n("jus de mangue"),price:39,photo:_gp("")},
        {id:"sush_24_4",names:_n("panaché"),price:39,photo:_gp("")},
        {id:"sush_24_5",names:_n("jus de fraise"),price:35,photo:_gp("")},
        {id:"sush_24_6",names:_n("jus de citron"),price:31,photo:_gp("")},
        {id:"sush_24_7",names:_n("jus de banane"),price:31,photo:_gp("")},
        {id:"sush_24_8",names:_n("jus de pomme"),price:31,photo:_gp("")},
        {id:"sush_24_9",names:_n("jus d'orange"),price:26,photo:_gp("")},
      ]},
      {id:"boissonsfr_25",emoji:"\\ud83e\\udd64",names:_n("Boissons Fraîches"),items:[
        {id:"sush_25_0",names:_n("Redbull"),price:44,photo:_gp("")},
        {id:"sush_25_1",names:_n("Orangina"),price:31,photo:_gp("")},
        {id:"sush_25_2",names:_n("Eau Minérale 1l"),price:26,photo:_gp("")},
        {id:"sush_25_3",names:_n("Soda"),price:18,photo:_gp("")},
        {id:"sush_25_4",names:_n("eau minérale 50 cl"),price:18,photo:_gp("")},
        {id:"sush_25_5",names:_n("Oulmès"),price:14,photo:_gp("")},
        {id:"sush_25_6",names:_n("eau minérale 33 cl"),price:8,photo:_gp("")},
      ]},
    ],
  },
  {
    id:"los-nachos-asf",name:"Los Nachos",
    tagline:_n("Los Nachos · Safi"),
    logo:"\\ud83c\\udf2e",cover:_gp("60145fc549fc43ab05e6da02d4e91014c85fd6b9c7738af62861cb6d42a6e214"),
    cuisine:_n("Nachos & Mexican"),tags:["nachos", "mexican", "tacos"],
    rating:0,deliveryTime:"20\\u201330",minOrder:35,
    address:'Safi, Maroc',
    categories:[
      {id:"topdesvent_0",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Top des ventes"),items:[
        {id:"losn_0_0",names:_n("Royal Box"),price:72,photo:_gp("")},
        {id:"losn_0_1",names:_n("Long L'Krunch Poulet"),price:65,photo:_gp("")},
        {id:"losn_0_2",names:_n("Duo L'Krunch Burger Menu"),price:85,photo:_gp("")},
      ]},
      {id:"chickenbuc_1",emoji:"\\ud83c\\udf57",names:_n("CHICKEN BUCKETS A Partagées"),items:[
        {id:"losn_1_0",names:_n("My Bucket Plus"),price:252,photo:_gp("60145fc549fc43ab05e6da02d4e91014c85fd6b9c7738af62861cb6d42a6e214")},
        {id:"losn_1_1",names:_n("Family Bucket"),price:218,photo:_gp("60145fc549fc43ab05e6da02d4e91014c85fd6b9c7738af62861cb6d42a6e214")},
        {id:"losn_1_2",names:_n("Bucket Duo"),price:138,photo:_gp("60145fc549fc43ab05e6da02d4e91014c85fd6b9c7738af62861cb6d42a6e214")},
        {id:"losn_1_3",names:_n("My Bucket"),price:76,photo:_gp("60145fc549fc43ab05e6da02d4e91014c85fd6b9c7738af62861cb6d42a6e214")},
        {id:"losn_1_4",names:_n("Bucket Solo"),price:69,photo:_gp("60145fc549fc43ab05e6da02d4e91014c85fd6b9c7738af62861cb6d42a6e214")},
        {id:"losn_1_5",names:_n("Dozen Mozzarella Sticks"),price:65,photo:_gp("")},
        {id:"losn_1_6",names:_n("Dozen Chicken Nuggets"),price:50,photo:_gp("")},
        {id:"losn_1_7",names:_n("Chicken Nuggets"),price:25,photo:_gp("")},
        {id:"losn_1_8",names:_n("Mozzarella Sticks"),price:24,photo:_gp("")},
      ]},
      {id:"bigcrunchy_2",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("BIG CRUNCHY MEALS"),items:[
        {id:"losn_2_0",names:_n("Duo L'Krunch Burger Menu"),price:85,photo:_gp("")},
        {id:"losn_2_1",names:_n("Duo Wrap L'Krunch Menu"),price:85,photo:_gp("")},
        {id:"losn_2_2",names:_n("Giants Box"),price:83,photo:_gp("")},
        {id:"losn_2_3",names:_n("Royal Box"),price:72,photo:_gp("")},
        {id:"losn_2_4",names:_n("L'Krunch Box"),price:69,photo:_gp("")},
        {id:"losn_2_5",names:_n("Wrap L'Krunch Box"),price:65,photo:_gp("")},
        {id:"losn_2_6",names:_n("Wrap Mozza Box"),price:65,photo:_gp("")},
        {id:"losn_2_7",names:_n("Wrap Nuggets Box"),price:65,photo:_gp("")},
        {id:"losn_2_8",names:_n("Long L'Krunch Poulet"),price:65,photo:_gp("")},
        {id:"losn_2_9",names:_n("Long Nuggets"),price:65,photo:_gp("")},
      ]},
      {id:"bigburgerb_3",emoji:"\\ud83c\\udf54",names:_n("BIG BURGER BOX"),items:[
        {id:"losn_3_0",names:_n("Triple Cheese burger Box"),price:86,photo:_gp("")},
        {id:"losn_3_1",names:_n("Duo Cheese Burger Menu"),price:85,photo:_gp("")},
        {id:"losn_3_2",names:_n("Double Cheese Burger Box"),price:83,photo:_gp("")},
        {id:"losn_3_3",names:_n("Cheese Burger Box"),price:74,photo:_gp("")},
        {id:"losn_3_4",names:_n("Grand Cheese Burger Menu"),price:59,photo:_gp("")},
      ]},
      {id:"burgerssol_4",emoji:"\\ud83c\\udf54",names:_n("Burgers Solo"),items:[
        {id:"losn_4_0",names:_n("Grand Nachos XXL"),price:69,photo:_gp("")},
        {id:"losn_4_1",names:_n("L'Krunch Mozzarella XL"),price:65,photo:_gp("")},
        {id:"losn_4_2",names:_n("L'Krunch Royal XXL"),price:63,photo:_gp("")},
        {id:"losn_4_3",names:_n("Double Magnum Cheese"),price:60,photo:_gp("")},
        {id:"losn_4_4",names:_n("L'krispi Mozzarella"),price:51,photo:_gp("")},
        {id:"losn_4_5",names:_n("L'Krunch Royal"),price:50,photo:_gp("")},
        {id:"losn_4_6",names:_n("L'Krunch Mozza Dynamite"),price:48,photo:_gp("")},
        {id:"losn_4_7",names:_n("Mozzarella Burger"),price:48,photo:_gp("")},
        {id:"losn_4_8",names:_n("L' Krunch Burger"),price:43,photo:_gp("")},
        {id:"losn_4_9",names:_n("Magnum Cheese"),price:43,photo:_gp("9b4372fe62d5083ecd10f12a176b72f035df469fb057eb2fe622aff60a6a5e29")},
      ]},
      {id:"wrapsspeci_5",emoji:"\\ud83c\\udf54",names:_n("Wraps Special"),items:[
        {id:"losn_5_0",names:_n("Menu Duo Beefy Wraps"),price:85,photo:_gp("")},
        {id:"losn_5_1",names:_n("Menu Duo Crunch wrap"),price:85,photo:_gp("")},
        {id:"losn_5_2",names:_n("Mega Wrap Menu"),price:69,photo:_gp("")},
        {id:"losn_5_3",names:_n("Mega wrap Beefy Menu"),price:60,photo:_gp("")},
        {id:"losn_5_4",names:_n("Mega Wrap Krunch Menu"),price:59,photo:_gp("")},
        {id:"losn_5_5",names:_n("Mega Wrap Poulet"),price:43,photo:_gp("")},
        {id:"losn_5_6",names:_n("Mega Wrap Viande Hachée"),price:43,photo:_gp("")},
        {id:"losn_5_7",names:_n("Mega Wrap Fish"),price:43,photo:_gp("")},
        {id:"losn_5_8",names:_n("Mega Shawarma Nuggets"),price:39,photo:_gp("")},
      ]},
      {id:"tacosspeci_6",emoji:"\\ud83c\\udf2e",names:_n("Tacos Special"),items:[
        {id:"losn_6_0",names:_n("Taco Menu"),price:74,photo:_gp("")},
        {id:"losn_6_1",names:_n("Taco Supreme Menu"),price:60,photo:_gp("")},
        {id:"losn_6_2",names:_n("Taco O'Texas Menu"),price:59,photo:_gp("")},
        {id:"losn_6_3",names:_n("TACO O'TEXAS"),price:43,photo:_gp("")},
        {id:"losn_6_4",names:_n("TACO SUPRÊME"),price:43,photo:_gp("")},
        {id:"losn_6_5",names:_n("TACO PISCADO"),price:43,photo:_gp("")},
        {id:"losn_6_6",names:_n("TACO REGAL"),price:43,photo:_gp("")},
        {id:"losn_6_7",names:_n("TACO GALAXICO"),price:39,photo:_gp("")},
      ]},
      {id:"sandwiches_7",emoji:"\\ud83e\\udd59",names:_n("Sandwiches"),items:[
        {id:"losn_7_0",names:_n("Long Fish"),price:43,photo:_gp("")},
        {id:"losn_7_1",names:_n("Long Viande Hachée"),price:43,photo:_gp("")},
        {id:"losn_7_2",names:_n("Long Marinara"),price:43,photo:_gp("")},
        {id:"losn_7_3",names:_n("Long Buffalo"),price:43,photo:_gp("")},
      ]},
      {id:"nachos_8",emoji:"\\ud83c\\udf2e",names:_n("Nacho's"),items:[
        {id:"losn_8_0",names:_n("NACHO'S Viande Hachée"),price:43,photo:_gp("2b1bea81e619b19f5715ae526843ee7f3b22d7fbbe842e5153d3728741121f58")},
        {id:"losn_8_1",names:_n("NACHO'S Poulet"),price:41,photo:_gp("2b1bea81e619b19f5715ae526843ee7f3b22d7fbbe842e5153d3728741121f58")},
      ]},
      {id:"beefburger_9",emoji:"\\ud83c\\udf54",names:_n("Beef Burgers"),items:[
        {id:"losn_9_0",names:_n("Nachos Mega Mozza"),price:51,photo:_gp("")},
      ]},
      {id:"boissons_10",emoji:"\\ud83e\\udd64",names:_n("Boissons"),items:[
        {id:"losn_10_0",names:_n("Jus de Mangue"),price:33,photo:_gp("")},
        {id:"losn_10_1",names:_n("Jus d'Ananas"),price:33,photo:_gp("")},
        {id:"losn_10_2",names:_n("Jus d'orange"),price:26,photo:_gp("")},
        {id:"losn_10_3",names:_n("Pepsi (33cl)"),price:13,photo:_gp("")},
        {id:"losn_10_4",names:_n("Mirinda Pomme (33cl)"),price:13,photo:_gp("")},
      ]},
    ],
  },
  {
    id:"tekram-cham-asf",name:"Tekram Cham",
    tagline:_n("Tekram Cham · Safi"),
    logo:"\\ud83e\\udd59",cover:_gp("806f8a171e5a0cd882039cdcc7f7eb776a8388d4e184295edc64a11d564bb7c3"),
    cuisine:_n("Syrian & Chawarma"),tags:["syrian", "chawarma"],
    rating:0,deliveryTime:"20\\u201330",minOrder:40,
    address:'Safi, Maroc',
    categories:[
      {id:"promotions_0",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Promotions"),items:[
        {id:"tekr_0_0",names:_n("Sandwich Shawarma Mixte+ Kefta Chamia + 2 Dessert 2Limonade Libanaise"),price:135,photo:_gp("806f8a171e5a0cd882039cdcc7f7eb776a8388d4e184295edc64a11d564bb7c3")},
        {id:"tekr_0_1",names:_n("Sandwich Shawarma Viande + Dessert + Limonade Libanaise"),price:93,photo:_gp("f1030a464250af3703c1d52cdd0d9c86c388adb2744df36d6e8c36164c984ce1")},
        {id:"tekr_0_2",names:_n("Sandwich Shawarma Poulet + Dessert + Limonade Libanaise"),price:86,photo:_gp("748084c67643824f75d2cabf1d45587a72f7525d7db17494e9150b3bbf089462")},
      ]},
      {id:"topdesvent_1",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Top des ventes"),items:[
        {id:"tekr_1_0",names:_n("Sandwich Shawarma Mixte+ Kefta Chamia + 2 Dessert 2Limonade Libanaise"),price:135,photo:_gp("806f8a171e5a0cd882039cdcc7f7eb776a8388d4e184295edc64a11d564bb7c3")},
        {id:"tekr_1_1",names:_n("Sandwich Sarokhe Shawarma Poulet + Dessert + Limonade Libanaise"),price:93,photo:_gp("d580731f44f0e0fcf432556f738a62bbfd5c979a4c2da59533f62a8684598b09")},
        {id:"tekr_1_2",names:_n("2 Sandwich Shawarma (Poulet+ Viande )+ 2 Desserts & Limonade Libanaise"),price:173,photo:_gp("71fa07bd4806ebec9dc008159011a2ae3fefc786900b0d98dcb6026895a7df0e")},
      ]},
      {id:"glovopromo_2",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Glovopromos"),items:[
        {id:"tekr_2_0",names:_n("2 Sandwich Shawarma (Poulet+ Viande )+ 2 Desserts & Limonade Libanaise"),price:173,photo:_gp("71fa07bd4806ebec9dc008159011a2ae3fefc786900b0d98dcb6026895a7df0e")},
        {id:"tekr_2_1",names:_n("Sandwich Shawarma Mixte+ Kefta Chamia + 2 Dessert 2Limonade Libanaise"),price:135,photo:_gp("806f8a171e5a0cd882039cdcc7f7eb776a8388d4e184295edc64a11d564bb7c3")},        {id:"tekr_2_2",names:_n("Plat Chawarma Poulet + Dessert + Limonade Libanaise"),price:126,photo:_gp("68a41efa1d1496e951534fae79361d5a4406e84dea830919069c7016b9795534")},
        {id:"tekr_2_3",names:_n("Sandwich Sarokhe Shawarma Mixte + Dessert + Limonade Libanaise"),price:100,photo:_gp("1cab7d39aca017abdf2b1351d4c62d0ffaba2979389b8ff3f3b7c78ad34a2a97")},
        {id:"tekr_2_4",names:_n("Sandwich Sarokhe Shawarma Poulet + Dessert + Limonade Libanaise"),price:93,photo:_gp("d580731f44f0e0fcf432556f738a62bbfd5c979a4c2da59533f62a8684598b09")},
        {id:"tekr_2_5",names:_n("Sandwich Shawarma Viande + Dessert + Limonade Libanaise"),price:93,photo:_gp("f1030a464250af3703c1d52cdd0d9c86c388adb2744df36d6e8c36164c984ce1")},
        {id:"tekr_2_6",names:_n("Sandwich Viande Hachée Libanaise + Dessert + Limonade Libanaise"),price:92,photo:_gp("de624f045bb6dcdfefdb059d865e610e4fa1d549959a34cb9b686529f32fff1d")},
        {id:"tekr_2_7",names:_n("Sandwich Shawarma Poulet + Dessert + Limonade Libanaise"),price:86,photo:_gp("748084c67643824f75d2cabf1d45587a72f7525d7db17494e9150b3bbf089462")},
      ]},
      {id:"salades_3",emoji:"\\ud83e\\udd57",names:_n("Salades"),items:[
        {id:"tekr_3_0",names:_n("Baba Ghanouj"),price:42,photo:_gp("4231175b8e446c4a3eb79ff40a0860beb13a55e8659b1df96e04ff71f75e44ce")},
      ]},
      {id:"nossalades_4",emoji:"\\ud83e\\udd57",names:_n("Nos Salades"),items:[
        {id:"tekr_4_0",names:_n("Salade de Thon"),price:45,photo:_gp("533213cf2615409ffb7738ac9a307e362fd76766c70942bf5e9b55602a2a4b0e")},
        {id:"tekr_4_1",names:_n("Salade de Poulet"),price:45,photo:_gp("bf1a6574c8aa32a37f18ce035b4617389d536fdb6b8cfad1874c57c64edddd9d")},
        {id:"tekr_4_2",names:_n("Fattouche"),price:33,photo:_gp("cac793107a3b2cddbc59e88fcb34dc4c38efe768e4259528b91fe5704f1ae76f")},
        {id:"tekr_4_3",names:_n("Salade Chamia"),price:33,photo:_gp("a8a7f67ea9037ca6eb350eb389a928207268cedbce31de021350a37b6c7c1c7c")},
      ]},
      {id:"nosentresf_5",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Nos Entrées Froides"),items:[
        {id:"tekr_5_0",names:_n("Plat Mezze Libanaise Mixte"),price:102,photo:_gp("376b066af8a371d80e96d83b35744a017095a6c482942d4bb38f89ce9d4ca8e9")},
        {id:"tekr_5_1",names:_n("Warak Inab"),price:42,photo:_gp("8c6ba0e5459c2b8cef1327bc2568595a9d4937ee80fa71472e677fed3058138e")},
        {id:"tekr_5_2",names:_n("Hommos Tahina"),price:36,photo:_gp("ee53403268acff01e6b4c1c00573ebabea248dfa5a5a476d42cfca319915e289")},
        {id:"tekr_5_3",names:_n("Assiette à l'ail"),price:22,photo:_gp("6ba7e32550b2cf01626c3c502545aa29fd7157903fdf5eec6c668b6401aa994a")},
      ]},
      {id:"nosentresc_6",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Nos Entrées Chaudes"),items:[
        {id:"tekr_6_0",names:_n("Kebbé"),price:56,photo:_gp("e51767d889aca78595544b928ea9bff5306b250c6eb3d9ec165d6a90709c9669")},
        {id:"tekr_6_1",names:_n("Plat Falafel"),price:50,photo:_gp("ec9edde86d78d1cf1a77ed80faf551ea41cced2ddd333268ef7241e79f307acd")},
        {id:"tekr_6_2",names:_n("Fatayer aux épinards"),price:43,photo:_gp("c822fbf7b257ef96a578b1bc8253853a4f26079b5a0f35cacd57bde8647ab2b6")},
        {id:"tekr_6_3",names:_n("Sambousek à la viande"),price:43,photo:_gp("7dd7c180bcdf52a2e6099a4c72c1c178a8457bddec4b574e036d59ec321e39b6")},
        {id:"tekr_6_4",names:_n("Fatayer au fromage"),price:43,photo:_gp("f66d0f5c8e1674dc32f8c1ffec233ee0e6e3115b7c8630ac393536bce5c2151d")},
      ]},
      {id:"pizza_7",emoji:"\\ud83c\\udf55",names:_n("Pizza"),items:[
        {id:"tekr_7_0",names:_n("Pizza 4 Saisons"),price:65,photo:_gp("1461c21a4fce9da16624370de0764a22abe275584d614f4a39f58280f09a9d3e")},
        {id:"tekr_7_1",names:_n("Pizza Royale"),price:65,photo:_gp("f86a6c02e6541c88ae3e0347507d8f27de9c84d74de0c1c466fb09936ea4c09b")},
        {id:"tekr_7_2",names:_n("Pizza Fruits De Mer"),price:60,photo:_gp("f5380597fbdcf4aabb621a0673db0cb00ebab34c08252767c1dbbc1ddedfd310")},
        {id:"tekr_7_3",names:_n("Pizza Viande Hachée"),price:55,photo:_gp("c8bab7d28a76287509fbf9881dced592ef4556b112def1b34546eb7bacf1c176")},
        {id:"tekr_7_4",names:_n("Pizza Thon"),price:55,photo:_gp("a6f149450f04b0796f0b704eb528d59d020c1641484db127bc9f7b138b5053cb")},
        {id:"tekr_7_5",names:_n("Pizza Chawarma"),price:55,photo:_gp("bbc4855024de5a6f76e822ab50a4e4781d80d1700ba560bd85c9a2b0380fc861")},
        {id:"tekr_7_6",names:_n("Pizza Végétarienne"),price:52,photo:_gp("350b2e7bb589c372e3658f9d41361e7d819b1cc7ec53024ab852b714ec472b73")},
        {id:"tekr_7_7",names:_n("Pizza Margherita"),price:46,photo:_gp("062e7c2b19e72258d006573e350c430bd4621a80619dd205a078d6081efe5dc5")},
      ]},
      {id:"nosplats_8",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Nos Plats"),items:[
        {id:"tekr_8_0",names:_n("Plat Grillade Mixte - 1 Kg"),price:385,photo:_gp("dd2629d9234dffc8f18ff541fd9423a3b352947c328034dd80545f6c48847187")},
        {id:"tekr_8_1",names:_n("Plat Grillade Mixte - 1/2 Kg"),price:205,photo:_gp("f2cf697e52cc5cb64a31f65e47e9f9a18d85421f0da7fdd3240530a7f312a670")},
        {id:"tekr_8_2",names:_n("Mixte Grillades Extra - 4 Brochettes"),price:130,photo:_gp("d97a7dac17d5d2e238b1e3f1bea24cef2f69bd540e6ecf15e8b68f08a1be17a8")},
        {id:"tekr_8_3",names:_n("Plat Grillade Mixte - 3 Brochettes"),price:107,photo:_gp("896de0c96170cc04a79f32961170f67990b13f1d11ef3f996449e9b54f315e61")},
        {id:"tekr_8_4",names:_n("Kefta Chamia"),price:84,photo:_gp("f440ddc1b86f0d3be02f502bf771d2280612630e848b4ad692beac3260b41faf")},
        {id:"tekr_8_5",names:_n("Kebab d'aubergines"),price:84,photo:_gp("ccb41917e2f08d78afe1eac5c08b9ddf5f5334f0c41e9161ddf21f5eced785cb")},
        {id:"tekr_8_6",names:_n("Sojok Viande"),price:84,photo:_gp("7056444a30d999d65a2cde07b05abe52a407df6c291c4969e542f224c0996223")},
        {id:"tekr_8_7",names:_n("Kabab Khachkhach"),price:84,photo:_gp("489c3d3cf2d1437f18490fa8404f428d7599b47904d19f0409e3c728d5e700ac")},
        {id:"tekr_8_8",names:_n("Shawarma Poulet"),price:82,photo:_gp("85bf4ac2cd16798d8ca379673a958af04e2824449307339a7a0610a4c051eda5")},
        {id:"tekr_8_9",names:_n("Shawarma Poulet Arabi"),price:82,photo:_gp("b5ee89bc0869c32ba1731f1f652311da3fce0b8fe715241f7c2d838cb46b474c")},
        {id:"tekr_8_10",names:_n("Hummus Shawarma Poulet"),price:82,photo:_gp("229d4d091b33083db079eabe535e9ec7e32ba07f41d066c866787af58e659924")},
        {id:"tekr_8_11",names:_n("Poulet Kefta Mexicain"),price:82,photo:_gp("893df5361b0ac931f3d822e379abfb323002dbe442f601c4acecd86bbfcf4624")},
        {id:"tekr_8_12",names:_n("Plat Crispy"),price:82,photo:_gp("96f94dd5a983843cb778e7c4a85d8e04103edef178a318d5c04d804939e84a62")},
        {id:"tekr_8_13",names:_n("Chich Taouk"),price:82,photo:_gp("f7f342ff64c934fbca086d753a3ee3ff99643bd55e7ea42093b2c79283974dc1")},
        {id:"tekr_8_14",names:_n("Ailes de Poulet"),price:78,photo:_gp("aaf762d73bbfc1ff126186de7d4d847db1c541998a2429c36372e5320db5e31b")},
      ]},
      {id:"pouletrti_9",emoji:"\\ud83c\\udf57",names:_n("Poulet rôti"),items:[
        {id:"tekr_9_0",names:_n("Poulet Complet"),price:148,photo:_gp("a1bee5f1da81cde8189d9bff723c54bfa4e891f61e76203973e5e941eb3cc465")},
        {id:"tekr_9_1",names:_n("Poulet 1/2"),price:79,photo:_gp("8e729c0e5996353e29de00c29037ff81f4414aa14efaf8520c1b4245478764b9")},
        {id:"tekr_9_2",names:_n("Poulet 1/4"),price:50,photo:_gp("b5666ff3d4a2f247dc3f9e0e07ccee6a5a670703106985da6f3e98fe4c113f66")},
      ]},
      {id:"pasticcio_10",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Pasticcio"),items:[
        {id:"tekr_10_0",names:_n("Pasticcio Viande"),price:51,photo:_gp("1c3f4a98796b419c6c7ef04bb407639456b30b1070d447b50b193a7da1597551")},
        {id:"tekr_10_1",names:_n("Pasticcio Mixte"),price:51,photo:_gp("1c3f4a98796b419c6c7ef04bb407639456b30b1070d447b50b193a7da1597551")},
        {id:"tekr_10_2",names:_n("Pasticcio Poulet"),price:46,photo:_gp("1c3f4a98796b419c6c7ef04bb407639456b30b1070d447b50b193a7da1597551")},
      ]},
      {id:"platskhali_11",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Plats Khaliji"),items:[
        {id:"tekr_11_0",names:_n("Kabsah Poulet Extra"),price:170,photo:_gp("ec2ae26cf79e2765963550f406f6b11692d5c6b53f166440d120ea3fa42184f9")},
        {id:"tekr_11_1",names:_n("Kabsah Viande"),price:120,photo:_gp("4f074bd0ba1869ea5162bacc21c53de98ba8e4ffa62eaeefe47ff70a75fa09e5")},
        {id:"tekr_11_2",names:_n("Kabsah Poulet"),price:108,photo:_gp("ec2ae26cf79e2765963550f406f6b11692d5c6b53f166440d120ea3fa42184f9")},
        {id:"tekr_11_3",names:_n("Plat Riz"),price:57,photo:_gp("6cef1b52f3077ed8854ea8792ebc5e8eae7196dcde830e58b5b1e3c047865d36")},
      ]},
      {id:"sandwichs_12",emoji:"\\ud83e\\udd59",names:_n("Sandwichs"),items:[
        {id:"tekr_12_0",names:_n("Sarokhe Chawarma Poulet"),price:51,photo:_gp("03c7a4d4b94bb28817640f4eed4315d12a7c59dbc8fbb3bc46e1049ac1a7c1e7")},
        {id:"tekr_12_1",names:_n("Sandwich Kefta Poulet Mexicain"),price:47,photo:_gp("de66e2a2204358c945e7a93878050e13f24a6e2b551c61347c1ea675c86faff1")},
        {id:"tekr_12_2",names:_n("Sandwich Crispy"),price:47,photo:_gp("f8e19cfcec7690fc76021cf7926cd8fcfe8686f10c9965aba55dfdedd91111c5")},
        {id:"tekr_12_3",names:_n("Kebab Khachkhach"),price:47,photo:_gp("59adee5c8c006dd2f1ed0b77cd9b0b61034b6fa0dbc72a8370da8825f58cb625")},
        {id:"tekr_12_4",names:_n("Sojok Viande"),price:47,photo:_gp("d6d9d54354adb9574bd5f8a8d508ca3abb0631b5ccc1f6f0afa4cdeb7a706f08")},
        {id:"tekr_12_5",names:_n("Sandwich Chiche Taouk"),price:47,photo:_gp("8bcc6a742385eeb0d918975c00dd86cec54f76918a8439d84d71cdbed770133d")},
        {id:"tekr_12_6",names:_n("Sandwich Viande Hachée Libanaise"),price:46,photo:_gp("5a712d5c3a1ef211b95592949bb506ec13b491aaee533abe1acfbb949bfa28ee")},
        {id:"tekr_12_7",names:_n("Chawarma Poulet"),price:45,photo:_gp("eb874f704d59909354c0cb520316c1f0e0b34933ac18cf1ddf27b4c0b0f3e9d0")},
        {id:"tekr_12_8",names:_n("Sandwich Falafel"),price:33,photo:_gp("e4ae8ed9091797b574ff6a717f1a95a211ff353da40cca6bb057285a9d93e631")},
      ]},
      {id:"burgers_13",emoji:"\\ud83c\\udf54",names:_n("Burgers"),items:[
        {id:"tekr_13_0",names:_n("Burger Dinosaure Viande"),price:57,photo:_gp("15cc745a7c97fc60068c829bb7f53daf72d2956ce65d24b4df626232cba3c9ae")},
        {id:"tekr_13_1",names:_n("Burger Dinosaure Poulet"),price:51,photo:_gp("3ef47b444e3073c0f2ade15e6c54b85b6c043f5a77b7e6dc57c7d585871e71ed")},
      ]},
      {id:"tacos_14",emoji:"\\ud83c\\udf2e",names:_n("Tacos"),items:[
        {id:"tekr_14_0",names:_n("Tacos Viande"),price:51,photo:_gp("c209a3c6b3ddeca6b7bdb162e0cc53228fe1d35ab0f32ccf8a5dc61649431169")},
        {id:"tekr_14_1",names:_n("Tacos Mixte"),price:51,photo:_gp("c209a3c6b3ddeca6b7bdb162e0cc53228fe1d35ab0f32ccf8a5dc61649431169")},
        {id:"tekr_14_2",names:_n("Tacos Crispy"),price:50,photo:_gp("c209a3c6b3ddeca6b7bdb162e0cc53228fe1d35ab0f32ccf8a5dc61649431169")},
        {id:"tekr_14_3",names:_n("Tacos Poulet"),price:47,photo:_gp("c209a3c6b3ddeca6b7bdb162e0cc53228fe1d35ab0f32ccf8a5dc61649431169")},
        {id:"tekr_14_4",names:_n("Tacos Falafel"),price:44,photo:_gp("c209a3c6b3ddeca6b7bdb162e0cc53228fe1d35ab0f32ccf8a5dc61649431169")},
      ]},
      {id:"boissons_15",emoji:"\\ud83e\\udd64",names:_n("Boissons"),items:[
        {id:"tekr_15_0",names:_n("Laban Ayran"),price:18,photo:_gp("ae0a1bfe10b5109e64d47917139cd74d53d655e958cbcd54affec0e73b8bcc8c")},
        {id:"tekr_15_1",names:_n("Limonade Libanaise"),price:14,photo:_gp("d9f8424dd3f1405ad86b359bfd1157bf62edad8ca30f96f9b5b717b0e38d7ef7")},
        {id:"tekr_15_2",names:_n("Soda 33 Cl"),price:13,photo:_gp("6a56248046035d2260372a48a8593de6f0bf0c8042610bbedaa0dcaabf1edebc")},
        {id:"tekr_15_3",names:_n("Eau Minérale"),price:8,photo:_gp("d49bb57bc73a08495649915dbe08e3daab2dc59a7ec051aceeb4d0fb4d1d6809")},
        {id:"tekr_15_4",names:_n("Oulmès"),price:8,photo:_gp("016298ea66073282c63ac4f9b3ece22318843f459024689327ee734641c5dba1")},
      ]},
      {id:"desserts_16",emoji:"\\ud83c\\udf70",names:_n("Desserts"),items:[
        {id:"tekr_16_0",names:_n("Mahalabia Chamia"),price:22,photo:_gp("f77ff8c3d1709301d59b6b7bf41fa3f3c1cd2180bb9af83cb75cc8e0e3173d69")},
        {id:"tekr_16_1",names:_n("Konafa à la Crème"),price:20,photo:_gp("97cd7915d6ccd46ff1f6ecf79505d563783e30418ea315b073f9c85d4fe2f9cf")},
        {id:"tekr_16_2",names:_n("Baklawa Au Noix"),price:20,photo:_gp("690458d693bedef7810ac21c84dc914857eed5efc869ca4357697d87a91bfcba")},
        {id:"tekr_16_3",names:_n("Basboussa aux fruits secs"),price:20,photo:_gp("b5f414cf9c8fb481c5f8098bf16b7a7780803503dfef32c39190f1242092c3d9")},
        {id:"tekr_16_4",names:_n("Ouch El Boulboul"),price:20,photo:_gp("a2561029a1813102af503767109be4804359c2b51030979af53a1f67dc286f4e")},
      ]},
    ],
  },
  {
    id:"fofana-food-asf",name:"Fofana Food",
    tagline:_n("Fofana Food · Safi"),
    logo:"\\ud83c\\udf57",cover:_gp("9357066cc0cf73ecfd9196e8b4e49e892ee3707831b51ff737881a3fd28ad62b"),
    cuisine:_n("Chicken & African"),tags:["chicken", "african"],
    rating:0,deliveryTime:"20\\u201330",minOrder:35,
    address:'Safi, Maroc',
    categories:[
      {id:"topdesvent_0",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Top des ventes"),items:[
        {id:"fofa_0_0",names:_n("bocadillos thon fofanito"),price:34,photo:_gp("")},
        {id:"fofa_0_1",names:_n("bocadillos dinde"),price:36,photo:_gp("")},
      ]},
      {id:"bocadillos_1",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("bocadillos"),items:[
        {id:"fofa_1_0",names:_n("bocadillos mixte"),price:37,photo:_gp("")},
        {id:"fofa_1_1",names:_n("bocadillos dinde"),price:36,photo:_gp("")},
        {id:"fofa_1_2",names:_n("bocadillos thon fofanito"),price:34,photo:_gp("")},
        {id:"fofa_1_3",names:_n("thon fromage rouge"),price:31,photo:_gp("")},
      ]},
      {id:"nossalade_2",emoji:"\\ud83e\\udd57",names:_n("Nos salade"),items:[
        {id:"fofa_2_0",names:_n("Salade Penne Italienne"),price:35,photo:_gp("")},
        {id:"fofa_2_1",names:_n("salade au thon"),price:34,photo:_gp("")},
      ]},
      {id:"nosptes_3",emoji:"\\ud83c\\udf5d",names:_n("Nos pâtes"),items:[
        {id:"fofa_3_0",names:_n("chicken alfredo"),price:39,photo:_gp("")},
        {id:"fofa_3_1",names:_n("penne à la bolognaise"),price:35,photo:_gp("")},
        {id:"fofa_3_2",names:_n("penne carbonara"),price:35,photo:_gp("")},
        {id:"fofa_3_3",names:_n("penne thon"),price:33,photo:_gp("")},
      ]},
      {id:"pizzas_4",emoji:"\\ud83c\\udf55",names:_n("Pizzas"),items:[
        {id:"fofa_4_0",names:_n("Fofana"),price:42,photo:_gp("9357066cc0cf73ecfd9196e8b4e49e892ee3707831b51ff737881a3fd28ad62b")},
        {id:"fofa_4_1",names:_n("Pizza Moitié Moitié"),price:40,photo:_gp("648a781506f82923af67b652b505119581d7fe50ba565b5e961c21f2e93a2338")},
        {id:"fofa_4_2",names:_n("4 Fromages"),price:39,photo:_gp("d81754fbae71865615fb2724a57f2fa8f2e954e70f36f4e1b906e17e183f8b58")},
        {id:"fofa_4_3",names:_n("Viande Hachée"),price:36,photo:_gp("d7abbb6c49d28d310a5ff4ea0e0e93873164475c8ac45cac7e2f7b2602bfcd76")},
        {id:"fofa_4_4",names:_n("3 Fromages"),price:35,photo:_gp("4651b6d89dd79c13aa713ec60be1c9ead5399330b0abb9ee6ef83dac2e3ab2d3")},
        {id:"fofa_4_5",names:_n("Pepperoni"),price:35,photo:_gp("22ebe645186d489eced3f1df4af85c02f5b1a9a42718e3f787cc17db4719e5b3")},
        {id:"fofa_4_6",names:_n("Poulet"),price:34,photo:_gp("75645b2052840611f43e9dfc3f6bfca6c3f51de98ff9199eef226dbde5b2ba66")},
        {id:"fofa_4_7",names:_n("Vegetarian"),price:33,photo:_gp("98e2beefc08b143b6d07b705bd068e3109d7998c68d321ee2d61a29424684a5b")},
        {id:"fofa_4_8",names:_n("Thon"),price:32,photo:_gp("6f474e1afcc19cf3c5e4d6bbfb7625c4e474c9ac20a9800c41447e667e532fce")},
        {id:"fofa_4_9",names:_n("Dinde Fumée"),price:31,photo:_gp("3a3cd03dff25d51a2da2764fbe1140d74b8142d822e0730b062e3df6cc03c32f")},
        {id:"fofa_4_10",names:_n("Margherita"),price:24,photo:_gp("d11762951fd0ed92bd17817396dcea4aa1961f56bd0867a54ff57dd41b49cca1")},
      ]},
      {id:"boissons_5",emoji:"\\ud83e\\udd64",names:_n("Boissons"),items:[
        {id:"fofa_5_0",names:_n("Pom's Pomme 25cl"),price:8,photo:_gp("f5c888e9e1379badf0f54b4de9a3d3eaf2e4976c51f3d977bdd39627b57d86c5")},
        {id:"fofa_5_1",names:_n("Hawaï Tropical 25cl"),price:8,photo:_gp("0d365ad38b49d4243b0fc34a60099a88086e83b31c3be6f6eef78130e772dc5c")},
        {id:"fofa_5_2",names:_n("Coca Cola 25cl"),price:8,photo:_gp("bedeb382d698d3912db759ae62fdd21f98a7ae983e6721b408c78b5b8e5dfcc5")},
        {id:"fofa_5_3",names:_n("Fanta Orange 25cl"),price:8,photo:_gp("03cad51fbd5c8bfca563f97f024fef4ea76e733ea9597c58637cd037ac3db123")},
        {id:"fofa_5_4",names:_n("Oulmes 33cl"),price:7,photo:_gp("ae69dabb1830aea9132565841e623fbe54fcf14125bfdef4cc510ef4f4265f3f")},
        {id:"fofa_5_5",names:_n("Sidi Ali 50cl"),price:7,photo:_gp("1816402e2329fd62f973da44ef9367514b7ee8bc47248e348c789fcb5492eeb6")},
      ]},
    ],
  },
  {
    id:"lilot-chatain-asf",name:"L'\\u00eelot Ch\\u00e2tain",
    tagline:_n("L'îlot Châtain · Safi"),
    logo:"\\u2615",cover:_gp("9d4ec1037848700c47bd3e2d1ecc78fe0fc3ce1464f7b11200e1d27009d4bb92"),
    cuisine:_n("Caf\\u00e9 & Sweets"),tags:["coffee", "cafe", "dessert"],
    rating:0,deliveryTime:"15\\u201325",minOrder:30,
    address:'Safi, Maroc',
    categories:[
      {id:"topdesvent_0",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Top des ventes"),items:[
        {id:"lilo_0_0",names:_n("Tacos Mixte"),price:79,photo:_gp("9d4ec1037848700c47bd3e2d1ecc78fe0fc3ce1464f7b11200e1d27009d4bb92")},
        {id:"lilo_0_1",names:_n("King Burger"),price:79,photo:_gp("7d2fe9f9cdbd5973cde7295cfef2b3132eafaf4705d3899ae6c57eecabcee6fb")},
        {id:"lilo_0_2",names:_n("Gratin De Fruits De Mer"),price:113,photo:_gp("01a6da01fa7a2e6ea1448568a120c50ac61c81bf66aacab85543e5d6d3af9649")},
      ]},
      {id:"salades_1",emoji:"\\ud83e\\udd57",names:_n("Salades"),items:[
        {id:"lilo_1_0",names:_n("Salade Avocat & Crevettes"),price:91,photo:_gp("67733b6abaea3efca9d2f712f29d6872cf1d66819b8ef474a737c751c3a35e7f")},
        {id:"lilo_1_1",names:_n("Salade Fruits De Mer"),price:91,photo:_gp("fd5821df0578db648f701c79ba12349b4278bc00cbfbbe58c756f1869ca07a1c")},
        {id:"lilo_1_2",names:_n("Salade Riche"),price:91,photo:_gp("74a9c8198ee6cb1eac19b498abc325eaf41eebe9067ec2598a07d190ca551df3")},
        {id:"lilo_1_3",names:_n("Salade César"),price:70,photo:_gp("55dddf8a3403b7bac92b893049a191fbf86b2dca152a642cb6c79d3a5a28a317")},
        {id:"lilo_1_4",names:_n("Salade Mexicaine"),price:70,photo:_gp("e141b6bccbfdc5a8ae794cdb8a64239dafbdfe3c041e8dc3b611778aaa40bf6c")},
      ]},
      {id:"petitsdjeu_2",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Petits Déjeuners"),items:[
        {id:"lilo_2_0",names:_n("Fassi"),price:70,photo:_gp("f45b52a39da7e0a0f46a76391c00e00154327df9084b0a21fe3cd02eac1ec92a")},
        {id:"lilo_2_1",names:_n("Beldi"),price:68,photo:_gp("f389a077139c3444ec309f777757963da716b8cff76ee48daa045d118fd64921")},
        {id:"lilo_2_2",names:_n("Espagnol"),price:68,photo:_gp("9a2d01b88a655880bfdd9ad0dc1f55b3b761b864b71ec6726d8630cbc5f1fa68")},
        {id:"lilo_2_3",names:_n("Express"),price:47,photo:_gp("0bb56734c555ba2e8499521fd03c4b547d755d1bfc7933d94061b5b04b02add0")},
      ]},
      {id:"entreschau_3",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Entrées Chaudes"),items:[
        {id:"lilo_3_0",names:_n("Tajine Aux Fruits De Mer"),price:122,photo:_gp("dddcb711ad0289eae050f12c04f957cda60158e6ff6941ed08af142983fd4c2d")},
        {id:"lilo_3_1",names:_n("Gratin De Fruits De Mer"),price:113,photo:_gp("01a6da01fa7a2e6ea1448568a120c50ac61c81bf66aacab85543e5d6d3af9649")},
        {id:"lilo_3_2",names:_n("Soupe De Poisson"),price:65,photo:_gp("5643327c1e046197fd6b4ead8bcbd5fc65183659289022db6c98381f2c744b40")},
      ]},
      {id:"crpessales_4",emoji:"\\ud83e\\udd5e",names:_n("Crêpes Salées"),items:[
        {id:"lilo_4_0",names:_n("Crêpe Salée Poulet"),price:59,photo:_gp("5dbeb73010fa1639a10d0a4417d971f48fb5876ce0fd60c9cd8bcf9f21c7dba7")},
        {id:"lilo_4_1",names:_n("Crêpe Salée Charcuterie"),price:55,photo:_gp("6e29d9800bb9af331211b1027151a1b32cdc6f81b642f79fbc2b8b7701dceadb")},
      ]},
      {id:"crpessucre_5",emoji:"\\ud83c\\udf70",names:_n("Crêpes Sucrées"),items:[
        {id:"lilo_5_0",names:_n("Crêpe Banane Nutella"),price:48,photo:_gp("35e85dd66ab12b4875594c01c3a6b0e6be427905e236ca273310f76d84830f84")},
        {id:"lilo_5_1",names:_n("Crêpe Nutella"),price:42,photo:_gp("729db543dd165d09364160454c18787d437e71df35783350022985acbc6b9a21")},
      ]},
      {id:"pizza_6",emoji:"\\ud83c\\udf55",names:_n("Pizza"),items:[
        {id:"lilo_6_0",names:_n("Pizza 4 Saisons"),price:111,photo:_gp("d7419a2fba61b1e648a7ddc91b6eadc13d8102f7650e353d4516668de0829912")},
        {id:"lilo_6_1",names:_n("Pizza Fruits De Mer"),price:103,photo:_gp("38f0c438aceedb16a408b5cf3dc7f785c0e83ed03dc2469c16d5282da70aed68")},
        {id:"lilo_6_2",names:_n("Pizza Poulet"),price:93,photo:_gp("62738ad4246b4b55624c29e6c9ec8fac63aa149d42a64954b8e74cc8877fafff")},
        {id:"lilo_6_3",names:_n("Pizza Thon"),price:83,photo:_gp("3037b5417d40ba4261514b9687a87b522a1f6be880d96ccdb5a32375653f9967")},
      ]},
      {id:"ptes_7",emoji:"\\ud83c\\udf5d",names:_n("Pâtes"),items:[
        {id:"lilo_7_0",names:_n("Pâtes Saumon"),price:113,photo:_gp("c8b7a00436b78599975dc323e3d97cd152eded442ee57ca9b58eee95fbe17ff0")},
        {id:"lilo_7_1",names:_n("Pâtes Fruits De Mer"),price:111,photo:_gp("38d38a371d8d518c3bd2e3ea20cd3965c29b7caeebe0ce42b602721851953a3e")},
        {id:"lilo_7_2",names:_n("Pâtes Bolognaise"),price:99,photo:_gp("a0167de8db919acd13b26b2a11296c02bc0f554557807aa12f62327025fd042d")},
        {id:"lilo_7_3",names:_n("Pâtes Alfredo"),price:96,photo:_gp("16204efce60ec4d1ec3d479ca79d75fa688d947f68907b7032c16a4b0665aac0")},
        {id:"lilo_7_4",names:_n("Pâtes Carbonara"),price:96,photo:_gp("28d906b0cb269904f85b4b030d9d78c480a4baa0e905213f933788a7c2d25d64")},
      ]},
      {id:"tacos_8",emoji:"\\ud83c\\udf2e",names:_n("Tacos"),items:[
        {id:"lilo_8_0",names:_n("Tacos Mixte"),price:79,photo:_gp("9d4ec1037848700c47bd3e2d1ecc78fe0fc3ce1464f7b11200e1d27009d4bb92")},
        {id:"lilo_8_1",names:_n("Tacos Viande Hachée"),price:67,photo:_gp("993f6e21bc9f2d3a6e670de42b7c3bb4c8c674fdef0d7a6cd55f712503b09589")},
        {id:"lilo_8_2",names:_n("Tacos Poulet"),price:52,photo:_gp("59a5959e44cfb663ae279f804010c3d09fb5e0487f48b0992364cf188221280e")},
      ]},
      {id:"pasticcio_9",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Pasticcio"),items:[
        {id:"lilo_9_0",names:_n("Pasticcio Mixte"),price:83,photo:_gp("b807536eb5b00845dca1179848ee417c39540dcf30a0c6e2268f2fb851ccc7e6")},
        {id:"lilo_9_1",names:_n("Pasticcio Viande Hachée"),price:79,photo:_gp("037dfcc7eb28d92a57bc09a7032feec8830b17f34d5280f33a0816dd0695feb6")},
        {id:"lilo_9_2",names:_n("Pasticcio Poulet"),price:72,photo:_gp("28bdf739770de9c70cfd30e34cba5742e9614839277104f57b1ac22f8939c856")},
        {id:"lilo_9_3",names:_n("Pasticcio Charcuterie"),price:67,photo:_gp("14e7a7e89c17f3c18f8f59b555c400c472d891996d2f8d8b89978c9dc8860daf")},
      ]},
      {id:"burger_10",emoji:"\\ud83c\\udf54",names:_n("Burger"),items:[
        {id:"lilo_10_0",names:_n("King Burger"),price:79,photo:_gp("7d2fe9f9cdbd5973cde7295cfef2b3132eafaf4705d3899ae6c57eecabcee6fb")},
        {id:"lilo_10_1",names:_n("Cheese Burger"),price:58,photo:_gp("13268a80c8a0011461364744e964bbe192bd75e18eb0b897c42d9abb60dec4bd")},
        {id:"lilo_10_2",names:_n("Chicken Burger"),price:56,photo:_gp("21521cf71c2db8fa4a5dc80829e4daae2a7393b642e3501d01c7e3580cfde5ac")},
      ]},
      {id:"sandwich_11",emoji:"\\ud83e\\udd59",names:_n("Sandwich"),items:[
        {id:"lilo_11_0",names:_n("Sandwich Mixte"),price:70,photo:_gp("7049a5e61fe73279cf7c634eac23c989d5ae6c2c4a910de1a3af0b0c8cf840f6")},
        {id:"lilo_11_1",names:_n("Sandwich Viande Hachée"),price:58,photo:_gp("ad72d79b143d5c20f11a9c5b72c18a6ba4cd264170ad5631c85bf1e20f17ef27")},
        {id:"lilo_11_2",names:_n("Sandwich Thon"),price:55,photo:_gp("1e8cff991c81262ec24cc9e0ccfa2cfef6c3ef0c01f7d81733dcc4020669a1e4")},
        {id:"lilo_11_3",names:_n("Sandwich Poulet"),price:54,photo:_gp("2b2f7a5c97547f68ce95dc09668dce2b502b579c84790369c8f9874f08c44aa8")},
      ]},
      {id:"jus_12",emoji:"\\ud83e\\uddc3",names:_n("Jus"),items:[
        {id:"lilo_12_0",names:_n("Jus Panaché"),price:46,photo:_gp("2509819ac9c5227cc211de9b393e82b09c46faa9d0d0194326715ce2cec16293")},
        {id:"lilo_12_1",names:_n("Jus De Mangue"),price:46,photo:_gp("7552a50ed3d5f9d2c2174554625ca8419f63aeba15ac911157a5ea2b35c20db7")},
        {id:"lilo_12_2",names:_n("Jus D'Avocat"),price:44,photo:_gp("1e509c5f51965ca95c2f58fbc929925667751572836962e87a4d85aecbacfc97")},
        {id:"lilo_12_3",names:_n("Jus De Fraise"),price:37,photo:_gp("a3c9caaedecf19b80bd7af056a86124012f5c30fd7ce32f702334dc85dd8c491")},
        {id:"lilo_12_4",names:_n("Jus D'Orange Frais Pressé"),price:33,photo:_gp("39be4a7b33d9353ee19d7244f07539500f62d6ad3f10eddc59c4b409904a5b5f")},
      ]},
      {id:"panini_13",emoji:"\\ud83c\\udf7d\\ufe0f",names:_n("Panini"),items:[
        {id:"lilo_13_0",names:_n("Panini Mixte"),price:70,photo:_gp("b57561b5eee1f96c8e532b1ea12c3ab29c5323d9cb5158d4a0a8d5a2e97c10b1")},
        {id:"lilo_13_1",names:_n("Panini Viande Hachée"),price:58,photo:_gp("f488ea818d3a63d01d62cbc7abacedca4fe205cf13af77fa37182963c2fa5b98")},
        {id:"lilo_13_2",names:_n("Panini Thon"),price:55,photo:_gp("e7b2d69cb9d658b7c8bfd3590cae251ad4121fec63ef31cfbe9314bc8c806376")},
        {id:"lilo_13_3",names:_n("Panini Poulet"),price:54,photo:_gp("f0ca885698f50f9f595085e1142d223042cbf66d80ff6648c9bee3394207578a")},
      ]},
      {id:"boissons_14",emoji:"\\ud83e\\udd64",names:_n("Boissons"),items:[
        {id:"lilo_14_0",names:_n("Coca-Cola Zero 25cl Canette"),price:10,photo:_gp("")},
        {id:"lilo_14_1",names:_n("Eau Minérale Naturelle Sidi Ali 50 cL"),price:10,photo:_gp("")},
      ]},
    ],
  },];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function fontClass(lang: Lang) {
  if (lang==='amz') return 'font-tifinagh';
  if (lang==='ar')  return 'font-arabic';
  return '';
}
function GoldDivider() {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px" style={{background:'var(--c-border)'}}/>
      <div className="w-3 h-3 rotate-45 flex-shrink-0" style={{background:'#D9C5A0'}}/>
      <div className="flex-1 h-px" style={{background:'var(--c-border)'}}/>
    </div>
  );
}

function AdSlot({className=''}:{className?:string}) {
  return (
    <div className={`px-5 pt-3 pb-2 ${className}`} id="bridge-ad-slot">
      <div className="rounded-2xl flex flex-col items-center justify-center gap-1.5 py-5"
        style={{border:'1.5px dashed #D9C5A0',background:'linear-gradient(135deg,rgba(253,252,249,0.9),rgba(247,243,235,0.7))',minHeight:88}}>
        {/* PUB_CONTENT_START */}
        <span style={{fontSize:22}}>📢</span>
        <p className="text-[9px] font-black tracking-[0.18em] uppercase" style={{color:'#C9BFB2'}}>Espace Publicitaire</p>
        <p className="text-[8px] font-semibold" style={{color:'#D9C5A0'}}>contact@safi-bridge.ma</p>
        {/* PUB_CONTENT_END */}
      </div>
    </div>
  );
}
function Field({label,value,onChange,placeholder,type='text',lang,error,errorMsg,required:req}:{label:string;value:string;onChange:(v:string)=>void;placeholder:string;type?:string;lang:Lang;error?:boolean;errorMsg?:string;required?:boolean}) {
  const fClass=fontClass(lang);
  return (
    <div className="mb-4">
      <label className={`block text-xs font-black mb-1.5 ${fClass}`} style={{color:'#065F46'}}>
        {label}{req&&<span style={{color:'#DC2626',marginLeft:3}}>*</span>}
      </label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all ${fClass}`}
        style={{background:error?'#FEF2F2':'var(--c-input)',border:`2px solid ${error?'#FCA5A5':'var(--c-border)'}`,color:'var(--c-text)'}}
        onFocus={e=>{e.currentTarget.style.borderColor='#065F46';}}
        onBlur={e=>{e.currentTarget.style.borderColor=error?'#FCA5A5':'#E5E1D8';}}/>
      {error&&errorMsg&&<p style={{color:'#DC2626',fontSize:10,fontWeight:700,marginTop:4,marginBottom:0}}>⚠ {errorMsg}</p>}
    </div>
  );
}

// ─── ADDRESS AUTOCOMPLETE (Photon / OSM) ──────────────────────────────────────

function AddressAutocomplete({label,value,onChange,placeholder,lang,error,nationwide}:{
  label:string; value:string; onChange:(v:string)=>void;
  placeholder:string; lang:Lang; error?:boolean; nationwide?:boolean;
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
        // Nominatim — Maroc complet si nationwide, sinon borné à Safi
        const safiBox=nationwide?'':'&viewbox=-9.35,32.42,-9.10,32.15&bounded=1';
        const query=nationwide?q:q+' Safi';
        const url=`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=ma${safiBox}&limit=7&addressdetails=1&accept-language=fr`;
        const res=await fetch(url,{headers:{'Accept-Language':'fr'}});
        const data:any[]=await res.json();
        const items=data.map((f:any)=>{
          const a=f.address||{};
          const city=a.city||a.town||a.village||'';
          const parts=[
            a.road||a.pedestrian||a.footway||'',
            a.house_number||'',
            a.suburb||a.quarter||a.neighbourhood||'',
            city,
          ].filter(Boolean);
          return parts.join(', ') || f.display_name?.split(',').slice(0,3).join(', ');
        }).filter(Boolean);
        const unique=[...new Set(items)] as string[];
        setSuggestions(unique);
        setOpen(unique.length>0);
      }catch{setSuggestions([]);}
      finally{setLoading(false);}
    },380);
  };

  return(
    <div className="mb-4 relative" ref={wrapRef}>
      <label className={`block text-xs font-black mb-1.5 ${fClass}`} style={{color:'#065F46'}}>{label}</label>
      <div className="relative">
        <input type="text" value={value} autoComplete="off"
          onChange={e=>{onChange(e.target.value);fetchSuggestions(e.target.value);}}
          placeholder={placeholder}
          className={`w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all ${fClass}`}
          style={{background:error?'#FEF2F2':'var(--c-input)',border:`2px solid ${error?'#FCA5A5':'var(--c-border)'}`,color:'var(--c-text)',paddingRight:'40px'}}
          onFocus={e=>{e.currentTarget.style.borderColor='#065F46';}}
          onBlur={e=>{e.currentTarget.style.borderColor=error?'#FCA5A5':'var(--c-border)';}}/>
        {loading
          ?<div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 animate-spin" style={{borderColor:'#065F46',borderTopColor:'transparent'}}/>
          :value&&<button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-base leading-none"
              onClick={()=>{onChange('');setSuggestions([]);setOpen(false);}}>✕</button>
        }
      </div>
      {open&&suggestions.length>0&&(
        <div className="absolute z-[200] w-full mt-1 rounded-xl overflow-hidden"
          style={{background:'var(--c-bg)',border:'1.5px solid var(--c-border)',boxShadow:'0 8px 28px rgba(0,0,0,0.13)'}}>
          {suggestions.map((s,i)=>(
            <button key={i} type="button"
              className={`w-full text-left px-4 py-3 text-xs font-medium transition-colors active:bg-green-50 hover:bg-green-50 ${fClass}`}
              style={{color:'var(--c-text)',borderBottom:i<suggestions.length-1?'1px solid #F3F4F6':'none'}}
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
        style={{background:'var(--c-bg)',border:`1.5px solid ${isFeatured?'#D9C5A0':'#E5E1D8'}`,boxShadow:'0 4px 14px rgba(0,0,0,0.08)'}}>
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
            <span className="text-[10px] font-black" style={{color:'var(--c-text)'}}>{r.rating}</span>
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
      style={{background:'var(--c-bg)',border:`1.5px solid ${isFeatured?'#D9C5A0':'#E5E1D8'}`,boxShadow:isFeatured?'0 6px 24px rgba(217,197,160,0.35)':'0 4px 16px rgba(0,0,0,0.07)'}}>
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
            <span className="text-xs font-black" style={{color:'var(--c-text)'}}>{r.rating}</span>
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
      <div className="w-full max-w-md mx-auto rounded-t-3xl modal-sheet" style={{background:'var(--c-bg)',maxHeight:'90vh',display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
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
                      style={{background:sel?'#F0FDF4':'var(--c-input)',border:`1.5px solid ${errors.has(group.id)?'#FCA5A5':sel?'#065F46':'var(--c-border)'}`}}>
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
        <div className="px-5 py-4 flex-shrink-0" style={{borderTop:'1px solid var(--c-border)'}}>
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
              {_ue(restaurant.logo)}
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
              <span className="text-white text-xs font-black">{_ue(restaurant.deliveryTime)} min</span>
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
            <span>{_ue(cat.emoji)}</span><span>{cat.names[lang]}</span>
          </button>
        );})}
      </div>

      {/* Items grid */}
      {activeCat&&(
        <div className="px-5 grid grid-cols-2 gap-3 mb-6" style={{direction:isAR?'rtl':'ltr'}}>
          {activeCat.items.map(item=>(
            <button key={item.id} onClick={()=>setOptionsItem(item)}
              className="text-left rounded-2xl overflow-hidden transition-all active:scale-95 hover:shadow-xl"
              style={{background:'var(--c-bg)',border:'1.5px solid var(--c-border)',boxShadow:'0 3px 12px rgba(0,0,0,0.07)'}}>
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
                <p className={`text-[11px] font-black leading-tight mb-2 line-clamp-2 ${fClass}`} style={{color:'var(--c-text)'}}>{item.names[lang]}</p>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-black" style={{color:'#065F46'}}>{item.price} MAD</span>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-base" style={{background:'#4F46E5',flexShrink:0}}>+</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <AdSlot />

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
        <img src="/cover-eats.jpeg" alt="Bridge Safi" className="w-full h-28 object-cover" style={{objectPosition:'center 30%'}}/>
        <div className="absolute inset-0" style={{background:'linear-gradient(to top,rgba(4,55,38,0.92) 0%,rgba(4,55,38,0.25) 60%,transparent 100%)'}}/>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full inline-block mb-1.5" style={{background:'#D9C5A0',color:'#065F46'}}>SAFI · آسفي · ⵙⴰⴼⵉ</span>
          <h2 className={`text-xl font-black text-white leading-tight mb-0.5 ${fClass}`}>{t.restaurantsTitle}</h2>
          <p className="text-white/75 text-xs">{t.heroSub}</p>
        </div>
      </section>

      {/* Category filter chips */}
      <div className="mb-5" style={{overflowX:'auto',WebkitOverflowScrolling:'touch',scrollbarWidth:'none'}}>
        <div className="flex gap-2.5 px-4" style={{width:'max-content'}}>
          {CUISINE_FILTERS.map(f=>{
            const isActive=activeFilter===f.id;
            return (
              <button
                key={f.id}
                onClick={()=>setActiveFilter(f.id as FilterId)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-200 select-none active:scale-95 ${fClass}`}
                style={isActive
                  ? {background:'#065F46',color:'#FDFCF9',boxShadow:'0 4px 14px rgba(6,95,70,0.35)',transform:'scale(1.05)'}
                  : {background:'#F0EDE6',color:'#374151',boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}
                }
              >
                <span style={{fontSize:'19px',lineHeight:1}}>{f.emoji}</span>
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
          <div className="tv-grid px-4 grid grid-cols-2 gap-3 mb-6">
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
      <AdSlot />
    </div>
  );
}

// ─── PROFILE MODAL ────────────────────────────────────────────────────────────

function ProfileModal({lang,profile,onSave,onClose}:{lang:Lang;profile:UserProfile;onSave:(p:UserProfile)=>void;onClose:()=>void}) {
  const t=T[lang]; const fClass=fontClass(lang); const isAR=lang==='ar';
  const getAuthHeaders=useAuthHeaders();
  const [form,setForm]=useState<UserProfile>({...profile});
  const [saved,setSaved]=useState(false);
  const avatarInputRef=useRef<HTMLInputElement>(null);
  const handleAvatarChange=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      if(typeof ev.target?.result!=='string') return;
      const img=new Image();
      img.onload=()=>{
        const MAX=220;
        const scale=Math.min(1, MAX/Math.max(img.width,img.height));
        const w=Math.round(img.width*scale);
        const h=Math.round(img.height*scale);
        const canvas=document.createElement('canvas');
        canvas.width=w; canvas.height=h;
        canvas.getContext('2d')!.drawImage(img,0,0,w,h);
        const compressed=canvas.toDataURL('image/jpeg',0.72);
        setForm(f=>({...f,avatar:compressed}));
        // Save immediately to the dedicated avatar key so it persists without saving the whole form
        if(user?.id) { try { localStorage.setItem(avatarKey(user.id), compressed); } catch {} }
      };
      img.src=ev.target.result as string;
    };
    reader.readAsDataURL(file);
  };
  const { signOut } = useClerk();
  const [, navigate] = useLocation();
  const { user } = useUser(); const { isSignedIn } = useAuth();
  const [errs,setErrs]=useState<Record<string,boolean>>({});
  const [phoneTaken,setPhoneTaken]=useState(false);
  const [payTab,setPayTab]=useState<'card'|'paypal'>(profile.paymentMethod==='paypal'?'paypal':'card');

  // Game ID basé sur le téléphone + première lettre du prénom
  const gameId = getBridgeId(form.phone, form.name);

  // Diamond points from server (anti-cheat)
  const [gamePoints, setGamePoints] = useState(0);
  const [gameTotalEarned, setGameTotalEarned] = useState(0);
useEffect(() => {
  const phone = profile?.phone;
  if (!phone) return;
  fetch(`https://workspaceapi-server-production-12a5.up.railway.app/api/diamonds?phone=${encodeURIComponent(phone)}`, {
    headers: { 'x-api-key': 'bridge-safi-2026' }
  })
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      if (d && d.found) {
        setGamePoints(d.diamonds ?? 0);
        setGameTotalEarned(d.menus_earned ?? 0);
      }
    })
    .catch(() => {});
}, [profile?.phone]);
  // ── Validation helpers ──────────────────────────────────────────────────────
  const validateName=(v:string)=>v.trim().length>=3&&/\s/.test(v.trim());
  const validatePhone=(v:string)=>{const d=v.replace(/\D/g,'');return (d.length===9&&/^[67]/.test(d))||(d.length===10&&/^0[67]/.test(d))||(d.length===12&&/^212[67]/.test(d));};
  const validateCard=(v:string)=>isRealCard(v);
  const validatePaypal=(v:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
  const validateExpiry=(v:string)=>{
    const m=v.match(/^(\d{2})\/(\d{2})$/);
    if(!m) return false;
    const mo=parseInt(m[1],10),yr=parseInt(m[2],10)+2000;
    const now=new Date(); const ny=now.getFullYear(),nm=now.getMonth()+1;
    return mo>=1&&mo<=12&&(yr>ny||(yr===ny&&mo>=nm));
  };
  const validateCardName=(v:string)=>v.trim().length>=2;

  // ── Change-password state ────────────────────────────────────────────────────
  const [pwdOpen,setPwdOpen]=useState(false);
  const [currentPwd,setCurrentPwd]=useState('');
  const [newPwd,setNewPwd]=useState('');
  const [confirmPwd,setConfirmPwd]=useState('');
  const [pwdLoading,setPwdLoading]=useState(false);
  const [pwdErr,setPwdErr]=useState('');
  const [pwdOk,setPwdOk]=useState(false);

  const handleChangePwd=async()=>{
    if(pwdLoading) return;
    if(newPwd.length<8){setPwdErr(t.pwdWeak);return;}
    if(newPwd!==confirmPwd){setPwdErr(t.pwdMismatch);return;}
    setPwdLoading(true);setPwdErr('');
    try{
      await user!.updatePassword({currentPassword:currentPwd,newPassword:newPwd,signOutOfOtherSessions:false});
      setPwdOk(true);setCurrentPwd('');setNewPwd('');setConfirmPwd('');
      setTimeout(()=>{setPwdOk(false);setPwdOpen(false);},2500);
    }catch(err:any){
      const msg=err?.errors?.[0]?.longMessage||err?.errors?.[0]?.message||'';
      if(msg.toLowerCase().includes('incorrect')||msg.toLowerCase().includes('current')) setPwdErr(t.pwdWrong);
      else if(msg.toLowerCase().includes('password')) setPwdErr(t.pwdWeak);
      else setPwdErr(msg||t.pwdWrong);
    }
    setPwdLoading(false);
  };

  const handleSave=async()=>{
    const e:Record<string,boolean>={};
    setPhoneTaken(false);
    if(!validateName(form.name))       e.name=true;
    if(!validatePhone(form.phone))     e.phone=true;
    // Payment fields are optional — only validate if user has started filling them in
    if(payTab==='card' && form.cardNumber.replace(/\D/g,'').length>0){
      if(!validateCard(form.cardNumber)) e.card=true;
      if(form.cardExpiry && !validateExpiry(form.cardExpiry)) e.expiry=true;
      if(form.cardName && !validateCardName(form.cardName)) e.cardName=true;
    } else if(payTab==='paypal' && (form.paypalEmail||'').trim().length>0){
      if(!validatePaypal(form.paypalEmail||'')) e.paypal=true;
    }
    setErrs(e);
    if(Object.keys(e).length>0) return;
    try{
      const _ah=await getAuthHeaders();
      const r=await fetch('/api/profile/sync',{
        method:'POST',credentials:'include',
        headers:{..._ah,'Content-Type':'application/json'},
        body:JSON.stringify({phone:form.phone.trim(),name:form.name.trim(),address:(form.address||'').trim()}),
      });
      if(!r.ok){const d=await r.json().catch(()=>({error:''}));if(d.error==='phone_taken'){setPhoneTaken(true);setErrs({...e,phone:true});return;}}
    }catch{ /* server indisponible — sauvegarde locale uniquement */ }

    // Also save avatar to server so the game can fetch it via a stable HTTPS URL
    if(form.avatar && user) {
      (async()=>{
        try{
          const _ah2=await getAuthHeaders();
          await fetch('/api/profile/sync',{
            method:'POST',credentials:'include',
            headers:{..._ah2,'Content-Type':'application/json'},
            body:JSON.stringify({
              phone:form.phone.trim(),name:form.name.trim(),
              address:(form.address||'').trim(),avatar:form.avatar
            }),
          });
        }catch{ /* best-effort — local avatar still works */ }
        // Also upload to Clerk profile so user.imageUrl reflects the new photo
        try{
          if(form.avatar && form.avatar.startsWith('data:')){
            const blob=await fetch(form.avatar).then(r=>r.blob());
            const file=new File([blob],'profile.jpg',{type:'image/jpeg'});
            await user.setProfileImage({file});
          }
        }catch{ /* best-effort */ }
      })();
    }

    onSave({...form, paymentMethod:payTab});
    setSaved(true);setTimeout(()=>setSaved(false),2000);
  };
  const handleSignOut=async()=>{
    try {
      localStorage.removeItem('bridge_was_signed_in');
      localStorage.removeItem(PROFILE_KEY_LEGACY);
      // Ne pas effacer le profil personnel (bridge_eats_profile_userId) — il reste pour la prochaine connexion du même utilisateur
    } catch {}
    await signOut();
    goToSignIn();
    onClose();
  };
  const set=(k:keyof UserProfile)=>(v:string)=>setForm(f=>({...f,[k]:v}));
  const fmtCard=(v:string)=>v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
  const fmtExp=(v:string)=>{const d=v.replace(/\D/g,'').slice(0,4);return d.length>2?`${d.slice(0,2)}/${d.slice(2)}`:d;};

  return (
    <div className="fixed inset-0 z-[70] modal-overlay" style={{background:'rgba(10,30,20,0.55)',backdropFilter:'blur(6px)'}} onClick={onClose}>
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm h-full overflow-y-auto"
        style={{background:'var(--c-bg)',boxShadow:'-8px 0 40px rgba(0,0,0,0.15)',animation:'slideInRight 0.28s cubic-bezier(0.34,1,0.64,1)'}} onClick={e=>e.stopPropagation()}>
        <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3" style={{background:'var(--c-nav)',backdropFilter:'blur(12px)',borderBottom:'1px solid var(--c-border)'}}>
          {/* Left: avatar + profile title */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="relative flex-shrink-0" onClick={()=>avatarInputRef.current?.click()} style={{cursor:'pointer'}}>
              <div style={{width:46,height:46,borderRadius:'50%',overflow:'hidden',border:'2.5px solid #D9C5A0',boxShadow:'0 2px 10px rgba(6,95,70,0.18)',background:'#F0EBE1',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {form.avatar
                  ?<img src={form.avatar} alt="Profil" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  :<span style={{fontSize:22}}>👤</span>
                }
              </div>
              <div style={{position:'absolute',bottom:-2,right:-2,width:18,height:18,borderRadius:'50%',background:'linear-gradient(135deg,#065F46,#059669)',border:'1.5px solid #fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9}}>📷</div>
              <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{display:'none'}}/>
            </div>
            <div className="min-w-0">
              <p className={`font-black text-sm leading-tight ${fClass}`} style={{color:'#065F46'}}>{t.profileTitle}</p>
              <p className={`text-[10px] mt-0.5 ${fClass}`} style={{color:'#9CA3AF'}}>{t.profileSub}</p>
            </div>
          </div>
          {/* Center: shark mascot + game ID + points — tap to open game */}
          <button
            onClick={()=>{ onClose(); navigate('/game'); }}
            className="flex flex-col items-center gap-0.5 flex-shrink-0 active:scale-95 transition-transform"
            style={{background:'none',border:'none',cursor:'pointer',padding:'2px 4px',borderRadius:12}}>
            <div className="relative">
              <div style={{width:46,height:46,borderRadius:'50%',overflow:'hidden',border:'2.5px solid #065F46',boxShadow:'0 2px 12px rgba(6,95,70,0.4)',background:'#F0EBE1',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {(form.avatar||user?.imageUrl)
                  ?<img src={form.avatar||user!.imageUrl} alt="Profil" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  :<span style={{fontSize:22}}>👤</span>
                }
              </div>
              <span style={{position:'absolute',bottom:-3,left:'50%',transform:'translateX(-50%)',background:'linear-gradient(90deg,#065F46,#047857)',color:'#fff',fontSize:7,fontWeight:900,padding:'1px 6px',borderRadius:8,whiteSpace:'nowrap',letterSpacing:0.5,boxShadow:'0 1px 4px rgba(0,0,0,0.2)'}}>
                {t.gameTitle}
              </span>
            </div>
            <span style={{fontSize:9,fontWeight:900,color:'#065F46',letterSpacing:0.5,marginTop:5}}>{gameId}</span>
            <div style={{display:'flex',alignItems:'center',gap:3,background:'#FEF9C3',border:'1px solid #FDE047',borderRadius:8,padding:'2px 7px'}}>
              <span style={{fontSize:12}}>💎</span>
              <span style={{fontSize:9,fontWeight:900,color:'#92400E'}}>{gamePoints} {t.gamePts}</span>
            </div>
          </button>
          {/* Right: close button */}
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center font-black flex-shrink-0" style={{background:'#F3F4F6',color:'#6B7280',fontSize:14}}>✕</button>
        </div>
        <div className="px-5 py-5 pb-24" style={{direction:isAR?'rtl':'ltr'}}>

          <div className="rounded-2xl p-4 mb-5" style={{background:errs.name||errs.phone?'#FFF5F5':'#F0FDF4',border:`1px solid ${errs.name||errs.phone?'#FCA5A5':'#BBF7D0'}`,transition:'all 0.2s'}}>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${fClass}`} style={{color:'#065F46'}}>👤 {t.nameLabel}</p>
            <Field label={t.nameLabel} value={form.name} onChange={v=>{set('name')(v);if(errs.name&&validateName(v))setErrs(e=>({...e,name:false}));}} placeholder={t.namePh} lang={lang} required error={errs.name} errorMsg={t.errName}/>
            <Field label={t.addrLabel} value={form.address} onChange={set('address')} placeholder={t.addrPh} lang={lang}/>
            <Field label={t.phoneLabel} value={form.phone} onChange={v=>{set('phone')(v);if(errs.phone&&validatePhone(v)){setErrs(e=>({...e,phone:false}));setPhoneTaken(false);}}} placeholder={t.phonePh} type="tel" lang={lang} required error={errs.phone} errorMsg={phoneTaken?(lang==='ar'?'هذا الرقم مستخدم بحساب آخر':lang==='en'?'Number already linked to another account':'Numéro déjà utilisé par un autre compte'):t.errPhone}/>
            <Field label={t.emailLabel} value={form.email||''} onChange={set('email')} placeholder={t.emailPh} type="email" lang={lang}/>
          </div>
          {/* ── Code promo / Coupon ───────────────────────────────── */}
          <div className="rounded-2xl p-4 mb-5" style={{background:'#FFFBEB',border:'1px solid #FDE68A',transition:'all 0.2s'}}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-[10px] font-black uppercase tracking-widest ${fClass}`} style={{color:'#92400E'}}>🎟️ {lang==='ar'?'كود الخصم':lang==='en'?'Promo code':lang==='amz'?'ⴽⵓⴷ ⵏ ⵓⵎⴽⴻⵙⵙⵎ':'Code promo'}</p>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${fClass}`} style={{background:'#FEF3C7',color:'#92400E',border:'1px solid #FDE68A'}}>
                {lang==='ar'?'اختياري':lang==='en'?'Optional':lang==='amz'?'ⵉⵅⵜⵉⵢⴰⵔⵉ':'Facultatif'}
              </span>
            </div>
            <p className={`text-[10px] mb-3 ${fClass}`} style={{color:'#A16207'}}>
              {lang==='ar'?'أدخل كود الخصم الخاص بك للاستفادة من العروض':lang==='en'?'Enter your promo code to enjoy special offers':lang==='amz'?'Sker kud ⵏ ⵎⴽⴻⵙⵙⵎ':'Entrez votre code promo pour bénéficier des offres'}
            </p>
            <Field
              label={lang==='ar'?'كود الخصم':lang==='en'?'Promo code':lang==='amz'?'ⴽⵓⴷ':'Code promo'}
              value={form.coupon||''}
              onChange={v=>set('coupon')(v.toUpperCase().trim())}
              placeholder={lang==='ar'?'مثال: BRIDGE10':lang==='en'?'e.g. BRIDGE10':'ex: BRIDGE10'}
              lang={lang}
            />
          </div>
          {/* ── Payment section (optional) ───────────────────────── */}
          <div className="rounded-2xl p-4 mb-5" style={{
            background: payTab==='paypal'
              ? (errs.paypal?'#FFF5F5':'#EFF6FF')
              : (errs.card||errs.expiry||errs.cardName?'#F5F3FF':'#EEF2FF'),
            border:`1px solid ${payTab==='paypal'
              ? (errs.paypal?'#FCA5A5':'#BFDBFE')
              : (errs.card||errs.expiry||errs.cardName?'#C4B5FD':'#C7D2FE')}`,
            transition:'all 0.2s'}}>
            {/* Optional badge */}
            <div className="flex items-center justify-between mb-3">
              <p className={`text-[10px] font-black uppercase tracking-widest ${fClass}`} style={{color:'#4F46E5'}}>💳 {t.payModeTitle}</p>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${fClass}`} style={{background:'#F0FDF4',color:'#065F46',border:'1px solid #BBF7D0'}}>
                {lang==='ar'?'اختياري':lang==='en'?'Optional':lang==='amz'?'ⵉⵅⵜⵉⵢⴰⵔⵉ':'Facultatif'}
              </span>
            </div>
            <p className={`text-[10px] mb-3 ${fClass}`} style={{color:'#9CA3AF'}}>
              {lang==='ar'?'يمكنك الدفع نقداً عند التسليم بدون بطاقة':lang==='en'?'You can always pay cash on delivery — no card needed':lang==='amz'?'Tzemreḍ ad tsessefleḍ s udrimen':'Tu peux toujours payer en espèces à la livraison — aucune carte requise'}
            </p>
            {/* Tab switcher */}
            <div className="flex gap-2 mb-4 p-1 rounded-xl" style={{background:'rgba(0,0,0,0.05)'}}>
              {(['card','paypal'] as const).map(tab=>(
                <button key={tab} onClick={()=>{setPayTab(tab);setErrs({});}}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-black transition-all ${fClass}`}
                  style={{
                    background: payTab===tab?'white':'transparent',
                    color: payTab===tab?(tab==='paypal'?'#003087':'#4F46E5'):'#9CA3AF',
                    boxShadow: payTab===tab?'0 2px 8px rgba(0,0,0,0.1)':'none',
                    border:'none',cursor:'pointer',
                  }}>
                  {tab==='card'?t.paymentTabCard:t.paymentTabPaypal}
                </button>
              ))}
            </div>

            {payTab==='card'&&(<>
              {/* Visual card preview */}
              {(()=>{const ct=detectCard(form.cardNumber); const digits=form.cardNumber.replace(/\D/g,''); const valid=digits.length===16&&ct!=='unknown'; return valid?(
                <div className="rounded-2xl p-4 mb-4 relative overflow-hidden" style={{
                  background: ct==='visa'
                    ? 'linear-gradient(135deg,#1A1A6E,#003087,#1A478A)'
                    : 'linear-gradient(135deg,#EB001B,#FF5F00,#F79E1B)',
                  minHeight:108}}>
                  <div className="absolute inset-0 opacity-10" style={{backgroundImage:'repeating-linear-gradient(45deg,white 0,white 1px,transparent 0,transparent 50%)',backgroundSize:'8px 8px'}}/>
                  {/* Top row: brand + logo */}
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-white/70 text-[10px] font-bold tracking-widest">💳 BRIDGE</p>
                    {ct==='visa'?<VisaLogo/>:<MastercardLogo/>}
                  </div>
                  <p className="text-white font-black text-base tracking-widest mb-3">{fmtCard(form.cardNumber)}</p>
                  <div className="flex justify-between items-end">
                    <div><p className="text-white/50 text-[9px] font-bold">NAME</p><p className="text-white text-[11px] font-bold">{form.cardName||'—'}</p></div>
                    <div className="text-right"><p className="text-white/50 text-[9px] font-bold">EXPIRES</p><p className="text-white text-[11px] font-bold">{form.cardExpiry||'—'}</p></div>
                  </div>
                </div>
              ):null;})()}
              {/* Accepted cards hint */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold" style={{color:'#6B7280'}}>Accepté :</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black" style={{background:'#003087',color:'white'}}>VISA</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black" style={{background:'linear-gradient(90deg,#EB001B,#F79E1B)',color:'white'}}>MC</span>
              </div>
              <Field label={t.cardNumberLabel} value={fmtCard(form.cardNumber)}
                onChange={v=>{const raw=v.replace(/\s/g,'').slice(0,16);set('cardNumber')(raw);if(errs.card&&validateCard(raw))setErrs(e=>({...e,card:false}));}}
                placeholder={t.cardNumberPh} type="tel" lang={lang} required
                error={errs.card}
                errorMsg={form.cardNumber.replace(/\D/g,'').length===16&&!isValidCardType(form.cardNumber)?t.errCardType:t.errCard}/>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t.cardExpiryLabel} value={form.cardExpiry}
                  onChange={v=>{const f=fmtExp(v);set('cardExpiry')(f);if(errs.expiry&&validateExpiry(f))setErrs(e=>({...e,expiry:false}));}}
                  placeholder={t.cardExpiryPh} type="tel" lang={lang} required error={errs.expiry} errorMsg={t.errExpiry}/>
                <Field label={t.cardCVVLabel} value={form.cardNumber?'•••':''} onChange={()=>{}} placeholder={t.cardCVVPh} type="password" lang={lang}/>
              </div>
              <Field label={t.cardNameLabel} value={form.cardName}
                onChange={v=>{set('cardName')(v.toUpperCase());if(errs.cardName&&validateCardName(v))setErrs(e=>({...e,cardName:false}));}}
                placeholder={t.cardNamePh} lang={lang} required error={errs.cardName} errorMsg={t.errCardName}/>
            </>)}

            {payTab==='paypal'&&(<>
              {/* PayPal saved indicator */}
              {form.paypalEmail&&validatePaypal(form.paypalEmail)&&(
                <div className="flex items-center gap-3 rounded-xl p-3 mb-4" style={{background:'#003087',color:'white'}}>
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
                    <path d="M20.067 8.478c.492.315.844.825.983 1.39.49 2.003-.993 3.895-3.25 4.385-.21.045-.425.067-.64.067H15.26l-.472 3H12l1.98-12H17.8c1.337 0 2.012.635 2.267 1.158z" fill="#009CDE"/>
                    <path d="M8.5 7H12.8c1.337 0 2.013.635 2.267 1.158.492.315.844.825.983 1.39.49 2.003-.993 3.895-3.25 4.385-.21.045-.425.067-.64.067H10.26l-.472 3H7L9 5h-.5z" fill="#012169"/>
                    <path d="M4 10H8.3c1.337 0 2.012.635 2.267 1.158.492.315.844.825.983 1.39.49 2.003-.993 3.895-3.25 4.385-.21.045-.425.067-.64.067H5.76l-.472 3H2.5L4.5 8H4z" fill="#003087"/>
                  </svg>
                  <div>
                    <p style={{fontSize:9,opacity:0.7,fontWeight:700,letterSpacing:'0.08em'}}>PAYPAL</p>
                    <p style={{fontSize:13,fontWeight:900}}>{form.paypalEmail}</p>
                  </div>
                </div>
              )}
              <Field label={t.paypalEmailLabel} value={form.paypalEmail||''} type="email"
                onChange={v=>{set('paypalEmail')(v);if(errs.paypal&&validatePaypal(v))setErrs(e=>({...e,paypal:false}));}}
                placeholder={t.paypalPh} lang={lang} required error={errs.paypal} errorMsg={t.errPaypal}/>
              <p style={{fontSize:10,color:'#6B7280',margin:'-4px 0 4px',fontWeight:600}}>
                🔒 PayPal · Paiement sécurisé · Aucune carte requise
              </p>
            </>)}
          </div>
          {/* ── Bridge Game Stats ───────────────────────────────── */}
          <div className="rounded-2xl p-4 mb-5" style={{background:'linear-gradient(135deg,#052e16,#064e3b)',border:'1.5px solid #065F46',boxShadow:'0 4px 20px rgba(6,95,70,0.25)'}}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-[10px] font-black uppercase tracking-widest ${fClass}`} style={{color:'#4ADE80'}}>🦈 Bridge Game</p>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${fClass}`} style={{background:'rgba(74,222,128,0.15)',color:'#4ADE80',border:'1px solid rgba(74,222,128,0.3)'}}>{gameId}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl p-3" style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)'}}>
                <p className={`text-[9px] font-bold uppercase tracking-wide mb-1 ${fClass}`} style={{color:'rgba(255,255,255,0.5)'}}>
                  {lang==='ar'?'الرصيد الحالي':lang==='en'?'Current balance':lang==='amz'?'ⵜⵉⵏⵓⴹⵉⵡⵉⵏ':'Solde actuel'}
                </p>
                <div className="flex items-center gap-1.5">
                  <span style={{fontSize:18}}>💎</span>
                  <span className={`text-lg font-black ${fClass}`} style={{color:'#FCD34D'}}>{gamePoints.toLocaleString()}</span>
                </div>
              </div>
              <div className="rounded-xl p-3" style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)'}}>
                <p className={`text-[9px] font-bold uppercase tracking-wide mb-1 ${fClass}`} style={{color:'rgba(255,255,255,0.5)'}}>
                  {lang==='ar'?'المجموع الكلي':lang==='en'?'Total earned':lang==='amz'?'ⴰⵎⵎⴰⵙ':'Total cumulé'}
                </p>
                <div className="flex items-center gap-1.5">
                  <span style={{fontSize:18}}>💎</span>
                  <span className={`text-lg font-black ${fClass}`} style={{color:'#4ADE80'}}>{gameTotalEarned.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <button onClick={()=>{ onClose(); navigate('/game'); }}
              className={`w-full mt-3 py-2.5 rounded-xl font-black text-sm transition-all active:scale-95 ${fClass}`}
              style={{background:'linear-gradient(135deg,#4ADE80,#059669)',color:'#052e16',border:'none',cursor:'pointer',boxShadow:'0 4px 12px rgba(74,222,128,0.3)'}}>
              🎮 {lang==='ar'?'العب الآن':lang==='en'?'Play now':lang==='amz'?'ⴰⴳⵏ ⴷⴷⴰⵡ':'Jouer maintenant'}
            </button>
          </div>

          {/* ── Change password accordion ───────────────────────── */}
          <div className="rounded-2xl mb-5 overflow-hidden" style={{border:'1px solid var(--c-border)'}}>
            <button onClick={()=>{setPwdOpen(o=>!o);setPwdErr('');}}
              className={`w-full flex items-center justify-between px-4 py-3.5 ${fClass}`}
              style={{background:'var(--c-input)',border:'none',cursor:'pointer'}}>
              <span className="font-black text-sm" style={{color:'var(--c-text)'}}>{t.changePwd}</span>
              <span style={{color:'#9CA3AF',fontSize:18,transform:pwdOpen?'rotate(180deg)':'none',transition:'transform 0.2s'}}>⌄</span>
            </button>
            {pwdOpen&&(
              <div className="px-4 pb-4 pt-1" style={{background:'var(--c-input)',borderTop:'1px solid var(--c-border)'}}>
                <Field label={t.currentPwd} value={currentPwd} onChange={setCurrentPwd} placeholder="••••••••" type="password" lang={lang}/>
                <Field label={t.newPwd} value={newPwd} onChange={setNewPwd} placeholder="••••••••" type="password" lang={lang}/>
                <Field label={t.confirmPwd} value={confirmPwd} onChange={setConfirmPwd} placeholder="••••••••" type="password" lang={lang}/>
                {pwdErr&&<p className="text-xs font-semibold mb-3 px-1" style={{color:'#B91C1C'}}>{pwdErr}</p>}
                <button onClick={handleChangePwd}
                  className={`w-full py-3 rounded-xl font-black text-sm text-white transition-all active:scale-95 ${fClass}`}
                  style={{background:pwdOk?'#059669':'#065F46',opacity:pwdLoading?0.7:1}}>
                  {pwdOk?t.pwdChanged:pwdLoading?'...' : t.pwdSave}
                </button>
              </div>
            )}
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

// ─── QR PAY MODAL ─────────────────────────────────────────────────────────────

function QRPayModal({lang,amount,onConfirm,onClose}:{lang:Lang;amount?:number;onConfirm:()=>void;onClose:()=>void;}){
  const isAR=lang==='ar';
  const fClass=lang==='amz'?'font-tifinagh':'';
  const t=T[lang];
  const qrSrc=`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(BRIDGE_QR_PAY_URL)}&color=065F46&bgcolor=FDFCF9&margin=12&qzone=2`;
  return(
    <div className="fixed inset-0 z-[200] flex items-end justify-center" style={{background:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)'}}>
      <div className="w-full max-w-sm rounded-t-3xl pb-safe" style={{background:'var(--c-bg)',boxShadow:'0 -8px 40px rgba(0,0,0,0.35)'}}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full" style={{background:'var(--c-border)'}}/></div>
        <div className={`px-6 pt-2 pb-6 ${isAR?'text-right':''}`} style={{direction:isAR?'rtl':'ltr'}}>
          <p className={`font-black text-xl mb-1 ${fClass}`} style={{color:'var(--c-text)'}}>{t.qrModalTitle}</p>
          <p className={`text-sm mb-5 ${fClass}`} style={{color:'#6B7280'}}>{t.qrModalSub}</p>
          {/* QR CODE */}
          <div className="flex flex-col items-center gap-3 mb-5">
            <div className="p-3 rounded-2xl" style={{background:'#FDFCF9',boxShadow:'0 4px 24px rgba(0,0,0,0.12)',border:'2.5px solid #065F46'}}>
              <img src={qrSrc} alt="QR Code paiement Bridge Safi" width={200} height={200} style={{display:'block',borderRadius:8}}
                onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none';}}/>
              {/* Fallback si QR ne charge pas */}
              <div className="flex items-center justify-center" style={{width:200,height:200,display:'none'}}>
                <div style={{fontSize:64}}>📱</div>
              </div>
            </div>
            {/* Badge montant */}
            {amount!=null&&amount>0&&(
              <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{background:'#065F46'}}>
                <span className={`font-black text-white text-base ${fClass}`}>{t.qrAmountLabel} : {amount.toFixed(2)} MAD</span>
              </div>
            )}
          </div>
          {/* Instructions steps */}
          <div className="rounded-2xl p-4 mb-5" style={{background:'var(--c-input)',border:'1.5px solid var(--c-border)'}}>
            {[
              lang==='ar'?'١. افتح تطبيق بنكك':lang==='en'?'1. Open your banking app':lang==='amz'?'1. ⵙⵉⵡⵍ ⵜⴰⵙⵏⵖⵎⵙⵜ':'1. Ouvrez votre appli bancaire',
              lang==='ar'?'٢. اضغط "دفع بالـ QR"':lang==='en'?'2. Tap "QR Pay"':lang==='amz'?'2. ⵙⵃⵓ QR':'2. Appuyez sur "Payer QR"',
              lang==='ar'?'٣. امسح رمز QR أعلاه':lang==='en'?'3. Scan the QR code above':lang==='amz'?'3. ⵙⵃⵓ ⵉ QR':'3. Scannez le QR ci-dessus',
              lang==='ar'?'٤. أكد التحويل في بنكك':lang==='en'?'4. Confirm payment in your bank':lang==='amz'?'4. ⵙⵡⵓⵔ ⵉ ⵓⴱⴰⵏⴽ':'4. Confirmez dans votre banque',
            ].map((step,i)=>(
              <div key={i} className={`flex items-center gap-3 ${i<3?'mb-2':''} ${isAR?'flex-row-reverse':''}`}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{background:'#065F46'}}>
                  <span style={{fontSize:10,color:'white',fontWeight:900}}>{i+1}</span>
                </div>
                <p className={`text-xs font-semibold ${fClass}`} style={{color:'var(--c-text)'}}>{step}</p>
              </div>
            ))}
          </div>
          <p className={`text-[10px] text-center mb-4 ${fClass}`} style={{color:'#9CA3AF'}}>{t.qrNote}</p>
          {/* Buttons */}
          <div className="flex gap-3">
            <button onClick={onClose}
              className={`flex-1 py-3.5 rounded-2xl font-black text-sm active:scale-95 transition-all ${fClass}`}
              style={{background:'var(--c-input)',border:'1.5px solid var(--c-border)',color:'var(--c-text)'}}>
              {t.qrCancel}
            </button>
            <button onClick={onConfirm}
              className={`flex-1 py-3.5 rounded-2xl font-black text-sm text-white active:scale-95 transition-all ${fClass}`}
              style={{background:'#065F46',boxShadow:'0 6px 20px rgba(6,95,70,0.35)'}}>
              {t.qrPaid}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SHARED PAYMENT OPTIONS ────────────────────────────────────────────────────

type PayMethodType='cash'|'card'|'qr'|'apple'|'google'|null;

function SharedPaymentOptions({lang,amount,selected,onSelect,showCash=true,showCard=false,onWalletPay}:{
  lang:Lang; amount?:number; selected:PayMethodType; onSelect:(m:PayMethodType)=>void;
  showCash?:boolean; showCard?:boolean; onWalletPay:(type:'apple'|'google')=>void;
}){
  const t=T[lang]; const isAR=lang==='ar'; const fClass=lang==='amz'?'font-tifinagh':'';
  return(
    <div style={{direction:isAR?'rtl':'ltr'}}>
      {/* Apple Pay + Google Pay */}
      <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${fClass}`} style={{color:'#6B7280'}}>
        ⚡ {lang==='ar'?'دفع سريع':lang==='en'?'Express pay':lang==='amz'?'ⵉⵙⵙⵉⴼⵍ ⴰⵣⵔⴼ':'Paiement rapide'}
      </p>
      <div className="flex gap-3 mb-3">
        <button onClick={()=>onWalletPay('apple')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl font-black text-sm text-white active:scale-95 transition-all ${fClass}`}
          style={{background:'#000',boxShadow:'0 4px 14px rgba(0,0,0,0.25)'}}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.27.06 2.15.64 2.88.68.93-.21 1.82-.8 3.07-.68 1.52.13 2.66.72 3.4 1.82-3.14 1.87-2.37 5.98.65 7.04zm-3.77-13.97c-.39 1.73-2.22 3.03-3.68 2.95-.24-1.65 1.4-3.1 3.68-2.95z"/></svg>
          <span>Pay</span>
        </button>
        <button onClick={()=>onWalletPay('google')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl font-black text-sm active:scale-95 transition-all ${fClass}`}
          style={{background:'var(--c-card)',border:'1.5px solid var(--c-border)',boxShadow:'0 4px 14px rgba(0,0,0,0.06)'}}>
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 10.2v3.6h5c-.2 1.1-.8 2-1.7 2.7l2.7 2.1C19.7 17 21 14.8 21 12c0-.6-.1-1.2-.2-1.8H12z" fill="#4285F4"/><path d="M5.3 14.3l-.6.5-2.3 1.8C4 19.3 7.7 21.5 12 21.5c3 0 5.5-1 7.3-2.7l-2.7-2.1c-1 .7-2.2 1-3.6 1-2.8 0-5.1-1.9-5.9-4.4H5.3z" fill="#34A853"/><path d="M2.4 7.4C1.8 8.6 1.5 9.8 1.5 12s.3 3.4 1 4.6l2.9-2.3C5.1 13.5 5 12.8 5 12s.1-1.5.4-2.3L2.4 7.4z" fill="#FBBC05"/><path d="M12 5.5c1.6 0 3 .5 4.2 1.5l2.5-2.5C16.8 2.9 14.6 2 12 2 7.7 2 4 4.2 2.4 7.4l2.9 2.3C6.2 7.1 8.9 5.5 12 5.5z" fill="#EA4335"/></svg>
          <span style={{fontWeight:900,fontSize:12,color:'#3C4043'}}>Pay</span>
        </button>
      </div>
      {/* Divider */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-px" style={{background:'var(--c-border)'}}/>
        <span className={`text-[11px] font-bold ${fClass}`} style={{color:'#9CA3AF'}}>{lang==='ar'?'أو':lang==='en'?'or':lang==='amz'?'ⵏⵖ':'ou'}</span>
        <div className="flex-1 h-px" style={{background:'var(--c-border)'}}/>
      </div>
      {/* QR Code */}
      <button onClick={()=>onSelect(selected==='qr'?null:'qr')}
        className="w-full flex items-center gap-3 p-3.5 rounded-2xl mb-2.5 text-left transition-all active:scale-95"
        style={{background:selected==='qr'?'#ECFDF5':'var(--c-card)',border:`2px solid ${selected==='qr'?'#059669':'var(--c-border)'}`}}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{background:selected==='qr'?'#D1FAE5':'var(--c-input)'}}>📲</div>
        <div className="flex-1 text-left">
          <p className={`font-black text-sm ${fClass}`} style={{color:selected==='qr'?'#065F46':'var(--c-text)'}}>{t.qrOption}</p>
          <p className={`text-xs mt-0.5 ${fClass}`} style={{color:'#9CA3AF'}}>{t.qrOptionDesc}</p>
        </div>
        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
          style={{borderColor:selected==='qr'?'#059669':'#D1D5DB',background:selected==='qr'?'#059669':'transparent'}}>
          {selected==='qr'&&<div className="w-2 h-2 rounded-full bg-white"/>}
        </div>
      </button>
      {/* Cash */}
      {showCash&&(
        <button onClick={()=>onSelect(selected==='cash'?null:'cash')}
          className="w-full flex items-center gap-3 p-3.5 rounded-2xl mb-2.5 text-left transition-all active:scale-95"
          style={{background:selected==='cash'?'#F0FDF4':'var(--c-card)',border:`2px solid ${selected==='cash'?'#16A34A':'var(--c-border)'}`}}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{background:selected==='cash'?'#DCFCE7':'var(--c-input)'}}>🤝</div>
          <div className="flex-1 text-left">
            <p className={`font-black text-sm ${fClass}`} style={{color:selected==='cash'?'#065F46':'var(--c-text)'}}>{t.cashOption}</p>
            <p className={`text-xs mt-0.5 ${fClass}`} style={{color:'#9CA3AF'}}>{t.cashOptionDesc}</p>
          </div>
          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
            style={{borderColor:selected==='cash'?'#16A34A':'#D1D5DB',background:selected==='cash'?'#16A34A':'transparent'}}>
            {selected==='cash'&&<div className="w-2 h-2 rounded-full bg-white"/>}
          </div>
        </button>
      )}
      {/* Card */}
      {showCard&&(
        <button onClick={()=>onSelect(selected==='card'?null:'card')}
          className="w-full flex items-center gap-3 p-3.5 rounded-2xl mb-2.5 text-left transition-all active:scale-95"
          style={{background:selected==='card'?'#E0E7FF':'var(--c-card)',border:`2px solid ${selected==='card'?'#4F46E5':'var(--c-border)'}`}}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{background:selected==='card'?'#E0E7FF':'var(--c-input)'}}>💳</div>
          <div className="flex-1 text-left">
            <p className={`font-black text-sm ${fClass}`} style={{color:selected==='card'?'#4F46E5':'var(--c-text)'}}>{t.cardOption}</p>
            <p className={`text-xs mt-0.5 ${fClass}`} style={{color:'#9CA3AF'}}>{t.cardOptionDesc}</p>
          </div>
          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
            style={{borderColor:selected==='card'?'#4F46E5':'#D1D5DB',background:selected==='card'?'#4F46E5':'transparent'}}>
            {selected==='card'&&<div className="w-2 h-2 rounded-full bg-white"/>}
          </div>
        </button>
      )}
    </div>
  );
}

// ─── CHECKOUT DRAWER ──────────────────────────────────────────────────────────

type CheckoutStep='cart'|'form'|'payment'|'card'|'success';

function CheckoutDrawer({cart,lang,onClose,onQty,profile,onClearCart,restaurantName,onOrderSuccess,saveProfile,serviceFeeThreshold=70,serviceFeeAmount=SERVICE_FEE}:{
  cart:CartItem[]; lang:Lang; onClose:()=>void;
  onQty:(cartId:string,delta:number)=>void;
  saveProfile?:(p:UserProfile)=>void;
  profile:UserProfile; onClearCart:()=>void; restaurantName?:string;
  onOrderSuccess?:(ref:string)=>void;
  serviceFeeThreshold?:number; serviceFeeAmount?:number;
}) {
  const { isSignedIn, user } = useUser();
  const getAuthHeaders=useAuthHeaders();
  const [, navigate] = useLocation();
  const t=T[lang]; const isAR=lang==='ar'; const fClass=fontClass(lang);
  const [delivMode,setDelivMode]=useState<'delivery'|'collect'>('delivery');
  const baseTotal=cart.reduce((s,i)=>s+i.totalPerUnit*i.qty,0);
  const collectFee=delivMode==='collect'?2.99:0;
  // Promo codes
  const [promoInput,setPromoInput]=useState('');
  const [promoDiscount,setPromoDiscount]=useState(0);
  const [promoMsg,setPromoMsg]=useState('');
  const [promoIsErr,setPromoIsErr]=useState(false);
  const [usedPromos]=useState(new Set<string>());
  const applyPromo=()=>{
    const code=promoInput.trim().toUpperCase();
    if(!code)return;
    if(usedPromos.has(code)){setPromoMsg(t.promoErr);setPromoIsErr(true);return;}
    const disc=PROMO_CODES[code];
    if(!disc){setPromoMsg(t.promoErr);setPromoIsErr(true);return;}
    usedPromos.add(code);
    setPromoDiscount(d=>d+disc);
    setPromoMsg(t.promoOk(disc));setPromoIsErr(false);setPromoInput('');
  };
  // Game diamonds → MAD (fetched from server, anti-cheat)
  const [gamePts,setGamePts]=useState(0);
  useEffect(()=>{
    if(!user?.id) return;
    getAuthHeaders().then(h=>fetch('/api/game/diamonds',{credentials:'include',headers:h})
      .then(r=>r.ok?r.json():null)
      .then(d=>{if(d&&typeof d.diamonds==='number')setGamePts(d.diamonds);})
      .catch(()=>{}));
  },[user?.id,getAuthHeaders]);
  // 1 000 💎 = 5 MAD → 200 💎 = 1 MAD
  const maxPtsMAD=Math.floor(gamePts/200);
  const [ptsUsed,setPtsUsed]=useState(0);
  const usePts=(mad:number)=>{
    const clamped=Math.min(mad,maxPtsMAD);
    setPtsUsed(clamped);
    // Deduct server-side when order is confirmed (see sendOrderToAPI)
  };
  const [serviceFeeEnabled,setServiceFeeEnabled]=useState(false);
  const isServiceFeeForced=baseTotal<serviceFeeThreshold;
  const serviceFee=(isServiceFeeForced||serviceFeeEnabled)?serviceFeeAmount:0;
  const [step,setStep]=useState<CheckoutStep>('cart');
  const [name,setName]=useState(profile.name);
  const [addr,setAddr]=useState(profile.address);
  const [phone,setPhone]=useState(profile.phone);
  const [err,setErr]=useState('');
  const [gpsCoords,setGpsCoords]=useState('');
  // Distance km — silencieux, jamais affiché au client
  const distanceKm=useMemo(()=>{
    if(!gpsCoords)return 0;
    const [lat,lng]=gpsCoords.split(',').map(Number);
    if(isNaN(lat)||isNaN(lng))return 0;
    return Math.round(haversineKm(RESTAURANT_LAT,RESTAURANT_LNG,lat,lng)*10)/10;
  },[gpsCoords]);
  const kmSurcharge=delivMode==='delivery'?Math.ceil(distanceKm)*KM_RATE:0;
  const deliveryFeeBase=delivMode==='delivery'?DELIVERY_FEE:0; // affiché
  const deliveryFee=deliveryFeeBase+kmSurcharge;               // réel
  const totalDiscount=promoDiscount+ptsUsed;
  const total=Math.max(0,Math.round((baseTotal+collectFee+deliveryFee+serviceFee-totalDiscount)*100)/100);
  const [mapPin,setMapPin]=useState<[number,number]|null>(null);
  const [outsideZone,setOutsideZone]=useState(false);
  const [payMethod,setPayMethod]=useState<PayMethodType>(null);
  const [showQRModal,setShowQRModal]=useState(false);
  const [cardNum,setCardNum]=useState('');
  const [cardExp,setCardExp]=useState(profile.cardExpiry);
  const [cardCVV,setCardCVV]=useState('');
  const [cardName,setCardName]=useState(profile.cardName);
  const [orderRef]=useState(`BE-${Math.floor(1000+Math.random()*9000)}`);
  const [collectCode]=useState(`CC-${Math.floor(1000+Math.random()*9000)}`);
  const [cardErr,setCardErr]=useState('');

  const handleSuccess=()=>{
    localStorage.setItem('bridge_last_ref',orderRef);
    try{const raw=localStorage.getItem('bridge_history');const arr=raw?JSON.parse(raw):[];arr.unshift({ref:orderRef,type:'eats',date:new Date().toISOString(),restaurantName,total});if(arr.length>100)arr.splice(100);localStorage.setItem('bridge_history',JSON.stringify(arr));}catch{}
    onOrderSuccess?.(orderRef);
    setStep('success');
  };

  const handleWalletPay=async(type:'apple'|'google')=>{
    const payLabel=type==='apple'?'Apple Pay':'Google Pay';
    const methods=type==='apple'
      ?[{supportedMethods:'https://apple.com/apple-pay',data:{version:3,merchantIdentifier:'merchant.ma.safi-bridge',merchantCapabilities:['supports3DS'],supportedNetworks:['visa','masterCard'],countryCode:'MA'}}]
      :[{supportedMethods:'https://google.com/pay',data:{apiVersion:2,apiVersionMinor:0,merchantInfo:{merchantName:'Bridge Safi'},allowedPaymentMethods:[{type:'CARD',parameters:{allowedAuthMethods:['PAN_ONLY','CRYPTOGRAM_3DS'],allowedCardNetworks:['MASTERCARD','VISA']},tokenizationSpecification:{type:'PAYMENT_GATEWAY',parameters:{gateway:'example',gatewayMerchantId:'bridge-safi'}}}]}}];
    const details={total:{label:`Bridge Safi${restaurantName?' · '+restaurantName:''}`,amount:{currency:'MAD',value:String(total)}}};
    try{
      if(typeof PaymentRequest==='undefined') throw new Error('unsupported');
      const pr=new PaymentRequest(methods,details);
      const canMake=await pr.canMakePayment().catch(()=>false);
      if(!canMake) throw new Error('unavailable');
      const response=await pr.show();
      await response.complete('success');
      sendOrderToAPI(payLabel);
      sendOrderToDriverApp(payLabel);
      handleSuccess();
    }catch(e:unknown){
      const msg=e instanceof Error?e.message:'';
      if(msg!=='AbortError'&&msg!==''){
        // Wallet non disponible sur cet appareil → fallback carte
        setPayMethod('card');
        setStep('card');
      }
    }
  };

  const autoFilled=!!(profile.name||profile.address||profile.phone);

  const sendOrderToAPI=async(paymentMethod:string)=>{
    try{
      const items=cart.map(i=>({name:i.item.names['fr'],qty:i.qty,price:i.totalPerUnit,options:Object.entries(i.selectedOptions).flatMap(([,ids])=>ids)}));
      const ah=await getAuthHeaders();
      await fetch('/api/orders',{
        method:'POST',
        headers:{...ah,'Content-Type':'application/json'},
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
          collectCode:delivMode==='collect'?collectCode:null,
        }),
      });
      // Deduct diamonds server-side if used
      if(ptsUsed>0){
        const diamondsToSpend=ptsUsed*200; // 200 💎 = 1 MAD (1 000 💎 = 5 MAD)
        getAuthHeaders().then(h=>fetch('/api/game/diamonds/spend',{
          method:'POST',credentials:'include',
          headers:{...h,'Content-Type':'application/json'},
          body:JSON.stringify({spend:diamondsToSpend}),
        }).then(r=>r.ok?r.json():null).then(d=>{
          if(d&&typeof d.diamonds==='number'){
            const ck=`bridge_diamonds_cache_${user?.id||'anon'}`;
            try{localStorage.setItem(ck,String(d.diamonds));}catch{}
            window.dispatchEvent(new StorageEvent('storage',{key:ck,newValue:String(d.diamonds)}));
          }
        }).catch(()=>{}));
      }
    }catch(err){console.error('[sendOrderToAPI]', err);}
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
      const collectLine=delivMode==='collect'?`\n🏪 Click & Collect — CODE CLIENT : ${collectCode}`:'';
      const kmLine=delivMode==='delivery'&&distanceKm>0?`\n📏 Distance: ~${distanceKm} km | Frais km: +${kmSurcharge} MAD (total livraison: ${deliveryFee} MAD)`:'';
      const notes=`🛒 ${itemsList}\n💰 Total client: ${total} MAD\n💳 ${payLabel}${navLink}${collectLine}${kmLine}`;
      const driverTrackUrl=`${window.location.origin}/driver/${orderRef}`;
      const r=await fetch(`${DRIVER_APP_URL}/api/deliveries`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          trackingNumber:orderRef,
          customerName:name.trim(),
          customerPhone:phone.trim(),
          pickupAddress:restaurantName?`${restaurantName} — Safi`:"McDonald's Safi",
          deliveryAddress:delivMode==='collect'
            ?`🏪 Click & Collect — CODE : ${collectCode}${addr.trim()?` (${addr.trim()})`:''}`
            :`${addr.trim()}, Safi, Maroc`,
          priority:'normal',
          notes,
          collectCode:delivMode==='collect'?collectCode:undefined,
          driverTrackUrl,
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
      <div className="w-full max-w-md mx-auto rounded-t-3xl modal-sheet" style={{background:'var(--c-bg)',maxHeight:'92vh',display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 flex items-center gap-3 flex-shrink-0" style={{borderBottom:'1px solid var(--c-border)'}}>
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
                {i<2&&<div className="w-6 h-px" style={{background:'var(--c-border)'}}/>}
              </div>
            ))}
          </div>
        )}

        {/* CART */}
        {step==='cart'&&(
          <>
            <div className="flex-1 overflow-y-auto px-5 py-3" style={{direction:isAR?'rtl':'ltr'}}>
              {cart.length===0?(
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <span className="text-6xl mb-3">🛒</span>
                  <p className={`text-sm font-bold ${fClass}`} style={{color:'#9CA3AF'}}>{t.cartEmpty}</p>
                  <AdSlot className="w-full mt-4" />
                </div>
              ):cart.map(ci=>(
                <div key={ci.cartId} className="py-3" style={{borderBottom:'1px solid #F3F4F6'}}>
                  <div className="flex items-center gap-3">
                    <img src={ci.item.photo} alt={ci.item.names[lang]} className="w-12 h-12 rounded-xl object-cover flex-shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-black truncate ${fClass}`} style={{color:'var(--c-text)'}}>{ci.item.names[lang]}</p>
                      <p className="text-[10px]" style={{color:'#9CA3AF'}}>{ci.restaurantName}</p>
                      <p className="text-xs font-bold mt-0.5" style={{color:'#065F46'}}>{ci.totalPerUnit*ci.qty} MAD</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={()=>onQty(ci.cartId,-1)} className="w-7 h-7 rounded-full flex items-center justify-center font-black text-sm" style={{background:'#F3F4F6',color:'#6B7280'}}>−</button>
                      <span className="text-sm font-black w-4 text-center" style={{color:'var(--c-text)'}}>{ci.qty}</span>
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
              <div className="px-5 py-4 flex-shrink-0" style={{borderTop:'1px solid var(--c-border)'}}>
                <div className="flex justify-between items-center mb-4">
                  <span className={`font-black text-sm ${fClass}`} style={{color:'#6B7280'}}>{t.total}</span>
                  <span className="font-black text-xl" style={{color:'#065F46'}}>{total} MAD</span>
                </div>
                <button onClick={()=>setStep('form')}
                  className={`w-full py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-95 ${fClass}`}
                  style={{background:'linear-gradient(135deg,#065F46,#047857)',boxShadow:'0 6px 20px rgba(6,95,70,0.3)'}}>
                  {t.checkout} →
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
                    <p className={`text-[10px] ${fClass}`} style={{color:'#92400E'}}>
                      {lang==='ar'?'ستحصل على رمز استلام بعد الطلب — أعطه للمطعم':
                       lang==='amz'?'ⴰⵏⵓⵎⵔ ⵏ ⵓⵔⵣⵣⵓ ⵉⵍⴰ ⵖ ⵓⵙⵙⵓⵎⵔ · ⴰⴼⴽ ⴰⵙ ⵉ ⵓⵣⵉⴳⵣ':
                       lang==='en'?'A pickup code will appear after ordering — show it to the restaurant':
                       'Un code de retrait s\'affiche après commande — donnez-le au restaurateur'}
                    </p>
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
                  {lang==='ar'?'📍 انقر أو اسحب الدبوس لتحديد عنوانك':lang==='amz'?'📍 ⵙⵜⵜⵉ ⵏⵖ ⵔⴽⵙ ⵜⴰⵙⵓⵏⵜ ⵖ ⵓⵙⴽⴽⵉⵍ':lang==='en'?'📍 Tap or drag the pin to set your address':'📍 Touchez ou glissez le 📍 pour remplir votre adresse'}
                </p>
                <DeliveryMap
                  pin={mapPin}
                  onSet={(coords,inside)=>{
                    const parts=coords.split(',');
                    setMapPin([parseFloat(parts[0]),parseFloat(parts[1])]);
                    setGpsCoords(coords);
                    setOutsideZone(!inside);
                  }}
                  onAddress={(a)=>{setAddr(a);setErr('');}}
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
            <div className="px-5 py-4 flex-shrink-0" style={{borderTop:'1px solid var(--c-border)'}}>
              <button onClick={()=>{
                const needAddr=delivMode==='delivery';
                if(!name.trim()||(needAddr&&!addr.trim())||!phone.trim()){setErr(t.fillAll);return;}
                setErr('');
                // Save coordinates so they're pre-filled next time (works for guests too)
                saveProfile?.({...profile, name:name.trim(), address:addr.trim(), phone:phone.trim()});
                setStep('payment');
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
              <div className="rounded-2xl p-3 mb-5" style={{background:'var(--c-input)',border:'1px solid var(--c-border)'}}>
                {cart.map(i=>(
                  <div key={i.cartId} className="flex justify-between text-xs py-0.5">
                    <span className={`font-bold truncate mr-2 ${fClass}`} style={{color:'var(--c-text)'}}>{i.item.names[lang]} ×{i.qty}</span>
                    <span className="font-black flex-shrink-0" style={{color:'#065F46'}}>{i.totalPerUnit*i.qty} MAD</span>
                  </div>
                ))}
                {/* Frais de livraison */}
                {delivMode==='delivery'&&(
                  <div className="flex justify-between text-xs pt-1 pb-0.5">
                    <span className={`font-bold ${fClass}`} style={{color:'#4F46E5'}}>🛵 {t.deliveryFeeRow}</span>
                    <span className="font-bold" style={{color:'#4F46E5'}}>+{deliveryFeeBase} MAD</span>
                  </div>
                )}
                {/* Click & Collect */}
                {delivMode==='collect'&&(
                  <div className="flex justify-between text-xs pt-1 pb-0.5">
                    <span className={`font-bold ${fClass}`} style={{color:'#B45309'}}>🏪 Click & Collect</span>
                    <span className="font-bold" style={{color:'#B45309'}}>+2.99 MAD</span>
                  </div>
                )}
                {/* Frais de service */}
                {(isServiceFeeForced||serviceFeeEnabled)&&(
                  <div className="flex justify-between text-xs pt-0.5 pb-0.5">
                    <span className={`font-bold ${fClass}`} style={{color:'#7C3AED'}}>⚙️ {t.serviceFeeRow}</span>
                    <span className="font-bold" style={{color:'#7C3AED'}}>+{serviceFeeAmount} MAD</span>
                  </div>
                )}
                {/* Réductions */}
                {totalDiscount>0&&(
                  <div className="flex justify-between text-xs pt-1 pb-0.5">
                    <span className={`font-bold ${fClass}`} style={{color:'#059669'}}>{t.discountRow(totalDiscount)}</span>
                    <span className="font-bold" style={{color:'#059669'}}>-{totalDiscount} MAD</span>
                  </div>
                )}
                <div className="flex justify-between text-sm mt-2 pt-2" style={{borderTop:'1px solid var(--c-border)'}}>
                  <span className={`font-black ${fClass}`} style={{color:'#065F46'}}>{t.total}</span>
                  <span className="font-black" style={{color:'#065F46'}}>{total} MAD</span>
                </div>

                {/* Toggle / badge frais de service */}
                {isServiceFeeForced?(
                  <div className="flex items-center gap-2 mt-3 pt-2 rounded-xl px-3 py-2" style={{borderTop:'1px dashed #E5E1D8',background:'#F5F3FF'}}>
                    <span className="text-base">⚙️</span>
                    <div className="flex-1">
                      <p className={`text-[10px] font-black ${fClass}`} style={{color:'#7C3AED'}}>
                        {lang==='ar'?`رسوم الخدمة إلزامية (أقل من ${serviceFeeThreshold} د.م.)`:lang==='en'?`Service fee required (order under ${serviceFeeThreshold} MAD)`:lang==='amz'?`ⵉⵎⵙⴽⴰⵔⵏ ⵉⵍⴰⵎⵎⴰⵏ (ⴰⴷⴷⴰⴷ ⴷⴰⵜ ${serviceFeeThreshold} MAD)`:`Frais de service obligatoires (commande < ${serviceFeeThreshold} MAD)`}
                      </p>
                      <p className={`text-[9px] mt-0.5 ${fClass}`} style={{color:'#9CA3AF'}}>{t.serviceFeeDesc}</p>
                    </div>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{background:'#7C3AED',color:'white'}}>
                      {lang==='ar'?'إلزامي':lang==='en'?'Required':lang==='amz'?'ⵉⵍⴰⵎⵎⴰⵏ':'Obligatoire'}
                    </span>
                  </div>
                ):(
                  <div className="flex items-center justify-between mt-3 pt-2" style={{borderTop:'1px dashed #E5E1D8'}}>
                    <div className="flex-1 mr-3">
                      <p className={`text-[10px] font-black ${fClass}`} style={{color:'#7C3AED'}}>⚙️ {t.serviceFeeToggle} (+{serviceFeeAmount} MAD)</p>
                      <p className={`text-[9px] mt-0.5 ${fClass}`} style={{color:'#9CA3AF'}}>{t.serviceFeeDesc}</p>
                    </div>
                    <button onClick={()=>setServiceFeeEnabled(v=>!v)}
                      className="flex-shrink-0 rounded-full transition-all duration-300"
                      style={{width:44,height:24,background:serviceFeeEnabled?'#7C3AED':'#E5E1D8',padding:2,position:'relative'}}>
                      <span className="block rounded-full bg-white transition-all duration-300"
                        style={{width:20,height:20,transform:serviceFeeEnabled?'translateX(20px)':'translateX(0)',boxShadow:'0 1px 4px rgba(0,0,0,0.2)'}}/>
                    </button>
                  </div>
                )}
              </div>

              {/* ── Promo Code ── */}
              <div className="rounded-2xl p-4 mb-3" style={{background:'#FFFBEB',border:'1.5px solid #FDE68A'}}>
                <p className={`font-black text-[11px] mb-2 ${fClass}`} style={{color:'#92400E'}}>🎁 {t.promoLabel}</p>
                <div className="flex gap-2">
                  <input
                    value={promoInput} onChange={e=>setPromoInput(e.target.value.toUpperCase())}
                    onKeyDown={e=>e.key==='Enter'&&applyPromo()}
                    placeholder={t.promoPh}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-bold outline-none ${fClass}`}
                    style={{background:'var(--c-card)',border:'1.5px solid #FDE68A',color:'#92400E',direction:isAR?'rtl':'ltr'}}
                  />
                  <button onClick={applyPromo}
                    className="px-4 py-2 rounded-xl font-black text-xs text-white transition-all active:scale-95"
                    style={{background:'#B45309',boxShadow:'0 3px 10px rgba(180,83,9,0.3)'}}>
                    {t.promoApply}
                  </button>
                </div>
                {promoMsg&&<p className={`text-[10px] font-bold mt-1.5 ${fClass}`} style={{color:promoIsErr?'#DC2626':'#059669'}}>{promoMsg}</p>}
              </div>

              {/* ── Diamonds → MAD ── */}
              <div className="rounded-2xl p-4 mb-3" style={{background:'linear-gradient(135deg,#0A1A12,#0D2E1A)',border:'1px solid rgba(74,222,128,0.3)'}}>
                <p className="font-black text-[11px] mb-1" style={{color:'#D9C5A0'}}>
                  {t.diamondsSection}
                </p>
                {gamePts>0?(
                  <>
                    <p className="text-[10px] mb-2" style={{color:'rgba(255,255,255,0.6)'}}>{t.diamondsAvail(gamePts)}</p>
                    {ptsUsed>0?(
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold" style={{color:'#4ADE80'}}>✓ -{ptsUsed} MAD {lang==='ar'?'مطبق':lang==='en'?'applied':'appliqué'}</span>
                        <button onClick={()=>setPtsUsed(0)} className="text-[9px] font-bold px-2 py-1 rounded-lg" style={{background:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.5)'}}>✕</button>
                      </div>
                    ):(
                      <div className="flex gap-2 flex-wrap">
                        {[1,2,5,maxPtsMAD].filter((v,i,a)=>v>0&&a.indexOf(v)===i&&v<=maxPtsMAD).map(mad=>(
                          <button key={mad} onClick={()=>usePts(mad)}
                            className="px-3 py-1 rounded-xl font-black text-[10px] text-white transition-all active:scale-95"
                            style={{background:'rgba(74,222,128,0.2)',border:'1px solid rgba(74,222,128,0.5)',color:'#4ADE80'}}>
                            -{mad} MAD
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ):(
                  <p className="text-[10px]" style={{color:'rgba(255,255,255,0.4)'}}>{t.diamondsNone}</p>
                )}
              </div>

              <SharedPaymentOptions
                lang={lang} amount={total} selected={payMethod}
                onSelect={setPayMethod} showCash={delivMode==='delivery'} showCard
                onWalletPay={handleWalletPay}
              />
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl mt-3" style={{background:'var(--c-input)'}}>
                <span>🔒</span><p className="text-[10px]" style={{color:'#9CA3AF'}}>{t.sslBadge}</p>
              </div>
            </div>
            <div className="px-5 py-4 flex-shrink-0" style={{borderTop:'1px solid var(--c-border)'}}>
              <button
                onClick={()=>{
                  if(!payMethod)return;
                  if(payMethod==='cash'){sendOrderToAPI('cash');sendOrderToDriverApp('cash');handleSuccess();}
                  else if(payMethod==='qr'){sendOrderToAPI('QR Code');setShowQRModal(true);}
                  else{setStep('card');}
                }}
                disabled={!payMethod}
                className={`w-full py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-95 ${fClass}`}
                style={{
                  background:!payMethod?'#E5E1D8':payMethod==='cash'?'#16A34A':payMethod==='qr'?'#065F46':'#4F46E5',
                  boxShadow:payMethod?`0 6px 20px ${payMethod==='cash'?'rgba(22,163,74,0.3)':payMethod==='qr'?'rgba(6,95,70,0.3)':'rgba(79,70,229,0.3)'}`:'none',
                  cursor:payMethod?'pointer':'not-allowed',
                }}>
                {payMethod==='card'?`${t.cardFormTitle} →`:payMethod==='cash'?`✅ ${t.continueBtn}`:payMethod==='qr'?`📲 ${t.qrModalTitle}`:t.continueBtn}
              </button>
            </div>
            {showQRModal&&<QRPayModal lang={lang} amount={total} onClose={()=>setShowQRModal(false)} onConfirm={async()=>{
              setShowQRModal(false);
              try{
                const h=await getAuthHeaders();
                await fetch(`/api/orders/${orderRef}/confirm-payment`,{method:'POST',credentials:'include',headers:{...h,'Content-Type':'application/json'}});
              }catch(_){}
              sendOrderToDriverApp('QR Code');
              handleSuccess();
            }}/>}
          </>
        )}

        {/* CARD FORM */}
        {step==='card'&&(
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4" style={{direction:isAR?'rtl':'ltr'}}>
              {(()=>{
                const ct=detectCard(cardNum);
                const cardBg=ct==='visa'
                  ?'linear-gradient(135deg,#1A1A6E,#003087,#1A478A)'
                  :ct==='mastercard'
                  ?'linear-gradient(135deg,#7B0000,#B71C1C,#C62828)'
                  :'linear-gradient(135deg,#374151,#1F2937)';
                return(
                  <div className="rounded-2xl p-5 mb-5 relative overflow-hidden" style={{background:cardBg,minHeight:120}}>
                    <div className="absolute inset-0 opacity-10" style={{backgroundImage:'repeating-linear-gradient(45deg,white 0,white 1px,transparent 0,transparent 50%)',backgroundSize:'8px 8px'}}/>
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-white/60 text-[10px] font-bold">💳 BRIDGE</p>
                      {ct==='visa'?<VisaLogo/>:ct==='mastercard'?<MastercardLogo/>:<span style={{fontSize:18}}>💳</span>}
                    </div>
                    <p className="text-white font-black text-base tracking-widest mb-3">{cardNum?fmtCard(cardNum):'•••• •••• •••• ••••'}</p>
                    <div className="flex justify-between items-end">
                      <div><p className="text-white/40 text-[9px]">CARDHOLDER</p><p className="text-white text-xs font-bold">{cardName||'—'}</p></div>
                      <div className="text-right"><p className="text-white/40 text-[9px]">EXPIRES</p><p className="text-white text-xs font-bold">{cardExp||'—'}</p></div>
                    </div>
                  </div>
                );
              })()}
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
            <div className="px-5 py-4 flex-shrink-0" style={{borderTop:'1px solid var(--c-border)'}}>
              <div className="flex items-center justify-center gap-2 mb-3">
                <span>🔒</span><p className="text-[10px]" style={{color:'#9CA3AF'}}>{t.sslBadge} · PCI DSS</p>
              </div>
              <button onClick={()=>{
                if(!isValidCardType(cardNum)){setCardErr(t.errCardType);return;}
                if(!isRealCard(cardNum)){setCardErr(t.errLuhn);return;}
                if(!cardCVV||cardCVV.length<3){setCardErr(t.fillAll);return;}
                setCardErr('');
                sendOrderToAPI('card');
                sendOrderToDriverApp('card');
                handleSuccess();
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
            </div>
            {delivMode==='collect'?(
              <div className="w-full rounded-2xl p-4 mb-4" style={{background:'#FEF3C7',border:'2px dashed #F59E0B'}}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{color:'#92400E'}}>
                  🏪 Code de retrait
                </p>
                <p className="text-3xl font-black tracking-[0.25em] mb-2" style={{color:'#B45309'}}>{collectCode}</p>
                <p className="text-[11px] font-semibold" style={{color:'#78350F'}}>
                  Montrez ce code au restaurateur — il prépare votre commande
                </p>
              </div>
            ):(
              <div className="w-full rounded-2xl p-3 mb-4" style={{background:'#F0FDF4',border:'1px solid #BBF7D0'}}>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                  <p className={`text-xs font-bold ${fClass}`} style={{color:'#059669'}}>{t.deliveryEta}</p>
                </div>
              </div>
            )}
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

// Component that pans the map to a new center
function MapPanner({center}:{center:[number,number]}) {
  const map=useMap();
  useEffect(()=>{map.panTo(center,{animate:true,duration:1});},[center,map]);
  return null;
}

// ─── SIMPLE TRACKING PAGE (Tabac / Fleurs / Pharmacie — no GPS map) ──────────
function SimpleTrackingPage({orderRef,lang,onNewOrder}:{orderRef:string;lang:Lang;onNewOrder:()=>void}) {
  const t=T[lang]; const isAR=lang==='ar'; const fClass=fontClass(lang);

  const PREP_SECS = 15*60;   // 15 min once driver accepts
  const ARRIVE_SECS = 10*60; // 10 min once driver is on the way

  const [status,setStatus]=useState('pending');
  const [acceptedAt,setAcceptedAt]=useState<number|null>(null);
  const [onWayAt,setOnWayAt]=useState<number|null>(null);
  const [cd1,setCd1]=useState(PREP_SECS);
  const [cd2,setCd2]=useState(ARRIVE_SECS);
  const prevStatus=useRef('pending');

  // Poll order status every 5 s
  useEffect(()=>{
    if(!orderRef) return;
    const poll=async()=>{
      try{
        const res=await fetch(`/api/orders/status/${orderRef}`,{cache:'no-store'});
        if(res.ok){
          const data=await res.json() as {status:string};
          const s=data.status;
          const prev=prevStatus.current;
          if(prev!==s){
            if((prev==='pending'||prev==='pending_payment')&&(s==='accepted'||s==='preparing')){
              setAcceptedAt(Date.now());
            }
            if(s==='on_the_way'&&prev!=='on_the_way'){
              setOnWayAt(Date.now());
            }
            prevStatus.current=s;
          }
          setStatus(s);
        }
      }catch(_){}
    };
    poll();
    const iv=setInterval(poll,5000);
    return()=>clearInterval(iv);
  },[orderRef]);

  // Countdown 1: preparation (starts on accepted/preparing)
  useEffect(()=>{
    if(!acceptedAt) return;
    const iv=setInterval(()=>{
      const elapsed=Math.floor((Date.now()-acceptedAt)/1000);
      setCd1(Math.max(0,PREP_SECS-elapsed));
    },1000);
    return()=>clearInterval(iv);
  },[acceptedAt]);

  // Countdown 2: arrival (starts on on_the_way)
  useEffect(()=>{
    if(!onWayAt) return;
    const iv=setInterval(()=>{
      const elapsed=Math.floor((Date.now()-onWayAt)/1000);
      setCd2(Math.max(0,ARRIVE_SECS-elapsed));
    },1000);
    return()=>clearInterval(iv);
  },[onWayAt]);

  const fmt=(s:number)=>{const m=Math.floor(s/60);const sec=s%60;return `${m}:${String(sec).padStart(2,'0')}`;};

  // Stage mapping
  const stageIndex=(s:string)=>{
    if(s==='delivered'||s==='completed') return 3;
    if(s==='on_the_way') return 2;
    if(s==='accepted'||s==='preparing'||s==='ready') return 1;
    return 0;
  };
  const stage=stageIndex(status);
  const isDelivered=stage===3;
  const isOnWay=stage>=2;
  const isAccepted=stage>=1;

  const STAGES=[
    {icon:'📋',label:lang==='ar'?'استلمنا طلبك':lang==='amz'?'ⵜⴰⵖⵓⵍⵜ':'Commande reçue',sub:lang==='ar'?'في انتظار التأكيد':lang==='amz'?'ⵔⴰ ⵉⵜⵜⵡⴰⵙⵙⴰⵏ':'En attente de confirmation'},
    {icon:'🛵',label:lang==='ar'?'السائق في الطريق إليك':lang==='amz'?'ⴰⴼⵓⴳⵍⵓ ⴰⵔ ⵉⵎⵛⵛⵉ':lang==='en'?'Driver accepted':'Livreur en route'},
    {icon:'📍',label:lang==='ar'?'السائق قادم':lang==='amz'?'ⴰⴼⵓⴳⵍⵓ ⵉⵇⵇⴰⵏⴼ':lang==='en'?'On the way to you':'En route vers vous',sub:lang==='ar'?'يقترب منك':lang==='amz'?'ⵢⵓⵙⴷ':'Il arrive bientôt'},
    {icon:'✅',label:lang==='ar'?'تم التوصيل':lang==='amz'?'ⵉⵡⵙⵉ':lang==='en'?'Delivered':'Livré !'},
  ];

  return (
    <div className={`px-5 ${isAR?'rtl':''}`}>

      {/* Order ref badge */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{background:'#F0FDF4',border:'1.5px solid #BBF7D0'}}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{background:isDelivered?'#10B981':'#F59E0B'}}/>
          <span className="text-xs font-black" style={{color:'#065F46'}}>{orderRef}</span>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{background:isDelivered?'#D1FAE5':isOnWay?'#DBEAFE':isAccepted?'#FEF3C7':'#F3F4F6',color:isDelivered?'#065F46':isOnWay?'#1E40AF':isAccepted?'#B45309':'#6B7280'}}>
          {isDelivered?'✅ Livré':isOnWay?'📍 En route':isAccepted?'🛵 Acceptée':'⏳ En attente'}
        </span>
      </div>

      {/* Progress steps */}
      <div className="rounded-3xl p-5 mb-5" style={{background:'var(--c-bg)',border:'1.5px solid var(--c-border)',boxShadow:'0 2px 16px rgba(0,0,0,0.06)'}}>
        <div className="relative mb-6">
          <div className="absolute top-5 h-0.5" style={{left:isAR?'auto':'10%',right:isAR?'10%':'auto',width:'80%',background:'var(--c-border)'}}/>
          <div className="absolute top-5 h-0.5 transition-all duration-700"
            style={{left:isAR?'auto':'10%',right:isAR?'10%':'auto',width:`${(stage/3)*80}%`,background:'linear-gradient(to right,#065F46,#10B981)'}}/>
          <div className={`flex justify-between relative ${isAR?'flex-row-reverse':''}`}>
            {STAGES.map((s,i)=>(
              <div key={i} className="flex flex-col items-center" style={{width:'25%'}}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500"
                  style={{
                    background:i<stage?'#10B981':i===stage?'#065F46':'#E5E1D8',
                    border:i===stage?'3px solid #D9C5A0':'3px solid transparent',
                    boxShadow:i===stage?'0 4px 16px rgba(6,95,70,0.35)':'none',
                    transform:i===stage?'scale(1.15)':'scale(1)',
                    zIndex:1,
                  }}>
                  {i<stage?'✓':s.icon}
                </div>
                <p className={`text-[9px] font-black uppercase mt-2 text-center leading-tight ${fClass}`}
                  style={{color:i<=stage?'#065F46':'#9CA3AF'}}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Current stage description */}
        <div className="rounded-2xl p-3 flex items-center gap-3" style={{background:'#F0FDF4',border:'1px solid #BBF7D0'}}>
          <span className="text-2xl">{STAGES[stage]?.icon}</span>
          <div>
            <p className={`text-sm font-black ${fClass}`} style={{color:'#065F46'}}>{STAGES[stage]?.label}</p>
            {STAGES[stage]?.sub&&<p className="text-xs mt-0.5" style={{color:'#6B7280'}}>{STAGES[stage].sub}</p>}
          </div>
        </div>
      </div>

      {/* Countdown 1: preparation — shown when driver accepted, until on_the_way */}
      {isAccepted&&!isOnWay&&!isDelivered&&(
        <div className="rounded-3xl p-5 mb-5 text-center" style={{background:'linear-gradient(135deg,#FEF9EE,#FEF3C7)',border:'1.5px solid #FDE68A',boxShadow:'0 4px 20px rgba(180,83,9,0.1)'}}>
          <p className="text-xs font-black uppercase tracking-wider mb-3" style={{color:'#B45309'}}>
            {lang==='ar'?'⏱️ وقت التحضير':lang==='en'?'⏱️ Preparation time':'⏱️ Temps de préparation'}
          </p>
          <div className="text-5xl font-black tabular-nums" style={{color:'#92400E',letterSpacing:'-1px',fontVariantNumeric:'tabular-nums'}}>
            {fmt(cd1)}
          </div>
          <p className="text-xs mt-2" style={{color:'#B45309'}}>
            {lang==='ar'?'سيصل الليفرور قريباً':lang==='en'?'Driver is heading to you':'Le livreur se prépare et arrive'}
          </p>
        </div>
      )}

      {/* Countdown 2: arrival — shown when on_the_way */}
      {isOnWay&&!isDelivered&&(
        <div className="rounded-3xl p-5 mb-5 text-center" style={{background:'linear-gradient(135deg,#EFF6FF,#DBEAFE)',border:'1.5px solid #93C5FD',boxShadow:'0 4px 20px rgba(30,64,175,0.1)'}}>
          <p className="text-xs font-black uppercase tracking-wider mb-3" style={{color:'#1E40AF'}}>
            {lang==='ar'?'📍 وقت الوصول':lang==='en'?'📍 Arrival time':'📍 Arrivée estimée'}
          </p>
          <div className="text-5xl font-black tabular-nums" style={{color:'#1E3A8A',letterSpacing:'-1px',fontVariantNumeric:'tabular-nums'}}>
            {fmt(cd2)}
          </div>
          <p className="text-xs mt-2" style={{color:'#1E40AF'}}>
            {lang==='ar'?'السائق في طريقه إليك 🛵':lang==='en'?'Driver is on the way 🛵':'Le livreur arrive chez vous 🛵'}
          </p>
        </div>
      )}

      {/* Waiting for driver */}
      {!isAccepted&&!isDelivered&&(
        <div className="rounded-3xl p-5 mb-5 flex items-center gap-4" style={{background:'var(--c-bg)',border:'1.5px solid var(--c-border)'}}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 animate-pulse" style={{background:'#F3F4F6'}}>🛵</div>
          <div>
            <p className={`text-sm font-black ${fClass}`} style={{color:'var(--c-text)'}}>
              {lang==='ar'?'في انتظار قبول الليفرور':lang==='en'?'Waiting for driver':'En attente d\'un livreur…'}
            </p>
            <p className="text-xs mt-1" style={{color:'#9CA3AF'}}>
              {lang==='ar'?'سيتم إعلامك تلقائياً':lang==='en'?'You\'ll be notified automatically':'Vous serez notifié automatiquement'}
            </p>
          </div>
        </div>
      )}

      {/* Delivered state */}
      {isDelivered&&(
        <div className="rounded-3xl p-6 mb-5 text-center" style={{background:'linear-gradient(135deg,#F0FDF4,#DCFCE7)',border:'1.5px solid #86EFAC',boxShadow:'0 4px 20px rgba(5,150,105,0.12)'}}>
          <div className="text-5xl mb-3">✅</div>
          <p className={`text-lg font-black ${fClass}`} style={{color:'#065F46'}}>
            {lang==='ar'?'تم التوصيل بنجاح!':lang==='en'?'Delivered successfully!':'Livraison effectuée !'}
          </p>
          <p className="text-xs mt-1 mb-4" style={{color:'#059669'}}>
            {lang==='ar'?'شكراً لكم':lang==='en'?'Thank you!':'Merci pour votre commande 🙏'}
          </p>
          <button onClick={onNewOrder}
            className="px-6 py-2.5 rounded-2xl font-black text-sm text-white transition-all active:scale-95"
            style={{background:'linear-gradient(135deg,#065F46,#059669)',border:'none',cursor:'pointer'}}>
            {lang==='ar'?'طلب جديد':lang==='en'?'New order':'Nouvelle commande'}
          </button>
        </div>
      )}

      {/* Contact footer */}
      <div className="rounded-2xl p-3 flex items-center gap-3" style={{background:'var(--c-input)',border:'1px solid var(--c-border)'}}>
        <span className="text-lg">📞</span>
        <p className="text-xs" style={{color:'#6B7280'}}>
          {lang==='ar'?'مشكلة؟ اتصل بنا':lang==='en'?'Issue? Call us':'Un problème ? Appelez-nous'}
          {' '}<a href="tel:+212764794856" style={{color:'#065F46',fontWeight:900}}>+212 7 64 79 48 56</a>
        </p>
      </div>
    </div>
  );
}

function TrackingPage({lang,t,orderRef}:{lang:Lang;t:typeof T.fr;orderRef:string}) {
  const [activeStage,setActiveStage]=useState(0);
  const [realPos,setRealPos]=useState<{lat:number;lng:number}|null>(null);
  const [lastSeen,setLastSeen]=useState<number|null>(null);
  const [driverInfo,setDriverInfo]=useState<{name?:string;phone?:string}|null>(null);
  const isAR=lang==='ar'; const fClass=fontClass(lang);
  const displayRef=orderRef||t.orderNum;

  // Poll GPS tracking store + DB status every 3 seconds
  useEffect(()=>{
    if(!orderRef) return;
    const trackStageMap:{[k:string]:number}={received:0,preparing:1,on_way:2,delivered:3};
    const dbStageMap:{[k:string]:number}={
      pending:0,pending_payment:0,
      accepted:1,preparing:1,ready:1,
      on_the_way:2,on_way:2,
      delivered:3,completed:3,
    };
    const poll=async()=>{
      try{
        // Primary: GPS tracking store (real-time driver updates)
        const res=await fetch(`/api/tracking/${orderRef}`,{cache:'no-store'});
        if(res.ok){
          const data=await res.json();
          if(data.found){
            // Only treat as real GPS if coordinates are non-zero (non-zero = actual device GPS)
            // lat=0,lng=0 is the default placeholder set by syncTrackingStatus — not real GPS
            const hasRealGPS = Math.abs(data.lat) > 0.001 || Math.abs(data.lng) > 0.001;
            if(hasRealGPS){
              setRealPos({lat:data.lat,lng:data.lng});
              setLastSeen(data.updatedAt);
            }
            if(data.driverName||data.driverPhone) setDriverInfo(prev=>({...prev,name:data.driverName||prev?.name,phone:data.driverPhone||prev?.phone}));
            if(data.status&&trackStageMap[data.status]!==undefined){
              setActiveStage(prev=>Math.max(prev,trackStageMap[data.status]));
            }
          } else {
            setRealPos(null);
          }
        }
        // Always check DB too — takes priority if driver is ahead of tracking store
        // (e.g. tracking store stuck at 'preparing' but DB already 'on_the_way')
        const dbRes=await fetch(`/api/orders/status/${orderRef}`,{cache:'no-store'});
        if(dbRes.ok){
          const dbData=await dbRes.json();
          if(dbData.status&&dbStageMap[dbData.status]!==undefined){
            setActiveStage(prev=>Math.max(prev,dbStageMap[dbData.status]));
          }
        }
      }catch(_){}
    };
    poll();
    const iv=setInterval(poll,3000);
    return()=>clearInterval(iv);
  },[orderRef]);

  const isLive=realPos&&lastSeen&&(Date.now()-lastSeen<30000); // stale after 30s
  // Static center of Safi when no real GPS yet
  const SAFI_CENTER:[number,number]=[32.2994,-9.2372];
  const courierPos:[number,number]=realPos?[realPos.lat,realPos.lng]:SAFI_CENTER;
  const mapCenter:[number,number]=courierPos;

  // Live courier icon (pulsing green dot)
  const liveIcon=L.divIcon({
    html:`<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#059669,#065F46);border:3px solid #D9C5A0;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 6px rgba(5,150,105,0.25),0 4px 16px rgba(6,95,70,0.5);font-size:18px;animation:pulse 1.5s ease-in-out infinite;">🛵</div>`,
    className:'',iconSize:[36,36],iconAnchor:[18,18],
  });

  // Stale icon (grey)
  const staleIcon=L.divIcon({
    html:`<div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#9CA3AF,#6B7280);border:3px solid #D9C5A0;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.2);font-size:16px;">🛵</div>`,
    className:'',iconSize:[34,34],iconAnchor:[17,17],
  });

  const secsAgo=lastSeen?Math.round((Date.now()-lastSeen)/1000):null;

  return (
    <div className="px-5">
      {/* Order status card */}
      <div className="rounded-3xl p-4 mb-5" style={{background:'var(--c-bg)',border:'1.5px solid var(--c-border)',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
        <div className="flex items-center justify-between mb-1">
          <p className={`text-[10px] font-bold uppercase tracking-wider ${fClass}`} style={{color:'#9CA3AF'}}>{t.orderStatus}</p>
          <span className="text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{background:isLive?'#D1FAE5':'#FEF3C7',color:isLive?'#065F46':'#B45309'}}>
            <span className={`w-1.5 h-1.5 rounded-full ${isLive?'bg-emerald-500 animate-pulse':'bg-yellow-500'} inline-block`}/>
            {isLive?t.trackLive:realPos?'⚠️ Signal faible':'📡 En attente GPS'}
          </span>
        </div>
        <p className={`font-black text-sm ${fClass}`} style={{color:'#065F46'}}>{displayRef}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-base">⏱️</span>
          <p className="text-sm font-bold" style={{color:'var(--c-text)'}}>{t.eta}: <span style={{color:'#065F46'}}>{isLive?'📡 GPS en direct':'En attente du livreur'}</span></p>
        </div>
      </div>

      {/* Stages */}
      <div className="rounded-3xl p-5 mb-5" style={{background:'var(--c-bg)',border:'1.5px solid var(--c-border)',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
        <div className="relative mb-6">
          <div className="absolute top-4 h-0.5" style={{left:isAR?'auto':'12%',right:isAR?'12%':'auto',width:'76%',background:'var(--c-border)'}}/>
          <div className="absolute top-4 h-0.5 transition-all duration-700" style={{left:isAR?'auto':'12%',right:isAR?'12%':'auto',width:`${(activeStage/3)*76}%`,background:'linear-gradient(to right,#065F46,#059669)'}}/>
          <div className={`flex justify-between relative ${isAR?'flex-row-reverse':''}`}>
            {t.stages.map((stage,i)=>(
              <div key={i} className="flex flex-col items-center" style={{width:'25%'}}>
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-all ${i===activeStage?'pulse-active':''}`}
                  style={{background:i<=activeStage?'#065F46':'#E5E1D8',color:i<=activeStage?'white':'#9CA3AF',border:i===activeStage?'3px solid #D9C5A0':'3px solid transparent',boxShadow:i===activeStage?'0 4px 16px rgba(6,95,70,0.35)':'none',zIndex:1}}>
                  {i<activeStage?'✓':['📋','👨‍🍳','🛵','✅'][i]}
                </div>
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
      </div>

      {/* Live GPS Map */}
      <div className="rounded-3xl overflow-hidden mb-4" style={{border:`2px solid ${isLive?'#059669':'#E5E1D8'}`}}>
        {isLive&&(
          <div className="px-3 py-1.5 flex items-center gap-2" style={{background:'#065F46'}}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
            <span className="text-white text-[10px] font-black tracking-wide">GPS EN DIRECT</span>
            {secsAgo!==null&&<span className="text-white/60 text-[9px] ml-auto">il y a {secsAgo}s</span>}
          </div>
        )}
        <div className="h-[512px]">
          <MapContainer center={mapCenter} zoom={16} style={{height:'100%',width:'100%'}} zoomControl attributionControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"/>
            <Marker position={[32.3010,-9.2420]} icon={restaurantIcon}><Popup>🥘 Bridge Safi</Popup></Marker>
            {realPos&&(
              <Marker position={courierPos} icon={isLive?liveIcon:staleIcon}>
                <Popup>🛵 Livreur — position réelle</Popup>
              </Marker>
            )}
            <MapPanner center={mapCenter}/>
          </MapContainer>
        </div>
        <div className="px-4 py-3" style={{background:'var(--c-bg)'}}>
          <div className="flex items-center gap-3">
            {/* Avatar with initials or scooter */}
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-black text-lg"
              style={{background:'linear-gradient(135deg,#065F46,#059669)',border:'2px solid #D9C5A0',color:'#fff',fontSize:driverInfo?.name?18:22}}>
              {driverInfo?.name?driverInfo.name.trim().charAt(0).toUpperCase():'🛵'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-black truncate" style={{color:'var(--c-text)'}}>{driverInfo?.name||t.courierName}</p>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{background:'#FEF9EE',border:'1px solid #FDE68A',color:'#92400E'}}>⭐ 4.9</span>
              </div>
              <p className="text-[10px]" style={{color:isLive?'#059669':'#9CA3AF'}}>
                {isLive?'📡 GPS en direct':realPos?'⚠️ Signal perdu':t.trackZone}
              </p>
              {driverInfo?.phone&&<p className="text-[10px] font-semibold mt-0.5" style={{color:'#6B7280'}}>{driverInfo.phone}</p>}
            </div>
            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {driverInfo?.phone&&(
                <a href={`tel:${driverInfo.phone}`}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
                  style={{background:'#D1FAE5',border:'1.5px solid #6EE7B7',textDecoration:'none'}}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="#065F46"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>
                </a>
              )}
              {driverInfo?.phone&&(
                <a href={`https://wa.me/${driverInfo.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
                  style={{background:'#DCFCE7',border:'1.5px solid #86EFAC',textDecoration:'none'}}>
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#25D366" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path fill="#25D366" d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.124 1.532 5.859L.036 23.671l5.979-1.567A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.374l-.359-.214-3.728.977 1-3.647-.234-.374A9.818 9.818 0 112 12c0-5.422 4.396-9.818 9.818-9.818 5.421 0 9.818 4.396 9.818 9.818 0 5.421-4.397 9.818-9.818 9.818z"/></svg>
                </a>
              )}
              {!driverInfo?.phone&&isLive&&(
                <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{background:'#F0FDF4'}}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                  <span className="text-[10px] font-black" style={{color:'#065F46'}}>EN DIRECT</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GPS status info */}
      {orderRef&&!isLive&&(
        <div className="rounded-2xl p-3 mb-5 flex items-start gap-2" style={{background:'#F0FDF4',border:'1px solid #BBF7D0'}}>
          <span className="text-base flex-shrink-0">📡</span>
          <p className="text-[10px]" style={{color:'#065F46'}}>
            Le livreur recevra automatiquement son lien GPS dans l'application — sa position apparaîtra ici dès qu'il démarre.
          </p>
        </div>
      )}
      <AdSlot />
    </div>
  );
}

// ─── CONTACT PAGE ─────────────────────────────────────────────────────────────

function ContactPage({lang,t}:{lang:Lang;t:typeof T.fr}) {
  const isAR=lang==='ar'; const fClass=fontClass(lang);
  const arrow=(<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2.5" style={{transform:isAR?'scaleX(-1)':'',flexShrink:0}}><path d="M5 12h14M12 5l7 7-7 7"/></svg>);
  return (
    <div className="px-5">
      <div className="rounded-3xl overflow-hidden mb-5 relative" style={{border:'1.5px solid var(--c-border)'}}>
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
      <div className="rounded-2xl p-4 text-center mb-4" style={{background:'var(--c-input)',border:'1px solid var(--c-border)'}}>
        <p className="text-xl mb-1">📍</p>
        <p className={`font-black text-sm ${fClass}`} style={{color:'#065F46'}}>{t.zone}</p>
        <p className={`text-xs mt-1 ${fClass}`} style={{color:'#9CA3AF'}}>{t.plateau}</p>
      </div>
    </div>
  );
}

// ─── BRIDGE PHARMACIE PAGE ────────────────────────────────────────────────────

// ─── PHARMACIE CATALOG ────────────────────────────────────────────────────────

interface MedEntry {id:string;name:string;desc:string;price:number;cat:'douleur'|'digestif'|'rhume'|'peau'|'vitamines'|'yeux';emoji:string;img?:string;}
const PHARMA_CATALOG:MedEntry[]=[
  // ── 💊 Douleur & Fièvre ──
  {id:'doli-500',  name:'Doliprane 500mg',        desc:'Paracétamol 20 cp',         price:11.50, cat:'douleur', emoji:'💊', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Doliprane.jpg/120px-Doliprane.jpg'},
  {id:'doli-1000', name:'Doliprane 1000mg',        desc:'Paracétamol 8 cp',          price:16.50, cat:'douleur', emoji:'💊', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Doliprane.jpg/120px-Doliprane.jpg'},
  {id:'effera',    name:'Efferalgan 500mg',         desc:'Effervescent 16 cp',        price:20.50, cat:'douleur', emoji:'🫧'},
  {id:'dafal',     name:'Dafalgan 1g Effervescent', desc:'Paracétamol fort 8 cp',     price:21.50, cat:'douleur', emoji:'🫧'},
  {id:'aspegic',   name:'Aspégic 500mg',            desc:'Aspirine sachets ×10',      price:16.50, cat:'douleur', emoji:'💊'},
  {id:'advil',     name:'Advil 400mg',              desc:'Ibuprofène 14 cp',          price:26.50, cat:'douleur', emoji:'💊'},
  {id:'nurofen',   name:'Nurofen 200mg',            desc:'Ibuprofène 24 cp',          price:33.50, cat:'douleur', emoji:'💊'},
  {id:'voltarene', name:'Voltarène Gel 1%',         desc:'Anti-inflammatoire 50g',    price:53.50, cat:'douleur', emoji:'🧴'},
  // ── 🤢 Digestif & Estomac ──
  {id:'smecta',    name:'Smecta',                   desc:'Diarrhée sachets ×10',      price:35.50, cat:'digestif', emoji:'🟡'},
  {id:'imodium',   name:'Imodium 2mg',              desc:'Loperamide 12 gel',         price:33.50, cat:'digestif', emoji:'💊', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Imodium.jpg/120px-Imodium.jpg'},
  {id:'maalox',    name:'Maalox Suspension',        desc:'Antiacide 250ml',           price:43.50, cat:'digestif', emoji:'🥛'},
  {id:'gaviscon',  name:'Gaviscon Advance',          desc:'Brûlures 30 cp',            price:53.50, cat:'digestif', emoji:'💊'},
  {id:'lacteol',   name:'Lacteol Fort',             desc:'Probiotique 10 sachets',    price:48.50, cat:'digestif', emoji:'🦠'},
  {id:'charbon',   name:'Charbon Activé',           desc:'Intoxication 20 cp',        price:23.50, cat:'digestif', emoji:'⬛'},
  {id:'duphalac',  name:'Duphalac',                 desc:'Laxatif sirop 200ml',       price:46.50, cat:'digestif', emoji:'🍶'},
  {id:'motilium',  name:'Motilium 10mg',            desc:'Nausées 30 cp',             price:40.50, cat:'digestif', emoji:'💊'},
  // ── 🤧 Rhume, Toux & Gorge ──
  {id:'actifed',   name:'Actifed',                  desc:'Rhume 16 cp',               price:35.50, cat:'rhume', emoji:'🤧'},
  {id:'fervex',    name:'Fervex',                   desc:'Grippe 8 sachets',          price:40.50, cat:'rhume', emoji:'🫗'},
  {id:'rhinathiol',name:'Rhinathiol Sirop',          desc:'Expectorant 250ml',         price:43.50, cat:'rhume', emoji:'🍶'},
  {id:'toplexil',  name:'Toplexil Sirop',           desc:'Toux sèche 250ml',          price:38.50, cat:'rhume', emoji:'🍶'},
  {id:'strepsils', name:'Strepsils Miel-Citron',    desc:'Pastilles gorge ×24',       price:30.50, cat:'rhume', emoji:'🍯'},
  {id:'neocodion', name:'Néo-Codion',               desc:'Toux 30 cp',                price:35.50, cat:'rhume', emoji:'💊'},
  {id:'physiomer', name:'Physiomer Spray',           desc:'Nez bouché 135ml',          price:55.50, cat:'rhume', emoji:'💨'},
  // ── 🩹 Plaies & Peau ──
  {id:'biafine',   name:'Biafine Émulsion',         desc:'Brûlures 93g',              price:55.50, cat:'peau', emoji:'🧴'},
  {id:'bepanthen', name:'Bepanthen Pommade',        desc:'Cicatrisant 100g',          price:65.50, cat:'peau', emoji:'🧴'},
  {id:'betadine',  name:'Bétadine Solution',        desc:'Antiseptique 125ml',        price:38.50, cat:'peau', emoji:'🟤', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Betadine.jpg/120px-Betadine.jpg'},
  {id:'flammazine',name:'Flammazine Crème',         desc:'Brûlures graves 50g',       price:72.50, cat:'peau', emoji:'🧴'},
  {id:'cicatryl',  name:'Cicatryl Pommade',         desc:'Cicatrisant 50g',           price:45.50, cat:'peau', emoji:'🧴'},
  {id:'eau-oxy',   name:'Eau Oxygénée 10vol',       desc:'Antiseptique 250ml',        price:10.50, cat:'peau', emoji:'🫧'},
  {id:'mercuro',   name:'Éosine Aqueuse',           desc:'Désinfectant 2× 2ml',       price:13.50, cat:'peau', emoji:'🔴'},
  // ── 💊 Vitamines & Compléments ──
  {id:'vitc',      name:'Vitamine C 1000mg',        desc:'Effervescent ×20',          price:30.50, cat:'vitamines', emoji:'🍊'},
  {id:'supradyn',  name:'Supradyn',                 desc:'Multivitamines 30 cp',      price:65.50, cat:'vitamines', emoji:'💛'},
  {id:'magne-b6',  name:'Magné B6',                desc:'Magnésium 60 cp',           price:53.50, cat:'vitamines', emoji:'💊'},
  {id:'becozyme',  name:'Becozyme C Forte',         desc:'Vitamines B+C 30 cp',       price:43.50, cat:'vitamines', emoji:'💊'},
  {id:'vitd3',     name:'Vitamine D3 1000UI',       desc:'Gouttes 10ml',              price:42.50, cat:'vitamines', emoji:'☀️'},
  {id:'zinc',      name:'Zinc 15mg',                desc:'Immunité 30 cp',            price:32.50, cat:'vitamines', emoji:'💊'},
  // ── 👁️ Yeux & Nez ──
  {id:'rhinomer',  name:'Rhinomer Spray',           desc:'Lavage nasal 135ml',        price:46.50, cat:'yeux', emoji:'👃'},
  {id:'visine',    name:'Visine Yeux Rouges',       desc:'Collyre 15ml',              price:35.50, cat:'yeux', emoji:'👁️'},
  {id:'collyre-b', name:'Collyre Bleu',             desc:'Décongestionnant 10ml',     price:25.50, cat:'yeux', emoji:'🔵'},
  {id:'artelac',   name:'Artelac Gouttes',          desc:'Larmes artificielles 10ml', price:52.50, cat:'yeux', emoji:'💧'},
];

function MedItem({med,qty,isNight,nightSurcharge,effectivePrice,onAdd,onRem}:{med:MedEntry;qty:number;isNight:boolean;nightSurcharge:number;effectivePrice:number;onAdd:()=>void;onRem:()=>void}) {
  const [imgOk,setImgOk]=useState(!!med.img);
  return(
    <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
      style={{background:qty>0?'rgba(99,102,241,0.18)':'rgba(255,255,255,0.04)',border:`1.5px solid ${qty>0?'rgba(99,102,241,0.5)':'rgba(165,180,252,0.15)'}`,transition:'all 0.15s'}}>
      <div style={{width:40,height:52,borderRadius:8,flexShrink:0,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,0.35)'}}>
        {med.img&&imgOk?(
          <img src={med.img} alt={med.name} onError={()=>setImgOk(false)} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
        ):(
          <div style={{width:'100%',height:'100%',background:'rgba(99,102,241,0.25)',border:'1px solid rgba(165,180,252,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>
            {med.emoji}
          </div>
        )}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <p className="font-black text-[12px] truncate" style={{color:'#E0E7FF'}}>{med.name}</p>
        <p className="text-[10px]" style={{color:'rgba(165,180,252,0.55)'}}>{med.desc}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px] font-black" style={{color:'#A5B4FC'}}>{effectivePrice} DH</span>
          {isNight&&<span style={{background:'rgba(251,191,36,0.15)',border:'1px solid rgba(251,191,36,0.4)',borderRadius:4,padding:'0 4px',fontSize:9,color:'#F59E0B',fontWeight:700}}>🌙 +{nightSurcharge}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {qty>0&&(
          <>
            <button onClick={onRem} style={{width:28,height:28,borderRadius:'50%',border:'none',background:'rgba(99,102,241,0.25)',color:'#A5B4FC',fontWeight:900,fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
            <span className="font-black text-sm w-5 text-center" style={{color:'#fff'}}>{qty}</span>
          </>
        )}
        <button onClick={onAdd} style={{width:28,height:28,borderRadius:'50%',border:'none',background:'#6366F1',color:'white',fontWeight:900,fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
      </div>
    </div>
  );
}

function PharmaciePage({onBack,lang,cycleLang,profile,saveProfile,onOrderSuccess}:{onBack:()=>void;lang:Lang;cycleLang:()=>void;profile:UserProfile;saveProfile:(p:UserProfile)=>void;onOrderSuccess?:(ref:string)=>void}) {
  const fClass=fontClass(lang); const isAR=lang==='ar';
  const [,navigatePharm]=useLocation();

  // ── Night ──
  const nowH=new Date().getHours();
  const isNight=nowH>=22||nowH<6;
  const NIGHT_SURCHARGE=10; // DH par médicament la nuit
  const DELIV_FEE_PHARM=(isNight?18:12);
  const SVC_FEE_PHARM=6.5;

  // ── State ──
  const [pharmCart,setPharmCart]=useState<{id:string;qty:number}[]>([]);
  const [pharmCat,setPharmCat]=useState<MedEntry['cat']>('douleur');
  const [pharmSearch,setPharmSearch]=useState('');
  const [delivMode,setDelivMode]=useState<'delivery'|'collect'>('delivery');
  const [name,setName]=useState(profile.name??'');
  const [addr,setAddr]=useState(profile.address??'');
  const [phone,setPhone]=useState(profile.phone??'');
  const [err,setErr]=useState('');
  const [sending,setSending]=useState(false);
  const [sent,setSent]=useState(false);
  const [orderRef]=useState(()=>`PH-${Math.floor(1000+Math.random()*9000)}`);
  const [payMethod,setPayMethod]=useState<PayMethodType>(null);
  const [showQR,setShowQR]=useState(false);
  const {user:pharmUser}=useUser();
  const getAuthHeadersPharm=useAuthHeaders();
  const [pharmGems,setPharmGems]=useState(0);
  const [pharmGemMAD,setPharmGemMAD]=useState(0);
  const maxPharmGemMAD=Math.floor(pharmGems/200);

  useEffect(()=>{
    if(!pharmUser?.id) return;
    getAuthHeadersPharm().then(h=>fetch('/api/game/diamonds',{credentials:'include',headers:h})
      .then(r=>r.ok?r.json():null)
      .then(d=>{if(d&&typeof d.diamonds==='number')setPharmGems(d.diamonds);})
      .catch(()=>{}));
  },[pharmUser?.id,getAuthHeadersPharm]);

  // ── Cart helpers ──
  const addMed=(id:string)=>setPharmCart(c=>{const ex=c.find(x=>x.id===id);return ex?c.map(x=>x.id===id?{...x,qty:x.qty+1}:x):[...c,{id,qty:1}];});
  const remMed=(id:string)=>setPharmCart(c=>{const ex=c.find(x=>x.id===id);if(!ex)return c;if(ex.qty===1)return c.filter(x=>x.id!==id);return c.map(x=>x.id===id?{...x,qty:x.qty-1}:x);});
  const medQty=(id:string)=>pharmCart.find(x=>x.id===id)?.qty??0;
  const medPrice=(m:MedEntry)=>m.price+(isNight?NIGHT_SURCHARGE:0);
  const cartSubtotal=pharmCart.reduce((s,ci)=>{const m=PHARMA_CATALOG.find(f=>f.id===ci.id);return s+(m?medPrice(m)*ci.qty:0);},0);
  const cartTotal=cartSubtotal+DELIV_FEE_PHARM+SVC_FEE_PHARM-pharmGemMAD;
  const cartCount=pharmCart.reduce((s,ci)=>s+ci.qty,0);

  const visibleMeds=PHARMA_CATALOG.filter(m=>
    m.cat===pharmCat&&(pharmSearch===''||m.name.toLowerCase().includes(pharmSearch.toLowerCase()))
  );

  const catTabs:{key:MedEntry['cat'];label:string;emoji:string}[]=[
    {key:'douleur',   label:lang==='ar'?'ألم':lang==='en'?'Pain':'Douleur',     emoji:'💊'},
    {key:'digestif',  label:lang==='ar'?'هضم':lang==='en'?'Digestive':'Digestif', emoji:'🤢'},
    {key:'rhume',     label:lang==='ar'?'زكام':lang==='en'?'Cold':'Rhume',       emoji:'🤧'},
    {key:'peau',      label:lang==='ar'?'جلد':lang==='en'?'Skin':'Peau',         emoji:'🩹'},
    {key:'vitamines', label:lang==='ar'?'فيتامين':lang==='en'?'Vitamins':'Vitamines', emoji:'💛'},
    {key:'yeux',      label:lang==='ar'?'عيون':lang==='en'?'Eyes':'Yeux',        emoji:'👁️'},
  ];

  const inputCls=`w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all ${fClass}`;
  const inputStyle=(hasErr:boolean):React.CSSProperties=>({background:'rgba(255,255,255,0.07)',border:`1.5px solid ${hasErr?'#EF4444':'rgba(165,180,252,0.2)'}`,color:'#fff'});

  const handleWalletPay=async(type:'apple'|'google')=>{
    if(!name.trim()||!phone.trim()||(delivMode==='delivery'&&!addr.trim())){setErr('*');return;}
    const payLabel=type==='apple'?'Apple Pay':'Google Pay';
    const methods=type==='apple'
      ?[{supportedMethods:'https://apple.com/apple-pay',data:{version:3,merchantIdentifier:'merchant.ma.safi-bridge',merchantCapabilities:['supports3DS'],supportedNetworks:['visa','masterCard'],countryCode:'MA'}}]
      :[{supportedMethods:'https://google.com/pay',data:{apiVersion:2,apiVersionMinor:0,merchantInfo:{merchantName:'Bridge Safi'},allowedPaymentMethods:[{type:'CARD',parameters:{allowedAuthMethods:['PAN_ONLY','CRYPTOGRAM_3DS'],allowedCardNetworks:['MASTERCARD','VISA']},tokenizationSpecification:{type:'PAYMENT_GATEWAY',parameters:{gateway:'example',gatewayMerchantId:'bridge-safi'}}}]}}];
    const details={total:{label:'Bridge Pharmacie · Safi',amount:{currency:'MAD',value:String(cartTotal)}}};
    try{
      if(typeof PaymentRequest==='undefined') throw new Error('unsupported');
      const pr=new PaymentRequest(methods,details);
      const canMake=await pr.canMakePayment().catch(()=>false);
      if(!canMake) throw new Error('unavailable');
      const response=await pr.show();
      await response.complete('success');
      setPayMethod(type);
      await handleSend(payLabel);
    }catch{setPayMethod('cash');}
  };

  const handleSend=async(payLabel?:string)=>{
    if(!name.trim()||!phone.trim()||(delivMode==='delivery'&&!addr.trim())){setErr('*');return;}
    setSending(true);
    const deliveryAddress=delivMode==='delivery'?`${addr.trim()}, Safi, Maroc`:'Pharmacie Bridge Safi — Retrait sur place';
    const driverTrackUrl=`${window.location.origin}/driver/${orderRef}`;
    const payInfo=payLabel?payLabel:payMethod==='qr'?'QR Code':payMethod==='cash'?'Espèces':payMethod==='apple'?'Apple Pay':payMethod==='google'?'Google Pay':'Espèces';
    const itemsList=pharmCart.map(ci=>{const m=PHARMA_CATALOG.find(f=>f.id===ci.id)!;const ep=medPrice(m);return `${m.name} ×${ci.qty} (${ep*ci.qty} DH${isNight?' 🌙':''})`;}).join('\n');
    const notesStr=`💊 Bridge Pharmacie${isNight?' 🌙 NUIT':''}\n${itemsList||'Commande générale'}\n—\nSous-total: ${cartSubtotal} DH\nLivraison: ${DELIV_FEE_PHARM} DH${isNight?' (tarif nuit)':''}\nService: ${SVC_FEE_PHARM} DH\nTotal: ${cartTotal} DH\n💳 ${payInfo}\n👤 ${name.trim()} — ${phone.trim()}`;
    const apiItems=pharmCart.length>0
      ?pharmCart.map(ci=>{const m=PHARMA_CATALOG.find(f=>f.id===ci.id)!;return {name:m.name,qty:ci.qty,price:medPrice(m)};})
      :[{name:'💊 Commande Bridge Pharmacie',qty:1,price:0}];
    try{
      await fetch('/api/orders/inbound',{method:'POST',headers:{'Content-Type':'application/json','x-bridge-secret':'bridge-safi-8b269bba03fd8c0205116f3f'},
        body:JSON.stringify({customerName:name.trim(),customerPhone:phone.trim(),deliveryAddress,pickupAddress:'Bridge Pharmacie — Safi',items:apiItems,total:cartTotal,source:'Bridge Pharmacie',paymentMethod:payInfo}),
      }).catch(()=>{});
      await fetch(`${DRIVER_APP_URL}/api/deliveries`,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({trackingNumber:orderRef,customerName:name.trim(),customerPhone:phone.trim(),pickupAddress:'Pharmacie Bridge Safi',deliveryAddress,priority:'normal',notes:notesStr,driverTrackUrl}),
      }).catch(()=>{});
    }finally{setSending(false);}
    if(pharmGemMAD>0){getAuthHeadersPharm().then(h=>fetch('/api/game/diamonds/spend',{method:'POST',credentials:'include',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify({spend:pharmGemMAD*200})}).then(r=>r.ok?r.json():null).then(d=>{if(d&&typeof d.diamonds==='number'){const ck=`bridge_diamonds_cache_${pharmUser?.id||'anon'}`;try{localStorage.setItem(ck,String(d.diamonds));}catch{}window.dispatchEvent(new StorageEvent('storage',{key:ck,newValue:String(d.diamonds)}));}}).catch(()=>{}));}
    await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ref:orderRef,service:'pharmacie',customerName:name.trim(),customerPhone:phone.trim(),customerAddress:deliveryAddress,items:apiItems,total:cartTotal,deliveryMode:delivMode,paymentMethod:payInfo,restaurantName:'Bridge Pharmacie'}),
    }).catch(()=>{});
    localStorage.setItem('bridge_last_ref',orderRef);
    try{const raw=localStorage.getItem('bridge_history');const arr=raw?JSON.parse(raw):[];arr.unshift({ref:orderRef,type:'pharmacie',date:new Date().toISOString(),total:cartTotal,address:deliveryAddress,name:name.trim()});if(arr.length>100)arr.splice(100);localStorage.setItem('bridge_history',JSON.stringify(arr));}catch{}
    setSent(true);
    onOrderSuccess?.(orderRef);
  };

  return(
    <div className={`min-h-screen flex flex-col ${isAR?'rtl':'ltr'}`}
      dir={isAR?'rtl':'ltr'}
      style={{background:'linear-gradient(160deg,#060818 0%,#0C0E2B 40%,#1E1B4B 70%,#0F172A 100%)',color:'#fff',minHeight:'100dvh'}}>

      {/* Header */}
      <div style={{position:'fixed',top:16,left:isAR?'auto':16,right:isAR?16:'auto',zIndex:50}}>
        <button onClick={onBack} style={{width:38,height:38,borderRadius:'50%',border:'none',cursor:'pointer',background:'rgba(165,180,252,0.12)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:18}}>←</button>
      </div>
      <div style={{position:'fixed',top:16,right:isAR?'auto':16,left:isAR?16:'auto',zIndex:50,display:'flex',alignItems:'center',gap:8}}>
        <button onClick={cycleLang} style={{width:38,height:38,borderRadius:'50%',border:'none',cursor:'pointer',background:'rgba(165,180,252,0.18)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',color:'#A5B4FC',fontSize:11,fontWeight:900}}>{LANG_LABELS[lang]}</button>
        <SharkDiamondWidget onNavigate={()=>navigatePharm('/game')} profile={profile}/>
      </div>

      {/* Content */}
      <div className={`flex flex-col items-center px-5 pt-20 pb-12 max-w-2xl mx-auto w-full gap-4 ${fClass}`}>

        {/* Title */}
        <div className="text-center">
          <h1 className={`font-black text-xl tracking-wider mb-0.5 ${fClass}`} style={{color:'#A5B4FC'}}>BRIDGE PHARMACIE</h1>
          <p className="text-[10px] tracking-widest font-bold" style={{color:'rgba(165,180,252,0.6)'}}>SAFI · MAROC · آسفي · ⵙⴰⴼⵉ</p>
          {isNight&&<div style={{display:'inline-flex',alignItems:'center',gap:5,background:'rgba(99,102,241,0.2)',border:'1px solid rgba(165,180,252,0.35)',borderRadius:50,padding:'3px 12px',marginTop:6}}>
            <span style={{fontSize:12}}>🌙</span>
            <span style={{color:'#C7D2FE',fontSize:10,fontWeight:900,letterSpacing:'0.12em'}}>TARIF NUIT +{NIGHT_SURCHARGE} DH/méd.</span>
          </div>}
        </div>

        {/* ── Catalogue ── */}
        {!sent&&(
          <div className="w-full">
            {/* Search */}
            <input value={pharmSearch} onChange={e=>setPharmSearch(e.target.value)}
              placeholder={lang==='ar'?'بحث دواء…':lang==='en'?'Search medication…':'Rechercher un médicament…'}
              className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none mb-3 ${fClass}`}
              style={{background:'rgba(165,180,252,0.1)',border:'1.5px solid rgba(165,180,252,0.2)',color:'#fff'}}/>

            {/* Category tabs — horizontal scroll */}
            <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1" style={{scrollbarWidth:'none'}}>
              {catTabs.map(tab=>(
                <button key={tab.key} onClick={()=>{setPharmCat(tab.key);setPharmSearch('');}}
                  className="flex-shrink-0 py-2 px-3 rounded-xl font-black text-[10px] transition-all active:scale-95"
                  style={{background:pharmCat===tab.key?'#6366F1':'rgba(165,180,252,0.1)',color:pharmCat===tab.key?'white':'rgba(165,180,252,0.6)',border:`1.5px solid ${pharmCat===tab.key?'#6366F1':'rgba(165,180,252,0.2)'}`,letterSpacing:'0.04em',whiteSpace:'nowrap'}}>
                  {tab.emoji} {tab.label}
                </button>
              ))}
            </div>

            {/* Items list */}
            <div className="flex flex-col gap-2">
              {visibleMeds.map(med=>(
                <MedItem key={med.id} med={med} qty={medQty(med.id)} isNight={isNight} nightSurcharge={NIGHT_SURCHARGE} effectivePrice={medPrice(med)} onAdd={()=>addMed(med.id)} onRem={()=>remMed(med.id)}/>
              ))}
            </div>

            {/* Cart mini summary */}
            {cartCount>0&&(
              <div className="mt-3 rounded-2xl p-3" style={{background:'rgba(99,102,241,0.15)',border:'1.5px solid rgba(99,102,241,0.4)'}}>
                <p className="font-black text-[11px] mb-1.5" style={{color:'#A5B4FC'}}>🛒 {cartCount} {lang==='ar'?'منتج':lang==='en'?'item(s)':'produit(s)'} sélectionné(s)</p>
                {pharmCart.map(ci=>{const m=PHARMA_CATALOG.find(f=>f.id===ci.id)!;const ep=medPrice(m);return(
                  <div key={ci.id} className="flex justify-between text-[11px]" style={{color:'rgba(165,180,252,0.7)'}}>
                    <span>{m.name} ×{ci.qty}</span><span className="font-bold">{ep*ci.qty} DH</span>
                  </div>
                );})}
              </div>
            )}
          </div>
        )}

        {/* Mode selector */}
        {!sent&&(
          <div className="flex gap-2 w-full">
            {([
              {key:'delivery'as const,label:lang==='ar'?'توصيل':lang==='en'?'Delivery':'Livraison',desc:lang==='ar'?'إلى بابك':lang==='en'?'To your door':'À votre porte',color:'#6366F1'},
              {key:'collect'as const,label:lang==='ar'?'استلام':lang==='en'?'Collect':'Retrait',desc:lang==='ar'?'من الصيدلية':lang==='en'?'From pharmacy':'De la pharmacie',color:'#8B5CF6'},
            ]).map(opt=>{
              const sel=delivMode===opt.key;
              return(
                <button key={opt.key} onClick={()=>{setDelivMode(opt.key);setErr('');}}
                  className="flex-1 rounded-2xl p-3 text-left transition-all duration-200 active:scale-95"
                  style={{background:sel?'rgba(99,102,241,0.2)':'rgba(255,255,255,0.04)',border:`2px solid ${sel?opt.color:'rgba(165,180,252,0.15)'}`}}>
                  <p className={`font-black text-[11px] leading-tight ${fClass}`} style={{color:opt.color}}>{opt.label}</p>
                  <p className={`text-[9px] mt-0.5 ${fClass}`} style={{color:'rgba(165,180,252,0.4)'}}>{opt.desc}</p>
                  {sel&&<div className="mt-1.5 w-3 h-3 rounded-full flex items-center justify-center" style={{background:opt.color}}>
                    <svg width="7" height="7" viewBox="0 0 10 10" fill="white"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>
                  </div>}
                </button>
              );
            })}
          </div>
        )}

        {/* Form */}
        {!sent&&(
          <div className="w-full flex flex-col gap-3">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${fClass}`} style={{color:'#A5B4FC'}}>👤 {lang==='ar'?'الاسم':lang==='en'?'Name':'Nom'}</p>
              <input className={inputCls} style={inputStyle(!!err&&!name.trim())} placeholder={lang==='ar'?'اسمك الكامل…':lang==='en'?'Your name…':'Votre nom…'} value={name} onChange={e=>{setName(e.target.value);setErr('');}}/>
            </div>
            {delivMode==='delivery'&&(
              <AddressAutocomplete label={`📍 ${lang==='ar'?'العنوان':lang==='en'?'Address':'Adresse'}`} value={addr} onChange={v=>{setAddr(v);setErr('');}}
                placeholder={lang==='ar'?'عنوان التوصيل…':lang==='en'?'Delivery address…':'Adresse de livraison…'} lang={lang} error={!!err&&!addr.trim()}/>
            )}
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${fClass}`} style={{color:'#A5B4FC'}}>📞 {lang==='ar'?'الهاتف':lang==='en'?'Phone':'Téléphone'}</p>
              <input className={inputCls} style={inputStyle(!!err&&!phone.trim())} placeholder="06XXXXXXXX" value={phone} type="tel" onChange={e=>{setPhone(e.target.value);setErr('');}}/>
            </div>
            {err&&<p className={`text-xs font-bold ${fClass}`} style={{color:'#EF4444'}}>⚠️ {lang==='ar'?'يرجى ملء جميع الحقول':lang==='en'?'Please fill all fields':'Veuillez remplir tous les champs'}</p>}
          </div>
        )}

        {/* Success */}
        {sent&&(
          <div className="rounded-3xl p-6 text-center w-full" style={{background:'rgba(99,102,241,0.15)',border:'2px solid rgba(99,102,241,0.5)',boxShadow:'0 8px 32px rgba(99,102,241,0.25)'}}>
            <div className="text-5xl mb-3">✅</div>
            <p className={`font-black text-base mb-1 ${fClass}`} style={{color:'#A5B4FC'}}>
              {lang==='ar'?'تم إرسال طلبك!':lang==='en'?'Order placed!':'Commande envoyée !'}
            </p>
            <p className="text-2xl font-black tracking-[0.25em] my-2" style={{color:'#818CF8'}}>{orderRef}</p>
            <p className={`text-[11px] mb-4 ${fClass}`} style={{color:'rgba(165,180,252,0.6)'}}>
              {lang==='ar'?'سيتصل بك الليبرور قريباً':lang==='en'?'Driver will contact you soon':'Le livreur vous contactera bientôt'}
            </p>
          </div>
        )}

        {/* Order summary */}
        {!sent&&cartCount>0&&(
          <div className="w-full rounded-2xl p-4" style={{background:'rgba(255,255,255,0.04)',border:'1.5px solid rgba(165,180,252,0.15)'}}>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${fClass}`} style={{color:'#A5B4FC'}}>🧾 {lang==='ar'?'الفاتورة':lang==='en'?'Summary':'Récapitulatif'}</p>
            {cartSubtotal>0&&<div className="flex justify-between text-[12px] mb-1.5"><span style={{color:'rgba(165,180,252,0.5)'}}>{lang==='ar'?'المجموع':lang==='en'?'Subtotal':'Sous-total'}</span><span className="font-bold" style={{color:'#E0E7FF'}}>{cartSubtotal} DH</span></div>}
            {delivMode==='delivery'&&<div className="flex justify-between text-[12px] mb-1.5"><span style={{color:'rgba(165,180,252,0.5)'}}>🛵 {lang==='ar'?'توصيل':lang==='en'?'Delivery':'Livraison'}{isNight&&<span style={{color:'#F59E0B',fontWeight:700}}> 🌙</span>}</span><span className="font-bold" style={{color:'#A5B4FC'}}>{DELIV_FEE_PHARM} DH</span></div>}
            <div className="flex justify-between text-[12px] mb-2"><span style={{color:'rgba(165,180,252,0.5)'}}>⚙️ {lang==='ar'?'رسوم الخدمة':lang==='en'?'Service fee':'Frais de service'}</span><span className="font-bold" style={{color:'#A5B4FC'}}>{SVC_FEE_PHARM} DH</span></div>
            {pharmGemMAD>0&&<div className="flex justify-between text-[12px] mb-2"><span style={{color:'#4ADE80'}}>💎 Réduction</span><span className="font-bold" style={{color:'#4ADE80'}}>-{pharmGemMAD} DH</span></div>}
            <div className="flex justify-between items-center pt-2" style={{borderTop:'1.5px solid rgba(165,180,252,0.15)'}}><span className="font-black text-sm" style={{color:'#E0E7FF'}}>TOTAL</span><span className="font-black text-lg" style={{color:'#818CF8'}}>{cartTotal} DH</span></div>
          </div>
        )}

        {/* 💎 Diamonds */}
        {!sent&&(
          <div className={`w-full rounded-2xl p-4 ${fClass}`} style={{background:'linear-gradient(135deg,#0A1A12,#0D2E1A)',border:'1px solid rgba(74,222,128,0.3)'}}>
            <p className="text-[11px] font-black mb-1.5" style={{color:'#D9C5A0'}}>💎 {lang==='ar'?'خصم بالماسات':lang==='en'?'Diamond discount':'Réduction Diamants'}</p>
            {pharmGems>0?(
              <>
                <p className="text-[10px] mb-2" style={{color:'rgba(255,255,255,0.6)',fontWeight:600}}>{pharmGems.toLocaleString()} 💎 = {maxPharmGemMAD} MAD</p>
                {pharmGemMAD>0?(
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold" style={{color:'#4ADE80'}}>✓ -{pharmGemMAD} MAD appliqué</span>
                    <button onClick={()=>setPharmGemMAD(0)} className="text-[9px] font-bold px-2 py-1 rounded-lg" style={{background:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.5)',border:'none',cursor:'pointer'}}>✕</button>
                  </div>
                ):(
                  <div className="flex gap-2 flex-wrap">
                    {[1,2,5,maxPharmGemMAD].filter((v,i,a)=>v>0&&a.indexOf(v)===i&&v<=maxPharmGemMAD).map(mad=>(
                      <button key={mad} onClick={()=>setPharmGemMAD(mad)} className="px-3 py-1 rounded-xl font-black text-[10px] active:scale-95 transition-all"
                        style={{background:'rgba(74,222,128,0.2)',border:'1px solid rgba(74,222,128,0.5)',color:'#4ADE80',cursor:'pointer'}}>
                        -{mad} MAD
                      </button>
                    ))}
                  </div>
                )}
              </>
            ):(
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px]" style={{color:'rgba(255,255,255,0.4)'}}>{lang==='ar'?'لا ماسات — العب لتربح!':lang==='en'?'No diamonds — play to earn!':'Pas de diamants — jouez !'}</p>
                <button onClick={()=>navigatePharm('/game')} className="text-[9px] font-black px-2.5 py-1 rounded-xl" style={{background:'rgba(74,222,128,0.2)',border:'1px solid rgba(74,222,128,0.4)',color:'#4ADE80',cursor:'pointer',flexShrink:0}}>🎮 Game</button>
              </div>
            )}
          </div>
        )}

        {/* Payment */}
        {!sent&&(
          <div className="w-full rounded-2xl p-4" style={{background:'rgba(255,255,255,0.04)',border:'1.5px solid rgba(165,180,252,0.15)'}}>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${fClass}`} style={{color:'#A5B4FC'}}>💳 {lang==='ar'?'طريقة الدفع':lang==='en'?'Payment':'Mode de paiement'}</p>
            <SharedPaymentOptions lang={lang} selected={payMethod} onSelect={setPayMethod} showCash showCard={false} onWalletPay={handleWalletPay}/>
          </div>
        )}

        {/* Send button */}
        {!sent&&(
          <button onClick={()=>{if(payMethod==='qr'){handleSend().then(()=>setShowQR(true));}else handleSend();}}
            disabled={sending}
            className={`w-full py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 active:scale-95 transition-all ${fClass}`}
            style={{background:sending?'#9CA3AF':'#6366F1',boxShadow:sending?'none':'0 6px 20px rgba(99,102,241,0.4)',cursor:sending?'not-allowed':'pointer'}}>
            {sending?(
              <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"/>{lang==='ar'?'جارٍ الإرسال…':lang==='en'?'Sending…':'Envoi en cours…'}</>
            ):(
              <><span>🛵</span>{lang==='ar'?'تأكيد الطلب':lang==='en'?'Place order':'Commander'}</>
            )}
          </button>
        )}
        {showQR&&<QRPayModal lang={lang} onClose={()=>setShowQR(false)} onConfirm={()=>setShowQR(false)}/>}
      </div>
    </div>
  );
}

// ─── SERVICE SELECT PAGE ──────────────────────────────────────────────────────

function ServiceSelectPage({onSelect,onBack,lang,cycleLang,profile,saveProfile}:{onSelect:(s:'delivery'|'taxi'|'tabac'|'fleurs'|'pharmacie')=>void;onBack:()=>void;lang:Lang;cycleLang:()=>void;profile:UserProfile;saveProfile:(p:UserProfile)=>void}) {
  const [pressed,setPressed]=useState<'delivery'|'taxi'|'tabac'|'fleurs'|'pharmacie'|null>(null);
  const [showProfile,setShowProfile]=useState(false);
  const [,navigate]=useLocation();
  const { user } = useUser(); const { isSignedIn } = useAuth();
  const getAuthHeaders=useAuthHeaders();
  const t=T[lang]; const fClass=fontClass(lang); const isAR=lang==='ar';
  const LANG_LABELS:Record<Lang,string>={fr:'FR',en:'EN',ar:'AR',amz:'ⴰⵎⵣ'};
  const choose=(s:'delivery'|'taxi'|'tabac'|'fleurs'|'pharmacie')=>{setPressed(s);setTimeout(()=>onSelect(s),320);};
  // Avatar: custom upload > Clerk photo > initials
  const avatarSrc=profile.avatar||user?.imageUrl||null;
  const initials=(profile.name||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  // Diamonds fetch
const [diamonds, setDiamonds] = useState(0);
useEffect(()=>{
  const phone = profile?.phone;
  if(!phone) return;
  fetch(`https://workspaceapi-server-production-12a5.up.railway.app/api/diamonds?phone=${encodeURIComponent(phone)}`,{
    headers:{'x-api-key':'bridge-safi-2026'}
  })
    .then(r=>r.ok?r.json():null)
    .then(d=>{if(d&&d.found)setDiamonds(d.diamonds??0)})
    .catch(()=>{});
},[profile?.phone]);
 

  return(
    <div className={`fixed inset-0 flex flex-col z-40 ${isAR?'rtl':'ltr'}`}
      style={{background:'#07090E',overflowY:'auto'}}>
      <style>{`
        @keyframes svcFloat{0%,100%{transform:translateY(0) rotate(0deg);}50%{transform:translateY(-9px) rotate(4deg);}}
        @keyframes svcFadeUp{0%{opacity:0;transform:translateY(22px) scale(0.96);}100%{opacity:1;transform:translateY(0) scale(1);}}
        @keyframes svcShine{0%{left:-100%;}100%{left:200%;}}
        @keyframes svcPulseRed{0%,100%{box-shadow:0 8px 32px rgba(185,28,28,0.35);}50%{box-shadow:0 8px 48px rgba(185,28,28,0.7);}}
      `}</style>
    
     {/* Background watermark */}
      {/* ✨ Desktop ambient — masqué sur mobile */}
      <div className="hidden lg:block pointer-events-none select-none" style={{position:'absolute',inset:0,overflow:'hidden',zIndex:1}}>
        <div style={{position:'absolute',left:'-10%',top:'5%',width:450,height:450,background:'radial-gradient(circle,rgba(6,95,70,0.28) 0%,transparent 70%)',borderRadius:'50%',filter:'blur(70px)',animation:'svcFloat 9s ease-in-out infinite'}}/>
        <div style={{position:'absolute',right:'-8%',top:'25%',width:400,height:400,background:'radial-gradient(circle,rgba(16,185,129,0.2) 0%,transparent 70%)',borderRadius:'50%',filter:'blur(60px)',animation:'svcFloat 8s ease-in-out infinite 2s'}}/>
        <div style={{position:'absolute',left:'5%',bottom:'10%',width:320,height:320,background:'radial-gradient(circle,rgba(217,197,160,0.12) 0%,transparent 70%)',borderRadius:'50%',filter:'blur(50px)',animation:'svcFloat 11s ease-in-out infinite 1s'}}/>
        <div style={{position:'absolute',right:'5%',bottom:'20%',width:280,height:280,background:'radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 70%)',borderRadius:'50%',filter:'blur(45px)',animation:'svcFloat 10s ease-in-out infinite 3s'}}/>
        <span style={{position:'absolute',left:'6%',top:'18%',fontSize:64,opacity:0.2,animation:'svcFloat 4s ease-in-out infinite',filter:'drop-shadow(0 0 24px rgba(6,95,70,0.7))'}}>🍕</span>
        <span style={{position:'absolute',left:'3%',top:'42%',fontSize:52,opacity:0.18,animation:'svcFloat 5.5s ease-in-out infinite 1.5s',filter:'drop-shadow(0 0 18px rgba(6,95,70,0.5))'}}>🍔</span>
        <span style={{position:'absolute',left:'9%',top:'65%',fontSize:58,opacity:0.17,animation:'svcFloat 4.8s ease-in-out infinite 0.8s',filter:'drop-shadow(0 0 20px rgba(6,95,70,0.5))'}}>🥗</span>
        <span style={{position:'absolute',left:'2%',top:'82%',fontSize:44,opacity:0.13,animation:'svcFloat 6.2s ease-in-out infinite 2.2s'}}>🌮</span>
        <span style={{position:'absolute',left:'13%',top:'6%',fontSize:38,opacity:0.1,animation:'svcFloat 7.5s ease-in-out infinite 3.5s'}}>🥙</span>
        <span style={{position:'absolute',right:'7%',top:'22%',fontSize:60,opacity:0.2,animation:'svcFloat 4.5s ease-in-out infinite 0.5s',filter:'drop-shadow(0 0 22px rgba(244,63,94,0.5))'}}>🌹</span>
        <span style={{position:'absolute',right:'4%',top:'48%',fontSize:50,opacity:0.15,animation:'svcFloat 5s ease-in-out infinite 1.2s'}}>💊</span>
        <span style={{position:'absolute',right:'10%',top:'68%',fontSize:54,opacity:0.17,animation:'svcFloat 4.2s ease-in-out infinite 0.3s'}}>🚕</span>
        <span style={{position:'absolute',right:'3%',top:'85%',fontSize:42,opacity:0.12,animation:'svcFloat 6.5s ease-in-out infinite 1.8s'}}>💎</span>
        <span style={{position:'absolute',right:'13%',top:'8%',fontSize:38,opacity:0.1,animation:'svcFloat 8.5s ease-in-out infinite 2.8s'}}>🏍️</span>
      </div>

      {/* Hub button — TOP CENTER */}
      <div className="absolute top-4 left-1/2 z-50" style={{transform:'translateX(-50%)'}}>
        <button onClick={onBack}
          style={{display:'flex',alignItems:'center',gap:5,background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.22)',borderRadius:20,padding:'7px 16px',cursor:'pointer',backdropFilter:'blur(12px)',boxShadow:'0 2px 12px rgba(0,0,0,0.1)'}}>
          <span style={{fontSize:12,color:'rgba(255,255,255,0.75)'}}>{isAR?'→':'←'}</span>
          <span style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.75)',letterSpacing:'0.12em'}}>HUB</span>
        </button>
      </div>

      {/* Profile button + Bridge ID + Diamonds — LEFT */}{isSignedIn && (
      <div className={`absolute top-3 z-50 flex flex-col items-center gap-1 ${isAR?'right-3':'left-3'}`}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <button onClick={()=>setShowProfile(true)}
            style={{width:40,height:40,borderRadius:'50%',overflow:'hidden',border:'2.5px solid #D9C5A0',background:'#F0EBE1',boxShadow:'0 4px 14px rgba(6,95,70,0.15)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0}}>
            {avatarSrc
              ?<img src={avatarSrc} alt="Profil" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              :<span style={{fontSize:13,fontWeight:900,color:'#065F46',lineHeight:1}}>{initials}</span>
            }
          </button>
        </div>
        <div style={{background:'rgba(6,95,70,0.12)',border:'1px solid rgba(6,95,70,0.3)',borderRadius:6,padding:'2px 5px'}}>
          <span style={{fontSize:7,fontWeight:900,color:'#065F46',letterSpacing:'0.06em'}}>
            {getBridgeId(profile.phone, profile.name)}
          </span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:3,background:'#FEF9C3',border:'1px solid #FDE047',borderRadius:8,padding:'2px 6px',boxShadow:'0 1px 4px rgba(0,0,0,0.08)'}}>
          <span style={{fontSize:10}}>💎</span>
          <span style={{fontSize:8,fontWeight:900,color:'#92400E'}}>{diamonds.toLocaleString()}</span>
        </div>
    </div>    
    )}              
      
   {!isSignedIn && (
  <div className={`absolute top-3 z-50 ${isAR?'right-3':'left-3'}`}>
    <button
    onClick={() => window.location.href = '/sign-in'}
      className="text-xs font-black px-3 py-1.5 rounded-full"
      style={{background:'#065F46', color:'white', border:'1px solid #D9C5A0', boxShadow:'0 2px 8px rgba(6,95,70,0.3)'}}
    >
      {lang==='ar'?'تسجيل الدخول':lang==='amz'?'ⴰⴽⵛⵎ':'Se connecter'}
    </button>
  </div>
)}  
      
      {/* Language + Dark toggle — RIGHT */}
      <div className={`absolute top-5 z-50 flex items-center gap-2 ${isAR?'left-5':'right-5'}`}>
        <DarkToggle size={38}/>
        <button onClick={cycleLang}
          className={`rounded-full flex items-center justify-center font-black text-sm transition-all active:scale-90 hover:scale-110 px-3 ${lang==='amz'?'font-tifinagh':''}`}
          style={{background:'var(--c-card)',border:'2.5px solid #D9C5A0',color:'#065F46',boxShadow:'0 4px 20px rgba(6,95,70,0.15)',height:'38px',fontSize:'13px'}}>
          {LANG_LABELS[lang]}
        </button>
      </div>

      <div className="relative flex flex-col items-center w-full max-w-2xl mx-auto pt-20 pb-8 px-4">
        {/* Badge localisation style glass */}
        <div style={{
          display:'inline-flex',alignItems:'center',gap:6,
          background:'linear-gradient(135deg,rgba(6,95,70,0.1),rgba(180,83,9,0.07))',
          border:'1px solid rgba(217,197,160,0.6)',
          borderRadius:20,padding:'4px 14px',
          backdropFilter:'blur(10px)',marginBottom:6,
        }}>
          <span style={{fontSize:10,fontWeight:800,letterSpacing:'0.12em',color:'#065F46'}}>SAFI</span>
          <span style={{color:'#D9C5A0',fontSize:10}}>·</span>
          <span style={{fontSize:10,fontWeight:700,color:'#B45309'}}>آسفي</span>
          <span style={{color:'#D9C5A0',fontSize:10}}>·</span>
          <span style={{fontSize:10,fontWeight:700,color:'#065F46'}}>ⵙⴰⴼⵉ</span>
        </div>
        {/* Séparateur lumineux */}
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20,marginTop:4}}>
          <div style={{width:40,height:1,background:'linear-gradient(to right,transparent,#D9C5A0)'}}/>
          <div style={{width:6,height:6,borderRadius:'50%',background:'linear-gradient(135deg,#34D399,#B45309)',boxShadow:'0 0 8px rgba(5,150,105,0.6)'}}/>
          <div style={{width:40,height:1,background:'linear-gradient(to left,transparent,#D9C5A0)'}}/>
        </div>
        {/* Sous-titre dans glass pill */}
        <div style={{
          background:'linear-gradient(135deg,rgba(6,95,70,0.08),rgba(217,197,160,0.12))',
          border:'1px solid rgba(217,197,160,0.4)',
          borderRadius:12,padding:'5px 16px',
          backdropFilter:'blur(8px)',marginBottom:24,
        }}>
          <p className={`text-[10px] font-black tracking-[0.18em] uppercase ${fClass}`} style={{color:'#6B7280',margin:0}}>{t.chooseService}</p>
        </div>

        {/* 2×2 service grid — Glassmorphism iOS 18 */}
        {(()=>{
          const topItems=[
            {key:'delivery' as const, label:'Bridge Eats',  sub:t.deliverySub, emoji:'🛵',
             pending:false, active:true,
             grad:'linear-gradient(145deg,#064E3B 0%,#065F46 45%,#059669 100%)',
             glow:'rgba(5,150,105,0.55)', border:'rgba(52,211,153,0.45)'},
            {key:'taxi'     as const, label:'Bridge Taxi',  sub:t.taxiSub,     emoji:'🚖',
             pending:true,
             grad:'linear-gradient(145deg,#78350F 0%,#B45309 55%,#F59E0B 100%)',
             glow:'rgba(245,158,11,0.45)', border:'rgba(251,191,36,0.45)'},
          ];
          const botItems=[
            {key:'fleurs'   as const, label:'Bridge Fleurs',sub:t.fleursSub,   emoji:'🌹',
             pending:false, active:true,
             grad:'linear-gradient(145deg,#831843 0%,#DB2777 55%,#F472B6 100%)',
             glow:'rgba(219,39,119,0.5)', border:'rgba(244,114,182,0.45)'},
            {key:'tabac'    as const, label:'Bridge Tabac', sub:t.tabacSub,    emoji:'🚬',
             pending:true,
             grad:'linear-gradient(145deg,#1C0A00 0%,#7D4F2E 55%,#A0623A 100%)',
             glow:'rgba(125,79,46,0.5)', border:'rgba(160,98,58,0.4)'},
          ];
          const cardIdx:{[k:string]:number}={delivery:0,taxi:1,fleurs:3,tabac:4};
          const renderCard=(item:{key:'delivery'|'taxi'|'fleurs'|'tabac'|'pharmacie';label:string;sub:string;emoji:string;pending?:boolean;grad:string;glow:string;border:string})=>{
            const isPressed=pressed===item.key;
            const idx=cardIdx[item.key]??0;
            return(
              <button key={item.key} onClick={()=>choose(item.key)}
                style={{
                  background:'none',border:'none',cursor:'pointer',padding:0,
                  transform:isPressed?'scale(0.94)':'scale(1)',
                  transition:'transform 0.2s cubic-bezier(.34,1.56,.64,1)',
                  opacity:item.pending?0.82:1,
                  animation:`svcFadeUp 0.45s ease-out ${idx*0.08}s both`,
                }}>
                <div style={{
                  background: item.grad,
                  borderRadius:24,
                  border:`1.5px solid ${isPressed?'rgba(255,255,255,0.55)':item.border}`,
                  boxShadow: isPressed
                    ? `0 0 0 3px ${item.glow},0 16px 40px ${item.glow},inset 0 1px 0 rgba(255,255,255,0.25)`
                    : `0 8px 32px ${item.glow},inset 0 1px 0 rgba(255,255,255,0.2)`,
                  padding:'22px 12px 16px',
                  display:'flex',flexDirection:'column',alignItems:'center',gap:8,
                  position:'relative',overflow:'hidden',
                  transition:'box-shadow 0.25s,border-color 0.25s',
                  minHeight:140,
                }}>
                  {/* Glass shine */}
                  <div style={{position:'absolute',top:0,left:0,right:0,height:'55%',background:'linear-gradient(180deg,rgba(255,255,255,0.18) 0%,rgba(255,255,255,0) 100%)',borderRadius:'24px 24px 60% 60%',pointerEvents:'none'}}/>
                  {/* Sweep shine on hover */}
                  <div style={{position:'absolute',top:0,bottom:0,width:'40%',background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)',animation:'svcShine 3.5s ease-in-out infinite',pointerEvents:'none'}}/>
                  {item.pending&&(
                    <div style={{position:'absolute',top:10,right:isAR?'auto':10,left:isAR?10:'auto',background:'rgba(239,68,68,0.92)',borderRadius:20,padding:'3px 10px',display:'flex',alignItems:'center',gap:5,backdropFilter:'blur(6px)'}}>
                      <span style={{width:6,height:6,borderRadius:'50%',background:'#FCA5A5',display:'inline-block',animation:'pulse2 1.4s ease-in-out infinite'}}/>
                      <span style={{color:'#fff',fontSize:9,fontWeight:900,letterSpacing:'0.1em'}}>EN ATTENTE</span>
                    </div>
                  )}
                  <span style={{fontSize:44,lineHeight:1,filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',display:'inline-block',animation:`svcFloat ${3.2+idx*0.35}s ease-in-out ${idx*0.25}s infinite`}}>{item.emoji}</span>
                  <p style={{color:'#fff',fontSize:13,fontWeight:900,letterSpacing:'0.08em',margin:0,textShadow:'0 1px 4px rgba(0,0,0,0.4)',textAlign:'center'}}>{item.label}</p>
                  <p style={{color:'rgba(255,255,255,0.75)',fontSize:10,fontWeight:600,margin:0,textAlign:'center'}}>{item.sub}</p>
                </div>
              </button>
            );
          };
          return(
            <div style={{display:'flex',flexDirection:'column',gap:'16px',width:'100%',maxWidth:'100%',padding:'0 4px'}}>
              {/* Row 1: Eats + Taxi */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
                {topItems.map(renderCard)}
              </div>
              {/* Row 2: Bridge Pharmacie — full width, centered */}
              {(()=>{
                const isPh=pressed==='pharmacie';
                return(
                  <button onClick={()=>choose('pharmacie')} style={{background:'none',border:'none',cursor:'pointer',padding:0,transform:isPh?'scale(0.97)':'scale(1)',transition:'transform 0.2s cubic-bezier(.34,1.56,.64,1)',opacity:0.82,animation:'svcFadeUp 0.45s ease-out 0.16s both'}}>
                    <div style={{
                      background:'linear-gradient(145deg,#0C0E2B 0%,#1E1B4B 35%,#312E81 65%,#1D4ED8 100%)',
                      borderRadius:24,border:`1.5px solid ${isPh?'rgba(255,255,255,0.5)':'rgba(99,102,241,0.5)'}`,
                      boxShadow:isPh?'0 0 0 3px rgba(99,102,241,0.5),0 16px 40px rgba(99,102,241,0.4),inset 0 1px 0 rgba(255,255,255,0.2)':'0 8px 32px rgba(30,27,75,0.7),inset 0 1px 0 rgba(255,255,255,0.15)',
                      padding:'18px 20px',display:'flex',alignItems:'center',gap:16,position:'relative',overflow:'hidden',
                    }}>
                      <div style={{position:'absolute',top:0,left:0,right:0,height:'55%',background:'linear-gradient(180deg,rgba(255,255,255,0.12) 0%,rgba(255,255,255,0) 100%)',borderRadius:'24px 24px 60% 60%',pointerEvents:'none'}}/>
                      {/* Night stars decoration */}
                      <div style={{position:'absolute',top:8,right:16,fontSize:10,opacity:0.5}}>✨</div>
                      <div style={{position:'absolute',top:14,right:32,fontSize:7,opacity:0.3}}>★</div>
                      <div style={{position:'absolute',top:5,right:48,fontSize:8,opacity:0.4}}>✦</div>
                      <div style={{background:'rgba(255,255,255,0.1)',borderRadius:16,padding:'10px 12px',flexShrink:0}}>
                        <span style={{fontSize:36,lineHeight:1,filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.4))'}}>💊</span>
                      </div>
                      <div style={{textAlign:'left',flex:1}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                          <p style={{color:'#fff',fontSize:14,fontWeight:900,letterSpacing:'0.06em',margin:0,textShadow:'0 1px 4px rgba(0,0,0,0.5)'}}>Bridge Pharmacie</p>
                          <span style={{background:'rgba(239,68,68,0.85)',borderRadius:20,padding:'2px 8px',display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
                            <span style={{width:5,height:5,borderRadius:'50%',background:'#FCA5A5',display:'inline-block',animation:'pulse2 1.4s ease-in-out infinite'}}/>
                            <span style={{color:'#fff',fontSize:8,fontWeight:900,letterSpacing:'0.1em'}}>EN ATTENTE</span>
                          </span>
                        </div>
                        <p style={{color:'rgba(255,255,255,0.8)',fontSize:11,fontWeight:700,margin:'0 0 2px'}}>🌙 Ouverte la nuit · 💊 Disponible 24h/24</p>
                        <p style={{color:'rgba(255,255,255,0.5)',fontSize:10,margin:0}}>{t.pharmaeSub}</p>
                      </div>
                    </div>
                  </button>
                );
              })()}
              {/* Row 3: Fleurs + Tabac */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
                {botItems.map(renderCard)}
              </div>
            </div>
          );
        })()}

        {/* ── GAME BANNER — entre grille et pub ─────────────────────────────── */}
        <button onClick={()=>navigate('/game')}
          className="w-full mt-7 transition-all active:scale-95"
          style={{background:'linear-gradient(135deg,#071A10,#0D3020)',border:'1.5px solid rgba(74,222,128,0.35)',borderRadius:20,padding:'14px 18px',boxShadow:'0 6px 28px rgba(6,95,70,0.45)',cursor:'pointer',display:'flex',alignItems:'center',gap:14,textAlign:'left'}}>
          {/* Shark avatar */}
          <div style={{width:52,height:52,borderRadius:'50%',overflow:'hidden',border:'2px solid #D9C5A0',flexShrink:0,boxShadow:'0 0 16px rgba(74,222,128,0.4)'}}>
            <img src="/bridge-shark.png" alt="Bridge Game" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top'}}/>
          </div>
          {/* Text */}
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
              <span style={{color:'#D9C5A0',fontSize:9,fontWeight:900,letterSpacing:'0.22em'}}>BRIDGE</span>
              <span style={{background:'rgba(74,222,128,0.2)',border:'1px solid rgba(74,222,128,0.6)',borderRadius:5,padding:'1px 6px',color:'#4ADE80',fontSize:8,fontWeight:900,letterSpacing:'0.14em'}}>GAME</span>
            </div>
            <p style={{color:'#FDE047',fontSize:12,fontWeight:800,margin:'0 0 2px',lineHeight:1.3}}>💎 Gagnez des diamants</p>
            <p style={{color:'rgba(255,255,255,0.45)',fontSize:10,margin:0}}>Chaque commande = points → menus offerts</p>
          </div>
          {/* Arrow */}
          <span style={{color:'#4ADE80',fontSize:18,flexShrink:0,fontWeight:900}}>›</span>
        </button>

        {/* ── AD SLOT — place de publicité ───────────────────────────────────── */}
        <div id="ad-slot" className="w-full mt-5">
          <div className="rounded-2xl overflow-hidden" style={{border:'1.5px dashed #D9C5A0',background:'rgba(253,252,249,0.7)',minHeight:90,display:'flex',alignItems:'center',justifyContent:'center'}}>
            {/* PUB_CONTENT_START */}
            <p className="text-[10px] font-bold tracking-widest uppercase" style={{color:'#C9BFB2'}}>Espace Publicitaire</p>
            {/* PUB_CONTENT_END */}
          </div>
        </div>

      </div>

      {showProfile&&<ProfileModal lang={lang} profile={profile} onSave={saveProfile} onClose={()=>setShowProfile(false)}/>}
    </div>
  );
}

// ─── WHATSAPP SUPPORT BUTTON ──────────────────────────────────────────────────

// ─── PWA INSTALL BANNER ───────────────────────────────────────────────────────
const PWA_DISMISSED_KEY = 'bridge_pwa_banner_dismissed';

const PWA_LABELS = {
  fr: { title: 'Installer Bridge Safi', sub: 'Accès rapide depuis votre écran d\'accueil', btn: 'Installer', ios: 'Appuyez sur', iosThen: 'puis "Sur l\'écran d\'accueil"', later: 'Plus tard' },
  en: { title: 'Install Bridge Safi', sub: 'Quick access from your home screen', btn: 'Install', ios: 'Tap', iosThen: 'then "Add to Home Screen"', later: 'Later' },
  ar: { title: 'تثبيت Bridge Safi', sub: 'وصول سريع من شاشتك الرئيسية', btn: 'تثبيت', ios: 'اضغط على', iosThen: 'ثم "إضافة إلى الشاشة الرئيسية"', later: 'لاحقاً' },
  amz: { title: 'Aẓẓl Bridge Safi', sub: 'Anefrar usrid seg umagrad', btn: 'Aẓẓl', ios: 'Smḍl', iosThen: 'akd "Qqen i tafyirt"', later: 'Zdat' },
};

function PWAInstallBanner({ lang }: { lang: Lang }) {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const deferredPrompt = useRef<any>(null);
  const l = PWA_LABELS[lang];

  useEffect(() => {
    // Already installed → don't show
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    // Already dismissed → don't show
    if (localStorage.getItem(PWA_DISMISSED_KEY)) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    if (ios) {
      // iOS: show after 4s (no beforeinstallprompt on Safari)
      const t = setTimeout(() => setShow(true), 4000);
      return () => clearTimeout(t);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e;
      const t = setTimeout(() => setShow(true), 4000);
      return () => clearTimeout(t);
    };
    window.addEventListener('beforeinstallprompt', handler as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  const dismiss = () => {
    setShow(false);
    try { localStorage.setItem(PWA_DISMISSED_KEY, '1'); } catch {}
  };

  const install = async () => {
    if (isIOS) { setShowIOSGuide(true); return; }
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === 'accepted') dismiss();
    deferredPrompt.current = null;
  };

  if (!show) return null;
  const isAR = lang === 'ar';

  return (
    <div className="modal-overlay fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
      <div
        className="modal-sheet pointer-events-auto w-full max-w-md mx-auto mb-0 rounded-t-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg,#064E3B 0%,#065F46 60%,#047857 100%)',
          boxShadow: '0 -16px 60px rgba(6,95,70,0.55)',
          border: '1.5px solid rgba(52,211,153,0.35)',
          borderBottom: 'none',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: 36, height: 4, borderRadius: 9, background: 'rgba(255,255,255,0.25)' }} />
        </div>

        <div className={`px-5 pb-6 pt-2 ${isAR ? 'rtl' : 'ltr'}`}>
          {!showIOSGuide ? (
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div style={{ width: 52, height: 52, borderRadius: 14, overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(217,197,160,0.5)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                <img src="/logo_bridge_512.png" alt="Bridge" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-sm leading-tight truncate">{l.title}</p>
                <p className="text-white/70 text-xs mt-0.5 leading-tight">{l.sub}</p>
              </div>
              {/* Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={install}
                  className="font-black text-xs px-4 py-2 rounded-2xl transition-all active:scale-95"
                  style={{ background: '#D9C5A0', color: '#065F46', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}
                >
                  {l.btn}
                </button>
                <button
                  onClick={dismiss}
                  className="font-black text-xs px-3 py-2 rounded-2xl transition-all active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            /* iOS guide */
            <div className="text-center py-2">
              <p className="text-white font-black text-sm mb-3">{l.title}</p>
              <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                <span className="text-white/80 text-xs">{l.ios}</span>
                <span className="text-2xl">⎋</span>
                <span className="text-white/80 text-xs">{l.iosThen}</span>
              </div>
              <div className="flex gap-2 justify-center">
                <span className="text-3xl">➕</span>
              </div>
              <button
                onClick={dismiss}
                className="mt-4 font-bold text-xs px-6 py-2 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}
              >
                {l.later}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WAButton() {
  const msg = encodeURIComponent('Bonjour Bridge Safi, j\'ai besoin d\'aide 🙏');
  return (
    <a
      href={`https://wa.me/212764794856?text=${msg}`}
      target="_blank" rel="noopener noreferrer"
      title="Support WhatsApp"
      style={{
        position:'fixed',bottom:88,right:16,zIndex:60,
        width:46,height:46,borderRadius:'50%',
        background:'#25D366',
        boxShadow:'0 4px 16px rgba(37,211,102,0.45)',
        display:'flex',alignItems:'center',justifyContent:'center',
        transition:'transform 0.15s',
        textDecoration:'none',
      }}
      onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.12)')}
      onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.124 1.532 5.859L.036 23.671l5.979-1.567A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
      </svg>
    </a>
  );
}

// ─── TAXI TRACKING MAP ─────────────────────────────────────────────────────────

function TaxiMap({driverPos,clientPos,fakeVehicles}:{driverPos:{lat:number;lng:number}|null;clientPos:{lat:number;lng:number}|null;fakeVehicles?:Array<{lat:number;lng:number;id:number;emoji:string}>}) {
  const center = driverPos ?? clientPos ?? {lat:32.2994,lng:-9.2372};
  const taxiIcon = L.divIcon({className:'',html:'<div style="font-size:34px;line-height:1;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.7))">🚖</div>',iconSize:[36,36],iconAnchor:[18,18]});
  const pinIcon = L.divIcon({className:'',html:'<div style="display:flex;flex-direction:column;align-items:center"><div style="width:16px;height:16px;border-radius:50%;background:#10B981;border:2.5px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.5)"></div><div style="width:2px;height:10px;background:#10B981;border-radius:1px;margin-top:-1px"></div></div>',iconSize:[16,26],iconAnchor:[8,26]});
  function Fly({pos}:{pos:{lat:number;lng:number}}) {
    const map=useMap();
    useEffect(()=>{ map.flyTo([pos.lat,pos.lng],15,{duration:1.2}); },[pos.lat,pos.lng]);
    return null;
  }
  return (
    <MapContainer center={[center.lat,center.lng]} zoom={14} style={{width:'100%',height:'100%'}} zoomControl={false} attributionControl={false}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"/>
      {fakeVehicles?.map(v=>{
        const fi=L.divIcon({className:'',html:`<div style="font-size:24px;line-height:1;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.6));opacity:0.75">${v.emoji}</div>`,iconSize:[26,26],iconAnchor:[13,13]});
        return <Marker key={v.id} position={[v.lat,v.lng]} icon={fi}/>;
      })}
      {driverPos&&<><Marker position={[driverPos.lat,driverPos.lng]} icon={taxiIcon}/><Fly pos={driverPos}/></>}
      {clientPos&&<Marker position={[clientPos.lat,clientPos.lng]} icon={pinIcon}/>}
      {!driverPos&&clientPos&&<Fly pos={clientPos}/>}
    </MapContainer>
  );
}

// ─── TAXI PAGE ────────────────────────────────────────────────────────────────

// ─── SHARK DIAMOND WIDGET ────────────────────────────────────────────────────
function SharkDiamondWidget({onNavigate,profile}:{onNavigate:()=>void;profile:UserProfile}) {
  const {user}=useUser();
  const getAuthHeaders=useAuthHeaders();
  const cacheKey=`bridge_diamonds_cache_${user?.id||'anon'}`;
  // Initialise from user-specific localStorage cache for instant display, then confirm with server
  const [gems,setGems]=useState<number>(()=>{
    try{return parseInt(localStorage.getItem(`bridge_diamonds_cache_${user?.id||'anon'}`)||'0',10)||0;}catch{return 0;}
  });
  const bridgeId=getBridgeId(profile.phone, profile.name);
  const avatarSrc=profile.avatar||user?.imageUrl||null;

  // Fetch authoritative count from server — always override local cache for this user
  useEffect(()=>{
    if(!user?.id) return;
    getAuthHeaders().then(h=>fetch('/api/game/diamonds',{credentials:'include',headers:h})
      .then(r=>r.ok?r.json():null)
      .then(d=>{
        if(d&&typeof d.diamonds==='number'){
          setGems(d.diamonds);
          try{localStorage.setItem(cacheKey,String(d.diamonds));}catch{}
        }
      })
      .catch(()=>{}));
  },[user?.id,getAuthHeaders,cacheKey]);

  // Listen for real-time updates from the game (via storage event dispatched in GameIframe)
  useEffect(()=>{
    const onStorage=(e:StorageEvent)=>{
      if(e.key===cacheKey&&e.newValue){
        const n=parseInt(e.newValue,10);
        if(!isNaN(n)&&n>=0) setGems(n);
      }
    };
    window.addEventListener('storage',onStorage);
    return()=>window.removeEventListener('storage',onStorage);
  },[cacheKey]);
  return(
    <button onClick={onNavigate} title={`${bridgeId} — Bridge Game`}
      style={{background:'none',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'2px 4px',borderRadius:12}}>
      <div style={{width:32,height:32,borderRadius:'50%',overflow:'hidden',border:'2px solid #D9C5A0',boxShadow:'0 2px 10px rgba(6,95,70,0.35)',background:'#F0EBE1',display:'flex',alignItems:'center',justifyContent:'center'}}>
        {avatarSrc
          ?<img src={avatarSrc} alt="Profil" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          :<span style={{fontSize:14}}>👤</span>
        }
      </div>
      <div style={{display:'flex',alignItems:'center',gap:2,background:'rgba(254,252,232,0.95)',border:'1px solid #FDE047',borderRadius:8,padding:'1px 5px'}}>
        <span style={{fontSize:9}}>💎</span>
        <span style={{fontSize:8,fontWeight:900,color:'#92400E'}}>{gems.toLocaleString()}</span>
      </div>
      <span style={{fontSize:7,fontWeight:900,color:'#065F46',letterSpacing:'0.08em',opacity:0.8}}>{bridgeId}</span>
    </button>
  );
}

function TaxiVehicleSelectPage({onBack,onSelect,lang,cycleLang}:{
  onBack:()=>void; onSelect:(v:'taxi'|'moto')=>void; lang:Lang; cycleLang:()=>void;
}) {
  const isAR=lang==='ar'; const isAMZ=lang==='amz';
  return (
    <div style={{position:'fixed',inset:0,overflow:'hidden auto',background:'#000',zIndex:10}}>
      <div style={{position:'absolute',inset:0,background:'linear-gradient(160deg,#0D1117 0%,#1A0A00 50%,#0D1117 100%)'}}/>
      <div style={{position:'relative',zIndex:10,display:'flex',alignItems:'center',gap:10,padding:'52px 16px 16px'}}>
        <button onClick={onBack} style={{width:38,height:38,borderRadius:'50%',border:'none',cursor:'pointer',background:'rgba(255,255,255,0.12)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:18,flexShrink:0}}>←</button>
        <div style={{flex:1,textAlign:'center'}}>
          <p style={{color:'#FDE68A',fontWeight:900,fontSize:14,letterSpacing:'0.12em',margin:0}}>🚖 BRIDGE TAXI · MOTO</p>
          <p style={{color:'rgba(253,230,138,0.5)',fontSize:9,letterSpacing:'0.18em',margin:0}}>CHOISISSEZ VOTRE VÉHICULE · سافي</p>
        </div>
        <button onClick={cycleLang} style={{width:38,height:38,borderRadius:'50%',border:'none',cursor:'pointer',background:'rgba(255,255,255,0.12)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:11,fontWeight:900,flexShrink:0}}>{LANG_LABELS[lang]}</button>
      </div>
      <div style={{position:'relative',zIndex:10,padding:'20px 20px 60px',display:'flex',flexDirection:'column',gap:18}}>
        <p style={{textAlign:'center',color:'rgba(255,255,255,0.7)',fontSize:14,fontWeight:700,margin:'0 0 8px'}}>
          {isAR?'اختر وسيلة التنقل':isAMZ?'ⵙⵙⵔⵏ ⵓⵙⵜⴰⵢ':lang==='en'?'Choose your vehicle':'Quel véhicule pour votre course ?'}
        </p>
        <button onClick={()=>onSelect('taxi')}
          style={{width:'100%',borderRadius:24,border:'2px solid rgba(245,158,11,0.4)',background:'linear-gradient(135deg,rgba(120,53,15,0.5) 0%,rgba(245,158,11,0.15) 100%)',padding:'24px 20px',cursor:'pointer',textAlign:'left' as const,backdropFilter:'blur(12px)',display:'flex',alignItems:'center',gap:18}}>
          <div style={{fontSize:52,lineHeight:1,flexShrink:0}}>🚖</div>
          <div style={{flex:1}}>
            <p style={{color:'#FDE68A',fontWeight:900,fontSize:18,margin:'0 0 4px',letterSpacing:'0.04em'}}>
              {lang==='en'?'Comfort Taxi':isAR?'تاكسي كونفور':isAMZ?'ⵜⴰⴽⵙⵉ':'Taxi Confort'}
            </p>
            <p style={{color:'rgba(253,230,138,0.65)',fontSize:12,margin:'0 0 10px',fontWeight:600}}>
              {lang==='en'?'Safi & all Morocco':isAR?'سافي وكل المغرب':'Safi & tout le Maroc'}
            </p>
            <div style={{display:'flex',gap:8,flexWrap:'wrap' as const}}>
              <span style={{background:'rgba(245,158,11,0.2)',border:'1px solid rgba(245,158,11,0.5)',borderRadius:8,padding:'3px 10px',fontSize:11,fontWeight:700,color:'#FDE68A'}}>
                👥 1–5 {lang==='en'?'seats':isAR?'مقاعد':'places'}
              </span>
              <span style={{background:'rgba(245,158,11,0.2)',border:'1px solid rgba(245,158,11,0.5)',borderRadius:8,padding:'3px 10px',fontSize:11,fontWeight:700,color:'#FDE68A'}}>
                📍 {lang==='en'?'Trip price':isAR?'سعر حسب الرحلة':'Prix selon trajet'}
              </span>
            </div>
          </div>
          <div style={{color:'rgba(253,230,138,0.5)',fontSize:22,flexShrink:0}}>›</div>
        </button>
        <button onClick={()=>onSelect('moto')}
          style={{width:'100%',borderRadius:24,border:'2px solid rgba(249,115,22,0.4)',background:'linear-gradient(135deg,rgba(154,52,18,0.5) 0%,rgba(249,115,22,0.15) 100%)',padding:'24px 20px',cursor:'pointer',textAlign:'left' as const,backdropFilter:'blur(12px)',display:'flex',alignItems:'center',gap:18}}>
          <div style={{fontSize:52,lineHeight:1,flexShrink:0}}>🛵</div>
          <div style={{flex:1}}>
            <p style={{color:'#FED7AA',fontWeight:900,fontSize:18,margin:'0 0 4px',letterSpacing:'0.04em'}}>
              {lang==='en'?'Moto Taxi':isAR?'موتو تاكسي':'Moto Taxi'}
            </p>
            <p style={{color:'rgba(254,215,170,0.65)',fontSize:12,margin:'0 0 10px',fontWeight:600}}>
              {lang==='en'?'Quick & affordable · Safi':isAR?'سريع وبأسعار معقولة · سافي':'Rapide & économique · Safi'}
            </p>
            <div style={{display:'flex',gap:8,flexWrap:'wrap' as const}}>
              <span style={{background:'rgba(249,115,22,0.2)',border:'1px solid rgba(249,115,22,0.5)',borderRadius:8,padding:'3px 10px',fontSize:11,fontWeight:700,color:'#FED7AA'}}>
                👤 1 {lang==='en'?'seat':isAR?'مقعد':'place'}
              </span>
              <span style={{background:'rgba(249,115,22,0.2)',border:'1px solid rgba(249,115,22,0.5)',borderRadius:8,padding:'3px 10px',fontSize:11,fontWeight:700,color:'#FED7AA'}}>
                📍 {lang==='en'?'Trip price':isAR?'سعر حسب الرحلة':'Prix selon trajet'}
              </span>
            </div>
          </div>
          <div style={{color:'rgba(254,215,170,0.5)',fontSize:22,flexShrink:0}}>›</div>
        </button>
      </div>
    </div>
  );
}

function TaxiPage({onBack,lang,cycleLang,profile,saveProfile}:{
  onBack:()=>void; lang:Lang; cycleLang:()=>void;
  profile:UserProfile; saveProfile:(p:UserProfile)=>void;
}) {
  const [showProfile,setShowProfile]=useState(false);
  const [activeTab,setActiveTab]=useState<0|1>(0);
  const isAR=lang==='ar'; const isAMZ=lang==='amz'; const fClass=fontClass(lang);
  const pillStyle:React.CSSProperties={
    background:'var(--c-card)',border:'2.5px solid #D9C5A0',color:'#065F46',
    boxShadow:'0 4px 20px rgba(6,95,70,0.15)',height:'44px',minWidth:'44px',
  };
  const LANG_LABELS:Record<Lang,string>={fr:'FR',en:'EN',ar:'AR',amz:'ⴰⵎⵣ'};

  // ── Booking form state ──
  const [passengers,setPassengers]=useState<1|2|5>(1);
  const [name,setName]=useState(profile.name??'');
  const [phone,setPhone]=useState(profile.phone??'');
  const [destination,setDestination]=useState('');
  const [clientPos,setClientPos]=useState<{lat:number;lng:number}|null>(null);
  const [clientAddress,setClientAddress]=useState(profile.address??'');
  const [gettingGPS,setGettingGPS]=useState(false);
  const [sending,setSending]=useState(false);
  const [bookingRef,setBookingRef]=useState<string>(()=>{
    try{return localStorage.getItem('bridge_taxi_ref')||'';}catch{return '';}
  });
  const [formErr,setFormErr]=useState('');
  const [taxiPayMethod,setTaxiPayMethod]=useState<PayMethodType>(null);
  const [showTaxiQR,setShowTaxiQR]=useState(false);
  const {user:taxiUser}=useUser();
  const getAuthHeaders=useAuthHeaders();
  const [,navigateTaxi]=useLocation();
  const [taxiGems,setTaxiGems]=useState(0);
  const [taxiGemMAD,setTaxiGemMAD]=useState(0);
  const maxTaxiGemMAD=Math.floor(taxiGems/200);
  useEffect(()=>{
    if(!taxiUser?.id) return;
    getAuthHeaders().then(h=>fetch('/api/game/diamonds',{credentials:'include',headers:h})
      .then(r=>r.ok?r.json():null)
      .then(d=>{if(d&&typeof d.diamonds==='number')setTaxiGems(d.diamonds);})
      .catch(()=>{}));
  },[taxiUser?.id,getAuthHeaders]);

  // ── Tracking state ──
  const [trackData,setTrackData]=useState<{found:boolean;lat?:number;lng?:number;status?:string;driverName?:string;eta?:number;clientLat?:number;clientLng?:number;driverPrice?:number}|null>(null);
  const trackIntervalRef=useRef<number|null>(null);
  const [taxiRating,setTaxiRating]=useState(0);
  const [prixProposeTaxi,setPrixProposeTaxi]=useState('');
  const [acceptedDriverOfferTaxi,setAcceptedDriverOfferTaxi]=useState(false);
  const [fakeVehiclesTaxi,setFakeVehiclesTaxi]=useState([
    {lat:32.3010,lng:-9.2390,id:1,emoji:'🚖'},
    {lat:32.3050,lng:-9.2430,id:2,emoji:'🚖'},
    {lat:32.2940,lng:-9.2310,id:3,emoji:'🚖'},
    {lat:32.3080,lng:-9.2470,id:4,emoji:'🚖'},
    {lat:32.2960,lng:-9.2280,id:5,emoji:'🚖'},
  ]);
  const fvTaxiDir=useRef([
    {dlat:0.0003,dlng:0.0001},{dlat:-0.0002,dlng:0.0004},{dlat:0.0001,dlng:-0.0003},
    {dlat:-0.0004,dlng:0.0002},{dlat:0.0002,dlng:0.0003}
  ]);

  const getClientGPS=()=>{
    if(!navigator.geolocation){setClientAddress('GPS non disponible');return;}
    setGettingGPS(true);
    navigator.geolocation.getCurrentPosition(async pos=>{
      const {latitude:lat,longitude:lng}=pos.coords;
      setClientPos({lat,lng});
      setGettingGPS(false);
      try{
        const r=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const d=await r.json();
        setClientAddress(d.display_name?.split(',').slice(0,3).join(', ')||`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }catch{setClientAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);}
    },()=>{setGettingGPS(false);setClientAddress('Saisissez votre adresse manuellement');},{enableHighAccuracy:true,timeout:8000});
  };

  const handleTaxiWalletPay=async(type:'apple'|'google')=>{
    if(!name.trim()||!phone.trim()||!destination.trim()){setFormErr('*');return;}
    const payLabel=type==='apple'?'Apple Pay':'Google Pay';
    const methods=type==='apple'
      ?[{supportedMethods:'https://apple.com/apple-pay',data:{version:3,merchantIdentifier:'merchant.ma.safi-bridge',merchantCapabilities:['supports3DS'],supportedNetworks:['visa','masterCard'],countryCode:'MA'}}]
      :[{supportedMethods:'https://google.com/pay',data:{apiVersion:2,apiVersionMinor:0,merchantInfo:{merchantName:'Bridge Safi'},allowedPaymentMethods:[{type:'CARD',parameters:{allowedAuthMethods:['PAN_ONLY','CRYPTOGRAM_3DS'],allowedCardNetworks:['MASTERCARD','VISA']},tokenizationSpecification:{type:'PAYMENT_GATEWAY',parameters:{gateway:'example',gatewayMerchantId:'bridge-safi'}}}]}}];
    const details={total:{label:'Bridge Taxi · Safi',amount:{currency:'MAD',value:'0'}}};
    try{
      if(typeof PaymentRequest==='undefined') throw new Error('unsupported');
      const pr=new PaymentRequest(methods,details);
      const canMake=await pr.canMakePayment().catch(()=>false);
      if(!canMake) throw new Error('unavailable');
      const response=await pr.show();
      await response.complete('success');
      setTaxiPayMethod(type);
      await handleBook(payLabel);
    }catch{setTaxiPayMethod('cash');}
  };

  const handleBook=async(payLabel?:string)=>{
    if(!name.trim()||!phone.trim()||!destination.trim()){setFormErr('*');return;}
    setSending(true); setFormErr('');
    const ref='TC-'+Math.floor(1000+Math.random()*9000);
    const driverTrackUrl=`${window.location.origin}/driver/${ref}`;
    const pickup=clientAddress||'Safi, Maroc';
    const payInfo=payLabel?payLabel:taxiPayMethod==='qr'?'QR Code':taxiPayMethod==='cash'?'Espèces':taxiPayMethod==='apple'?'Apple Pay':taxiPayMethod==='google'?'Google Pay':'À définir';
    try{
      await fetch(`/api/tracking/${ref}`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({clientLat:clientPos?.lat,clientLng:clientPos?.lng,clientAddress:pickup,destination:destination.trim(),customerName:name.trim(),customerPhone:phone.trim(),passengers,vehicleType:'taxi',clientPrice:parseFloat(prixProposeTaxi)||undefined}),
      }).catch(()=>{});
      await fetch(`${DRIVER_APP_URL}/api/trips`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({trackingNumber:ref,passengerName:name.trim(),passengerPhone:phone.trim(),pickupAddress:pickup,dropoffAddress:destination.trim(),vehicleType:'car',passengers,fare:0,paymentMethod:payInfo,driverTrackUrl,status:'scheduled'}),
      }).catch(()=>{});
    }finally{setSending(false);}
    if(taxiGemMAD>0){getAuthHeaders().then(h=>fetch('/api/game/diamonds/spend',{method:'POST',credentials:'include',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify({spend:taxiGemMAD*200})}).then(r=>r.ok?r.json():null).then(d=>{if(d&&typeof d.diamonds==='number'){const ck=`bridge_diamonds_cache_${taxiUser?.id||'anon'}`;try{localStorage.setItem(ck,String(d.diamonds));}catch{}window.dispatchEvent(new StorageEvent('storage',{key:ck,newValue:String(d.diamonds)}));}}).catch(()=>{}));}
    localStorage.setItem('bridge_taxi_ref',ref);
    try{const raw=localStorage.getItem('bridge_history');const arr=raw?JSON.parse(raw):[];arr.unshift({ref,type:'taxi',date:new Date().toISOString(),destination:destination.trim(),address:clientAddress||'Safi',total:0,name:name.trim()});if(arr.length>100)arr.splice(100);localStorage.setItem('bridge_history',JSON.stringify(arr));}catch{}
    setBookingRef(ref);
    if(taxiPayMethod==='qr') setShowTaxiQR(true);
    else setActiveTab(1);
  };

  // Poll tracking when booking is active (20s = cheapest for client)
  useEffect(()=>{
    if(!bookingRef) return;
    const poll=async()=>{
      try{
        const r=await fetch(`/api/tracking/${bookingRef}`);
        if(r.ok){const d=await r.json();setTrackData(d);}
        else setTrackData({found:false});
      }catch{setTrackData(null);}
    };
    poll();
    trackIntervalRef.current=window.setInterval(poll,20000);
    return()=>{if(trackIntervalRef.current)clearInterval(trackIntervalRef.current);};
  },[bookingRef]);

  // Animate fake taxis when waiting for a driver
  useEffect(()=>{
    if(!bookingRef||trackData?.status==='accepted'||trackData?.status==='completed') return;
    const iv=setInterval(()=>{
      setFakeVehiclesTaxi(prev=>prev.map((v,i)=>{
        const d=fvTaxiDir.current[i];
        const SAFI_LAT=32.2994,SAFI_LNG=-9.2372;
        if(Math.abs(v.lat+d.dlat-SAFI_LAT)>0.025) d.dlat=-d.dlat;
        if(Math.abs(v.lng+d.dlng-SAFI_LNG)>0.035) d.dlng=-d.dlng;
        return{...v,lat:v.lat+d.dlat*(0.7+Math.random()*0.6),lng:v.lng+d.dlng*(0.7+Math.random()*0.6)};
      }));
    },3000);
    return()=>clearInterval(iv);
  },[bookingRef,trackData?.status]);

  const driverPos=(trackData?.found&&trackData.lat&&trackData.lng&&trackData.status==='accepted')?{lat:trackData.lat,lng:trackData.lng}:null;
  const mapClientPos=trackData?.clientLat&&trackData?.clientLng?{lat:trackData.clientLat,lng:trackData.clientLng}:clientPos;

  const statusColor={waiting:'#F59E0B',accepted:'#10B981',arrived:'#3B82F6',completed:'#059669'}[trackData?.status||'waiting']||'#9CA3AF';
  const statusLabel={
    waiting:{fr:'En attente d\'un chauffeur…',en:'Waiting for a driver…',ar:'بانتظار سائق…',amz:'ⵔⴰⴷ ⵢⴰⵙ ⵓⵙⵔⴰⵜⵏ…'},
    accepted:{fr:'Chauffeur en route 🚖',en:'Driver on the way 🚖',ar:'السائق في الطريق 🚖',amz:'ⴰⵎⴰⵏ ⵖ ⵓⵣⵣⵓⵍ 🚖'},
    arrived:{fr:'Votre chauffeur est arrivé ! 🎉',en:'Your driver has arrived! 🎉',ar:'وصل سائقك! 🎉',amz:'ⵢⵓⵙ ⵓⵙⵔⴰⵜⵏ ⵉⵏⴽ! 🎉'},
    completed:{fr:'Course terminée ! ✅',en:'Ride completed! ✅',ar:'انتهت الرحلة! ✅',amz:'ⵉⵙⵙⵓⴼⵖ! ✅'},
  }[trackData?.status||'']?.[lang]||'';

  return(
    <div className={isAR?'rtl':'ltr'} style={{position:'fixed',inset:0,overflow:'hidden',background:'#000',zIndex:10}}>

      {/* ── Full-screen map ── */}
      <div style={{position:'absolute',inset:0}}>
        <TaxiMap driverPos={bookingRef?driverPos:null} clientPos={bookingRef?mapClientPos:clientPos} fakeVehicles={bookingRef&&(!trackData||trackData.status==='waiting')?fakeVehiclesTaxi:undefined}/>
      </div>

      {/* ── Top gradient overlay ── */}
      <div style={{position:'absolute',top:0,left:0,right:0,zIndex:40,background:'linear-gradient(180deg,rgba(10,14,18,0.94) 0%,rgba(10,14,18,0) 100%)',paddingBottom:28}}>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'14px 16px 0'}}>
          <button onClick={onBack} style={{width:38,height:38,borderRadius:'50%',border:'none',cursor:'pointer',background:'rgba(255,255,255,0.12)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:18,flexShrink:0}}>←</button>
          <div style={{flex:1,textAlign:'center'}}>
            <p style={{color:'#FDE68A',fontWeight:900,fontSize:14,letterSpacing:'0.12em',margin:0}}>🚖 BRIDGE TAXI</p>
            <p style={{color:'rgba(253,230,138,0.5)',fontSize:9,letterSpacing:'0.18em',margin:0}}>CONFORT · SAFI · آسفي</p>
          </div>
          <button onClick={cycleLang} style={{width:38,height:38,borderRadius:'50%',border:'none',cursor:'pointer',background:'rgba(255,255,255,0.12)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:11,fontWeight:900,flexShrink:0}}>{LANG_LABELS[lang]}</button>
        </div>
      </div>

      {/* ── LIVE GPS badge (during tracking) ── */}
      {bookingRef&&(
        <div style={{position:'absolute',top:80,left:'50%',transform:'translateX(-50%)',zIndex:35,background:'rgba(13,17,23,0.88)',backdropFilter:'blur(12px)',borderRadius:20,padding:'5px 16px',border:'1px solid rgba(253,230,138,0.25)',display:'flex',alignItems:'center',gap:7,whiteSpace:'nowrap'}}>
          <div style={{width:7,height:7,borderRadius:'50%',background:statusColor,animation:'pulse 1.2s infinite'}}/>
          <span style={{color:'#FDE68A',fontSize:10,fontWeight:900,letterSpacing:'0.15em'}}>{bookingRef} · LIVE GPS</span>
        </div>
      )}

      {/* ── Bottom sheet: BOOKING ── */}
      {!bookingRef&&(
        <div style={{position:'absolute',bottom:0,left:0,right:0,zIndex:30,maxHeight:'76vh',display:'flex',flexDirection:'column',borderRadius:'26px 26px 0 0',background:'var(--c-card)',boxShadow:'0 -12px 50px rgba(0,0,0,0.65)',border:'1px solid rgba(120,53,15,0.15)',borderBottom:'none'}}>
          <div style={{display:'flex',justifyContent:'center',padding:'12px 0 4px',flexShrink:0}}>
            <div style={{width:36,height:4,borderRadius:2,background:'rgba(120,53,15,0.22)'}}/>
          </div>
          <div style={{padding:'4px 20px 12px',borderBottom:'1px solid var(--c-border)',flexShrink:0}}>
            <p style={{fontWeight:900,fontSize:18,color:'var(--c-text)',margin:0}}>
              {lang==='ar'?'📍 إلى أين؟':lang==='en'?'📍 Where to?':lang==='amz'?'📍 ⵖⴰⵜ ⵔⴰⴷ?':'📍 Où allez-vous ?'}
            </p>
            <p style={{fontSize:11,color:'#9CA3AF',margin:'2px 0 0'}}>Taxi Confort · Safi & tout le Maroc</p>
          </div>
          <div style={{overflowY:'auto',flex:1,padding:'16px 20px 36px',display:'flex',flexDirection:'column',gap:14}}>
            {/* From */}
            <div>
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:7}}>
                <div style={{width:11,height:11,borderRadius:'50%',background:'#10B981',border:'2px solid white',boxShadow:'0 0 0 2px rgba(16,185,129,0.25)',flexShrink:0}}/>
                <span style={{fontSize:10,fontWeight:800,color:'#065F46',letterSpacing:'0.1em',textTransform:'uppercase' as const}}>
                  {lang==='ar'?'موقع الانطلاق':lang==='en'?'Pickup location':'Point de départ'}
                </span>
              </div>
              <AddressAutocomplete label='' value={clientAddress} onChange={setClientAddress}
                placeholder={lang==='ar'?'Adresse à Safi':lang==='en'?'Address in Safi':'Adresse à Safi'} lang={lang}/>
              <button onClick={getClientGPS} style={{width:'100%',marginTop:6,padding:'9px 12px',borderRadius:10,border:clientPos?'1.5px solid rgba(16,185,129,0.35)':'none',background:clientPos?'rgba(16,185,129,0.1)':gettingGPS?'rgba(120,53,15,0.6)':'#78350F',color:clientPos?'#065F46':'white',fontWeight:900,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                {gettingGPS
                  ?<><span style={{animation:'spin 1s linear infinite',display:'inline-block'}}>⟳</span>{lang==='en'?'Detecting…':'Détection…'}</>
                  :clientPos
                    ?<>✓ GPS · {clientPos.lat.toFixed(4)}, {clientPos.lng.toFixed(4)}</>
                    :<><span>🎯</span>{lang==='ar'?'تحديد موقعي':lang==='en'?'Use my location':'Ma position GPS'}</>
                }
              </button>
            </div>
            {/* To */}
            <div>
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:7}}>
                <div style={{width:11,height:11,borderRadius:3,background:'#F59E0B',flexShrink:0}}/>
                <span style={{fontSize:10,fontWeight:800,color:'#78350F',letterSpacing:'0.1em',textTransform:'uppercase' as const}}>
                  {lang==='ar'?'الوجهة':lang==='en'?'Destination':'Destination'}
                </span>
              </div>
              <AddressAutocomplete label='' value={destination} onChange={setDestination}
                placeholder={lang==='ar'?'وجهتك (أي مكان بالمغرب)':lang==='en'?'Where to? (anywhere in Morocco)':'Destination (partout au Maroc)'}
                lang={lang} nationwide/>
            </div>
            {/* Prix proposé */}
            <div>
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:7}}>
                <span style={{fontSize:14}}>💰</span>
                <span style={{fontSize:10,fontWeight:800,color:'#78350F',letterSpacing:'0.1em',textTransform:'uppercase' as const}}>
                  {lang==='ar'?'السعر المقترح':lang==='en'?'Your price offer':'Prix proposé (optionnel)'}
                </span>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <input type="number" value={prixProposeTaxi} onChange={e=>setPrixProposeTaxi(e.target.value)} min="0" placeholder={lang==='ar'?'مثال: 80':lang==='en'?'e.g. 80':'ex: 80'}
                  style={{flex:1,borderRadius:10,border:'1.5px solid var(--c-border)',padding:'10px 11px',fontSize:15,fontWeight:900,background:'var(--c-bg)',color:'var(--c-text)',outline:'none',boxSizing:'border-box' as const}}/>
                <span style={{fontWeight:900,color:'var(--c-text)',fontSize:14,whiteSpace:'nowrap' as const}}>DH</span>
              </div>
              <p style={{fontSize:10,color:'#9CA3AF',margin:'4px 0 0'}}>
                {lang==='ar'?'السائق يرى سعرك ويمكنه الرد باقتراح مختلف':lang==='en'?'Driver will see your offer and can counter-propose':'Le chauffeur voit votre offre et peut proposer un autre prix'}
              </p>
            </div>
            {/* Passengers */}
            <div>
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8}}>
                <span style={{fontSize:14}}>👥</span>
                <span style={{fontSize:10,fontWeight:800,color:'#78350F',letterSpacing:'0.1em',textTransform:'uppercase' as const}}>
                  {lang==='ar'?'عدد المسافرين':lang==='en'?'Passengers':lang==='amz'?'ⵉⵎⵓⵙⵙⵓⵜⵏ':'Nombre de passagers'}
                </span>
              </div>
              <div style={{display:'flex',gap:10}}>
                {([1,2,5] as const).map(n=>(
                  <button key={n} onClick={()=>setPassengers(n)}
                    style={{flex:1,padding:'10px 0',borderRadius:12,border:`2px solid ${passengers===n?'#F59E0B':'var(--c-border)'}`,
                      background:passengers===n?'rgba(245,158,11,0.15)':'var(--c-bg)',
                      color:passengers===n?'#78350F':'var(--c-text)',
                      fontWeight:900,fontSize:13,cursor:'pointer',transition:'all 0.15s'}}>
                    {n} {n===1?(lang==='ar'?'شخص':lang==='en'?'person':'pers.'):(lang==='ar'?'أشخاص':lang==='en'?'people':'pers.')}
                  </button>
                ))}
              </div>
            </div>
            {/* Name + Phone */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div>
                <label style={{fontSize:10,fontWeight:800,color:'#78350F',letterSpacing:'0.08em',textTransform:'uppercase' as const,display:'block',marginBottom:4}}>
                  👤 {lang==='ar'?'الاسم':lang==='en'?'Name':'Nom'}
                </label>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder={lang==='en'?'Full name':'Nom complet'}
                  style={{width:'100%',borderRadius:10,border:'1.5px solid var(--c-border)',padding:'10px 11px',fontSize:13,background:'var(--c-bg)',color:'var(--c-text)',outline:'none',boxSizing:'border-box' as const}}/>
              </div>
              <div>
                <label style={{fontSize:10,fontWeight:800,color:'#78350F',letterSpacing:'0.08em',textTransform:'uppercase' as const,display:'block',marginBottom:4}}>
                  📞 {lang==='ar'?'الهاتف':lang==='en'?'Phone':'Tél'}
                </label>
                <input value={phone} onChange={e=>setPhone(e.target.value)} type="tel" placeholder="+212 6..."
                  style={{width:'100%',borderRadius:10,border:'1.5px solid var(--c-border)',padding:'10px 11px',fontSize:13,background:'var(--c-bg)',color:'var(--c-text)',outline:'none',boxSizing:'border-box' as const}}/>
              </div>
            </div>
            {formErr&&<p style={{color:'#DC2626',fontSize:12,fontWeight:700,margin:0}}>
              {lang==='ar'?'يرجى ملء جميع الحقول':lang==='en'?'Please fill all fields':'Veuillez remplir tous les champs'}
            </p>}
            {/* 💎 Diamond discount */}
            <div style={{borderRadius:14,padding:'12px 14px',background:'linear-gradient(135deg,#0A1A12,#0D2E1A)',border:'1px solid rgba(74,222,128,0.3)'}}>
              <p style={{fontSize:11,fontWeight:900,color:'#D9C5A0',margin:'0 0 6px'}}>
                💎 {lang==='ar'?'خصم بالماسات':lang==='en'?'Diamond discount':lang==='amz'?'ⵙⵙⵎⵔⵙ ⵉⵎⴰⵙⵙⵏ':'Réduction Diamants'}
              </p>
              {taxiGems>0?(
                <>
                  <p style={{fontSize:10,color:'rgba(255,255,255,0.6)',margin:'0 0 8px'}}>
                    {taxiGems.toLocaleString()} 💎 = {maxTaxiGemMAD} MAD {lang==='ar'?'متاح':lang==='en'?'available':'disponible'}
                  </p>
                  {taxiGemMAD>0?(
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <span style={{fontSize:10,fontWeight:700,color:'#4ADE80'}}>✓ -{taxiGemMAD} MAD {lang==='ar'?'مطبق':lang==='en'?'applied':'appliqué'}</span>
                      <button onClick={()=>setTaxiGemMAD(0)} style={{fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:8,background:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.5)',border:'none',cursor:'pointer'}}>✕</button>
                    </div>
                  ):(
                    <div style={{display:'flex',gap:8,flexWrap:'wrap' as const}}>
                      {[1,2,5,maxTaxiGemMAD].filter((v,i,a)=>v>0&&a.indexOf(v)===i&&v<=maxTaxiGemMAD).map(mad=>(
                        <button key={mad} onClick={()=>setTaxiGemMAD(mad)}
                          style={{padding:'4px 12px',borderRadius:12,fontWeight:900,fontSize:10,color:'#4ADE80',background:'rgba(74,222,128,0.2)',border:'1px solid rgba(74,222,128,0.5)',cursor:'pointer'}}>
                          -{mad} MAD
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ):(
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                  <p style={{fontSize:10,color:'rgba(255,255,255,0.4)',margin:0}}>
                    {lang==='ar'?'لا ماسات — العب لتربح!':lang==='en'?'No diamonds yet — play to earn!':lang==='amz'?'ⵓⵔ ⴷ ⵉⵎⴰⵙⵙⵏ — ⴰⵎⵢⴰⴳⵓ!':'Pas de diamants — jouez pour en gagner !'}
                  </p>
                  <button onClick={()=>navigateTaxi('/game')} style={{flexShrink:0,fontSize:9,fontWeight:900,padding:'4px 10px',borderRadius:10,background:'rgba(74,222,128,0.2)',border:'1px solid rgba(74,222,128,0.4)',color:'#4ADE80',cursor:'pointer'}}>🎮 Game</button>
                </div>
              )}
            </div>
            {/* Payment */}
            <div style={{borderRadius:16,padding:'14px',background:'var(--c-bg)',border:'1.5px solid var(--c-border)'}}>
              <p style={{fontSize:10,fontWeight:900,color:'#78350F',letterSpacing:'0.1em',textTransform:'uppercase' as const,margin:'0 0 11px'}}>
                💳 {lang==='ar'?'طريقة الدفع':lang==='en'?'Payment method':'Mode de paiement'}
              </p>
              <SharedPaymentOptions lang={lang} selected={taxiPayMethod} onSelect={setTaxiPayMethod} showCash showCard={false} onWalletPay={handleTaxiWalletPay}/>
            </div>
            {/* Book CTA */}
            <button onClick={()=>{if(!taxiPayMethod){setFormErr('*pay');return;}handleBook();}} disabled={sending}
              style={{width:'100%',padding:'16px',borderRadius:18,border:'none',background:sending?'#9CA3AF':'linear-gradient(135deg,#78350F 0%,#F59E0B 100%)',color:'white',fontWeight:900,fontSize:15,boxShadow:sending?'none':'0 8px 28px rgba(120,53,15,0.45)',cursor:sending?'wait':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              {sending
                ?<>⏳ {lang==='ar'?'جاري الإرسال…':lang==='en'?'Sending…':'Envoi en cours…'}</>
                :<>🚖 {lang==='ar'?'احجز الآن':lang==='amz'?'ⵙⵖⵏ':lang==='en'?'Book Now':'Réserver maintenant'}</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ── Bottom card: TRACKING ── */}
      {bookingRef&&(
        <div style={{position:'absolute',bottom:0,left:0,right:0,zIndex:30,borderRadius:'26px 26px 0 0',background:'var(--c-card)',boxShadow:'0 -12px 50px rgba(0,0,0,0.65)',border:'1px solid rgba(120,53,15,0.15)',borderBottom:'none',padding:'14px 20px 40px'}}>
          <div style={{display:'flex',justifyContent:'center',marginBottom:12}}>
            <div style={{width:36,height:4,borderRadius:2,background:'rgba(120,53,15,0.22)'}}/>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:12}}>
            <div style={{width:11,height:11,borderRadius:'50%',background:statusColor,flexShrink:0,animation:'pulse 1.5s infinite'}}/>
            <p style={{fontWeight:900,fontSize:15,color:statusColor,flex:1,margin:0}}>
              {statusLabel||{fr:'Recherche d\'un chauffeur…',en:'Finding a driver…',ar:'البحث عن سائق…',amz:'ⵔⴰⴷ ⵉⴼⴼⵖⵏ ⵓⵙⵔⴰⵜⵏ…'}[lang]}
            </p>
            {trackData?.eta&&<span style={{fontSize:13,fontWeight:900,color:'#F59E0B',flexShrink:0}}>⏱ {trackData.eta} min</span>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:14,background:'var(--c-bg)',border:'1px solid var(--c-border)',marginBottom:12}}>
            <span style={{fontSize:24}}>🚖</span>
            <div style={{flex:1}}>
              <p style={{fontSize:13,fontWeight:700,color:'var(--c-text)',margin:'0 0 1px'}}>{trackData?.driverName||'Bridge Taxi Confort'}</p>
              <p style={{fontSize:10,color:'#9CA3AF',margin:0}}>Réf: <strong style={{color:'var(--c-text)'}}>{bookingRef}</strong></p>
            </div>
            {trackData?.status==='arrived'&&<span style={{fontSize:20}}>🎉</span>}
          </div>
          {trackData?.status==='arrived'&&(
            <div style={{borderRadius:12,padding:'10px 14px',background:'#EFF6FF',border:'1px solid #BFDBFE',textAlign:'center' as const,marginBottom:12}}>
              <p style={{fontWeight:900,color:'#1D4ED8',fontSize:13,margin:0}}>🎉 {lang==='ar'?'وصل سائقك!':lang==='en'?'Driver has arrived!':'Votre chauffeur est là !'}</p>
            </div>
          )}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <button onClick={()=>{setBookingRef('');localStorage.removeItem('bridge_taxi_ref');setTrackData(null);}}
              style={{padding:'11px',borderRadius:14,border:'none',background:'#FEE2E2',color:'#DC2626',fontWeight:900,fontSize:13,cursor:'pointer'}}>
              ✕ {lang==='ar'?'إلغاء':lang==='en'?'Cancel':'Annuler'}
            </button>
            <button onClick={()=>{if(trackIntervalRef.current){clearInterval(trackIntervalRef.current);trackIntervalRef.current=null;}fetch(`/api/tracking/${bookingRef}`).then(r=>r.ok?r.json():null).then(d=>{if(d)setTrackData(d);}).catch(()=>{});const r=window.setInterval(async()=>{try{const res=await fetch(`/api/tracking/${bookingRef}`);if(res.ok)setTrackData(await res.json());}catch{}},20000);trackIntervalRef.current=r;}}
              style={{padding:'11px',borderRadius:14,border:'none',background:'#D1FAE5',color:'#065F46',fontWeight:900,fontSize:13,cursor:'pointer'}}>
              ↺ {lang==='ar'?'تحديث':lang==='en'?'Refresh':'Actualiser'}
            </button>
          </div>
          {trackData?.driverPrice&&!acceptedDriverOfferTaxi&&(
            <div style={{marginTop:12,borderRadius:14,padding:'12px 14px',background:'linear-gradient(135deg,#FEF3C7,#FDE68A)',border:'1.5px solid #F59E0B'}}>
              <p style={{fontWeight:900,color:'#92400E',fontSize:13,margin:'0 0 8px'}}>
                🚖 {lang==='ar'?'السائق يقترح':lang==='en'?'Driver offers':'Le chauffeur propose'} <strong style={{fontSize:17}}>{trackData.driverPrice} DH</strong>
              </p>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>setAcceptedDriverOfferTaxi(true)}
                  style={{flex:1,padding:'9px',borderRadius:10,border:'none',background:'#10B981',color:'white',fontWeight:900,fontSize:13,cursor:'pointer'}}>
                  ✓ {lang==='ar'?'قبول':lang==='en'?'Accept':'Accepter'}
                </button>
                <button onClick={()=>setAcceptedDriverOfferTaxi(false)}
                  style={{flex:1,padding:'9px',borderRadius:10,border:'none',background:'#EF4444',color:'white',fontWeight:900,fontSize:13,cursor:'pointer'}}>
                  ✕ {lang==='ar'?'رفض':lang==='en'?'Decline':'Refuser'}
                </button>
              </div>
            </div>
          )}
          {acceptedDriverOfferTaxi&&trackData?.driverPrice&&(
            <div style={{marginTop:12,borderRadius:14,padding:'10px 14px',background:'#D1FAE5',border:'1.5px solid #10B981',textAlign:'center' as const}}>
              <p style={{fontWeight:900,color:'#065F46',fontSize:13,margin:0}}>
                ✅ {lang==='ar'?'تم الاتفاق على':lang==='en'?'Agreed price:':'Prix accepté :'} <strong>{trackData.driverPrice} DH</strong>
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── COURSE TERMINÉE overlay ── */}
      {trackData?.status==='completed'&&bookingRef&&(
        <div style={{position:'absolute',inset:0,zIndex:60,background:'linear-gradient(180deg,#020c08 0%,#041410 60%,#020c08 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px'}}>
          <div style={{fontSize:80,marginBottom:16,filter:'drop-shadow(0 0 30px rgba(74,222,128,0.6))'}}>✅</div>
          <h2 style={{color:'#D9F99D',fontWeight:900,fontSize:26,margin:'0 0 8px',textAlign:'center',textShadow:'0 0 20px rgba(134,239,172,0.4)'}}>
            {lang==='ar'?'وصلت بسلامة !':lang==='en'?'You arrived safely!':lang==='amz'?'ⵜⴰⵍⴰ ⵢⵓⵙ !':'Vous êtes arrivé(e) !'}
          </h2>
          <p style={{color:'rgba(255,255,255,0.5)',fontSize:13,textAlign:'center',margin:'0 0 28px',maxWidth:260}}>
            {lang==='en'?'Thank you for choosing Bridge Taxi Confort':lang==='ar'?'شكراً لاختيارك Bridge Taxi':'Merci d\'avoir choisi Bridge Taxi Confort'}
          </p>
          <div style={{background:'rgba(255,255,255,0.06)',borderRadius:20,padding:'18px 28px',width:'100%',maxWidth:300,marginBottom:24,textAlign:'center',border:'1px solid rgba(217,197,160,0.15)'}}>
            <p style={{color:'rgba(255,255,255,0.35)',fontSize:10,fontWeight:700,letterSpacing:'0.18em',margin:'0 0 5px'}}>RÉFÉRENCE DE COURSE</p>
            <p style={{color:'#F59E0B',fontWeight:900,fontSize:22,margin:'0 0 8px'}}>{bookingRef}</p>
            {trackData?.driverName&&<p style={{color:'rgba(255,255,255,0.6)',fontSize:13,margin:0}}>🚖 {trackData.driverName}</p>}
          </div>
          <div style={{marginBottom:28,textAlign:'center'}}>
            <p style={{color:'rgba(255,255,255,0.35)',fontSize:10,letterSpacing:'0.15em',marginBottom:10}}>
              {lang==='en'?'RATE YOUR RIDE':lang==='ar'?'قيّم رحلتك':'NOTEZ VOTRE COURSE'}
            </p>
            <div style={{display:'flex',gap:6,justifyContent:'center'}}>
              {[1,2,3,4,5].map(s=>(
                <button key={s} onClick={()=>setTaxiRating(s)} style={{fontSize:32,background:'none',border:'none',cursor:'pointer',opacity:s<=taxiRating?1:0.2,transition:'opacity 0.15s',padding:2,lineHeight:1}}>⭐</button>
              ))}
            </div>
          </div>
          <button onClick={()=>{setBookingRef('');localStorage.removeItem('bridge_taxi_ref');setTrackData(null);setTaxiRating(0);}}
            style={{width:'100%',maxWidth:300,padding:'16px',borderRadius:18,border:'none',background:'linear-gradient(135deg,#78350F,#F59E0B)',color:'white',fontWeight:900,fontSize:15,cursor:'pointer',boxShadow:'0 8px 28px rgba(245,158,11,0.45)'}}>
            🚖 {lang==='en'?'New ride':lang==='ar'?'رحلة جديدة':'Nouvelle course'}
          </button>
        </div>
      )}

      {showProfile&&<ProfileModal lang={lang} profile={profile} onSave={saveProfile} onClose={()=>setShowProfile(false)}/>}
      {showTaxiQR&&<QRPayModal lang={lang} onClose={()=>setShowTaxiQR(false)} onConfirm={()=>setShowTaxiQR(false)}/>}
    </div>
  );
}

// ─── MOTO TAXI PAGE ────────────────────────────────────────────────────────────
function MotoTaxiPage({onBack,lang,cycleLang,profile,saveProfile,vehicleType='moto'}:{
  onBack:()=>void; lang:Lang; cycleLang:()=>void;
  profile:UserProfile; saveProfile:(p:UserProfile)=>void;
  vehicleType?:'taxi'|'moto';
}) {
  const isTaxi=vehicleType==='taxi';
  const vEmoji=isTaxi?'🚖':'🛵';
  const vAccent=isTaxi?'#FDE68A':'#FED7AA';
  const vAccentDark=isTaxi?'#78350F':'#9A3412';
  const vGrad=isTaxi?'linear-gradient(135deg,#78350F,#F59E0B)':'linear-gradient(135deg,#9A3412,#F97316)';
  const vBorder=isTaxi?'rgba(245,158,11,0.15)':'rgba(154,52,18,0.15)';
  const vDriverWord=(l:Lang)=>isTaxi?({fr:'Chauffeur',en:'Driver',ar:'السائق',amz:'ⴰⵙⵔⴰⵜⵏ'}[l]):({fr:'Motard',en:'Rider',ar:'السائق',amz:'ⴰⵙⵔⴰⵜⵏ'}[l]);
  const vServiceName=isTaxi?'Bridge Taxi Confort':'Bridge Moto Taxi';
  const vLocalKey=isTaxi?'bridge_taxi_ref':'bridge_moto_ref';
  const [showProfile,setShowProfile]=useState(false);
  const isAR=lang==='ar'; const isAMZ=lang==='amz'; const fClass=fontClass(lang);
  const LANG_LABELS:Record<Lang,string>={fr:'FR',en:'EN',ar:'AR',amz:'ⴰⵎⵣ'};

  const [name,setName]=useState(profile.name??'');
  const [phone,setPhone]=useState(profile.phone??'');
  const [destination,setDestination]=useState('');
  const [clientPos,setClientPos]=useState<{lat:number;lng:number}|null>(null);
  const [clientAddress,setClientAddress]=useState(profile.address??'');
  const [gettingGPS,setGettingGPS]=useState(false);
  const [sending,setSending]=useState(false);
  const [bookingRef,setBookingRef]=useState<string>(()=>{try{return localStorage.getItem(vLocalKey)||'';}catch{return '';}});
  const [formErr,setFormErr]=useState('');
  const [motoPayMethod,setMotoPayMethod]=useState<PayMethodType>(null);
  const [showMotoQR,setShowMotoQR]=useState(false);
  const {user:motoUser}=useUser();
  const getAuthHeaders=useAuthHeaders();
  const [,navigateMoto]=useLocation();
  const [motoGems,setMotoGems]=useState(0);
  const [motoGemMAD,setMotoGemMAD]=useState(0);
  const maxMotoGemMAD=Math.floor(motoGems/200);
  useEffect(()=>{
    if(!motoUser?.id) return;
    getAuthHeaders().then(h=>fetch('/api/game/diamonds',{credentials:'include',headers:h})
      .then(r=>r.ok?r.json():null)
      .then(d=>{if(d&&typeof d.diamonds==='number')setMotoGems(d.diamonds);})
      .catch(()=>{}));
  },[motoUser?.id,getAuthHeaders]);

  const [trackData,setTrackData]=useState<{found:boolean;lat?:number;lng?:number;status?:string;driverName?:string;eta?:number;clientLat?:number;clientLng?:number;driverPrice?:number}|null>(null);
  const trackIntervalRef=useRef<number|null>(null);
  const [prixProposeMoto,setPrixProposeMoto]=useState('');
  const [acceptedDriverOfferMoto,setAcceptedDriverOfferMoto]=useState(false);
  const [fakeVehiclesMoto,setFakeVehiclesMoto]=useState([
    {lat:32.2990,lng:-9.2360,id:1,emoji:vEmoji},
    {lat:32.3040,lng:-9.2410,id:2,emoji:vEmoji},
    {lat:32.2950,lng:-9.2300,id:3,emoji:vEmoji},
    {lat:32.3070,lng:-9.2450,id:4,emoji:vEmoji},
  ]);
  const fvMotoDir=useRef([
    {dlat:0.0004,dlng:0.0002},{dlat:-0.0003,dlng:0.0005},{dlat:0.0002,dlng:-0.0004},
    {dlat:-0.0003,dlng:0.0001}
  ]);

  const getClientGPS=()=>{
    if(!navigator.geolocation){setClientAddress('GPS non disponible');return;}
    setGettingGPS(true);
    navigator.geolocation.getCurrentPosition(async pos=>{
      const {latitude:lat,longitude:lng}=pos.coords;
      setClientPos({lat,lng});setGettingGPS(false);
      try{
        const r=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const d=await r.json();
        setClientAddress(d.display_name?.split(',').slice(0,3).join(', ')||`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }catch{setClientAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);}
    },()=>{setGettingGPS(false);setClientAddress('Saisissez votre adresse manuellement');},{enableHighAccuracy:true,timeout:8000});
  };

  const handleMotoWalletPay=async(type:'apple'|'google')=>{
    if(!name.trim()||!phone.trim()||!destination.trim()){setFormErr('*');return;}
    const payLabel=type==='apple'?'Apple Pay':'Google Pay';
    const methods=type==='apple'
      ?[{supportedMethods:'https://apple.com/apple-pay',data:{version:3,merchantIdentifier:'merchant.ma.safi-bridge',merchantCapabilities:['supports3DS'],supportedNetworks:['visa','masterCard'],countryCode:'MA'}}]
      :[{supportedMethods:'https://google.com/pay',data:{apiVersion:2,apiVersionMinor:0,merchantInfo:{merchantName:'Bridge Safi'},allowedPaymentMethods:[{type:'CARD',parameters:{allowedAuthMethods:['PAN_ONLY','CRYPTOGRAM_3DS'],allowedCardNetworks:['MASTERCARD','VISA']},tokenizationSpecification:{type:'PAYMENT_GATEWAY',parameters:{gateway:'example',gatewayMerchantId:'bridge-safi'}}}]}}];
    const offeredPrice=parseFloat(prixProposeMoto)||0;
    const finalPrice=Math.max(0,offeredPrice-motoGemMAD);
    const details={total:{label:`${vServiceName} · Safi`,amount:{currency:'MAD',value:String(finalPrice||1)}}};
    try{
      if(typeof PaymentRequest==='undefined') throw new Error('unsupported');
      const pr=new PaymentRequest(methods,details);
      const canMake=await pr.canMakePayment().catch(()=>false);
      if(!canMake) throw new Error('unavailable');
      const response=await pr.show();
      await response.complete('success');
      setMotoPayMethod(type);
      await handleMotoBook(payLabel);
    }catch{setMotoPayMethod('cash');}
  };

  const handleMotoBook=async(payLabel?:string)=>{
    if(!name.trim()||!phone.trim()||!destination.trim()){setFormErr('*');return;}
    setSending(true);setFormErr('');
    const prefix=isTaxi?'TC':'MT';
    const ref=prefix+'-'+Math.floor(1000+Math.random()*9000);
    const driverTrackUrl=`${window.location.origin}/driver/${ref}`;
    const pickup=clientAddress||'Safi, Maroc';
    const offeredPrice=parseFloat(prixProposeMoto)||0;
    const finalPrice=Math.max(0,offeredPrice-motoGemMAD);
    const payInfoMoto=motoPayMethod==='qr'?'QR Code':motoPayMethod==='cash'?'Espèces':motoPayMethod==='apple'?'Apple Pay':motoPayMethod==='google'?'Google Pay':'Espèces';
    try{
      await fetch(`/api/tracking/${ref}`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({clientLat:clientPos?.lat,clientLng:clientPos?.lng,clientAddress:pickup,destination:destination.trim(),customerName:name.trim(),customerPhone:phone.trim(),vehicleType,passengers:isTaxi?undefined:1,clientPrice:offeredPrice||undefined}),
      }).catch(()=>{});
      await fetch(`${DRIVER_APP_URL}/api/trips`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({trackingNumber:ref,passengerName:name.trim(),passengerPhone:phone.trim(),pickupAddress:pickup,dropoffAddress:destination.trim(),vehicleType,passengers:isTaxi?undefined:1,fare:finalPrice||undefined,paymentMethod:payInfoMoto,driverTrackUrl,status:'scheduled'}),
      }).catch(()=>{});
    }finally{setSending(false);}
    if(motoGemMAD>0){getAuthHeaders().then(h=>fetch('/api/game/diamonds/spend',{method:'POST',credentials:'include',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify({spend:motoGemMAD*200})}).then(r=>r.ok?r.json():null).then(d=>{if(d&&typeof d.diamonds==='number'){const ck=`bridge_diamonds_cache_${motoUser?.id||'anon'}`;try{localStorage.setItem(ck,String(d.diamonds));}catch{}window.dispatchEvent(new StorageEvent('storage',{key:ck,newValue:String(d.diamonds)}));}}).catch(()=>{}));}
    localStorage.setItem(vLocalKey,ref);
    try{const raw=localStorage.getItem('bridge_history');const arr=raw?JSON.parse(raw):[];arr.unshift({ref,type:vehicleType,date:new Date().toISOString(),destination:destination.trim(),address:clientAddress||'Safi',total:finalPrice||undefined,name:name.trim()});if(arr.length>100)arr.splice(100);localStorage.setItem('bridge_history',JSON.stringify(arr));}catch{}
    setBookingRef(ref);
    if(motoPayMethod==='qr') setShowMotoQR(true);
  };

  useEffect(()=>{
    if(!bookingRef) return;
    const poll=async()=>{
      try{const r=await fetch(`/api/tracking/${bookingRef}`);if(r.ok){const d=await r.json();setTrackData(d);}else setTrackData({found:false});}
      catch{setTrackData(null);}
    };
    poll();
    trackIntervalRef.current=window.setInterval(poll,20000);
    return()=>{if(trackIntervalRef.current)clearInterval(trackIntervalRef.current);};
  },[bookingRef]);

  // Animate fake motos when waiting for a driver
  useEffect(()=>{
    if(!bookingRef||trackData?.status==='accepted'||trackData?.status==='completed') return;
    const iv=setInterval(()=>{
      setFakeVehiclesMoto(prev=>prev.map((v,i)=>{
        const d=fvMotoDir.current[i];
        const SAFI_LAT=32.2994,SAFI_LNG=-9.2372;
        if(Math.abs(v.lat+d.dlat-SAFI_LAT)>0.025) d.dlat=-d.dlat;
        if(Math.abs(v.lng+d.dlng-SAFI_LNG)>0.035) d.dlng=-d.dlng;
        return{...v,lat:v.lat+d.dlat*(0.7+Math.random()*0.6),lng:v.lng+d.dlng*(0.7+Math.random()*0.6)};
      }));
    },3000);
    return()=>clearInterval(iv);
  },[bookingRef,trackData?.status]);

  const driverPos=(trackData?.found&&trackData.lat&&trackData.lng&&trackData.status==='accepted')?{lat:trackData.lat,lng:trackData.lng}:null;
  const mapClientPos=trackData?.clientLat&&trackData?.clientLng?{lat:trackData.clientLat,lng:trackData.clientLng}:clientPos;
  const [motoRating,setMotoRating]=useState(0);
  const statusColor={waiting:'#F59E0B',accepted:'#10B981',arrived:'#3B82F6',completed:'#059669'}[trackData?.status||'waiting']||'#9CA3AF';
  const vWord=vDriverWord(lang);
  const statusLabel={
    waiting:{fr:`En attente d'un ${vWord.toLowerCase()}…`,en:`Waiting for a ${vWord.toLowerCase()}…`,ar:`بانتظار ${vWord}…`,amz:'ⵔⴰⴷ ⵢⴰⵙ ⵓⵙⵔⴰⵜⵏ…'},
    accepted:{fr:`${vWord} en route ${vEmoji}`,en:`${vWord} on the way ${vEmoji}`,ar:`${vWord} في الطريق ${vEmoji}`,amz:`ⴰⵎⴰⵏ ⵖ ⵓⵣⵣⵓⵍ ${vEmoji}`},
    arrived:{fr:`Votre ${vWord.toLowerCase()} est arrivé ! 🎉`,en:`Your ${vWord.toLowerCase()} has arrived! 🎉`,ar:`وصل ${vWord}! 🎉`,amz:`ⵢⵓⵙ ⵓⵙⵔⴰⵜⵏ ⵉⵏⴽ! 🎉`},
    completed:{fr:'Course terminée ! ✅',en:'Ride completed! ✅',ar:'انتهت الرحلة! ✅',amz:'ⵉⵙⵙⵓⴼⵖ! ✅'},
  }[trackData?.status||'']?.[lang]||'';

  return(
    <div className={isAR?'rtl':'ltr'} style={{position:'fixed',inset:0,overflow:'hidden',background:'#000',zIndex:10}}>
      <div style={{position:'absolute',inset:0}}>
        <TaxiMap driverPos={bookingRef?driverPos:null} clientPos={bookingRef?mapClientPos:clientPos} fakeVehicles={bookingRef&&(!trackData||trackData.status==='waiting')?fakeVehiclesMoto:undefined}/>
      </div>
      <div style={{position:'absolute',top:0,left:0,right:0,zIndex:40,background:'linear-gradient(180deg,rgba(10,14,18,0.94) 0%,rgba(10,14,18,0) 100%)',paddingBottom:28}}>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'14px 16px 0'}}>
          <button onClick={onBack} style={{width:38,height:38,borderRadius:'50%',border:'none',cursor:'pointer',background:'rgba(255,255,255,0.12)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:18,flexShrink:0}}>←</button>
          <div style={{flex:1,textAlign:'center'}}>
            <p style={{color:vAccent,fontWeight:900,fontSize:14,letterSpacing:'0.12em',margin:0}}>{vEmoji} {isTaxi?'BRIDGE TAXI CONFORT':'BRIDGE MOTO TAXI'}</p>
            <p style={{color:`rgba(${isTaxi?'253,230,138':'254,215,170'},0.5)`,fontSize:9,letterSpacing:'0.18em',margin:0}}>{isTaxi?'CONFORT · SAFI · آسفي':'RAPIDE · SAFI · آسفي'}</p>
          </div>
          <button onClick={cycleLang} style={{width:38,height:38,borderRadius:'50%',border:'none',cursor:'pointer',background:'rgba(255,255,255,0.12)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:11,fontWeight:900,flexShrink:0}}>{LANG_LABELS[lang]}</button>
        </div>
      </div>
      {bookingRef&&(
        <div style={{position:'absolute',top:80,left:'50%',transform:'translateX(-50%)',zIndex:35,background:'rgba(13,17,23,0.88)',backdropFilter:'blur(12px)',borderRadius:20,padding:'5px 16px',border:'1px solid rgba(254,215,170,0.25)',display:'flex',alignItems:'center',gap:7,whiteSpace:'nowrap'}}>
          <div style={{width:7,height:7,borderRadius:'50%',background:statusColor,animation:'pulse 1.2s infinite'}}/>
          <span style={{color:'#FED7AA',fontSize:10,fontWeight:900,letterSpacing:'0.15em'}}>{bookingRef} · LIVE GPS</span>
        </div>
      )}
      {!bookingRef&&(
        <div style={{position:'absolute',bottom:0,left:0,right:0,zIndex:30,maxHeight:'78vh',display:'flex',flexDirection:'column',borderRadius:'26px 26px 0 0',background:'var(--c-card)',boxShadow:'0 -12px 50px rgba(0,0,0,0.65)',border:'1px solid rgba(154,52,18,0.15)',borderBottom:'none'}}>
          <div style={{display:'flex',justifyContent:'center',padding:'12px 0 4px',flexShrink:0}}>
            <div style={{width:36,height:4,borderRadius:2,background:'rgba(154,52,18,0.22)'}}/>
          </div>
          <div style={{padding:'4px 20px 12px',borderBottom:'1px solid var(--c-border)',flexShrink:0}}>
            <p style={{fontWeight:900,fontSize:18,color:'var(--c-text)',margin:0}}>
              {lang==='ar'?'📍 إلى أين؟':lang==='en'?'📍 Where to?':lang==='amz'?'📍 ⵖⴰⵜ ⵔⴰⴷ?':'📍 Votre course ?'}
            </p>
            <p style={{fontSize:11,color:'#9CA3AF',margin:'2px 0 0'}}>{isTaxi?'Taxi Confort':'Moto Taxi'} · Safi · Prix selon trajet</p>
          </div>
          <div style={{overflowY:'auto',flex:1,padding:'16px 20px 36px',display:'flex',flexDirection:'column',gap:14}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:7}}>
                <div style={{width:11,height:11,borderRadius:'50%',background:'#10B981',border:'2px solid white',boxShadow:'0 0 0 2px rgba(16,185,129,0.25)',flexShrink:0}}/>
                <span style={{fontSize:10,fontWeight:800,color:'#065F46',letterSpacing:'0.1em',textTransform:'uppercase' as const}}>
                  {lang==='ar'?'موقع الانطلاق':lang==='en'?'Pickup location':'Point de départ'}
                </span>
              </div>
              <AddressAutocomplete label='' value={clientAddress} onChange={setClientAddress}
                placeholder={lang==='ar'?'Adresse à Safi':lang==='en'?'Address in Safi':'Adresse à Safi'} lang={lang}/>
              <button onClick={getClientGPS} style={{width:'100%',marginTop:6,padding:'9px 12px',borderRadius:10,border:clientPos?'1.5px solid rgba(16,185,129,0.35)':'none',background:clientPos?'rgba(16,185,129,0.1)':gettingGPS?'rgba(154,52,18,0.6)':'#9A3412',color:clientPos?'#065F46':'white',fontWeight:900,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                {gettingGPS?<><span style={{animation:'spin 1s linear infinite',display:'inline-block'}}>⟳</span>{lang==='en'?'Detecting…':'Détection…'}</>
                  :clientPos?<>✓ GPS · {clientPos.lat.toFixed(4)}, {clientPos.lng.toFixed(4)}</>
                  :<><span>🎯</span>{lang==='ar'?'تحديد موقعي':lang==='en'?'Use my location':'Ma position GPS'}</>}
              </button>
            </div>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:7}}>
                <div style={{width:11,height:11,borderRadius:3,background:'#F97316',flexShrink:0}}/>
                <span style={{fontSize:10,fontWeight:800,color:'#9A3412',letterSpacing:'0.1em',textTransform:'uppercase' as const}}>
                  {lang==='ar'?'الوجهة':lang==='en'?'Destination':'Destination'}
                </span>
              </div>
              <AddressAutocomplete label='' value={destination} onChange={setDestination}
                placeholder={lang==='ar'?'وجهتك في سافي':lang==='en'?'Where to? (Safi)':'Destination (Safi)'} lang={lang}/>
            </div>
            {/* Prix proposé moto */}
            <div>
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:7}}>
                <span style={{fontSize:14}}>💰</span>
                <span style={{fontSize:10,fontWeight:800,color:'#9A3412',letterSpacing:'0.1em',textTransform:'uppercase' as const}}>
                  {lang==='ar'?'السعر المقترح':lang==='en'?'Your price offer':'Prix proposé (optionnel)'}
                </span>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <input type="number" value={prixProposeMoto} onChange={e=>setPrixProposeMoto(e.target.value)} min="0" placeholder={lang==='ar'?'مثال: 15':lang==='en'?'e.g. 15':'ex: 15'}
                  style={{flex:1,borderRadius:10,border:'1.5px solid var(--c-border)',padding:'10px 11px',fontSize:15,fontWeight:900,background:'var(--c-bg)',color:'var(--c-text)',outline:'none',boxSizing:'border-box' as const}}/>
                <span style={{fontWeight:900,color:'var(--c-text)',fontSize:14,whiteSpace:'nowrap' as const}}>DH</span>
              </div>
              <p style={{fontSize:10,color:'#9CA3AF',margin:'4px 0 0'}}>
                {lang==='ar'?'المرسال يرى سعرك':lang==='en'?`${vDriverWord('en')} sees your offer`:`${vDriverWord('fr')} voit votre offre et peut counter-proposer`}
              </p>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div>
                <label style={{fontSize:10,fontWeight:800,color:'#9A3412',letterSpacing:'0.08em',textTransform:'uppercase' as const,display:'block',marginBottom:4}}>👤 {lang==='ar'?'الاسم':lang==='en'?'Name':'Nom'}</label>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder={lang==='en'?'Full name':'Nom complet'}
                  style={{width:'100%',borderRadius:10,border:'1.5px solid var(--c-border)',padding:'10px 11px',fontSize:13,background:'var(--c-bg)',color:'var(--c-text)',outline:'none',boxSizing:'border-box' as const}}/>
              </div>
              <div>
                <label style={{fontSize:10,fontWeight:800,color:'#9A3412',letterSpacing:'0.08em',textTransform:'uppercase' as const,display:'block',marginBottom:4}}>📞 {lang==='ar'?'الهاتف':lang==='en'?'Phone':'Tél'}</label>
                <input value={phone} onChange={e=>setPhone(e.target.value)} type="tel" placeholder="+212 6..."
                  style={{width:'100%',borderRadius:10,border:'1.5px solid var(--c-border)',padding:'10px 11px',fontSize:13,background:'var(--c-bg)',color:'var(--c-text)',outline:'none',boxSizing:'border-box' as const}}/>
              </div>
            </div>
            {formErr&&<p style={{color:'#DC2626',fontSize:12,fontWeight:700,margin:0}}>
              {lang==='ar'?'يرجى ملء جميع الحقول':lang==='en'?'Please fill all fields':'Veuillez remplir tous les champs'}
            </p>}
            <div style={{borderRadius:14,padding:'12px 14px',background:'linear-gradient(135deg,#0A1A12,#0D2E1A)',border:'1px solid rgba(74,222,128,0.3)'}}>
              <p style={{fontSize:11,fontWeight:900,color:'#D9C5A0',margin:'0 0 6px'}}>
                💎 {lang==='ar'?'خصم بالماسات':lang==='en'?'Diamond discount':lang==='amz'?'ⵙⵙⵎⵔⵙ ⵉⵎⴰⵙⵙⵏ':'Réduction Diamants'}
              </p>
              {motoGems>0?(
                <>
                  <p style={{fontSize:10,color:'rgba(255,255,255,0.6)',margin:'0 0 8px'}}>
                    {motoGems.toLocaleString()} 💎 → max {maxMotoGemMAD} MAD {lang==='en'?'discount':'de réduction'}
                  </p>
                  {motoGemMAD>0?(
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <span style={{fontSize:10,fontWeight:700,color:'#4ADE80'}}>✓ -{motoGemMAD} MAD {lang==='en'?'applied':'appliqué'}</span>
                      <button onClick={()=>setMotoGemMAD(0)} style={{fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:8,background:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.5)',border:'none',cursor:'pointer'}}>✕</button>
                    </div>
                  ):(
                    <div style={{display:'flex',gap:8,flexWrap:'wrap' as const}}>
                      {[1,2,3,4,5,maxMotoGemMAD].filter((v,i,a)=>v>0&&v<=maxMotoGemMAD&&a.indexOf(v)===i).slice(0,5).map(mad=>(
                        <button key={mad} onClick={()=>setMotoGemMAD(mad)}
                          style={{padding:'4px 12px',borderRadius:12,fontWeight:900,fontSize:10,color:'#4ADE80',background:'rgba(74,222,128,0.2)',border:'1px solid rgba(74,222,128,0.5)',cursor:'pointer'}}>
                          -{mad} MAD
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ):(
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                  <p style={{fontSize:10,color:'rgba(255,255,255,0.4)',margin:0}}>
                    {lang==='ar'?'لا ماسات':lang==='en'?'No diamonds yet — play to earn!':lang==='amz'?'ⵓⵔ ⴷ ⵉⵎⴰⵙⵙⵏ':'Pas de diamants — jouez pour en gagner !'}
                  </p>
                  <button onClick={()=>navigateMoto('/game')} style={{flexShrink:0,fontSize:9,fontWeight:900,padding:'4px 10px',borderRadius:10,background:'rgba(74,222,128,0.2)',border:'1px solid rgba(74,222,128,0.4)',color:'#4ADE80',cursor:'pointer'}}>🎮 Game</button>
                </div>
              )}
            </div>
            <div style={{borderRadius:16,padding:'14px',background:'var(--c-bg)',border:'1.5px solid var(--c-border)'}}>
              <p style={{fontSize:10,fontWeight:900,color:'#9A3412',letterSpacing:'0.1em',textTransform:'uppercase' as const,margin:'0 0 11px'}}>
                💳 {lang==='ar'?'طريقة الدفع':lang==='en'?'Payment method':'Mode de paiement'}
              </p>
              <SharedPaymentOptions lang={lang} selected={motoPayMethod} onSelect={setMotoPayMethod} showCash showCard={false} onWalletPay={handleMotoWalletPay}/>
            </div>
            {prixProposeMoto&&(
              <div style={{borderRadius:14,padding:'12px 16px',background:`linear-gradient(135deg,${isTaxi?'rgba(180,83,9,0.12),rgba(245,158,11,0.06)':'rgba(234,88,12,0.12),rgba(249,115,22,0.06)'})`,border:`1px solid ${isTaxi?'rgba(180,83,9,0.3)':'rgba(234,88,12,0.3)'}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontSize:12,fontWeight:700,color:'var(--c-text)'}}>{vEmoji} {lang==='en'?'Your offer':lang==='ar'?'عرضك':'Votre offre'}</span>
                <div style={{textAlign:'right' as const}}>
                  <span style={{fontSize:22,fontWeight:900,color:isTaxi?'#D97706':'#EA580C'}}>{Math.max(0,parseFloat(prixProposeMoto||'0')-motoGemMAD)} DH</span>
                  {motoGemMAD>0&&<p style={{fontSize:10,color:'#4ADE80',margin:0}}>-{motoGemMAD} MAD 💎</p>}
                </div>
              </div>
            )}
            <button onClick={()=>{if(!motoPayMethod){setFormErr('*pay');return;}handleMotoBook();}} disabled={sending}
              style={{width:'100%',padding:'16px',borderRadius:18,border:'none',background:sending?'#9CA3AF':vGrad,color:'white',fontWeight:900,fontSize:15,boxShadow:sending?'none':`0 8px 28px ${isTaxi?'rgba(180,83,9,0.45)':'rgba(234,88,12,0.45)'}`,cursor:sending?'wait':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              {sending?<>⏳ {lang==='ar'?'جاري الإرسال…':lang==='en'?'Sending…':'Envoi en cours…'}</>
                :<>{vEmoji} {lang==='ar'?'احجز الآن':lang==='amz'?'ⵙⵖⵏ':lang==='en'?'Book Now':'Réserver maintenant'}</>}
            </button>
          </div>
        </div>
      )}
      {bookingRef&&(
        <div style={{position:'absolute',bottom:0,left:0,right:0,zIndex:30,borderRadius:'26px 26px 0 0',background:'var(--c-card)',boxShadow:'0 -12px 50px rgba(0,0,0,0.65)',border:'1px solid rgba(154,52,18,0.15)',borderBottom:'none',padding:'14px 20px 40px'}}>
          <div style={{display:'flex',justifyContent:'center',marginBottom:12}}>
            <div style={{width:36,height:4,borderRadius:2,background:'rgba(154,52,18,0.22)'}}/>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:12}}>
            <div style={{width:11,height:11,borderRadius:'50%',background:statusColor,flexShrink:0,animation:'pulse 1.5s infinite'}}/>
            <p style={{fontWeight:900,fontSize:15,color:statusColor,flex:1,margin:0}}>
              {statusLabel||{fr:'Recherche d\'un motard…',en:'Finding a rider…',ar:'البحث عن سائق موتو…',amz:'ⵔⴰⴷ ⵉⴼⴼⵖⵏ ⵓⵙⵔⴰⵜⵏ…'}[lang]}
            </p>
            {trackData?.eta&&<span style={{fontSize:13,fontWeight:900,color:'#F97316',flexShrink:0}}>⏱ {trackData.eta} min</span>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:14,background:'var(--c-bg)',border:'1px solid var(--c-border)',marginBottom:12}}>
            <span style={{fontSize:24}}>{vEmoji}</span>
            <div style={{flex:1}}>
              <p style={{fontSize:13,fontWeight:700,color:'var(--c-text)',margin:'0 0 1px'}}>{trackData?.driverName||vServiceName}</p>
              <p style={{fontSize:10,color:'#9CA3AF',margin:0}}>Réf: <strong style={{color:'var(--c-text)'}}>{bookingRef}</strong></p>
            </div>
            {trackData?.status==='arrived'&&<span style={{fontSize:20}}>🎉</span>}
          </div>
          {trackData?.status==='arrived'&&(
            <div style={{borderRadius:12,padding:'10px 14px',background:'#EFF6FF',border:'1px solid #BFDBFE',textAlign:'center' as const,marginBottom:12}}>
              <p style={{fontWeight:900,color:'#1D4ED8',fontSize:13,margin:0}}>🎉 {lang==='ar'?'وصل سائقك!':lang==='en'?'Driver has arrived!':'Votre motard est là !'}</p>
            </div>
          )}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <button onClick={()=>{setBookingRef('');localStorage.removeItem(vLocalKey);setTrackData(null);}}
              style={{padding:'11px',borderRadius:14,border:'none',background:'#FEE2E2',color:'#DC2626',fontWeight:900,fontSize:13,cursor:'pointer'}}>
              ✕ {lang==='ar'?'إلغاء':lang==='en'?'Cancel':'Annuler'}
            </button>
            <button onClick={()=>{if(trackIntervalRef.current){clearInterval(trackIntervalRef.current);trackIntervalRef.current=null;}fetch(`/api/tracking/${bookingRef}`).then(r=>r.ok?r.json():null).then(d=>{if(d)setTrackData(d);}).catch(()=>{});const r=window.setInterval(async()=>{try{const res=await fetch(`/api/tracking/${bookingRef}`);if(res.ok)setTrackData(await res.json());}catch{}},20000);trackIntervalRef.current=r;}}
              style={{padding:'11px',borderRadius:14,border:'none',background:'#D1FAE5',color:'#065F46',fontWeight:900,fontSize:13,cursor:'pointer'}}>
              ↺ {lang==='ar'?'تحديث':lang==='en'?'Refresh':'Actualiser'}
            </button>
          </div>
          {trackData?.driverPrice&&!acceptedDriverOfferMoto&&(
            <div style={{marginTop:12,borderRadius:14,padding:'12px 14px',background:'linear-gradient(135deg,#FFF7ED,#FED7AA)',border:'1.5px solid #F97316'}}>
              <p style={{fontWeight:900,color:'#7C2D12',fontSize:13,margin:'0 0 8px'}}>
                🛵 {lang==='ar'?'المرسال يقترح':lang==='en'?'Rider offers':'Le motard propose'} <strong style={{fontSize:17}}>{trackData.driverPrice} DH</strong>
              </p>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>setAcceptedDriverOfferMoto(true)}
                  style={{flex:1,padding:'9px',borderRadius:10,border:'none',background:'#10B981',color:'white',fontWeight:900,fontSize:13,cursor:'pointer'}}>
                  ✓ {lang==='ar'?'قبول':lang==='en'?'Accept':'Accepter'}
                </button>
                <button onClick={()=>setAcceptedDriverOfferMoto(false)}
                  style={{flex:1,padding:'9px',borderRadius:10,border:'none',background:'#EF4444',color:'white',fontWeight:900,fontSize:13,cursor:'pointer'}}>
                  ✕ {lang==='ar'?'رفض':lang==='en'?'Decline':'Refuser'}
                </button>
              </div>
            </div>
          )}
          {acceptedDriverOfferMoto&&trackData?.driverPrice&&(
            <div style={{marginTop:12,borderRadius:14,padding:'10px 14px',background:'#D1FAE5',border:'1.5px solid #10B981',textAlign:'center' as const}}>
              <p style={{fontWeight:900,color:'#065F46',fontSize:13,margin:0}}>
                ✅ {lang==='ar'?'تم الاتفاق على':lang==='en'?'Agreed price:':'Prix accepté :'} <strong>{trackData.driverPrice} DH</strong>
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── COURSE TERMINÉE overlay ── */}
      {trackData?.status==='completed'&&bookingRef&&(
        <div style={{position:'absolute',inset:0,zIndex:60,background:'linear-gradient(180deg,#0c0a04 0%,#1a1205 60%,#0c0a04 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px'}}>
          <div style={{fontSize:80,marginBottom:16,filter:'drop-shadow(0 0 30px rgba(249,115,22,0.6))'}}>✅</div>
          <h2 style={{color:'#FED7AA',fontWeight:900,fontSize:26,margin:'0 0 8px',textAlign:'center',textShadow:'0 0 20px rgba(249,115,22,0.4)'}}>
            {lang==='ar'?'وصلت بسلامة !':lang==='en'?'You arrived safely!':lang==='amz'?'ⵜⴰⵍⴰ ⵢⵓⵙ !':'Vous êtes arrivé(e) !'}
          </h2>
          <p style={{color:'rgba(255,255,255,0.5)',fontSize:13,textAlign:'center',margin:'0 0 28px',maxWidth:260}}>
            {lang==='en'?`Thank you for choosing ${vServiceName}`:lang==='ar'?`شكراً لاختيارك ${vServiceName}`:`Merci d'avoir choisi ${vServiceName}`}
          </p>
          <div style={{background:'rgba(255,255,255,0.06)',borderRadius:20,padding:'18px 28px',width:'100%',maxWidth:300,marginBottom:24,textAlign:'center',border:`1px solid ${isTaxi?'rgba(245,158,11,0.15)':'rgba(249,115,22,0.15)'}`}}>
            <p style={{color:'rgba(255,255,255,0.35)',fontSize:10,fontWeight:700,letterSpacing:'0.18em',margin:'0 0 5px'}}>RÉFÉRENCE DE COURSE</p>
            <p style={{color:isTaxi?'#F59E0B':'#F97316',fontWeight:900,fontSize:22,margin:'0 0 8px'}}>{bookingRef}</p>
            {trackData?.driverName&&<p style={{color:'rgba(255,255,255,0.6)',fontSize:13,margin:0}}>{vEmoji} {trackData.driverName}</p>}
          </div>
          <div style={{marginBottom:28,textAlign:'center'}}>
            <p style={{color:'rgba(255,255,255,0.35)',fontSize:10,letterSpacing:'0.15em',marginBottom:10}}>
              {lang==='en'?'RATE YOUR RIDE':lang==='ar'?'قيّم رحلتك':'NOTEZ VOTRE COURSE'}
            </p>
            <div style={{display:'flex',gap:6,justifyContent:'center'}}>
              {[1,2,3,4,5].map(s=>(
                <button key={s} onClick={()=>setMotoRating(s)} style={{fontSize:32,background:'none',border:'none',cursor:'pointer',opacity:s<=motoRating?1:0.2,transition:'opacity 0.15s',padding:2,lineHeight:1}}>⭐</button>
              ))}
            </div>
          </div>
          <button onClick={()=>{setBookingRef('');localStorage.removeItem(vLocalKey);setTrackData(null);setMotoRating(0);}}
            style={{width:'100%',maxWidth:300,padding:'16px',borderRadius:18,border:'none',background:vGrad,color:'white',fontWeight:900,fontSize:15,cursor:'pointer',boxShadow:`0 8px 28px ${isTaxi?'rgba(245,158,11,0.45)':'rgba(249,115,22,0.45)'}`}}>
            {vEmoji} {lang==='en'?'New ride':lang==='ar'?'رحلة جديدة':'Nouvelle course'}
          </button>
        </div>
      )}

      {showProfile&&<ProfileModal lang={lang} profile={profile} onSave={saveProfile} onClose={()=>setShowProfile(false)}/>}
      {showMotoQR&&<QRPayModal lang={lang} onClose={()=>setShowMotoQR(false)} onConfirm={()=>setShowMotoQR(false)}/>}
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
  const getAuthHeaders=useAuthHeaders();

  const handleSave=async()=>{
    const updated={...profile,phone,address,onboardingComplete:true};
    saveProfile(updated);
    try{
      const h=await getAuthHeaders();
      await fetch('/api/profile/sync',{
        method:'POST',credentials:'include',
        headers:{...h,'Content-Type':'application/json'},
        body:JSON.stringify({phone:phone.trim(),name:profile.name.trim(),address:address.trim()}),
      });
    }catch{}
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
          <img src="/logo_splash_new.png" alt="Bridge" style={{width:'100%',height:'100%',objectFit:'contain'}}/>
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
          background:'var(--c-bg)',border:'2px solid #E5E1D8',borderRadius:20,padding:16,marginBottom:14,
          boxShadow:'0 6px 24px rgba(6,95,70,0.08)'
        }}>
          <Field label={t.onboardPhone} value={phone} onChange={setPhone}
            placeholder="06 00 00 00 00" type="tel" lang={lang}/>
        </div>

        <div style={{
          background:'var(--c-bg)',border:'2px solid #E5E1D8',borderRadius:20,padding:16,marginBottom:14,
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

      </div>
    </div>
  );
}

function SplashScreen() {
  const [progress,setProgress]=useState(0);
  const [phase,setPhase]=useState(0); // 0-3 cycling through services
  const services=[
    {icon:'🛵',label:'Bridge Eats',color:'#4ADE80'},
    {icon:'🚖',label:'Bridge Taxi',color:'#FDE047'},
    {icon:'🚬',label:'Bridge Tabac',color:'#FB923C'},
    {icon:'🌹',label:'Bridge Fleurs',color:'#F472B6'},
  ];
  useEffect(()=>{const iv=setInterval(()=>setProgress(p=>Math.min(p+1.6,100)),50);return()=>clearInterval(iv);},[]);
  useEffect(()=>{const iv=setInterval(()=>setPhase(p=>(p+1)%4),900);return()=>clearInterval(iv);},[]);
  const svc=services[phase];

  return (
    <div style={{position:'fixed',inset:0,zIndex:50,overflow:'hidden',
      background:'#000',
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>

      <style>{`
        @keyframes splashRing1{0%,100%{transform:scale(1);opacity:0.5;}50%{transform:scale(1.15);opacity:0.15;}}
        @keyframes splashRing2{0%,100%{transform:scale(1);opacity:0.3;}50%{transform:scale(1.25);opacity:0.08;}}
        @keyframes splashRing3{0%,100%{transform:scale(1);opacity:0.15;}50%{transform:scale(1.35);opacity:0.04;}}
        @keyframes splashLogoFloat{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
        @keyframes splashOrbit1{0%{transform:rotate(0deg) translateX(118px) rotate(0deg);}100%{transform:rotate(360deg) translateX(118px) rotate(-360deg);}}
        @keyframes splashOrbit2{0%{transform:rotate(90deg) translateX(118px) rotate(-90deg);}100%{transform:rotate(450deg) translateX(118px) rotate(-450deg);}}
        @keyframes splashOrbit3{0%{transform:rotate(180deg) translateX(118px) rotate(-180deg);}100%{transform:rotate(540deg) translateX(118px) rotate(-540deg);}}
        @keyframes splashOrbit4{0%{transform:rotate(270deg) translateX(118px) rotate(-270deg);}100%{transform:rotate(630deg) translateX(118px) rotate(-630deg);}}
        @keyframes splashLetterIn{0%{opacity:0;transform:translateY(24px);}100%{opacity:1;transform:translateY(0);}}
        @keyframes splashGlow{0%,100%{box-shadow:0 0 40px rgba(6,95,70,0.6),0 0 80px rgba(6,95,70,0.2);}50%{box-shadow:0 0 60px rgba(6,95,70,0.9),0 0 120px rgba(6,95,70,0.35),0 0 200px rgba(6,95,70,0.1);}}
        @keyframes splashBarShimmer{0%{background-position:200% center;}100%{background-position:-200% center;}}
        @keyframes splashServiceFade{0%{opacity:0;transform:translateY(6px);}20%,80%{opacity:1;transform:translateY(0);}100%{opacity:0;transform:translateY(-6px);}}
        @keyframes splashStarPulse{0%,100%{opacity:0.6;transform:scale(1);}50%{opacity:1;transform:scale(1.4);}}
        @keyframes splashMeshMove{0%{transform:translateX(0) translateY(0);}50%{transform:translateX(-20px) translateY(-10px);}100%{transform:translateX(0) translateY(0);}}
      `}</style>

      {/* Animated mesh background */}
      <div style={{position:'absolute',inset:0,opacity:0.06,animation:'splashMeshMove 8s ease-in-out infinite',
        backgroundImage:'radial-gradient(circle at 1px 1px,rgba(255,255,255,0.8) 1px,transparent 0)',
        backgroundSize:'32px 32px',pointerEvents:'none'}}/>

      {/* Ambient light blobs */}
      <div style={{position:'absolute',top:'15%',left:'10%',width:280,height:280,borderRadius:'50%',
        background:'radial-gradient(circle,rgba(6,95,70,0.18) 0%,transparent 70%)',filter:'blur(40px)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:'20%',right:'5%',width:220,height:220,borderRadius:'50%',
        background:'radial-gradient(circle,rgba(217,197,160,0.12) 0%,transparent 70%)',filter:'blur(50px)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',top:'60%',left:'30%',width:160,height:160,borderRadius:'50%',
        background:'radial-gradient(circle,rgba(74,222,128,0.08) 0%,transparent 70%)',filter:'blur(30px)',pointerEvents:'none'}}/>

      {/* Star particles */}
      {[[8,'12%','18%',0],[5,'85%','25%',0.4],[6,'20%','75%',0.8],[4,'75%','70%',0.2],[7,'50%','10%',0.6],[4,'35%','88%',1.1]].map(([s,l,t,d],i)=>(
        <div key={i} style={{position:'absolute',left:l as string,top:t as string,width:s as number,height:s as number,
          borderRadius:'50%',background:'rgba(255,255,255,0.7)',
          animation:`splashStarPulse ${1.5+Number(d)}s ease-in-out ${d}s infinite`}}/>
      ))}

      {/* Center content */}
      <div style={{position:'relative',display:'flex',flexDirection:'column',alignItems:'center'}}>

        {/* Logo + orbiting service icons */}
        <div style={{position:'relative',width:200,height:200,marginBottom:32}}>

          {/* Ring 3 — outermost */}
          <div style={{position:'absolute',inset:-44,borderRadius:'50%',border:'1px solid rgba(6,95,70,0.25)',
            animation:'splashRing3 3s ease-in-out infinite 0.6s'}}/>
          {/* Ring 2 */}
          <div style={{position:'absolute',inset:-22,borderRadius:'50%',border:'1px solid rgba(6,95,70,0.4)',
            animation:'splashRing2 3s ease-in-out infinite 0.3s'}}/>
          {/* Ring 1 — innermost */}
          <div style={{position:'absolute',inset:-8,borderRadius:'50%',border:'1.5px solid rgba(217,197,160,0.35)',
            animation:'splashRing1 3s ease-in-out infinite'}}/>

          {/* Orbiting service icons */}
          {[
            {icon:'🛵',anim:'splashOrbit1',delay:'0s'},
            {icon:'🚖',anim:'splashOrbit2',delay:'0s'},
            {icon:'🚬',anim:'splashOrbit3',delay:'0s'},
            {icon:'🌹',anim:'splashOrbit4',delay:'0s'},
          ].map((o,i)=>(
            <div key={i} style={{position:'absolute',top:'50%',left:'50%',width:0,height:0}}>
              <div style={{position:'absolute',transform:`rotate(${i*90}deg) translateX(118px) rotate(-${i*90}deg)`,
                animation:`${o.anim} 8s linear infinite ${o.delay}`,
                width:36,height:36,marginLeft:-18,marginTop:-18,
                background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.15)',
                borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:16,backdropFilter:'blur(4px)'}}>
                {o.icon}
              </div>
            </div>
          ))}

          {/* Logo circle */}
          <div style={{position:'absolute',inset:0,borderRadius:'50%',overflow:'hidden',
            border:'3px solid #D9C5A0',
            animation:'splashLogoFloat 4s ease-in-out infinite, splashGlow 4s ease-in-out infinite'}}>
            <img src="/logo_splash_new.png" alt="Bridge"
              style={{width:'100%',height:'100%',objectFit:'contain'}}/>
          </div>

          {/* Premium badge */}
          <div style={{position:'absolute',bottom:-10,left:'50%',transform:'translateX(-50%)',
            background:'linear-gradient(135deg,#065F46,#059669)',
            borderRadius:999,padding:'4px 12px',
            boxShadow:'0 4px 16px rgba(6,95,70,0.5)',display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap'}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:'#4ADE80',boxShadow:'0 0 6px #4ADE80'}}/>
            <span style={{color:'#fff',fontSize:9,fontWeight:900,letterSpacing:'0.2em'}}>BRIDGE SAFI</span>
          </div>
        </div>

        {/* Brand letters with staggered animation */}
        <div style={{display:'flex',gap:6,marginBottom:10}}>
          {'BRIDGE'.split('').map((letter,i)=>(
            <span key={i} style={{
              fontSize:36,fontWeight:900,letterSpacing:2,
              color:'#fff',
              textShadow:'0 0 30px rgba(6,95,70,0.8)',
              animation:`splashLetterIn 0.5s ease-out ${i*0.07}s both`,
              display:'inline-block',
            }}>{letter}</span>
          ))}
        </div>

        {/* Location tags */}
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:24}}>
          {['SAFI','MAROC','آسفي','ⵙⴰⴼⵉ'].map((city,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:9,fontWeight:800,letterSpacing:'0.2em',color:'#D9C5A0'}}>{city}</span>
              {i<3 && <div style={{width:3,height:3,borderRadius:'50%',background:'#065F46'}}/>}
            </div>
          ))}
        </div>

        {/* Active service indicator */}
        <div key={phase} style={{
          display:'flex',alignItems:'center',gap:8,
          background:'rgba(255,255,255,0.04)',border:`1px solid ${svc.color}40`,
          borderRadius:999,padding:'6px 16px',marginBottom:28,
          animation:'splashServiceFade 0.9s ease-in-out both',
        }}>
          <span style={{fontSize:14}}>{svc.icon}</span>
          <span style={{color:svc.color,fontSize:11,fontWeight:800,letterSpacing:'0.1em'}}>{svc.label}</span>
          <div style={{width:6,height:6,borderRadius:'50%',background:svc.color,boxShadow:`0 0 8px ${svc.color}`}}/>
        </div>

        {/* Progress bar */}
        <div style={{width:220,position:'relative',marginBottom:8}}>
          <div style={{height:3,borderRadius:999,background:'rgba(255,255,255,0.08)',overflow:'hidden'}}>
            <div style={{
              height:'100%',borderRadius:999,
              width:`${progress}%`,
              background:'linear-gradient(90deg,#065F46,#4ADE80,#D9C5A0)',
              backgroundSize:'200% 100%',
              animation:'splashBarShimmer 1.5s linear infinite',
              transition:'width 0.08s linear',
            }}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
            <span style={{color:'rgba(255,255,255,0.2)',fontSize:8,fontWeight:700,letterSpacing:'0.25em'}}>CHARGEMENT</span>
            <span style={{color:'rgba(255,255,255,0.35)',fontSize:8,fontWeight:900}}>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

type Page = 'home'|'restaurant'|'tracking'|'simple-tracking'|'contact';
const LANG_CYCLE:Lang[]=['fr','en','ar','amz'];
const LANG_LABELS:Record<Lang,string>={fr:'FR',en:'EN',ar:'AR',amz:'ⴰⵎⵣ'};

const NAV_KEY='bridge_nav_state';
// ─── FLEURS PAGE ──────────────────────────────────────────────────────────────

type FleurItem={id:string;img:string;emoji:string;names:Record<Lang,string>;price:number;florist:'nour'|'amina'};
const FLEURS_CATALOG:FleurItem[]=[
  // ── Nour Fleurs ── bouquets & coffrets
  {id:'n1',img:'/fleurs/fl_01.png',emoji:'🌹',florist:'nour',price:80,  names:{fr:'Bouquet Roses Mixtes',      en:'Mixed Roses Bouquet',       ar:'باقة ورود مشكلة',          amz:'ⴰⵥⴰⵡⴰⵏ ⵏ ⵉⴳⵍⴰⴷ'}},
  {id:'n2',img:'/fleurs/fl_02.png',emoji:'🤍',florist:'nour',price:90,  names:{fr:'Bouquet Blanc & Rose',       en:'White & Pink Bouquet',       ar:'باقة بيضاء وردية',         amz:'ⴰⵥⴰⵡⴰⵏ ⴰⵎⵍⵍⴰⵍ'}},
  {id:'n3',img:'/fleurs/fl_03.png',emoji:'🌸',florist:'nour',price:75,  names:{fr:'Bouquet Roses Tendres',      en:'Soft Pink Roses',            ar:'باقة ورود وردية',          amz:'ⴰⵥⴰⵡⴰⵏ ⵏ ⵉⴳⵍⴰⴷ ⵉⵡⵔⵉⵖⵏ'}},
  {id:'n4',img:'/fleurs/fl_05.png',emoji:'💐',florist:'nour',price:150, names:{fr:'Grand Bouquet Luxe',          en:'Luxury Large Bouquet',       ar:'باقة فاخرة كبيرة',         amz:'ⴰⵥⴰⵡⴰⵏ ⴰⵎⵇⵔⴰⵏ'}},
  {id:'n5',img:'/fleurs/fl_07.png',emoji:'❤️',florist:'nour',price:120, names:{fr:'Coffret Cœur Roses',         en:'Heart Rose Box',             ar:'علبة قلب ورود',            amz:'ⴰⵙⴷⴰⵙ ⵏ ⵓⵍ'}},
  {id:'n6',img:'/fleurs/fl_11.png',emoji:'🎁',florist:'nour',price:130, names:{fr:'Box Roses Élégance',          en:'Elegance Rose Box',          ar:'علبة ورود أناقة',          amz:'ⴰⵙⴷⴰⵙ ⵏ ⵉⴳⵍⴰⴷ'}},
  {id:'n7',img:'/fleurs/fl_12.png',emoji:'🎀',florist:'nour',price:180, names:{fr:'Box Prestige Nœud Or',        en:'Gold Bow Prestige Box',      ar:'علبة فاخرة ذهبية',         amz:'ⴰⵙⴷⴰⵙ ⵏ ⵓⵔ'}},
  // ── Amina Blooms ── arrangements créatifs
  {id:'a1',img:'/fleurs/fl_08.png',emoji:'🌷',florist:'amina',price:85, names:{fr:'Bouquet Lavande & Blanc',     en:'Lavender & White',           ar:'باقة بنفسجية بيضاء',       amz:'ⴰⵥⴰⵡⴰⵏ ⴰⵣⴳⵣⴰⵡ'}},
  {id:'a2',img:'/fleurs/fl_09.png',emoji:'🌹',florist:'amina',price:80, names:{fr:'Bouquet Bordeaux Profond',    en:'Deep Bordeaux Roses',        ar:'باقة ورود عنابية',         amz:'ⴰⵥⴰⵡⴰⵏ ⴰⵣⴳⴳⴰⵖ'}},
  {id:'a3',img:'/fleurs/fl_06.png',emoji:'🍫',florist:'amina',price:140,names:{fr:'Bouquet Ferrero Rocher',       en:'Ferrero Rocher Bouquet',     ar:'باقة فريرو روشيه',         amz:'ⴰⵥⴰⵡⴰⵏ ⵏ ⵉⵡⵙⴽⵉⵡⵏ'}},
  {id:'a4',img:'/fleurs/fl_04.png',emoji:'🍫',florist:'amina',price:160,names:{fr:'Arrangement Ferrero & Roses',  en:'Ferrero & Roses Arrangement',ar:'تنسيق فريرو وورود',         amz:'ⴰⵔⴰⵜⵉⴱ ⵏ ⵉⴳⵍⴰⴷ'}},
  {id:'a5',img:'/fleurs/fl_10.png',emoji:'💙',florist:'amina',price:110,names:{fr:'Arrangement Roses Bleues',     en:'Blue Roses Arrangement',     ar:'تنسيق ورود زرقاء',         amz:'ⴰⵔⴰⵜⵉⴱ ⵏ ⵉⴳⵍⴰⴷ ⵉⵣⵣⴳⴳⴰⵏ'}},
];

function FleurPage({onBack,lang,cycleLang,profile,saveProfile,onOrderSuccess}:{
  onBack:()=>void; lang:Lang; cycleLang:()=>void;
  profile:UserProfile; saveProfile:(p:UserProfile)=>void;
  onOrderSuccess?:(ref:string)=>void;
}) {
  const [,navigateFleur]=useLocation();
  const [activeFlorist,setActiveFlorist]=useState<'nour'|'amina'|null>(null);
  const [cart,setCart]=useState<{id:string;qty:number}[]>([]);
  const [step,setStep]=useState<'florist'|'catalog'|'checkout'|'track'>('florist');
  const [lastRef,setLastRef]=useState<string>(()=>localStorage.getItem('bridge_fleurs_last_ref')||'');
  const [trackStage,setTrackStage]=useState(0);
  const [sending,setSending]=useState(false);
  const [orderRef]=useState(()=>`FL-${Math.floor(1000+Math.random()*9000)}`);
  const [resName,setResName]=useState(profile.name||'');
  const [resPhone,setResPhone]=useState(profile.phone||'');
  const [resAddr,setResAddr]=useState(profile.address||'');
  const [resDate,setResDate]=useState('');
  const [resTime,setResTime]=useState('');
  const [resMode,setResMode]=useState<'retrait'|'livraison'>('retrait');
  const [err,setErr]=useState('');
  const isAR=lang==='ar'; const fClass=fontClass(lang);
  const LANG_LABELS:Record<Lang,string>={fr:'FR',en:'EN',ar:'AR',amz:'ⴰⵎⵣ'};

  const catalogItems=activeFlorist?FLEURS_CATALOG.filter(f=>f.florist===activeFlorist):[];
  const addItem=(id:string)=>setCart(c=>{const ex=c.find(x=>x.id===id);return ex?c.map(x=>x.id===id?{...x,qty:x.qty+1}:x):[...c,{id,qty:1}];});
  const removeItem=(id:string)=>setCart(c=>{const ex=c.find(x=>x.id===id);if(!ex)return c;if(ex.qty===1)return c.filter(x=>x.id!==id);return c.map(x=>x.id===id?{...x,qty:x.qty-1}:x);});
  const cartTotal=cart.reduce((s,ci)=>{const p=FLEURS_CATALOG.find(f=>f.id===ci.id);return s+(p?p.price*ci.qty:0);},0);
  const cartCount=cart.reduce((s,ci)=>s+ci.qty,0);

  useEffect(()=>{
    if(!lastRef) return;
    const poll=async()=>{try{const r=await fetch(`/api/tracking/${lastRef}`,{cache:'no-store'});if(r.ok){const d=await r.json();if(d.found){const m:{[k:string]:number}={received:0,preparing:1,on_way:2,delivered:3};if(d.status&&m[d.status]!==undefined)setTrackStage(m[d.status]);}}}catch(_){}};
    poll();const iv=setInterval(poll,4000);return()=>clearInterval(iv);
  },[lastRef]);

  const minDate=()=>{const d=new Date();d.setDate(d.getDate()+1);return d.toISOString().split('T')[0];};

  const handleReserve=async()=>{
    if(!resName.trim()||!resPhone.trim()||!resDate||!resTime||(resMode==='livraison'&&!resAddr.trim())){setErr('*');return;}
    setSending(true);
    const items=cart.map(ci=>{const p=FLEURS_CATALOG.find(f=>f.id===ci.id)!;return{name:p.names.fr,qty:ci.qty,price:p.price};});
    const floristName=activeFlorist==='nour'?'Nour Fleurs':'Amina Blooms';
    const delivAddr=resMode==='retrait'?`${floristName} — Retrait sur place`:`${resAddr.trim()}, Safi, Maroc`;
    try{
      await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ref:orderRef,service:'fleurs',customerName:resName.trim(),customerPhone:resPhone.trim(),customerAddress:delivAddr,items,total:cartTotal,deliveryMode:resMode,paymentMethod:'cash',restaurantName:`Bridge Fleurs — ${floristName}`,notes:`📅 ${resDate} · ⏰ ${resTime}`}),
      }).catch(()=>{});
    }finally{setSending(false);}
    setLastRef(orderRef);
    try{localStorage.setItem('bridge_fleurs_last_ref',orderRef);}catch{}
    setTrackStage(0);setStep('track');
    onOrderSuccess?.(orderRef);
  };

  const nourGrad='linear-gradient(135deg,#BE185D,#EC4899)';
  const aminaGrad='linear-gradient(135deg,#7C3AED,#A855F7)';
  const activeGrad=activeFlorist==='nour'?nourGrad:aminaGrad;
  const activeDark=activeFlorist==='nour'?'#BE185D':'#7C3AED';
  const activeBg=activeFlorist==='nour'?'#FFF0F6':'#F5F3FF';
  const activeBorder=activeFlorist==='nour'?'#FCE7F3':'#EDE9FE';

  const trackStages=lang==='ar'
    ?['تم تأكيد الحجز','جاري التحضير','في الطريق إليك','تم التسليم']
    :lang==='en'?['Reservation confirmed','Preparing your order','On the way','Delivered']
    :['Réservation confirmée','Préparation en cours','En route','Livré 🌹'];

  const goBack=()=>{
    if(step==='checkout') setStep('catalog');
    else if(step==='catalog') {setStep('florist');setActiveFlorist(null);}
    else onBack();
  };

  return(
    <div className={`min-h-screen flex flex-col ${isAR?'rtl':'ltr'}`}
      style={{background:'linear-gradient(160deg,#FDF4FF 0%,#FAF5FF 50%,#FFF1F2 100%)',minHeight:'100dvh'}}>
      <div className="fixed inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse at 15% 15%,rgba(168,85,247,0.07) 0%,transparent 50%),radial-gradient(ellipse at 85% 85%,rgba(236,72,153,0.07) 0%,transparent 50%)'}}/>

      {/* Top nav */}
      <div style={{position:'fixed',top:16,left:isAR?'auto':16,right:isAR?16:'auto',zIndex:50}}>
        <button onClick={goBack} style={{width:38,height:38,borderRadius:'50%',border:'none',cursor:'pointer',background:'rgba(124,58,237,0.12)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',color:'#7C3AED',fontSize:18}}>←</button>
      </div>
      <div style={{position:'fixed',top:16,right:isAR?'auto':16,left:isAR?16:'auto',zIndex:50,display:'flex',alignItems:'center',gap:8}}>
        <button onClick={cycleLang} style={{width:38,height:38,borderRadius:'50%',border:'none',cursor:'pointer',background:'rgba(124,58,237,0.15)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',color:'#7C3AED',fontSize:11,fontWeight:900}}>{LANG_LABELS[lang]}</button>
        <SharkDiamondWidget onNavigate={()=>navigateFleur('/game')} profile={profile}/>
      </div>

      <div className="flex-1 overflow-y-auto pb-36">

        {/* ── STEP 1: CHOIX FLEURISTE ── */}
        {step==='florist'&&(
          <div className="px-5 pt-20">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-2">
                <span style={{fontSize:40}}>🌸</span>
                <div className="text-left">
                  <h1 className="font-black text-2xl tracking-tight" style={{background:'linear-gradient(135deg,#BE185D,#7C3AED)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Bridge Fleurs</h1>
                  <p className="text-[10px] font-black tracking-widest" style={{color:'#A855F7'}}>RÉSERVATION · سافي · SAFI</p>
                </div>
              </div>
              <p className={`text-sm font-semibold mt-1 ${fClass}`} style={{color:'#6B7280'}}>
                {lang==='ar'?'اختر محل الزهور':lang==='en'?'Choose your florist':'Choisissez votre fleuriste'}
              </p>
            </div>

            <div className="flex flex-col gap-5 mb-6">
              {/* Nour Fleurs */}
              <button onClick={()=>{setActiveFlorist('nour');setCart([]);setStep('catalog');}}
                className="rounded-3xl overflow-hidden text-left transition-all active:scale-[0.97]"
                style={{boxShadow:'0 12px 40px rgba(190,24,93,0.22),0 0 0 2px rgba(236,72,153,0.25)',background:'white'}}>
                <div style={{background:nourGrad,padding:'22px 20px 16px',position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:-30,right:-30,width:120,height:120,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
                  <div style={{position:'absolute',top:12,right:12,width:70,height:70,borderRadius:'50%',background:'rgba(255,255,255,0.07)'}}/>
                  <span style={{fontSize:44,display:'block',position:'relative'}}>🌹</span>
                  <p className="font-black text-2xl text-white mt-1" style={{position:'relative'}}>Nour Fleurs</p>
                  <p style={{color:'rgba(255,255,255,0.8)',fontSize:11,fontWeight:700,position:'relative'}}>
                    {lang==='ar'?'بوكيهات وصناديق · سافي':lang==='en'?'Bouquets & Boxes · Safi':'Bouquets & Coffrets · Safi'}
                  </p>
                </div>
                <div className="px-5 py-3 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {FLEURS_CATALOG.filter(f=>f.florist==='nour').slice(0,4).map(f=>(
                      <img key={f.id} src={f.img} alt="" style={{width:34,height:34,objectFit:'contain',borderRadius:8,background:'#FFF0F6',border:'1.5px solid #FCE7F3'}}/>
                    ))}
                    <div style={{width:34,height:34,borderRadius:8,background:'#FCE7F3',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900,color:'#BE185D'}}>+{FLEURS_CATALOG.filter(f=>f.florist==='nour').length-4}</div>
                  </div>
                  <div style={{width:32,height:32,borderRadius:'50%',background:nourGrad,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:16,boxShadow:'0 4px 12px rgba(190,24,93,0.4)'}}>→</div>
                </div>
              </button>

              {/* Amina Blooms */}
              <button onClick={()=>{setActiveFlorist('amina');setCart([]);setStep('catalog');}}
                className="rounded-3xl overflow-hidden text-left transition-all active:scale-[0.97]"
                style={{boxShadow:'0 12px 40px rgba(124,58,237,0.22),0 0 0 2px rgba(168,85,247,0.25)',background:'white'}}>
                <div style={{background:aminaGrad,padding:'22px 20px 16px',position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:-30,right:-30,width:120,height:120,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
                  <div style={{position:'absolute',top:12,right:12,width:70,height:70,borderRadius:'50%',background:'rgba(255,255,255,0.07)'}}/>
                  <span style={{fontSize:44,display:'block',position:'relative'}}>💐</span>
                  <p className="font-black text-2xl text-white mt-1" style={{position:'relative'}}>Amina Blooms</p>
                  <p style={{color:'rgba(255,255,255,0.8)',fontSize:11,fontWeight:700,position:'relative'}}>
                    {lang==='ar'?'تنسيقات إبداعية · سافي':lang==='en'?'Creative Arrangements · Safi':'Arrangements créatifs · Safi'}
                  </p>
                </div>
                <div className="px-5 py-3 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {FLEURS_CATALOG.filter(f=>f.florist==='amina').slice(0,4).map(f=>(
                      <img key={f.id} src={f.img} alt="" style={{width:34,height:34,objectFit:'contain',borderRadius:8,background:'#F5F3FF',border:'1.5px solid #EDE9FE'}}/>
                    ))}
                  </div>
                  <div style={{width:32,height:32,borderRadius:'50%',background:aminaGrad,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:16,boxShadow:'0 4px 12px rgba(124,58,237,0.4)'}}>→</div>
                </div>
              </button>
            </div>

            {lastRef&&(
              <button onClick={()=>setStep('track')}
                className="w-full rounded-2xl p-4 flex items-center justify-between transition-all active:scale-95"
                style={{background:'white',boxShadow:'0 4px 20px rgba(0,0,0,0.07)',border:'1.5px solid #EDE9FE'}}>
                <div className="flex items-center gap-3">
                  <span style={{fontSize:26}}>📦</span>
                  <div className="text-left">
                    <p className="font-black text-sm" style={{color:'#7C3AED'}}>
                      {lang==='ar'?'تتبع حجزي':lang==='en'?'Track My Reservation':'Suivre ma réservation'}
                    </p>
                    <p className="text-[10px]" style={{color:'#9CA3AF'}}>#{lastRef}</p>
                  </div>
                </div>
                <span style={{color:'#A855F7',fontSize:20}}>→</span>
              </button>
            )}
          </div>
        )}

        {/* ── STEP 2: CATALOGUE ── */}
        {step==='catalog'&&activeFlorist&&(
          <div>
            <div className="pt-20 px-5 pb-3">
              <div className="flex items-center gap-2">
                <span style={{fontSize:24}}>{activeFlorist==='nour'?'🌹':'💐'}</span>
                <div>
                  <h2 className="font-black text-xl" style={{color:activeDark}}>{activeFlorist==='nour'?'Nour Fleurs':'Amina Blooms'}</h2>
                  <p className="text-[11px] font-semibold" style={{color:'#9CA3AF'}}>{catalogItems.length} {lang==='ar'?'منتج':lang==='en'?'products':'produits'}</p>
                </div>
              </div>
            </div>
            <div className="px-5">
              <div className="grid grid-cols-2 gap-3">
                {catalogItems.map(item=>{
                  const inCart=cart.find(c=>c.id===item.id);
                  return(
                    <div key={item.id} className="rounded-2xl overflow-hidden"
                      style={{background:'white',border:`1.5px solid ${activeBorder}`,boxShadow:'0 4px 16px rgba(0,0,0,0.06)'}}>
                      <div className="flex items-center justify-center overflow-hidden"
                        style={{height:120,background:`linear-gradient(135deg,${activeBg},white)`}}>
                        <img src={item.img} alt={item.names.fr} style={{width:'100%',height:'100%',objectFit:'contain'}}/>
                      </div>
                      <div className="p-3">
                        <p className={`font-black text-[11px] leading-tight mb-0.5 ${fClass}`} style={{color:activeDark==='#BE185D'?'#831843':'#4C1D95'}}>{item.names[lang]}</p>
                        <p className="font-black text-base mb-2" style={{color:activeDark}}>{item.price} MAD</p>
                        {!inCart?(
                          <button onClick={()=>addItem(item.id)}
                            className="w-full py-2 rounded-xl font-black text-[11px] text-white transition-all active:scale-95"
                            style={{background:activeGrad}}>
                            {lang==='ar'?'+ أضف':lang==='en'?'+ Add':'+ Ajouter'}
                          </button>
                        ):(
                          <div className="flex items-center justify-between">
                            <button onClick={()=>removeItem(item.id)} className="w-8 h-8 rounded-full font-black text-xl flex items-center justify-center transition-all active:scale-90" style={{background:activeBg,color:activeDark,border:'none',cursor:'pointer'}}>−</button>
                            <span className="font-black text-sm" style={{color:activeDark}}>{inCart.qty}</span>
                            <button onClick={()=>addItem(item.id)} className="w-8 h-8 rounded-full font-black text-xl flex items-center justify-center text-white transition-all active:scale-90" style={{background:activeGrad,border:'none',cursor:'pointer'}}>+</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: RÉSERVATION ── */}
        {step==='checkout'&&(
          <div className="px-5 pt-20 max-w-sm mx-auto">
            <h2 className="font-black text-2xl mb-0.5" style={{background:activeGrad,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              {lang==='ar'?'تأكيد الحجز':lang==='en'?'Reserve Now':'Réserver'}
            </h2>
            <p className="text-[12px] font-semibold mb-5" style={{color:'#9CA3AF'}}>{cartCount} article(s) · {cartTotal} MAD · {activeFlorist==='nour'?'Nour Fleurs':'Amina Blooms'}</p>

            {/* Résumé panier */}
            <div className="rounded-2xl p-4 mb-4" style={{background:'white',boxShadow:'0 4px 16px rgba(0,0,0,0.06)',border:`1.5px solid ${activeBorder}`}}>
              {cart.map(ci=>{const p=FLEURS_CATALOG.find(f=>f.id===ci.id)!;return(
                <div key={ci.id} className="flex items-center justify-between py-1.5">
                  <span className={`text-[12px] font-semibold flex-1 ${fClass}`} style={{color:'#374151'}}>{p.emoji} {p.names[lang]} ×{ci.qty}</span>
                  <span className="font-black text-[12px] ml-2" style={{color:activeDark}}>{p.price*ci.qty} MAD</span>
                </div>
              );})}
              <div className="mt-2 pt-2 flex justify-between" style={{borderTop:`1.5px solid ${activeBorder}`}}>
                <span className="font-black text-sm" style={{color:'#374151'}}>Total</span>
                <span className="font-black text-sm" style={{color:activeDark}}>{cartTotal} MAD</span>
              </div>
            </div>

            {/* Mode */}
            <div className="flex gap-2 mb-4">
              {([{k:'retrait',emoji:'🏪',label:{fr:'Retrait',en:'Pickup',ar:'استلام',amz:'ⴰⵙⵉⵔⵎ'}},{k:'livraison',emoji:'🛵',label:{fr:'Livraison',en:'Delivery',ar:'توصيل',amz:'ⴰⵙⵏⵙⴰⵢ'}}] as {k:'retrait'|'livraison';emoji:string;label:Record<Lang,string>}[]).map(opt=>(
                <button key={opt.k} onClick={()=>{setResMode(opt.k);setErr('');}}
                  className="flex-1 rounded-2xl p-3 font-black text-[12px] transition-all active:scale-95"
                  style={{background:resMode===opt.k?activeGrad:'white',color:resMode===opt.k?'white':'#6B7280',border:`2px solid ${resMode===opt.k?'transparent':'#E5E7EB'}`,boxShadow:resMode===opt.k?`0 4px 16px rgba(0,0,0,0.2)`:'none',cursor:'pointer'}}>
                  {opt.emoji} {opt.label[lang]}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{color:'#6B7280'}}>👤 {lang==='ar'?'الاسم':lang==='en'?'Name':'Nom'}</p>
                <input className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none" style={{background:'white',border:`1.5px solid ${err&&!resName.trim()?'#EF4444':'#E5E7EB'}`,color:'#111'}} placeholder={lang==='ar'?'اسمك…':lang==='en'?'Your name…':'Votre nom…'} value={resName} onChange={e=>{setResName(e.target.value);setErr('');}}/>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{color:'#6B7280'}}>📞 {lang==='ar'?'الهاتف':lang==='en'?'Phone':'Téléphone'}</p>
                <input className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none" style={{background:'white',border:`1.5px solid ${err&&!resPhone.trim()?'#EF4444':'#E5E7EB'}`,color:'#111'}} placeholder="06XXXXXXXX" type="tel" value={resPhone} onChange={e=>{setResPhone(e.target.value);setErr('');}}/>
              </div>
              {resMode==='livraison'&&(
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{color:'#6B7280'}}>📍 {lang==='ar'?'العنوان':lang==='en'?'Address':'Adresse'}</p>
                  <input className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none" style={{background:'white',border:`1.5px solid ${err&&!resAddr.trim()?'#EF4444':'#E5E7EB'}`,color:'#111'}} placeholder={lang==='ar'?'عنوانك بسافي…':'Votre adresse à Safi…'} value={resAddr} onChange={e=>{setResAddr(e.target.value);setErr('');}}/>
                </div>
              )}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{color:'#6B7280'}}>📅 {lang==='ar'?'تاريخ الاستلام':lang==='en'?'Date':'Date de réservation'}</p>
                <input type="date" min={minDate()} className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none" style={{background:'white',border:`1.5px solid ${err&&!resDate?'#EF4444':'#E5E7EB'}`,color:'#111'}} value={resDate} onChange={e=>{setResDate(e.target.value);setErr('');}}/>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{color:'#6B7280'}}>⏰ {lang==='ar'?'الوقت':lang==='en'?'Time Slot':'Créneau horaire'}</p>
                <div className="grid grid-cols-2 gap-2">
                  {['9h – 12h','12h – 15h','15h – 18h','18h – 21h'].map(slot=>(
                    <button key={slot} onClick={()=>{setResTime(slot);setErr('');}}
                      className="py-2.5 rounded-xl font-black text-[11px] transition-all active:scale-95"
                      style={{background:resTime===slot?activeGrad:'white',color:resTime===slot?'white':'#6B7280',border:`1.5px solid ${err&&!resTime?'#EF4444':resTime===slot?'transparent':'#E5E7EB'}`,cursor:'pointer'}}>
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
              {err&&<p className="text-xs font-bold" style={{color:'#EF4444'}}>⚠️ {lang==='ar'?'يرجى ملء جميع الحقول':lang==='en'?'Please fill all fields':'Veuillez remplir tous les champs'}</p>}
            </div>
          </div>
        )}

        {/* ── STEP 4: TRACKING ── */}
        {step==='track'&&(
          <div className="px-5 pt-20">
            <p className="font-black text-xl mb-6" style={{background:'linear-gradient(135deg,#7C3AED,#A855F7)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>📦 {lang==='ar'?'تتبع حجزي':lang==='en'?'Track Reservation':'Suivi réservation'}</p>
            {!lastRef?(
              <div className="rounded-3xl p-8 text-center" style={{background:'white',boxShadow:'0 8px 32px rgba(0,0,0,0.07)',border:'1.5px solid #EDE9FE'}}>
                <span style={{fontSize:52}}>🌸</span>
                <p className="font-black text-sm mt-3 mb-1" style={{color:'#7C3AED'}}>{lang==='ar'?'لا توجد حجوزات بعد':lang==='en'?'No reservations yet':'Aucune réservation'}</p>
                <button onClick={()=>setStep('florist')} className="mt-4 px-6 py-2.5 rounded-2xl font-black text-sm text-white" style={{background:aminaGrad,border:'none',cursor:'pointer'}}>
                  {lang==='ar'?'احجز الآن':lang==='en'?'Reserve Now':'Réserver maintenant'}
                </button>
              </div>
            ):(
              <div>
                <div className="rounded-2xl p-4 mb-4 flex items-center justify-between" style={{background:'white',boxShadow:'0 4px 16px rgba(0,0,0,0.06)',border:'1.5px solid #EDE9FE'}}>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{color:'#9CA3AF'}}>{lang==='ar'?'رقم الحجز':lang==='en'?'Reservation':'Référence'}</p>
                    <p className="font-black text-sm mt-0.5" style={{color:'#7C3AED'}}>#{lastRef}</p>
                  </div>
                  <span style={{fontSize:32}}>🌹</span>
                </div>
                <div className="rounded-2xl p-4 mb-4" style={{background:'white',boxShadow:'0 4px 16px rgba(0,0,0,0.06)',border:'1.5px solid #EDE9FE'}}>
                  {trackStages.map((stage,i)=>(
                    <div key={i} className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm"
                        style={{background:i<=trackStage?aminaGrad:'#F3F4F6',color:i<=trackStage?'white':'#9CA3AF',boxShadow:i===trackStage?'0 4px 14px rgba(124,58,237,0.4)':'none'}}>
                        {i<trackStage?'✓':['📋','💐','🛵','✅'][i]}
                      </div>
                      <div>
                        <p className={`text-[12px] font-black ${fClass}`} style={{color:i<=trackStage?'#7C3AED':'#9CA3AF'}}>{stage}</p>
                        {i===trackStage&&<p className="text-[10px] font-semibold" style={{color:'#A855F7'}}>● En cours…</p>}
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={()=>setStep('florist')} className="w-full py-3 rounded-2xl font-black text-sm text-white transition-all active:scale-95" style={{background:nourGrad,border:'none',cursor:'pointer'}}>
                  {lang==='ar'?'+ حجز جديد':lang==='en'?'+ New Reservation':'+ Nouvelle réservation'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cart bar — catalog step */}
      {cartCount>0&&step==='catalog'&&(
        <div className="fixed bottom-0 left-0 right-0 p-5 z-40" style={{background:'linear-gradient(to top,rgba(253,244,255,0.98) 60%,transparent)'}}>
          <button onClick={()=>setStep('checkout')}
            className="w-full py-4 rounded-2xl font-black text-sm text-white flex items-center justify-between px-5 transition-all active:scale-95"
            style={{background:activeGrad,boxShadow:'0 8px 28px rgba(124,58,237,0.4)'}}>
            <span className="bg-white/20 rounded-full px-2.5 py-0.5 text-xs font-black">{cartCount}</span>
            <span>{lang==='ar'?'متابعة الحجز':lang==='en'?'Continue':'Continuer'}</span>
            <span>{cartTotal} MAD</span>
          </button>
        </div>
      )}

      {/* Confirm reservation — checkout step */}
      {step==='checkout'&&(
        <div className="fixed bottom-0 left-0 right-0 p-5 z-40" style={{background:'linear-gradient(to top,rgba(253,244,255,0.98) 60%,transparent)'}}>
          <button onClick={handleReserve} disabled={sending}
            className="w-full py-4 rounded-2xl font-black text-base text-white transition-all active:scale-95"
            style={{background:sending?'#9CA3AF':activeGrad,boxShadow:sending?'none':'0 8px 28px rgba(124,58,237,0.4)',border:'none',cursor:sending?'not-allowed':'pointer'}}>
            {sending?(lang==='ar'?'جاري الإرسال…':'Envoi en cours…'):(lang==='ar'?'✓ تأكيد الحجز':lang==='en'?'✓ Confirm Reservation':'✓ Confirmer la réservation')}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── TABAC CATALOG ────────────────────────────────────────────────────────────

interface CigEntry {id:string;brand:string;name:string;price:number;cat:'premium'|'intl'|'local';img:string;c1:string;c2:string;label:string;}
const TABAC_CATALOG:CigEntry[] = [
  // ── Premium ──
  {id:'marl-red',    brand:'Marlboro',     name:'Marlboro Red',           price:38.50, cat:'premium', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Marlboro_Red.jpg/80px-Marlboro_Red.jpg',    c1:'#CC1224',c2:'#8B0000',label:'RED'},
  {id:'marl-gold',   brand:'Marlboro',     name:'Marlboro Gold',          price:38.50, cat:'premium', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Marlboro_Gold.jpg/80px-Marlboro_Gold.jpg',  c1:'#B8860B',c2:'#7A5C00',label:'GOLD'},
  {id:'marl-blue',   brand:'Marlboro',     name:'Marlboro Blue',          price:38.50, cat:'premium', img:'',c1:'#1B3A8A',c2:'#0D2060',label:'BLUE'},
  {id:'marl-blk',    brand:'Marlboro',     name:'Marlboro Double Black',  price:42.50, cat:'premium', img:'',c1:'#0D0D0D',c2:'#2D2D2D',label:'BLACK'},
  {id:'marl-menth',  brand:'Marlboro',     name:'Marlboro Menthol',       price:39.50, cat:'premium', img:'',c1:'#0F7A4B',c2:'#065F38',label:'MENTHOL'},
  {id:'davidoff',    brand:'Davidoff',     name:'Davidoff Classic',       price:46.50, cat:'premium', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Davidoff_cigarettes.jpg/80px-Davidoff_cigarettes.jpg', c1:'#1C2951',c2:'#0A1528',label:'CLASSIC'},
  {id:'davidoff-sl', brand:'Davidoff',     name:'Davidoff Slims',         price:46.50, cat:'premium', img:'',c1:'#1C3B6E',c2:'#0D2045',label:'SLIMS'},
  {id:'parl',        brand:'Parliament',   name:'Parliament Aqua Blue',   price:41.50, cat:'premium', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Parliament_cigarettes.JPG/120px-Parliament_cigarettes.JPG',c1:'#4A8FC4',c2:'#2D6A9A',label:'AQUA'},
  {id:'dunhill',     brand:'Dunhill',      name:'Dunhill International',  price:35.50, cat:'premium', img:'',c1:'#7C1A2E',c2:'#4A0F1A',label:'INT\'L'},
  // ── International ──
  {id:'camel',       brand:'Camel',        name:'Camel Classic',          price:32.50, cat:'intl',    img:'',c1:'#C8943B',c2:'#8B6419',label:'CLASSIC'},
  {id:'camel-blue',  brand:'Camel',        name:'Camel Blue',             price:32.50, cat:'intl',    img:'',c1:'#2156A4',c2:'#133B7A',label:'BLUE'},
  {id:'camel-yel',   brand:'Camel',        name:'Camel Yellow',           price:32.50, cat:'intl',    img:'',c1:'#D4A52A',c2:'#A07A10',label:'YELLOW'},
  {id:'win-red',     brand:'Winston',      name:'Winston Classic',        price:29.50, cat:'intl',    img:'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Five_packs_of_Winston_in_Baku%2C_Azerbaijan.jpg/120px-Five_packs_of_Winston_in_Baku%2C_Azerbaijan.jpg',c1:'#CC2020',c2:'#8B0000',label:'CLASSIC'},
  {id:'win-blue',    brand:'Winston',      name:'Winston Blue',           price:29.50, cat:'intl',    img:'',c1:'#1B5097',c2:'#0D3060',label:'BLUE'},
  {id:'lm-red',      brand:'L&M',          name:'L&M Red Label',          price:26.50, cat:'intl',    img:'',c1:'#C41230',c2:'#8B0010',label:'RED'},
  {id:'lm-blue',     brand:'L&M',          name:'L&M Blue Label',         price:26.50, cat:'intl',    img:'',c1:'#1B4FA0',c2:'#0D3070',label:'BLUE'},
  {id:'kent',        brand:'Kent',         name:'Kent HD Blue',           price:27.50, cat:'intl',    img:'',c1:'#00539C',c2:'#003070',label:'HD BLUE'},
  {id:'gaul',        brand:'Gauloises',    name:'Gauloises Blondes',      price:27.50, cat:'intl',    img:'',c1:'#2459A9',c2:'#123A7A',label:'BLONDES'},
  {id:'prince',      brand:'Prince',       name:'Prince Classic',         price:26.50, cat:'intl',    img:'',c1:'#1E4A8C',c2:'#0D2E5C',label:'CLASSIC'},
  {id:'pall-red',    brand:'Pall Mall',    name:'Pall Mall Red',          price:23.50, cat:'intl',    img:'',c1:'#B81B2D',c2:'#7A0D1A',label:'RED'},
  {id:'pall-blue',   brand:'Pall Mall',    name:'Pall Mall Blue',         price:23.50, cat:'intl',    img:'',c1:'#1A4A9A',c2:'#0D2E66',label:'BLUE'},
  {id:'roth',        brand:'Rothmans',     name:'Rothmans International', price:23.50, cat:'intl',    img:'',c1:'#1A3A8A',c2:'#0D2060',label:'INT\'L'},
  {id:'chest',       brand:'Chesterfield', name:'Chesterfield Red',       price:24.50, cat:'intl',    img:'',c1:'#8B1C2C',c2:'#5A0E18',label:'RED'},
  {id:'merit',       brand:'Merit',        name:'Merit Blue',             price:21.50, cat:'intl',    img:'',c1:'#2A5298',c2:'#163060',label:'BLUE'},
  {id:'bond-red',    brand:'Bond Street',  name:'Bond Street Red',        price:20.50, cat:'intl',    img:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Bondstreet_cigarettes.JPG/120px-Bondstreet_cigarettes.JPG',c1:'#A01E2E',c2:'#6A0F1A',label:'RED'},
  {id:'bond-blue',   brand:'Bond Street',  name:'Bond Street Blue',       price:20.50, cat:'intl',    img:'',c1:'#1A4A9A',c2:'#0D2E66',label:'BLUE'},
  {id:'vicr',        brand:'Viceroy',      name:'Viceroy Classic',        price:20.50, cat:'intl',    img:'',c1:'#1A3A8A',c2:'#0D2060',label:'CLASSIC'},
  {id:'karl',        brand:'Karelia',      name:'Karelia Special',        price:20.50, cat:'intl',    img:'',c1:'#1A5A3A',c2:'#0D3A24',label:'SPECIAL'},
  // ── Maroc 🇲🇦 ──
  {id:'marq',        brand:'Marquise',     name:'Marquise Classic',       price:19.50, cat:'local',   img:'',c1:'#7B1A2A',c2:'#4A0D18',label:'CLASSIC'},
  {id:'marq-m',      brand:'Marquise',     name:'Marquise Menthol',       price:19.50, cat:'local',   img:'',c1:'#0B6B3A',c2:'#064524',label:'MENTHOL'},
  {id:'legend',      brand:'Legend',       name:'Legend Blue',            price:19.50, cat:'local',   img:'',c1:'#1A3A8A',c2:'#0D2060',label:'BLUE'},
  {id:'royale',      brand:'Royale',       name:'Royale',                 price:17.50, cat:'local',   img:'',c1:'#1A5A3A',c2:'#0D3A24',label:'ROYALE'},
  {id:'casa',        brand:'Casa Sport',   name:'Casa Sport Original',    price:12.50, cat:'local',   img:'',c1:'#E65C00',c2:'#B84000',label:'ORIGINAL'},
  {id:'casa-new',    brand:'Casa Sport',   name:'Casa Sport New',         price:13.50, cat:'local',   img:'',c1:'#C8860A',c2:'#8B5C00',label:'NEW'},
];

// ─── CIG ITEM (must be a component to use useState for img fallback) ─────────

function CigItem({cig,qty,isNight,effectivePrice,onAdd,onRem}:{cig:CigEntry;qty:number;isNight:boolean;effectivePrice:number;onAdd:()=>void;onRem:()=>void}) {
  const [imgOk,setImgOk]=useState(!!cig.img);
  return(
    <div className="flex items-center gap-3 rounded-2xl px-3 py-2"
      style={{background:qty>0?'rgba(180,83,9,0.12)':'var(--c-card)',border:`1.5px solid ${qty>0?'rgba(180,83,9,0.5)':'var(--c-border)'}`,transition:'all 0.15s'}}>
      {/* Pack image */}
      <div style={{width:40,height:52,borderRadius:6,flexShrink:0,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,0.35)'}}>
        {cig.img&&imgOk?(
          <img src={cig.img} alt={cig.name} onError={()=>setImgOk(false)} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
        ):(
          <div style={{width:'100%',height:'100%',background:`linear-gradient(160deg,${cig.c1},${cig.c2})`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'3px 2px',gap:1}}>
            <span style={{color:'rgba(255,255,255,0.95)',fontSize:6,fontWeight:900,textAlign:'center',letterSpacing:'0.05em',textTransform:'uppercase',lineHeight:1.1}}>{cig.brand}</span>
            <div style={{width:'75%',height:'0.5px',background:'rgba(255,255,255,0.4)'}}/>
            <span style={{color:'rgba(255,255,255,0.7)',fontSize:5,textAlign:'center',letterSpacing:'0.06em',textTransform:'uppercase'}}>{cig.label}</span>
          </div>
        )}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <p className="font-black text-[12px] truncate" style={{color:'var(--c-text)'}}>{cig.name}</p>
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] font-black" style={{color:'#B45309'}}>{effectivePrice} DH</p>
          {isNight&&<span style={{background:'rgba(251,191,36,0.15)',border:'1px solid rgba(251,191,36,0.4)',borderRadius:4,padding:'0 4px',fontSize:9,color:'#F59E0B',fontWeight:700}}>🌙 +8</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {qty>0&&(
          <>
            <button onClick={onRem} style={{width:28,height:28,borderRadius:'50%',border:'none',background:'rgba(180,83,9,0.2)',color:'#B45309',fontWeight:900,fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
            <span className="font-black text-sm w-5 text-center" style={{color:'var(--c-text)'}}>{qty}</span>
          </>
        )}
        <button onClick={onAdd} style={{width:28,height:28,borderRadius:'50%',border:'none',background:'#B45309',color:'white',fontWeight:900,fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
      </div>
    </div>
  );
}

// ─── TABAC PAGE ───────────────────────────────────────────────────────────────

function TabacPage({onBack,lang,cycleLang,profile,saveProfile,onOrderSuccess}:{
  onBack:()=>void; lang:Lang; cycleLang:()=>void;
  profile:UserProfile; saveProfile:(p:UserProfile)=>void;
  onOrderSuccess?:(ref:string)=>void;
}) {
  // ── State ──
  const [showProfile,setShowProfile]=useState(false);
  const [ageVerified,setAgeVerified]=useState(()=>{try{return localStorage.getItem('bridge_tabac_age18')==='1';}catch{return false;}});
  const [delivMode,setDelivMode]=useState<'delivery'|'collect'>('delivery');
  const [tabacCart,setTabacCart]=useState<{id:string;qty:number}[]>([]);
  const [tabacCat,setTabacCat]=useState<'premium'|'intl'|'local'>('premium');
  const [tabacSearch,setTabacSearch]=useState('');
  const [name,setName]=useState(profile.name??'');
  const [addr,setAddr]=useState(profile.address??'');
  const [phone,setPhone]=useState(profile.phone??'');
  const [err,setErr]=useState('');
  const [sending,setSending]=useState(false);
  const [sent,setSent]=useState(false);
  const [orderRef]=useState(()=>`TB-${Math.floor(1000+Math.random()*9000)}`);
  const [tabacPayMethod,setTabacPayMethod]=useState<PayMethodType>(null);
  const [showTabacQR,setShowTabacQR]=useState(false);
  const {user:tabacUser}=useUser();
  const getAuthHeadersTabac=useAuthHeaders();
  const [,navigateTabac]=useLocation();
  const [tabacGems,setTabacGems]=useState(0);
  const [tabacGemMAD,setTabacGemMAD]=useState(0);
  const maxTabacGemMAD=Math.floor(tabacGems/200);

  // ── Night detection ──
  const nowH=new Date().getHours();
  const isNight=nowH>=22||nowH<6;
  const DELIV_FEE=delivMode==='delivery'?(isNight?18:12):0;
  const SVC_FEE=6.5;

  useEffect(()=>{
    if(!tabacUser?.id) return;
    getAuthHeadersTabac().then(h=>fetch('/api/game/diamonds',{credentials:'include',headers:h})
      .then(r=>r.ok?r.json():null)
      .then(d=>{if(d&&typeof d.diamonds==='number')setTabacGems(d.diamonds);})
      .catch(()=>{}));
  },[tabacUser?.id,getAuthHeadersTabac]);

  const isAR=lang==='ar'; const fClass=fontClass(lang);
  const t=T[lang];

  // ── Cart helpers ──
  const addCig=(id:string)=>setTabacCart(c=>{const ex=c.find(x=>x.id===id);return ex?c.map(x=>x.id===id?{...x,qty:x.qty+1}:x):[...c,{id,qty:1}];});
  const remCig=(id:string)=>setTabacCart(c=>{const ex=c.find(x=>x.id===id);if(!ex)return c;if(ex.qty===1)return c.filter(x=>x.id!==id);return c.map(x=>x.id===id?{...x,qty:x.qty-1}:x);});
  const cigQty=(id:string)=>tabacCart.find(x=>x.id===id)?.qty??0;
  const cigPrice=(p:CigEntry)=>p.price+(isNight?8:0);
  const cartSubtotal=tabacCart.reduce((s,ci)=>{const p=TABAC_CATALOG.find(f=>f.id===ci.id);return s+(p?cigPrice(p)*ci.qty:0);},0);
  const cartTotal=cartSubtotal+DELIV_FEE+SVC_FEE-tabacGemMAD;
  const cartCount=tabacCart.reduce((s,ci)=>s+ci.qty,0);

  const visibleCigs=TABAC_CATALOG.filter(c=>
    c.cat===tabacCat&&(tabacSearch===''||c.name.toLowerCase().includes(tabacSearch.toLowerCase())||c.brand.toLowerCase().includes(tabacSearch.toLowerCase()))
  );

  const inputCls=`w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all ${fClass}`;
  const inputStyle=(hasErr:boolean):React.CSSProperties=>({background:'#F9F6F0',border:`1.5px solid ${hasErr?'#EF4444':'#E5E1D8'}`,color:'var(--c-text)'});

  const handleTabacWalletPay=async(type:'apple'|'google')=>{
    if(!name.trim()||!phone.trim()||(delivMode==='delivery'&&!addr.trim())){setErr('*');return;}
    const payLabel=type==='apple'?'Apple Pay':'Google Pay';
    const methods=type==='apple'
      ?[{supportedMethods:'https://apple.com/apple-pay',data:{version:3,merchantIdentifier:'merchant.ma.safi-bridge',merchantCapabilities:['supports3DS'],supportedNetworks:['visa','masterCard'],countryCode:'MA'}}]
      :[{supportedMethods:'https://google.com/pay',data:{apiVersion:2,apiVersionMinor:0,merchantInfo:{merchantName:'Bridge Safi'},allowedPaymentMethods:[{type:'CARD',parameters:{allowedAuthMethods:['PAN_ONLY','CRYPTOGRAM_3DS'],allowedCardNetworks:['MASTERCARD','VISA']},tokenizationSpecification:{type:'PAYMENT_GATEWAY',parameters:{gateway:'example',gatewayMerchantId:'bridge-safi'}}}]}}];
    const details={total:{label:'Bridge Tabac · Safi',amount:{currency:'MAD',value:String(cartTotal)}}};
    try{
      if(typeof PaymentRequest==='undefined') throw new Error('unsupported');
      const pr=new PaymentRequest(methods,details);
      const canMake=await pr.canMakePayment().catch(()=>false);
      if(!canMake) throw new Error('unavailable');
      const response=await pr.show();
      await response.complete('success');
      setTabacPayMethod(type);
      await handleSend(payLabel);
    }catch{setTabacPayMethod('cash');}
  };

  const handleSend=async(payLabel?:string)=>{
    if(!name.trim()||!phone.trim()||(delivMode==='delivery'&&!addr.trim())){setErr('*');return;}
    setSending(true);
    const deliveryAddress=delivMode==='delivery'?`${addr.trim()}, Safi, Maroc`:t.tabacCollectAddress;
    const driverTrackUrl=`${window.location.origin}/driver/${orderRef}`;
    const payInfo=payLabel?payLabel:tabacPayMethod==='qr'?'QR Code':tabacPayMethod==='cash'?'Espèces':tabacPayMethod==='apple'?'Apple Pay':tabacPayMethod==='google'?'Google Pay':'Espèces';
    const itemsList=tabacCart.map(ci=>{const p=TABAC_CATALOG.find(f=>f.id===ci.id)!;const ep=cigPrice(p);return `${p.name} x${ci.qty} (${ep*ci.qty} DH${isNight?' 🌙':''})`; }).join('\n');
    const notesStr=`🚬 Bridge Tabac${isNight?' 🌙 NUIT':''}\n${itemsList||'Commande générale'}\n—\nSous-total: ${cartSubtotal} DH\nLivraison: ${DELIV_FEE} DH${isNight?' (tarif nuit)':''}\nService: ${SVC_FEE} DH\nTotal: ${cartTotal} DH\n💳 ${payInfo}\n👤 ${name.trim()} — ${phone.trim()}`;
    const apiItems=tabacCart.length>0
      ?tabacCart.map(ci=>{const p=TABAC_CATALOG.find(f=>f.id===ci.id)!;return {name:p.name,qty:ci.qty,price:cigPrice(p)};})
      :[{name:'🚬 Commande Bridge Tabac',qty:1,price:0}];
    try{
      await fetch('/api/orders/inbound',{method:'POST',headers:{'Content-Type':'application/json','x-bridge-secret':'bridge-safi-8b269bba03fd8c0205116f3f'},
        body:JSON.stringify({customerName:name.trim(),customerPhone:phone.trim(),deliveryAddress,pickupAddress:'Bridge Tabac — Safi',items:apiItems,total:cartTotal,source:'Bridge Tabac',paymentMethod:payInfo}),
      }).catch(()=>{});
      await fetch(`${DRIVER_APP_URL}/api/deliveries`,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({trackingNumber:orderRef,customerName:name.trim(),customerPhone:phone.trim(),pickupAddress:'Bridge Tabac — Safi',deliveryAddress,priority:'normal',notes:notesStr,driverTrackUrl}),
      }).catch(()=>{});
    }finally{setSending(false);}
    if(tabacGemMAD>0){getAuthHeadersTabac().then(h=>fetch('/api/game/diamonds/spend',{method:'POST',credentials:'include',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify({spend:tabacGemMAD*200})}).then(r=>r.ok?r.json():null).then(d=>{if(d&&typeof d.diamonds==='number'){const ck=`bridge_diamonds_cache_${tabacUser?.id||'anon'}`;try{localStorage.setItem(ck,String(d.diamonds));}catch{}window.dispatchEvent(new StorageEvent('storage',{key:ck,newValue:String(d.diamonds)}));}}).catch(()=>{}));}
    await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ref:orderRef,service:'tabac',customerName:name.trim(),customerPhone:phone.trim(),customerAddress:deliveryAddress,items:apiItems,total:cartTotal,deliveryMode:delivMode,paymentMethod:payInfo,restaurantName:'Bridge Tabac'}),
    }).catch(()=>{});
    localStorage.setItem('bridge_last_ref',orderRef);
    try{const raw=localStorage.getItem('bridge_history');const arr=raw?JSON.parse(raw):[];arr.unshift({ref:orderRef,type:'tabac',date:new Date().toISOString(),total:cartTotal,address:deliveryAddress,name:name.trim()});if(arr.length>100)arr.splice(100);localStorage.setItem('bridge_history',JSON.stringify(arr));}catch{}
    setSent(true);
    onOrderSuccess?.(orderRef);
  };

  const catTabs:{key:'premium'|'intl'|'local';label:string;emoji:string}[]=[
    {key:'premium',label:'Premium',emoji:'⭐'},
    {key:'intl',label:'International',emoji:'🌍'},
    {key:'local',label:'Maroc 🇲🇦',emoji:''},
  ];

  return(
    <div className={`min-h-screen flex flex-col ${isAR?'rtl':'ltr'}`} style={{background:'var(--c-bg)',color:'var(--c-text)'}}>

      {/* ── Age Gate Modal ── */}
      {!ageVerified&&(
        <div style={{position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
          <div style={{background:'#1C1006',border:'2px solid rgba(180,83,9,0.5)',borderRadius:24,padding:32,maxWidth:320,width:'100%',textAlign:'center',boxShadow:'0 20px 60px rgba(0,0,0,0.8)'}}>
            <div style={{fontSize:56,marginBottom:16}}>🔞</div>
            <h2 style={{color:'#F59E0B',fontSize:20,fontWeight:900,marginBottom:8,letterSpacing:'0.04em'}}>
              {lang==='ar'?'تحذير — 18+':lang==='en'?'Warning — 18+':'Accès réservé — 18+'}
            </h2>
            <p style={{color:'rgba(255,255,255,0.65)',fontSize:13,lineHeight:1.6,marginBottom:24}}>
              {lang==='ar'?'بيع التبغ محظور على القاصرين.\nيجب أن يكون عمرك 18 سنة أو أكثر.':lang==='en'?'Tobacco sales are prohibited to minors.\nYou must be 18 or older to continue.':'La vente de tabac est interdite aux mineurs.\nVous devez avoir 18 ans ou plus pour continuer.'}
            </p>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <button onClick={()=>{setAgeVerified(true);try{localStorage.setItem('bridge_tabac_age18','1');}catch{}}}
                style={{padding:'14px 0',borderRadius:14,background:'linear-gradient(135deg,#B45309,#78350F)',color:'white',fontWeight:900,fontSize:14,border:'none',cursor:'pointer',letterSpacing:'0.05em'}}>
                ✅ {lang==='ar'?'نعم، عمري +18':lang==='en'?'Yes, I am 18+':'Oui, j\'ai 18 ans ou plus'}
              </button>
              <button onClick={onBack}
                style={{padding:'12px 0',borderRadius:14,background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.5)',fontWeight:700,fontSize:13,border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer'}}>
                {lang==='ar'?'رجوع':lang==='en'?'Go back':'Retour'}
              </button>
            </div>
            <p style={{color:'rgba(239,68,68,0.7)',fontSize:10,marginTop:16,fontWeight:700,letterSpacing:'0.1em'}}>
              {lang==='ar'?'🚫 بيع التبغ للقاصرين محظور قانوناً':lang==='en'?'🚫 Tobacco sales to minors are illegal':'🚫 Vente de tabac aux mineurs interdite par la loi'}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{position:'fixed',top:16,left:isAR?'auto':16,right:isAR?16:'auto',zIndex:50}}>
        <button onClick={onBack} style={{width:38,height:38,borderRadius:'50%',border:'none',cursor:'pointer',background:'rgba(120,53,15,0.15)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--c-text)',fontSize:18}}>←</button>
      </div>
      <div style={{position:'fixed',top:16,right:isAR?'auto':16,left:isAR?16:'auto',zIndex:50,display:'flex',alignItems:'center',gap:8}}>
        <button onClick={cycleLang} style={{width:38,height:38,borderRadius:'50%',border:'none',cursor:'pointer',background:'rgba(120,53,15,0.18)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--c-text)',fontSize:11,fontWeight:900}}>{LANG_LABELS[lang]}</button>
        <SharkDiamondWidget onNavigate={()=>navigateTabac('/game')} profile={profile}/>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center px-5 pt-20 pb-12 max-w-sm mx-auto w-full gap-4">

        {/* Title + night badge */}
        <div className="text-center">
          <h1 className={`font-black text-xl tracking-wider mb-0.5 ${fClass}`} style={{color:'#7D4F2E'}}>BRIDGE TABAC</h1>
          <p className="text-[10px] tracking-widest font-bold" style={{color:'#B45309'}}>SAFI · MAROC · آسفي · ⵙⴰⴼⵉ</p>
          {isNight&&<div style={{display:'inline-flex',alignItems:'center',gap:5,background:'rgba(30,10,0,0.9)',border:'1px solid rgba(251,191,36,0.4)',borderRadius:50,padding:'3px 12px',marginTop:6}}>
            <span style={{fontSize:12}}>🌙</span>
            <span style={{color:'#FDE68A',fontSize:10,fontWeight:900,letterSpacing:'0.12em'}}>TARIF NUIT</span>
          </div>}
        </div>

        {/* ── Catalogue ── */}
        {!sent&&(
          <div className="w-full">
            {/* Search */}
            <input value={tabacSearch} onChange={e=>setTabacSearch(e.target.value)}
              placeholder={lang==='ar'?'بحث…':lang==='en'?'Search…':'Rechercher…'}
              className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none mb-3 ${fClass}`}
              style={{background:'var(--c-card)',border:'1.5px solid var(--c-border)',color:'var(--c-text)'}}/>

            {/* Category tabs */}
            <div className="flex gap-1.5 mb-3">
              {catTabs.map(tab=>(
                <button key={tab.key} onClick={()=>{setTabacCat(tab.key);setTabacSearch('');}}
                  className="flex-1 py-2 rounded-xl font-black text-[10px] transition-all active:scale-95"
                  style={{background:tabacCat===tab.key?'#B45309':'var(--c-card)',color:tabacCat===tab.key?'white':'#9CA3AF',border:`1.5px solid ${tabacCat===tab.key?'#B45309':'var(--c-border)'}`,letterSpacing:'0.04em'}}>
                  {tab.emoji} {tab.label}
                </button>
              ))}
            </div>

            {/* Items grid */}
            <div className="flex flex-col gap-2">
              {visibleCigs.map(cig=>(
                <CigItem key={cig.id} cig={cig} qty={cigQty(cig.id)} isNight={isNight}
                  effectivePrice={cigPrice(cig)}
                  onAdd={()=>addCig(cig.id)} onRem={()=>remCig(cig.id)}/>
              ))}
            </div>

            {/* Cart summary */}
            {cartCount>0&&(
              <div className="mt-3 rounded-2xl p-3" style={{background:'rgba(180,83,9,0.1)',border:'1.5px solid rgba(180,83,9,0.35)'}}>
                <p className="font-black text-[11px] mb-2" style={{color:'#B45309'}}>🛒 {cartCount} {lang==='ar'?'علبة':lang==='en'?'pack(s)':'paquet(s)'} sélectionné(s)</p>
                {tabacCart.map(ci=>{const p=TABAC_CATALOG.find(f=>f.id===ci.id)!;const ep=cigPrice(p);return(
                  <div key={ci.id} className="flex justify-between text-[11px]" style={{color:'var(--c-text)',opacity:0.75}}>
                    <span>{p.name} ×{ci.qty}{isNight?' 🌙':''}</span><span className="font-bold">{ep*ci.qty} DH</span>
                  </div>
                );})}
              </div>
            )}
          </div>
        )}

        {/* Mode selector */}
        {!sent&&(
          <div className="flex gap-2 w-full">
            {([
              {key:'delivery'as const,label:t.delivOption,desc:t.delivOptionDesc,color:'#065F46',selBg:'#D1FAE5',bg:'#F0FDF4'},
              {key:'collect'as const,label:t.collectOption,desc:t.collectOptionDesc,color:'#B45309',selBg:'#FEF3C7',bg:'#FFFBEB'},
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
        )}

        {/* Form */}
        {!sent&&(
          <div className="w-full flex flex-col gap-3">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${fClass}`} style={{color:'#065F46'}}>👤 {t.nameLabel}</p>
              <input className={inputCls} style={inputStyle(!!err&&!name.trim())} placeholder={t.namePh} value={name} onChange={e=>{setName(e.target.value);setErr('');}}/>
            </div>
            {delivMode==='delivery'&&(
              <AddressAutocomplete label={`📍 ${t.addrLabel}`} value={addr} onChange={v=>{setAddr(v);setErr('');}} placeholder={t.addrPh} lang={lang} error={!!err&&!addr.trim()}/>
            )}
            {delivMode==='collect'&&(
              <div className="rounded-xl px-4 py-3" style={{background:'#FEF3C7',border:'1.5px solid #FDE68A'}}>
                <p className={`text-[10px] font-medium ${fClass}`} style={{color:'#92400E'}}>🏪 {t.tabacCollectAddress}</p>
              </div>
            )}
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${fClass}`} style={{color:'#065F46'}}>📞 {t.phoneLabel}</p>
              <input className={inputCls} style={inputStyle(!!err&&!phone.trim())} placeholder={t.phonePh} value={phone} type="tel" onChange={e=>{setPhone(e.target.value);setErr('');}}/>
            </div>
            {err&&<p className={`text-xs font-bold ${fClass}`} style={{color:'#EF4444'}}>⚠️ {lang==='ar'?'يرجى ملء جميع الحقول المطلوبة':lang==='en'?'Please fill in all required fields':'Veuillez remplir tous les champs requis'}</p>}
          </div>
        )}

        {/* Success */}
        {sent&&(
          <div className="rounded-3xl p-6 text-center w-full" style={{background:'#F0FDF4',border:'2px solid #059669',boxShadow:'0 8px 32px rgba(5,150,105,0.18)'}}>
            <div className="text-5xl mb-3">✅</div>
            <p className={`font-black text-base mb-1 ${fClass}`} style={{color:'#065F46'}}>
              {lang==='ar'?'تم إرسال طلبك!':lang==='en'?'Order placed!':'Commande envoyée !'}
            </p>
            <p className="text-2xl font-black tracking-[0.25em] my-2" style={{color:'#B45309'}}>{orderRef}</p>
            <p className={`text-[11px] mb-4 ${fClass}`} style={{color:'#6B7280'}}>
              {lang==='ar'?'سيتصل بك الليبرور قريباً':lang==='en'?'The driver will contact you soon':'Le livreur vous contactera bientôt'}
            </p>
            <button onClick={()=>onOrderSuccess?.(orderRef)}
              className={`w-full py-3 rounded-2xl font-black text-sm text-white active:scale-95 transition-all ${fClass}`}
              style={{background:'#065F46',boxShadow:'0 4px 14px rgba(6,95,70,0.35)'}}>
              📍 {lang==='ar'?'متابعة الطلب':lang==='en'?'Track order':'Suivre ma commande'}
            </button>
          </div>
        )}

        {/* ── Frais obligatoires ── */}
        {!sent&&(
          <div className="w-full rounded-2xl p-4" style={{background:'var(--c-card)',border:'1.5px solid var(--c-border)'}}>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${fClass}`} style={{color:'#065F46'}}>
              🧾 {lang==='ar'?'تفاصيل الفاتورة':lang==='en'?'Order summary':'Récapitulatif'}
            </p>
            {cartSubtotal>0&&(
              <div className="flex justify-between text-[12px] mb-1.5">
                <span style={{color:'rgba(var(--c-text-rgb,0,0,0),0.6)'}}>{lang==='ar'?'المجموع الفرعي':lang==='en'?'Subtotal':'Sous-total'}</span>
                <span className="font-bold" style={{color:'var(--c-text)'}}>{cartSubtotal} DH</span>
              </div>
            )}
            {delivMode==='delivery'&&(
              <div className="flex justify-between text-[12px] mb-1.5">
                <span style={{color:'rgba(var(--c-text-rgb,0,0,0),0.6)'}}>
                  🛵 {lang==='ar'?'توصيل':lang==='en'?'Delivery':'Livraison'}{isNight&&<span style={{color:'#F59E0B',fontWeight:700}}> 🌙 +6 DH nuit</span>}
                </span>
                <span className="font-bold" style={{color:'#B45309'}}>{DELIV_FEE} DH</span>
              </div>
            )}
            <div className="flex justify-between text-[12px] mb-2">
              <span style={{color:'rgba(var(--c-text-rgb,0,0,0),0.6)'}}>⚙️ {lang==='ar'?'رسوم الخدمة':lang==='en'?'Service fee':'Frais de service'}</span>
              <span className="font-bold" style={{color:'#B45309'}}>{SVC_FEE} DH</span>
            </div>
            {tabacGemMAD>0&&(
              <div className="flex justify-between text-[12px] mb-2">
                <span style={{color:'#4ADE80'}}>💎 {lang==='ar'?'خصم ماسات':lang==='en'?'Diamond discount':'Réduction 💎'}</span>
                <span className="font-bold" style={{color:'#4ADE80'}}>-{tabacGemMAD} DH</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2" style={{borderTop:'1.5px solid var(--c-border)'}}>
              <span className="font-black text-sm" style={{color:'var(--c-text)'}}>TOTAL</span>
              <span className="font-black text-lg" style={{color:'#065F46'}}>{cartTotal} DH</span>
            </div>
          </div>
        )}

        {/* 💎 Diamond discount */}
        {!sent&&(
          <div className={`w-full rounded-2xl p-4 ${fClass}`} style={{background:'linear-gradient(135deg,#0A1A12,#0D2E1A)',border:'1px solid rgba(74,222,128,0.3)'}}>
            <p className="text-[11px] font-black mb-1.5" style={{color:'#D9C5A0'}}>
              💎 {lang==='ar'?'خصم بالماسات':lang==='en'?'Diamond discount':'Réduction Diamants'}
            </p>
            {tabacGems>0?(
              <>
                <p className="text-[10px] mb-2" style={{color:'rgba(255,255,255,0.6)',fontWeight:600}}>
                  {tabacGems.toLocaleString()} 💎 = {maxTabacGemMAD} MAD {lang==='ar'?'متاح':lang==='en'?'available':'disponible'}
                </p>
                {tabacGemMAD>0?(
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold" style={{color:'#4ADE80'}}>✓ -{tabacGemMAD} MAD {lang==='ar'?'مطبق':lang==='en'?'applied':'appliqué'}</span>
                    <button onClick={()=>setTabacGemMAD(0)} className="text-[9px] font-bold px-2 py-1 rounded-lg" style={{background:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.5)',border:'none',cursor:'pointer'}}>✕</button>
                  </div>
                ):(
                  <div className="flex gap-2 flex-wrap">
                    {[1,2,5,maxTabacGemMAD].filter((v,i,a)=>v>0&&a.indexOf(v)===i&&v<=maxTabacGemMAD).map(mad=>(
                      <button key={mad} onClick={()=>setTabacGemMAD(mad)}
                        className="px-3 py-1 rounded-xl font-black text-[10px] active:scale-95 transition-all"
                        style={{background:'rgba(74,222,128,0.2)',border:'1px solid rgba(74,222,128,0.5)',color:'#4ADE80',cursor:'pointer'}}>
                        -{mad} MAD
                      </button>
                    ))}
                  </div>
                )}
              </>
            ):(
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px]" style={{color:'rgba(255,255,255,0.4)'}}>
                  {lang==='ar'?'لا ماسات — العب لتربح!':lang==='en'?'No diamonds — play to earn!':'Pas de diamants — jouez pour en gagner !'}
                </p>
                <button onClick={()=>navigateTabac('/game')} className="text-[9px] font-black px-2.5 py-1 rounded-xl" style={{background:'rgba(74,222,128,0.2)',border:'1px solid rgba(74,222,128,0.4)',color:'#4ADE80',cursor:'pointer',flexShrink:0}}>🎮 Game</button>
              </div>
            )}
          </div>
        )}

        {/* Payment */}
        {!sent&&(
          <div className="w-full rounded-2xl p-4" style={{background:'var(--c-card)',border:'1.5px solid var(--c-border)'}}>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${fClass}`} style={{color:'#065F46'}}>
              💳 {lang==='ar'?'طريقة الدفع':lang==='en'?'Payment method':'Mode de paiement'}
            </p>
            <SharedPaymentOptions lang={lang} selected={tabacPayMethod} onSelect={setTabacPayMethod} showCash showCard={false} onWalletPay={handleTabacWalletPay}/>
          </div>
        )}

        {/* Send button */}
        {!sent&&(
          <button onClick={()=>{if(tabacPayMethod==='qr'){handleSend().then(()=>setShowTabacQR(true));}else handleSend();}}
            disabled={sending}
            className={`w-full py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 active:scale-95 transition-all ${fClass}`}
            style={{background:sending?'#9CA3AF':'#065F46',boxShadow:sending?'none':'0 6px 20px rgba(6,95,70,0.3)',cursor:sending?'not-allowed':'pointer'}}>
            {sending?(
              <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"/>{lang==='ar'?'جارٍ الإرسال…':lang==='en'?'Sending…':'Envoi en cours…'}</>
            ):(
              <><span>🛵</span>{t.tabacSend}</>
            )}
          </button>
        )}
        {showTabacQR&&<QRPayModal lang={lang} onClose={()=>setShowTabacQR(false)} onConfirm={()=>setShowTabacQR(false)}/>}
      </div>

      {showProfile&&<ProfileModal lang={lang} profile={profile} onSave={saveProfile} onClose={()=>setShowProfile(false)}/>}
    </div>
  );
}

// ─── HUB PAGE — écran principal (2 grands boutons) ───────────────────────────

function HubPage({onServices,lang,cycleLang,profile,saveProfile}:{
  onServices:()=>void; lang:Lang; cycleLang:()=>void;
  profile:UserProfile; saveProfile:(p:UserProfile)=>void;
}) {
  const [,navigate]=useLocation();
  const {user}=useUser();
  const {dark}=useDark();
  const t=T[lang]; const fClass=fontClass(lang); const isAR=lang==='ar';
  const LANG_LABELS:Record<Lang,string>={fr:'FR',en:'EN',ar:'AR',amz:'ⴰⵎⵣ'};
  const avatarSrc=profile.avatar||user?.imageUrl||null;
  const firstName=(profile.name||user?.firstName||'').split(' ')[0];
  const initials=(profile.name||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  const [pressedServices,setPressedServices]=useState(false);
  const [pressedGame,setPressedGame]=useState(false);
  const [showProfileModal,setShowProfileModal]=useState(false);

  return (
    <div className={`fixed inset-0 overflow-y-auto flex flex-col ${isAR?'rtl':'ltr'}`}
      style={{background: dark
        ? '#000'
        : 'linear-gradient(160deg,#f0fdf4 0%,#fefce8 50%,#f0fdf4 100%)'}}>

      <style>{`
        @keyframes hubFloat{0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}
        @keyframes hubGlow{0%,100%{box-shadow:0 0 40px rgba(6,95,70,0.5),0 0 80px rgba(6,95,70,0.15);}50%{box-shadow:0 0 70px rgba(6,95,70,0.8),0 0 140px rgba(6,95,70,0.25);}}
        @keyframes hubStarPulse{0%,100%{opacity:0.5;transform:scale(1);}50%{opacity:1;transform:scale(1.5);}}
        @keyframes hubGemSpin{0%{transform:rotate(-12deg);}50%{transform:rotate(12deg);}100%{transform:rotate(-12deg);}}
        @keyframes hubFadeIn{0%{opacity:0;transform:translateY(18px);}100%{opacity:1;transform:translateY(0);}}
        @keyframes hubShimmer{0%{background-position:200% center;}100%{background-position:-200% center;}}
      `}</style>

      {/* ── CENTER CONTENT ── */}
      <div className="flex flex-col items-center w-full max-w-sm mx-auto pt-20 pb-10 px-5 flex-1 justify-center min-h-screen">

        {/* ── 2 BIG BUTTONS ── */}
        <div style={{display:'flex',flexDirection:'column',gap:18,width:'100%',animation:'hubFadeIn 0.5s ease-out 0.4s both'}}>

          {/* SERVICES BUTTON */}
          <button
            onClick={()=>{setPressedServices(true);setTimeout(onServices,280);}}
            style={{
              background:pressedServices
                ?'linear-gradient(145deg,#3b0a0a,#7f1d1d,#9b1c1c)'
                :'linear-gradient(145deg,#450a0a 0%,#7f1d1d 45%,#b91c1c 100%)',
              borderRadius:28,border:'1.5px solid rgba(239,68,68,0.35)',
              boxShadow:pressedServices
                ?'0 0 0 4px rgba(185,28,28,0.4),0 20px 50px rgba(185,28,28,0.6),inset 0 1px 0 rgba(255,255,255,0.2)'
                :'0 10px 40px rgba(185,28,28,0.45),0 2px 8px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.15)',
              padding:'28px 24px',cursor:'pointer',
              transform:pressedServices?'scale(0.96)':'scale(1)',
              transition:'all 0.22s cubic-bezier(.34,1.56,.64,1)',
              position:'relative',overflow:'hidden',textAlign:'center',
            }}>
            {/* Glass shine */}
            <div style={{position:'absolute',top:0,left:0,right:0,height:'50%',background:'linear-gradient(180deg,rgba(255,255,255,0.18) 0%,rgba(255,255,255,0) 100%)',borderRadius:'28px 28px 60% 60%',pointerEvents:'none'}}/>
            {/* Icons row */}
            <div style={{display:'flex',justifyContent:'center',gap:12,marginBottom:14}}>
              {['🛵','🚖','🌹','🚬','💊'].map((ic,i)=>(
                <span key={i} style={{fontSize:28,filter:'drop-shadow(0 4px 10px rgba(0,0,0,0.3))',display:'inline-block',animation:`hubFloat ${3+i*0.4}s ease-in-out ${i*0.2}s infinite`}}>{ic}</span>
              ))}
            </div>
            <p style={{color:'#fff',fontSize:22,fontWeight:900,letterSpacing:'0.1em',margin:'0 0 6px',textShadow:'0 2px 8px rgba(0,0,0,0.4)'}} className={fClass}>{t.hubServices}</p>
            <p style={{color:'rgba(255,255,255,0.7)',fontSize:11,fontWeight:600,margin:0}} className={fClass}>{t.hubServicesSub}</p>
          </button>

          {/* GAME BUTTON */}
          <button
            onClick={()=>{setPressedGame(true);setTimeout(()=>navigate('/game'),280);}}
            style={{
              background:pressedGame
                ?'linear-gradient(145deg,#0a1f12,#0f2d1c,#193d28)'
                :'linear-gradient(145deg,#071A10 0%,#0D3020 50%,#142E1E 100%)',
              borderRadius:22,border:'1.5px solid rgba(74,222,128,0.4)',
              boxShadow:pressedGame
                ?'0 0 0 4px rgba(74,222,128,0.3),0 12px 30px rgba(6,95,70,0.5),inset 0 1px 0 rgba(255,255,255,0.2)'
                :'0 8px 28px rgba(6,95,70,0.4),inset 0 1px 0 rgba(255,255,255,0.12)',
              padding:'14px 20px',cursor:'pointer',
              transform:pressedGame?'scale(0.96)':'scale(1)',
              transition:'all 0.22s cubic-bezier(.34,1.56,.64,1)',
              position:'relative',overflow:'hidden',textAlign:'center',
            }}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:'50%',background:'linear-gradient(180deg,rgba(255,255,255,0.12) 0%,rgba(255,255,255,0) 100%)',borderRadius:'22px 22px 60% 60%',pointerEvents:'none'}}/>
            <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:14,marginBottom:10}}>
              <div style={{width:48,height:48,borderRadius:'50%',overflow:'hidden',border:'2px solid #D9C5A0',boxShadow:'0 0 14px rgba(74,222,128,0.5)',flexShrink:0}}>
                <img src="/bridge-shark.png" alt="Game" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top'}}/>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                <span style={{fontSize:24,animation:'hubGemSpin 3s ease-in-out infinite',display:'inline-block',filter:'drop-shadow(0 0 10px rgba(253,224,71,0.7))'}}>💎</span>
                <div style={{background:'rgba(74,222,128,0.18)',border:'1px solid rgba(74,222,128,0.5)',borderRadius:5,padding:'2px 7px'}}>
                  <span style={{color:'#4ADE80',fontSize:8,fontWeight:900,letterSpacing:'0.16em'}}>BRIDGE GAME</span>
                </div>
              </div>
            </div>
            <p style={{color:'#FDE047',fontSize:17,fontWeight:900,letterSpacing:'0.06em',margin:'0 0 4px',textShadow:'0 2px 12px rgba(253,224,71,0.4)'}} className={fClass}>{t.hubGame}</p>
            <p style={{color:'rgba(255,255,255,0.6)',fontSize:10,fontWeight:600,margin:0}} className={fClass}>{t.hubGameSub}</p>
          </button>

          {/* MISSIONS BUTTON */}
          <button
            onClick={()=>navigate('/missions')}
            style={{
              background:'linear-gradient(145deg,#0f172a 0%,#1e1035 50%,#12112a 100%)',
              borderRadius:18,border:'1.5px solid rgba(139,92,246,0.4)',
              boxShadow:'0 6px 24px rgba(109,40,217,0.25),inset 0 1px 0 rgba(255,255,255,0.08)',
              padding:'11px 20px',cursor:'pointer',
              position:'relative',overflow:'hidden',textAlign:'center',
              transition:'all 0.2s',
            }}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:'50%',background:'linear-gradient(180deg,rgba(255,255,255,0.08) 0%,rgba(255,255,255,0) 100%)',borderRadius:'18px 18px 60% 60%',pointerEvents:'none'}}/>
            <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:12,marginBottom:7}}>
              <span style={{fontSize:26}}>💰</span>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                <span style={{fontSize:18}}>🎬</span>
                <div style={{background:'rgba(139,92,246,0.2)',border:'1px solid rgba(139,92,246,0.5)',borderRadius:5,padding:'1px 7px'}}>
                  <span style={{color:'#a78bfa',fontSize:8,fontWeight:900,letterSpacing:'0.16em'}}>MISSIONS</span>
                </div>
              </div>
            </div>
            <p style={{color:'#c4b5fd',fontSize:15,fontWeight:900,letterSpacing:'0.04em',margin:'0 0 3px'}} className={fClass}>Pubs & Missions</p>
            <p style={{color:'rgba(255,255,255,0.5)',fontSize:10,fontWeight:600,margin:0}} className={fClass}>Gagne jusqu'à 15 DH/jour en 💎</p>
          </button>

          {/* HISTORY BUTTON */}
          <button
            onClick={()=>navigate('/history')}
            style={{
              background:'linear-gradient(145deg,#0f1a1a 0%,#0d2020 50%,#0a1515 100%)',
              borderRadius:18,border:'1.5px solid rgba(45,212,191,0.35)',
              boxShadow:'0 6px 24px rgba(20,184,166,0.2),inset 0 1px 0 rgba(255,255,255,0.07)',
              padding:'11px 20px',cursor:'pointer',
              position:'relative',overflow:'hidden',textAlign:'center' as const,
              transition:'all 0.2s',
            }}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:'50%',background:'linear-gradient(180deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0) 100%)',borderRadius:'18px 18px 60% 60%',pointerEvents:'none'}}/>
            <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:14}}>
              <span style={{fontSize:22}}>📋</span>
              <div style={{textAlign:'left' as const}}>
                <p style={{color:'#5EEAD4',fontSize:15,fontWeight:900,letterSpacing:'0.04em',margin:'0 0 2px'}}>Historique</p>
                <p style={{color:'rgba(255,255,255,0.45)',fontSize:10,fontWeight:600,margin:0}}>Courses & commandes passées</p>
              </div>
            </div>
          </button>

        </div>

        {/* Footer */}
        <p style={{color:'#9CA3AF',fontSize:9,textAlign:'center',marginTop:24,letterSpacing:'0.15em'}}>© 2026 BRIDGE SAFI · safi-bridge.ma</p>
      </div>

      {showProfileModal&&<ProfileModal lang={lang} profile={profile} onSave={saveProfile} onClose={()=>setShowProfileModal(false)}/>}
    </div>
  );
}

// ─── HISTORY PAGE ─────────────────────────────────────────────────────────────
type HistoryEntry = {
  ref: string;
  type: 'eats'|'tabac'|'pharmacie'|'fleurs'|'taxi'|'moto';
  date: string;
  total?: number;
  destination?: string;
  address?: string;
  name?: string;
  restaurantName?: string;
};

export function HistoryPageRoute() {
  const [,navigate]=useLocation();
  const {dark}=useDark();
  const [lang]=useState<Lang>(()=>{try{const r=localStorage.getItem('bridge_nav');return r?JSON.parse(r).lang??'fr':'fr';}catch{return 'fr';}});
  const [entries,setEntries]=useState<HistoryEntry[]>(()=>{
    try{const r=localStorage.getItem('bridge_history');return r?JSON.parse(r):[];}catch{return [];}
  });
  const typeInfo:{[k:string]:{icon:string;label:string;color:string}}={
    eats:{icon:'🍔',label:'Bridge Eats',color:'#DC2626'},
    tabac:{icon:'🚬',label:'Bridge Tabac',color:'#6B7280'},
    pharmacie:{icon:'💊',label:'Bridge Pharmacie',color:'#7C3AED'},
    fleurs:{icon:'🌹',label:'Bridge Fleurs',color:'#DB2777'},
    taxi:{icon:'🚖',label:'Bridge Taxi',color:'#B45309'},
    moto:{icon:'🛵',label:'Bridge Moto',color:'#9A3412'},
  };
  const fmtDate=(iso:string)=>{
    try{const d=new Date(iso);return d.toLocaleDateString('fr-MA',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});}catch{return iso;}
  };
  return(
    <DarkModeCtx.Provider value={{dark,toggle:()=>{}}}>
    <div style={{background:dark?'#000':'#F9FAFB',minHeight:'100dvh',fontFamily:'system-ui,sans-serif'}}>
      <style>{`@keyframes hfadeIn{0%{opacity:0;transform:translateY(10px);}100%{opacity:1;transform:translateY(0);}}`}</style>
      {/* Header */}
      <div style={{background:dark?'#111':'#fff',padding:'52px 20px 14px',borderBottom:`1px solid ${dark?'#222':'#E5E7EB'}`,position:'sticky',top:0,zIndex:10,display:'flex',alignItems:'center',gap:12}}>
        <button onClick={()=>navigate('/')} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:dark?'#fff':'#111',padding:'4px 8px',display:'flex',alignItems:'center',justifyContent:'center',width:36,height:36,borderRadius:'50%',flexShrink:0}}>←</button>
        <div style={{flex:1}}>
          <p style={{fontSize:9,fontWeight:800,letterSpacing:'0.2em',color:'#9CA3AF',margin:'0 0 1px'}}>BRIDGE SAFI</p>
          <h1 style={{fontSize:'1.1rem',fontWeight:900,color:dark?'#fff':'#111',margin:0}}>📋 Historique</h1>
        </div>
        <span style={{fontSize:11,color:'#9CA3AF',fontWeight:700}}>{entries.length} entrée{entries.length!==1?'s':''}</span>
      </div>
      {/* Content */}
      <div style={{padding:'16px',maxWidth:480,margin:'0 auto',boxSizing:'border-box' as const}}>
        {entries.length===0?(
          <div style={{textAlign:'center',padding:'80px 20px',animation:'hfadeIn 0.4s ease-out'}}>
            <div style={{fontSize:60,marginBottom:14}}>📭</div>
            <p style={{fontWeight:800,fontSize:17,color:dark?'#fff':'#374151',margin:'0 0 8px'}}>Aucun historique</p>
            <p style={{color:'#9CA3AF',fontSize:13,margin:'0 0 28px'}}>Vos commandes et courses apparaîtront ici après chaque service</p>
            <button onClick={()=>navigate('/')} style={{padding:'12px 24px',borderRadius:14,border:'none',background:'linear-gradient(135deg,#065F46,#34D399)',color:'#fff',fontWeight:900,fontSize:14,cursor:'pointer'}}>
              Découvrir les services
            </button>
          </div>
        ):entries.map((e,i)=>{
          const ti=typeInfo[e.type]||{icon:'📦',label:e.type,color:'#6B7280'};
          return(
            <div key={i} style={{background:dark?'#1C1C1E':'#fff',borderRadius:16,padding:'14px 16px',marginBottom:10,border:`1px solid ${dark?'#2C2C2E':'#E5E7EB'}`,boxShadow:'0 2px 8px rgba(0,0,0,0.05)',animation:`hfadeIn 0.3s ease-out ${i*0.04}s both`}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                <div style={{width:42,height:42,borderRadius:12,background:ti.color+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:21,flexShrink:0,border:`1px solid ${ti.color}22`}}>{ti.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontWeight:900,fontSize:14,color:dark?'#fff':'#111',margin:'0 0 2px'}}>{ti.label}</p>
                  <p style={{fontSize:10,color:'#9CA3AF',margin:0}}>{fmtDate(e.date)}</p>
                </div>
                <div style={{textAlign:'right' as const,flexShrink:0}}>
                  {(e.total??0)>0&&<p style={{fontWeight:900,fontSize:15,color:ti.color,margin:'0 0 2px'}}>{e.total} DH</p>}
                  <span style={{fontSize:10,fontWeight:700,color:'#059669',background:'rgba(5,150,105,0.1)',borderRadius:6,padding:'2px 7px'}}>✓ Effectué</span>
                </div>
              </div>
              <div style={{fontSize:11,fontWeight:600,color:dark?'#D1D5DB':'#374151',background:dark?'#2C2C2E':'#F9FAFB',borderRadius:10,padding:'8px 12px',display:'flex',gap:6,flexWrap:'wrap' as const,alignItems:'center'}}>
                <span style={{color:ti.color,fontWeight:800}}>{e.ref}</span>
                {e.restaurantName&&<span style={{color:'#9CA3AF'}}>· {e.restaurantName}</span>}
                {e.name&&<span style={{color:'#9CA3AF'}}>· {e.name}</span>}
                {e.destination&&<><span style={{color:'#9CA3AF'}}>→</span><span>{e.destination}</span></>}
                {!e.destination&&e.address&&<span style={{color:'#9CA3AF'}}>· {e.address.split(',')[0]}</span>}
              </div>
            </div>
          );
        })}
        {entries.length>0&&(
          <button onClick={()=>{try{localStorage.removeItem('bridge_history');}catch{}setEntries([]);}}
            style={{width:'100%',padding:'13px',borderRadius:14,border:`1px solid ${dark?'#3C3C3E':'#FEE2E2'}`,background:'transparent',color:'#EF4444',fontWeight:700,fontSize:13,cursor:'pointer',marginTop:4}}>
            🗑 Effacer tout l'historique
          </button>
        )}
      </div>
    </div>
    </DarkModeCtx.Provider>
  );
}

function loadNav() {
  try {
    const raw=localStorage.getItem(NAV_KEY);
    if(!raw) return null;
    return JSON.parse(raw) as {lang:Lang;service:'none'|'delivery'|'taxi'|'taxi-select'|'moto'|'tabac'|'fleurs'|'pharmacie';page:Page;restaurantId:string|null};
  } catch { return null; }
}

export default function App() {
  const saved = loadNav();
  const { isLoaded, isSignedIn, user } = useUser();
  const [, navigate] = useLocation();

  // ── Dark mode ──────────────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState<boolean>(() => {
    try { return localStorage.getItem(DARK_KEY) === '1'; } catch { return false; }
  });
  const toggleDark = useCallback(() => setIsDark(d => {
    const next = !d;
    try { localStorage.setItem(DARK_KEY, next ? '1' : '0'); } catch {}
    return next;
  }), []);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const [lang,setLang]         = useState<Lang>(saved?.lang??'fr');
  const [page,setPage]         = useState<Page>(saved?.page??'home');
  // splashDone becomes true after 3s; we also wait for Clerk to load
  const [splashDone,setSplashDone] = useState(false);
  const [mode,setMode]             = useState<'hub'|'services'>('hub');
  const [service,setService]       = useState<'none'|'delivery'|'taxi'|'taxi-select'|'moto'|'tabac'|'fleurs'|'pharmacie'>(saved?.service??'none');
  const [cart,setCart]         = useState<CartItem[]>([]);
  const [showCart,setShowCart] = useState(false);
  const [showProfile,setShowProfile] = useState(false);
  const [showDriver,setShowDriver] = useState(false);
  const [lastOrderRef,setLastOrderRef] = useState<string>(()=>localStorage.getItem('bridge_last_ref')||'');
  const [selectedRestaurant,setSelectedRestaurant] = useState<Restaurant|null>(
    saved?.restaurantId ? (RESTAURANTS.find(r=>r.id===saved.restaurantId)??null) : null
  );
  const {profile,saveProfile}  = useProfile(user?.id);

  // Splash timer — 3 seconds
  useEffect(()=>{
    const t=setTimeout(()=>setSplashDone(true),1500);
    return()=>clearTimeout(t);
  },[]);

  // Track signed-in state for profile features; no forced redirect — app is open to all
  useEffect(()=>{
    if(!isLoaded) return;
    if(isSignedIn){
      try { localStorage.setItem('bridge_was_signed_in','1'); } catch {}
    }
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

  // ── Auto-sync Clerk user data → profile (email + name si vide) ──────────────
  useEffect(()=>{
    if(!user) return;
    const clerkEmail = user.primaryEmailAddress?.emailAddress || '';
    const clerkPhone = user.primaryPhoneNumber?.phoneNumber || '';
    const clerkName  = [user.firstName, user.lastName].filter(Boolean).join(' ');
    let updated = false;
    const patch: Partial<UserProfile> = {};
    if (clerkEmail && !profile.email) { patch.email = clerkEmail; updated = true; }
    if (clerkPhone && !profile.phone) { patch.phone = clerkPhone; updated = true; }
    if (clerkName  && !profile.name)  { patch.name  = clerkName;  updated = true; }
    if (updated) saveProfile({ ...profile, ...patch });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[user?.id]);

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

  // ── Stable dark context value (must be before any conditional return) ──
  const dv = useMemo(() => ({ dark: isDark, toggle: toggleDark }), [isDark, toggleDark]);
  // Eats delivery → GPS tracking page
  const handleOrderSuccess=(ref:string)=>{setLastOrderRef(ref);setService('none');setPage('tracking');};
  // Tabac / Fleurs / Pharmacie → simple countdown tracking (no GPS map)
  const handleSimpleOrderSuccess=(ref:string)=>{setLastOrderRef(ref);setService('none');setPage('simple-tracking');};

  // App is open to all — only block during initial animated splash (1.5s)
  // No sign-in wall: guests and signed-in users both access the app freely
  const isGuest = !isSignedIn;
  const showSplash = !splashDone;
  if(showSplash) return <SplashScreen/>;

  // Profile onboarding after first sign-in
  if(!profile.onboardingComplete) return (
    <DarkModeCtx.Provider value={dv}>
      <ProfileOnboardingScreen
        lang={lang}
        profile={profile}
        saveProfile={saveProfile}
        onDone={()=>saveProfile({...profile,onboardingComplete:true})}
      />
    </DarkModeCtx.Provider>
  );

  if(mode==='hub') return <DarkModeCtx.Provider value={dv}><HubPage onServices={()=>setMode('services')} lang={lang} cycleLang={cycleLang} profile={profile} saveProfile={saveProfile}/><PWAInstallBanner lang={lang}/></DarkModeCtx.Provider>;

  const backToHub=()=>{setMode('hub');setService('none');};
  if(service==='none') return <DarkModeCtx.Provider value={dv}><ServiceSelectPage onSelect={s=>{if(s==='taxi')setService('taxi-select');else setService(s);}} onBack={backToHub} lang={lang} cycleLang={cycleLang} profile={profile} saveProfile={saveProfile}/><PWAInstallBanner lang={lang}/></DarkModeCtx.Provider>;
  if(service==='taxi-select') return <DarkModeCtx.Provider value={dv}><TaxiVehicleSelectPage onBack={()=>setService('none')} onSelect={v=>setService(v)} lang={lang} cycleLang={cycleLang}/></DarkModeCtx.Provider>;
  if(service==='taxi') return <DarkModeCtx.Provider value={dv}><MotoTaxiPage vehicleType='taxi' onBack={()=>setService('taxi-select')} lang={lang} cycleLang={cycleLang} profile={profile} saveProfile={saveProfile}/></DarkModeCtx.Provider>;
  if(service==='moto') return <DarkModeCtx.Provider value={dv}><MotoTaxiPage vehicleType='moto' onBack={()=>setService('taxi-select')} lang={lang} cycleLang={cycleLang} profile={profile} saveProfile={saveProfile}/></DarkModeCtx.Provider>;
  if(service==='tabac') return <DarkModeCtx.Provider value={dv}><TabacPage onBack={()=>setService('none')} lang={lang} cycleLang={cycleLang} profile={profile} saveProfile={saveProfile} onOrderSuccess={handleSimpleOrderSuccess}/></DarkModeCtx.Provider>;
  if(service==='fleurs') return <DarkModeCtx.Provider value={dv}><FleurPage onBack={()=>setService('none')} lang={lang} cycleLang={cycleLang} profile={profile} saveProfile={saveProfile} onOrderSuccess={handleSimpleOrderSuccess}/></DarkModeCtx.Provider>;
  if(service==='pharmacie') return <DarkModeCtx.Provider value={dv}><PharmaciePage onBack={backToHub} lang={lang} cycleLang={cycleLang} profile={profile} saveProfile={saveProfile} onOrderSuccess={handleSimpleOrderSuccess}/></DarkModeCtx.Provider>;

  // Pill button style (shared between lang + profile)
  const pillStyle:React.CSSProperties={
    background:'var(--c-card)',border:'2.5px solid #D9C5A0',color:'#065F46',
    boxShadow:'0 4px 20px rgba(6,95,70,0.15)',height:'44px',minWidth:'44px',
  };

  return (
  <DarkModeCtx.Provider value={dv}>
    <div className={`min-h-screen overflow-x-hidden ${isAR?'rtl':'ltr'}`} style={{color:'var(--c-text)'}}>

      {/* ── Top-left: Back ── */}
      <div className={`fixed top-4 z-50 flex items-center gap-2 ${isAR?'right-4':'left-4'}`}>
        <button onClick={()=>setService('none')}
          className="flex items-center justify-center rounded-full transition-all active:scale-90"
          style={{...pillStyle, width:'42px', height:'42px', padding:0, fontSize:'18px'}}>
          ←
        </button>
      </div>

      {/* ── Top-right: Profile + Language ── */}
      <div className={`fixed top-5 z-50 flex items-center gap-2 ${isAR?'left-5':'right-5'}`}>
       {user ? ( 
    <button onClick={()=>setShowProfile(true)}
          className="rounded-full flex items-center justify-center font-black text-sm transition-all active:scale-90 hover:scale-110 relative"
          style={{...pillStyle,width:'44px',padding:0,overflow:'hidden'}}>
          {profile.avatar
            ?<img src={profile.avatar} alt="Profil" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}}/>
            :<span style={{fontSize:'18px'}}>👤</span>
          }
          {profile.name&&<span className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white" style={{background:'#10B981'}}/>}
        </button>
        ) : (
  <button onClick={() => goToSignIn()}
    className="text-xs font-black px-3 py-1.5 rounded-full"
    style={{background:'#065F46',color:'white',border:'1px solid #D9C5A0'}}>
    {lang==='ar'?'تسجيل الدخول':lang==='amz'?'ⴰⴽⵛⵎ':'Se connecter'}
  </button>
)}
        <button onClick={cycleLang}
          className={`rounded-full flex items-center justify-center font-black text-sm transition-all active:scale-90 hover:scale-110 px-3 ${isAMZ?'font-tifinagh':''}`}
          style={{...pillStyle,fontSize:'13px'}}>
          {LANG_LABELS[lang]}
        </button>
        <DarkToggle/>
      </div>


      {/* ── Header ── */}
      <header className="relative pt-14 pb-4 flex flex-col items-center"
        style={{borderBottom:'1px solid var(--c-border)',background:'var(--c-nav-soft)',backdropFilter:'blur(14px)'}}>
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
        {page==='tracking'&&<TrackingPage lang={lang} t={t} orderRef={lastOrderRef}/>}
        {page==='simple-tracking'&&<SimpleTrackingPage orderRef={lastOrderRef} lang={lang} onNewOrder={()=>{setPage('home');setService('none');setMode('services');}}/>}
        {page==='contact'&&<ContactPage lang={lang} t={t}/>}
      </main>

      {/* ── Bottom nav (hidden on TV/large screens) ── */}
      <nav className="tv-hide-on-tv fixed bottom-0 inset-x-0 z-40"
        style={{background:'var(--c-nav)',backdropFilter:'blur(20px)',borderTop:'1px solid var(--c-border)'}}>
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

      <PWAInstallBanner lang={lang}/>
      {showCart&&<CheckoutDrawer cart={cart} lang={lang} onClose={()=>setShowCart(false)} onQty={adjustQty} profile={profile} saveProfile={saveProfile} onClearCart={clearCart} restaurantName={selectedRestaurant?.name} onOrderSuccess={ref=>{setLastOrderRef(ref);setPage('tracking');setShowCart(false);}}/>}
      {showProfile&&<ProfileModal lang={lang} profile={profile} onSave={saveProfile} onClose={()=>setShowProfile(false)}/>}

      {showDriver&&(
        <div className="fixed inset-0 z-50 flex items-end" style={{background:'rgba(10,30,20,0.7)',backdropFilter:'blur(6px)'}} onClick={()=>setShowDriver(false)}>
          <div className="w-full max-w-md mx-auto rounded-t-3xl p-6" style={{background:'var(--c-bg)',boxShadow:'0 -20px 60px rgba(0,0,0,0.3)'}} onClick={e=>e.stopPropagation()}>
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
  </DarkModeCtx.Provider>
  );
}
