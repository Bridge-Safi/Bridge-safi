import { useEffect, useRef, useState } from 'react';
import { createRoot } from "react-dom/client";
import { ClerkProvider, useClerk, useUser } from '@clerk/react';
import { Switch, Route, useLocation, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import App from "./App";
import "./index.css";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const queryClient = new QueryClient();

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

const clerkAppearance = {
  variables: {
    colorPrimary: '#065F46',
    colorBackground: 'transparent',
    colorText: '#1A2F23',
    colorTextSecondary: '#6B7280',
    colorInputBackground: '#F9F7F2',
    colorInputText: '#1A2F23',
    colorInputPlaceholder: '#9CA3AF',
    borderRadius: '14px',
    fontFamily: 'inherit',
  },
  elements: {
    rootBox: 'w-full',
    card: 'shadow-none p-0 bg-transparent border-none',
    headerTitle: '!hidden',
    headerSubtitle: '!hidden',
    header: '!hidden',
    // Hide all social/OAuth buttons (Google, Apple, etc.)
    socialButtonsRoot: '!hidden',
    socialButtonsBlockButton: '!hidden',
    socialButtonsBlockButtonText: '!hidden',
    socialButtonsIconButton: '!hidden',
    // Hide the "or" divider between social and email form
    dividerRow: '!hidden',
    dividerText: '!hidden',
    // Hide "use another method" link
    alternativeMethodsBlockButton: '!hidden',
    formFieldAction: 'text-[#065F46] font-bold hover:text-[#047857]',
    formFieldInput: 'rounded-2xl border-2 border-[#E5E1D8] focus:border-[#065F46] bg-[#F9F7F2] text-sm h-12 px-4',
    formFieldLabel: 'text-xs font-black text-[#065F46] uppercase tracking-wider',
    formButtonPrimary: 'bg-[#065F46] hover:bg-[#047857] rounded-2xl h-12 text-sm font-black tracking-widest transition-all shadow-lg shadow-green-900/20',
    footerActionLink: 'text-[#065F46] font-bold hover:text-[#047857]',
    identityPreviewText: 'text-[#1A2F23]',
    formFieldSuccessText: 'text-green-700',
    formFieldErrorText: 'text-red-600 text-xs',
    alertText: 'text-sm',
    otpCodeFieldInput: 'rounded-xl border-2 border-[#E5E1D8] focus:border-[#065F46] bg-[#F9F7F2] font-black text-lg',
  },
};

function AuthPageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #011c15 0%, #054130 30%, #065F46 60%, #033d2c 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Geometric zellige pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.05,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23D9C5A0' fill-opacity='1'%3E%3Cpath d='M30 0L0 30L30 60L60 30L30 0zm0 10L50 30L30 50L10 30L30 10z'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px',
      }}/>

      {/* Top arch glow */}
      <div style={{
        position: 'absolute', top: 0, left: '-20%', right: '-20%', height: '300px',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(217,197,160,0.08) 0%, transparent 70%)',
      }}/>

      {/* Bottom glow */}
      <div style={{
        position: 'absolute', bottom: 0, left: '-20%', right: '-20%', height: '200px',
        background: 'radial-gradient(ellipse at 50% 100%, rgba(6,95,70,0.3) 0%, transparent 70%)',
      }}/>

      {/* Logo block */}
      <div style={{ textAlign: 'center', marginBottom: '1.75rem', position: 'relative', zIndex: 1 }}>
        <div style={{
          width: 84, height: 84, borderRadius: '50%', overflow: 'hidden',
          border: '3px solid #D9C5A0',
          boxShadow: '0 0 0 6px rgba(217,197,160,0.12), 0 16px 48px rgba(0,0,0,0.4)',
          margin: '0 auto 1rem',
        }}>
          <img src="/logo_splash_new.png" alt="Bridge Safi"
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.2)' }} />
        </div>

        <h1 style={{
          color: 'white', fontWeight: 900, fontSize: '1.6rem',
          letterSpacing: '0.45em', margin: 0, textShadow: '0 2px 12px rgba(0,0,0,0.4)',
        }}>
          BRIDGE
        </h1>
        <p style={{
          color: '#D9C5A0', fontSize: '0.62rem', letterSpacing: '0.2em',
          fontWeight: 700, margin: '4px 0 0', opacity: 0.9,
        }}>
          SAFI · MAROC · آسفي · ⵙⴰⴼⵉ
        </p>

        {/* Gold bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', margin: '14px 0 6px' }}>
          <div style={{ width: 36, height: 1, background: 'linear-gradient(to right, transparent, #D9C5A0)' }} />
          <div style={{ width: 5, height: 5, background: '#D9C5A0', transform: 'rotate(45deg)' }} />
          <div style={{ width: 36, height: 1, background: 'linear-gradient(to left, transparent, #D9C5A0)' }} />
        </div>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.62rem', letterSpacing: '0.18em', marginTop: 4 }}>
          Bienvenue · Welcome · أهلاً وسهلاً
        </p>
      </div>

      {/* Auth card */}
      <div style={{
        background: 'rgba(253,252,249,0.98)',
        borderRadius: 28,
        padding: '2rem 1.5rem 1.5rem',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(217,197,160,0.25)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Top gold accent bar */}
        <div style={{
          position: 'absolute', top: 0, left: '20%', right: '20%', height: 3,
          background: 'linear-gradient(to right, transparent, #D9C5A0, transparent)',
          borderRadius: '0 0 4px 4px',
        }} />
        {children}
      </div>

      {/* Footer */}
      <p style={{
        color: 'rgba(255,255,255,0.2)', fontSize: '0.55rem',
        marginTop: '1.5rem', letterSpacing: '0.15em', textAlign: 'center',
        position: 'relative', zIndex: 1,
      }}>
        © 2026 BRIDGE SAFI · safi-bridge.ma · 🔒 Sécurisé
      </p>
    </div>
  );
}

function AuthCardHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid #E5E1D8' }}>
      <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: '#1A2F23', margin: 0, letterSpacing: '-0.01em' }}>{title}</h2>
      <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '4px 0 0', fontWeight: 500 }}>{sub}</p>
    </div>
  );
}

// ─── SHARED FORM STYLES ───────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: '100%', padding: '0.75rem 1rem', borderRadius: 14,
  border: '2px solid #E5E1D8', background: '#F9F7F2', color: '#1A2F23',
  fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};
const inpFocus: React.CSSProperties = { ...inp, border: '2px solid #065F46' };
const label: React.CSSProperties = {
  display: 'block', fontSize: '0.65rem', fontWeight: 900,
  color: '#065F46', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6,
};
const btn: React.CSSProperties = {
  width: '100%', padding: '0.875rem', borderRadius: 14, border: 'none',
  background: '#065F46', color: 'white', fontWeight: 900, fontSize: '0.875rem',
  letterSpacing: '0.08em', cursor: 'pointer', fontFamily: 'inherit',
  boxShadow: '0 6px 20px rgba(6,95,70,0.25)', marginTop: 4,
};
const errStyle: React.CSSProperties = {
  background: '#FEE2E2', border: '1.5px solid #FCA5A5', borderRadius: 10,
  padding: '0.6rem 0.875rem', fontSize: '0.75rem', color: '#B91C1C', fontWeight: 600,
};

