import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';

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
      document.body.style.overflow = 'unset';
      setVisible(false);
    }
  }, [authModalOpen]);

  if (!authModalOpen) return null;

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => closeAuthModal(), 200);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 sm:p-6 pt-12 sm:pt-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ease-out"
      style={{ opacity: visible ? 1 : 0 }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-[420px] sm:max-w-[340px] bg-slate-900/90 border border-slate-800 rounded-[24px] shadow-2xl transition-all duration-300 ease-out overflow-auto max-h-[90vh]"
        style={{
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.98) translateY(12px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(249, 115, 22, 0.05)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

        <div className="px-6 py-6 sm:px-7 sm:py-8">
          {/* header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-widest font-medium">
              to continue to Ass Market Place
            </p>
          </div>

          {/* body — ensures no scrollbars by being compact */}
          <div className="relative">
            {mode === 'login' ? (
              <LoginForm
                onSuccess={({ user, accessToken }) => {
                  handleLoginSuccess({ user, token: accessToken });
                  if (user.role === 'admin' || user.role === 'manager') {
                    window.location.href = '/admin/dashboard';
                  }
                }}
              />
            ) : (
              <RegisterForm onRegistered={() => setMode('login')} />
            )}
          </div>

          {/* toggle footer */}
          <div className="mt-6 pt-5 border-t border-slate-800/50 text-center">
            <p className="text-xs text-slate-400">
              {mode === 'login' ? (
                <>
                  New here?{' '}
                  <button
                    onClick={() => setMode('register')}
                    className="text-amber-500 hover:text-amber-400 font-bold transition-colors"
                  >
                    Join us
                  </button>
                </>
              ) : (
                <>
                  Already a member?{' '}
                  <button
                    onClick={() => setMode('login')}
                    className="text-amber-500 hover:text-amber-400 font-bold transition-colors"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {/* close button icon */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
}
