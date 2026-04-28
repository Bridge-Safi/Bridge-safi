import { useEffect, useRef } from 'react';
import { createRoot } from "react-dom/client";
import { ClerkProvider, SignIn, SignUp, useClerk } from '@clerk/react';
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
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    header: 'hidden',
    formFieldAction: 'text-[#065F46] font-bold hover:text-[#047857]',
    socialButtonsBlockButton: 'border-2 border-[#E5E1D8] rounded-2xl font-semibold hover:border-[#065F46] hover:bg-[#F0FDF4] transition-all h-12',
    socialButtonsBlockButtonText: 'font-semibold text-sm text-[#1A2F23]',
    formFieldInput: 'rounded-2xl border-2 border-[#E5E1D8] focus:border-[#065F46] bg-[#F9F7F2] text-sm h-12 px-4',
    formFieldLabel: 'text-xs font-black text-[#065F46] uppercase tracking-wider',
    formButtonPrimary: 'bg-[#065F46] hover:bg-[#047857] rounded-2xl h-12 text-sm font-black tracking-widest transition-all shadow-lg shadow-green-900/20',
    footerActionLink: 'text-[#065F46] font-bold hover:text-[#047857]',
    dividerRow: 'my-2',
    dividerText: 'text-gray-400 text-xs',
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

function SignInPage() {
  return (
    <AuthPageWrapper>
      <AuthCardHeader title="Connexion · Sign in" sub="Email, téléphone, mot de passe, Google ou Apple" />
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        appearance={clerkAppearance}
      />
    </AuthPageWrapper>
  );
}

function SignUpPage() {
  return (
    <AuthPageWrapper>
      <AuthCardHeader title="Créer un compte · Sign up" sub="Email ou téléphone requis · mot de passe obligatoire" />
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        appearance={clerkAppearance}
      />
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
