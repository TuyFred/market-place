import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';

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
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  authModalMode: 'login' | 'register';
  handleLoginSuccess: (payload: { user: User; token: string }) => void;
  handleLogout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* Supabase client for OAuth session detection */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  /* Restore from localStorage */
  useEffect(() => {
    const storedToken = localStorage.getItem('customer_token');
    const storedUser = localStorage.getItem('customer_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  /* Listen for OAuth redirect (Google login callback) */
  useEffect(() => {
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user && !user) {
          const u: User = {
            id: session.user.id,
            email: session.user.email || '',
            role: session.user.user_metadata?.role || 'customer',
            fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || ''
          };
          setUser(u);
          setToken(session.access_token);
          localStorage.setItem('customer_token', session.access_token);
          localStorage.setItem('customer_user', JSON.stringify(u));
          setAuthModalOpen(false);
        }
      }
    );

    return () => { subscription.unsubscribe(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const handleLoginSuccess = (payload: { user: User; token: string }) => {
    setUser(payload.user);
    setToken(payload.token);
    localStorage.setItem('customer_token', payload.token);
    localStorage.setItem('customer_user', JSON.stringify(payload.user));
    setAuthModalOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_user');
    // Also clear any admin credentials that may have been stored
    try {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    } catch (e) {
      // ignore
    }
    if (supabase) supabase.auth.signOut();
    window.location.reload();
  };

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    openAuthModal,
    closeAuthModal,
    authModalOpen,
    authModalMode,
    handleLoginSuccess,
    handleLogout
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
