import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { clearAuthStorage, hardRedirectHome, isProtectedPath, readStoredToken } from '../utils/session';

type User = {
  id: string;
  email: string;
  role: string;
  fullName?: string;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  authReady: boolean;
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  authModalMode: 'login' | 'register';
  handleLoginSuccess: (payload: { user: User; token: string }) => void;
  handleLogout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

function parseStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('customer_user') || localStorage.getItem('admin_user');
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  /* Restore from localStorage once */
  useEffect(() => {
    const storedToken = readStoredToken();
    const storedUser = parseStoredUser();
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    } else {
      clearAuthStorage();
      setToken(null);
      setUser(null);
    }
    setAuthReady(true);
  }, []);

  /* OAuth / Supabase session */
  useEffect(() => {
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const u: User = {
          id: session.user.id,
          email: session.user.email || '',
          role:
            (session.user.app_metadata as { role?: string })?.role ||
            session.user.user_metadata?.role ||
            'customer',
          fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
        };
        setUser(u);
        setToken(session.access_token);
        localStorage.setItem('customer_token', session.access_token);
        localStorage.setItem('customer_user', JSON.stringify(u));
        setAuthModalOpen(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * If the browser restores a cached authenticated page (bfcache / Back),
   * drop the user out when the token is gone.
   */
  useEffect(() => {
    const enforceSession = () => {
      const live = readStoredToken();
      if (!live) {
        setUser(null);
        setToken(null);
        if (isProtectedPath(window.location.pathname)) {
          hardRedirectHome('sessionExpired');
        }
      }
    };

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) enforceSession();
      else enforceSession();
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') enforceSession();
    };

    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.includes('token') || e.key.includes('user')) {
        enforceSession();
      }
    };

    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const openAuthModal = useCallback((mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  const handleLoginSuccess = (payload: { user: User; token: string }) => {
    setUser(payload.user);
    setToken(payload.token);
    localStorage.setItem('customer_token', payload.token);
    localStorage.setItem('customer_user', JSON.stringify(payload.user));
    if (payload.user.role === 'admin' || payload.user.role === 'manager') {
      localStorage.setItem('admin_token', payload.token);
      localStorage.setItem('admin_user', JSON.stringify(payload.user));
    }
    setAuthModalOpen(false);
  };

  const handleLogout = useCallback(() => {
    setUser(null);
    setToken(null);
    clearAuthStorage();
    try {
      supabase?.auth.signOut();
    } catch {
      /* ignore */
    }
    // Replace history entry — Chrome Back cannot reopen the signed-in page
    hardRedirectHome('signedOut');
  }, []);

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    authReady,
    openAuthModal,
    closeAuthModal,
    authModalOpen,
    authModalMode,
    handleLoginSuccess,
    handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
