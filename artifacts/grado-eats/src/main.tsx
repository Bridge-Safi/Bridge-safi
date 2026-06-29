import React, { Component, useEffect, useRef, useState } from 'react';
import { createRoot } from "react-dom/client";
import { AuthProvider, useAuth, useBridgeAuth, useUser } from './bridge-auth';
import { Switch, Route, useLocation, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import App, { HistoryPageRoute } from "./App";
import "./index.css";



const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const queryClient = new QueryClient();

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}



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
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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
          SAFI ÃÂÃÂÃÂÃÂ· MAROC ÃÂÃÂÃÂÃÂ· ÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ· ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¼ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ
        </p>

        {/* Gold bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', margin: '14px 0 6px' }}>
          <div style={{ width: 36, height: 1, background: 'linear-gradient(to right, transparent, #D9C5A0)' }} />
          <div style={{ width: 5, height: 5, background: '#D9C5A0', transform: 'rotate(45deg)' }} />
          <div style={{ width: 36, height: 1, background: 'linear-gradient(to left, transparent, #D9C5A0)' }} />
        </div>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.62rem', letterSpacing: '0.18em', marginTop: 4 }}>
          Bienvenue ÃÂÃÂÃÂÃÂ· Welcome ÃÂÃÂÃÂÃÂ· ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ
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
        ÃÂÃÂÃÂÃÂ© 2026 BRIDGE SAFI ÃÂÃÂÃÂÃÂ· safi-bridge.ma ÃÂÃÂÃÂÃÂ· ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ SÃÂÃÂÃÂÃÂ©curisÃÂÃÂÃÂÃÂ©
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

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ SHARED FORM STYLES ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ

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

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ SIGN-IN PAGE (custom ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ email/phone + password, single screen) ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ FORGOT PASSWORD PAGE ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ

function ForgotPasswordPage() {
  const [, navigate] = useLocation();
  return (
    <AuthPageWrapper>
      <AuthCardHeader title="Mot de passe oubliÃÂ©" sub="Contactez le support Bridge" />
      <div style={{ textAlign:'center', padding:'1rem 0' }}>
        <p style={{ fontSize:'0.85rem', color:'#374151', marginBottom:'1.5rem', lineHeight:1.6 }}>
          Envoyez un message WhatsApp avec votre numÃÂ©ro pour rÃÂ©initialiser votre mot de passe.
        </p>
        <a href="https://wa.me/212600000000?text=Mot+de+passe+oubli%C3%A9"
          target="_blank" rel="noopener noreferrer"
          style={{ display:'block', width:'100%', padding:'0.875rem', borderRadius:14, border:'none',
            background:'#25D366', color:'white', fontWeight:900, fontSize:'0.875rem',
            textDecoration:'none', textAlign:'center', boxShadow:'0 6px 20px rgba(37,211,102,0.3)' }}>
          Ã°ÂÂÂ¬ Contacter le support WhatsApp
        </a>
      </div>
      <div style={{ textAlign:'center', marginTop:'0.5rem', paddingTop:'1rem', borderTop:'1px solid #E5E1D8' }}>
        <button onClick={() => navigate('/sign-in')}
          style={{ background:'none', border:'none', color:'#065F46', fontWeight:700, fontSize:'0.75rem', cursor:'pointer' }}>
          Ã¢ÂÂ Retour ÃÂ  la connexion
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
  const { signIn } = useBridgeAuth();
  const { isLoaded, isSignedIn } = useUser();
  const [, navigate] = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [staySignedIn, setStaySignedIn] = useState(true);
  const isEmailId = identifier.includes('@');
  useEffect(() => { if (isLoaded && isSignedIn) navigate(basePath || '/'); }, [isLoaded, isSignedIn, navigate]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!identifier.trim()) { setError('Entrez votre numÃÂ©ro ou adresse email.'); return; }
    if (!password) { setError('Entrez votre mot de passe.'); return; }
    setLoading(true); setError('');
    try { await signIn(identifier.trim(), password); navigate(basePath || '/'); }
    catch (err: any) { setError(err.message || 'Identifiants incorrects. RÃÂ©essayez.'); }
    setLoading(false);
  };
  return (
    <AuthPageWrapper>
      <AuthCardHeader title="Connexion ÃÂ· Sign in" sub="TÃÂ©lÃÂ©phone ou email ÃÂ· Mot de passe" />
      <div style={{ marginBottom:'1rem', paddingBottom:'1rem', borderBottom:'1px dashed #E5E1D8', textAlign:'center' }}>
        <button type="button"
          onClick={() => { localStorage.setItem('bridge_guest_mode','1'); window.location.href=(basePath||'')+'/'; }}
          style={{ width:'100%', padding:'14px 0', borderRadius:14, border:'none', cursor:'pointer',
            background:'linear-gradient(135deg,#059669 0%,#4ADE80 50%,#059669 100%)',
            color:'#fff', fontSize:'0.95rem', fontWeight:900 }}>
          Ã°ÂÂÂ Commander sans compte
        </button>
      </div>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column' }}>
        <FocusInput label="TÃÂ©lÃÂ©phone ou email" value={identifier} onChange={setIdentifier}
          placeholder={isEmailId?'vous@example.com':'+212 6XX XXX XXX'}
          autoComplete="username" type={isEmailId?'email':'tel'} />
        <FocusInput label="Mot de passe" type="password" value={password} onChange={setPassword}
          placeholder="Ã¢ÂÂ¢Ã¢ÂÂ¢Ã¢ÂÂ¢Ã¢ÂÂ¢Ã¢ÂÂ¢Ã¢ÂÂ¢Ã¢ÂÂ¢Ã¢ÂÂ¢" autoComplete="current-password" />
        {error && <div style={errStyle}>{error}</div>}
        <button type="submit" style={{ ...btn, opacity:loading?0.7:1, marginTop:14 }} disabled={loading}>
          {loading?'Connexion...':'Connexion Ã¢ÂÂ'}
        </button>
      </form>
      <div style={{ textAlign:'center', marginTop:'1rem' }}>
        <button onClick={() => navigate('/forgot-password')}
          style={{ background:'none', border:'none', color:'#9CA3AF', fontSize:'0.72rem', cursor:'pointer', textDecoration:'underline' }}>
          Mot de passe oubliÃÂ© ?
        </button>
      </div>
      <div style={{ textAlign:'center', marginTop:'0.75rem', paddingTop:'0.75rem', borderTop:'1px solid #E5E1D8' }}>
        <span style={{ fontSize:'0.75rem', color:'#9CA3AF' }}>Pas encore de compte ? </span>
        <button onClick={() => navigate('/sign-up')}
          style={{ background:'none', border:'none', color:'#065F46', fontWeight:700, fontSize:'0.75rem', cursor:'pointer' }}>
          CrÃÂ©er un compte
        </button>
      </div>
    </AuthPageWrapper>
  );
}

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ SIGN-UP PAGE (custom ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ name + email/phone + password, then OTP) ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ

const SIGNUP_LANGS = ['fr','en','ar','amz'] as const;
type SignUpLang = typeof SIGNUP_LANGS[number];

const SIGNUP_T: Record<SignUpLang, {
  title: string; sub: string; emailLabel: string; emailPh: string;
  passLabel: string; passPh: string; btnCreate: string; btnCreating: string;
  errEmail: string; errPhone: string; errPass: string; errId: string;
  alreadyHave: string; login: string;
  verifyTitle: string; verifySub: (id: string) => string; verifyLabel: string;
  btnVerify: string; btnVerifying: string; errCode: string; back: string;
  loadMsgs: string[];
}> = {
  fr: {
    title:'CrÃÂÃÂÃÂÃÂ©er un compte ÃÂÃÂÃÂÃÂ· Sign up', sub:'Email ou tÃÂÃÂÃÂÃÂ©lÃÂÃÂÃÂÃÂ©phone + mot de passe',
    emailLabel:'EMAIL OU NUMÃÂÃÂÃÂÃÂRO DE TÃÂÃÂÃÂÃÂLÃÂÃÂÃÂÃÂPHONE *', emailPh:'+212 6XX XXX XXX ou email@...',
    passLabel:'MOT DE PASSE * (8 CARACTÃÂÃÂÃÂÃÂRES MIN.)', passPh:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢',
    btnCreate:'CrÃÂÃÂÃÂÃÂ©er mon compte ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ', btnCreating:'CrÃÂÃÂÃÂÃÂ©ation en cours...',
    errEmail:'Email invalide ou dÃÂÃÂÃÂÃÂ©jÃÂÃÂÃÂÃÂ  utilisÃÂÃÂÃÂÃÂ©.', errPhone:'NumÃÂÃÂÃÂÃÂ©ro invalide ou dÃÂÃÂÃÂÃÂ©jÃÂÃÂÃÂÃÂ  utilisÃÂÃÂÃÂÃÂ©.',
    errPass:'Mot de passe trop faible (8 caractÃÂÃÂÃÂÃÂ¨res min.).', errId:'Email ou tÃÂÃÂÃÂÃÂ©lÃÂÃÂÃÂÃÂ©phone requis.',
    alreadyHave:'DÃÂÃÂÃÂÃÂ©jÃÂÃÂÃÂÃÂ  un compte ?', login:'Se connecter',
    verifyTitle:'VÃÂÃÂÃÂÃÂ©rification ÃÂÃÂÃÂÃÂ· Verify', verifySub:(id)=>`Code envoyÃÂÃÂÃÂÃÂ© ÃÂÃÂÃÂÃÂ  ${id}`,
    verifyLabel:'CODE DE VÃÂÃÂÃÂÃÂRIFICATION (6 CHIFFRES)', btnVerify:'VÃÂÃÂÃÂÃÂ©rifier ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ', btnVerifying:'VÃÂÃÂÃÂÃÂ©rification...',
    errCode:'Code incorrect ou expirÃÂÃÂÃÂÃÂ©.', back:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Retour',
    loadMsgs:['Bienvenue chez Bridge Safi ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ²ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¦','CrÃÂÃÂÃÂÃÂ©ation de votre compte...','PrÃÂÃÂÃÂÃÂ©paration de vos services...','Presque prÃÂÃÂÃÂÃÂªt ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¨','Connexion sÃÂÃÂÃÂÃÂ©curisÃÂÃÂÃÂÃÂ©e ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ'],
  },
  en: {
    title:'Create account ÃÂÃÂÃÂÃÂ· CrÃÂÃÂÃÂÃÂ©er un compte', sub:'Email or phone + password',
    emailLabel:'EMAIL OR PHONE NUMBER *', emailPh:'+212 6XX XXX XXX or email@...',
    passLabel:'PASSWORD * (MIN. 8 CHARACTERS)', passPh:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢',
    btnCreate:'Create my account ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ', btnCreating:'Creating account...',
    errEmail:'Invalid or already used email.', errPhone:'Invalid or already used number.',
    errPass:'Password too weak (min. 8 characters).', errId:'Email or phone required.',
    alreadyHave:'Already have an account?', login:'Sign in',
    verifyTitle:'Verification ÃÂÃÂÃÂÃÂ· VÃÂÃÂÃÂÃÂ©rification', verifySub:(id)=>`Code sent to ${id}`,
    verifyLabel:'VERIFICATION CODE (6 DIGITS)', btnVerify:'Verify ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ', btnVerifying:'Verifying...',
    errCode:'Wrong or expired code.', back:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Back',
    loadMsgs:['Welcome to Bridge Safi ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ²ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¦','Creating your account...','Setting up your services...','Almost ready ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¨','Securing your connection ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ'],
  },
  ar: {
    title:'ÃÂÃÂÃÂÃÂ¥ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ´ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¡ ÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¨ ÃÂÃÂÃÂÃÂ· Sign up', sub:'ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ + ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ© ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ±',
    emailLabel:'ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¥ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ *', emailPh:'+212 6XX XXX XXX ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂ email@...',
    passLabel:'ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ© ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ± * (8 ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ)', passPh:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢',
    btnCreate:'ÃÂÃÂÃÂÃÂ¥ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ´ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¡ ÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ', btnCreating:'ÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¥ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ´ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¡...',
    errEmail:'ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ ÃÂÃÂÃÂÃÂºÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ± ÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ­ ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ®ÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ.', errPhone:'ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂºÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ± ÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ­ ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ®ÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ.',
    errPass:'ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ© ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ± ÃÂÃÂÃÂÃÂ¶ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ© (8 ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ).', errId:'ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ·ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¨.',
    alreadyHave:'ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ', login:'ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ®ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ',
    verifyTitle:'ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ· Verify', verifySub:(id)=>`ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ¥ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ² ÃÂÃÂÃÂÃÂ¥ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ${id}`,
    verifyLabel:'ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ² ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ (6 ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ)', btnVerify:'ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ', btnVerifying:'ÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ...',
    errCode:'ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ² ÃÂÃÂÃÂÃÂ®ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ·ÃÂÃÂÃÂÃÂ¦ ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ©.', back:'ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ',
    loadMsgs:['ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ Bridge Safi ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ²ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¦','ÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ¥ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ´ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¡ ÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ...','ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ² ÃÂÃÂÃÂÃÂ®ÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ...','ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ² ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¨','ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ'],
  },
  amz: {
    title:'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¼ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂÃÂÃÂ· Sign up', sub:'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ»ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ + ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ±ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
    emailLabel:'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ»ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ *', emailPh:'+212 6XX XXX XXX ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ email@...',
    passLabel:'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ±ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ * (8 ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ»ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ)', passPh:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢',
    btnCreate:'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¼ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ', btnCreating:'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°...',
    errEmail:'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ»ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¼ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ»ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ.', errPhone:'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¼ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ»ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ.',
    errPass:'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ±ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¥ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¥ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ (8).', errId:'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ»ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ.',
    alreadyHave:'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ° ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ?', login:'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
    verifyTitle:'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¼ ÃÂÃÂÃÂÃÂ· Verify', verifySub:(id)=>`ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¼ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ${id}`,
    verifyLabel:'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¼ (6)', btnVerify:'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¼ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ', btnVerifying:'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°...',
    errCode:'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¼ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ»ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ.', back:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
    loadMsgs:['ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ Bridge Safi ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ²ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¦','ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ° ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ...','ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ...','ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¹ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ° ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¨','ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ° ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ'],
  },
};

const LANG_FLAGS: Record<SignUpLang, string> = { fr:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ«ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ·', en:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¬ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ§', ar:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ²ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¦', amz:'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£' };

function SignUpLoadingOverlay({ msgs, lang }: { msgs: string[]; lang: SignUpLang }) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [dotCount, setDotCount] = useState(1);
  useEffect(() => {
    const t1 = setInterval(() => setMsgIdx(i => (i + 1) % msgs.length), 900);
    const t2 = setInterval(() => setDotCount(d => d === 3 ? 1 : d + 1), 400);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [msgs]);
  const isRtl = lang === 'ar' || lang === 'amz';
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'linear-gradient(160deg, #011c15 0%, #054130 35%, #065F46 70%, #033d2c 100%)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:32,
    }}>
      {/* Animated logo */}
      <div style={{ position:'relative', width:110, height:110 }}>
        {/* Spinning ring */}
        <div style={{
          position:'absolute', inset:-8,
          border:'3px solid transparent',
          borderTopColor:'#D9C5A0', borderRightColor:'rgba(217,197,160,0.3)',
          borderRadius:'50%',
          animation:'spin360 1.1s linear infinite',
        }}/>
        <div style={{
          position:'absolute', inset:-16,
          border:'2px solid transparent',
          borderBottomColor:'rgba(217,197,160,0.2)', borderLeftColor:'rgba(217,197,160,0.1)',
          borderRadius:'50%',
          animation:'spin360 1.9s linear infinite reverse',
        }}/>
        {/* Logo */}
        <div style={{
          width:110, height:110, borderRadius:'50%', overflow:'hidden',
          border:'3px solid #D9C5A0',
          boxShadow:'0 0 40px rgba(217,197,160,0.3), 0 0 80px rgba(6,95,70,0.4)',
        }}>
          <img src="/logo_splash_new.png" alt="Bridge"
            style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
        </div>
      </div>

      {/* Dots loader */}
      <div style={{ display:'flex', gap:10 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width:10, height:10, borderRadius:'50%',
            background: i < dotCount ? '#D9C5A0' : 'rgba(217,197,160,0.2)',
            transition:'background 0.3s',
            boxShadow: i < dotCount ? '0 0 12px rgba(217,197,160,0.6)' : 'none',
          }}/>
        ))}
      </div>

      {/* Animated message */}
      <div style={{
        textAlign:'center', maxWidth:280, padding:'0 24px',
        direction: isRtl ? 'rtl' : 'ltr',
      }}>
        <p style={{
          color:'#D9C5A0', fontWeight:800, fontSize:'1rem',
          letterSpacing:'0.04em', margin:0,
          textShadow:'0 2px 12px rgba(0,0,0,0.4)',
          transition:'opacity 0.4s',
        }}>
          {msgs[msgIdx]}
        </p>
        <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.62rem', marginTop:6, letterSpacing:'0.08em', fontWeight:600 }}>
          {lang==='ar'?'ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂºÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ 5ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ15 ÃÂÃÂÃÂÃÂ«ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ©ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦':lang==='en'?'May take 5ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ15 s on slow networksÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦':'Peut prendre 5ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ15 s selon le rÃÂÃÂÃÂÃÂ©seauÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦'}
        </p>
        <p style={{ color:'rgba(255,255,255,0.2)', fontSize:'0.58rem', marginTop:4, letterSpacing:'0.15em' }}>
          BRIDGE SAFI ÃÂÃÂÃÂÃÂ· ÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ· ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¼ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ
        </p>
      </div>

      <style>{`@keyframes spin360{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}

function SignUpPage() {
  const { signUp } = useBridgeAuth();
  const { isLoaded, isSignedIn } = useUser();
  const [, navigate] = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEmailId = identifier.includes('@');
  useEffect(() => { if (isLoaded && isSignedIn) navigate(basePath || '/'); }, [isLoaded, isSignedIn, navigate]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!identifier.trim()) { setError('NumÃÂ©ro ou email requis.'); return; }
    if (password.length < 8) { setError('Mot de passe trop faible (8 car. min.).'); return; }
    setLoading(true); setError('');
    try { await signUp(identifier.trim(), password, name.trim()); navigate(basePath || '/'); }
    catch (err: any) { setError(err.message || 'Erreur lors de la crÃÂ©ation du compte.'); }
    setLoading(false);
  };
  if (loading) return <SignUpLoadingOverlay msgs={['Bienvenue chez Bridge Safi Ã°ÂÂÂ²Ã°ÂÂÂ¦','CrÃÂ©ation de votre compte...','Presque prÃÂªt Ã¢ÂÂ¨']} lang="fr" />;
  return (
    <AuthPageWrapper>
      <AuthCardHeader title="CrÃÂ©er un compte ÃÂ· Sign up" sub="TÃÂ©lÃÂ©phone ou email + mot de passe" />
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column' }}>
        <FocusInput label="TÃÂ©lÃÂ©phone ou email *"
          value={identifier} onChange={setIdentifier}
          placeholder={isEmailId?'vous@example.com':'+212 6XX XXX XXX'}
          autoComplete="username" type={isEmailId?'email':'tel'} />
        <FocusInput label="Nom (optionnel)" value={name} onChange={setName}
          placeholder="Votre prÃÂ©nom" autoComplete="name" />
        <FocusInput label="Mot de passe * (8 car. min.)" type="password"
          value={password} onChange={setPassword}
          placeholder="Ã¢ÂÂ¢Ã¢ÂÂ¢Ã¢ÂÂ¢Ã¢ÂÂ¢Ã¢ÂÂ¢Ã¢ÂÂ¢Ã¢ÂÂ¢Ã¢ÂÂ¢" autoComplete="new-password" />
        {error && <div style={errStyle}>{error}</div>}
        <button type="submit" style={{ ...btn }}>CrÃÂ©er mon compte Ã¢ÂÂ</button>
      </form>
      <div style={{ textAlign:'center', marginTop:'1.25rem', paddingTop:'1rem', borderTop:'1px solid #E5E1D8' }}>
        <span style={{ fontSize:'0.75rem', color:'#9CA3AF' }}>DÃÂ©jÃÂ  un compte ? </span>
        <button onClick={() => navigate('/sign-in')}
          style={{ background:'none', border:'none', color:'#065F46', fontWeight:700, fontSize:'0.75rem', cursor:'pointer' }}>
          Se connecter
        </button>
      </div>
    </AuthPageWrapper>
  );
}

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Session keep-alive: renews the Clerk JWT every 4 min when
//    the user chose "Rester connectÃÂÃÂÃÂÃÂ©", preventing inactivity sign-out ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ GAME PAGE PLACEHOLDER ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ

const GAME_LANGS = ['fr','en','ar','amz'] as const;
type GameLang = typeof GAME_LANGS[number];
const GAME_LANG_LABELS: Record<GameLang,string> = {fr:'FR',en:'EN',ar:'AR',amz:'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£'};
const GAME_URL = 'https://game.safi-bridge.ma';
const GAME_TARGET = 60000;
const GAME_T = {
  fr:{
    back:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Retour', playerId:'ID JOUEUR', diamonds:'MES DIAMANTS', playBtn:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ® JOUER MAINTENANT',
    rulesBtn:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ RÃÂÃÂÃÂÃÂ¨gles du jeu', target:'OBJECTIF', progress:'PROGRESSION',
    days:'3 jours ÃÂÃÂÃÂÃÂ· 3h/jour', pts:'pts',
    howTitle:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ COMMENT GAGNER ?',
    sec1Title:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ±ÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ DURÃÂÃÂÃÂÃÂE DE JEU',
    sec1:'Jouez 3h/jour pendant 3 jours ÃÂÃÂÃÂÃÂ· DurÃÂÃÂÃÂÃÂ©e totale : 9h ÃÂÃÂÃÂÃÂ· Plus vous jouez, plus vous gagnez de ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ !',
    sec2Title:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ DIAMANTS ÃÂÃÂÃÂÃÂ RÃÂÃÂÃÂÃÂCOLTER',
    sec2:'Objectif : 60 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ en 3 jours ÃÂÃÂÃÂÃÂ· Rythme : 6 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ/heure (3h ÃÂÃÂÃÂÃÂ 3j = 54 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ) ÃÂÃÂÃÂÃÂ· +2 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ/jour bonus (1h en plus) = 60 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ = livraison gratuite',
    sec3Title:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ DIAMANTS MANQUANTS',
    sec3:'Objectif atteint ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ tout est offert ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ· Manque 10 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ vous payez 5 DH ÃÂÃÂÃÂÃÂ· Calcul : diamants manquants ÃÂÃÂÃÂÃÂ· 10 000 ÃÂÃÂÃÂÃÂ 5 DH',
    bonusTitle:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ BONUS ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ LIVRAISON GRATUITE',
    bonusDesc:'Jouez 4h/jour (1h bonus) ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ +2 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ/jour ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ 60 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ = livraison 100% GRATUITE ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ· Sinon le jeu s\'arrÃÂÃÂÃÂÃÂªte net ÃÂÃÂÃÂÃÂ  3h, revenez le lendemain',
  },
  en:{
    back:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Back', playerId:'PLAYER ID', diamonds:'MY DIAMONDS', playBtn:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ® PLAY NOW',
    rulesBtn:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Game Rules', target:'TARGET', progress:'PROGRESS',
    days:'3 days ÃÂÃÂÃÂÃÂ· 3h/day', pts:'pts',
    howTitle:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ HOW TO WIN?',
    sec1Title:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ±ÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ PLAY TIME',
    sec1:'Play 3h/day for 3 days ÃÂÃÂÃÂÃÂ· Total: 9h ÃÂÃÂÃÂÃÂ· The more you play, the more ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ you earn!',
    sec2Title:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ DIAMONDS TO COLLECT',
    sec2:'Goal: 60,000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ in 3 days ÃÂÃÂÃÂÃÂ· Rate: 6,000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ/hour (3h ÃÂÃÂÃÂÃÂ 3j = 54,000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ) ÃÂÃÂÃÂÃÂ· +2,000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ/day bonus (1 extra hour) = 60,000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ = free delivery',
    sec3Title:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ MISSING DIAMONDS',
    sec3:'Goal reached ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ everything is free ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ· Missing 10,000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ you pay 5 DH ÃÂÃÂÃÂÃÂ· Formula: missing ÃÂÃÂÃÂÃÂ· 10,000 ÃÂÃÂÃÂÃÂ 5 DH',
    bonusTitle:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ BONUS ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ FREE DELIVERY',
    bonusDesc:'Play 4h/day (1 bonus hour) ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ +2,000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ/day ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ 60,000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ = 100% FREE delivery ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ· Otherwise the game stops at 3h, come back tomorrow',
  },
  ar:{
    back:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹', playerId:'ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ¨', diamonds:'ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ', playBtn:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ® ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ¨ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ',
    rulesBtn:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ¯ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ©', target:'ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ', progress:'ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ',
    days:'3 ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ· 3 ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂª/ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ', pts:'ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ·ÃÂÃÂÃÂÃÂ©',
    howTitle:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ²ÃÂÃÂÃÂÃÂ',
    sec1Title:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ±ÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ© ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ¨',
    sec1:'ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ¨ 3 ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂª/ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ© 3 ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ· ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹: 9 ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂª ÃÂÃÂÃÂÃÂ· ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂª ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ«ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂª ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ«ÃÂÃÂÃÂÃÂ±!',
    sec2Title:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂª ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ·ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ©',
    sec2:'ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ: 60 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ 3 ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ· 6 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ/ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ© (3ÃÂÃÂÃÂÃÂ³ ÃÂÃÂÃÂÃÂ 3ÃÂÃÂÃÂÃÂ£ = 54 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ) ÃÂÃÂÃÂÃÂ· +2 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ/ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂ© (ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ© ÃÂÃÂÃÂÃÂ¥ÃÂÃÂÃÂÃÂ¶ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ©) = 60 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ = ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ',
    sec3Title:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂª ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂ©',
    sec3:'ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂª ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ´ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¡ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ· ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂµ 10 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ 5 ÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ· ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¨: ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂµ ÃÂÃÂÃÂÃÂ· 10 000 ÃÂÃÂÃÂÃÂ 5 = ÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ',
    bonusTitle:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂ© ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ',
    bonusDesc:'ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ¨ 4 ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂª/ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ (ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ© ÃÂÃÂÃÂÃÂ¥ÃÂÃÂÃÂÃÂ¶ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ©) ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ +2 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ/ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ 60 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ = ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ 100% ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ· ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¥ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ© ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ 3 ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ¯ ÃÂÃÂÃÂÃÂºÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ',
  },
  amz:{
    back:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ', playerId:'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ³ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡', diamonds:'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ', playBtn:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ® ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
    rulesBtn:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ', target:'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ', progress:'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¹',
    days:'3 ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂÃÂÃÂ· 3 ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ/ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ', pts:'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
    howTitle:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ· ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ?',
    sec1Title:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ±ÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
    sec1:'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ 3 ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ/ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂÃÂÃÂ· 3 ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂÃÂÃÂ· ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ: 9 ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
    sec2Title:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ· ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·',
    sec2:'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ: 60 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ· 6 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ/ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂÃÂÃÂ· +2 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ/ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ±ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ = ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¥ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
    sec3Title:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
    sec3:'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ° ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¥ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ· 10 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ 5 ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂÃÂÃÂ· ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ: ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂÃÂÃÂ· 10 000 ÃÂÃÂÃÂÃÂ 5 = ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
    bonusTitle:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ±ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¥ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
    bonusDesc:'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ 4 ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ/ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ +2 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ 60 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ = ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¥ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ 100% ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ',
  },
};

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ BRIDGE GAME RULES MODAL ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ

function GameRulesModal({ lang, onClose }: { lang: GameLang; onClose: () => void }) {
  const isAR = lang === 'ar';
  const rules = {
    fr: {
      title: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ RÃÂÃÂÃÂÃÂ¨gles du Jeu',
      subtitle: 'Bridge Shark ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Comment gagner ?',
      sections: [
        {
          icon: 'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ±ÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ', title: 'DurÃÂÃÂÃÂÃÂ©e de jeu',
          points: [
            'Jouez autant que vous voulez, ÃÂÃÂÃÂÃÂ  votre rythme',
            'Objectif total : atteindre 60 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ',
            'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Plus vous jouez, plus vous gagnez de ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ !',
          ]
        },
        {
          icon: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ', title: 'Diamants ÃÂÃÂÃÂÃÂ  rÃÂÃÂÃÂÃÂ©colter',
          points: [
            'Objectif : rÃÂÃÂÃÂÃÂ©colter 60 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ',
            '200 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ = 1 MAD de rÃÂÃÂÃÂÃÂ©duction sur votre commande',
            '60 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ = 300 MAD offerts !',
          ]
        },
        {
          icon: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¸', title: 'Diamants manquants',
          points: [
            'Si vous atteignez 60 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ tout est offert ! ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ',
            'S\'il manque 10 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ vous payez 5 DH',
            'S\'il manque 30 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ vous payez 15 DH',
            'Calcul : diamants manquants ÃÂÃÂÃÂÃÂ· 10 000 ÃÂÃÂÃÂÃÂ 5 DH',
          ]
        },
        {
          icon: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ´', title: 'BONUS ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Livraison gratuite',
          points: [
            'Atteignez 60 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ prochaine livraison 100% GRATUITE ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ',
            'Chaque commande jouÃÂÃÂÃÂÃÂ©e booste vos diamants !',
          ]
        },
        {
          icon: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ', title: 'Comment utiliser vos gains',
          points: [
            'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂµ Un menu depuis Bridge Eats',
            'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¬ Un paquet de cigarettes via Bridge Tabac',
            'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¹ Une coupe de fleurs via Bridge Fleurs',
            'ÃÂÃÂÃÂÃÂchangez directement dans l\'application !',
          ]
        },
      ],
      example: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¡ Exemple : vous avez 50 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ au lieu de 60 000 ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ il manque 10 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ vous payez seulement 5 DH.',
      close: 'J\'ai compris ! ÃÂÃÂ°ÃÂÃÂÃÂÃÂ¦ÃÂÃÂ',
    },
    en: {
      title: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Game Rules',
      subtitle: 'Bridge Shark ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ How to win?',
      sections: [
        {
          icon: 'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ±ÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ', title: 'Playing time',
          points: [
            'Play at your own pace, whenever you want',
            'Total goal: reach 60,000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ',
            'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ The more you play, the more ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ you earn!',
          ]
        },
        {
          icon: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ', title: 'Diamonds to collect',
          points: [
            'Goal: collect 60,000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ',
            '200 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ = 1 MAD discount on your order',
            '60,000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ = 300 MAD off!',
          ]
        },
        {
          icon: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¸', title: 'Missing diamonds',
          points: [
            'Reach 60,000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ everything is free! ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ',
            'Missing 10,000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ you pay 5 DH',
            'Missing 30,000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ you pay 15 DH',
            'Formula: missing diamonds ÃÂÃÂÃÂÃÂ· 10,000 ÃÂÃÂÃÂÃÂ 5 DH',
          ]
        },
        {
          icon: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ´', title: 'BONUS ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Free delivery',
          points: [
            'Reach 60,000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ next delivery 100% FREE ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ',
            'Every order played boosts your diamonds!',
          ]
        },
        {
          icon: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ', title: 'How to use your winnings',
          points: [
            'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂµ A meal from Bridge Eats',
            'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¬ A pack of cigarettes from Bridge Tabac',
            'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¹ A bunch of flowers from Bridge Fleurs',
            'Redeem directly in the app!',
          ]
        },
      ],
      example: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¡ Example: you have 50,000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ instead of 60,000 ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ missing 10,000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ you pay only 5 DH.',
      close: 'Got it! ÃÂÃÂ°ÃÂÃÂÃÂÃÂ¦ÃÂÃÂ',
    },
    ar: {
      title: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ¯ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ©',
      subtitle: 'Bridge Shark ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ²ÃÂÃÂÃÂÃÂ',
      sections: [
        {
          icon: 'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ±ÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ', title: 'ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂª ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ¨',
          points: [
            'ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ¨ ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ© ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ´ÃÂÃÂÃÂÃÂ¦ÃÂÃÂÃÂÃÂª',
            'ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ : ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ¥ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ 60 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ',
            'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂª ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ«ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂª ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂª ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ«ÃÂÃÂÃÂÃÂ±!',
          ]
        },
        {
          icon: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ', title: 'ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂª ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ·ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ©',
          points: [
            'ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ : ÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ 60 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ',
            '200 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ = 1 ÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ®ÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ·ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ',
            '60 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ = 300 ÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ!',
          ]
        },
        {
          icon: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¸', title: 'ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂª ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂ©',
          points: [
            'ÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂª 60 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ´ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¡ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ! ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ',
            'ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂµ 10 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ 5 ÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ',
            'ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂµ 30 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ 15 ÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ',
            'ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¨ : ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂµ ÃÂÃÂÃÂÃÂ· 10 000 ÃÂÃÂÃÂÃÂ 5 = ÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ',
          ]
        },
        {
          icon: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ´', title: 'ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂ© ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ',
          points: [
            'ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ 60 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ 100% ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ',
            'ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ·ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¨ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂª!',
          ]
        },
        {
          icon: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ', title: 'ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ®ÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ',
          points: [
            'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂµ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ© ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ Bridge Eats',
            'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¬ ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ© ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¦ÃÂÃÂÃÂÃÂ± ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ Bridge Tabac',
            'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¹ ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ© ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ¯ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ Bridge Fleurs',
            'ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ´ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ© ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ·ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ!',
          ]
        },
      ],
      example: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¡ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ«ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ : ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ 50 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ 60 000 ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂµ 10 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ 5 ÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ·.',
      close: 'ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂª! ÃÂÃÂ°ÃÂÃÂÃÂÃÂ¦ÃÂÃÂ',
    },
    amz: {
      title: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡',
      subtitle: 'Bridge Shark',
      sections: [
        {
          icon: 'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ±ÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ', title: 'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡',
          points: [
            'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·, ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·',
            'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ : 60 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ',
            'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ!',
          ]
        },
        {
          icon: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ', title: 'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
          points: [
            'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ : 60 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ',
            '200 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ = 1 ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¼ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°',
            '60 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ = 300 ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½!',
          ]
        },
        {
          icon: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¸', title: 'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
          points: [
            '60 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½! ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ',
            'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ° 10 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ 5 ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
            'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ° 30 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ 15 ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
            'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ: ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂÃÂÃÂ· 10 000 ÃÂÃÂÃÂÃÂ 5 = ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
          ]
        },
        {
          icon: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ´', title: 'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ±ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ±ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ° ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¼',
          points: [
            '60 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ 100% ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ',
            'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¼ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¹ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ!',
          ]
        },
        {
          icon: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ', title: 'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ· ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½',
          points: [
            'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂµ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ Bridge Eats',
            'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¬ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ±ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ Bridge Tabac',
            'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¹ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ Bridge Fleurs',
          ]
        },
      ],
      example: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¡ 50 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ³ 60 000 ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ° 10 000 ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ 5 ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ.',
      close: 'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ! ÃÂÃÂ°ÃÂÃÂÃÂÃÂ¦ÃÂÃÂ',
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
                    <p dir="auto" style={{color:'rgba(255,255,255,0.8)',fontSize:13,margin:0,lineHeight:1.5}}>{p}</p>
                  </div>
                ))}
              </div>
            ))}

            {/* Example */}
            <div style={{background:'rgba(253,224,71,0.1)',border:'1px solid rgba(253,224,71,0.3)',borderRadius:14,padding:'12px 14px',marginBottom:16}}>
              <p dir="auto" style={{color:'#FDE047',fontSize:12,margin:0,lineHeight:1.6}}>{r.example}</p>
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

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ PWA Install Banner (pages hors Bridge Eats) ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
function PWAInstallBannerSimple({ appName = 'Bridge Safi' }: { appName?: string }) {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const deferredPrompt = useRef<any>(null);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (localStorage.getItem('bridge_pwa_banner_dismissed')) return;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);
    if (ios) { const t = setTimeout(() => setShow(true), 3500); return () => clearTimeout(t); }
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e;
      const t = setTimeout(() => setShow(true), 3500);
      return () => clearTimeout(t);
    };
    window.addEventListener('beforeinstallprompt', handler as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  const dismiss = () => {
    setShow(false);
    try { localStorage.setItem('bridge_pwa_banner_dismissed', '1'); } catch {}
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

  return (
    <div style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'flex-end',justifyContent:'center',pointerEvents:'none'}}>
      <div style={{width:'100%',maxWidth:480,pointerEvents:'auto',background:'linear-gradient(160deg,#064E3B 0%,#065F46 60%,#047857 100%)',boxShadow:'0 -16px 60px rgba(6,95,70,0.55)',border:'1.5px solid rgba(52,211,153,0.35)',borderBottom:'none',borderRadius:'24px 24px 0 0',overflow:'hidden'}}>
        <div style={{display:'flex',justifyContent:'center',padding:'10px 0 4px'}}>
          <div style={{width:36,height:4,borderRadius:9,background:'rgba(255,255,255,0.25)'}}/>
        </div>
        <div style={{padding:'4px 20px 28px'}}>
          {!showIOSGuide ? (
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:52,height:52,borderRadius:14,overflow:'hidden',flexShrink:0,border:'2px solid rgba(217,197,160,0.5)',boxShadow:'0 4px 16px rgba(0,0,0,0.3)'}}>
                <img src="/logo_bridge_512.png" alt="Bridge" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontWeight:900,color:'white',fontSize:14,margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>Installer {appName}</p>
                <p style={{color:'rgba(255,255,255,0.7)',fontSize:12,margin:0}}>AccÃÂÃÂÃÂÃÂ¨s rapide depuis l'ÃÂÃÂÃÂÃÂ©cran d'accueil</p>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                <button onClick={install} style={{fontWeight:900,fontSize:12,padding:'8px 16px',borderRadius:20,border:'none',cursor:'pointer',background:'#D9C5A0',color:'#065F46',boxShadow:'0 4px 14px rgba(0,0,0,0.2)'}}>
                  Installer
                </button>
                <button onClick={dismiss} style={{fontWeight:900,fontSize:12,padding:'8px 12px',borderRadius:20,border:'none',cursor:'pointer',background:'rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.7)'}}>
                  ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
                </button>
              </div>
            </div>
          ) : (
            <div style={{textAlign:'center',padding:'4px 0'}}>
              <p style={{color:'white',fontWeight:900,fontSize:13,margin:'0 0 10px'}}>Installer {appName}</p>
              <p style={{color:'rgba(255,255,255,0.8)',fontSize:12,margin:'0 0 12px'}}>
                Appuyez sur <span style={{fontSize:20}}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ</span> puis <strong>"Sur l'ÃÂÃÂÃÂÃÂ©cran d'accueil"</strong>
              </p>
              <div style={{fontSize:28,marginBottom:12}}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ</div>
              <button onClick={dismiss} style={{fontWeight:700,fontSize:12,padding:'8px 20px',borderRadius:16,border:'none',cursor:'pointer',background:'rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.8)'}}>
                Plus tard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GamePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [, navigate] = useLocation();

  const lang: GameLang = (() => {
    try {
      const raw = localStorage.getItem('bridge_nav_state');
      if (raw) { const p = JSON.parse(raw); if (GAME_LANGS.includes(p.lang)) return p.lang as GameLang; }
    } catch {}
    return 'fr';
  })();

  const isAR = lang === 'ar';

  if (!isLoaded) return null;

  // Not signed in ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ show lock screen (Bridge Eats login REQUIRED, no phone bypass)
  if (!isSignedIn) {
    const lockT = {
      fr: { title: 'CONNEXION BRIDGE EATS REQUISE', game: 'SAFI RUNNER', desc: 'Pour jouer, connecte-toi d\'abord sur Bridge Eats avec ton email et ton numÃÂÃÂÃÂÃÂ©ro. Tu seras automatiquement reconnu sur le jeu et tes diamants seront synchronisÃÂÃÂÃÂÃÂ©s.', connectBtn: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂµ ME CONNECTER SUR BRIDGE EATS', note: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Bridge Eats gÃÂÃÂÃÂÃÂ¨re la connexion. Tes ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ sont liÃÂÃÂÃÂÃÂ©s ÃÂÃÂÃÂÃÂ  ton compte\nÃÂÃÂ¢ÃÂÃÂÃÂÃÂ joue depuis n\'importe quel appareil avec le mÃÂÃÂÃÂÃÂªme email.', signUpLink: 'Pas encore inscrit ? CrÃÂÃÂÃÂÃÂ©er un compte' },
      en: { title: 'BRIDGE EATS LOGIN REQUIRED', game: 'SAFI RUNNER', desc: 'To play, sign in to Bridge Eats first with your email and number. You\'ll be automatically recognized and your diamonds will sync.', connectBtn: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂµ SIGN IN ON BRIDGE EATS', note: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Bridge Eats manages the login. Your ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ are linked to your account\nÃÂÃÂ¢ÃÂÃÂÃÂÃÂ play from any device with the same email.', signUpLink: 'Not registered yet? Create an account' },
      ar: { title: 'ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ®ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ·ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¨', game: 'SAFI RUNNER', desc: 'ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ®ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ Bridge Eats. ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¦ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ²ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ.', connectBtn: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂµ ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ®ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ± Bridge Eats', note: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Bridge Eats ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ± ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ. ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ·ÃÂÃÂÃÂÃÂ© ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ.', signUpLink: 'ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ³ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ´ÃÂÃÂÃÂÃÂ¦ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ' },
      amz: { title: 'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ³ BRIDGE EATS', game: 'SAFI RUNNER', desc: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ±ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ± ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ Bridge Eats.', connectBtn: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂµ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ BRIDGE EATS', note: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Bridge Eats ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ³.', signUpLink: 'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ· ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°? ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¼ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ±' },
    }[lang];
    return (
      <div dir={isAR ? 'rtl' : 'ltr'} style={{minHeight:'100dvh',background:'linear-gradient(180deg,#04110A 0%,#071C11 60%,#050F08 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 20px',gap:0}}>
        <div style={{width:'100%',maxWidth:360,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(74,222,128,0.2)',borderRadius:28,padding:'36px 24px 28px',display:'flex',flexDirection:'column',alignItems:'center',gap:16,backdropFilter:'blur(12px)'}}>
          <div style={{fontSize:52,lineHeight:1}}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ</div>
          <p style={{color:'#4ADE80',fontSize:10,fontWeight:900,letterSpacing:'0.18em',margin:0,textAlign:'center',textTransform:'uppercase'}}>{lockT.title}</p>
          <p style={{color:'#fff',fontSize:22,fontWeight:900,letterSpacing:'0.12em',margin:0,textAlign:'center'}}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂ¦ÃÂÃÂ {lockT.game}</p>
          <p style={{color:'rgba(255,255,255,0.65)',fontSize:13,fontWeight:500,lineHeight:1.6,textAlign:'center',margin:0}}>{lockT.desc}</p>
          {/* SEUL accÃÂÃÂÃÂÃÂ¨s : via Bridge Eats ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ aucune entrÃÂÃÂÃÂÃÂ©e par numÃÂÃÂÃÂÃÂ©ro seul */}
          <button onClick={()=>navigate('/sign-in')} style={{width:'100%',padding:'18px 0',borderRadius:18,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#059669 0%,#4ADE80 50%,#059669 100%)',color:'#fff',fontSize:15,fontWeight:900,letterSpacing:'0.04em',marginTop:4,boxShadow:'0 0 28px rgba(74,222,128,0.4)'}}>
            {lockT.connectBtn}
          </button>
          <p style={{color:'rgba(255,255,255,0.35)',fontSize:10,fontWeight:500,lineHeight:1.5,textAlign:'center',margin:0,whiteSpace:'pre-line'}}>{lockT.note}</p>
          <button onClick={()=>navigate('/sign-up')} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.4)',fontSize:11,fontWeight:700,textDecoration:'underline',padding:'2px 0',marginTop:-4}}>
            {lockT.signUpLink}
          </button>
        </div>
      </div>
    );
  }

  // Signed in ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ fetch game token then show Safi Runner
  return <><GameIframe userId={user.id} lang={lang} isAR={isAR} /><PWAInstallBannerSimple appName="Bridge Game" /></>;
}

/** Fetches a verified phone token then loads the game iframe */
function GameIframe({ userId, lang, isAR }: { userId: string; lang: GameLang; isAR: boolean }) {
  const [, navigate] = useLocation();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [state, setState] = useState<'loading'|'ready'|'no_phone'|'error'>('loading');
  const [gameToken, setGameToken] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>('');
  const diamondsCacheKey = `bridge_diamonds_cache_${userId}`;
  const [liveDiamonds, setLiveDiamonds] = useState<number>(() => {
    try { return parseInt(localStorage.getItem(`bridge_diamonds_cache_${userId}`) || '0', 10) || 0; } catch { return 0; }
  });
  // Track balance at session start so we can add session earnings to it
  const sessionStartDiamonds = useRef<number>(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const getAuthHeaders = async (): Promise<HeadersInit> => {
    const token = await getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Best available avatar: reactive state so it updates when photo changes
  const [avatarSrc, setAvatarSrc] = useState<string>(() => {
    try { return localStorage.getItem(`bridge_eats_avatar_${userId}`) || ''; } catch { return ''; }
  });

  // Sync avatar from localStorage when it changes (e.g. user just saved a new photo)
  useEffect(() => {
    const readAvatar = () => {
      try {
        const stored = localStorage.getItem(`bridge_eats_avatar_${userId}`) || '';
        setAvatarSrc(stored || user?.imageUrl || '');
      } catch { setAvatarSrc(user?.imageUrl || ''); }
    };
    readAvatar();
    window.addEventListener('storage', readAvatar);
    return () => window.removeEventListener('storage', readAvatar);
  }, [userId, user?.imageUrl]);

  const gameId = phone
    ? 'BR-' + phone.replace(/\D/g,'').slice(0,6) + ((playerName||'').trim()[0]||'?').toUpperCase()
    : 'BR-???????';

  // Wait until Clerk is loaded and user is signed in before fetching the game token
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    setState('loading');
    getToken().then(token => {
      const h: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      return fetch('/api/game/token', { method: 'POST', credentials: 'include', headers: h });
    })
      .then(r => r.json())
      .then(data => {
        if (data.error === 'no_phone') { setState('no_phone'); return; }
        if (data.token && data.phone) {
          setGameToken(data.token);
          setPhone(data.phone);
          setPlayerName(data.name || '');
          setState('ready');
        } else setState('error');
      })
      .catch(() => setState('error'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isLoaded, isSignedIn]);

  // Send player profile (avatar + name + diamonds) to game after it loads.
  // Fetches real balance from server first so sessionStart is always accurate,
  // even on a fresh device where localStorage cache is empty.
  const sendProfileToGame = () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    const dispatch = (serverDiamonds: number) => {
      // Update cache with authoritative server value
      try { localStorage.setItem(diamondsCacheKey, String(serverDiamonds)); } catch {}
      setLiveDiamonds(serverDiamonds);
      // Record the balance at session start so we can add session earnings correctly
      sessionStartDiamonds.current = serverDiamonds;
      iframe.contentWindow!.postMessage({
        type: 'bridge_player',
        avatarUrl: avatarSrc,
        displayName: playerName,
        diamonds: serverDiamonds,
      }, '*');
    };

    // Try to get authoritative balance from server; fall back to cache if offline
    getToken().then(token => {
      const h: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      return fetch('/api/game/diamonds', { credentials: 'include', headers: h });
    }).then(r => r.ok ? r.json() : null).then(data => {
      const serverVal = typeof data?.diamonds === 'number' ? data.diamonds : null;
      if (serverVal !== null) {
        dispatch(serverVal);
      } else {
        // Offline fallback: use cache
        const cached = (() => { try { return parseInt(localStorage.getItem(diamondsCacheKey) || '0', 10) || 0; } catch { return 0; } })();
        dispatch(cached);
      }
    }).catch(() => {
      // Offline fallback: use cache
      const cached = (() => { try { return parseInt(localStorage.getItem(diamondsCacheKey) || '0', 10) || 0; } catch { return 0; } })();
      dispatch(cached);
    });
  };

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event.origin.includes('bridge-safi') && !event.origin.includes('replit')) return;
      const msg = event.data;
      if (!msg) return;

      // Game requests player info ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ send profile
      if (msg.type === 'request_player_info') { sendProfileToGame(); return; }

      const rawDiamonds: number | undefined =
        typeof msg.diamonds === 'number' ? msg.diamonds :
        typeof msg.score === 'number' ? msg.score :
        typeof msg.gems === 'number' ? msg.gems :
        typeof msg.points === 'number' ? msg.points :
        undefined;
      if (typeof rawDiamonds !== 'number' || rawDiamonds < 0 || !Number.isInteger(rawDiamonds)) return;

      // If game sends less than the session start, it started from 0 ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ add to existing balance.
      // If game sends more than session start, it incorporated our starting value ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ use directly.
      const sessionStart = sessionStartDiamonds.current;
      const diamonds = rawDiamonds < sessionStart
        ? sessionStart + rawDiamonds   // game reset to 0, add earned to previous balance
        : rawDiamonds;                 // game used our starting balance, value is already cumulative

      // Cache instantly for real-time sync with SharkDiamondWidget (user-specific key)
      try { localStorage.setItem(diamondsCacheKey, String(diamonds)); } catch {}
      setLiveDiamonds(diamonds);
      // Notify other tabs/widgets via storage event
      window.dispatchEvent(new StorageEvent('storage', { key: diamondsCacheKey, newValue: String(diamonds) }));

      getToken().then(token => {
        const h: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        return fetch('/api/game/diamonds', {
          method: 'POST', credentials: 'include',
          headers: { ...h, 'Content-Type': 'application/json' },
          body: JSON.stringify({ diamonds }),
        });
      }).catch(() => {});
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerName, avatarSrc]);

  const noPhoneMsg = {
    fr: { title: 'NUMÃÂÃÂÃÂÃÂRO REQUIS', body: 'Pour jouer, tu dois d\'abord enregistrer ton numÃÂÃÂÃÂÃÂ©ro de tÃÂÃÂÃÂÃÂ©lÃÂÃÂÃÂÃÂ©phone dans ton profil Bridge.', btn: 'Aller ÃÂÃÂÃÂÃÂ  mon profil' },
    en: { title: 'PHONE REQUIRED', body: 'To play, you must first add your phone number to your Bridge profile.', btn: 'Go to my profile' },
    ar: { title: 'ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ·ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¨', body: 'ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂ¨ ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ¥ÃÂÃÂÃÂÃÂ¶ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ© ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ´ÃÂÃÂÃÂÃÂ®ÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂ.', btn: 'ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ´ÃÂÃÂÃÂÃÂ®ÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂ' },
    amz: { title: 'AÃÂÃÂ¡ÃÂÃÂ¹ÃÂÃÂ¬ILIFUN ILAQ', body: 'Ad tsÃÂÃÂÃÂÃÂ£eÃÂÃÂ¡ÃÂÃÂ¹ÃÂÃÂÃÂÃÂ¡ÃÂÃÂ¸ÃÂÃÂ, ÃÂÃÂÃÂÃÂemmreÃÂÃÂÃÂÃÂ£ aÃÂÃÂ¡ÃÂÃÂ¹ÃÂÃÂ­ilifun inek.', btn: 'AÃÂÃÂ¡ÃÂÃÂ¸ÃÂÃÂ¥sab inek' },
  }[lang];

  if (state === 'loading') return (
    <div style={{minHeight:'100dvh',background:'#04110A',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16}}>
      <div style={{width:44,height:44,border:'3px solid rgba(74,222,128,0.3)',borderTop:'3px solid #4ADE80',borderRadius:'50%',animation:'spin 0.9s linear infinite'}}/>
      <p style={{color:'rgba(255,255,255,0.4)',fontSize:12,fontWeight:700,letterSpacing:'0.1em'}}>{isAR?'ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ...':lang==='en'?'Loading...':'Chargement...'}</p>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (state === 'no_phone') return (
    <div dir={isAR?'rtl':'ltr'} style={{minHeight:'100dvh',background:'linear-gradient(180deg,#04110A,#071C11)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 20px'}}>
      <div style={{width:'100%',maxWidth:360,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(248,113,113,0.3)',borderRadius:28,padding:'36px 24px',display:'flex',flexDirection:'column',alignItems:'center',gap:14,backdropFilter:'blur(12px)'}}>
        <div style={{fontSize:48}}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂµ</div>
        <p style={{color:'#F87171',fontSize:10,fontWeight:900,letterSpacing:'0.18em',margin:0,textAlign:'center',textTransform:'uppercase'}}>{noPhoneMsg.title}</p>
        <p style={{color:'rgba(255,255,255,0.65)',fontSize:13,fontWeight:500,lineHeight:1.6,textAlign:'center',margin:0}}>{noPhoneMsg.body}</p>
        <button onClick={()=>navigate('/')} style={{width:'100%',padding:'16px 0',borderRadius:16,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#059669,#4ADE80)',color:'#fff',fontSize:14,fontWeight:900,marginTop:4}}>
          ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¤ {noPhoneMsg.btn}
        </button>
      </div>
    </div>
  );

  if (state === 'error') return (
    <div style={{minHeight:'100dvh',background:'#04110A',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12}}>
      <p style={{color:'#F87171',fontSize:13,fontWeight:700}}>{isAR?'ÃÂÃÂÃÂÃÂ®ÃÂÃÂÃÂÃÂ·ÃÂÃÂÃÂÃÂ£ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ':lang==='en'?'Failed to load game':'Erreur de chargement'}</p>
      <button onClick={()=>navigate('/')} style={{padding:'12px 24px',borderRadius:14,border:'none',background:'rgba(74,222,128,0.15)',color:'#4ADE80',fontSize:13,fontWeight:900,cursor:'pointer'}}>
        ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ {isAR?'ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹':lang==='en'?'Back':'Retour'}
      </button>
    </div>
  );

  const gameApiBase = window.location.origin;
  const saveUrl = `${gameApiBase}/api/game/diamonds/by-token`;
  // Use the server-side avatar endpoint ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ a stable HTTPS URL the game can always fetch.
  // Falls back to Clerk imageUrl if the user hasn't saved a custom photo yet.
  const serverAvatarUrl = `${window.location.origin}/api/profile/avatar/${encodeURIComponent(userId)}`;
  const avatarParam = `&avatarUrl=${encodeURIComponent(serverAvatarUrl)}`;
  const nameParam = playerName ? `&displayName=${encodeURIComponent(playerName)}` : '';
  const gameSrc = `${GAME_URL}/?phone=${encodeURIComponent(phone!)}&gameId=${encodeURIComponent(gameId)}&userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(gameToken!)}&verifyUrl=${encodeURIComponent(`${gameApiBase}/api/game/verify-token`)}&saveUrl=${encodeURIComponent(saveUrl)}&diamondsUrl=${encodeURIComponent(saveUrl)}&apiUrl=${encodeURIComponent(saveUrl)}${avatarParam}${nameParam}`;

  return (
    <div style={{position:'fixed',inset:0,zIndex:9999,background:'#000'}}>
      {/* Fullscreen iframe ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ no space stolen */}
      <iframe
        ref={iframeRef}
        src={gameSrc}
        style={{position:'absolute',inset:0,width:'100%',height:'100%',border:'none'}}
        allow="accelerometer; gyroscope"
        title="Safi Runner"
        onLoad={sendProfileToGame}
      />
      {/* Right-side controls ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ back arrow + avatar stacked, near the game's player circle */}
      <div style={{position:'absolute',right:10,bottom:120,zIndex:10,display:'flex',flexDirection:'column',alignItems:'center',gap:8,pointerEvents:'auto'}}>
        {/* Back button */}
        <button onClick={()=>navigate('/')}
          style={{width:36,height:36,borderRadius:'50%',border:'1.5px solid rgba(74,222,128,0.4)',
            background:'rgba(4,17,10,0.75)',backdropFilter:'blur(8px)',WebkitBackdropFilter:'blur(8px)',
            color:'#4ADE80',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:'0 2px 12px rgba(0,0,0,0.5)',lineHeight:1}}>
          ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
        </button>
        {/* Leaderboard button */}
        <button onClick={()=>navigate('/classement')}
          style={{width:36,height:36,borderRadius:'50%',border:'1.5px solid rgba(255,215,0,0.5)',
            background:'rgba(4,17,10,0.75)',backdropFilter:'blur(8px)',WebkitBackdropFilter:'blur(8px)',
            color:'#FFD700',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:'0 2px 12px rgba(0,0,0,0.5)',lineHeight:1}}
          title="Classement">
          ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ
        </button>
        {/* Avatar */}
        {avatarSrc
          ? <img src={avatarSrc} alt="Profil" style={{width:36,height:36,borderRadius:'50%',objectFit:'cover',
              border:'2px solid rgba(74,222,128,0.6)',boxShadow:'0 2px 12px rgba(0,0,0,0.5)',flexShrink:0}}/>
          : <div style={{width:36,height:36,borderRadius:'50%',background:'rgba(4,17,10,0.75)',
              backdropFilter:'blur(8px)',WebkitBackdropFilter:'blur(8px)',
              border:'2px solid rgba(74,222,128,0.4)',display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:16,boxShadow:'0 2px 12px rgba(0,0,0,0.5)',flexShrink:0}}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¤</div>
        }
      </div>
    </div>
  );
}

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ DRIVER GPS TRACKER PAGE ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
// Supports both delivery (ref starts with digit) and taxi (ref starts with TC-)

function DriverTrackerPage({ params }: { params?: { ref?: string } }) {
  const ref = params?.ref || '';
  const isTaxi = ref.startsWith('TC-');

  // Apply saved dark mode preference
  useEffect(() => {
    const dark = localStorage.getItem('bridge_dark') === '1';
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  // ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Delivery mode state ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
  const [status, setStatus] = useState<'asking'|'active'|'error'|'denied'>('asking');
  const [coords, setCoords] = useState<{lat:number;lng:number}|null>(null);
  const [lastSent, setLastSent] = useState<number|null>(null);
  const watchId = useRef<number|null>(null);

  // ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Taxi mode state ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
  const [taxiState, setTaxiState] = useState<'loading'|'pending'|'accepted'|'arrived'>('loading');
  const [bookingInfo, setBookingInfo] = useState<{customerName?:string;customerPhone?:string;clientAddress?:string;destination?:string;clientLat?:number;clientLng?:number}|null>(null);
  const [taxiCoords, setTaxiCoords] = useState<{lat:number;lng:number}|null>(null);
  const [taxiLastSent, setTaxiLastSent] = useState<number|null>(null);
  const taxiWatchId = useRef<number|null>(null);

  // ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Load taxi booking info ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
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

  // ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Delivery mode ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
  const [delivStatus, setDelivStatus] = useState<'received'|'preparing'|'on_way'|'delivered'>('received');

  const pushPosition = async (lat: number, lng: number) => {
    try {
      await fetch(`/api/tracking/${ref}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
      });
      setLastSent(Date.now());
    } catch (_) {}
  };

  const updateDelivStatus = async (newStatus: 'received'|'preparing'|'on_way'|'delivered') => {
    setDelivStatus(newStatus);
    try {
      await fetch(`/api/tracking/${ref}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (newStatus === 'delivered') {
        if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
        await fetch(`/api/tracking/${ref}`, { method: 'DELETE' }).catch(() => {});
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (isTaxi) return;
    if (!ref) { setStatus('error'); return; }
    if (!navigator.geolocation) { setStatus('error'); return; }
    // Set initial status to received when driver opens the page
    fetch(`/api/tracking/${ref}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'received' }),
    }).catch(() => {});
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
    };
  }, [ref, isTaxi]);

  const secsAgo = lastSent ? Math.round((Date.now() - lastSent) / 1000) : null;
  const taxiSecsAgo = taxiLastSent ? Math.round((Date.now() - taxiLastSent) / 1000) : null;

  // ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ TAXI MODE UI ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
  if (isTaxi) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#78350F 0%,#1A2F23 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '360px', background: '#fff', borderRadius: '24px', padding: '28px 24px', boxShadow: '0 8px 40px rgba(0,0,0,0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '8px' }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ</div>
          <h1 style={{ fontSize: '18px', fontWeight: '900', color: '#78350F', margin: '0 0 2px' }}>Bridge Moto Taxi</h1>
          <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '0 0 20px' }}>Course #{ref}</p>

          {taxiState === 'loading' && (
            <div style={{ padding: '20px', background: '#FEF3C7', borderRadius: '12px' }}>
              <p style={{ fontSize: '13px', color: '#B45309', fontWeight: '700' }}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ³ Chargement de la courseÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦</p>
            </div>
          )}

          {taxiState === 'pending' && bookingInfo && (
            <div>
              {/* Booking info card */}
              <div style={{ background: '#FEF3C7', borderRadius: '14px', padding: '14px', marginBottom: '16px', textAlign: 'left' }}>
                <p style={{ fontSize: '10px', fontWeight: '900', color: '#92400E', letterSpacing: '0.1em', marginBottom: '10px' }}>DÃÂÃÂÃÂÃÂTAILS DE LA COURSE</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '14px' }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¤</span>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '800', color: '#1A2F23', margin: 0 }}>{bookingInfo.customerName || 'Client'}</p>
                      {bookingInfo.customerPhone && <a href={`tel:${bookingInfo.customerPhone}`} style={{ fontSize: '12px', color: '#78350F', fontWeight: '700', textDecoration: 'none' }}>{bookingInfo.customerPhone}</a>}
                    </div>
                  </div>
                  {bookingInfo.clientAddress && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '14px' }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ</span>
                      <div>
                        <p style={{ fontSize: '10px', color: '#9CA3AF', margin: '0 0 2px', fontWeight: '700' }}>DÃÂÃÂÃÂÃÂPART</p>
                        <p style={{ fontSize: '12px', color: '#1A2F23', margin: 0 }}>{bookingInfo.clientAddress}</p>
                        {bookingInfo.clientLat && bookingInfo.clientLng && (
                          <a href={`https://maps.google.com/?q=${bookingInfo.clientLat},${bookingInfo.clientLng}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#3B82F6', fontWeight: '700' }}>Ouvrir dans Maps ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ</a>
                        )}
                      </div>
                    </div>
                  )}
                  {bookingInfo.destination && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '14px' }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ</span>
                      <div>
                        <p style={{ fontSize: '10px', color: '#9CA3AF', margin: '0 0 2px', fontWeight: '700' }}>DESTINATION</p>
                        <p style={{ fontSize: '12px', color: '#1A2F23', margin: 0 }}>{bookingInfo.destination}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={handleAccept} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#065F46,#10B981)', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.4)' }}>
                ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Accepter la course
              </button>
            </div>
          )}

          {taxiState === 'pending' && !bookingInfo && (
            <div style={{ padding: '20px', background: '#FEF3C7', borderRadius: '12px' }}>
              <p style={{ fontSize: '13px', color: '#B45309', fontWeight: '700' }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Course en attente</p>
              <p style={{ fontSize: '11px', color: '#92400E', marginTop: '4px' }}>Informations client non disponibles</p>
              <button onClick={handleAccept} style={{ marginTop: '12px', width: '100%', padding: '12px', background: '#065F46', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '900', cursor: 'pointer' }}>
                ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Accepter
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
                  <p style={{ fontSize: '13px', color: '#1D4ED8', fontWeight: '800', margin: 0 }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ {bookingInfo.destination}</p>
                </div>
              )}
              {taxiCoords && (
                <p style={{ fontSize: '11px', fontFamily: 'monospace', color: '#9CA3AF', background: '#F9FAFB', borderRadius: '8px', padding: '8px', marginBottom: '8px' }}>
                  {taxiCoords.lat.toFixed(6)}, {taxiCoords.lng.toFixed(6)}
                </p>
              )}
              {taxiSecsAgo !== null && <p style={{ fontSize: '11px', color: '#10B981', marginBottom: '16px' }}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Mis ÃÂÃÂÃÂÃÂ  jour il y a {taxiSecsAgo}s</p>}
              <button onClick={handleArrived} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#78350F,#F59E0B)', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 16px rgba(120,53,15,0.4)' }}>
                ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¯ Je suis arrivÃÂÃÂÃÂÃÂ© !
              </button>
              <div style={{ marginTop: '12px', padding: '10px', background: '#FEF3C7', borderRadius: '10px' }}>
                <p style={{ fontSize: '11px', color: '#92400E', fontWeight: '700' }}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ Ne fermez pas cette page</p>
              </div>
            </div>
          )}

          {taxiState === 'arrived' && (
            <div style={{ background: '#EFF6FF', borderRadius: '14px', padding: '20px' }}>
              <p style={{ fontSize: '36px', marginBottom: '8px' }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ</p>
              <p style={{ fontSize: '16px', fontWeight: '900', color: '#1D4ED8', marginBottom: '4px' }}>Course terminÃÂÃÂÃÂÃÂ©e !</p>
              <p style={{ fontSize: '12px', color: '#3B82F6' }}>Le client a ÃÂÃÂÃÂÃÂ©tÃÂÃÂÃÂÃÂ© notifiÃÂÃÂÃÂÃÂ© de votre arrivÃÂÃÂÃÂÃÂ©e.</p>
            </div>
          )}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:0.5;transform:scale(1);}50%{opacity:1;transform:scale(1.3);}}`}</style>
      </div>
    );
  }

  // ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ DELIVERY MODE UI ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
  return (
    <div style={{ minHeight: '100vh', background: '#F0FDF4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '360px', background: '#fff', borderRadius: '24px', padding: '32px 24px', boxShadow: '0 8px 40px rgba(0,0,0,0.12)', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂµ</div>
        <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#065F46', margin: '0 0 4px' }}>Bridge Safi ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ GPS Livreur</h1>
        <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '0 0 24px' }}>Commande #{ref}</p>

        {status === 'asking' && (
          <div style={{ background: '#FEF3C7', borderRadius: '12px', padding: '16px' }}>
            <p style={{ fontSize: '14px', color: '#B45309', fontWeight: '700' }}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ³ En attente de la localisationÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦</p>
            <p style={{ fontSize: '12px', color: '#92400E', marginTop: '4px' }}>Autorisez l'accÃÂÃÂÃÂÃÂ¨s ÃÂÃÂÃÂÃÂ  votre position GPS</p>
          </div>
        )}

        {status === 'active' && delivStatus !== 'delivered' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#D1FAE5', borderRadius: '12px', padding: '10px 16px', marginBottom: '16px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#059669', display: 'inline-block', animation: 'pulse 1.5s infinite' }}/>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#065F46' }}>GPS EN DIRECT</span>
              {secsAgo !== null && <span style={{ fontSize: '10px', color: '#6B7280', marginLeft: 'auto' }}>il y a {secsAgo}s</span>}
            </div>

            {/* Status buttons */}
            <p style={{ fontSize: '10px', fontWeight: '900', color: '#9CA3AF', letterSpacing: '0.08em', marginBottom: '10px', textTransform: 'uppercase' }}>Mettre ÃÂÃÂÃÂÃÂ  jour le statut</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {([
                { key: 'received',  label: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Commande reÃÂÃÂÃÂÃÂ§ue',      bg: '#F0FDF4', border: '#86EFAC', color: '#065F46' },
                { key: 'preparing', label: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¨ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ³ En prÃÂÃÂÃÂÃÂ©paration',       bg: '#FEF3C7', border: '#FDE68A', color: '#92400E' },
                { key: 'on_way',    label: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂµ En chemin vers le client', bg: '#EFF6FF', border: '#93C5FD', color: '#1D4ED8' },
                { key: 'delivered', label: 'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Livraison effectuÃÂÃÂÃÂÃÂ©e',  bg: '#065F46', border: '#065F46', color: '#fff'    },
              ] as {key:'received'|'preparing'|'on_way'|'delivered';label:string;bg:string;border:string;color:string}[]).map(s=>(
                <button key={s.key} onClick={()=>updateDelivStatus(s.key)}
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: '12px',
                    background: delivStatus === s.key ? s.bg : '#F9FAFB',
                    border: `2px solid ${delivStatus === s.key ? s.border : '#E5E7EB'}`,
                    color: delivStatus === s.key ? s.color : '#9CA3AF',
                    fontSize: '13px', fontWeight: delivStatus === s.key ? '800' : '600',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                    boxShadow: delivStatus === s.key ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  }}>
                  {s.label}
                </button>
              ))}
            </div>

            {coords && (
              <p style={{ fontSize: '10px', fontFamily: 'monospace', color: '#9CA3AF', background: '#F9FAFB', borderRadius: '8px', padding: '6px 8px', marginBottom: '8px' }}>
                ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </p>
            )}
            <div style={{ padding: '10px 12px', background: '#FEF3C7', borderRadius: '10px' }}>
              <p style={{ fontSize: '11px', color: '#92400E', fontWeight: '700' }}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ Ne fermez pas cette page</p>
              <p style={{ fontSize: '10px', color: '#B45309', marginTop: '2px' }}>Laissez-la ouverte pendant toute la livraison</p>
            </div>
          </div>
        )}

        {status === 'active' && delivStatus === 'delivered' && (
          <div style={{ background: '#F0FDF4', borderRadius: '14px', padding: '20px' }}>
            <p style={{ fontSize: '36px', marginBottom: '8px' }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ</p>
            <p style={{ fontSize: '16px', fontWeight: '900', color: '#065F46', marginBottom: '4px' }}>Livraison terminÃÂÃÂÃÂÃÂ©e !</p>
            <p style={{ fontSize: '12px', color: '#6B7280' }}>Le client a ÃÂÃÂÃÂÃÂ©tÃÂÃÂÃÂÃÂ© notifiÃÂÃÂÃÂÃÂ©. Merci !</p>
          </div>
        )}

        {status === 'denied' && (
          <div style={{ background: '#FEE2E2', borderRadius: '12px', padding: '16px' }}>
            <p style={{ fontSize: '14px', color: '#DC2626', fontWeight: '700' }}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ AccÃÂÃÂÃÂÃÂ¨s GPS refusÃÂÃÂÃÂÃÂ©</p>
            <p style={{ fontSize: '12px', color: '#991B1B', marginTop: '4px' }}>Activez la localisation dans les paramÃÂÃÂÃÂÃÂ¨tres de votre navigateur puis rechargez la page</p>
          </div>
        )}

        {status === 'error' && (
          <div style={{ background: '#FEE2E2', borderRadius: '12px', padding: '16px' }}>
            <p style={{ fontSize: '14px', color: '#DC2626', fontWeight: '700' }}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Lien invalide</p>
            <p style={{ fontSize: '12px', color: '#991B1B', marginTop: '4px' }}>Utilisez le lien envoyÃÂÃÂÃÂÃÂ© par le restaurant</p>
          </div>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:0.5;transform:scale(1);}50%{opacity:1;transform:scale(1.3);}}`}</style>
    </div>
  );
}

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ DISPATCH PAGE (livreur + chauffeur taxi) ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ

type DispatchRole = 'choose' | 'livreur' | 'taxi' | 'moto';

interface PendingOrder { id: number; ref: string; customerName: string; customerAddress: string; restaurantName: string | null; total: number; items: string; }
interface PendingTaxi { ref: string; customerName?: string; clientAddress?: string; destination?: string; clientLat?: number; clientLng?: number; clientPrice?: number; driverPrice?: number; }

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
  const [driverPhone, setDriverPhone] = useState(() => { try { return localStorage.getItem('bridge_driver_phone') || ''; } catch { return ''; } });
  const [pushOk, setPushOk] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  // Eats state
  const [eatsOrders, setEatsOrders] = useState<PendingOrder[]>([]);
  const [activeEatsOrder, setActiveEatsOrder] = useState<PendingOrder | null>(null);
  const [eatsGPS, setEatsGPS] = useState<'idle' | 'active' | 'denied'>('idle');
  const [eatsCoords, setEatsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [eatsDriverStep, setEatsDriverStep] = useState<'going_to_restaurant' | 'delivering' | 'done'>('going_to_restaurant');
  const eatsWatchId = useRef<number | null>(null);
  const eatsSeenIds = useRef<Set<number>>(new Set());
  const sseRef = useRef<EventSource | null>(null);

  // Taxi state
  const [taxiBookings, setTaxiBookings] = useState<PendingTaxi[]>([]);
  const [activeTaxi, setActiveTaxi] = useState<PendingTaxi | null>(null);
  const [taxiGPS, setTaxiGPS] = useState<'idle' | 'active' | 'denied'>('idle');
  const taxiWatchId = useRef<number | null>(null);
  const taxiSeenRefs = useRef<Set<string>>(new Set());

  // Moto-taxi state
  const [motoBookings, setMotoBookings] = useState<PendingTaxi[]>([]);
  const [activeMoto, setActiveMoto] = useState<PendingTaxi | null>(null);
  const [motoGPS, setMotoGPS] = useState<'idle' | 'active' | 'denied'>('idle');
  const motoWatchId = useRef<number | null>(null);
  const motoSeenRefs = useRef<Set<string>>(new Set());
  const [driverOffers, setDriverOffers] = useState<Record<string,string>>({});

  // Update page title based on role (affects PWA app name on install)
  useEffect(() => {
    if (role === 'moto') document.title = 'Bridge Moto Taxi';
    else if (role === 'taxi') document.title = 'Bridge Taxi ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Safi';
    else if (role === 'livreur') document.title = 'Bridge Livraison';
    else document.title = 'Bridge Dispatch';
    return () => { document.title = 'Bridge Safi ÃÂÃÂÃÂÃÂ· Livraison & Taxi ÃÂÃÂÃÂÃÂ  Safi, Maroc'; };
  }, [role]);

  const handleSetRole = async (r: 'livreur' | 'taxi' | 'moto') => {
    const defaultNames = { livreur: 'Livreur de Repas', taxi: 'Taxi Confort', moto: 'Bridge Moto Taxi' };
    const name = driverName.trim() || defaultNames[r];
    localStorage.setItem('bridge_driver_name', name);
    if (driverPhone.trim()) localStorage.setItem('bridge_driver_phone', driverPhone.trim());
    setRole(r);
    setPushLoading(true);
    const ok = await registerPush(name);
    setPushOk(ok);
    setPushLoading(false);
  };

  // ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ GPS reporting to server (for smart dispatch proximity) ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
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

  // ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ EATS: SSE stream for new orders ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
  useEffect(() => {
    if (role !== 'livreur') return;
    const es = new EventSource('/api/orders/stream?driverKey=BRIDGE-DRIVER-2025');
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

  const DKEY = 'BRIDGE-DRIVER-2025';
  const fetchEatsOrders = async () => {
    try {
      const res = await fetch('/api/orders?status=pending', { cache: 'no-store', headers: { 'x-driver-key': DKEY } });
      if (!res.ok) return;
      const data = await res.json();
      const orders: PendingOrder[] = (data.orders || []).filter((o: any) =>
        (o.service === 'delivery' || o.service === 'eats') &&
        o.deliveryMode !== 'collect' && o.deliveryMode !== 'retrait'
      );
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
    setEatsDriverStep('going_to_restaurant');
    // DB: driver accepted, going to restaurant
    await fetch(`/api/orders/${order.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-driver-key': DKEY },
      body: JSON.stringify({ status: 'accepted', driverName: driverName || 'Livreur' }),
    }).catch(() => {});
    // Don't override tracking status here ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ restaurant may have already set 'preparing'
  };

  const pickupEatsOrder = async () => {
    if (!activeEatsOrder) return;
    setEatsDriverStep('delivering');
    // DB: driver picked up, on the way to client
    await fetch(`/api/orders/${activeEatsOrder.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-driver-key': DKEY },
      body: JSON.stringify({ status: 'on_the_way' }),
    }).catch(() => {});
    // Tracking store: on_way ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ customer sees EN CHEMIN ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂµ
    await fetch(`/api/tracking/${activeEatsOrder.ref}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'on_way', driverName: driverName || 'Livreur', driverPhone: driverPhone || undefined }),
    }).catch(() => {});
    // Start GPS
    startEatsGPS();
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
          body: JSON.stringify({ lat, lng, status: 'on_way', driverName: driverName || 'Livreur', driverPhone: driverPhone || undefined }),
        }).catch(() => {});
      },
      () => setEatsGPS('denied'),
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
  };

  const finishEatsDelivery = async () => {
    if (eatsWatchId.current != null) navigator.geolocation.clearWatch(eatsWatchId.current);
    const order = activeEatsOrder;
    if (order) {
      // Tracking store: delivered ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ customer sees LIVRÃÂÃÂÃÂÃÂE ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
      await fetch(`/api/tracking/${order.ref}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' }),
      }).catch(() => {});
      // DB: delivered
      await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-driver-key': DKEY },
        body: JSON.stringify({ status: 'delivered' }),
      }).catch(() => {});
      // Delete tracking entry after 15s so customer can see LIVRÃÂÃÂÃÂÃÂE
      const ref = order.ref;
      setTimeout(() => { fetch(`/api/tracking/${ref}`, { method: 'DELETE' }).catch(() => {}); }, 15000);
    }
    setEatsDriverStep('going_to_restaurant');
    setActiveEatsOrder(null);
    setEatsGPS('idle');
    setEatsCoords(null);
    fetchEatsOrders();
  };

  // ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ TAXI: poll for pending bookings ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
  useEffect(() => {
    if (role !== 'taxi') return;
    const poll = async () => {
      try {
        const res = await fetch('/api/tracking-pending?type=taxi', { cache: 'no-store' });
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

  // ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ MOTO: poll for pending moto-taxi bookings ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
  useEffect(() => {
    if (role !== 'moto') return;
    const poll = async () => {
      try {
        const res = await fetch('/api/tracking-pending?type=moto', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const bookings: PendingTaxi[] = data.bookings || [];
        setMotoBookings(bookings);
        const newOnes = bookings.filter(b => !motoSeenRefs.current.has(b.ref));
        if (newOnes.length > 0) {
          newOnes.forEach(b => motoSeenRefs.current.add(b.ref));
          playAlarm();
        }
      } catch {}
    };
    poll();
    const iv = setInterval(poll, 5000);
    return () => { clearInterval(iv); if (motoWatchId.current != null) navigator.geolocation.clearWatch(motoWatchId.current); };
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
    if (activeTaxi) {
      await fetch(`/api/tracking/${activeTaxi.ref}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      }).catch(() => {});
      // Save to driver history
      try {
        const raw = localStorage.getItem('bridge_driver_history');
        const arr = raw ? JSON.parse(raw) : [];
        arr.unshift({ ref: activeTaxi.ref, type: 'taxi', customerName: activeTaxi.customerName, from: activeTaxi.clientAddress, to: activeTaxi.destination, date: new Date().toISOString(), driver: driverName });
        if (arr.length > 100) arr.splice(100);
        localStorage.setItem('bridge_driver_history', JSON.stringify(arr));
      } catch {}
    }
    setActiveTaxi(null);
    setTaxiGPS('idle');
  };

  const acceptMoto = async (booking: PendingTaxi) => {
    setActiveMoto(booking);
    setMotoBookings(prev => prev.filter(b => b.ref !== booking.ref));
    await fetch(`/api/tracking/${booking.ref}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'accepted', driverName: driverName || 'Bridge Moto Taxi' }),
    }).catch(() => {});
    if (!navigator.geolocation) { setMotoGPS('denied'); return; }
    motoWatchId.current = navigator.geolocation.watchPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setMotoGPS('active');
        fetch(`/api/tracking/${booking.ref}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng, status: 'accepted', driverName: driverName || 'Bridge Moto Taxi' }),
        }).catch(() => {});
      },
      () => setMotoGPS('denied'),
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
  };

  const finishMoto = async () => {
    if (motoWatchId.current != null) navigator.geolocation.clearWatch(motoWatchId.current);
    if (activeMoto) {
      await fetch(`/api/tracking/${activeMoto.ref}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      }).catch(() => {});
      try {
        const raw = localStorage.getItem('bridge_driver_history');
        const arr = raw ? JSON.parse(raw) : [];
        arr.unshift({ ref: activeMoto.ref, type: 'moto', customerName: activeMoto.customerName, from: activeMoto.clientAddress, to: activeMoto.destination, date: new Date().toISOString(), driver: driverName });
        if (arr.length > 100) arr.splice(100);
        localStorage.setItem('bridge_driver_history', JSON.stringify(arr));
      } catch {}
    }
    setActiveMoto(null);
    setMotoGPS('idle');
  };

  // ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ UI ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
  const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 20, padding: '18px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: 12, border: '1.5px solid #E5E7EB' };

  // CHOOSE ROLE
  if (role === 'choose') {
    return (
      <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg,#020c07 0%,#071C11 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
        <div style={{ width: 70, height: 70, borderRadius: '50%', overflow: 'hidden', border: '2px solid #059669', marginBottom: 16 }}>
          <img src="/logo_splash_new.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <h1 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 900, letterSpacing: '0.2em', margin: '0 0 4px' }}>BRIDGE DISPATCH</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 28px', letterSpacing: '0.1em' }}>PANNEAU CHAUFFEUR / LIVREUR</p>

        <input
          value={driverName}
          onChange={e => setDriverName(e.target.value)}
          placeholder="Votre prÃÂÃÂÃÂÃÂ©nom (ex: Youssef)"
          style={{ width: '100%', maxWidth: 340, padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(74,222,128,0.3)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, marginBottom: 10, outline: 'none', boxSizing: 'border-box' }}
        />
        <input
          value={driverPhone}
          onChange={e => setDriverPhone(e.target.value)}
          placeholder="Votre tÃÂÃÂÃÂÃÂ©lÃÂÃÂÃÂÃÂ©phone (ex: 0600000000)"
          type="tel"
          style={{ width: '100%', maxWidth: 340, padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(74,222,128,0.3)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, marginBottom: 20, outline: 'none', boxSizing: 'border-box' }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 340 }}>
          <button onClick={() => handleSetRole('livreur')}
            style={{ padding: '18px 16px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg,#7C3AED,#A78BFA)', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: '0 0 24px rgba(124,58,237,0.35)', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}>
            <span style={{ fontSize: 26, flexShrink: 0 }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂµ</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900 }}>Livreur de Repas</div>
              <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.85 }}>Livraison de repas et commandes</div>
            </div>
          </button>
          <button onClick={() => handleSetRole('taxi')}
            style={{ padding: '18px 16px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg,#B45309,#F59E0B)', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: '0 0 24px rgba(245,158,11,0.35)', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}>
            <span style={{ fontSize: 26, flexShrink: 0 }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900 }}>Taxi Confort</div>
              <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.85 }}>Courses taxi confort ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Safi</div>
            </div>
          </button>
          <button onClick={() => handleSetRole('moto')}
            style={{ padding: '18px 16px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg,#9A3412,#F97316)', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: '0 0 24px rgba(249,115,22,0.35)', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}>
            <span style={{ fontSize: 26, flexShrink: 0 }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂµ</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900 }}>Bridge Moto Taxi</div>
              <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.85 }}>Courses moto ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Bridge Moto Taxi</div>
            </div>
          </button>
        </div>
        <button onClick={() => navigate('/')} style={{ marginTop: 24, color: 'rgba(255,255,255,0.4)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Retour</button>
      </div>
    );
  }

  const isTaxi = role === 'taxi';
  const isDelivery = role === 'livreur';
  const isMoto = role === 'moto';
  const accent = role === 'taxi' ? '#F59E0B' : role === 'moto' ? '#F97316' : '#059669';
  const accentLight = role === 'taxi' ? '#FEF3C7' : role === 'moto' ? '#FFEDD5' : '#D1FAE5';
  const accentDark = role === 'taxi' ? '#B45309' : role === 'moto' ? '#9A3412' : '#065F46';
  const icon = role === 'taxi' ? 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ' : role === 'moto' ? 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂµ' : 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂµ';
  const label = role === 'taxi' ? 'Taxi Confort' : role === 'moto' ? 'Moto Taxi' : 'Livreur de Repas';

  return (
    <div style={{ minHeight: '100dvh', background: isDelivery ? '#F0FDF4' : isMoto ? '#FFF7ED' : '#FFFBEB', fontFamily: 'system-ui,sans-serif' }}>
      {/* Header */}
      <div style={{ background: accentDark, padding: '52px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 2px' }}>{isMoto ? 'BRIDGE MOTO TAXI' : 'BRIDGE DISPATCH'}</p>
          <h1 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>{icon} {driverName || label}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {pushLoading && <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ³</span>}
          {pushOk && <span style={{ background: 'rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.4)', borderRadius: 20, padding: '3px 10px', color: '#4ADE80', fontSize: 10, fontWeight: 900 }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Notifs ON</span>}
          <button onClick={() => { setRole('choose'); setActiveEatsOrder(null); setActiveTaxi(null); setActiveMoto(null); }}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 10, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂµ</button>
        </div>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto' }}>

        {/* ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ EATS / SCOOTER MODE ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ */}
        {isDelivery && !activeEatsOrder && (
          <>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>COMMANDES EN ATTENTE ({eatsOrders.length})</p>
            {eatsOrders.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ fontSize: 32, margin: '0 0 10px' }}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ³</p>
                <p style={{ color: '#6B7280', fontSize: 14, fontWeight: 700, margin: 0 }}>En attente de commandesÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦</p>
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
                <p style={{ fontSize: 13, fontWeight: 800, color: '#111', margin: '0 0 2px' }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¤ {order.customerName}</p>
                {order.restaurantName && <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 2px' }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂ¥ÃÂÃÂ {order.restaurantName}</p>}
                <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 12px' }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ {order.customerAddress}</p>
                <button onClick={() => acceptEatsOrder(order)}
                  style={{ width: '100%', padding: '13px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#059669,#4ADE80)', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 16px rgba(5,150,105,0.3)' }}>
                  ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Accepter cette commande
                </button>
              </div>
            ))}
          </>
        )}

        {isDelivery && activeEatsOrder && (
          <>
            {/* Order header */}
            <div style={{ ...cardStyle, borderColor: '#BBF7D0', borderWidth: 2, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.1em', margin: '0 0 2px' }}>COMMANDE ACCEPTÃÂÃÂÃÂÃÂE</p>
                  <p style={{ fontSize: 18, fontWeight: 900, color: '#059669', margin: 0 }}>{activeEatsOrder.ref}</p>
                </div>
                <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: 13, fontWeight: 900, borderRadius: 20, padding: '4px 12px' }}>{activeEatsOrder.total} MAD</span>
              </div>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#111', margin: '10px 0 2px' }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¤ {activeEatsOrder.customerName}</p>
            </div>

            {/* GPS indicator (when active) */}
            {eatsGPS === 'active' && (
              <div style={{ background: '#D1FAE5', borderRadius: 12, padding: '10px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#059669', display: 'inline-block', animation: 'pulse 1.5s infinite', flexShrink: 0 }}/>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 900, color: '#065F46', margin: 0 }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¡ GPS EN DIRECT ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Client vous suit</p>
                  {eatsCoords && <p style={{ fontSize: 10, color: '#6B7280', margin: '2px 0 0', fontFamily: 'monospace' }}>{eatsCoords.lat.toFixed(5)}, {eatsCoords.lng.toFixed(5)}</p>}
                </div>
              </div>
            )}
            {eatsGPS === 'denied' && <p style={{ color: '#DC2626', fontSize: 12, marginBottom: 10 }}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ GPS refusÃÂÃÂÃÂÃÂ© ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ activez la localisation dans les paramÃÂÃÂÃÂÃÂ¨tres</p>}

            {/* ÃÂÃÂÃÂÃÂTAPE 1 : Aller au restaurant */}
            <div style={{ ...cardStyle, borderColor: eatsDriverStep === 'going_to_restaurant' ? '#FDE68A' : '#BBF7D0', borderWidth: 2, marginBottom: 10, opacity: eatsDriverStep === 'done' ? 0.5 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: eatsDriverStep !== 'going_to_restaurant' ? '#059669' : '#FEF3C7', border: `2px solid ${eatsDriverStep !== 'going_to_restaurant' ? '#059669' : '#F59E0B'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: eatsDriverStep !== 'going_to_restaurant' ? '#fff' : '#B45309', fontWeight: 900 }}>{eatsDriverStep !== 'going_to_restaurant' ? 'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ' : '1'}</span>
                </div>
                <div>
                  <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.1em', margin: 0 }}>POINT DE COLLECTE ÃÂÃÂÃÂÃÂ· ÃÂÃÂÃÂÃÂTAPE 1</p>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#111', margin: 0 }}>{activeEatsOrder.restaurantName || 'Restaurant'}</p>
                </div>
              </div>
              {activeEatsOrder.restaurantName && (
                <a href={`https://maps.google.com/?q=${encodeURIComponent(activeEatsOrder.restaurantName + ' Safi Maroc')}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F3F4F6', borderRadius: 10, padding: '7px 12px', fontSize: 12, fontWeight: 700, color: '#3B82F6', textDecoration: 'none', marginBottom: eatsDriverStep === 'going_to_restaurant' ? 10 : 0 }}>
                  ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ Naviguer ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Restaurant
                </a>
              )}
              {eatsDriverStep === 'going_to_restaurant' && (
                <button onClick={pickupEatsOrder}
                  style={{ width: '100%', padding: '15px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#B45309,#F59E0B)', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 16px rgba(180,83,9,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ</span> J'ai rÃÂÃÂÃÂÃÂ©cupÃÂÃÂÃÂÃÂ©rÃÂÃÂÃÂÃÂ© la commande
                </button>
              )}
            </div>

            {/* ÃÂÃÂÃÂÃÂTAPE 2 : Livrer au client */}
            <div style={{ ...cardStyle, borderColor: eatsDriverStep === 'delivering' ? '#93C5FD' : '#E5E7EB', borderWidth: 2, opacity: eatsDriverStep === 'going_to_restaurant' ? 0.5 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: eatsDriverStep === 'done' ? '#059669' : eatsDriverStep === 'delivering' ? '#EFF6FF' : '#F3F4F6', border: `2px solid ${eatsDriverStep === 'done' ? '#059669' : eatsDriverStep === 'delivering' ? '#3B82F6' : '#E5E7EB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: eatsDriverStep === 'done' ? '#fff' : eatsDriverStep === 'delivering' ? '#1D4ED8' : '#9CA3AF', fontWeight: 900 }}>{eatsDriverStep === 'done' ? 'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ' : '2'}</span>
                </div>
                <div>
                  <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.1em', margin: 0 }}>DESTINATION</p>
                  <p style={{ fontSize: 13, fontWeight: 800, color: eatsDriverStep === 'going_to_restaurant' ? '#9CA3AF' : '#111', margin: 0 }}>{activeEatsOrder.customerAddress}</p>
                </div>
              </div>
              {eatsDriverStep === 'delivering' && (
                <>
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(activeEatsOrder.customerAddress)}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EFF6FF', borderRadius: 10, padding: '7px 12px', fontSize: 12, fontWeight: 700, color: '#3B82F6', textDecoration: 'none', marginBottom: 10 }}>
                    ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ Naviguer ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Client
                  </a>
                  <button onClick={finishEatsDelivery}
                    style={{ width: '100%', padding: '15px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#065F46,#059669)', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 16px rgba(5,150,105,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ</span> J'ai livrÃÂÃÂÃÂÃÂ© au client
                  </button>
                </>
              )}
            </div>
            <style>{`@keyframes pulse{0%,100%{opacity:0.5;transform:scale(1);}50%{opacity:1;transform:scale(1.3);}}`}</style>
          </>
        )}

        {/* ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ TAXI MODE ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ */}
        {role === 'taxi' && !activeTaxi && (
          <>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>COURSES EN ATTENTE ({taxiBookings.length})</p>
            {taxiBookings.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ fontSize: 32, margin: '0 0 10px' }}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ³</p>
                <p style={{ color: '#6B7280', fontSize: 14, fontWeight: 700, margin: 0 }}>En attente de coursesÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦</p>
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
                <p style={{ fontSize: 13, fontWeight: 800, color: '#111', margin: '0 0 4px' }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¤ {booking.customerName || 'Client'}</p>
                {booking.clientAddress && <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 2px' }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ DÃÂÃÂÃÂÃÂ©part : {booking.clientAddress}</p>}
                {booking.destination && <p style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 800, margin: '0 0 6px' }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Destination : {booking.destination}</p>}
                {booking.clientPrice && (
                  <div style={{ background: '#FEF3C7', borderRadius: 10, padding: '8px 12px', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#92400E', fontWeight: 800 }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ° Client propose : <strong style={{ fontSize: 15 }}>{booking.clientPrice} DH</strong></span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    type="number" min="0" placeholder="Contre-offre (DH)"
                    value={driverOffers[booking.ref] ?? ''}
                    onChange={e => setDriverOffers(prev => ({ ...prev, [booking.ref]: e.target.value }))}
                    style={{ flex: 1, borderRadius: 10, border: '1.5px solid #E5E7EB', padding: '9px 10px', fontSize: 13, fontWeight: 700, outline: 'none' }}
                  />
                  <button
                    onClick={() => {
                      const v = parseFloat(driverOffers[booking.ref] || '');
                      if (!v) return;
                      fetch(`/api/tracking/${booking.ref}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ driverPrice: v }) }).catch(() => {});
                    }}
                    style={{ padding: '9px 14px', borderRadius: 10, border: 'none', background: '#F59E0B', color: '#fff', fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>
                    ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¨
                  </button>
                </div>
                <button onClick={() => acceptTaxi(booking)}
                  style={{ width: '100%', padding: '13px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#B45309,#F59E0B)', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 16px rgba(180,83,9,0.3)' }}>
                  ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Accepter la course
                </button>
              </div>
            ))}
          </>
        )}

        {role === 'taxi' && activeTaxi && (
          <div style={{ ...cardStyle, borderColor: '#FDE68A', borderWidth: 2 }}>
            <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.1em', margin: '0 0 8px' }}>COURSE ACCEPTÃÂÃÂÃÂÃÂE</p>
            <p style={{ fontSize: 18, fontWeight: 900, color: '#B45309', margin: '0 0 6px' }}>{activeTaxi.ref}</p>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#111', margin: '0 0 4px' }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¤ {activeTaxi.customerName || 'Client'}</p>
            {activeTaxi.clientAddress && <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 2px' }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ DÃÂÃÂÃÂÃÂ©part : {activeTaxi.clientAddress}</p>}
            {activeTaxi.destination && <p style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 800, margin: '0 0 14px' }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Destination : {activeTaxi.destination}</p>}

            {taxiGPS === 'active' ? (
              <div style={{ background: '#FEF3C7', borderRadius: 12, padding: '12px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B', display: 'inline-block', animation: 'pulse 1.5s infinite' }}/>
                <p style={{ fontSize: 12, fontWeight: 900, color: '#B45309', margin: 0 }}>GPS EN DIRECT ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Client vous suit sur la carte</p>
              </div>
            ) : taxiGPS === 'denied' ? (
              <p style={{ color: '#DC2626', fontSize: 12, marginBottom: 12 }}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ GPS refusÃÂÃÂÃÂÃÂ© ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ activez la localisation</p>
            ) : (
              <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ³ DÃÂÃÂÃÂÃÂ©marrage GPSÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦</p>
            )}

            <button onClick={finishTaxi}
              style={{ width: '100%', padding: '13px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#059669,#34D399)', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 16px rgba(5,150,105,0.4)' }}>
              ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ J'ai dÃÂÃÂÃÂÃÂ©posÃÂÃÂÃÂÃÂ© le client
            </button>
            <style>{`@keyframes pulse{0%,100%{opacity:0.5;transform:scale(1);}50%{opacity:1;transform:scale(1.3);}}`}</style>
          </div>
        )}

        {/* ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ MOTO TAXI MODE ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ */}
        {isMoto && !activeMoto && (
          <>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>COURSES MOTO EN ATTENTE ({motoBookings.length})</p>
            {motoBookings.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ fontSize: 32, margin: '0 0 10px' }}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ³</p>
                <p style={{ color: '#6B7280', fontSize: 14, fontWeight: 700, margin: 0 }}>En attente de courses motoÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦</p>
                <p style={{ color: '#9CA3AF', fontSize: 11, margin: '4px 0 0' }}>La sonnette retentira automatiquement</p>
              </div>
            ) : motoBookings.map(booking => (
              <div key={booking.ref} style={{ ...cardStyle, borderColor: '#FED7AA', borderWidth: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, margin: '0 0 2px', letterSpacing: '0.1em' }}>COURSE MOTO</p>
                    <p style={{ fontSize: 16, fontWeight: 900, color: '#9A3412', margin: 0 }}>{booking.ref}</p>
                  </div>
                  <span style={{ background: '#FFEDD5', color: '#9A3412', fontSize: 11, fontWeight: 900, borderRadius: 20, padding: '4px 10px' }}>NOUVEAU</span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#111', margin: '0 0 4px' }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¤ {booking.customerName || 'Client'}</p>
                {booking.clientAddress && <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 2px' }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ DÃÂÃÂÃÂÃÂ©part : {booking.clientAddress}</p>}
                {booking.destination && <p style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 800, margin: '0 0 6px' }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Destination : {booking.destination}</p>}
                {booking.clientPrice && (
                  <div style={{ background: '#FFEDD5', borderRadius: 10, padding: '8px 12px', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#7C2D12', fontWeight: 800 }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ° Client propose : <strong style={{ fontSize: 15 }}>{booking.clientPrice} DH</strong></span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    type="number" min="0" placeholder="Contre-offre (DH)"
                    value={driverOffers[booking.ref] ?? ''}
                    onChange={e => setDriverOffers(prev => ({ ...prev, [booking.ref]: e.target.value }))}
                    style={{ flex: 1, borderRadius: 10, border: '1.5px solid #E5E7EB', padding: '9px 10px', fontSize: 13, fontWeight: 700, outline: 'none' }}
                  />
                  <button
                    onClick={() => {
                      const v = parseFloat(driverOffers[booking.ref] || '');
                      if (!v) return;
                      fetch(`/api/tracking/${booking.ref}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ driverPrice: v }) }).catch(() => {});
                    }}
                    style={{ padding: '9px 14px', borderRadius: 10, border: 'none', background: '#F97316', color: '#fff', fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>
                    ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¨
                  </button>
                </div>
                <button onClick={() => acceptMoto(booking)}
                  style={{ width: '100%', padding: '13px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#9A3412,#F97316)', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 16px rgba(249,115,22,0.3)' }}>
                  ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Accepter la course moto
                </button>
              </div>
            ))}
          </>
        )}

        {isMoto && activeMoto && (
          <div style={{ ...cardStyle, borderColor: '#FED7AA', borderWidth: 2 }}>
            <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.1em', margin: '0 0 8px' }}>COURSE MOTO ACCEPTÃÂÃÂÃÂÃÂE</p>
            <p style={{ fontSize: 18, fontWeight: 900, color: '#9A3412', margin: '0 0 6px' }}>{activeMoto.ref}</p>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#111', margin: '0 0 4px' }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¤ {activeMoto.customerName || 'Client'}</p>
            {activeMoto.clientAddress && <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 2px' }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ DÃÂÃÂÃÂÃÂ©part : {activeMoto.clientAddress}</p>}
            {activeMoto.destination && <p style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 800, margin: '0 0 14px' }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Destination : {activeMoto.destination}</p>}

            {motoGPS === 'active' ? (
              <div style={{ background: '#FFEDD5', borderRadius: 12, padding: '12px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F97316', display: 'inline-block', animation: 'pulse 1.5s infinite' }}/>
                <p style={{ fontSize: 12, fontWeight: 900, color: '#9A3412', margin: 0 }}>GPS EN DIRECT ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Client vous suit sur la carte</p>
              </div>
            ) : motoGPS === 'denied' ? (
              <p style={{ color: '#DC2626', fontSize: 12, marginBottom: 12 }}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ GPS refusÃÂÃÂÃÂÃÂ© ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ activez la localisation</p>
            ) : (
              <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ³ DÃÂÃÂÃÂÃÂ©marrage GPSÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦</p>
            )}

            <button onClick={finishMoto}
              style={{ width: '100%', padding: '13px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#059669,#34D399)', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 16px rgba(5,150,105,0.4)' }}>
              ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ J'ai dÃÂÃÂÃÂÃÂ©posÃÂÃÂÃÂÃÂ© le client
            </button>
            <style>{`@keyframes pulse{0%,100%{opacity:0.5;transform:scale(1);}50%{opacity:1;transform:scale(1.3);}}`}</style>
          </div>
        )}

      </div>
      <PWAInstallBannerSimple appName="Bridge Livreur" />
    </div>
  );
}

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ BRIDGE AI ASSISTANT PAGE ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ

type AssistMsg = { role: 'user' | 'assistant'; content: string };

const ASSISTANT_T = {
  fr: {
    title: 'Bridge Assistant',
    subtitle: 'Votre conseiller IA 24/7',
    placeholder: 'ÃÂÃÂÃÂÃÂcrivez votre question...',
    send: 'Envoyer',
    thinking: 'Bridge IA rÃÂÃÂÃÂÃÂ©flÃÂÃÂÃÂÃÂ©chit...',
    greeting: 'Bonjour ! ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Je suis votre assistant Bridge Safi. Comment puis-je vous aider aujourd\'hui ?',
    quickTitle: 'Questions frÃÂÃÂÃÂÃÂ©quentes',
    q1: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¦ Suivre ma commande',
    q2: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Retard de livraison',
    q3: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ³ ProblÃÂÃÂÃÂÃÂ¨me de paiement',
    q4: 'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Autre question',
    escalated: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Un responsable Bridge vous contacte sous 30 min',
    wa: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ± Contacter via WhatsApp',
    back: 'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Retour',
  },
  en: {
    title: 'Bridge Assistant',
    subtitle: 'Your AI advisor 24/7',
    placeholder: 'Write your question...',
    send: 'Send',
    thinking: 'Bridge AI is thinking...',
    greeting: 'Hello! ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ I\'m your Bridge Safi assistant. How can I help you today?',
    quickTitle: 'Frequent questions',
    q1: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¦ Track my order',
    q2: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Delivery delay',
    q3: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ³ Payment issue',
    q4: 'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Other question',
    escalated: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ A Bridge manager will contact you within 30 min',
    wa: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ± Contact via WhatsApp',
    back: 'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Back',
  },
  ar: {
    title: 'ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ¯ ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ¬',
    subtitle: 'ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ´ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ 24/7',
    placeholder: 'ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ¨ ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ¤ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ...',
    send: 'ÃÂÃÂÃÂÃÂ¥ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ',
    thinking: 'ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ¬ AI ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ±...',
    greeting: 'ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ! ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ Bridge Safi. ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ',
    quickTitle: 'ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ¦ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ© ÃÂÃÂÃÂÃÂ´ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¦ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ©',
    q1: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¦ ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ¹ ÃÂÃÂÃÂÃÂ·ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ',
    q2: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂ®ÃÂÃÂÃÂÃÂ± ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ',
    q3: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ³ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ´ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ© ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹',
    q4: 'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ¤ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ®ÃÂÃÂÃÂÃÂ±',
    escalated: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ¤ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ Bridge ÃÂÃÂÃÂÃÂ®ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ 30 ÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ©',
    wa: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ± ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ± ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¨',
    back: 'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹',
  },
  amz: {
    title: 'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ Bridge',
    subtitle: 'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ 24/7',
    placeholder: 'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ± ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¹ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½...',
    send: 'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¥ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¥ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
    thinking: 'Bridge AI ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¼ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ...',
    greeting: 'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ! ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ Bridge Safi.',
    quickTitle: 'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¹ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¥ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
    q1: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¦ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ³ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¥ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
    q2: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
    q3: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ³ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¼',
    q4: 'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¹ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¹ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
    escalated: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ Bridge ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ· ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ 30 ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
    wa: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ± ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ WhatsApp',
    back: 'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
  },
};

type AssistLang = 'fr'|'en'|'ar'|'amz';
const ASSIST_LANGS: AssistLang[] = ['fr','en','ar','amz'];
const ASSIST_CHAT_KEY = 'bridge_assistant_chat';
// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ RESTAURANT OWNER PAGE ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ

const RESTO_RESTAURANTS = [
  "McDonald's Safi",
  "Bridge Pizza & Tacos",
  "Safi Seafood Palace",
  "Kebab Express Safi",
  "Burger Corner Safi",
];

type RestoOrder = {
  id: number; ref: string; customerName: string; customerPhone: string;
  customerAddress: string; items: unknown; total: number;
  deliveryMode: string; paymentMethod: string; status: string;
  createdAt: string; restaurantName: string | null;
};

function playAlert() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

function statusLabel(s: string) {
  const m: Record<string,{label:string;color:string}> = {
    pending:   {label:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¡ En attente',   color:'#F59E0B'},
    accepted:  {label:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¢ AcceptÃÂÃÂÃÂÃÂ©e',     color:'#10B981'},
    preparing: {label:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂµ En prÃÂÃÂÃÂÃÂ©paration',color:'#3B82F6'},
    ready:     {label:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ PrÃÂÃÂÃÂÃÂªt',         color:'#059669'},
    delivered: {label:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¦ LivrÃÂÃÂÃÂÃÂ©e',       color:'#6B7280'},
    refused:   {label:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ RefusÃÂÃÂÃÂÃÂ©e',      color:'#EF4444'},
    cancelled: {label:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ« AnnulÃÂÃÂÃÂÃÂ©e',      color:'#EF4444'},
    on_the_way:{label:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ´ En route',     color:'#8B5CF6'},
  };
  return m[s] || {label:s, color:'#9CA3AF'};
}

type RestoProfile = {
  phone: string; address: string; lat: string; lng: string; webhookUrl: string;
};

function RestaurantOwnerPage() {
  const [, navigate] = useLocation();
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();

  // Clerk-auth state
  const [restoName, setRestoName] = useState('');
  const [linked, setLinked] = useState(false);      // restaurant linked to Clerk account
  const [linking, setLinking] = useState(false);
  const [linkErr, setLinkErr] = useState('');
  const [claimName, setClaimName] = useState('');
  const [claimPin, setClaimPin] = useState('');

  const [orders, setOrders] = useState<RestoOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders'|'settings'>('orders');
  const [profile, setProfile] = useState<RestoProfile>({phone:'',address:'',lat:'',lng:'',webhookUrl:''});
  const [bridgeSecret, setBridgeSecret] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [copied, setCopied] = useState('');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const seenRefs = useRef<Set<string>>(new Set());
  const pollRef = useRef<number|null>(null);

  const authHeaders = async (): Promise<HeadersInit> => {
    const token = await getToken();
    return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  };

  // On load, check if Clerk user already has a restaurant linked
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    (async () => {
      setLoading(true);
      const h = await authHeaders();
      const r = await fetch('/api/restaurant/me', { headers: h }).catch(() => null);
      if (r?.ok) {
        const data = await r.json();
        if (data.restaurant) {
          setRestoName(data.restaurant.name);
          setLinked(true);
          if (data.restaurant.phone) setProfile(p => ({...p, phone: data.restaurant.phone ?? ''}));
          if (data.restaurant.address) setProfile(p => ({...p, address: data.restaurant.address ?? ''}));
          if (data.restaurant.lat != null) setProfile(p => ({...p, lat: String(data.restaurant.lat)}));
          if (data.restaurant.lng != null) setProfile(p => ({...p, lng: String(data.restaurant.lng)}));
          if (data.restaurant.webhookUrl) setProfile(p => ({...p, webhookUrl: data.restaurant.webhookUrl ?? ''}));
          if (data.bridgeSecret) setBridgeSecret(data.bridgeSecret);
        }
      }
      setLoading(false);
    })();
  }, [isLoaded, isSignedIn]);

  const fetchOrders = async () => {
    try {
      const h = await authHeaders();
      const r = await fetch('/api/orders/by-restaurant', { headers: h });
      if (!r.ok) return;
      const data = await r.json();
      const newOrders: RestoOrder[] = data.orders || [];
      const newPending = newOrders.filter(o => o.status === 'pending' && !seenRefs.current.has(o.ref));
      if (newPending.length > 0) { playAlert(); newPending.forEach(o => seenRefs.current.add(o.ref)); }
      newOrders.forEach(o => seenRefs.current.add(o.ref));
      setOrders(newOrders);
    } catch {}
  };

  const saveProfile = async () => {
    setProfileLoading(true); setProfileSaved(false);
    try {
      const h = await authHeaders();
      await fetch('/api/restaurant/profile', {
        method: 'PATCH', headers: h,
        body: JSON.stringify({
          phone:      profile.phone      || null,
          address:    profile.address    || null,
          lat:        profile.lat        ? parseFloat(profile.lat)  : null,
          lng:        profile.lng        ? parseFloat(profile.lng)  : null,
          webhookUrl: profile.webhookUrl || null,
        }),
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch {}
    setProfileLoading(false);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  useEffect(() => {
    if (!linked) return;
    fetchOrders();
    pollRef.current = window.setInterval(fetchOrders, 12000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [linked]);

  const handleClaim = async () => {
    if (!claimName || claimPin.length !== 4) return;
    setLinking(true); setLinkErr('');
    try {
      const h = await authHeaders();
      const r = await fetch('/api/restaurant/claim', {
        method: 'POST', headers: h,
        body: JSON.stringify({ name: claimName, pin: claimPin }),
      });
      const data = await r.json();
      if (!r.ok) { setLinkErr(data.error || 'Erreur'); setLinking(false); return; }
      setRestoName(data.restaurant.name);
      if (data.bridgeSecret) setBridgeSecret(data.bridgeSecret);
      setLinked(true);
    } catch { setLinkErr('Erreur de connexion'); }
    setLinking(false);
  };

  const updateStatus = async (ref: string, status: string) => {
    const h = await authHeaders();
    await fetch(`/api/orders/by-ref/${ref}/status`, {
      method:'PATCH', headers: h,
      body: JSON.stringify({ status, restaurantName: restoName }),
    });
    setOrders(prev => prev.map(o => o.ref === ref ? {...o, status} : o));
    // Sync tracking store ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ customer sees the change in real-time
    if (status === 'preparing' || status === 'accepted') {
      fetch(`/api/tracking/${ref}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'preparing' }),
      }).catch(() => {});
    }
  };

  const logout = async () => {
    setLinked(false); setRestoName(''); setOrders([]); setClaimName(''); setClaimPin('');
    seenRefs.current.clear();
  };

  // Check if push already subscribed when restaurant is linked
  useEffect(() => {
    if (!linked || !restoName) return;
    (async () => {
      try {
        const reg = await navigator.serviceWorker?.getRegistration();
        if (!reg) return;
        const sub = await reg.pushManager?.getSubscription();
        setPushEnabled(!!sub);
      } catch {}
    })();
  }, [linked, restoName]);

  const togglePushNotifications = async () => {
    if (pushLoading) return;
    setPushLoading(true);
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (!reg) { alert("Service worker non disponible. Rechargez la page."); setPushLoading(false); return; }

      if (pushEnabled) {
        // Unsubscribe
        const sub = await reg.pushManager?.getSubscription();
        if (sub) {
          await fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
        setPushEnabled(false);
      } else {
        // Subscribe
        const vapidRes = await fetch('/api/push/vapid-key');
        const { publicKey } = await vapidRes.json();
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKey,
        });
        const json = sub.toJSON();
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: json.endpoint,
            keys: json.keys,
            restaurantName: restoName,
          }),
        });
        setPushEnabled(true);
      }
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'activation des notifications.");
    }
    setPushLoading(false);
  };

  const pending = orders.filter(o => o.status === 'pending');
  const active  = orders.filter(o => ['accepted','preparing'].includes(o.status));
  const done    = orders.filter(o => ['ready','delivered','refused','cancelled','on_the_way'].includes(o.status));

  // ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ NOT SIGNED IN ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
  if (!isLoaded || loading) return (
    <div style={{minHeight:'100dvh',background:'linear-gradient(135deg,#0A1A0F,#0D2E1A)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <span style={{color:'rgba(255,255,255,0.4)',fontSize:13}}>ChargementÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦</span>
    </div>
  );

  if (!isSignedIn) return (
    <div style={{minHeight:'100dvh',background:'linear-gradient(135deg,#0A1A0F 0%,#0D2E1A 50%,#0A1A0F 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'20px',fontFamily:'system-ui'}}>
      <div style={{fontSize:52,marginBottom:14}}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ½ÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ</div>
      <h1 style={{color:'#fff',fontSize:22,fontWeight:900,letterSpacing:'0.1em',margin:'0 0 4px',textAlign:'center'}}>ESPACE RESTAURATEURS</h1>
      <p style={{color:'rgba(255,255,255,0.4)',fontSize:12,fontWeight:600,margin:'0 0 28px',textAlign:'center'}}>Bridge Safi ÃÂÃÂÃÂÃÂ· Interface partenaire</p>
      <div style={{width:'100%',maxWidth:340,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:24,padding:'24px 20px',display:'flex',flexDirection:'column',gap:14,textAlign:'center'}}>
        <p style={{color:'rgba(255,255,255,0.6)',fontSize:13,margin:0}}>Connectez-vous avec votre compte Bridge pour accÃÂÃÂÃÂÃÂ©der ÃÂÃÂÃÂÃÂ  votre espace restaurateur.</p>
        <button onClick={()=>navigate('/sign-in?redirect_url=/restaurant')}
          style={{width:'100%',padding:'15px 0',borderRadius:14,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#059669,#4ADE80)',color:'#fff',fontSize:15,fontWeight:900}}>
          Se connecter ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
        </button>
        <button onClick={()=>navigate('/sign-up?redirect_url=/restaurant')}
          style={{width:'100%',padding:'13px 0',borderRadius:14,border:'1px solid rgba(255,255,255,0.15)',cursor:'pointer',background:'transparent',color:'rgba(255,255,255,0.6)',fontSize:13,fontWeight:700}}>
          CrÃÂÃÂÃÂÃÂ©er un compte
        </button>
      </div>
      <button onClick={()=>navigate('/')} style={{marginTop:20,background:'none',border:'none',color:'rgba(255,255,255,0.35)',fontSize:12,fontWeight:700,cursor:'pointer'}}>
        ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Retour ÃÂÃÂÃÂÃÂ  Bridge
      </button>
    </div>
  );

  // ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ SIGNED IN BUT NO RESTAURANT LINKED YET ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
  if (!linked) return (
    <div style={{minHeight:'100dvh',background:'linear-gradient(135deg,#0A1A0F 0%,#0D2E1A 50%,#0A1A0F 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'20px',fontFamily:'system-ui'}}>
      <div style={{fontSize:52,marginBottom:14}}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ½ÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ</div>
      <h1 style={{color:'#fff',fontSize:22,fontWeight:900,letterSpacing:'0.1em',margin:'0 0 4px',textAlign:'center'}}>LIER VOTRE RESTAURANT</h1>
      <p style={{color:'rgba(255,255,255,0.4)',fontSize:12,fontWeight:600,margin:'0 0 6px',textAlign:'center'}}>ConnectÃÂÃÂÃÂÃÂ© : <strong style={{color:'#4ADE80'}}>{user?.emailAddresses?.[0]?.emailAddress}</strong></p>
      <p style={{color:'rgba(255,255,255,0.3)',fontSize:11,margin:'0 0 24px',textAlign:'center'}}>Choisissez votre restaurant et entrez le PIN fourni par Bridge Safi</p>

      <div style={{width:'100%',maxWidth:340,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:24,padding:'24px 20px',display:'flex',flexDirection:'column',gap:14}}>
        <div>
          <label style={{color:'rgba(255,255,255,0.5)',fontSize:10,fontWeight:900,letterSpacing:'0.12em',textTransform:'uppercase' as const,display:'block',marginBottom:6}}>Votre Restaurant</label>
          <select value={claimName} onChange={e=>setClaimName(e.target.value)}
            style={{width:'100%',padding:'13px 14px',borderRadius:14,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',color:claimName?'#fff':'rgba(255,255,255,0.4)',fontSize:14,fontWeight:700,outline:'none',appearance:'none' as const}}>
            <option value="">-- SÃÂÃÂÃÂÃÂ©lectionner --</option>
            {RESTO_RESTAURANTS.map(r=><option key={r} value={r} style={{background:'#1a2e1f',color:'#fff'}}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={{color:'rgba(255,255,255,0.5)',fontSize:10,fontWeight:900,letterSpacing:'0.12em',textTransform:'uppercase' as const,display:'block',marginBottom:6}}>Code PIN (4 chiffres)</label>
          <input type="password" inputMode="numeric" maxLength={4} value={claimPin} onChange={e=>setClaimPin(e.target.value.replace(/\D/g,'').slice(0,4))}
            placeholder="ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¢"
            style={{width:'100%',boxSizing:'border-box' as const,padding:'13px 14px',borderRadius:14,background:'rgba(255,255,255,0.08)',border:`1px solid ${linkErr?'#EF4444':'rgba(255,255,255,0.15)'}`,color:'#fff',fontSize:22,fontWeight:900,letterSpacing:'0.5em',textAlign:'center' as const,outline:'none'}}
            onKeyDown={e=>{if(e.key==='Enter')handleClaim();}}/>
          {linkErr && <p style={{color:'#F87171',fontSize:11,fontWeight:700,margin:'6px 0 0'}}>{linkErr}</p>}
        </div>
        <button onClick={handleClaim} disabled={!claimName||claimPin.length!==4||linking}
          style={{width:'100%',padding:'15px 0',borderRadius:14,border:'none',cursor:!claimName||claimPin.length!==4||linking?'not-allowed':'pointer',
            background:!claimName||claimPin.length!==4||linking?'rgba(255,255,255,0.1)':'linear-gradient(135deg,#059669,#4ADE80)',
            color:!claimName||claimPin.length!==4||linking?'rgba(255,255,255,0.4)':'#fff',fontSize:15,fontWeight:900}}>
          {linking ? 'Liaison en coursÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦' : 'Lier mon restaurant ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ'}
        </button>
        <p style={{color:'rgba(255,255,255,0.25)',fontSize:10,textAlign:'center' as const,margin:0}}>
          Le PIN est fourni par l'ÃÂÃÂÃÂÃÂ©quipe Bridge Safi lors de l'inscription partenaire
        </p>
      </div>
      <button onClick={()=>navigate('/')} style={{marginTop:20,background:'none',border:'none',color:'rgba(255,255,255,0.35)',fontSize:12,fontWeight:700,cursor:'pointer'}}>
        ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Retour ÃÂÃÂÃÂÃÂ  Bridge
      </button>
    </div>
  );

  // ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ORDER CARD ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
  const OrderCard = ({o}: {o: RestoOrder}) => {
    const st = statusLabel(o.status);
    const items = Array.isArray(o.items) ? o.items as {name:string;qty:number;price:number}[] : [];
    const time = new Date(o.createdAt).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
    return (
      <div style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${o.status==='pending'?'rgba(245,158,11,0.5)':o.status==='refused'?'rgba(239,68,68,0.3)':'rgba(255,255,255,0.08)'}`,borderRadius:18,padding:'14px 16px',marginBottom:10}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div>
            <span style={{color:'#D9C5A0',fontSize:11,fontWeight:900,letterSpacing:'0.1em'}}>{o.ref}</span>
            <span style={{color:'rgba(255,255,255,0.3)',fontSize:10,fontWeight:600,marginLeft:8}}>{time}</span>
          </div>
          <span style={{color:st.color,fontSize:10,fontWeight:900,background:`${st.color}18`,padding:'3px 8px',borderRadius:8}}>{st.label}</span>
        </div>

        <p style={{color:'#fff',fontSize:13,fontWeight:700,margin:'0 0 2px'}}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¤ {o.customerName} ÃÂÃÂÃÂÃÂ· ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ {o.customerPhone}</p>
        <p style={{color:'rgba(255,255,255,0.5)',fontSize:11,fontWeight:600,margin:'0 0 8px'}}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ {o.customerAddress} ÃÂÃÂÃÂÃÂ· {o.deliveryMode==='collect'?'Click & Collect':'Livraison'}</p>

        {items.length>0 && (
          <div style={{background:'rgba(0,0,0,0.2)',borderRadius:10,padding:'8px 10px',marginBottom:10}}>
            {items.map((it,i)=>(
              <p key={i} style={{color:'rgba(255,255,255,0.75)',fontSize:11,fontWeight:600,margin:'0 0 2px'}}>
                ÃÂÃÂÃÂÃÂ {it.qty} {it.name} ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ {it.price} MAD
              </p>
            ))}
          </div>
        )}

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom: o.status==='pending'||o.status==='accepted'||o.status==='preparing'?10:0}}>
          <span style={{color:'#4ADE80',fontSize:14,fontWeight:900}}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ° {o.total} MAD</span>
          <span style={{color:'rgba(255,255,255,0.4)',fontSize:10,fontWeight:700}}>{o.paymentMethod==='cash'?'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂµ Cash':o.paymentMethod==='card'?'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ³ Carte':'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ³'}</span>
        </div>

        {o.status==='pending' && (
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>updateStatus(o.ref,'accepted')}
              style={{flex:1,padding:'11px 0',borderRadius:12,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#059669,#4ADE80)',color:'#fff',fontSize:13,fontWeight:900}}>
              ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Accepter
            </button>
            <button onClick={()=>updateStatus(o.ref,'refused')}
              style={{flex:1,padding:'11px 0',borderRadius:12,cursor:'pointer',background:'rgba(239,68,68,0.2)',border:'1px solid rgba(239,68,68,0.5)',color:'#F87171',fontSize:13,fontWeight:900}}>
              ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Refuser
            </button>
          </div>
        )}
        {o.status==='accepted' && (
          <button onClick={()=>updateStatus(o.ref,'preparing')}
            style={{width:'100%',padding:'11px 0',borderRadius:12,cursor:'pointer',background:'rgba(59,130,246,0.2)',border:'1px solid rgba(59,130,246,0.5)',color:'#60A5FA',fontSize:13,fontWeight:900}}>
            ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¨ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ³ En prÃÂÃÂÃÂÃÂ©paration
          </button>
        )}
        {o.status==='preparing' && (
          <button onClick={()=>updateStatus(o.ref,'ready')}
            style={{width:'100%',padding:'11px 0',borderRadius:12,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#059669,#4ADE80)',color:'#fff',fontSize:13,fontWeight:900}}>
            ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Commande PrÃÂÃÂÃÂÃÂªte !
          </button>
        )}
      </div>
    );
  };

  // ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ DASHBOARD SCREEN ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
  return (
    <div style={{minHeight:'100dvh',background:'linear-gradient(135deg,#0A1A0F 0%,#0D2E1A 50%,#0A1A0F 100%)',fontFamily:'system-ui',paddingBottom:30}}>
      {/* Header */}
      <div style={{position:'sticky',top:0,zIndex:100,background:'rgba(4,17,10,0.95)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(255,255,255,0.08)',padding:'12px 16px',display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontSize:20}}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ½ÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ</span>
        <div style={{flex:1}}>
          <p style={{color:'#fff',fontSize:13,fontWeight:900,margin:0,lineHeight:1}}>{restoName}</p>
          <p style={{color:'rgba(255,255,255,0.4)',fontSize:10,fontWeight:600,margin:0}}>Espace restaurateur</p>
        </div>
        {/* Open/Closed toggle */}
        <button onClick={()=>setIsOpen(p=>!p)}
          style={{padding:'7px 14px',borderRadius:20,cursor:'pointer',
            background: isOpen?'rgba(74,222,128,0.2)':'rgba(239,68,68,0.2)',
            border: `1px solid ${isOpen?'rgba(74,222,128,0.4)':'rgba(239,68,68,0.4)'}`,
            color: isOpen?'#4ADE80':'#F87171', fontSize:11,fontWeight:900}}>
          {isOpen?'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¢ OUVERT':'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ´ FERMÃÂÃÂÃÂÃÂ'}
        </button>
        <button onClick={logout} style={{padding:'7px 12px',borderRadius:20,border:'1px solid rgba(255,255,255,0.1)',background:'transparent',color:'rgba(255,255,255,0.4)',fontSize:10,fontWeight:700,cursor:'pointer'}}>
          DÃÂÃÂÃÂÃÂ©co.
        </button>
      </div>

      {/* Tab navigation */}
      <div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
        {([['orders','ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Commandes'],['settings','ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ ParamÃÂÃÂÃÂÃÂ¨tres']] as const).map(([tab,label])=>(
          <button key={tab} onClick={()=>setActiveTab(tab)}
            style={{flex:1,padding:'12px 0',border:'none',cursor:'pointer',background:'transparent',
              color: activeTab===tab?'#4ADE80':'rgba(255,255,255,0.35)',
              fontSize:12,fontWeight:900,letterSpacing:'0.04em',
              borderBottom: activeTab===tab?'2px solid #4ADE80':'2px solid transparent',
              transition:'all 0.2s'}}>
            {label}
          </button>
        ))}
      </div>

      {/* ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ COMMANDES TAB ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ */}
      {activeTab==='orders' && (
        <div style={{padding:'14px 14px 0'}}>
          {/* Stats */}
          <div style={{display:'flex',gap:8,marginBottom:14}}>
            {[
              {label:'En attente', count:pending.length, color:'#F59E0B'},
              {label:'En cours',   count:active.length,  color:'#3B82F6'},
              {label:'TerminÃÂÃÂÃÂÃÂ©es',  count:done.length,     color:'#6B7280'},
            ].map(s=>(
              <div key={s.label} style={{flex:1,padding:'10px 0',textAlign:'center',background:'rgba(255,255,255,0.03)',borderRadius:12,border:'1px solid rgba(255,255,255,0.06)'}}>
                <p style={{color:s.color,fontSize:20,fontWeight:900,margin:0}}>{s.count}</p>
                <p style={{color:'rgba(255,255,255,0.35)',fontSize:9,fontWeight:700,margin:0,textTransform:'uppercase'}}>{s.label}</p>
              </div>
            ))}
          </div>

          <button onClick={()=>fetchOrders()}
            style={{width:'100%',padding:'10px 0',borderRadius:14,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'rgba(255,255,255,0.5)',fontSize:12,fontWeight:700,cursor:'pointer',marginBottom:14}}>
            ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Actualiser les commandes
          </button>

          {pending.length>0 && (
            <>
              <p style={{color:'#F59E0B',fontSize:10,fontWeight:900,letterSpacing:'0.15em',textTransform:'uppercase',margin:'0 0 10px'}}>
                ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¡ EN ATTENTE ({pending.length})
              </p>
              {pending.map(o=><OrderCard key={o.ref} o={o}/>)}
            </>
          )}
          {active.length>0 && (
            <>
              <p style={{color:'#60A5FA',fontSize:10,fontWeight:900,letterSpacing:'0.15em',textTransform:'uppercase',margin:'14px 0 10px'}}>
                ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¨ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ³ EN COURS ({active.length})
              </p>
              {active.map(o=><OrderCard key={o.ref} o={o}/>)}
            </>
          )}
          {done.length>0 && (
            <>
              <p style={{color:'rgba(255,255,255,0.25)',fontSize:10,fontWeight:900,letterSpacing:'0.15em',textTransform:'uppercase',margin:'14px 0 10px'}}>
                ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¦ TERMINÃÂÃÂÃÂÃÂES ({done.length})
              </p>
              {done.map(o=><OrderCard key={o.ref} o={o}/>)}
            </>
          )}
          {orders.length===0 && (
            <div style={{textAlign:'center',paddingTop:40}}>
              <div style={{fontSize:48,marginBottom:12}}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ½ÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ</div>
              <p style={{color:'rgba(255,255,255,0.3)',fontSize:14,fontWeight:700}}>Aucune commande pour l'instant</p>
              <p style={{color:'rgba(255,255,255,0.2)',fontSize:12,fontWeight:600}}>Actualisation automatique toutes les 12 secondes</p>
            </div>
          )}
        </div>
      )}

      {/* ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ PARAMÃÂÃÂÃÂÃÂTRES TAB ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ */}
      {activeTab==='settings' && (
        <div style={{padding:'16px 14px 40px'}}>

          {/* Restaurant info */}
          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:18,padding:'16px',marginBottom:16}}>
            <p style={{color:'rgba(255,255,255,0.4)',fontSize:10,fontWeight:900,letterSpacing:'0.12em',textTransform:'uppercase',margin:'0 0 14px'}}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Informations</p>

            <div style={{marginBottom:12}}>
              <label style={{color:'rgba(255,255,255,0.45)',fontSize:10,fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',display:'block',marginBottom:6}}>Nom du restaurant</label>
              <div style={{padding:'12px 14px',borderRadius:12,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.5)',fontSize:13,fontWeight:700}}>{restoName}</div>
            </div>

            <div style={{marginBottom:12}}>
              <label style={{color:'rgba(255,255,255,0.45)',fontSize:10,fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',display:'block',marginBottom:6}}>TÃÂÃÂÃÂÃÂ©lÃÂÃÂÃÂÃÂ©phone WhatsApp</label>
              <input type="tel" value={profile.phone} onChange={e=>setProfile(p=>({...p,phone:e.target.value}))}
                placeholder="+212612345678"
                style={{width:'100%',boxSizing:'border-box',padding:'12px 14px',borderRadius:12,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',color:'#fff',fontSize:13,fontWeight:600,outline:'none'}}/>
            </div>

            <div>
              <label style={{color:'rgba(255,255,255,0.45)',fontSize:10,fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',display:'block',marginBottom:6}}>Adresse</label>
              <input type="text" value={profile.address} onChange={e=>setProfile(p=>({...p,address:e.target.value}))}
                placeholder="Ex: 12 Rue Hassan II, Safi"
                style={{width:'100%',boxSizing:'border-box',padding:'12px 14px',borderRadius:12,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',color:'#fff',fontSize:13,fontWeight:600,outline:'none'}}/>
            </div>
          </div>

          {/* GPS coordinates */}
          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:18,padding:'16px',marginBottom:16}}>
            <p style={{color:'rgba(255,255,255,0.4)',fontSize:10,fontWeight:900,letterSpacing:'0.12em',textTransform:'uppercase',margin:'0 0 14px'}}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ CoordonnÃÂÃÂÃÂÃÂ©es GPS</p>
            <p style={{color:'rgba(255,255,255,0.3)',fontSize:11,fontWeight:600,margin:'0 0 12px'}}>UtilisÃÂÃÂÃÂÃÂ©es pour le dispatch intelligent des livreurs.</p>
            <div style={{display:'flex',gap:10}}>
              <div style={{flex:1}}>
                <label style={{color:'rgba(255,255,255,0.45)',fontSize:10,fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',display:'block',marginBottom:6}}>Latitude</label>
                <input type="number" step="any" value={profile.lat} onChange={e=>setProfile(p=>({...p,lat:e.target.value}))}
                  placeholder="32.3012"
                  style={{width:'100%',boxSizing:'border-box',padding:'12px 14px',borderRadius:12,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',color:'#fff',fontSize:13,fontWeight:600,outline:'none'}}/>
              </div>
              <div style={{flex:1}}>
                <label style={{color:'rgba(255,255,255,0.45)',fontSize:10,fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',display:'block',marginBottom:6}}>Longitude</label>
                <input type="number" step="any" value={profile.lng} onChange={e=>setProfile(p=>({...p,lng:e.target.value}))}
                  placeholder="-9.2305"
                  style={{width:'100%',boxSizing:'border-box',padding:'12px 14px',borderRadius:12,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',color:'#fff',fontSize:13,fontWeight:600,outline:'none'}}/>
              </div>
            </div>
          </div>

          {/* Integration / Webhook */}
          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:18,padding:'16px',marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              <span style={{fontSize:16}}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ</span>
              <p style={{color:'#fff',fontSize:13,fontWeight:900,margin:0}}>Pont d'intÃÂÃÂÃÂÃÂ©gration Eats</p>
            </div>
            <p style={{color:'rgba(255,255,255,0.35)',fontSize:11,fontWeight:600,margin:'0 0 14px'}}>Donnez ces informations ÃÂÃÂÃÂÃÂ  votre responsable Bridge Eats</p>
            <div style={{background:'rgba(74,222,128,0.06)',border:'1px solid rgba(74,222,128,0.15)',borderRadius:12,padding:'10px 12px',marginBottom:14}}>
              <p style={{color:'rgba(74,222,128,0.8)',fontSize:11,fontWeight:600,margin:0}}>Bridge Eats enverra automatiquement vos nouvelles commandes ÃÂÃÂÃÂÃÂ  cette URL en utilisant votre token secret. DÃÂÃÂÃÂÃÂ¨s qu'une commande arrive, l'alarme sonne et elle apparaÃÂÃÂÃÂÃÂ®t sur votre tableau de bord.</p>
            </div>

            <div style={{marginBottom:12}}>
              <label style={{color:'rgba(255,255,255,0.45)',fontSize:10,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',display:'block',marginBottom:6}}>URL DU WEBHOOK (votre systÃÂÃÂÃÂÃÂ¨me)</label>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <input type="url" value={profile.webhookUrl} onChange={e=>setProfile(p=>({...p,webhookUrl:e.target.value}))}
                  placeholder="https://votre-systeme.com/api/commandes"
                  style={{flex:1,padding:'11px 12px',borderRadius:12,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',color:'#fff',fontSize:11,fontWeight:600,outline:'none'}}/>
                {profile.webhookUrl && (
                  <button onClick={()=>copyToClipboard(profile.webhookUrl,'wh')}
                    style={{padding:'11px 14px',borderRadius:12,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.5)',fontSize:12,cursor:'pointer',flexShrink:0}}>
                    {copied==='wh'?'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ':'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ'}
                  </button>
                )}
              </div>
            </div>

            <div style={{marginBottom:12}}>
              <label style={{color:'rgba(255,255,255,0.45)',fontSize:10,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',display:'block',marginBottom:6}}>EN-TÃÂÃÂÃÂÃÂTE REQUIS</label>
              <div style={{padding:'11px 12px',borderRadius:12,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:700,fontFamily:'monospace'}}>X-Bridge-Token</div>
            </div>

            {bridgeSecret && (
              <div>
                <label style={{color:'rgba(255,255,255,0.45)',fontSize:10,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',display:'block',marginBottom:6}}>SECRET DU JETON</label>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <div style={{flex:1,padding:'11px 12px',borderRadius:12,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.6)',fontSize:11,fontWeight:700,fontFamily:'monospace',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {bridgeSecret}
                  </div>
                  <button onClick={()=>copyToClipboard(bridgeSecret,'secret')}
                    style={{padding:'11px 14px',borderRadius:12,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.5)',fontSize:12,cursor:'pointer',flexShrink:0}}>
                    {copied==='secret'?'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ':'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Push Notifications */}
          <div style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${pushEnabled?'rgba(74,222,128,0.25)':'rgba(255,255,255,0.08)'}`,borderRadius:18,padding:'16px',marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              <span style={{fontSize:16}}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ</span>
              <p style={{color:'#fff',fontSize:13,fontWeight:900,margin:0}}>Notifications push</p>
              {pushEnabled && <span style={{marginLeft:'auto',fontSize:10,fontWeight:900,color:'#4ADE80',background:'rgba(74,222,128,0.15)',padding:'3px 8px',borderRadius:8}}>ACTIF</span>}
            </div>
            <p style={{color:'rgba(255,255,255,0.35)',fontSize:11,fontWeight:600,margin:'0 0 14px'}}>
              Recevez une alerte instantanÃÂÃÂÃÂÃÂ©e sur cet appareil dÃÂÃÂÃÂÃÂ¨s qu'une nouvelle commande arrive ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ avant mÃÂÃÂÃÂÃÂªme le livreur.
            </p>
            <button onClick={togglePushNotifications} disabled={pushLoading}
              style={{width:'100%',padding:'13px 0',borderRadius:14,cursor:pushLoading?'not-allowed':'pointer',
                background: pushEnabled ? 'rgba(239,68,68,0.15)' : pushLoading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#065F46,#059669)',
                border: pushEnabled ? '1px solid rgba(239,68,68,0.4)' : 'none',
                color: pushEnabled?'#F87171':'#fff',fontSize:13,fontWeight:900,transition:'all 0.3s'}}>
              {pushLoading ? 'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ³ En coursÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦' : pushEnabled ? 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ DÃÂÃÂÃÂÃÂ©sactiver les notifications' : 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Activer les notifications sur cet appareil'}
            </button>
          </div>

          {/* Save button */}
          <button onClick={saveProfile} disabled={profileLoading}
            style={{width:'100%',padding:'15px 0',borderRadius:16,border:'none',cursor:profileLoading?'not-allowed':'pointer',
              background: profileSaved?'linear-gradient(135deg,#059669,#4ADE80)':profileLoading?'rgba(255,255,255,0.1)':'linear-gradient(135deg,#065F46,#059669)',
              color:'#fff',fontSize:15,fontWeight:900,letterSpacing:'0.05em',transition:'all 0.3s'}}>
            {profileSaved?'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ EnregistrÃÂÃÂÃÂÃÂ© !':profileLoading?'Enregistrement...':'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¾ Enregistrer le profil'}
          </button>
        </div>
      )}
      <PWAInstallBannerSimple appName="Bridge Restaurant" />
    </div>
  );
}

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ END RESTAURANT OWNER PAGE ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ

const ASSIST_LANG_LABELS: Record<AssistLang,string> = {fr:'FR',en:'EN',ar:'AR',amz:'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£'};

function BridgeAssistantPage() {
  const [, navigate] = useLocation();
  const [lang, setLang] = useState<AssistLang>(()=>{
    try { const r = localStorage.getItem('bridge_nav_state'); if(r){const p=JSON.parse(r);if(ASSIST_LANGS.includes(p.lang)) return p.lang;} } catch{}
    return 'fr';
  });
  const t = ASSISTANT_T[lang];
  const isAR = lang==='ar';

  const [messages, setMessages] = useState<AssistMsg[]>(() => {
    try {
      const saved = localStorage.getItem(ASSIST_CHAT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AssistMsg[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [{ role:'assistant', content: ASSISTANT_T[lang].greeting }];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const BRIDGE_WA_NUMBER = '+212764794856';

  // Persist conversation to localStorage on every change
  useEffect(() => {
    try { localStorage.setItem(ASSIST_CHAT_KEY, JSON.stringify(messages)); } catch {}
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages, loading]);

  const clearConversation = () => {
    const fresh = [{ role:'assistant' as const, content: ASSISTANT_T[lang].greeting }];
    setMessages(fresh);
    setEscalated(false);
    try { localStorage.setItem(ASSIST_CHAT_KEY, JSON.stringify(fresh)); } catch {}
  };

  // Re-set greeting when language changes (only if still on the opening message)
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
      setMessages(prev => [...prev, { role:'assistant', content: 'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ Service temporairement indisponible. RÃÂÃÂÃÂÃÂ©essayez dans quelques instants.' }]);
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
          <div style={{display:'flex',gap:6}}>
            {messages.length > 1 && (
              <button onClick={clearConversation}
                title="Effacer la conversation"
                style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',color:'#f87171',borderRadius:12,padding:'8px 10px',fontSize:14,cursor:'pointer',lineHeight:1}}>
                ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ
              </button>
            )}
            <button onClick={()=>setLang(l=>{const i=ASSIST_LANGS.indexOf(l);return ASSIST_LANGS[(i+1)%ASSIST_LANGS.length];})}
              style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',color:'#94a3b8',borderRadius:12,padding:'8px 14px',fontSize:12,fontWeight:700,cursor:'pointer'}}>
              {ASSIST_LANG_LABELS[lang]}
            </button>
          </div>
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
                  <img src="/logo_splash_new.png" alt="Bridge" style={{width:'100%',height:'100%',objectFit:'contain'}}/>
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
              <img src="/logo_splash_new.png" alt="Bridge" style={{width:'100%',height:'100%',objectFit:'contain'}}/>
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
            {loading ? 'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ³' : 'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ'}
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

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Error Boundary ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ attrape les crashes React silencieux ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
interface EBState { hasError: boolean; error: string }
class ErrorBoundary extends Component<{ children: React.ReactNode }, EBState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(err: Error): EBState {
    return { hasError: true, error: err?.message || 'Erreur inconnue' };
  }
  componentDidCatch(err: Error, info: React.ErrorInfo) {
    console.error('[Bridge] App crash:', err, info);
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '32px 20px',
        background: 'linear-gradient(160deg,#030712,#020c07)',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ</div>
        <p style={{ color: '#F87171', fontSize: 13, fontWeight: 900, letterSpacing: '0.12em', margin: '0 0 8px', textTransform: 'uppercase' }}>
          Erreur de l'application
        </p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '0 0 28px', textAlign: 'center', maxWidth: 320 }}>
          {this.state.error}
        </p>
        <button
          onClick={() => { this.setState({ hasError: false, error: '' }); window.location.reload(); }}
          style={{
            padding: '14px 32px', borderRadius: 16, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#065F46,#4ADE80)', color: '#fff',
            fontSize: 14, fontWeight: 900, letterSpacing: '0.06em',
          }}>
          ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Recharger l'application
        </button>
      </div>
    );
  }
}

type Coupon = { code: string; discountType: 'percent'|'fixed'; discountValue: number;
  maxUses: number|null; usedCount: number; expiresAt: string|null; active: boolean; note: string|null; };

function AdminStatsPanel({ adminKey }: { adminKey: string }) {
  const [stats, setStats] = useState<any>(null);
  const [err, setErr] = useState('');

  const refresh = async () => {
    if (!adminKey.trim()) { setStats(null); return; }
    try {
      const r = await fetch(`/api/admin/stats?adminKey=${encodeURIComponent(adminKey.trim())}`);
      if (!r.ok) { setErr('ClÃÂÃÂÃÂÃÂ© admin invalide.'); setStats(null); return; }
      setStats(await r.json()); setErr('');
    } catch { setErr('Erreur rÃÂÃÂÃÂÃÂ©seau.'); }
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [adminKey]);

  if (err) return <div style={{ marginTop: 24, padding: 12, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, color: '#991B1B', fontSize: 12 }}>{err}</div>;
  if (!stats) return null;

  const Card = ({ label, value, sub }: { label: string; value: number|string; sub?: string }) => (
    <div style={{ flex: 1, minWidth: 0, padding: 12, background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB' }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: '#6B7280', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: '#065F46', lineHeight: 1.2, marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{sub}</div>}
    </div>
  );

  const maxViews = Math.max(1, ...stats.daily.map((d: any) => d.views));

  return (
    <div style={{ marginTop: 24, padding: 16, background: '#ECFDF5', borderRadius: 14, border: '1px solid #A7F3D0' }}>
      <h3 style={{ fontSize: 14, fontWeight: 900, color: '#065F46', marginBottom: 12 }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Visiteurs Bridge</h3>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <Card label="AUJOURD'HUI" value={stats.today.uniques} sub={`${stats.today.views} vues`} />
        <Card label="7 JOURS" value={stats.week.uniques} sub={`${stats.week.views} vues`} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <Card label="30 JOURS" value={stats.month.uniques} sub={`${stats.month.views} vues`} />
        <Card label="TOTAL" value={stats.total.uniqueVisitors} sub={`${stats.total.totalViews} vues`} />
      </div>

      <div style={{ fontSize: 10, fontWeight: 800, color: '#065F46', letterSpacing: '0.05em', marginBottom: 6 }}>7 DERNIERS JOURS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {stats.daily.length === 0 && (
          <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', padding: 8 }}>Aucune visite encore.</div>
        )}
        {stats.daily.map((d: any) => {
          const pct = (d.views / maxViews) * 100;
          const date = new Date(d.day).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
          return (
            <div key={d.day} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 70, fontSize: 10, color: '#374151', fontWeight: 700 }}>{date}</div>
              <div style={{ flex: 1, height: 14, background: '#fff', borderRadius: 6, overflow: 'hidden', border: '1px solid #D1FAE5' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #10B981, #4ADE80)' }} />
              </div>
              <div style={{ minWidth: 90, textAlign: 'right', fontSize: 10, color: '#065F46', fontWeight: 800 }}>
                {d.uniques} pers ÃÂÃÂÃÂÃÂ· {d.views} vues
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={refresh}
        style={{ marginTop: 12, width: '100%', padding: '8px 0', background: '#065F46', color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
        ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ RafraÃÂÃÂÃÂÃÂ®chir
      </button>
    </div>
  );
}

function AdminCouponsPanel({ adminKey }: { adminKey: string }) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent'|'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    if (!adminKey.trim()) return;
    try {
      const r = await fetch(`/api/admin/coupons?adminKey=${encodeURIComponent(adminKey.trim())}`);
      if (!r.ok) { setErr('ClÃÂÃÂÃÂÃÂ© admin invalide pour les coupons.'); setCoupons([]); return; }
      const d = await r.json();
      setCoupons(d.coupons || []); setErr('');
    } catch { setErr('Erreur rÃÂÃÂÃÂÃÂ©seau.'); }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [adminKey]);

  const handleCreate = async () => {
    setMsg(''); setErr('');
    if (!code.trim() || !discountValue.trim()) { setErr('Code et valeur requis.'); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/admin/coupons', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminKey: adminKey.trim(), code: code.trim(), discountType,
          discountValue: Number(discountValue),
          maxUses: maxUses.trim() ? Number(maxUses) : undefined,
          expiresAt: expiresAt || undefined,
          note: note.trim() || undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.error || 'Erreur.'); return; }
      setMsg(d.message || 'Code crÃÂÃÂÃÂÃÂ©ÃÂÃÂÃÂÃÂ©.');
      setCode(''); setDiscountValue(''); setMaxUses(''); setExpiresAt(''); setNote('');
      await refresh();
    } catch { setErr('Erreur rÃÂÃÂÃÂÃÂ©seau.'); }
    finally { setBusy(false); }
  };

  const handleDelete = async (c: string) => {
    if (!window.confirm(`Supprimer le code ${c} ?`)) return;
    await fetch(`/api/admin/coupons/${encodeURIComponent(c)}?adminKey=${encodeURIComponent(adminKey.trim())}`, { method: 'DELETE' });
    await refresh();
  };

  const handleToggle = async (c: string) => {
    await fetch(`/api/admin/coupons/${encodeURIComponent(c)}/toggle`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminKey: adminKey.trim() }),
    });
    await refresh();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #E5E7EB',
    fontSize: 14, outline: 'none', background: '#fff',
  };
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: '#374151', marginBottom: 4, display: 'block' };

  return (
    <div style={{ marginTop: 24, padding: 16, background: '#FFFBEB', borderRadius: 14, border: '1px solid #FDE68A' }}>
      <h3 style={{ fontSize: 14, fontWeight: 900, color: '#92400E', marginBottom: 4 }}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ Codes promo</h3>
      <p style={{ fontSize: 11, color: '#A16207', marginBottom: 14 }}>
        CrÃÂÃÂÃÂÃÂ©ez vos codes ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ vous dÃÂÃÂÃÂÃÂ©cidez ÃÂÃÂÃÂÃÂ  qui les envoyer.
      </p>

      <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Code (ex: BRIDGE1000)</label>
          <input style={inputStyle} value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="BRIDGE1000" />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Type</label>
            <select style={inputStyle} value={discountType} onChange={e => setDiscountType(e.target.value as any)}>
              <option value="percent">% Pourcentage</option>
              <option value="fixed">DH Fixe</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Valeur ({discountType === 'percent' ? '%' : 'DH'})</label>
            <input style={inputStyle} type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder={discountType === 'percent' ? '10' : '20'} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Max utilisations (vide = illimitÃÂÃÂÃÂÃÂ©)</label>
            <input style={inputStyle} type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="ex: 50" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Expire le (vide = jamais)</label>
            <input style={inputStyle} type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Note (privÃÂÃÂÃÂÃÂ©e)</label>
          <input style={inputStyle} value={note} onChange={e => setNote(e.target.value)} placeholder="ex: Pour Khalid - lancement" />
        </div>
        {err && <div style={errStyle}>{err}</div>}
        {msg && <div style={{ padding: '8px 12px', borderRadius: 10, background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#065F46', fontSize: 12, fontWeight: 700 }}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ {msg}</div>}
        <button onClick={handleCreate} disabled={busy}
          style={{ ...btn, background: '#92400E', opacity: busy ? 0.7 : 1, marginTop: 4 }}>
          {busy ? 'CrÃÂÃÂÃÂÃÂ©ation...' : 'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ CrÃÂÃÂÃÂÃÂ©er le code'}
        </button>
      </div>

      <h4 style={{ fontSize: 12, fontWeight: 900, color: '#92400E', marginTop: 18, marginBottom: 8, letterSpacing: '0.05em' }}>
        CODES EXISTANTS ({coupons.length})
      </h4>
      {coupons.length === 0 ? (
        <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', padding: 12 }}>Aucun code pour l'instant.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {coupons.map(c => (
            <div key={c.code} style={{ padding: 10, background: c.active ? '#fff' : '#F3F4F6', borderRadius: 10, border: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: c.active ? '#065F46' : '#9CA3AF' }}>{c.code}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#92400E', background: '#FEF3C7', padding: '2px 6px', borderRadius: 6 }}>
                      {c.discountType === 'percent' ? `-${c.discountValue}%` : `-${c.discountValue} DH`}
                    </span>
                    {!c.active && <span style={{ fontSize: 10, color: '#DC2626', fontWeight: 700 }}>DÃÂÃÂÃÂÃÂSACTIVÃÂÃÂÃÂÃÂ</span>}
                  </div>
                  <div style={{ fontSize: 10, color: '#6B7280', marginTop: 4 }}>
                    UtilisÃÂÃÂÃÂÃÂ© {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''} fois
                    {c.expiresAt ? ` ÃÂÃÂÃÂÃÂ· expire ${new Date(c.expiresAt).toLocaleDateString('fr-FR')}` : ''}
                  </div>
                  {c.note && <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2, fontStyle: 'italic' }}>{c.note}</div>}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => { navigator.clipboard.writeText(c.code); setMsg(`${c.code} copiÃÂÃÂÃÂÃÂ© !`); setTimeout(()=>setMsg(''), 2000); }}
                    style={{ padding: '6px 8px', background: '#1F2937', color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer' }}>
                    ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ
                  </button>
                  <button onClick={() => handleToggle(c.code)}
                    style={{ padding: '6px 8px', background: c.active ? '#6B7280' : '#10B981', color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer' }}>
                    {c.active ? 'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¸' : 'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¶'}
                  </button>
                  <button onClick={() => handleDelete(c.code)}
                    style={{ padding: '6px 8px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer' }}>
                    ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Missions / Pub page ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
// Pour brancher AdGate : remplace '' par l'URL offerwall de ton compte AdGate
const ADGATE_OFFERWALL_URL = '';

interface MissionData {
  id: number; type: string; title: string; description: string;
  rewardDiamonds: number; dailyLimit: number;
  durationSeconds?: number | null; externalUrl?: string | null;
  sortOrder: number; active: boolean;
}
interface MissionCompl { id: number; missionId: number; diamondsAwarded: number; }

type MLang = 'fr'|'en'|'ar'|'amz';
const MISSION_T = {
  fr: {
    title:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Gagner des diamants', sub:'Regarde des pubs, fais des missions',
    today:"AUJOURD'HUI", dailyCap:'Plafond journalier', of:'sur',
    capReached:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Plafond atteint ! Revenez demain.',
    authNudge:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Connecte-toi pour encaisser tes rÃÂÃÂÃÂÃÂ©compenses ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ',
    cats:{ video:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¬ PublicitÃÂÃÂÃÂÃÂ©s vidÃÂÃÂÃÂÃÂ©o', offerwall:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ± Jeux & Offres', social:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ£ RÃÂÃÂÃÂÃÂ©seaux sociaux', survey:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Sondages', fortune:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¡ Roue de la fortune' },
    topBadge:'ÃÂÃÂ¢ÃÂÃÂ­ÃÂÃÂ TOP', timesToday:(c:number,m:number)=>`${c}/${m} fois aujourd'hui`,
    adTitle:'PUBLICITÃÂÃÂÃÂÃÂ SPONSORISÃÂÃÂÃÂÃÂE', adWatching:'Visionnage de la publicitÃÂÃÂÃÂÃÂ© en coursÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦',
    fortuneRunning:'Roue de la fortune en coursÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦', waitSec:(s:number)=>`Patiente encore ${s}sÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦`,
    claim:(d:number)=>`ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ RÃÂÃÂÃÂÃÂ©clamer ${d.toLocaleString()} ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ`, cancel:'Annuler',
    socialOpened:"La page s'est ouverte dans un nouvel onglet. Effectue l'action puis confirme.",
    socialWait:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ³ Attends quelques secondesÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦',
    socialClaim:(d:number)=>`ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ C'est fait ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ RÃÂÃÂÃÂÃÂ©clamer ${d.toLocaleString()} ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ`,
    done:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Fait', offerwallTip:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¡ IntÃÂÃÂÃÂÃÂ©gration Lootably / Offertoro : renseigne',
    offerwallTip2:'dans main.tsx pour afficher l\'offerwall ici.',
    errLogin:'Connecte-toi pour gagner des ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ !', errLimit:'Limite journaliÃÂÃÂÃÂÃÂ¨re atteinte',
    errDone:'DÃÂÃÂÃÂÃÂ©jÃÂÃÂÃÂÃÂ  effectuÃÂÃÂÃÂÃÂ© !', errNet:'Erreur rÃÂÃÂÃÂÃÂ©seau', credited:(d:number,h:string)=>`+${d.toLocaleString()} ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ crÃÂÃÂÃÂÃÂ©ditÃÂÃÂÃÂÃÂ©s ! (${h})`,
  },
  en: {
    title:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Earn Diamonds', sub:'Watch ads, complete missions',
    today:'TODAY', dailyCap:'Daily cap', of:'/',
    capReached:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Daily cap reached! Come back tomorrow.',
    authNudge:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Sign in to claim your rewards ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ',
    cats:{ video:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¬ Video Ads', offerwall:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ± Games & Offers', social:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ£ Social Media', survey:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Surveys', fortune:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¡ Wheel of Fortune' },
    topBadge:'ÃÂÃÂ¢ÃÂÃÂ­ÃÂÃÂ TOP', timesToday:(c:number,m:number)=>`${c}/${m} today`,
    adTitle:'SPONSORED AD', adWatching:'Watching the adÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦',
    fortuneRunning:'Spinning the wheelÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦', waitSec:(s:number)=>`Wait ${s}s moreÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦`,
    claim:(d:number)=>`ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Claim ${d.toLocaleString()} ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ`, cancel:'Cancel',
    socialOpened:'The page opened in a new tab. Complete the action then confirm.',
    socialWait:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ³ Wait a few secondsÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦',
    socialClaim:(d:number)=>`ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Done ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Claim ${d.toLocaleString()} ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ`,
    done:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Done', offerwallTip:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¡ Lootably / Offertoro integration: set',
    offerwallTip2:'in main.tsx to show the offerwall here.',
    errLogin:'Sign in to earn ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ!', errLimit:'Daily limit reached',
    errDone:'Already done!', errNet:'Network error', credited:(d:number,h:string)=>`+${d.toLocaleString()} ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ credited! (${h})`,
  },
  ar: {
    title:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ¨ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂª', sub:'ÃÂÃÂÃÂÃÂ´ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¥ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂ² ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ',
    today:'ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ', dailyCap:'ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂ¯ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ', of:'ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ',
    capReached:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂª ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂ¯ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ! ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ¯ ÃÂÃÂÃÂÃÂºÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ.',
    authNudge:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ®ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ',
    cats:{ video:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¬ ÃÂÃÂÃÂÃÂ¥ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂª ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ', offerwall:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ± ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¨ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¶', social:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ£ ÃÂÃÂÃÂÃÂ´ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂª ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂ', survey:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ·ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂª', fortune:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¡ ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ© ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂ¸' },
    topBadge:'ÃÂÃÂ¢ÃÂÃÂ­ÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¶ÃÂÃÂÃÂÃÂ', timesToday:(c:number,m:number)=>`${c}/${m} ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ© ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ`,
    adTitle:'ÃÂÃÂÃÂÃÂ¥ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ', adWatching:'ÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ´ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ© ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¥ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦',
    fortuneRunning:'ÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦', waitSec:(s:number)=>`ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ¸ÃÂÃÂÃÂÃÂ± ${s}ÃÂÃÂÃÂÃÂ«ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦`,
    claim:(d:number)=>`ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ${d.toLocaleString()} ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ`, cancel:'ÃÂÃÂÃÂÃÂ¥ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂºÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¡',
    socialOpened:'ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂª ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂ© ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¨ ÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯. ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂ² ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¥ÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¡ ÃÂÃÂÃÂÃÂ«ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ£ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯.',
    socialWait:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ³ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ¸ÃÂÃÂÃÂÃÂ± ÃÂÃÂÃÂÃÂ«ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦',
    socialClaim:(d:number)=>`ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ${d.toLocaleString()} ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ`,
    done:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ', offerwallTip:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¡ ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ Lootably: ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ¶ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ·',
    offerwallTip2:'ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ main.tsx ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ¶ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¶ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§.',
    errLogin:'ÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂÃÂÃÂ®ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ¨ ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ!', errLimit:'ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂª ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ­ÃÂÃÂÃÂÃÂ¯ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ',
    errDone:'ÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ¥ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ²ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ!', errNet:'ÃÂÃÂÃÂÃÂ®ÃÂÃÂÃÂÃÂ·ÃÂÃÂÃÂÃÂ£ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ´ÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ©', credited:(d:number,h:string)=>`+${d.toLocaleString()} ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¶ÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ©! (${h})`,
  },
  amz: {
    title:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ· ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ', sub:'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¥ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ³ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂÃÂÃÂ· ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¼ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
    today:'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°', dailyCap:'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ', of:'/',
    capReached:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ° ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ! ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¹ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ.',
    authNudge:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ· ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ° ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ',
    cats:{ video:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¬ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ³ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ', offerwall:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ± ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ', social:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ£ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ', survey:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ', fortune:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¡ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¼ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¼ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°' },
    topBadge:'ÃÂÃÂ¢ÃÂÃÂ­ÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ', timesToday:(c:number,m:number)=>`${c}/${m} ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°`,
    adTitle:'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ', adWatching:'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¥ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦',
    fortuneRunning:'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¼ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¼ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ° ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ³ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¹ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦', waitSec:(s:number)=>`ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¹ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ${s}ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦`,
    claim:(d:number)=>`ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ${d.toLocaleString()} ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ`, cancel:'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
    socialOpened:'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ° ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ³ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ±ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¹ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ. ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ.',
    socialWait:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ³ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¹ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦',
    socialClaim:(d:number)=>`ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ${d.toLocaleString()} ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ`,
    done:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ', offerwallTip:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¡ Lootably: ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ¼ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
    offerwallTip2:'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ³ main.tsx ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ· ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ£ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ.',
    errLogin:'ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ· ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ° ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ!', errLimit:'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ° ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¡ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ',
    errDone:'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ!', errNet:'ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ½ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ¢ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ', credited:(d:number,h:string)=>`+${d.toLocaleString()} ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ·ÃÂÃÂ¢ÃÂÃÂ´ÃÂÃÂ°ÃÂÃÂ¢ÃÂÃÂµÃÂÃÂÃÂÃÂ¢ÃÂÃÂµÃÂÃÂ! (${h})`,
  },
};

function MissionsPage() {
  const [, navigate] = useLocation();
  const { getToken, isSignedIn } = useAuth();
  const lang: MLang = (() => {
    try { const r=localStorage.getItem('bridge_nav_state'); if(r){const p=JSON.parse(r); if(['fr','en','ar','amz'].includes(p.lang)) return p.lang as MLang;} } catch {}
    return 'fr';
  })();
  const t = MISSION_T[lang];
  const isAR = lang === 'ar';
  const [missions, setMissions] = useState<MissionData[]>([]);
  const [completions, setCompletions] = useState<MissionCompl[]>([]);
  const [todayDiamonds, setTodayDiamonds] = useState(0);
  const DAILY_CAP = 3000;

  // Ad overlay state
  const [adMission, setAdMission] = useState<MissionData | null>(null);
  const [adCountdown, setAdCountdown] = useState(0);
  const [adDone, setAdDone] = useState(false);
  const adTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Social confirm state
  const [socialMission, setSocialMission] = useState<MissionData | null>(null);
  const [socialReady, setSocialReady] = useState(false);
  const socialTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Toast
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const authHeaders = async (): Promise<Record<string, string>> => {
    const t = isSignedIn ? await getToken() : null;
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (t) h['Authorization'] = `Bearer ${t}`;
    return h;
  };

  const loadMissions = async () => {
    try {
      const h = await authHeaders();
      const r = await fetch('/api/missions', { headers: h });
      if (!r.ok) return;
      const d = await r.json();
      setMissions(d.missions ?? []);
      setCompletions(d.completions ?? []);
      setTodayDiamonds(d.todayDiamonds ?? 0);
    } catch {}
  };

  useEffect(() => { loadMissions(); }, []); // eslint-disable-line

  // Count today completions for a given mission
  const todayCount = (missionId: number) =>
    completions.filter(c => c.missionId === missionId).length;

  const complete = async (mission: MissionData) => {
    if (!isSignedIn) { showToast(t.errLogin, false); return; }
    try {
      const h = await authHeaders();
      const r = await fetch(`/api/missions/${mission.id}/complete`, { method: 'POST', headers: h });
      const d = await r.json();
      if (!r.ok) { showToast(d.error || 'Erreur', false); return; }
      setTodayDiamonds(d.todayDiamonds);
      setCompletions(prev => [...prev, { id: Date.now(), missionId: mission.id, diamondsAwarded: d.awarded }]);
      const dhVal = mission.type === 'offerwall' ? '~15 DH' : `${(d.awarded / 200).toFixed(1)} DH`;
      showToast(t.credited(d.awarded, dhVal), true);
    } catch { showToast(t.errNet, false); }
  };

  // ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Video / Fortune mission flow ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
  const startAd = (mission: MissionData) => {
    if (!isSignedIn) { showToast(t.errLogin, false); return; }
    const cnt = todayCount(mission.id);
    if (mission.dailyLimit !== -1 && cnt >= mission.dailyLimit) { showToast(t.errLimit, false); return; }
    const dur = mission.durationSeconds ?? 30;
    setAdMission(mission); setAdCountdown(dur); setAdDone(false);
    if (adTimerRef.current) clearInterval(adTimerRef.current);
    adTimerRef.current = setInterval(() => {
      setAdCountdown(prev => {
        if (prev <= 1) { clearInterval(adTimerRef.current!); setAdDone(true); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const claimAd = async () => {
    if (!adMission) return;
    const m = adMission; setAdMission(null); setAdDone(false);
    await complete(m);
  };

  // ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Social mission flow ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
  const startSocial = (mission: MissionData) => {
    if (!isSignedIn) { showToast(t.errLogin, false); return; }
    const cnt = todayCount(mission.id);
    if (mission.dailyLimit !== -1 && cnt >= mission.dailyLimit) { showToast(t.errDone, false); return; }
    if (mission.externalUrl) window.open(mission.externalUrl, '_blank');
    setSocialMission(mission); setSocialReady(false);
    if (socialTimerRef.current) clearTimeout(socialTimerRef.current);
    socialTimerRef.current = setTimeout(() => setSocialReady(true), 5000);
  };

  const claimSocial = async () => {
    if (!socialMission) return;
    const m = socialMission; setSocialMission(null);
    await complete(m);
  };

  const dhLabel = (d: number, type: string) => type === 'offerwall' ? '~15 DH' : `${(d / 200).toFixed(2).replace(/\.?0+$/, '')} DH`;
  const pct = Math.min(100, Math.round((todayDiamonds / DAILY_CAP) * 100));
  const isTop = (m: MissionData) => m.rewardDiamonds >= 1000;

  // Sort missions: highest reward first, then group visually
  const sortedMissions = [...missions].sort((a, b) => b.rewardDiamonds - a.rewardDiamonds);
  const grouped: Record<string, MissionData[]> = { offerwall: [], survey: [], video: [], social: [], fortune: [] };
  for (const m of sortedMissions) { if (grouped[m.type] !== undefined) grouped[m.type].push(m); }

  const S = {
    page: { minHeight: '100dvh', background: '#0f172a', color: '#fff', fontFamily: 'inherit', paddingBottom: 80, direction: isAR ? 'rtl' : 'ltr' } as React.CSSProperties,
    header: { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' } as React.CSSProperties,
    back: { background: 'rgba(255,255,255,0.07)', border: 'none', color: '#94a3b8', borderRadius: 12, width: 38, height: 38, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as React.CSSProperties,
    card: (top: boolean) => ({ background: top ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.04)', border: `1px solid ${top ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10, cursor: 'pointer', transition: 'background 0.15s', position: 'relative' as const, overflow: 'hidden' as const }),
    pill: (done: boolean) => ({ background: done ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)', color: done ? '#10b981' : '#60a5fa', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' as const }),
  };

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <button style={S.back} onClick={() => navigate('/')}>{isAR ? 'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ' : 'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ'}</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: '0.02em' }}>{t.title}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{t.sub}</div>
        </div>
        <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: '6px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#10b981' }}>{todayDiamonds.toLocaleString()} ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ</div>
          <div style={{ fontSize: 9, color: '#64748b', letterSpacing: '0.06em' }}>{t.today}</div>
        </div>
      </div>

      {/* Daily progress */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, color: '#94a3b8' }}>
          <span>{t.dailyCap}</span>
          <span style={{ fontWeight: 800, color: pct >= 100 ? '#10b981' : '#f59e0b' }}>
            {todayDiamonds.toLocaleString()} {t.of} {DAILY_CAP.toLocaleString()} ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ
          </span>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
          <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: pct >= 100 ? '#10b981' : 'linear-gradient(90deg,#3b82f6,#8b5cf6)', transition: 'width 0.5s' }} />
        </div>
        {pct >= 100 && <div style={{ fontSize: 11, color: '#10b981', fontWeight: 800, marginTop: 6, textAlign: 'center' }}>{t.capReached}</div>}
      </div>

      {/* Auth nudge */}
      {!isSignedIn && (
        <div onClick={() => navigate('/sign-in')} style={{ margin: '12px 16px 0', padding: '12px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 14, fontSize: 12, color: '#fbbf24', fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}>
          {t.authNudge}
        </div>
      )}

      <div style={{ padding: '16px 16px 0' }}>
        {(['offerwall','survey','video','social','fortune'] as const).map(cat => {
          const items = grouped[cat] ?? [];
          if (!items.length && cat !== 'offerwall') return null;
          return (
            <div key={cat} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>{t.cats[cat]}</div>

              {/* Offerwall iframe embed */}
              {cat === 'offerwall' && ADGATE_OFFERWALL_URL && (
                <div style={{ marginBottom: 12, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <iframe src={ADGATE_OFFERWALL_URL} style={{ width: '100%', height: 520, border: 'none', display: 'block' }} title="Offres partenaires" />
                </div>
              )}
              {cat === 'offerwall' && !ADGATE_OFFERWALL_URL && (
                <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px dashed rgba(139,92,246,0.3)', borderRadius: 14, padding: '12px 14px', marginBottom: 12, fontSize: 11, color: '#a78bfa', lineHeight: 1.7 }}>
                  {t.offerwallTip} <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4 }}>ADGATE_OFFERWALL_URL</code> {t.offerwallTip2}
                </div>
              )}

              {items.map(mission => {
                const cnt = todayCount(mission.id);
                const maxed = mission.dailyLimit !== -1 && cnt >= mission.dailyLimit;
                const top = isTop(mission) && !maxed;
                const isVideo = mission.type === 'video' || mission.type === 'fortune';
                const isSocial = mission.type === 'social' || mission.type === 'survey';
                return (
                  <div key={mission.id} style={{ ...S.card(top), opacity: maxed ? 0.45 : 1 }}
                    onClick={() => { if (maxed) return; if (isVideo) startAd(mission); else if (isSocial) startSocial(mission); else complete(mission); }}>
                    {/* TOP badge stripe */}
                    {top && <div style={{ position: 'absolute', top: 0, left: isAR ? undefined : 0, right: isAR ? 0 : undefined, background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', color: '#78350f', fontSize: 8, fontWeight: 900, padding: '2px 8px', borderRadius: isAR ? '0 14px 0 8px' : '14px 0 8px 0', letterSpacing: '0.1em' }}>{t.topBadge}</div>}
                    <div style={{ flex: 1, paddingTop: top ? 6 : 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 3 }}>{mission.title}</div>
                      <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{mission.description}</div>
                      {mission.dailyLimit > 1 && <div style={{ fontSize: 10, color: '#475569', marginTop: 3 }}>{t.timesToday(cnt, mission.dailyLimit)}</div>}
                    </div>
                    <div style={{ textAlign: isAR ? 'left' : 'right', flexShrink: 0 }}>
                      <div style={S.pill(maxed)}>
                        {maxed ? t.done : `+${mission.rewardDiamonds >= 1000 ? (mission.rewardDiamonds/1000).toFixed(0)+'K' : mission.rewardDiamonds} ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ`}
                      </div>
                      {!maxed && <div style={{ fontSize: 10, color: top ? '#f59e0b' : '#475569', marginTop: 3, fontWeight: top ? 800 : 400 }}>{dhLabel(mission.rewardDiamonds, mission.type)}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Video / Fortune ad overlay */}
      {adMission && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ width: '100%', maxWidth: 360, background: 'linear-gradient(135deg,#1e293b,#0f172a)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ background: '#1e293b', padding: '10px 14px', fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: '0.1em', display: 'flex', justifyContent: 'space-between' }}>
              <span>{t.adTitle}</span>
              {!adDone && <span style={{ color: '#f59e0b' }}>{adCountdown}s</span>}
            </div>
            <div style={{ height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 }}>
              <div style={{ fontSize: 48 }}>{adMission.type === 'fortune' ? 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¡' : 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¬'}</div>
              <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 1.5 }}>
                {adMission.type === 'fortune' ? t.fortuneRunning : t.adWatching}
              </div>
              {!adDone && (
                <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
                  <div style={{ height: '100%', borderRadius: 99, background: '#3b82f6', width: `${((adMission.durationSeconds! - adCountdown) / adMission.durationSeconds!) * 100}%`, transition: 'width 1s linear' }} />
                </div>
              )}
            </div>
            <div style={{ padding: '10px 14px 16px' }}>
              {adDone ? (
                <button onClick={claimAd} style={{ width: '100%', padding: '15px 0', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff', fontSize: 15, fontWeight: 900, letterSpacing: '0.02em', boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}>
                  {t.claim(adMission.rewardDiamonds)}
                </button>
              ) : (
                <div style={{ textAlign: 'center', color: '#475569', fontSize: 12, fontWeight: 700 }}>{t.waitSec(adCountdown)}</div>
              )}
            </div>
          </div>
          <button onClick={() => { if (adTimerRef.current) clearInterval(adTimerRef.current); setAdMission(null); }} style={{ background: 'none', border: 'none', color: '#475569', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>
            {t.cancel}
          </button>
        </div>
      )}

      {/* Social confirm overlay */}
      {socialMission && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ width: '100%', maxWidth: 340, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '28px 24px', textAlign: 'center', direction: isAR ? 'rtl' : 'ltr' }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>{socialMission.title.split(' ')[0]}</div>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 8 }}>{socialMission.title}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20, lineHeight: 1.5 }}>
              {socialMission.externalUrl ? t.socialOpened : socialMission.description}
            </div>
            {socialReady ? (
              <button onClick={claimSocial} style={{ width: '100%', padding: '15px 0', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff', fontSize: 14, fontWeight: 900, boxShadow: '0 0 20px rgba(16,185,129,0.35)' }}>
                {t.socialClaim(socialMission.rewardDiamonds)}
              </button>
            ) : (
              <div style={{ padding: '12px 0', color: '#f59e0b', fontSize: 12, fontWeight: 700 }}>{t.socialWait}</div>
            )}
            <button onClick={() => { if (socialTimerRef.current) clearTimeout(socialTimerRef.current); setSocialMission(null); }} style={{ marginTop: 14, background: 'none', border: 'none', color: '#475569', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: toast.ok ? '#059669' : '#dc2626', color: '#fff', padding: '10px 20px', borderRadius: 20, fontSize: 13, fontWeight: 800, zIndex: 300, whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', maxWidth: '90vw', textAlign: 'center' }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function AdminAuthPage() {
  const [email, setEmail] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const callApi = async (path: string) => {
    setLoading(true); setError(''); setLink(''); setSuccess('');
    try {
      const r = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), adminKey: adminKey.trim() }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || 'Erreur.'); return null; }
      return data;
    } catch { setError('Erreur rÃÂÃÂÃÂÃÂ©seau.'); return null; }
    finally { setLoading(false); }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await callApi('/api/admin/sign-in-link');
    if (data?.url) setLink(data.url);
  };

  const handleBan = async () => {
    if (!email.trim() || !adminKey.trim()) { setError('Email et clÃÂÃÂÃÂÃÂ© admin requis.'); return; }
    if (!window.confirm(`Bannir dÃÂÃÂÃÂÃÂ©finitivement ${email} ? Il ne pourra plus se connecter ni se rÃÂÃÂÃÂÃÂ©inscrire.`)) return;
    const data = await callApi('/api/admin/ban-user');
    if (data?.ok) setSuccess(data.message || 'Utilisateur banni.');
  };

  const handleUnban = async () => {
    if (!email.trim() || !adminKey.trim()) { setError('Email et clÃÂÃÂÃÂÃÂ© admin requis.'); return; }
    const data = await callApi('/api/admin/unban-user');
    if (data?.ok) setSuccess(data.message || 'Utilisateur dÃÂÃÂÃÂÃÂ©banni.');
  };

  const handleDelete = async () => {
    if (!email.trim() || !adminKey.trim()) { setError('Email et clÃÂÃÂÃÂÃÂ© admin requis.'); return; }
    if (!window.confirm(`Supprimer le compte de ${email} ? Il pourra se rÃÂÃÂÃÂÃÂ©inscrire avec le mÃÂÃÂÃÂÃÂªme email.`)) return;
    const data = await callApi('/api/admin/delete-user');
    if (data?.ok) setSuccess(data.message || 'Compte supprimÃÂÃÂÃÂÃÂ©.');
  };

  return (
    <AuthPageWrapper>
      <AuthCardHeader
        title="ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ AccÃÂÃÂÃÂÃÂ¨s Admin"
        sub="GÃÂÃÂÃÂÃÂ©nÃÂÃÂÃÂÃÂ©rez un lien de connexion direct pour un utilisateur"
      />
      <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <FocusInput label="Email de l'utilisateur" value={email} onChange={setEmail}
          placeholder="user@exemple.com" type="email" autoComplete="off" />
        <FocusInput label="ClÃÂÃÂÃÂÃÂ© admin (code chauffeur)" value={adminKey} onChange={setAdminKey}
          placeholder="BRIDGE-DRIVER-2025" type="password" autoComplete="off" />
        {error && <div style={errStyle}>{error}</div>}
        {success && (
          <div style={{ padding: '10px 12px', borderRadius: 10, background: '#F0FDF4',
            border: '1px solid #BBF7D0', color: '#065F46', fontSize: 13, fontWeight: 700 }}>
            ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ {success}
          </div>
        )}
        <button type="submit" style={{ ...btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
          {loading ? 'Patientez...' : 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ GÃÂÃÂÃÂÃÂ©nÃÂÃÂÃÂÃÂ©rer un lien de connexion'}
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={handleBan} disabled={loading}
            style={{ ...btn, flex: 1, background: '#DC2626', opacity: loading ? 0.7 : 1 }}>
            ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ« Bannir
          </button>
          <button type="button" onClick={handleUnban} disabled={loading}
            style={{ ...btn, flex: 1, background: '#6B7280', opacity: loading ? 0.7 : 1 }}>
            ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ©ÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ DÃÂÃÂÃÂÃÂ©bannir
          </button>
        </div>
        <button type="button" onClick={handleDelete} disabled={loading}
          style={{ ...btn, background: '#7C2D12', opacity: loading ? 0.7 : 1 }}>
          ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ Supprimer le compte (peut se rÃÂÃÂÃÂÃÂ©inscrire)
        </button>
        <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 4, lineHeight: 1.5 }}>
          <b>Bannir</b> = bloquÃÂÃÂÃÂÃÂ© pour toujours.<br/>
          <b>Supprimer</b> = effacÃÂÃÂÃÂÃÂ©, peut se rÃÂÃÂÃÂÃÂ©inscrire.
        </p>
      </form>
      {link && (
        <div style={{ marginTop: 20, padding: 16, background: '#F0FDF4', borderRadius: 12, border: '1px solid #BBF7D0' }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#065F46', marginBottom: 8, letterSpacing: '0.08em' }}>
            ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ LIEN VALABLE 1 HEURE
          </p>
          <p style={{ fontSize: 11, color: '#374151', wordBreak: 'break-all', marginBottom: 12, lineHeight: 1.5 }}>
            {link}
          </p>
          <button
            onClick={() => { navigator.clipboard.writeText(link); }}
            style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: '#065F46', color: '#fff', fontSize: 13, fontWeight: 800 }}>
            ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Copier le lien
          </button>
          <p style={{ fontSize: 10, color: '#9CA3AF', marginTop: 8, textAlign: 'center' }}>
            Envoyez ce lien ÃÂÃÂÃÂÃÂ  l'utilisateur via WhatsApp ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ il se connectera automatiquement
          </p>
        </div>
      )}
      <AdminStatsPanel adminKey={adminKey} />
      <AdminCouponsPanel adminKey={adminKey} />
      <PWAInstallBannerSimple appName="Bridge Manager" />
    </AuthPageWrapper>
  );
}

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ FLOATING WHATSAPP BUTTON ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ

function FloatingWAButton() {
  const [location] = useLocation();
  if (location === '/assistant') return null;
  const msg = encodeURIComponent('Bonjour Bridge Safi, j\'ai besoin d\'aide ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ');
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
        textDecoration:'none',
        transition:'transform 0.15s',
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

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ FLOATING AI ASSISTANT WIDGET ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ

function FloatingAssistantWidget() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [lang, setLang] = useState<AssistLang>(() => {
    try { const r = localStorage.getItem('bridge_nav_state'); if(r){const p=JSON.parse(r);if(ASSIST_LANGS.includes(p.lang)) return p.lang as AssistLang;} } catch{}
    return 'fr';
  });
  const t = ASSISTANT_T[lang];
  const isAR = lang === 'ar';

  const [messages, setMessages] = useState<AssistMsg[]>(() => {
    try {
      const saved = localStorage.getItem(ASSIST_CHAT_KEY);
      if (saved) { const parsed = JSON.parse(saved) as AssistMsg[]; if (Array.isArray(parsed) && parsed.length > 0) return parsed; }
    } catch {}
    return [{ role: 'assistant', content: ASSISTANT_T['fr'].greeting }];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const BRIDGE_WA_NUMBER = '+212764794856';

  useEffect(() => {
    try { localStorage.setItem(ASSIST_CHAT_KEY, JSON.stringify(messages)); } catch {}
  }, [messages]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); inputRef.current?.focus(); }, 80);
    }
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const clearConversation = () => {
    const fresh = [{ role: 'assistant' as const, content: ASSISTANT_T[lang].greeting }];
    setMessages(fresh);
    setEscalated(false);
    try { localStorage.setItem(ASSIST_CHAT_KEY, JSON.stringify(fresh)); } catch {}
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: AssistMsg = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/assistant/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, lang }),
      });
      const data = await res.json() as { reply: string; isEscalation: boolean };
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      if (data.isEscalation) setEscalated(true);
      if (!open) setUnread(u => u + 1);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ Service temporairement indisponible.' }]);
    } finally { setLoading(false); }
  };

  // Hide on the full assistant page to avoid duplication
  if (location === '/assistant') return null;

  const hasMessages = messages.length > 1;

  return (
    <>
      <style>{`
        @keyframes slideUpWidget{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes wDot{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
        .w-bubble:hover{transform:scale(1.1)!important}
      `}</style>

      {/* Floating bubble ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ sits above WhatsApp button */}
      <button className="w-bubble" onClick={() => setOpen(o => !o)}
        style={{position:'fixed',bottom:144,right:16,zIndex:61,width:46,height:46,borderRadius:'50%',
          background:'linear-gradient(135deg,#4f46e5,#7c3aed)',
          boxShadow:`0 4px 18px rgba(79,70,229,${open?0.25:0.55})`,
          border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
          transition:'transform 0.15s,box-shadow 0.15s',}}>
        {open
          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          : <svg width="21" height="21" viewBox="0 0 24 24" fill="white"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>}
        {unread > 0 && !open && (
          <span style={{position:'absolute',top:-4,right:-4,background:'#ef4444',color:'#fff',
            borderRadius:'50%',width:18,height:18,fontSize:10,fontWeight:900,
            display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid #fff'}}>
            {unread}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div dir={isAR?'rtl':'ltr'} style={{
          position:'fixed',bottom:0,left:0,right:0,zIndex:60,height:'72dvh',
          background:'linear-gradient(160deg,#030712 0%,#0f172a 55%,#1e1b4b 100%)',
          borderTopLeftRadius:24,borderTopRightRadius:24,
          boxShadow:'0 -8px 48px rgba(0,0,0,0.65)',
          display:'flex',flexDirection:'column',
          animation:'slideUpWidget 0.28s cubic-bezier(0.34,1.2,0.64,1)',
        }}>

          {/* Header */}
          <div style={{padding:'13px 14px 11px',borderBottom:'1px solid rgba(99,102,241,0.2)',
            display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:34,height:34,borderRadius:'50%',
                background:'linear-gradient(135deg,#4f46e5,#7c3aed)',
                display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="white"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
              </div>
              <div>
                <p style={{color:'#fff',fontSize:13,fontWeight:900,margin:0}}>{t.title}</p>
                <div style={{display:'flex',alignItems:'center',gap:5}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:'#4ADE80',boxShadow:'0 0 6px #4ADE80'}}/>
                  <p style={{color:'rgba(255,255,255,0.4)',fontSize:10,margin:0}}>{t.subtitle}</p>
                </div>
              </div>
            </div>
            <div style={{display:'flex',gap:6}}>
              {hasMessages && (
                <button onClick={clearConversation}
                  style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',
                    color:'#f87171',borderRadius:10,padding:'5px 8px',fontSize:13,cursor:'pointer'}}>
                  ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ
                </button>
              )}
              <button onClick={()=>setLang(l=>{const i=ASSIST_LANGS.indexOf(l);return ASSIST_LANGS[(i+1)%ASSIST_LANGS.length];})}
                style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',
                  color:'#94a3b8',borderRadius:10,padding:'5px 9px',fontSize:11,fontWeight:700,cursor:'pointer'}}>
                {ASSIST_LANG_LABELS[lang]}
              </button>
              <button onClick={()=>setOpen(false)}
                style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',
                  color:'#94a3b8',borderRadius:10,padding:'5px 9px',fontSize:11,fontWeight:700,cursor:'pointer'}}>
                ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{flex:1,overflowY:'auto',padding:'12px 14px'}}>
            {messages.length <= 1 && (
              <div style={{marginBottom:12}}>
                <p style={{color:'rgba(255,255,255,0.35)',fontSize:10,fontWeight:700,letterSpacing:2,
                  textTransform:'uppercase',textAlign:'center',marginBottom:8}}>{t.quickTitle}</p>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                  {[t.q1,t.q2,t.q3,t.q4].map((q,i)=>(
                    <button key={i} onClick={()=>sendMessage(q)}
                      style={{background:'rgba(99,102,241,0.12)',border:'1px solid rgba(99,102,241,0.3)',
                        color:'rgba(255,255,255,0.8)',borderRadius:12,padding:'10px 8px',
                        fontSize:11,fontWeight:600,cursor:'pointer',textAlign:'center',lineHeight:1.3}}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg,idx)=>(
              <div key={idx} style={{display:'flex',justifyContent:msg.role==='user'?'flex-end':'flex-start',marginBottom:9}}>
                {msg.role==='assistant'&&(
                  <div style={{width:24,height:24,borderRadius:'50%',
                    background:'linear-gradient(135deg,#4f46e5,#7c3aed)',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    flexShrink:0,marginRight:7,marginTop:3,fontSize:11}}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦</div>
                )}
                <div style={{maxWidth:'78%',padding:'8px 12px',
                  borderRadius:msg.role==='user'?'16px 16px 3px 16px':'3px 16px 16px 16px',
                  background:msg.role==='user'
                    ?'linear-gradient(135deg,#4f46e5,#6d28d9)'
                    :'rgba(255,255,255,0.07)',
                  border:msg.role==='assistant'?'1px solid rgba(255,255,255,0.08)':'none',
                  color:'#f1f5f9',fontSize:13,lineHeight:1.5,whiteSpace:'pre-wrap'}}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading&&(
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:9}}>
                <div style={{width:24,height:24,borderRadius:'50%',background:'linear-gradient(135deg,#4f46e5,#7c3aed)',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:11}}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¦</div>
                <div style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.08)',
                  borderRadius:'3px 16px 16px 16px',padding:'9px 14px',display:'flex',gap:4}}>
                  {[0,1,2].map(i=>(
                    <div key={i} style={{width:6,height:6,borderRadius:'50%',background:'#6366f1',
                      animation:`wDot 1.2s ${i*0.2}s infinite`}}/>
                  ))}
                </div>
              </div>
            )}

            {escalated&&(
              <div style={{background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.3)',
                borderRadius:14,padding:'10px 14px',marginBottom:10,textAlign:'center'}}>
                <p style={{color:'#a5b4fc',fontSize:12,fontWeight:700,margin:'0 0 8px'}}>{t.escalated}</p>
                <a href={`https://wa.me/${BRIDGE_WA_NUMBER.replace('+','')}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{display:'inline-block',background:'#25D366',color:'#fff',
                    borderRadius:10,padding:'7px 14px',fontSize:12,fontWeight:700,textDecoration:'none'}}>
                  {t.wa}
                </a>
              </div>
            )}

            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div style={{padding:'10px 14px 22px',borderTop:'1px solid rgba(255,255,255,0.07)',
            flexShrink:0,display:'flex',gap:8}}>
            <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage(input);}}}
              placeholder={t.placeholder} disabled={loading} dir={isAR?'rtl':'ltr'}
              style={{flex:1,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(99,102,241,0.3)',
                borderRadius:14,padding:'10px 14px',color:'#f1f5f9',fontSize:13,
                outline:'none',fontFamily:'inherit'}}/>
            <button onClick={()=>sendMessage(input)} disabled={loading||!input.trim()}
              style={{background:'linear-gradient(135deg,#4f46e5,#7c3aed)',color:'#fff',border:'none',
                borderRadius:14,padding:'10px 14px',fontSize:13,fontWeight:700,
                cursor:loading||!input.trim()?'not-allowed':'pointer',
                opacity:loading||!input.trim()?0.5:1}}>
              {t.send}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Leaderboard Page ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ classement synchronisÃÂÃÂÃÂÃÂ© avec le Manager ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
interface ManagerPlayer { id:number; pseudo:string; phone:string; diamonds:number; score:number; gamesPlayed:number; menuCost:number; missing:number; amountMAD:number; }

function LeaderboardPage() {
  const [, navigate] = useLocation();
  const { user } = useUser();
  const [players, setPlayers] = React.useState<ManagerPlayer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [userPhone, setUserPhone] = React.useState<string>('');
  const { getToken } = useAuth();

  React.useEffect(() => {
    fetch('/api/manager/leaderboard')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.players) setPlayers(data.players); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    if (!user) return;
    getToken().then(token => {
      const h: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      return fetch('/api/profile', { credentials: 'include', headers: h });
    }).then(r => r?.ok ? r.json() : null).then(data => {
      if (data?.phone) setUserPhone(data.phone);
    }).catch(() => {});
  }, [user]);

  const GAME_TARGET = 60000;
  const myPlayer = players.find(p => p.phone === userPhone);
  const myRank = myPlayer ? players.findIndex(p => p.phone === userPhone) + 1 : null;

  const medalEmoji = (i: number) => i === 0 ? 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂ¥ÃÂÃÂ' : i === 1 ? 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂ¥ÃÂÃÂ' : i === 2 ? 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂ¥ÃÂÃÂ' : `${i + 1}.`;
  const progressPct = (d: number) => Math.min(100, Math.round((d / GAME_TARGET) * 100));

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(180deg,#04110A 0%,#071C11 60%,#050F08 100%)',color:'white'}}>
      {/* Header */}
      <div style={{background:'rgba(0,0,0,0.4)',backdropFilter:'blur(12px)',padding:'14px 20px',display:'flex',alignItems:'center',gap:12,borderBottom:'1px solid rgba(74,222,128,0.15)',position:'sticky',top:0,zIndex:10}}>
        <button onClick={()=>navigate('/game')} style={{background:'none',border:'none',color:'#4ADE80',fontSize:20,cursor:'pointer',padding:'4px',lineHeight:1}}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ</button>
        <div>
          <div style={{fontSize:'17px',fontWeight:900,letterSpacing:'0.05em'}}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Classement Safi Runner</div>
          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',marginTop:'1px'}}>SynchronisÃÂÃÂÃÂÃÂ© avec le Manager ÃÂÃÂÃÂÃÂ· Objectif : {GAME_TARGET.toLocaleString()} ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ</div>
        </div>
      </div>

      {/* My rank card */}
      {myPlayer && (
        <div style={{margin:'16px 16px 0',background:'linear-gradient(135deg,rgba(74,222,128,0.12),rgba(5,150,105,0.08))',border:'1px solid rgba(74,222,128,0.3)',borderRadius:'16px',padding:'14px 16px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div>
              <div style={{fontSize:12,color:'#4ADE80',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em'}}>Ma position</div>
              <div style={{fontSize:24,fontWeight:900,marginTop:2}}>#{myRank} {myPlayer.pseudo}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:22,fontWeight:900,color:'#4ADE80'}}>{(myPlayer.diamonds||0).toLocaleString()} ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginTop:2}}>{progressPct(myPlayer.diamonds||0)}% de l'objectif</div>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{background:'rgba(255,255,255,0.1)',borderRadius:'999px',height:8,overflow:'hidden'}}>
            <div style={{height:'100%',borderRadius:'999px',background:'linear-gradient(90deg,#059669,#4ADE80)',width:`${progressPct(myPlayer.diamonds||0)}%`,transition:'width 0.5s ease'}}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:11,color:'rgba(255,255,255,0.4)'}}>
            <span>{(myPlayer.diamonds||0).toLocaleString()} ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ gagnÃÂÃÂÃÂÃÂ©s</span>
            <span>{((myPlayer.missing||0)).toLocaleString()} ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ manquants</span>
          </div>
          {(myPlayer.missing||0) > 0 && (
            <div style={{marginTop:8,padding:'8px 10px',background:'rgba(239,68,68,0.12)',borderRadius:'8px',border:'1px solid rgba(239,68,68,0.2)',fontSize:12,color:'#FCA5A5'}}>
              ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂÃÂ¯ÃÂÃÂ¸ÃÂÃÂ Il manque {(myPlayer.missing||0).toLocaleString()} ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ pÃÂÃÂÃÂÃÂ©nalitÃÂÃÂÃÂÃÂ© estimÃÂÃÂÃÂÃÂ©e : <strong>{myPlayer.amountMAD} DH</strong>
            </div>
          )}
          {(myPlayer.missing||0) <= 0 && (
            <div style={{marginTop:8,padding:'8px 10px',background:'rgba(74,222,128,0.1)',borderRadius:'8px',border:'1px solid rgba(74,222,128,0.2)',fontSize:12,color:'#4ADE80'}}>
              ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Objectif atteint ! Prochaine livraison <strong>GRATUITE</strong> ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ
            </div>
          )}
        </div>
      )}

      {/* Rules reminder */}
      <div style={{margin:'12px 16px 0',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'12px',padding:'10px 14px',fontSize:12,color:'rgba(255,255,255,0.5)',lineHeight:1.6}}>
        ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ <strong style={{color:'rgba(255,255,255,0.7)'}}>RÃÂÃÂÃÂÃÂ¨gles :</strong> 3 jours ÃÂÃÂÃÂÃÂ 2h/jour ÃÂÃÂÃÂÃÂ· 6 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ par heure ÃÂÃÂÃÂÃÂ· Objectif : 60 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ· Manque 10 000 ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ = 5 DH de pÃÂÃÂÃÂÃÂ©nalitÃÂÃÂÃÂÃÂ©
      </div>

      {/* Player list */}
      <div style={{padding:'12px 16px 40px'}}>
        {loading && (
          <div style={{textAlign:'center',padding:'60px 20px',color:'rgba(255,255,255,0.35)'}}>
            <div style={{width:36,height:36,border:'3px solid rgba(74,222,128,0.2)',borderTop:'3px solid #4ADE80',borderRadius:'50%',animation:'spin 0.9s linear infinite',margin:'0 auto 12px'}}/>
            <p style={{fontSize:13}}>Chargement du classement...</p>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
          </div>
        )}
        {!loading && players.length === 0 && (
          <div style={{textAlign:'center',padding:'60px 20px',color:'rgba(255,255,255,0.35)'}}>
            <div style={{fontSize:48,marginBottom:12}}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ</div>
            <p>Aucun joueur enregistrÃÂÃÂÃÂÃÂ©</p>
          </div>
        )}
        {!loading && players.map((p, i) => {
          const isMe = p.phone === userPhone;
          const pct = progressPct(p.diamonds || 0);
          return (
            <div key={p.id} style={{background:isMe?'rgba(74,222,128,0.08)':'rgba(255,255,255,0.03)',border:`1px solid ${isMe?'rgba(74,222,128,0.3)':'rgba(255,255,255,0.06)'}`,borderRadius:'14px',padding:'12px 14px',marginBottom:'8px'}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                <span style={{fontSize:18,minWidth:28,fontWeight:900,color:i<3?['#FFD700','#C0C0C0','#CD7F32'][i]:'rgba(255,255,255,0.4)'}}>{medalEmoji(i)}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14,display:'flex',alignItems:'center',gap:6}}>
                    {p.pseudo || p.phone}
                    {isMe && <span style={{fontSize:10,background:'#059669',color:'#fff',padding:'1px 6px',borderRadius:'999px',fontWeight:700}}>Moi</span>}
                  </div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:1}}>{p.gamesPlayed} parties jouÃÂÃÂÃÂÃÂ©es</div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{fontWeight:900,fontSize:15,color:pct>=100?'#4ADE80':'white'}}>{(p.diamonds||0).toLocaleString()} ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ</div>
                  <div style={{fontSize:10,color:pct>=100?'#4ADE80':p.missing>0?'#FCA5A5':'rgba(255,255,255,0.4)',marginTop:1}}>
                    {pct>=100 ? 'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Objectif atteint' : `ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ${(p.missing||0).toLocaleString()} ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ`}
                  </div>
                </div>
              </div>
              <div style={{background:'rgba(255,255,255,0.08)',borderRadius:'999px',height:5,overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:'999px',background:pct>=100?'#4ADE80':'linear-gradient(90deg,#059669,#4ADE80)',width:`${pct}%`,transition:'width 0.5s ease'}}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Store Owner Page (Tabac / Pharmacie / Fleurs) ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
type StoreType = 'tabac' | 'pharmacie' | 'fleurs';
interface StoreOrder {
  id: number; ref: string; customerName: string; customerPhone: string;
  customerAddress: string; items: Array<{name:string;qty:number;price:number}>;
  total: number; status: string; deliveryMode: string; paymentMethod: string; createdAt: string;
}
const STORE_INFO: Record<StoreType, {name:string;emoji:string;accent:string}> = {
  tabac:     { name:'Bridge Tabac',     emoji:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¬', accent:'#e94560' },
  pharmacie: { name:'Bridge Pharmacie', emoji:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ', accent:'#8B5CF6' },
  fleurs:    { name:'Bridge Fleurs',    emoji:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¸', accent:'#EC4899' },
};
function StoreOwnerPage({ params }: { params?: { type?: string } }) {
  const storeType = (params?.type || '') as StoreType;
  const info = STORE_INFO[storeType];
  const [code, setCode] = React.useState('');
  const [authed, setAuthed] = React.useState(() => {
    try { return localStorage.getItem(`bridge_store_auth_${storeType}`) === 'ok'; } catch { return false; }
  });
  const [authErr, setAuthErr] = React.useState('');
  const [authLoading, setAuthLoading] = React.useState(false);
  const [orders, setOrders] = React.useState<StoreOrder[]>([]);
  const seenRefs = React.useRef<Set<string>>(new Set());
  const pollRef = React.useRef<number|null>(null);

  if (!info) return <div style={{minHeight:'100vh',background:'#0a0a1a',color:'white',display:'flex',alignItems:'center',justifyContent:'center'}}>Type invalide. Utilisez /boutique/tabac, /boutique/pharmacie ou /boutique/fleurs</div>;

  const playAlert = () => { try { const ctx=new AudioContext();const osc=ctx.createOscillator();const g=ctx.createGain();osc.connect(g);g.connect(ctx.destination);osc.frequency.value=880;g.gain.setValueAtTime(0.3,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.6);osc.start();osc.stop(ctx.currentTime+0.6); } catch {} };

  const fetchOrders = React.useCallback(async () => {
    try {
      const savedCode = localStorage.getItem(`bridge_store_code_${storeType}`) || '';
      const r = await fetch(`/api/orders/by-store?type=${storeType}&code=${encodeURIComponent(savedCode)}`);
      if (r.status === 401) { localStorage.removeItem(`bridge_store_auth_${storeType}`); setAuthed(false); return; }
      if (!r.ok) return;
      const data = await r.json();
      const newOrders: StoreOrder[] = data.orders || [];
      const newPending = newOrders.filter(o => o.status === 'pending' && !seenRefs.current.has(o.ref));
      if (newPending.length > 0) { playAlert(); newPending.forEach(o => seenRefs.current.add(o.ref)); }
      newOrders.forEach(o => seenRefs.current.add(o.ref));
      setOrders(newOrders);
    } catch {}
  }, [storeType]);

  React.useEffect(() => {
    if (!authed) return;
    fetchOrders();
    pollRef.current = window.setInterval(fetchOrders, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [authed, fetchOrders]);

  const handleLogin = async () => {
    setAuthErr(''); setAuthLoading(true);
    try {
      const r = await fetch(`/api/orders/by-store?type=${storeType}&code=${encodeURIComponent(code)}`);
      if (r.ok) {
        localStorage.setItem(`bridge_store_auth_${storeType}`, 'ok');
        localStorage.setItem(`bridge_store_code_${storeType}`, code);
        setAuthed(true);
      } else { setAuthErr('Code incorrect'); }
    } catch { setAuthErr('Erreur de connexion'); }
    setAuthLoading(false);
  };

  const updateStatus = async (ref: string, status: string) => {
    const savedCode = localStorage.getItem(`bridge_store_code_${storeType}`) || '';
    await fetch(`/api/orders/by-ref/${ref}/store-status`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ status, type: storeType, code: savedCode }),
    }).catch(() => {});
    setOrders(prev => prev.map(o => o.ref === ref ? {...o, status} : o));
    if (['preparing','accepted'].includes(status)) {
      fetch(`/api/tracking/${ref}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status:'preparing'}) }).catch(() => {});
    }
  };

  const logout = () => {
    localStorage.removeItem(`bridge_store_auth_${storeType}`);
    localStorage.removeItem(`bridge_store_code_${storeType}`);
    setAuthed(false); setCode(''); setOrders([]);
  };

  if (!authed) {
    return (
      <div style={{minHeight:'100vh',background:'#0a0a1a',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
        <div style={{background:'#161630',borderRadius:'20px',padding:'40px 32px',maxWidth:'360px',width:'100%',textAlign:'center'}}>
          <div style={{fontSize:'52px',marginBottom:'12px'}}>{info.emoji}</div>
          <h1 style={{color:'white',fontSize:'22px',fontWeight:'700',marginBottom:'4px'}}>{info.name}</h1>
          <p style={{color:'rgba(255,255,255,0.45)',fontSize:'13px',marginBottom:'32px'}}>Espace propriÃÂÃÂÃÂÃÂ©taire</p>
          <input type="password" placeholder="Code d'accÃÂÃÂÃÂÃÂ¨s" value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={e => e.key==='Enter' && handleLogin()}
            style={{width:'100%',padding:'14px 16px',borderRadius:'12px',border:`2px solid ${authErr?'#ef4444':'rgba(255,255,255,0.1)'}`,background:'rgba(255,255,255,0.06)',color:'white',fontSize:'18px',boxSizing:'border-box',textAlign:'center',letterSpacing:'6px',outline:'none'}}
          />
          {authErr && <p style={{color:'#ef4444',fontSize:'13px',marginTop:'8px'}}>{authErr}</p>}
          <button onClick={handleLogin} disabled={authLoading || !code}
            style={{marginTop:'16px',width:'100%',padding:'14px',borderRadius:'12px',border:'none',background:info.accent,color:'white',fontSize:'15px',fontWeight:'600',cursor:authLoading||!code?'not-allowed':'pointer',opacity:authLoading||!code?0.55:1,transition:'opacity 0.2s'}}>
            {authLoading ? 'VÃÂÃÂÃÂÃÂ©rification...' : 'AccÃÂÃÂÃÂÃÂ©der ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ'}
          </button>
        </div>
      </div>
    );
  }

  const statusLabel: Record<string,string> = { pending:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ³ En attente', accepted:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ AcceptÃÂÃÂÃÂÃÂ©', preparing:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¨ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ³ En prÃÂÃÂÃÂÃÂ©paration', ready:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¦ PrÃÂÃÂÃÂÃÂªt', delivered:'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ LivrÃÂÃÂÃÂÃÂ©', cancelled:'ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ AnnulÃÂÃÂÃÂÃÂ©' };
  const formatTime = (s: string) => { try { return new Date(s).toLocaleTimeString('fr-MA',{hour:'2-digit',minute:'2-digit'}); } catch { return ''; } };
  const pending = orders.filter(o => o.status==='pending');
  const active  = orders.filter(o => ['accepted','preparing','ready'].includes(o.status));
  const done    = orders.filter(o => ['delivered','cancelled'].includes(o.status)).slice(0,10);

  const OrderCard = ({ order }: { order: StoreOrder }) => (
    <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'16px',padding:'16px',marginBottom:'12px',border:`2px solid ${order.status==='pending'?info.accent:'rgba(255,255,255,0.05)'}`}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
        <span style={{color:info.accent,fontWeight:'700',fontSize:'14px'}}>#{order.ref}</span>
        <span style={{color:'rgba(255,255,255,0.45)',fontSize:'12px'}}>{formatTime(order.createdAt)}</span>
      </div>
      <p style={{color:'white',fontWeight:'600',fontSize:'15px',margin:'0 0 3px'}}>{order.customerName}</p>
      <p style={{color:'rgba(255,255,255,0.55)',fontSize:'13px',margin:'0 0 3px'}}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ {order.customerPhone}</p>
      <p style={{color:'rgba(255,255,255,0.55)',fontSize:'13px',margin:'0 0 10px'}}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ {order.customerAddress}</p>
      {Array.isArray(order.items) && order.items.length > 0 && (
        <div style={{background:'rgba(0,0,0,0.3)',borderRadius:'10px',padding:'10px',marginBottom:'10px'}}>
          {order.items.map((item,i) => (
            <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'rgba(255,255,255,0.8)',marginBottom:'3px'}}>
              <span>{item.name} ÃÂÃÂÃÂÃÂ{item.qty}</span><span>{(item.price*item.qty).toFixed(0)} DH</span>
            </div>
          ))}
          <div style={{borderTop:'1px solid rgba(255,255,255,0.1)',marginTop:'7px',paddingTop:'7px',display:'flex',justifyContent:'space-between',fontWeight:'700',color:'white',fontSize:'14px'}}>
            <span>Total</span><span>{order.total} DH</span>
          </div>
        </div>
      )}
      <p style={{color:'rgba(255,255,255,0.4)',fontSize:'12px',margin:'0 0 10px'}}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ³ {order.paymentMethod} ÃÂÃÂÃÂÃÂ· {statusLabel[order.status]||order.status}</p>
      <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
        {order.status==='pending' && <>
          <button onClick={()=>updateStatus(order.ref,'accepted')} style={{flex:1,padding:'9px 12px',borderRadius:'8px',border:'none',background:'#22c55e',color:'white',fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Accepter</button>
          <button onClick={()=>updateStatus(order.ref,'cancelled')} style={{padding:'9px 14px',borderRadius:'8px',border:'none',background:'#ef4444',color:'white',fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ</button>
        </>}
        {order.status==='accepted' && <button onClick={()=>updateStatus(order.ref,'preparing')} style={{flex:1,padding:'9px',borderRadius:'8px',border:'none',background:'#f59e0b',color:'white',fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¨ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ³ En prÃÂÃÂÃÂÃÂ©paration</button>}
        {order.status==='preparing' && <button onClick={()=>updateStatus(order.ref,'ready')} style={{flex:1,padding:'9px',borderRadius:'8px',border:'none',background:'#8B5CF6',color:'white',fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¦ PrÃÂÃÂÃÂÃÂªt pour livraison</button>}
        {order.status==='ready' && <button onClick={()=>updateStatus(order.ref,'delivered')} style={{flex:1,padding:'9px',borderRadius:'8px',border:'none',background:'#06b6d4',color:'white',fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ MarquÃÂÃÂÃÂÃÂ© livrÃÂÃÂÃÂÃÂ©</button>}
      </div>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'#0a0a1a',color:'white'}}>
      <div style={{background:'#161630',padding:'14px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid rgba(255,255,255,0.08)',position:'sticky',top:0,zIndex:10}}>
        <div>
          <div style={{fontSize:'18px',fontWeight:'700'}}>{info.emoji} {info.name}</div>
          <div style={{fontSize:'12px',marginTop:'2px'}}>
            {pending.length>0 ? <span style={{color:'#ef4444',fontWeight:'600'}}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ´ {pending.length} nouvelle{pending.length>1?'s':''} commande{pending.length>1?'s':''}</span> : <span style={{color:'rgba(255,255,255,0.4)'}}>Aucune commande en attente</span>}
          </div>
        </div>
        <button onClick={logout} style={{padding:'7px 13px',borderRadius:'9px',border:'1px solid rgba(255,255,255,0.15)',background:'transparent',color:'rgba(255,255,255,0.6)',fontSize:'12px',cursor:'pointer'}}>DÃÂÃÂÃÂÃÂ©connexion</button>
      </div>
      <div style={{padding:'16px',maxWidth:'580px',margin:'0 auto'}}>
        {pending.length>0 && <div style={{marginBottom:'24px'}}><h2 style={{color:'#ef4444',fontSize:'14px',fontWeight:'700',marginBottom:'12px',textTransform:'uppercase',letterSpacing:'0.5px'}}>ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¡ Nouvelles commandes ({pending.length})</h2>{pending.map(o=><OrderCard key={o.ref} order={o}/>)}</div>}
        {active.length>0 && <div style={{marginBottom:'24px'}}><h2 style={{color:'#f59e0b',fontSize:'14px',fontWeight:'700',marginBottom:'12px',textTransform:'uppercase',letterSpacing:'0.5px'}}>ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ En cours ({active.length})</h2>{active.map(o=><OrderCard key={o.ref} order={o}/>)}</div>}
        {done.length>0 && <div><h2 style={{color:'rgba(255,255,255,0.35)',fontSize:'14px',fontWeight:'700',marginBottom:'12px',textTransform:'uppercase',letterSpacing:'0.5px'}}>TerminÃÂÃÂÃÂÃÂ©es</h2>{done.map(o=><OrderCard key={o.ref} order={o}/>)}</div>}
        {orders.length===0 && <div style={{textAlign:'center',padding:'70px 20px',color:'rgba(255,255,255,0.35)'}}><div style={{fontSize:'52px',marginBottom:'14px'}}>{info.emoji}</div><p style={{fontSize:'16px'}}>Aucune commande pour l'instant</p><p style={{fontSize:'13px',marginTop:'6px'}}>Les nouvelles commandes apparaÃÂÃÂÃÂÃÂ®tront automatiquement</p></div>}
      </div>
    </div>
  );
}

function ClerkProviderWithRoutes() {
  return (
    <AuthProvider>
        <QueryClientProvider client={queryClient}>
        
        
        <Switch>
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/forgot-password" component={ForgotPasswordPage} />
          <Route path="/game" component={GamePage} />
          <Route path="/missions" component={MissionsPage} />
          <Route path="/assistant" component={BridgeAssistantPage} />
          <Route path="/history" component={HistoryPageRoute} />
          <Route path="/dispatch" component={DispatchPage} />
          <Route path="/driver/:ref" component={DriverTrackerPage} />
          <Route path="/resto" component={RestaurantOwnerPage} />
          <Route path="/classement" component={LeaderboardPage} />
          <Route path="/boutique/:type" component={StoreOwnerPage} />
          <Route path="/admin-auth" component={AdminAuthPage} />
          <Route path="/manager" component={AdminAuthPage} />
          <Route component={typeof window !== 'undefined' && window.location.hostname.startsWith('manager.') ? AdminAuthPage : App} />
        </Switch>
        <FloatingAssistantWidget />
        <FloatingWAButton />
      </QueryClientProvider>
    
    </AuthProvider>
  );
}

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Visit tracker (fire once per session) ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
(() => {
  try {
    let sid = localStorage.getItem('bridge_sid');
    if (!sid) {
      sid = (crypto.randomUUID?.() || `s_${Date.now()}_${Math.random().toString(36).slice(2)}`);
      localStorage.setItem('bridge_sid', sid);
    }
    const lastPing = Number(sessionStorage.getItem('bridge_visit_pinged') || 0);
    if (Date.now() - lastPing < 30 * 60 * 1000) return;
    sessionStorage.setItem('bridge_visit_pinged', String(Date.now()));
    fetch('/api/visits/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sid,
        path: window.location.pathname,
        referrer: document.referrer || null,
      }),
    }).catch(() => {});
  } catch {}
})();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <WouterRouter base={basePath}>
      <AuthProvider>
    </WouterRouter>
  </ErrorBoundary>
);
