import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Opens the auth popup and sends the user back to home (or a safe fallback). */
export function AuthRedirect({ mode }: { mode: 'login' | 'register' }) {
  const { openAuthModal } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/';

  useEffect(() => {
    openAuthModal(mode);
  }, [mode, openAuthModal]);

  return <Navigate to={from} replace />;
}