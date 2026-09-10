import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AuthModal } from '../auth/AuthModal';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-stone text-ink overflow-x-hidden">
      <Navbar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
      <AuthModal />
    </div>
  );
}
