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
          <img src="/logo_splash.jpeg" alt="Bridge Safi"
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

function SignInPage() {
  const clerk = useClerk();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
        <button type="submit" style={{...btn, opacity: loading ? 0.7 : 1}} disabled={loading}>
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
  const [, navigate] = useLocation();
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [firstName, setFirstName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isPhone = /^\+?[0-9\s]{7,}$/.test(identifier.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setError('');
    try {
      const params: Record<string, string> = { password };
      if (firstName.trim()) params.firstName = firstName.trim();
      if (isPhone) params.phoneNumber = identifier.trim().replace(/\s/g, '');
      else params.emailAddress = identifier.trim();
      const result = await clerk.client.signUp.create(params);
      if (result.status === 'complete') {
        await clerk.setActive({ session: result.createdSessionId });
        navigate(basePath || '/');
      } else {
        // Verification needed
        if (isPhone) await clerk.client.signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
        else await clerk.client.signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setStep('verify');
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || '';
      if (msg.toLowerCase().includes('email')) setError('Email invalide ou déjà utilisé.');
      else if (msg.toLowerCase().includes('phone')) setError('Numéro de téléphone invalide ou déjà utilisé.');
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
      setError(err?.errors?.[0]?.longMessage || 'Code incorrect.');
    }
    setLoading(false);
  };

  if (step === 'verify') return (
    <AuthPageWrapper>
      <AuthCardHeader
        title="Vérification · Verify"
        sub={`Code envoyé à ${identifier.trim()}`}
      />
      <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column' }}>
        <FocusInput label="Code de vérification (6 chiffres)" value={code} onChange={setCode}
          placeholder="123456" autoComplete="one-time-code" />
        {error && <div style={errStyle}>{error}</div>}
        <button type="submit" style={{...btn, opacity: loading ? 0.7 : 1}} disabled={loading}>
          {loading ? '...' : 'Vérifier →'}
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <button onClick={() => setStep('form')}
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
        <FocusInput label="Prénom (optionnel)" value={firstName} onChange={setFirstName}
          placeholder="Mohamed, Fatima..." autoComplete="given-name" />
        <FocusInput label="Email ou numéro de téléphone" value={identifier} onChange={setIdentifier}
          placeholder="+212 6XX XXX XXX ou email@..." autoComplete="username" />
        <FocusInput label="Mot de passe (8 caractères min.)" type="password" value={password} onChange={setPassword}
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

// ─── GAME PAGE PLACEHOLDER ────────────────────────────────────────────────────

function GamePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isLoaded && !isSignedIn) navigate('/sign-in');
  }, [isLoaded, isSignedIn]);

  if (!isSignedIn) return null;

  const gameId = user?.id
    ? 'BR-' + user.id.replace(/[^a-z0-9]/gi, '').slice(-7).toUpperCase()
    : 'BR-???????';

  const gamePoints = (() => {
    try { return parseInt(localStorage.getItem(`bridge_game_pts_${user?.id||'guest'}`) || '0', 10); } catch { return 0; }
  })();

  return (
    <div style={{minHeight:'100dvh',background:'linear-gradient(160deg,#020c07 0%,#0A2218 40%,#0D2E1A 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'2rem 1.5rem',position:'relative',overflow:'hidden'}}>
      {/* Background zellige pattern */}
      <div style={{position:'absolute',inset:0,opacity:0.04,backgroundImage:'repeating-linear-gradient(45deg,#ffffff 0,#ffffff 1px,transparent 0,transparent 50%)',backgroundSize:'20px 20px',pointerEvents:'none'}}/>

      {/* ── Top bar: back left · logo-poster right ── */}
      <div style={{position:'absolute',top:0,left:0,right:0,display:'flex',alignItems:'flex-start',justifyContent:'space-between',padding:'16px 16px 0'}}>
        <button onClick={()=>navigate('/')}
          style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',color:'#fff',borderRadius:12,padding:'8px 16px',fontSize:13,fontWeight:800,cursor:'pointer',backdropFilter:'blur(8px)'}}>
          ← Retour
        </button>

        {/* Mini poster / logo stamp */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:16,padding:'8px 12px',backdropFilter:'blur(8px)'}}>
          <div style={{width:52,height:52,borderRadius:'50%',overflow:'hidden',border:'2px solid #D9C5A0',boxShadow:'0 0 20px rgba(217,197,160,0.3)'}}>
            <img src="/logo_splash.jpeg" alt="Bridge" style={{width:'100%',height:'100%',objectFit:'cover',transform:'scale(1.1)'}}/>
          </div>
          <span style={{color:'#D9C5A0',fontSize:8,fontWeight:900,letterSpacing:'0.25em'}}>BRIDGE</span>
          <div style={{background:'rgba(74,222,128,0.2)',border:'1px solid rgba(74,222,128,0.5)',borderRadius:6,padding:'2px 7px'}}>
            <span style={{color:'#4ADE80',fontSize:7,fontWeight:900,letterSpacing:'0.15em'}}>GAME</span>
          </div>
        </div>
      </div>

      {/* Shark mascot */}
      <div style={{position:'relative',marginBottom:'1.5rem'}}>
        <div style={{width:210,height:210,borderRadius:'50%',overflow:'hidden',border:'3px solid #065F46',boxShadow:'0 0 60px rgba(6,95,70,0.6), 0 0 120px rgba(6,95,70,0.2)',background:'#0A1A12'}}>
          <img src="/bridge-shark.png" alt="Bridge Shark"
            style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top'}}/>
        </div>
        {/* Glow ring */}
        <div style={{position:'absolute',inset:-8,borderRadius:'50%',border:'2px solid rgba(6,95,70,0.4)',animation:'pulse 2s ease-in-out infinite'}}/>
      </div>

      {/* Game title */}
      <h1 style={{color:'#fff',fontSize:'2rem',fontWeight:900,letterSpacing:4,textTransform:'uppercase',margin:0,textShadow:'0 0 30px rgba(6,95,70,0.8)'}}>
        BRIDGE
      </h1>
      <h2 style={{color:'#4ADE80',fontSize:'1rem',fontWeight:700,letterSpacing:6,textTransform:'uppercase',margin:'4px 0 0',textShadow:'0 0 20px rgba(74,222,128,0.5)'}}>
        GAME
      </h2>

      {/* Player ID badge */}
      <div style={{marginTop:'1.5rem',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:16,padding:'10px 24px',backdropFilter:'blur(8px)',textAlign:'center'}}>
        <p style={{color:'rgba(255,255,255,0.4)',fontSize:10,fontWeight:700,letterSpacing:3,textTransform:'uppercase',margin:'0 0 4px'}}>ID JOUEUR</p>
        <p style={{color:'#4ADE80',fontSize:18,fontWeight:900,letterSpacing:4,margin:0}}>{gameId}</p>
      </div>

      {/* Diamond points */}
      <div style={{marginTop:'1rem',display:'flex',alignItems:'center',gap:10,background:'rgba(253,224,71,0.1)',border:'1px solid rgba(253,224,71,0.3)',borderRadius:16,padding:'10px 24px'}}>
        <span style={{fontSize:28}}>💎</span>
        <div>
          <p style={{color:'rgba(255,255,255,0.4)',fontSize:10,fontWeight:700,letterSpacing:3,textTransform:'uppercase',margin:'0 0 2px'}}>DIAMANTS</p>
          <p style={{color:'#FDE047',fontSize:20,fontWeight:900,margin:0}}>{gamePoints} pts</p>
        </div>
      </div>

      {/* Coming soon badge */}
      <div style={{marginTop:'2.5rem',textAlign:'center'}}>
        <div style={{display:'inline-block',background:'rgba(6,95,70,0.3)',border:'1px solid #065F46',borderRadius:20,padding:'12px 32px',backdropFilter:'blur(8px)'}}>
          <p style={{color:'#4ADE80',fontSize:22,margin:'0 0 4px'}}>🎮</p>
          <p style={{color:'#fff',fontSize:14,fontWeight:900,margin:'0 0 4px',letterSpacing:1}}>Jeu en préparation</p>
          <p style={{color:'rgba(255,255,255,0.4)',fontSize:11,margin:0}}>Collecte de 💎 · Points → Menus offerts</p>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%,100%{opacity:0.4;transform:scale(1);}
          50%{opacity:0.8;transform:scale(1.04);}
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
        <Switch>
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/forgot-password" component={ForgotPasswordPage} />
          <Route path="/game" component={GamePage} />
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
