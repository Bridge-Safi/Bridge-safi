/**
 * bridge-auth.tsx — Remplace @clerk/react — zéro dépendance externe
 * DESTINATION : artifacts/grado-eats/src/bridge-auth.tsx
 *
 * Hooks: useUser(), useAuth(), useBridgeAuth()
 * Provider: <AuthProvider>
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface BridgeUser {
  id: string;
  phone: string | null;
  email: string | null;
  name: string;
  role: 'client' | 'livreur' | 'restaurant';
  imageUrl: string;
  primaryPhoneNumber: { phoneNumber: string } | null;
  primaryEmailAddress: { emailAddress: string } | null;
}

interface AuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: BridgeUser | null;
  token: string | null;
}

interface AuthContextValue extends AuthState {
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (identifier: string, password: string, name?: string) => Promise<void>;
  signOut: () => void;
  getToken: () => Promise<string | null>;
  setActive: (_opts?: any) => Promise<void>;
}

const TOKEN_KEY = 'bridge_jwt';
const USER_KEY  = 'bridge_user_cache';

const AuthContext = createContext<AuthContextValue>({
  isLoaded: false, isSignedIn: false, user: null, token: null,
  signIn: async () => {}, signUp: async () => {}, signOut: () => {},
  getToken: async () => null, setActive: async () => {},
});

function normalizeUser(raw: any): BridgeUser {
  return {
    id:                   raw.id ?? '',
    phone:                raw.phone ?? null,
    email:                raw.email ?? null,
    name:                 raw.name ?? '',
    role:                 raw.role ?? 'client',
    imageUrl:             raw.imageUrl ?? raw.avatar_url ?? '',
    primaryPhoneNumber:   raw.phone ? { phoneNumber: raw.phone } : null,
    primaryEmailAddress:  raw.email ? { emailAddress: raw.email } : null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    try {
      const cachedToken = localStorage.getItem(TOKEN_KEY);
      const cachedUser  = localStorage.getItem(USER_KEY);
      if (cachedToken && cachedUser) {
        return { isLoaded: false, isSignedIn: true, user: normalizeUser(JSON.parse(cachedUser)), token: cachedToken };
      }
    } catch {}
    return { isLoaded: false, isSignedIn: false, user: null, token: null };
  });

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setState({ isLoaded: true, isSignedIn: false, user: null, token: null }); return; }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(raw => {
        if (raw?.id) {
          const user = normalizeUser(raw);
          localStorage.setItem(USER_KEY, JSON.stringify(raw));
          setState({ isLoaded: true, isSignedIn: true, user, token });
        } else {
          localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY);
          setState({ isLoaded: true, isSignedIn: false, user: null, token: null });
        }
      })
      .catch(() => {
        const cached = localStorage.getItem(USER_KEY);
        if (cached) setState(s => ({ ...s, isLoaded: true }));
        else setState({ isLoaded: true, isSignedIn: false, user: null, token: null });
      });
  }, []);

  const signIn = async (identifier: string, password: string) => {
    const r = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim(), password }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Identifiants incorrects.');
    const user = normalizeUser(data.user);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setState({ isLoaded: true, isSignedIn: true, user, token: data.token });
  };

  const signUp = async (identifier: string, password: string, name?: string) => {
    const r = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim(), password, name: name?.trim() || '' }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Erreur lors de la création du compte.');
    const user = normalizeUser(data.user);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setState({ isLoaded: true, isSignedIn: true, user, token: data.token });
  };

  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY);
    setState({ isLoaded: true, isSignedIn: false, user: null, token: null });
  };

  const getToken = async (): Promise<string | null> => localStorage.getItem(TOKEN_KEY);
  const setActive = async (_opts?: any) => {};

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut, getToken, setActive }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(AuthContext);
  return { isLoaded: ctx.isLoaded, isSignedIn: ctx.isSignedIn, user: ctx.user };
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  return { isLoaded: ctx.isLoaded, isSignedIn: ctx.isSignedIn, userId: ctx.user?.id ?? null, getToken: ctx.getToken };
}

export function useBridgeAuth() {
  const ctx = useContext(AuthContext);
  return { signIn: ctx.signIn, signUp: ctx.signUp, signOut: ctx.signOut, setActive: ctx.setActive, isSignedIn: ctx.isSignedIn, user: ctx.user };
}
