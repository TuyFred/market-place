import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AuthModal } from '../auth/AuthModal';

export function Layout() {
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
