import { Link } from 'react-router-dom';
import { BRAND } from '../../config/brand';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from './BrandLogo';

export function Footer() {
  const { openAuthModal } = useAuth();
  return (
    <footer className="mt-auto border-t border-neutral-200 bg-white text-black pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
        <div className="grid grid-cols-1 gap-8 xs:grid-cols-2 sm:grid-cols-3 sm:gap-8">
          <div className="xs:col-span-2 sm:col-span-1">
            <BrandLogo size="nav" to="/" />
            <p className="mt-3 max-w-xs text-sm text-neutral-500 leading-relaxed">{BRAND.tagline}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-400">Shop</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/products" className="hover:opacity-60">
                  Catalog
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:opacity-60">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:opacity-60">
                  Cart
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-400">Account</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <button type="button" onClick={() => openAuthModal('login')} className="hover:opacity-60">
                  Sign in
                </button>
              </li>
              <li>
                <Link to="/customer/dashboard" className="hover:opacity-60">
                  My orders
                </Link>
              </li>
            </ul>
            <p className="mt-6 text-xs text-neutral-400">
              © {new Date().getFullYear()} {BRAND.name}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
