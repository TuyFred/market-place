import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { WhatsAppFloating } from './WhatsAppFloating';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-900">
      <Navbar />
      <main className="flex-1 px-3 sm:px-6 lg:px-8 py-3 sm:py-5">
        <div className="max-w-7xl mx-auto w-full rounded-2xl sm:rounded-[2rem] bg-white shadow-sm border border-slate-100 px-3 sm:px-5 lg:px-8 py-3 sm:py-5">
          <Outlet />
        </div>
      </main>
      <Footer />
      <WhatsAppFloating />
    </div>
  );
}
