import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { BRAND } from '../../config/brand';

export function AuthModal() {
  const {
    authModalOpen,
    authModalMode,
    closeAuthModal,
    handleLoginSuccess
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(authModalMode);
  const [visible, setVisible] = useState(false);

  useEffect(() => { setMode(authModalMode); }, [authModalMode]);

  useEffect(() => {
    if (authModalOpen) {
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => setVisible(true));
    } else {
      document.body.style.overflow = '';
      setVisible(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [authModalOpen]);

  if (!authModalOpen) return null;

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => closeAuthModal(), 180);
  };

  return (
    <div
      className={`fixed inset-0 z-[120] flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'login' ? 'Sign in' : 'Sign up'}
    >
      <div
        className={`relative w-full max-w-[360px] rounded-2xl bg-white border border-ink/10 shadow-2xl overflow-hidden transition-all duration-200 ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-white font-display text-[10px] font-bold">
              {BRAND.initials}
            </span>
            <div>
              <p className="font-display text-sm font-bold text-ink leading-none">{BRAND.shortName}</p>
              <p className="text-[10px] text-ink/45 mt-0.5">
                <span className="text-forest font-semibold tracking-wide">{BRAND.byline}</span>
                {' · '}
                {mode === 'login' ? 'Sign in' : 'Create account'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-stone text-ink/60 hover:bg-ink hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="mx-5 mt-1 mb-3 grid grid-cols-2 rounded-full bg-stone p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`rounded-full py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${mode === 'login' ? 'bg-ink text-white' : 'text-ink/50 hover:text-ink'}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`rounded-full py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${mode === 'register' ? 'bg-ink text-white' : 'text-ink/50 hover:text-ink'}`}
          >
            Sign up
          </button>
        </div>

        <div className="px-5 pb-5">
          {mode === 'login' ? (
            <LoginForm
              variant="light"
              onSuccess={({ user, accessToken }) => {
                handleLoginSuccess({ user, token: accessToken });
                if (user.role === 'admin' || user.role === 'manager') {
                  window.location.href = '/admin/dashboard';
                }
              }}
            />
          ) : (
            <RegisterForm
              variant="light"
              onRegistered={() => setMode('login')}
            />
          )}
        </div>
      </div>
    </div>
  );
}