function FocusInput({ label: labelText, type = 'text', value, onChange, placeholder, autoComplete }: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={label}>{labelText}</label>
      <input
        type={type} value={value} placeholder={placeholder} autoComplete={autoComplete}
        style={focused ? inpFocus : inp}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

// ─── SIGN-IN PAGE (custom — email/phone + password, single screen) ─────────

// ─── FORGOT PASSWORD PAGE ─────────────────────────────────────────────────────

function ForgotPasswordPage() {
  const clerk = useClerk();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setError('');
    try {
      await clerk.client.signIn.create({
        strategy: 'reset_password_email_code',
        identifier: identifier.trim(),
      });
      setStep('reset');
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || '';
      if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('identifier')) {
        setError('Aucun compte trouvé avec cet email ou téléphone.');
      } else {
        setError(msg || 'Erreur lors de l\'envoi du code. Réessayez.');
      }
    }
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (newPwd.length < 8) { setError('Mot de passe trop faible (8 caractères min.).'); return; }
    if (newPwd !== confirmPwd) { setError('Les mots de passe ne correspondent pas.'); return; }
    setLoading(true); setError('');
    try {
      const result = await clerk.client.signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password: newPwd,
      } as any);
      if (result.status === 'complete') {
        await clerk.setActive({ session: result.createdSessionId });
        navigate(basePath || '/');
      } else if (result.status === 'needs_second_factor') {
        setError('Vérification 2FA requise. Reconnectez-vous normalement.');
      } else {
        setError('Réinitialisation incomplète. Réessayez.');
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || '';
      if (msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('invalid')) {
        setError('Code incorrect ou expiré. Réessayez.');
      } else if (msg.toLowerCase().includes('password')) {
        setError('Mot de passe trop faible. Choisissez-en un plus fort.');
      } else {
        setError(msg || 'Erreur. Réessayez.');
      }
    }
    setLoading(false);
  };

  if (step === 'reset') return (
    <AuthPageWrapper>
      <AuthCardHeader
        title="Nouveau mot de passe"
        sub={`Code envoyé à ${identifier.trim()} · Vérifiez vos emails`}
      />
      <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column' }}>
        <FocusInput label="Code reçu (6 chiffres)" value={code} onChange={setCode}
          placeholder="123456" autoComplete="one-time-code" type="tel" />
        <FocusInput label="Nouveau mot de passe (8 car. min.)" type="password" value={newPwd}
          onChange={setNewPwd} placeholder="••••••••" autoComplete="new-password" />
        <FocusInput label="Confirmer le nouveau mot de passe" type="password" value={confirmPwd}
          onChange={setConfirmPwd} placeholder="••••••••" autoComplete="new-password" />
        {error && <div style={errStyle}>{error}</div>}
        <button type="submit" style={{...btn, opacity: loading ? 0.7 : 1}} disabled={loading}>
          {loading ? 'Mise à jour...' : 'Réinitialiser mon mot de passe →'}
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <button onClick={() => { setStep('email'); setError(''); setCode(''); }}
          style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '0.75rem', cursor: 'pointer' }}>
          ← Retour
        </button>
      </div>
    </AuthPageWrapper>
  );

  return (
    <AuthPageWrapper>
      <AuthCardHeader
        title="Mot de passe oublié"
        sub="Entrez votre email ou téléphone pour recevoir un code"
      />
      <form onSubmit={handleSendCode} style={{ display: 'flex', flexDirection: 'column' }}>
        <FocusInput label="Email ou numéro de téléphone" value={identifier} onChange={setIdentifier}
          placeholder="+212 6XX XXX XXX ou email@..." autoComplete="username" />
        {error && <div style={errStyle}>{error}</div>}
        <button type="submit" style={{...btn, opacity: loading ? 0.7 : 1}} disabled={loading}>
          {loading ? 'Envoi...' : 'Envoyer le code →'}
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #E5E1D8' }}>
        <button onClick={() => navigate('/sign-in')}
          style={{ background: 'none', border: 'none', color: '#065F46', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
          ← Retour à la connexion
        </button>
      </div>
    </AuthPageWrapper>
  );
}

// Factor state shared across sign-in steps
type FactorKind = 'first' | 'second';
type FactorStrategy = 'email_code' | 'phone_code' | 'totp' | string;

const STAY_KEY = 'bridge_stay_signed_in';

function SignInPage() {
  const clerk = useClerk();
  const { isLoaded, isSignedIn } = useUser();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [staySignedIn, setStaySignedIn] = useState<boolean>(() => {
    const v = localStorage.getItem(STAY_KEY);
    return v === null ? true : v === 'true';
  });

  // Already signed in → go straight to the app
  useEffect(() => {
    if (isLoaded && isSignedIn) navigate(basePath || '/');
  }, [isLoaded, isSignedIn, navigate]);
  // What factor/strategy Clerk is waiting for
  const [factorKind, setFactorKind] = useState<FactorKind>('second');
  const [factorStrategy, setFactorStrategy] = useState<FactorStrategy>('email_code');
  const [factorDest, setFactorDest] = useState(''); // e.g. "khalidou@icloud.com" or "+212..."

  // Pick the best available factor from a list and return prep params
  const pickFactor = (factors: any[]): { strategy: FactorStrategy; dest: string; prepParams: any } | null => {
    // Priority: email_code > phone_code > totp
    const order: FactorStrategy[] = ['email_code', 'phone_code', 'totp'];
    for (const s of order) {
      const f = factors?.find((x: any) => x.strategy === s);
      if (!f) continue;
      const prepParams: any = { strategy: s };
      let dest = '';
      if (f.safeIdentifier) dest = f.safeIdentifier;
      if (f.emailAddressId) prepParams.emailAddressId = f.emailAddressId;
      if (f.phoneNumberId) prepParams.phoneNumberId = f.phoneNumberId;
      return { strategy: s, dest, prepParams };
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setError('');
    try {
      const result = await clerk.client.signIn.create({
        identifier: identifier.trim(),
        password,
      });
      if (result.status === 'complete') {
        localStorage.setItem(STAY_KEY, String(staySignedIn));
        localStorage.setItem('bridge_was_signed_in', '1');
        await clerk.setActive({ session: result.createdSessionId });
        navigate(basePath || '/');
      } else if (result.status === 'needs_second_factor') {
        const picked = pickFactor((result as any).supportedSecondFactors || []);
        if (picked) {
          setFactorKind('second');
          setFactorStrategy(picked.strategy);
          setFactorDest(picked.dest);
          if (picked.strategy !== 'totp') {
            await clerk.client.signIn.prepareSecondFactor(picked.prepParams);
          }
        }
        setStep('otp');
      } else if (result.status === 'needs_first_factor') {
        const picked = pickFactor((result as any).supportedFirstFactors || []);
        if (picked) {
          setFactorKind('first');
          setFactorStrategy(picked.strategy);
          setFactorDest(picked.dest);
          if (picked.strategy !== 'totp') {
            await clerk.client.signIn.prepareFirstFactor(picked.prepParams);
          }
        }
        setStep('otp');
      } else {
        setError('Connexion incomplète. Contactez le support.');
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || '';
      if (msg.toLowerCase().includes('password')) setError('Mot de passe incorrect.');
      else if (msg.toLowerCase().includes('identifier') || msg.toLowerCase().includes('not found')) setError('Compte introuvable. Vérifiez votre email ou téléphone.');
      else setError(msg || 'Identifiants incorrects. Réessayez.');
    }
    setLoading(false);
  };

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setError('');
    try {
      let result: any;
      if (factorKind === 'second') {
        result = await clerk.client.signIn.attemptSecondFactor({ strategy: factorStrategy as any, code });
      } else {
        result = await clerk.client.signIn.attemptFirstFactor({ strategy: factorStrategy as any, code });
      }
      if (result.status === 'complete') {
        localStorage.setItem(STAY_KEY, String(staySignedIn));
        localStorage.setItem('bridge_was_signed_in', '1');
        await clerk.setActive({ session: result.createdSessionId });
        navigate(basePath || '/');
      } else {
        setError('Code incorrect. Réessayez.');
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || '';
      if (msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('expired')) {
        setError('Code incorrect ou expiré. Réessayez.');
      } else {
        setError(msg || 'Code incorrect. Réessayez.');
      }
    }
    setLoading(false);
  };

  // Build the OTP subtitle based on where the code was sent
  const otpSub = factorStrategy === 'totp'
    ? 'Code depuis votre application authenticator (TOTP)'
    : factorStrategy === 'phone_code'
    ? `SMS envoyé au ${factorDest || 'votre téléphone'}`
    : `Email envoyé à ${factorDest || identifier.trim()}`;

  if (step === 'otp') return (
    <AuthPageWrapper>
      <AuthCardHeader title="Vérification · Verify" sub={otpSub} />
      <form onSubmit={handleOtp} style={{ display: 'flex', flexDirection: 'column' }}>
        <FocusInput
          label={factorStrategy === 'totp' ? 'Code authenticator (6 chiffres)' : 'Code de vérification (6 chiffres)'}
          value={code} onChange={setCode} placeholder="123456"
          autoComplete="one-time-code" type="tel"
        />
        {error && <div style={errStyle}>{error}</div>}
        {/* Hint for totp */}
        {factorStrategy === 'totp' && (
          <p style={{ fontSize: '0.72rem', color: '#9CA3AF', textAlign: 'center', margin: '-4px 0 10px' }}>
            Ouvrez Google Authenticator ou Authy pour obtenir le code
          </p>
        )}
        <button type="submit" style={{...btn, opacity: loading ? 0.7 : 1}} disabled={loading}>
          {loading ? 'Vérification...' : 'Confirmer →'}
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <button onClick={() => { setStep('credentials'); setError(''); setCode(''); }}
          style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '0.75rem', cursor: 'pointer' }}>
          ← Retour
        </button>
      </div>
    </AuthPageWrapper>
  );

  return (
    <AuthPageWrapper>
      <AuthCardHeader title="Connexion · Sign in" sub="Email · Téléphone · Mot de passe" />
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
        <FocusInput label="Email ou numéro de téléphone" value={identifier} onChange={setIdentifier}
          placeholder="+212 6XX XXX XXX ou email@..." autoComplete="username" />
        <FocusInput label="Mot de passe" type="password" value={password} onChange={setPassword}
          placeholder="••••••••" autoComplete="current-password" />
        {error && <div style={errStyle}>{error}</div>}

        {/* Stay signed in checkbox */}
        <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',margin:'10px 0 2px',userSelect:'none'}}>
          <div onClick={()=>setStaySignedIn(v=>!v)} style={{
            width:20,height:20,borderRadius:6,border:`2px solid ${staySignedIn?'#065F46':'#D1D5DB'}`,
            background:staySignedIn?'#065F46':'white',
            display:'flex',alignItems:'center',justifyContent:'center',
            flexShrink:0,transition:'all 0.18s',cursor:'pointer',
          }}>
            {staySignedIn&&<svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <span style={{fontSize:'0.78rem',color:'#374151',fontWeight:600,lineHeight:1.3}}>
            Rester connecté · Stay signed in
          </span>
        </label>

        <button type="submit" style={{...btn, opacity: loading ? 0.7 : 1, marginTop:14}} disabled={loading}>
          {loading ? 'Connexion...' : 'Connexion →'}
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <button onClick={() => navigate('/forgot-password')}
          style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline' }}>
          Mot de passe oublié ?
        </button>
      </div>
      <div style={{ textAlign: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #E5E1D8' }}>
        <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Pas encore de compte ? </span>
        <button onClick={() => navigate('/sign-up')}
          style={{ background: 'none', border: 'none', color: '#065F46', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
          Créer un compte
        </button>
      </div>
    </AuthPageWrapper>
  );
}

// ─── SIGN-UP PAGE (custom — name + email/phone + password, then OTP) ──────

function SignUpPage() {
  const clerk = useClerk();
  const { isLoaded, isSignedIn } = useUser();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [firstName, setFirstName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoaded && isSignedIn) navigate(basePath || '/');
  }, [isLoaded, isSignedIn, navigate]);

  const isPhone = /^\+?[0-9\s]{7,}$/.test(identifier.trim());

  const fmtPhone = (v: string) => {
    let d = v.replace(/[^\d+]/g, '');
    if (!d.startsWith('+')) d = '+212' + d.replace(/^0/, '');
    return d;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!firstName.trim()) { setError('Le prénom est obligatoire.'); return; }
    if (!identifier.trim()) { setError('Email ou numéro de téléphone requis.'); return; }
    if (password.length < 8) { setError('Mot de passe trop court (8 caractères min.).'); return; }
    setLoading(true); setError('');
    try {
      const params: Record<string, string> = { firstName: firstName.trim(), password };
      if (isPhone) params.phoneNumber = fmtPhone(identifier.trim());
      else params.emailAddress = identifier.trim();
      await clerk.client.signUp.create(params);
      if (isPhone) await clerk.client.signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
      else await clerk.client.signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('verify');
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || '';
      if (msg.toLowerCase().includes('email')) setError('Email invalide ou déjà utilisé.');
      else if (msg.toLowerCase().includes('phone')) setError('Numéro invalide ou déjà utilisé.');
      else if (msg.toLowerCase().includes('password')) setError('Mot de passe trop faible (8 caractères min.).');
      else setError(msg || 'Erreur lors de la création du compte.');
    }
    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setError('');
    try {
      const result = isPhone
        ? await clerk.client.signUp.attemptPhoneNumberVerification({ code })
        : await clerk.client.signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await clerk.setActive({ session: result.createdSessionId });
        navigate(basePath || '/');
      } else {
        setError('Code incorrect. Réessayez.');
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage || 'Code incorrect ou expiré.');
    }
    setLoading(false);
  };

  if (step === 'verify') return (
    <AuthPageWrapper>
      <AuthCardHeader
        title="Vérification · Verify"
        sub={isPhone ? `SMS envoyé au ${fmtPhone(identifier.trim())}` : `Code envoyé à ${identifier.trim()}`}
      />
      <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column' }}>
        <FocusInput label="Code de vérification (6 chiffres)" value={code} onChange={setCode}
          placeholder="123456" autoComplete="one-time-code" type="tel" />
        {error && <div style={errStyle}>{error}</div>}
        <button type="submit" style={{...btn, opacity: loading ? 0.7 : 1}} disabled={loading}>
          {loading ? '...' : 'Vérifier →'}
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <button onClick={() => { setStep('form'); setCode(''); setError(''); }}
          style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '0.75rem', cursor: 'pointer' }}>
          ← Retour
        </button>
      </div>
    </AuthPageWrapper>
  );

  return (
    <AuthPageWrapper>
      <AuthCardHeader title="Créer un compte · Sign up" sub="Email ou téléphone + mot de passe" />
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
        <FocusInput label="Prénom *" value={firstName} onChange={setFirstName}
          placeholder="Mohamed, Fatima..." autoComplete="given-name" />
        <FocusInput label="Email ou numéro de téléphone *" value={identifier} onChange={setIdentifier}
          placeholder="+212 6XX XXX XXX ou email@..." autoComplete="username" />
        <FocusInput label="Mot de passe * (8 caractères min.)" type="password" value={password} onChange={setPassword}
          placeholder="••••••••" autoComplete="new-password" />
        {error && <div style={errStyle}>{error}</div>}
        <button type="submit" style={{...btn, opacity: loading ? 0.7 : 1}} disabled={loading}>
          {loading ? 'Création...' : 'Créer mon compte →'}
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #E5E1D8' }}>
        <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Déjà un compte ? </span>
        <button onClick={() => navigate('/sign-in')}
          style={{ background: 'none', border: 'none', color: '#065F46', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
          Se connecter
        </button>
      </div>
    </AuthPageWrapper>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

// ── Session keep-alive: touches the Clerk session every 55s when
//    the user chose "Rester connecté", preventing inactivity sign-out ──────────
function SessionKeepAlive() {
  const clerk = useClerk();
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (!isSignedIn) return;
    const stay = localStorage.getItem(STAY_KEY);
    if (stay === 'false') return;

    const touch = () => {
      try { clerk.session?.touch(); } catch { /* ignore */ }
    };

    touch(); // immediate on mount

    // Refresh every 30s
    const interval = setInterval(touch, 30_000);

    // Refresh when user returns to the tab or app
    const onVisible = () => { if (document.visibilityState === 'visible') touch(); };
    const onFocus = () => touch();

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [isSignedIn, clerk]);

  return null;
}

// ─── GAME PAGE PLACEHOLDER ────────────────────────────────────────────────────

const GAME_LANGS = ['fr','en','ar','amz'] as const;
type GameLang = typeof GAME_LANGS[number];
const GAME_LANG_LABELS: Record<GameLang,string> = {fr:'FR',en:'EN',ar:'AR',amz:'ⴰⵎⵣ'};
const GAME_URL = 'https://de74e39f-30c2-4a4e-81c6-35b38d5328e6-00-2kdljcxzty31v.riker.replit.dev/';
const GAME_TARGET = 15000;
const GAME_T = {
  fr:{ back:'← Retour', playerId:'ID JOUEUR', diamonds:'MES DIAMANTS', playBtn:'🎮 JOUER MAINTENANT', howTitle:'Comment gagner ?', how1:'🎮 Lance le jeu Bridge Shark', how2:'💎 Récoltez 1 000 💎 / heure', how3:'🎁 Échangez vos 💎 contre des cadeaux', rulesBtn:'📜 Règles du jeu', target:'OBJECTIF', progress:'PROGRESSION', days:'5 jours · 3-4h/jour', pts:'pts', bonusTitle:'🎁 BONUS LIVRAISON OFFERTE', bonusDesc:'Jouez 2h de plus → votre prochaine livraison est GRATUITE !', bonusDiaTitle:'💎 BONUS DIAMANTS', bonusDiaDesc:'+2 000 💎 offerts si vous jouez 2h supplémentaires par jour' },
  en:{ back:'← Back',   playerId:'PLAYER ID',  diamonds:'MY DIAMONDS',  playBtn:'🎮 PLAY NOW',             howTitle:'How to win?',        how1:'🎮 Launch the Bridge Shark game', how2:'💎 Collect 1,000 💎 per hour', how3:'🎁 Redeem 💎 for free gifts',       rulesBtn:'📜 Game Rules',   target:'TARGET',    progress:'PROGRESS',    days:'5 days · 3-4h/day',  pts:'pts', bonusTitle:'🎁 FREE DELIVERY BONUS', bonusDesc:'Play 2 extra hours → your next delivery is FREE!', bonusDiaTitle:'💎 DIAMOND BONUS', bonusDiaDesc:'+2,000 💎 bonus if you play 2 extra hours per day' },
  ar:{ back:'→ رجوع',   playerId:'معرّف اللاعب',diamonds:'ماساتي',       playBtn:'🎮 العب الآن',             howTitle:'كيف تفوز؟',          how1:'🎮 شغّل لعبة Bridge Shark',      how2:'💎 اجمع 1 000 💎 كل ساعة',    how3:'🎁 استبدل 💎 بهدايا مجانية',       rulesBtn:'📜 قواعد اللعبة', target:'الهدف',     progress:'التقدم',      days:'5 أيام · 3-4 ساعات', pts:'نقطة', bonusTitle:'🎁 مكافأة التوصيل المجاني', bonusDesc:'العب ساعتين إضافيتين → توصيلك التالي مجاني!', bonusDiaTitle:'💎 مكافأة الماسات', bonusDiaDesc:'+2 000 💎 إضافية إذا لعبت ساعتين أكثر في اليوم' },
  amz:{ back:'← ⴰⵣⵣⵓⵍ', playerId:'ⴰⵏⴳⵔⴰⵡ',  diamonds:'ⵉⴷⵢⴰⵎⴰⵏ ⵉⵏⵓ', playBtn:'🎮 ⵙⵖⵔ ⴷⴰⵖⵉ',             howTitle:'ⵎⴰⵎⴽ ⴰⴷ ⵜⴽⵙⵎ?',       how1:'🎮 ⵙⵏⵓⴱⴳ Bridge Shark',         how2:'💎 1 000 💎 ⵙ ⵜⵉⵙⵙⵓⵜ',        how3:'🎁 ⵙⴽⵍⵙ 💎',                       rulesBtn:'📜 ⵜⵉⵖⵔⵉ',        target:'ⴰⵎⵓⵟⵟⵓ',  progress:'ⴰⵎⵙⵉⵡⴹ',     days:'5 ⵡⴰⵙⵙⴰⵜⵏ',          pts:'ⵜⵉⵏⵎⵍⴰⵏ', bonusTitle:'🎁 ⴰⵣⵏⵏⵣ ⴱⵍⴰ ⴰⵣⵔⴼ', bonusDesc:'+2 ⵜⵉⵙⵙⵓⵜⵉⵏ → ⴰⵣⵏⵏⵣ ⵢⵉⵍⵉ ⵖⵔⴰⵜⴽ!', bonusDiaTitle:'💎 ⴱⵓⵏⵓⵙ ⵉⴷⵢⴰⵎⴰⵏ', bonusDiaDesc:'+2 000 💎 ⵙ 2 ⵜⵉⵙⵙⵓⵜⵉⵏ ⵢⴰⴹⵏⵉⵏ' },
};

// ─── BRIDGE GAME RULES MODAL ──────────────────────────────────────────────────

function GameRulesModal({ lang, onClose }: { lang: GameLang; onClose: () => void }) {
  const isAR = lang === 'ar';
  const rules = {
    fr: {
      title: '📜 Règles du Jeu',
      subtitle: 'Bridge Shark — Comment gagner ?',
      sections: [
        {
          icon: '⏱️', title: 'Durée de jeu',
          points: [
            'Jouez 3 à 4 heures par jour pendant 5 jours consécutifs',
            'Durée totale minimum : 15 heures sur 5 jours',
            '🎁 Plus vous jouez, plus vous gagnez de 💎 !',
          ]
        },
        {
          icon: '💎', title: 'Diamants à récolter',
          points: [
            'Objectif : récolter 15 000 💎 en 5 jours',
            'Rythme : 1 000 💎 par heure de jeu',
            'Chaque 1 000 💎 vaut 5 DH',
          ]
        },
        {
          icon: '💸', title: 'Diamants manquants',
          points: [
            'Si vous atteignez votre objectif → tout est offert ! 🎉',
            'S\'il manque 1 000 💎 → vous payez 5 DH',
            'S\'il manque 3 000 💎 → vous payez 15 DH',
            'Calcul : diamants manquants ÷ 1 000 × 5 DH',
          ]
        },
        {
          icon: '🚴', title: 'BONUS — Livraison gratuite',
          points: [
            'Jouez 2h DE PLUS que votre session normale',
            '→ Votre prochaine livraison est 100% GRATUITE 🎁',
            '→ Vous gagnez aussi +2 000 💎 bonus !',
          ]
        },
        {
          icon: '🎁', title: 'Comment utiliser vos gains',
          points: [
            '🛵 Un menu depuis Bridge Eats',
            '🚬 Un paquet de cigarettes via Bridge Tabac',
            '🌹 Une coupe de fleurs via Bridge Fleurs',
            'Échangez directement dans l\'application !',
          ]
        },
      ],
      example: '💡 Exemple : vous terminez avec 12 000 💎 au lieu de 15 000 → il manque 3 000 💎 → vous payez 15 DH seulement.',
      close: 'J\'ai compris ! 🦈',
    },
    en: {
      title: '📜 Game Rules',
      subtitle: 'Bridge Shark — How to win?',
      sections: [
        {
          icon: '⏱️', title: 'Playing time',
          points: [
            'Play 3 to 4 hours per day for 5 consecutive days',
            'Minimum total: 15 hours over 5 days',
            '🎁 The more you play, the more 💎 you earn!',
          ]
        },
        {
          icon: '💎', title: 'Diamonds to collect',
          points: [
            'Goal: collect 15,000 💎 in 5 days',
            'Pace: 1,000 💎 per hour of play',
            'Every 1,000 💎 = 5 MAD value',
          ]
        },
        {
          icon: '💸', title: 'Missing diamonds',
          points: [
            'Reach the goal → everything is free! 🎉',
            'Missing 1,000 💎 → you pay 5 MAD',
            'Missing 3,000 💎 → you pay 15 MAD',
            'Formula: missing diamonds ÷ 1,000 × 5 MAD',
          ]
        },
        {
          icon: '🚴', title: 'BONUS — Free delivery',
          points: [
            'Play 2 EXTRA hours beyond your normal session',
            '→ Your next delivery is 100% FREE 🎁',
            '→ You also earn +2,000 💎 bonus!',
          ]
        },
        {
          icon: '🎁', title: 'How to use your winnings',
          points: [
            '🛵 A meal from Bridge Eats',
            '🚬 A pack of cigarettes from Bridge Tabac',
            '🌹 A bunch of flowers from Bridge Fleurs',
            'Redeem directly in the app!',
          ]
        },
      ],
      example: '💡 Example: you finish with 12,000 💎 instead of 15,000 → missing 3,000 💎 → you pay only 15 MAD.',
      close: 'Got it! 🦈',
    },
    ar: {
      title: '📜 قواعد اللعبة',
      subtitle: 'Bridge Shark — كيف تفوز؟',
      sections: [
        {
          icon: '⏱️', title: 'وقت اللعب',
          points: [
            'العب من 3 إلى 4 ساعات يومياً لمدة 5 أيام متتالية',
            'الحد الأدنى : 15 ساعة على مدى 5 أيام',
            '🎁 كلما لعبت أكثر، كسبت ماسات أكثر!',
          ]
        },
        {
          icon: '💎', title: 'الماسات المطلوبة',
          points: [
            'الهدف : جمع 15 000 💎 خلال 5 أيام',
            'الوتيرة : 1 000 💎 في كل ساعة لعب',
            'كل 1 000 💎 يساوي 5 درهم',
          ]
        },
        {
          icon: '💸', title: 'الماسات الناقصة',
          points: [
            'حققت الهدف → كل شيء مجاني! 🎉',
            'ناقص 1 000 💎 → تدفع 5 دراهم',
            'ناقص 3 000 💎 → تدفع 15 درهماً',
            'الحساب : الماسات الناقصة ÷ 1 000 × 5 درهم',
          ]
        },
        {
          icon: '🚴', title: 'مكافأة — توصيل مجاني',
          points: [
            'العب ساعتين إضافيتين فوق جلستك العادية',
            '→ توصيلك التالي مجاني 100% 🎁',
            '→ تكسب أيضاً +2 000 💎 إضافية!',
          ]
        },
        {
          icon: '🎁', title: 'كيف تستخدم مكاسبك',
          points: [
            '🛵 وجبة من Bridge Eats',
            '🚬 علبة سجائر من Bridge Tabac',
            '🌹 باقة ورد من Bridge Fleurs',
            'استبدل مباشرة من التطبيق!',
          ]
        },
      ],
      example: '💡 مثال : أنهيت اللعبة بـ 12 000 💎 بدلاً من 15 000 → ناقص 3 000 💎 → تدفع 15 درهماً فقط.',
      close: 'فهمت! 🦈',
    },
    amz: {
      title: '📜 ⵜⵉⵖⵔⵉ ⵏ ⵓⵎⴽⵙⴰⵡ',
      subtitle: 'Bridge Shark',
      sections: [
        {
          icon: '⏱️', title: 'ⴰⵣⵎⵣ ⵏ ⵓⵎⴽⵙⴰⵡ',
          points: [
            '3 ⴰⵔ 4 ⵜⵉⵙⵙⵓⵜⵉⵏ ⵙ ⵡⴰⵙⵙ, 5 ⵡⴰⵙⵙⴰⵜⵏ',
            'ⴰⵣⵎⵣ ⴰⵎⵏⵣⵡⴰⵔⵓ : 15 ⵜⵉⵙⵙⵓⵜⵉⵏ',
            '🎁 ⴽⵓⵍⵍⵓ ⵉⵍⵎⵎⴰⵏ → ⵉⵍⵎⵎⴰⵏ ⵉⵏⵙ 💎!',
          ]
        },
        {
          icon: '💎', title: 'ⵉⴷⵢⴰⵎⴰⵏ ⵉⵍⴰⵎⵎⴰⵏ',
          points: [
            'ⴰⵎⵓⵟⵟⵓ : 15 000 💎 ⵙ 5 ⵡⴰⵙⵙⴰⵜⵏ',
            '1 000 💎 ⵙ ⵜⵉⵙⵙⵓⵜ ⵢⴰⵜⵜ',
            '1 000 💎 = 5 ⴷⵔⵀⵎ',
          ]
        },
        {
          icon: '💸', title: 'ⵉⴷⵢⴰⵎⴰⵏ ⵉⵍⵍⴰⵏ',
          points: [
            'ⵓⵚⴽⵉⴷ ⴰⵎⵓⵟⵟⵓ → ⴽⵓⵍⵍⵓ ⵢⵉⵍⵉ ⵖⵔⴰⵜⴽ! 🎉',
            'ⵢⵍⵍⴰ 1 000 💎 → 5 ⴷⵔⵀⵎ',
            'ⵢⵍⵍⴰ 3 000 💎 → 15 ⴷⵔⵀⵎ',
          ]
        },
        {
          icon: '🚴', title: 'ⴱⵓⵏⵓⵙ — ⴰⵣⵏⵏⵣ ⴱⵍⴰ ⴰⵣⵔⴼ',
          points: [
            '+2 ⵜⵉⵙⵙⵓⵜⵉⵏ ⵢⴰⴹⵏⵉⵏ → ⴰⵣⵏⵏⵣ ⵢⵉⵍⵉ ⵖⵔⴰⵜⴽ 🎁',
            '+2 000 💎 ⴱⵓⵏⵓⵙ!',
          ]
        },
        {
          icon: '🎁', title: 'ⵎⴰⵎⴽ ⵜⵙⵖⵔⵙⴷ ⵉⵔⵏⵓⵜⵏ ⵏⵏⴽ',
          points: [
            '🛵 ⴰⵎⵏⵙⵉ ⵙ Bridge Eats',
            '🚬 ⵜⴰⴱⴰⵖⵓⵔⵜ ⵙ Bridge Tabac',
            '🌹 ⵉⵣⵓⵍⴰⵏ ⵙ Bridge Fleurs',
          ]
        },
      ],
      example: '💡 12 000 💎 ⴷⴳ 15 000 → ⵢⵍⵍⴰ 3 000 → 15 ⴷⵔⵀⵎ.',
      close: 'ⵙⵙⵉⵏⵖ! 🦈',
    },
  };

  const r = rules[lang];
  return (
    <div style={{position:'fixed',inset:0,zIndex:300,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(6px)',display:'flex',flexDirection:'column',overflowY:'auto'}}
      onClick={onClose}>
      <div style={{maxWidth:420,width:'100%',margin:'auto',padding:'16px 12px'}} onClick={e=>e.stopPropagation()}>
        <div style={{background:'linear-gradient(160deg,#020c07 0%,#0A2218 60%,#0D2E1A 100%)',borderRadius:24,border:'2px solid rgba(74,222,128,0.3)',overflow:'hidden',boxShadow:'0 24px 80px rgba(0,0,0,0.7)'}}>
          {/* Header */}
          <div style={{padding:'24px 20px 16px',textAlign:'center',background:'linear-gradient(180deg,rgba(6,95,70,0.3) 0%,transparent 100%)'}}>
            <div style={{width:72,height:72,borderRadius:'50%',overflow:'hidden',border:'2.5px solid #065F46',margin:'0 auto 12px',boxShadow:'0 0 30px rgba(6,95,70,0.5)'}}>
              <img src="/bridge-shark.png" alt="Bridge Shark" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top'}}/>
            </div>
            <h2 style={{color:'#fff',fontSize:20,fontWeight:900,margin:'0 0 4px',letterSpacing:1}}>{r.title}</h2>
            <p style={{color:'rgba(255,255,255,0.5)',fontSize:12,margin:0}}>{r.subtitle}</p>
          </div>

          {/* Rules sections */}
          <div style={{padding:'0 16px 8px',direction:isAR?'rtl':'ltr'}}>
            {r.sections.map((s, si) => (
              <div key={si} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:16,padding:'14px 16px',marginBottom:10}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10,flexDirection:isAR?'row-reverse':'row'}}>
                  <span style={{fontSize:20}}>{s.icon}</span>
                  <p style={{color:'#4ADE80',fontSize:12,fontWeight:900,margin:0,letterSpacing:0.5,textTransform:'uppercase'}}>{s.title}</p>
                </div>
                {s.points.map((p, pi) => (
                  <div key={pi} style={{display:'flex',alignItems:'flex-start',gap:8,marginBottom:6,flexDirection:isAR?'row-reverse':'row'}}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:'#FDE047',marginTop:5,flexShrink:0}}/>
                    <p style={{color:'rgba(255,255,255,0.8)',fontSize:13,margin:0,lineHeight:1.5}}>{p}</p>
                  </div>
                ))}
              </div>
            ))}

            {/* Example */}
            <div style={{background:'rgba(253,224,71,0.1)',border:'1px solid rgba(253,224,71,0.3)',borderRadius:14,padding:'12px 14px',marginBottom:16}}>
              <p style={{color:'#FDE047',fontSize:12,margin:0,lineHeight:1.6}}>{r.example}</p>
            </div>
          </div>

          {/* Close button */}
          <div style={{padding:'0 16px 20px'}}>
            <button onClick={onClose}
              style={{width:'100%',padding:'14px',borderRadius:16,background:'linear-gradient(135deg,#065F46,#059669)',border:'none',color:'#fff',fontSize:15,fontWeight:900,cursor:'pointer',boxShadow:'0 6px 24px rgba(6,95,70,0.5)',letterSpacing:0.5}}>
              {r.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GamePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [, navigate] = useLocation();
  const [showGame, setShowGame] = useState(false);

  // Read language from persisted nav state, default fr
  const [lang, setLang] = useState<GameLang>(()=>{
    try {
      const raw = localStorage.getItem('bridge_nav_state');
      if (raw) { const p = JSON.parse(raw); if (GAME_LANGS.includes(p.lang)) return p.lang; }
    } catch {}
    return 'fr';
  });
  const cycleLang = () => setLang(l => {
    const idx = GAME_LANGS.indexOf(l);
    const next = GAME_LANGS[(idx+1)%GAME_LANGS.length];
    // persist back
    try {
      const raw = localStorage.getItem('bridge_nav_state');
      const state = raw ? JSON.parse(raw) : {};
      localStorage.setItem('bridge_nav_state', JSON.stringify({...state, lang: next}));
    } catch {}
    return next;
  });

  const [showRules, setShowRules] = useState(false);

  const t = GAME_T[lang];
  const isAR = lang === 'ar';

  // Server-side diamonds state
  const [serverDiamonds, setServerDiamonds] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;
    fetch('/api/game/diamonds', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && typeof data.diamonds === 'number') setServerDiamonds(data.diamonds); })
      .catch(() => {});
  }, [isLoaded, isSignedIn, user?.id]);

  // Show lock screen if not signed in (instead of hard redirect)
  if (isLoaded && !isSignedIn) {
    const lockT = {
      fr: { title: 'CONNEXION BRIDGE REQUISE', game: 'SAFI RUNNER', desc: 'Pour jouer, connecte-toi d\'abord sur Bridge avec ton email et ton numéro. Tu seras automatiquement reconnu sur le jeu et tes diamants seront synchronisés.', btn: 'ME CONNECTER SUR BRIDGE', note: 'Bridge gère la connexion. Tes 💎 sont liés à ton compte — joue depuis n\'importe quel appareil avec le même email.' },
      en: { title: 'BRIDGE LOGIN REQUIRED', game: 'SAFI RUNNER', desc: 'To play, first sign in to Bridge with your email and phone number. You\'ll be automatically recognized and your diamonds will be synced.', btn: 'SIGN IN TO BRIDGE', note: 'Bridge manages your login. Your 💎 are linked to your account — play from any device with the same email.' },
      ar: { title: 'تسجيل الدخول مطلوب', game: 'SAFI RUNNER', desc: 'للعب، سجّل دخولك أولاً على Bridge بالبريد الإلكتروني والهاتف. سيتم التعرف عليك تلقائياً وسيتم مزامنة ماساتك.', btn: 'تسجيل الدخول على Bridge', note: 'Bridge يدير حسابك. 💎 مرتبطة بحسابك — العب من أي جهاز.' },
      amz: { title: 'ⴰⵙⵉⵔⴳ ⴰⴷ BRIDGE', game: 'SAFI RUNNER', desc: 'ⵉⵔⵉ ⴰⴷ ⵜⵙⵖⵔⴷ, ⴽⵛⵎ ⵉ Bridge ⵙ email ⴷ ⵓⵜⵉⵍⵉⴼⵓⵏ. ⵉⴷⵢⴰⵎⴰⵏ ⵖⵉⴽ ⴷ ⴰⵔⵓⴷ ⵙ ⵓⵃⵙⴰⴱ ⵏⵏⴽ.', btn: 'ⴽⵛⵎ ⵉ Bridge', note: 'Bridge ⵉⵙⴼⵍⵙ ⵓⵃⵙⴰⴱ ⵏⵏⴽ. 💎 ⵔⴱⵓⵏⵜ ⵉ ⵓⵃⵙⴰⴱ ⵏⵏⴽ.' },
    }[lang];
    const isAR2 = lang === 'ar';
    return (
      <div dir={isAR2 ? 'rtl' : 'ltr'} style={{minHeight:'100dvh',background:'linear-gradient(180deg,#04110A 0%,#071C11 60%,#050F08 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 20px',gap:0}}>
        <div style={{position:'absolute',top:-60,left:'10%',width:280,height:280,borderRadius:'50%',background:'radial-gradient(circle,rgba(74,222,128,0.1) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:40,right:'5%',width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(253,224,71,0.06) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{width:'100%',maxWidth:360,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(74,222,128,0.2)',borderRadius:28,padding:'36px 24px 28px',display:'flex',flexDirection:'column',alignItems:'center',gap:16,backdropFilter:'blur(12px)'}}>
          <div style={{fontSize:52,lineHeight:1}}>🔒</div>
          <p style={{color:'#4ADE80',fontSize:10,fontWeight:900,letterSpacing:'0.18em',margin:0,textAlign:'center',textTransform:'uppercase'}}>{lockT.title}</p>
          <p style={{color:'#fff',fontSize:22,fontWeight:900,letterSpacing:'0.12em',margin:0,textAlign:'center'}}>🦈 {lockT.game}</p>
          <p style={{color:'rgba(255,255,255,0.65)',fontSize:13,fontWeight:500,lineHeight:1.6,textAlign:'center',margin:0}}>{lockT.desc}</p>
          <button onClick={()=>navigate('/sign-in')} style={{width:'100%',padding:'18px 0',borderRadius:18,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#059669 0%,#4ADE80 50%,#059669 100%)',backgroundSize:'200% 100%',color:'#fff',fontSize:15,fontWeight:900,letterSpacing:'0.08em',marginTop:4,boxShadow:'0 0 24px rgba(74,222,128,0.35)'}}>
            🛵 {lockT.btn}
          </button>
          <p style={{color:'rgba(255,255,255,0.28)',fontSize:10,fontWeight:600,textAlign:'center',margin:0,lineHeight:1.5}}>🔐 {lockT.note}</p>
        </div>
        <div style={{marginTop:20,display:'flex',gap:8}}>
          {GAME_LANGS.map(l => (
            <button key={l} onClick={()=>setLang(l)} style={{background: l===lang ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.04)',border: l===lang ? '1px solid rgba(74,222,128,0.4)' : '1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'6px 10px',color: l===lang ? '#4ADE80' : 'rgba(255,255,255,0.4)',fontSize:10,fontWeight:900,cursor:'pointer'}}>
              {GAME_LANG_LABELS[l]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!isLoaded) return null;

  const gameId = user?.id
    ? 'BR-' + user.id.replace(/[^a-z0-9]/gi, '').slice(-7).toUpperCase()
    : 'BR-???????';

  const localDiamonds = (() => {
    try { return parseInt(localStorage.getItem(`bridge_game_pts_${user?.id||'guest'}`) || '0', 10); } catch { return 0; }
  })();

  const gamePoints = serverDiamonds !== null ? Math.max(serverDiamonds, localDiamonds) : localDiamonds;

  const pct = Math.min(100, Math.round((gamePoints / GAME_TARGET) * 100));

  return (
    <div dir={isAR?'rtl':'ltr'} style={{minHeight:'100dvh',background:'linear-gradient(180deg,#04110A 0%,#071C11 50%,#050F08 100%)',display:'flex',flexDirection:'column',alignItems:'center',padding:'0 0 32px',position:'relative',overflow:'hidden'}}>

      {/* Animated bg glows */}
      <div style={{position:'absolute',top:-80,left:'10%',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(74,222,128,0.12) 0%,transparent 70%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',top:200,right:'-10%',width:220,height:220,borderRadius:'50%',background:'radial-gradient(circle,rgba(253,224,71,0.08) 0%,transparent 70%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:0,left:'20%',width:280,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(6,95,70,0.15) 0%,transparent 70%)',pointerEvents:'none'}}/>

      {/* ── TOP BAR ── */}
      <div style={{width:'100%',maxWidth:420,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'52px 16px 0'}}>
        <button onClick={()=>navigate('/')}
          style={{display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:12,padding:'8px 14px',color:'#fff',fontSize:13,fontWeight:800,cursor:'pointer'}}>
          ← {t.back.replace('←','').replace('→','').trim()}
        </button>
        <div style={{display:'flex',gap:8}}>
          <button onClick={cycleLang}
            style={{background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.3)',color:'#4ADE80',borderRadius:10,padding:'7px 12px',fontSize:11,fontWeight:900,cursor:'pointer'}}>
            {GAME_LANG_LABELS[lang]}
          </button>
          <button onClick={()=>setShowRules(true)}
            style={{background:'rgba(253,224,71,0.1)',border:'1px solid rgba(253,224,71,0.35)',color:'#FDE047',borderRadius:10,padding:'7px 12px',fontSize:11,fontWeight:900,cursor:'pointer'}}>
            📜
          </button>
        </div>
      </div>

      {showRules && <GameRulesModal lang={lang} onClose={()=>setShowRules(false)}/>}

      {/* ── HERO SECTION ── */}
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginTop:20,marginBottom:0,position:'relative'}}>
        {/* Outer ring */}
        <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{position:'absolute',width:200,height:200,borderRadius:'50%',border:'2px solid rgba(74,222,128,0.2)',animation:'spin 12s linear infinite'}}/>
          <div style={{position:'absolute',width:220,height:220,borderRadius:'50%',border:'1px dashed rgba(74,222,128,0.12)',animation:'spin 20s linear infinite reverse'}}/>
          <div style={{width:175,height:175,borderRadius:'50%',overflow:'hidden',border:'3px solid #059669',boxShadow:'0 0 40px rgba(5,150,105,0.5),0 0 80px rgba(5,150,105,0.2)',background:'#071C11',position:'relative',zIndex:1}}>
            <img src="/bridge-shark.png" alt="Bridge Shark" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top'}}/>
          </div>
          {/* Live badge */}
          <div style={{position:'absolute',bottom:8,right:8,background:'#059669',border:'2px solid #04110A',borderRadius:20,padding:'3px 10px',display:'flex',alignItems:'center',gap:4,zIndex:2}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:'#4ADE80',boxShadow:'0 0 6px #4ADE80',animation:'blink 1.2s ease-in-out infinite'}}/>
            <span style={{color:'#fff',fontSize:9,fontWeight:900,letterSpacing:'0.1em'}}>LIVE</span>
          </div>
        </div>

        {/* Title */}
        <h1 style={{color:'#fff',fontSize:'2.2rem',fontWeight:900,letterSpacing:'0.3em',margin:'16px 0 0',textShadow:'0 0 40px rgba(74,222,128,0.4)'}}>BRIDGE</h1>
        <div style={{display:'flex',alignItems:'center',gap:8,marginTop:2}}>
          <div style={{height:1,width:30,background:'linear-gradient(to right,transparent,#4ADE80)'}}/>
          <span style={{color:'#4ADE80',fontSize:'0.75rem',fontWeight:900,letterSpacing:'0.5em'}}>SHARK</span>
          <div style={{height:1,width:30,background:'linear-gradient(to left,transparent,#4ADE80)'}}/>
        </div>
      </div>

      {/* ── CARDS ROW ── */}
      <div style={{display:'flex',gap:10,marginTop:20,width:'100%',maxWidth:380,padding:'0 16px'}}>
        {/* Player ID */}
        <div style={{flex:1,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(74,222,128,0.2)',borderRadius:16,padding:'12px 14px'}}>
          <p style={{color:'rgba(255,255,255,0.4)',fontSize:9,fontWeight:800,letterSpacing:'0.15em',margin:'0 0 4px',textTransform:'uppercase'}}>{t.playerId}</p>
          <p style={{color:'#4ADE80',fontSize:15,fontWeight:900,letterSpacing:'0.1em',margin:0}}>{gameId}</p>
        </div>
        {/* Days */}
        <div style={{flex:1,background:'rgba(253,224,71,0.07)',border:'1px solid rgba(253,224,71,0.2)',borderRadius:16,padding:'12px 14px'}}>
          <p style={{color:'rgba(255,255,255,0.4)',fontSize:9,fontWeight:800,letterSpacing:'0.1em',margin:'0 0 4px',textTransform:'uppercase'}}>⏱️ SESSION</p>
          <p style={{color:'#FDE047',fontSize:11,fontWeight:900,margin:0,lineHeight:1.3}}>{t.days}</p>
        </div>
      </div>

      {/* ── DIAMOND PROGRESS ── */}
      <div style={{width:'100%',maxWidth:380,padding:'0 16px',marginTop:12}}>
        <div style={{background:'rgba(253,224,71,0.07)',border:'1px solid rgba(253,224,71,0.25)',borderRadius:20,padding:'16px 18px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div>
              <p style={{color:'rgba(255,255,255,0.4)',fontSize:9,fontWeight:800,letterSpacing:'0.15em',margin:'0 0 2px',textTransform:'uppercase'}}>{t.diamonds}</p>
              <p style={{color:'#FDE047',fontSize:26,fontWeight:900,margin:0,lineHeight:1}}>
                {gamePoints.toLocaleString()} <span style={{fontSize:14,color:'rgba(253,224,71,0.6)'}}>💎</span>
              </p>
            </div>
            <div style={{textAlign:'right'}}>
              <p style={{color:'rgba(255,255,255,0.4)',fontSize:9,fontWeight:800,letterSpacing:'0.1em',margin:'0 0 2px',textTransform:'uppercase'}}>{t.target}</p>
              <p style={{color:'rgba(253,224,71,0.5)',fontSize:14,fontWeight:900,margin:0}}>{GAME_TARGET.toLocaleString()} 💎</p>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{background:'rgba(0,0,0,0.3)',borderRadius:99,height:10,overflow:'hidden'}}>
            <div style={{height:'100%',borderRadius:99,background:'linear-gradient(90deg,#065F46,#4ADE80)',width:`${pct}%`,transition:'width 0.5s ease',boxShadow:'0 0 10px rgba(74,222,128,0.5)'}}/>
          </div>
          <p style={{color:'rgba(255,255,255,0.35)',fontSize:10,fontWeight:700,margin:'6px 0 0',textAlign:'center'}}>{pct}% · {t.progress}</p>
        </div>
      </div>

      {/* ── PLAY BUTTON ── */}
      <div style={{width:'100%',maxWidth:380,padding:'0 16px',marginTop:14}}>
        <button onClick={()=>setShowGame(true)} style={{
          width:'100%',padding:'18px 0',borderRadius:20,border:'none',cursor:'pointer',
          background:'linear-gradient(135deg,#059669 0%,#4ADE80 50%,#059669 100%)',
          backgroundSize:'200% 100%',
          boxShadow:'0 0 30px rgba(74,222,128,0.4),0 4px 24px rgba(5,150,105,0.5)',
          color:'#fff',fontSize:18,fontWeight:900,letterSpacing:'0.1em',
          animation:'shimmer 2.5s linear infinite',
        }}>
          {t.playBtn}
        </button>
      </div>

      {/* ── FULLSCREEN GAME IFRAME OVERLAY ── */}
      {showGame && (
        <div style={{position:'fixed',inset:0,zIndex:9999,background:'#000',display:'flex',flexDirection:'column'}}>
          {/* Header bar with back button */}
          <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',background:'#04110A',borderBottom:'1px solid rgba(74,222,128,0.2)',flexShrink:0}}>
            <button onClick={()=>setShowGame(false)} style={{
              display:'flex',alignItems:'center',gap:6,
              background:'rgba(74,222,128,0.12)',border:'1px solid rgba(74,222,128,0.3)',
              borderRadius:12,padding:'8px 14px',color:'#4ADE80',fontSize:13,fontWeight:900,cursor:'pointer'
            }}>
              ← {lang==='ar'?'رجوع':lang==='en'?'Back':lang==='amz'?'ⴰⵣⵣⵓⵍ':'Retour'}
            </button>
            <span style={{color:'#4ADE80',fontSize:12,fontWeight:900,letterSpacing:'0.1em'}}>🦈 SAFI RUNNER</span>
            <span style={{marginLeft:'auto',color:'rgba(255,255,255,0.4)',fontSize:10,fontWeight:700}}>{gameId}</span>
          </div>
          {/* Game iframe */}
          <iframe
            src={`${GAME_URL}?userId=${encodeURIComponent(user?.id||'')}&gameId=${encodeURIComponent(gameId)}`}
            style={{flex:1,border:'none',width:'100%'}}
            allow="accelerometer; gyroscope"
            title="Safi Runner"
          />
        </div>
      )}

      {/* ── HOW TO WIN ── */}
      <div style={{width:'100%',maxWidth:380,padding:'0 16px',marginTop:14}}>
        <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:20,padding:'16px 18px'}}>
          <p style={{color:'#D9C5A0',fontSize:11,fontWeight:900,letterSpacing:'0.15em',textTransform:'uppercase',margin:'0 0 12px'}}>{t.howTitle}</p>
          {[t.how1,t.how2,t.how3].map((step,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:12,marginBottom: i<2?10:0,padding:'10px 14px',background:'rgba(255,255,255,0.03)',borderRadius:12,border:'1px solid rgba(255,255,255,0.06)'}}>
              <div style={{width:28,height:28,borderRadius:'50%',background:['linear-gradient(135deg,#059669,#4ADE80)','linear-gradient(135deg,#B45309,#FDE047)','linear-gradient(135deg,#9D174D,#F472B6)'][i],display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:`0 0 10px ${['rgba(74,222,128,0.4)','rgba(253,224,71,0.4)','rgba(244,114,182,0.4)'][i]}`}}>
                <span style={{color:'#fff',fontSize:12,fontWeight:900}}>{i+1}</span>
              </div>
              <p style={{color:'rgba(255,255,255,0.8)',fontSize:12,fontWeight:600,margin:0,lineHeight:1.3}}>{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── BONUS CARDS ── */}
      <div style={{width:'100%',maxWidth:380,padding:'0 16px',marginTop:12,display:'flex',flexDirection:'column',gap:10}}>
        {/* Bonus livraison */}
        <div style={{background:'linear-gradient(135deg,rgba(217,119,6,0.15) 0%,rgba(251,191,36,0.08) 100%)',border:'1px solid rgba(251,191,36,0.4)',borderRadius:18,padding:'14px 16px',display:'flex',alignItems:'flex-start',gap:12}}>
          <div style={{fontSize:26,flexShrink:0,lineHeight:1}}>🚴</div>
          <div>
            <p style={{color:'#FCD34D',fontSize:11,fontWeight:900,letterSpacing:'0.12em',textTransform:'uppercase',margin:'0 0 4px'}}>{t.bonusTitle}</p>
            <p style={{color:'rgba(255,255,255,0.75)',fontSize:12,fontWeight:600,margin:0,lineHeight:1.4}}>{t.bonusDesc}</p>
          </div>
        </div>
      </div>

      {/* ── RULES BUTTON ── */}
      <div style={{width:'100%',maxWidth:380,padding:'0 16px',marginTop:12}}>
        <button onClick={()=>setShowRules(true)}
          style={{width:'100%',padding:'13px 0',borderRadius:16,border:'1px solid rgba(253,224,71,0.3)',background:'rgba(253,224,71,0.06)',cursor:'pointer',color:'#FDE047',fontSize:13,fontWeight:900,letterSpacing:'0.05em'}}>
          {t.rulesBtn}
        </button>
      </div>

      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
      `}</style>
    </div>
  );
}

// ─── DRIVER GPS TRACKER PAGE ─────────────────────────────────────────────────
// Supports both delivery (ref starts with digit) and taxi (ref starts with TC-)

function DriverTrackerPage({ params }: { params?: { ref?: string } }) {
  const ref = params?.ref || '';
  const isTaxi = ref.startsWith('TC-');

  // Apply saved dark mode preference
  useEffect(() => {
    const dark = localStorage.getItem('bridge_dark') === '1';
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  // ── Delivery mode state ──
  const [status, setStatus] = useState<'asking'|'active'|'error'|'denied'>('asking');
  const [coords, setCoords] = useState<{lat:number;lng:number}|null>(null);
  const [lastSent, setLastSent] = useState<number|null>(null);
  const watchId = useRef<number|null>(null);

  // ── Taxi mode state ──
  const [taxiState, setTaxiState] = useState<'loading'|'pending'|'accepted'|'arrived'>('loading');
  const [bookingInfo, setBookingInfo] = useState<{customerName?:string;customerPhone?:string;clientAddress?:string;destination?:string;clientLat?:number;clientLng?:number}|null>(null);
  const [taxiCoords, setTaxiCoords] = useState<{lat:number;lng:number}|null>(null);
  const [taxiLastSent, setTaxiLastSent] = useState<number|null>(null);
  const taxiWatchId = useRef<number|null>(null);

  // ── Load taxi booking info ──
  useEffect(() => {
    if (!isTaxi) return;
    fetch(`/api/tracking/${ref}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.found) {
          setBookingInfo({ customerName: d.customerName, customerPhone: d.customerPhone, clientAddress: d.clientAddress, destination: d.destination, clientLat: d.clientLat, clientLng: d.clientLng });
          if (d.status === 'accepted') setTaxiState('accepted');
          else if (d.status === 'arrived') setTaxiState('arrived');
          else setTaxiState('pending');
        } else { setTaxiState('pending'); }
      })
      .catch(() => setTaxiState('pending'));
  }, [ref, isTaxi]);

  const pushTaxiPosition = async (lat: number, lng: number) => {
    try {
      await fetch(`/api/tracking/${ref}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
      });
      setTaxiLastSent(Date.now());
    } catch (_) {}
  };

  const startTaxiGPS = () => {
    if (!navigator.geolocation) return;
    taxiWatchId.current = navigator.geolocation.watchPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setTaxiCoords({ lat, lng });
        pushTaxiPosition(lat, lng);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 },
    );
  };

  const handleAccept = async () => {
    await fetch(`/api/tracking/${ref}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'accepted' }),
    }).catch(() => {});
    setTaxiState('accepted');
    startTaxiGPS();
  };

  const handleArrived = async () => {
    await fetch(`/api/tracking/${ref}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'arrived' }),
    }).catch(() => {});
    if (taxiWatchId.current !== null) navigator.geolocation.clearWatch(taxiWatchId.current);
    setTaxiState('arrived');
  };

  // ── Delivery mode ──
  const pushPosition = async (lat: number, lng: number) => {
    try {
      await fetch(`/api/tracking/${ref}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
      });
      setLastSent(Date.now());
    } catch (_) {}
  };

  useEffect(() => {
    if (isTaxi) return;
    if (!ref) { setStatus('error'); return; }
    if (!navigator.geolocation) { setStatus('error'); return; }
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        setStatus('active');
        pushPosition(lat, lng);
      },
      () => setStatus('denied'),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 },
    );
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      if (ref) fetch(`/api/tracking/${ref}`, { method: 'DELETE' }).catch(() => {});
    };
  }, [ref, isTaxi]);

  const secsAgo = lastSent ? Math.round((Date.now() - lastSent) / 1000) : null;
  const taxiSecsAgo = taxiLastSent ? Math.round((Date.now() - taxiLastSent) / 1000) : null;

  // ── TAXI MODE UI ──
  if (isTaxi) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#78350F 0%,#1A2F23 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '360px', background: '#fff', borderRadius: '24px', padding: '28px 24px', boxShadow: '0 8px 40px rgba(0,0,0,0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '8px' }}>🚖</div>
          <h1 style={{ fontSize: '18px', fontWeight: '900', color: '#78350F', margin: '0 0 2px' }}>Bridge Taxi — Chauffeur</h1>
          <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '0 0 20px' }}>Course #{ref}</p>

          {taxiState === 'loading' && (
            <div style={{ padding: '20px', background: '#FEF3C7', borderRadius: '12px' }}>
              <p style={{ fontSize: '13px', color: '#B45309', fontWeight: '700' }}>⏳ Chargement de la course…</p>
            </div>
          )}

          {taxiState === 'pending' && bookingInfo && (
            <div>
              {/* Booking info card */}
              <div style={{ background: '#FEF3C7', borderRadius: '14px', padding: '14px', marginBottom: '16px', textAlign: 'left' }}>
                <p style={{ fontSize: '10px', fontWeight: '900', color: '#92400E', letterSpacing: '0.1em', marginBottom: '10px' }}>DÉTAILS DE LA COURSE</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '14px' }}>👤</span>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '800', color: '#1A2F23', margin: 0 }}>{bookingInfo.customerName || 'Client'}</p>
                      {bookingInfo.customerPhone && <a href={`tel:${bookingInfo.customerPhone}`} style={{ fontSize: '12px', color: '#78350F', fontWeight: '700', textDecoration: 'none' }}>{bookingInfo.customerPhone}</a>}
                    </div>
                  </div>
                  {bookingInfo.clientAddress && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '14px' }}>📍</span>
                      <div>
                        <p style={{ fontSize: '10px', color: '#9CA3AF', margin: '0 0 2px', fontWeight: '700' }}>DÉPART</p>
                        <p style={{ fontSize: '12px', color: '#1A2F23', margin: 0 }}>{bookingInfo.clientAddress}</p>
                        {bookingInfo.clientLat && bookingInfo.clientLng && (
                          <a href={`https://maps.google.com/?q=${bookingInfo.clientLat},${bookingInfo.clientLng}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#3B82F6', fontWeight: '700' }}>Ouvrir dans Maps →</a>
                        )}
                      </div>
                    </div>
                  )}
                  {bookingInfo.destination && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '14px' }}>🏁</span>
                      <div>
                        <p style={{ fontSize: '10px', color: '#9CA3AF', margin: '0 0 2px', fontWeight: '700' }}>DESTINATION</p>
                        <p style={{ fontSize: '12px', color: '#1A2F23', margin: 0 }}>{bookingInfo.destination}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={handleAccept} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#065F46,#10B981)', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.4)' }}>
                ✅ Accepter la course
              </button>
            </div>
          )}

          {taxiState === 'pending' && !bookingInfo && (
            <div style={{ padding: '20px', background: '#FEF3C7', borderRadius: '12px' }}>
              <p style={{ fontSize: '13px', color: '#B45309', fontWeight: '700' }}>📋 Course en attente</p>
              <p style={{ fontSize: '11px', color: '#92400E', marginTop: '4px' }}>Informations client non disponibles</p>
              <button onClick={handleAccept} style={{ marginTop: '12px', width: '100%', padding: '12px', background: '#065F46', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '900', cursor: 'pointer' }}>
                ✅ Accepter
              </button>
            </div>
          )}

          {taxiState === 'accepted' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#D1FAE5', borderRadius: '12px', padding: '12px 16px', marginBottom: '12px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#059669', display: 'inline-block', animation: 'pulse 1.5s infinite' }}/>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#065F46' }}>GPS EN DIRECT</span>
              </div>
              {bookingInfo?.destination && (
                <div style={{ background: '#EFF6FF', borderRadius: '12px', padding: '10px 14px', marginBottom: '12px', textAlign: 'left' }}>
                  <p style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: '700', marginBottom: '2px' }}>DESTINATION</p>
                  <p style={{ fontSize: '13px', color: '#1D4ED8', fontWeight: '800', margin: 0 }}>🏁 {bookingInfo.destination}</p>
                </div>
              )}
              {taxiCoords && (
                <p style={{ fontSize: '11px', fontFamily: 'monospace', color: '#9CA3AF', background: '#F9FAFB', borderRadius: '8px', padding: '8px', marginBottom: '8px' }}>
                  {taxiCoords.lat.toFixed(6)}, {taxiCoords.lng.toFixed(6)}
                </p>
              )}
              {taxiSecsAgo !== null && <p style={{ fontSize: '11px', color: '#10B981', marginBottom: '16px' }}>✓ Mis à jour il y a {taxiSecsAgo}s</p>}
              <button onClick={handleArrived} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#78350F,#F59E0B)', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 16px rgba(120,53,15,0.4)' }}>
                🎯 Je suis arrivé !
              </button>
              <div style={{ marginTop: '12px', padding: '10px', background: '#FEF3C7', borderRadius: '10px' }}>
                <p style={{ fontSize: '11px', color: '#92400E', fontWeight: '700' }}>⚠️ Ne fermez pas cette page</p>
              </div>
            </div>
          )}

          {taxiState === 'arrived' && (
            <div style={{ background: '#EFF6FF', borderRadius: '14px', padding: '20px' }}>
              <p style={{ fontSize: '36px', marginBottom: '8px' }}>🎉</p>
              <p style={{ fontSize: '16px', fontWeight: '900', color: '#1D4ED8', marginBottom: '4px' }}>Course terminée !</p>
              <p style={{ fontSize: '12px', color: '#3B82F6' }}>Le client a été notifié de votre arrivée.</p>
            </div>
          )}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:0.5;transform:scale(1);}50%{opacity:1;transform:scale(1.3);}}`}</style>
      </div>
    );
  }

  // ── DELIVERY MODE UI ──
  return (
    <div style={{ minHeight: '100vh', background: '#F0FDF4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '360px', background: '#fff', borderRadius: '24px', padding: '32px 24px', boxShadow: '0 8px 40px rgba(0,0,0,0.12)', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛵</div>
        <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#065F46', margin: '0 0 4px' }}>Bridge Safi — GPS Livreur</h1>
        <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '0 0 24px' }}>Commande #{ref}</p>

        {status === 'asking' && (
          <div style={{ background: '#FEF3C7', borderRadius: '12px', padding: '16px' }}>
            <p style={{ fontSize: '14px', color: '#B45309', fontWeight: '700' }}>⏳ En attente de la localisation…</p>
            <p style={{ fontSize: '12px', color: '#92400E', marginTop: '4px' }}>Autorisez l'accès à votre position GPS</p>
          </div>
        )}

        {status === 'active' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#D1FAE5', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#059669', display: 'inline-block', animation: 'pulse 1.5s infinite' }}/>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#065F46' }}>GPS EN DIRECT</span>
            </div>
            <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>Votre position est partagée avec le client en temps réel</p>
            {coords && (
              <p style={{ fontSize: '11px', fontFamily: 'monospace', color: '#9CA3AF', background: '#F9FAFB', borderRadius: '8px', padding: '8px' }}>
                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </p>
            )}
            {secsAgo !== null && (
              <p style={{ fontSize: '11px', color: '#10B981', marginTop: '8px' }}>✓ Dernière mise à jour il y a {secsAgo}s</p>
            )}
            <div style={{ marginTop: '20px', padding: '12px', background: '#FEF3C7', borderRadius: '12px' }}>
              <p style={{ fontSize: '12px', color: '#92400E', fontWeight: '700' }}>⚠️ Ne fermez pas cette page</p>
              <p style={{ fontSize: '11px', color: '#B45309', marginTop: '4px' }}>Laissez-la ouverte pendant toute la livraison</p>
            </div>
          </div>
        )}

        {status === 'denied' && (
          <div style={{ background: '#FEE2E2', borderRadius: '12px', padding: '16px' }}>
            <p style={{ fontSize: '14px', color: '#DC2626', fontWeight: '700' }}>❌ Accès GPS refusé</p>
            <p style={{ fontSize: '12px', color: '#991B1B', marginTop: '4px' }}>Activez la localisation dans les paramètres de votre navigateur puis rechargez la page</p>
          </div>
        )}

        {status === 'error' && (
          <div style={{ background: '#FEE2E2', borderRadius: '12px', padding: '16px' }}>
            <p style={{ fontSize: '14px', color: '#DC2626', fontWeight: '700' }}>❌ Lien invalide</p>
            <p style={{ fontSize: '12px', color: '#991B1B', marginTop: '4px' }}>Utilisez le lien envoyé par le restaurant</p>
          </div>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:0.5;transform:scale(1);}50%{opacity:1;transform:scale(1.3);}}`}</style>
    </div>
  );
}

// ─── DISPATCH PAGE (livreur + chauffeur taxi) ─────────────────────────────────

type DispatchRole = 'choose' | 'eats' | 'taxi';

interface PendingOrder { id: number; ref: string; customerName: string; customerAddress: string; restaurantName: string | null; total: number; items: string; }
interface PendingTaxi { ref: string; customerName?: string; clientAddress?: string; destination?: string; clientLat?: number; clientLng?: number; }

async function registerPush(driverName: string): Promise<boolean> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const keyRes = await fetch('/api/push/vapid-key');
    const { publicKey } = await keyRes.json();
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey,
    });
    const key = sub.getKey('p256dh');
    const auth = sub.getKey('auth');
    if (!key || !auth) return false;
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
          auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
        },
        driverName,
      }),
    });
    return true;
  } catch { return false; }
}

function playAlarm() {
  try {
    const ctx = new AudioContext();
    const beep = (freq: number, start: number, dur: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.8, ctx.currentTime + start);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + dur + 0.05);
    };
    [0, 0.25, 0.5, 0.8, 1.05, 1.3].forEach((t, i) => beep(i % 2 === 0 ? 880 : 1100, t, 0.2));
  } catch {}
  try { navigator.vibrate?.([300, 150, 300, 150, 600, 200, 600]); } catch {}
}

function DispatchPage() {
  const [, navigate] = useLocation();
  const [role, setRole] = useState<DispatchRole>('choose');
  const [driverName, setDriverName] = useState(() => { try { return localStorage.getItem('bridge_driver_name') || ''; } catch { return ''; } });
  const [pushOk, setPushOk] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  // Eats state
  const [eatsOrders, setEatsOrders] = useState<PendingOrder[]>([]);
  const [activeEatsOrder, setActiveEatsOrder] = useState<PendingOrder | null>(null);
  const [eatsGPS, setEatsGPS] = useState<'idle' | 'active' | 'denied'>('idle');
  const [eatsCoords, setEatsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const eatsWatchId = useRef<number | null>(null);
  const eatsSeenIds = useRef<Set<number>>(new Set());
  const sseRef = useRef<EventSource | null>(null);

  // Taxi state
  const [taxiBookings, setTaxiBookings] = useState<PendingTaxi[]>([]);
  const [activeTaxi, setActiveTaxi] = useState<PendingTaxi | null>(null);
  const [taxiGPS, setTaxiGPS] = useState<'idle' | 'active' | 'denied'>('idle');
  const taxiWatchId = useRef<number | null>(null);
  const taxiSeenRefs = useRef<Set<string>>(new Set());

  const handleSetRole = async (r: 'eats' | 'taxi') => {
    const name = driverName.trim() || (r === 'taxi' ? 'Chauffeur' : 'Livreur');
    localStorage.setItem('bridge_driver_name', name);
    setRole(r);
    setPushLoading(true);
    const ok = await registerPush(name);
    setPushOk(ok);
    setPushLoading(false);
  };

  // ── GPS reporting to server (for smart dispatch proximity) ──
  // Reports driver position every 30s so the API knows who is nearby which restaurant
  const gpsReportRef = useRef<number | null>(null);
  const liveGPSRef = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (role === 'choose') return;
    // Get push subscription endpoint (needed as driver ID)
    let endpoint = '';
    navigator.serviceWorker.ready
      .then(reg => reg.pushManager.getSubscription())
      .then(sub => { if (sub) endpoint = sub.endpoint; })
      .catch(() => {});
    // Watch GPS
    let watchId: number | null = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        pos => { liveGPSRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }; },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    }
    // Report every 30s
    const report = () => {
      if (!endpoint || !liveGPSRef.current) return;
      fetch('/api/tracking/driver-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, lat: liveGPSRef.current.lat, lng: liveGPSRef.current.lng, driverName: driverName || undefined }),
      }).catch(() => {});
    };
    // Initial report after 3s (give time to get GPS fix)
    const initTimeout = setTimeout(report, 3000);
    gpsReportRef.current = window.setInterval(report, 30_000);
    return () => {
      clearTimeout(initTimeout);
      if (gpsReportRef.current !== null) clearInterval(gpsReportRef.current);
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [role, driverName]);

  // ── EATS: SSE stream for new orders ──
  useEffect(() => {
    if (role !== 'eats') return;
    const es = new EventSource('/api/orders/stream');
    sseRef.current = es;
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'NEW_ORDER') {
          // Re-fetch pending orders
          fetchEatsOrders();
        }
      } catch {}
    };
    fetchEatsOrders();
    const iv = setInterval(fetchEatsOrders, 10000);
    return () => { es.close(); clearInterval(iv); if (eatsWatchId.current != null) navigator.geolocation.clearWatch(eatsWatchId.current); };
  }, [role]);

  const fetchEatsOrders = async () => {
    try {
      const res = await fetch('/api/orders?status=pending', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const orders: PendingOrder[] = (data.orders || []).filter((o: any) => o.service === 'delivery' || o.service === 'eats');
      setEatsOrders(orders);
      // Ring alarm for new unseen orders
      const newOnes = orders.filter(o => !eatsSeenIds.current.has(o.id));
      if (newOnes.length > 0) {
        newOnes.forEach(o => eatsSeenIds.current.add(o.id));
        playAlarm();
      }
    } catch {}
  };

  const acceptEatsOrder = async (order: PendingOrder) => {
    setActiveEatsOrder(order);
    await fetch(`/api/orders/${order.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'on_the_way', driverName: driverName || 'Livreur' }),
    }).catch(() => {});
  };

  const startEatsGPS = () => {
    if (!navigator.geolocation) { setEatsGPS('denied'); return; }
    if (!activeEatsOrder) return;
    const ref = activeEatsOrder.ref;
    eatsWatchId.current = navigator.geolocation.watchPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setEatsCoords({ lat, lng });
        setEatsGPS('active');
        fetch(`/api/tracking/${ref}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng, driverName: driverName || 'Livreur' }),
        }).catch(() => {});
      },
      () => setEatsGPS('denied'),
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
  };

  const finishEatsDelivery = () => {
    if (eatsWatchId.current != null) navigator.geolocation.clearWatch(eatsWatchId.current);
    if (activeEatsOrder) fetch(`/api/tracking/${activeEatsOrder.ref}`, { method: 'DELETE' }).catch(() => {});
    if (activeEatsOrder) fetch(`/api/orders/${activeEatsOrder.id}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'delivered' }),
    }).catch(() => {});
    setActiveEatsOrder(null);
    setEatsGPS('idle');
    setEatsCoords(null);
    fetchEatsOrders();
  };

  // ── TAXI: poll for pending bookings ──
  useEffect(() => {
    if (role !== 'taxi') return;
    const poll = async () => {
      try {
        const res = await fetch('/api/tracking-pending', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const bookings: PendingTaxi[] = data.bookings || [];
        setTaxiBookings(bookings);
        const newOnes = bookings.filter(b => !taxiSeenRefs.current.has(b.ref));
        if (newOnes.length > 0) {
          newOnes.forEach(b => taxiSeenRefs.current.add(b.ref));
          playAlarm();
        }
      } catch {}
    };
    poll();
    const iv = setInterval(poll, 5000);
    return () => { clearInterval(iv); if (taxiWatchId.current != null) navigator.geolocation.clearWatch(taxiWatchId.current); };
  }, [role]);

  const acceptTaxi = async (booking: PendingTaxi) => {
    setActiveTaxi(booking);
    setTaxiBookings(prev => prev.filter(b => b.ref !== booking.ref));
    await fetch(`/api/tracking/${booking.ref}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'accepted', driverName: driverName || 'Chauffeur' }),
    }).catch(() => {});
    // Start GPS immediately
    if (!navigator.geolocation) { setTaxiGPS('denied'); return; }
    taxiWatchId.current = navigator.geolocation.watchPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setTaxiGPS('active');
        fetch(`/api/tracking/${booking.ref}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng, status: 'accepted', driverName: driverName || 'Chauffeur' }),
        }).catch(() => {});
      },
      () => setTaxiGPS('denied'),
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
  };

  const finishTaxi = async () => {
    if (taxiWatchId.current != null) navigator.geolocation.clearWatch(taxiWatchId.current);
    if (activeTaxi) await fetch(`/api/tracking/${activeTaxi.ref}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'arrived' }),
    }).catch(() => {});
    setActiveTaxi(null);
    setTaxiGPS('idle');
  };

  // ── UI ──
  const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 20, padding: '18px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: 12, border: '1.5px solid #E5E7EB' };

  // CHOOSE ROLE
  if (role === 'choose') {
    return (
      <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg,#020c07 0%,#071C11 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
        <div style={{ width: 70, height: 70, borderRadius: '50%', overflow: 'hidden', border: '2px solid #059669', marginBottom: 16 }}>
          <img src="/logo_splash_new.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h1 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 900, letterSpacing: '0.2em', margin: '0 0 4px' }}>BRIDGE DISPATCH</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 28px', letterSpacing: '0.1em' }}>PANNEAU CHAUFFEUR / LIVREUR</p>

        <input
          value={driverName}
          onChange={e => setDriverName(e.target.value)}
          placeholder="Votre prénom (ex: Youssef)"
          style={{ width: '100%', maxWidth: 340, padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(74,222,128,0.3)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, marginBottom: 20, outline: 'none', boxSizing: 'border-box' }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 340 }}>
          <button onClick={() => handleSetRole('eats')}
            style={{ padding: '18px 0', borderRadius: 18, border: 'none', background: 'linear-gradient(135deg,#059669,#4ADE80)', color: '#fff', fontSize: 18, fontWeight: 900, cursor: 'pointer', boxShadow: '0 0 24px rgba(74,222,128,0.35)' }}>
            🛵 Je suis Livreur Bridge Eats
          </button>
          <button onClick={() => handleSetRole('taxi')}
            style={{ padding: '18px 0', borderRadius: 18, border: 'none', background: 'linear-gradient(135deg,#B45309,#F59E0B)', color: '#fff', fontSize: 18, fontWeight: 900, cursor: 'pointer', boxShadow: '0 0 24px rgba(245,158,11,0.35)' }}>
            🚖 Je suis Chauffeur Taxi
          </button>
        </div>
        <button onClick={() => navigate('/')} style={{ marginTop: 24, color: 'rgba(255,255,255,0.4)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>← Retour</button>
      </div>
    );
  }

  const isTaxi = role === 'taxi';
  const accent = isTaxi ? '#F59E0B' : '#059669';
  const accentLight = isTaxi ? '#FEF3C7' : '#D1FAE5';
  const accentDark = isTaxi ? '#B45309' : '#065F46';
  const icon = isTaxi ? '🚖' : '🛵';
  const label = isTaxi ? 'Taxi Confort' : 'Bridge Eats';

  return (
    <div style={{ minHeight: '100dvh', background: '#F0FDF4', fontFamily: 'system-ui,sans-serif' }}>
      {/* Header */}
      <div style={{ background: accentDark, padding: '52px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 2px' }}>BRIDGE DISPATCH</p>
          <h1 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>{icon} {driverName || label}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {pushLoading && <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>⏳</span>}
          {pushOk && <span style={{ background: 'rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.4)', borderRadius: 20, padding: '3px 10px', color: '#4ADE80', fontSize: 10, fontWeight: 900 }}>🔔 Notifs ON</span>}
          <button onClick={() => { setRole('choose'); setActiveEatsOrder(null); setActiveTaxi(null); }}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 10, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>⟵</button>
        </div>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto' }}>

        {/* ── EATS MODE ── */}
        {role === 'eats' && !activeEatsOrder && (
          <>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>COMMANDES EN ATTENTE ({eatsOrders.length})</p>
            {eatsOrders.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ fontSize: 32, margin: '0 0 10px' }}>⏳</p>
                <p style={{ color: '#6B7280', fontSize: 14, fontWeight: 700, margin: 0 }}>En attente de commandes…</p>
                <p style={{ color: '#9CA3AF', fontSize: 11, margin: '4px 0 0' }}>La sonnette retentira automatiquement</p>
              </div>
            ) : eatsOrders.map(order => (
              <div key={order.id} style={{ ...cardStyle, borderColor: '#BBF7D0', borderWidth: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, margin: '0 0 2px', letterSpacing: '0.1em' }}>COMMANDE</p>
                    <p style={{ fontSize: 16, fontWeight: 900, color: '#059669', margin: 0 }}>{order.ref}</p>
                  </div>
                  <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: 12, fontWeight: 900, borderRadius: 20, padding: '4px 12px' }}>{order.total} MAD</span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#111', margin: '0 0 2px' }}>👤 {order.customerName}</p>
                {order.restaurantName && <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 2px' }}>🥘 {order.restaurantName}</p>}
                <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 12px' }}>📍 {order.customerAddress}</p>
                <button onClick={() => acceptEatsOrder(order)}
                  style={{ width: '100%', padding: '13px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#059669,#4ADE80)', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 16px rgba(5,150,105,0.3)' }}>
                  ✅ Accepter cette commande
                </button>
              </div>
            ))}
          </>
        )}

        {role === 'eats' && activeEatsOrder && (
          <>
            <div style={{ ...cardStyle, borderColor: '#BBF7D0', borderWidth: 2 }}>
              <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.1em', margin: '0 0 8px' }}>COMMANDE ACCEPTÉE</p>
              <p style={{ fontSize: 18, fontWeight: 900, color: '#059669', margin: '0 0 6px' }}>{activeEatsOrder.ref}</p>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#111', margin: '0 0 2px' }}>👤 {activeEatsOrder.customerName}</p>
              {activeEatsOrder.restaurantName && <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 2px' }}>🥘 Récupérer chez : {activeEatsOrder.restaurantName}</p>}
              <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 16px' }}>📍 Livrer à : {activeEatsOrder.customerAddress}</p>

              {eatsGPS === 'idle' && (
                <button onClick={startEatsGPS}
                  style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#065F46,#059669)', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', marginBottom: 10, boxShadow: '0 4px 16px rgba(5,150,105,0.3)' }}>
                  📡 J'ai la commande — Démarrer GPS
                </button>
              )}

              {eatsGPS === 'active' && (
                <div style={{ background: '#D1FAE5', borderRadius: 12, padding: '12px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#059669', display: 'inline-block', animation: 'pulse 1.5s infinite' }}/>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 900, color: '#065F46', margin: 0 }}>GPS EN DIRECT — Client vous suit</p>
                    {eatsCoords && <p style={{ fontSize: 10, color: '#6B7280', margin: '2px 0 0', fontFamily: 'monospace' }}>{eatsCoords.lat.toFixed(5)}, {eatsCoords.lng.toFixed(5)}</p>}
                  </div>
                </div>
              )}

              {eatsGPS === 'denied' && <p style={{ color: '#DC2626', fontSize: 12, marginBottom: 10 }}>❌ GPS refusé — activez la localisation</p>}

              <button onClick={finishEatsDelivery}
                style={{ width: '100%', padding: '13px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer' }}>
                ✅ Livraison terminée
              </button>
            </div>
            <style>{`@keyframes pulse{0%,100%{opacity:0.5;transform:scale(1);}50%{opacity:1;transform:scale(1.3);}}`}</style>
          </>
        )}

        {/* ── TAXI MODE ── */}
        {role === 'taxi' && !activeTaxi && (
          <>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>COURSES EN ATTENTE ({taxiBookings.length})</p>
            {taxiBookings.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ fontSize: 32, margin: '0 0 10px' }}>⏳</p>
                <p style={{ color: '#6B7280', fontSize: 14, fontWeight: 700, margin: 0 }}>En attente de courses…</p>
                <p style={{ color: '#9CA3AF', fontSize: 11, margin: '4px 0 0' }}>La sonnette retentira automatiquement</p>
              </div>
            ) : taxiBookings.map(booking => (
              <div key={booking.ref} style={{ ...cardStyle, borderColor: '#FDE68A', borderWidth: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, margin: '0 0 2px', letterSpacing: '0.1em' }}>COURSE TAXI</p>
                    <p style={{ fontSize: 16, fontWeight: 900, color: '#B45309', margin: 0 }}>{booking.ref}</p>
                  </div>
                  <span style={{ background: '#FEF3C7', color: '#B45309', fontSize: 11, fontWeight: 900, borderRadius: 20, padding: '4px 10px' }}>NOUVEAU</span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#111', margin: '0 0 4px' }}>👤 {booking.customerName || 'Client'}</p>
                {booking.clientAddress && <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 2px' }}>📍 Départ : {booking.clientAddress}</p>}
                {booking.destination && <p style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 800, margin: '0 0 12px' }}>🏁 Destination : {booking.destination}</p>}
                <button onClick={() => acceptTaxi(booking)}
                  style={{ width: '100%', padding: '13px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#B45309,#F59E0B)', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 16px rgba(180,83,9,0.3)' }}>
                  ✅ Accepter la course
                </button>
              </div>
            ))}
          </>
        )}

        {role === 'taxi' && activeTaxi && (
          <div style={{ ...cardStyle, borderColor: '#FDE68A', borderWidth: 2 }}>
            <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.1em', margin: '0 0 8px' }}>COURSE ACCEPTÉE</p>
            <p style={{ fontSize: 18, fontWeight: 900, color: '#B45309', margin: '0 0 6px' }}>{activeTaxi.ref}</p>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#111', margin: '0 0 4px' }}>👤 {activeTaxi.customerName || 'Client'}</p>
            {activeTaxi.clientAddress && <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 2px' }}>📍 Départ : {activeTaxi.clientAddress}</p>}
            {activeTaxi.destination && <p style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 800, margin: '0 0 14px' }}>🏁 Destination : {activeTaxi.destination}</p>}

            {taxiGPS === 'active' ? (
              <div style={{ background: '#FEF3C7', borderRadius: 12, padding: '12px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B', display: 'inline-block', animation: 'pulse 1.5s infinite' }}/>
                <p style={{ fontSize: 12, fontWeight: 900, color: '#B45309', margin: 0 }}>GPS EN DIRECT — Client vous suit sur la carte</p>
              </div>
            ) : taxiGPS === 'denied' ? (
              <p style={{ color: '#DC2626', fontSize: 12, marginBottom: 12 }}>❌ GPS refusé — activez la localisation</p>
            ) : (
              <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>⏳ Démarrage GPS…</p>
            )}

            <button onClick={finishTaxi}
              style={{ width: '100%', padding: '13px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer' }}>
              🏁 Course terminée — Arrivé !
            </button>
            <style>{`@keyframes pulse{0%,100%{opacity:0.5;transform:scale(1);}50%{opacity:1;transform:scale(1.3);}}`}</style>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── BRIDGE AI ASSISTANT PAGE ────────────────────────────────────────────────

type AssistMsg = { role: 'user' | 'assistant'; content: string };

const ASSISTANT_T = {
  fr: {
    title: 'Bridge Assistant',
    subtitle: 'Votre conseiller IA 24/7',
    placeholder: 'Écrivez votre question...',
    send: 'Envoyer',
    thinking: 'Bridge IA réfléchit...',
    greeting: 'Bonjour ! 👋 Je suis votre assistant Bridge Safi. Comment puis-je vous aider aujourd\'hui ?',
    quickTitle: 'Questions fréquentes',
    q1: '📦 Suivre ma commande',
    q2: '🚚 Retard de livraison',
    q3: '💳 Problème de paiement',
    q4: '❓ Autre question',
    escalated: '🔔 Un responsable Bridge vous contacte sous 30 min',
    wa: '📱 Contacter via WhatsApp',
    back: '← Retour',
  },
  en: {
    title: 'Bridge Assistant',
    subtitle: 'Your AI advisor 24/7',
    placeholder: 'Write your question...',
    send: 'Send',
    thinking: 'Bridge AI is thinking...',
    greeting: 'Hello! 👋 I\'m your Bridge Safi assistant. How can I help you today?',
    quickTitle: 'Frequent questions',
    q1: '📦 Track my order',
    q2: '🚚 Delivery delay',
    q3: '💳 Payment issue',
    q4: '❓ Other question',
    escalated: '🔔 A Bridge manager will contact you within 30 min',
    wa: '📱 Contact via WhatsApp',
    back: '← Back',
  },
  ar: {
    title: 'مساعد بريدج',
    subtitle: 'مستشارك الذكي 24/7',
    placeholder: 'اكتب سؤالك...',
    send: 'إرسال',
    thinking: 'بريدج AI يفكر...',
    greeting: 'أهلاً! 👋 أنا مساعدك الذكي من Bridge Safi. كيف يمكنني مساعدتك اليوم؟',
    quickTitle: 'أسئلة شائعة',
    q1: '📦 تتبع طلبي',
    q2: '🚚 تأخر التوصيل',
    q3: '💳 مشكلة في الدفع',
    q4: '❓ سؤال آخر',
    escalated: '🔔 سيتصل بك مسؤول Bridge خلال 30 دقيقة',
    wa: '📱 تواصل عبر واتساب',
    back: '→ رجوع',
  },
  amz: {
    title: 'ⴰⵎⵙⴰⵡⴰⵍ Bridge',
    subtitle: 'ⴰⵎⵙⴰⵡⴰⵍ ⵏⵏⴽ 24/7',
    placeholder: 'ⴽⵜⴱ ⵓⵙⵉⴹⵏ ⵏⵏⴽ...',
    send: 'ⵥⵥⵍ',
    thinking: 'Bridge AI ⵉⵜⵜⴼⴽⴽⵉⵔ...',
    greeting: 'ⴰⵣⵓⵍ! 👋 ⵏⴽⴽ ⴰⵎⵙⴰⵡⴰⵍ ⵏⵏⴽ ⵏ Bridge Safi.',
    quickTitle: 'ⵉⵙⵙⵉⴹⵏⵏ ⵉⵎⵥⵍⴰⵢⵏ',
    q1: '📦 ⵙⵍⴳⵏ ⴰⵣⵏⵓⵥ ⵏⵏⵉ',
    q2: '🚚 ⴰⵃⵟⵟⵓ ⵏ ⵓⵣⵏⵉ',
    q3: '💳 ⴰⵎⴽⴽⵓⵙ ⵏ ⵓⵙⵓⵔⴼ',
    q4: '❓ ⴰⵙⵙⵉⴹ ⵢⴰⴹⵏ',
    escalated: '🔔 ⴰⵎⵙⵉⵡⵍ Bridge ⴰⴷ ⴽ ⵉⵙⵙⵏⵖ ⵖ 30 ⵜⵓⵙⴷⴰⵜⵉⵏ',
    wa: '📱 ⵙⵙⵏⵎⵍ ⵙ WhatsApp',
    back: '← ⴰⵣⵣⵓⵍ',
  },
};

type AssistLang = 'fr'|'en'|'ar'|'amz';
const ASSIST_LANGS: AssistLang[] = ['fr','en','ar','amz'];
const ASSIST_LANG_LABELS: Record<AssistLang,string> = {fr:'FR',en:'EN',ar:'AR',amz:'ⴰⵎⵣ'};

function BridgeAssistantPage() {
  const [, navigate] = useLocation();
  const [lang, setLang] = useState<AssistLang>(()=>{
    try { const r = localStorage.getItem('bridge_nav_state'); if(r){const p=JSON.parse(r);if(ASSIST_LANGS.includes(p.lang)) return p.lang;} } catch{}
    return 'fr';
  });
  const t = ASSISTANT_T[lang];
  const isAR = lang==='ar';

  const [messages, setMessages] = useState<AssistMsg[]>([{ role:'assistant', content: ASSISTANT_T[lang].greeting }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const BRIDGE_WA_NUMBER = '+212600000000';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages, loading]);

  // Re-set greeting when language changes
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].role === 'assistant') {
        return [{ role:'assistant', content: ASSISTANT_T[lang].greeting }];
      }
      return prev;
    });
  }, [lang]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: AssistMsg = { role:'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/assistant/chat`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ messages: newMessages, lang }),
      });
      const data = await res.json() as { reply: string; isEscalation: boolean };
      setMessages(prev => [...prev, { role:'assistant', content: data.reply }]);
      if (data.isEscalation) setEscalated(true);
    } catch {
      setMessages(prev => [...prev, { role:'assistant', content: '⚠️ Service temporairement indisponible. Réessayez dans quelques instants.' }]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [t.q1, t.q2, t.q3, t.q4];

  return (
    <div dir={isAR?'rtl':'ltr'} style={{minHeight:'100dvh',background:'linear-gradient(160deg,#030712 0%,#0f172a 50%,#1e1b4b 100%)',display:'flex',flexDirection:'column',position:'relative',overflow:'hidden'}}>
      {/* Ambient glows */}
      <div style={{position:'absolute',top:-80,left:-80,width:300,height:300,borderRadius:'50%',background:'rgba(99,102,241,0.12)',filter:'blur(80px)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:-60,right:-60,width:250,height:250,borderRadius:'50%',background:'rgba(14,165,233,0.1)',filter:'blur(70px)',pointerEvents:'none'}}/>

      {/* Header */}
      <div style={{position:'sticky',top:0,zIndex:50,background:'rgba(3,7,18,0.85)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(99,102,241,0.2)',padding:'14px 16px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',maxWidth:480,margin:'0 auto'}}>
          <button onClick={()=>navigate('/')} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',color:'#94a3b8',borderRadius:12,padding:'8px 14px',fontSize:12,fontWeight:700,cursor:'pointer'}}>
            {t.back}
          </button>
          <div style={{textAlign:'center'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,justifyContent:'center'}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:'#4ADE80',boxShadow:'0 0 8px #4ADE80'}}/>
              <p style={{color:'#fff',fontSize:15,fontWeight:900,margin:0,letterSpacing:0.5}}>{t.title}</p>
            </div>
            <p style={{color:'rgba(255,255,255,0.4)',fontSize:10,margin:0}}>{t.subtitle}</p>
          </div>
          <button onClick={()=>setLang(l=>{const i=ASSIST_LANGS.indexOf(l);return ASSIST_LANGS[(i+1)%ASSIST_LANGS.length];})}
            style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',color:'#94a3b8',borderRadius:12,padding:'8px 14px',fontSize:12,fontWeight:700,cursor:'pointer'}}>
            {ASSIST_LANG_LABELS[lang]}
          </button>
        </div>
      </div>

      {/* Chat messages */}
      <div style={{flex:1,overflowY:'auto',padding:'16px',maxWidth:480,width:'100%',margin:'0 auto',boxSizing:'border-box'}}>

        {/* Quick actions (only when chat is at greeting) */}
        {messages.length <= 1 && (
          <div style={{marginBottom:16}}>
            <p style={{color:'rgba(255,255,255,0.4)',fontSize:11,fontWeight:700,letterSpacing:2,textTransform:'uppercase',textAlign:'center',marginBottom:10}}>{t.quickTitle}</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {quickQuestions.map((q,i) => (
                <button key={i} onClick={()=>sendMessage(q)}
                  style={{background:'rgba(99,102,241,0.12)',border:'1px solid rgba(99,102,241,0.3)',color:'rgba(255,255,255,0.8)',borderRadius:14,padding:'12px 10px',fontSize:12,fontWeight:600,cursor:'pointer',textAlign:'center',lineHeight:1.4}}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, idx) => (
          <div key={idx} style={{display:'flex',flexDirection:'column',alignItems:msg.role==='user'?(isAR?'flex-start':'flex-end'):(isAR?'flex-end':'flex-start'),marginBottom:12}}>
            {msg.role==='assistant' && (
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4,flexDirection:isAR?'row-reverse':'row'}}>
                <div style={{width:28,height:28,borderRadius:'50%',overflow:'hidden',border:'1px solid rgba(99,102,241,0.4)'}}>
                  <img src="/logo_splash_new.png" alt="Bridge" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                </div>
                <span style={{color:'rgba(255,255,255,0.4)',fontSize:10,fontWeight:700}}>Bridge AI</span>
              </div>
            )}
            <div style={{
              maxWidth:'82%',
              background: msg.role==='user'
                ? 'linear-gradient(135deg,#4f46e5,#7c3aed)'
                : 'rgba(255,255,255,0.07)',
              border: msg.role==='user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: msg.role==='user'
                ? isAR ? '18px 18px 18px 4px' : '18px 18px 4px 18px'
                : isAR ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              padding:'12px 14px',
              boxShadow: msg.role==='user' ? '0 4px 16px rgba(79,70,229,0.3)' : 'none',
            }}>
              <p style={{color:'#fff',fontSize:13,lineHeight:1.6,margin:0,whiteSpace:'pre-wrap'}}>{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <div style={{width:28,height:28,borderRadius:'50%',overflow:'hidden',border:'1px solid rgba(99,102,241,0.4)'}}>
              <img src="/logo_splash_new.png" alt="Bridge" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            </div>
            <div style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'18px 18px 18px 4px',padding:'12px 16px',display:'flex',gap:6,alignItems:'center'}}>
              {[0,1,2].map(i=>(
                <div key={i} style={{width:7,height:7,borderRadius:'50%',background:'#6366f1',animation:`dotBounce 1.2s ease-in-out ${i*0.2}s infinite`}}/>
              ))}
            </div>
            <span style={{color:'rgba(255,255,255,0.35)',fontSize:10}}>{t.thinking}</span>
          </div>
        )}

        {/* Escalation alert */}
        {escalated && (
          <div style={{background:'rgba(234,179,8,0.1)',border:'1px solid rgba(234,179,8,0.4)',borderRadius:16,padding:'14px 16px',marginBottom:12,textAlign:'center'}}>
            <p style={{color:'#FDE047',fontSize:13,fontWeight:700,margin:'0 0 10px'}}>{t.escalated}</p>
            <a href={`https://wa.me/${BRIDGE_WA_NUMBER.replace('+','')}`} target="_blank" rel="noreferrer"
              style={{display:'inline-flex',alignItems:'center',gap:8,background:'#25d366',color:'#fff',borderRadius:12,padding:'10px 18px',fontSize:13,fontWeight:800,textDecoration:'none'}}>
              {t.wa}
            </a>
          </div>
        )}

        <div ref={bottomRef}/>
      </div>

      {/* Input bar */}
      <div style={{background:'rgba(3,7,18,0.9)',backdropFilter:'blur(16px)',borderTop:'1px solid rgba(99,102,241,0.2)',padding:'12px 16px',paddingBottom:'max(12px,env(safe-area-inset-bottom))'}}>
        <div style={{display:'flex',gap:10,maxWidth:480,margin:'0 auto',alignItems:'flex-end'}}>
          <textarea
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage(input);}}}
            placeholder={t.placeholder}
            rows={1}
            style={{flex:1,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(99,102,241,0.3)',color:'#fff',borderRadius:16,padding:'12px 14px',fontSize:14,outline:'none',resize:'none',minHeight:46,maxHeight:120,lineHeight:1.5,fontFamily:'inherit'}}
          />
          <button
            onClick={()=>sendMessage(input)}
            disabled={loading||!input.trim()}
            style={{width:46,height:46,borderRadius:14,background:loading||!input.trim()?'rgba(79,70,229,0.3)':'linear-gradient(135deg,#4f46e5,#7c3aed)',border:'none',color:'#fff',fontSize:20,cursor:loading||!input.trim()?'default':'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s',boxShadow:loading||!input.trim()?'none':'0 4px 14px rgba(79,70,229,0.4)'}}>
            {loading ? '⏳' : '↑'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dotBounce {
          0%,80%,100%{transform:translateY(0);}
          40%{transform:translateY(-6px);}
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <SessionKeepAlive />
        <Switch>
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/forgot-password" component={ForgotPasswordPage} />
          <Route path="/game" component={GamePage} />
          <Route path="/assistant" component={BridgeAssistantPage} />
          <Route path="/dispatch" component={DispatchPage} />
          <Route path="/driver/:ref" component={DriverTrackerPage} />
          <Route component={App} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <WouterRouter base={basePath}>
    <ClerkProviderWithRoutes />
  </WouterRouter>
);
