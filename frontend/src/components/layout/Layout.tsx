import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AuthModal } from '../auth/AuthModal';
import { useAuth } from '../../context/AuthContext';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { openAuthModal, isAuthenticated } = useAuth();

  useEffect(() => {
    const state = location.state as { needLogin?: boolean; authMessage?: string } | null;
    const params = new URLSearchParams(location.search);
    const authFlag = params.get('auth');

    if (state?.needLogin && !isAuthenticated) {
      openAuthModal('login');
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }

    if (authFlag === 'signedOut' || authFlag === 'sessionExpired') {
      // Clean query so refresh does not keep flashing the banner path
      navigate('/', { replace: true });
    }
  }, [location.pathname, location.search, location.state, isAuthenticated, openAuthModal, navigate]);

  return (
    <div className="flex min-h-[100dvh] min-h-screen flex-col overflow-x-hidden bg-white text-black">
      <Navbar />
      <main className="w-full min-w-0 flex-1">
        <Outlet />
      </main>
      <Footer />
      <AuthModal />
    </div>
  );
}
