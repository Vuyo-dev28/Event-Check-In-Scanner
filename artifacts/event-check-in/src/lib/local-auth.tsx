import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type LocalUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  primaryEmailAddress: { emailAddress: string } | null;
  fullName: string | null;
  update: (params: { firstName: string; lastName: string }) => Promise<void>;
};

type AuthState = {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: LocalUser | null;
  signIn: (email: string, firstName?: string, lastName?: string) => void;
  signUp: (email: string, firstName?: string, lastName?: string) => void;
  signOut: (opts?: { redirectUrl?: string }) => void;
  addListener: (fn: (state: { user: LocalUser | null }) => void) => () => void;
};

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEY = 'event-check-in:local-auth-user';

function loadUser(): LocalUser | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { id: string; firstName: string; lastName: string; email: string };
    const user: LocalUser = {
      id: data.id,
      firstName: data.firstName,
      lastName: data.lastName,
      primaryEmailAddress: { emailAddress: data.email },
      fullName: `${data.firstName} ${data.lastName}`.trim() || null,
      update: async (params) => {
        const updated = { ...data, firstName: params.firstName, lastName: params.lastName };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      },
    };
    return user;
  } catch {
    return null;
  }
}

function saveUser(email: string, firstName: string, lastName: string): LocalUser {
  const id = `user_${Math.random().toString(36).slice(2, 12)}`;
  const data = { id, firstName, lastName, email };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return {
    id,
    firstName,
    lastName,
    primaryEmailAddress: { emailAddress: email },
    fullName: `${firstName} ${lastName}`.trim() || null,
    update: async (params) => {
      const updated = { ...data, firstName: params.firstName, lastName: params.lastName };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },
  };
}

export function LocalAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(() => loadUser());
  const [listeners] = useState<Array<(state: { user: LocalUser | null }) => void>>([]);

  const notify = (u: LocalUser | null) => {
    listeners.forEach((fn) => fn({ user: u }));
  };

  const signIn = useCallback((email: string, firstName = 'Demo', lastName = 'User') => {
    const u = saveUser(email, firstName, lastName);
    setUser(u);
    notify(u);
  }, [listeners]);

  const signUp = useCallback((email: string, firstName = 'Demo', lastName = 'User') => {
    const u = saveUser(email, firstName, lastName);
    setUser(u);
    notify(u);
  }, [listeners]);

  const signOut = useCallback((_opts?: { redirectUrl?: string }) => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    notify(null);
  }, [listeners]);

  const addListener = useCallback((fn: (state: { user: LocalUser | null }) => void) => {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, [listeners]);

  return (
    <AuthContext.Provider value={{ isLoaded: true, isSignedIn: !!user, user, signIn, signUp, signOut, addListener }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useUser must be used within LocalAuthProvider');
  return { isLoaded: ctx.isLoaded, isSignedIn: ctx.isSignedIn, user: ctx.user };
}

export function useClerk() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useClerk must be used within LocalAuthProvider');
  return { signOut: ctx.signOut, addListener: ctx.addListener, signIn: ctx.signIn, signUp: ctx.signUp };
}

export function ClerkProvider({ children }: { children: ReactNode }) {
  return <LocalAuthProvider>{children}</LocalAuthProvider>;
}
