import { Link } from 'react-router-dom';
import { BRAND } from '../../config/brand';
import { useAuth } from '../../context/AuthContext';

export function Footer() {
  const { openAuthModal } = useAuth();
  return (
    <footer className="border-t border-ink/5 bg-ink text-white mt-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          <div>
            <div className="font-display text-xl sm:text-2xl font-bold tracking-tight">
              {BRAND.name}
            </div>
            <p className="text-sm text-white/60 mt-3 leading-relaxed max-w-sm">
              {BRAND.tagline}. Custom orders welcome — {BRAND.location}.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-white/70">
              {BRAND.bio.map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-forest shrink-0" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-10">
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">Shop</h4>
              <ul className="mt-3 text-sm text-white/75 space-y-2">
                <li><Link to="/products" className="hover:text-white">All clothes</Link></li>
                <li><Link to="/products?category=african-traditional" className="hover:text-white">African wear</Link></li>
                <li><Link to="/products?category=modern-casual" className="hover:text-white">Modern casual</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">Account</h4>
              <ul className="mt-3 text-sm text-white/75 space-y-2">
                <li><Link to="/cart" className="hover:text-white">Cart</Link></li>
                <li>
                  <button type="button" onClick={() => openAuthModal('login')} className="hover:text-white text-left">
                    Sign in
                  </button>
                </li>
                <li><Link to="/customer/dashboard" className="hover:text-white">My orders</Link></li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">About</h4>
            <p className="text-sm text-white/60 mt-3 leading-relaxed">
              Based in {BRAND.location}. Shop African-inspired fashion and modern styles online.
            </p>
            <p className="mt-6 text-xs text-white/40">
              © {new Date().getFullYear()} {BRAND.name}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
