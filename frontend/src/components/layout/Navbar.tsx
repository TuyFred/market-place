import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import { formatRwf } from '../../utils/format';

type SearchResult = {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
};

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, handleLogout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  /* ── Search ── */
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) { setResults([]); setShowResults(false); return; }
    timerRef.current = setTimeout(async () => {
      try {
        const res = await axios.get<SearchResult[]>('/api/products', { params: { search: query } });
        setResults(res.data.slice(0, 8));
        setShowResults(true);
      } catch { setResults([]); }
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  /* click outside to close */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    let mounted = true;
    axios.get<{ id: string; name: string; slug: string }[]>('/api/categories')
      .then((res) => { if (mounted) setCategories(res.data || []); })
      .catch(() => { if (mounted) setCategories([]); });
    return () => { mounted = false; };
  }, []);

  return (
    <header className="bg-white/80 backdrop-blur border-b border-slate-100 sticky top-0 z-30">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between h-16 gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent font-bold">
            AM
          </span>
          <span className="font-semibold text-slate-900 tracking-tight hidden sm:inline">
            Ass Market Place
          </span>
        </Link>

        {/* search bar */}
        <div ref={searchRef} className="relative flex-1 max-w-xs hidden sm:block">
          <input
            type="text"
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            className="w-full rounded-full bg-slate-100 border border-slate-200 px-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
            id="product-search-input"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">🔍</span>

          {showResults && results.length > 0 && (
            <div className="absolute top-full mt-2 w-full rounded-xl bg-white border border-slate-100 shadow-xl py-2 z-50 max-h-80 overflow-auto">
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => {
                    setShowResults(false);
                    setQuery('');
                    navigate(`/products?search=${encodeURIComponent(p.name)}`);
                  }}
                >
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">IMG</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.category} · {new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(p.price)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {showResults && query.trim() && results.length === 0 && (
            <div className="absolute top-full mt-2 w-full rounded-xl bg-white border border-slate-100 shadow-xl py-4 z-50 text-center text-sm text-slate-500">
              No products found
            </div>
          )}
        </div>

        {/* hamburger */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label="Toggle navigation"
          className="sm:hidden inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100"
          onClick={() => setOpen(!open)}
        >
          <span className="sr-only">Toggle navigation</span>
          <span className="flex flex-col gap-1">
            <span className="h-0.5 w-5 bg-slate-800" />
            <span className="h-0.5 w-5 bg-slate-800" />
            <span className="h-0.5 w-5 bg-slate-800" />
          </span>
        </button>

        {/* desktop nav */}
        <div className="hidden sm:flex items-center gap-4 text-sm font-medium shrink-0">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? 'text-accent' : 'text-slate-700 hover:text-accent'
            }
          >
            Home
          </NavLink>

          <div className="relative group">
            <button
              type="button"
              className="text-slate-700 hover:text-accent inline-flex items-center gap-1 text-sm font-semibold transition-colors"
            >
              Products
              <svg className="w-2.5 h-2.5 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-300 absolute top-full left-0 mt-3 w-56 rounded-2xl bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-100 py-3 z-50 overflow-hidden">
              {categories && categories.length > 0 ? (
                categories.map((c) => (
                  <NavLink key={c.id} to={`/products?category=${c.slug}`} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">{c.name}</NavLink>
                ))
              ) : (
                <>
                  <NavLink to="/products?category=children-clothes" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Children Clothes</NavLink>
                  <NavLink to="/products?category=women-clothes" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Women Clothes</NavLink>
                  <NavLink to="/products?category=small-bags" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Small Bags</NavLink>
                  <NavLink to="/products?category=accessories" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Accessories</NavLink>
                </>
              )}
            </div>
          </div>

          <NavLink
            to="/cart"
            className="relative inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            Cart
            {totalItems > 0 && (
              <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent text-[10px] text-white">
                {totalItems}
              </span>
            )}
          </NavLink>

          {!isAuthenticated ? (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center rounded-full bg-slate-900 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800"
            >
              Sign in
            </button>
          ) : (
            <div className="relative group">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-800 hover:bg-slate-50"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-[11px] text-accent font-semibold">
                  {user?.fullName?.charAt(0).toUpperCase() ?? user?.email.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[120px] truncate">
                  {user?.fullName || user?.email}
                </span>
              </button>
              <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all absolute right-0 mt-2 w-40 rounded-lg bg-white shadow-lg border border-slate-100 py-2 text-xs">
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <NavLink
                    to="/admin/dashboard"
                    className="block px-4 py-1.5 text-slate-700 hover:bg-slate-50"
                  >
                    Dashboard
                  </NavLink>
                )}
                <NavLink
                  to="/customer/dashboard"
                  className="block px-4 py-1.5 text-slate-700 hover:bg-slate-50"
                >
                  My orders
                </NavLink>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-1.5 text-slate-500 hover:bg-slate-50"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* mobile menu drawer */}
      <div
        className={`fixed inset-0 z-50 transition-visibility duration-300 ${open ? 'visible' : 'invisible'
          }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'
            }`}
          onClick={() => setOpen(false)}
        />

        {/* Drawer Content */}
        <div
          className={`absolute right-0 top-0 h-full w-[280px] bg-white shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <span className="font-bold text-slate-800">Menu</span>
              <button
                onClick={() => setOpen(false)}
                className="p-2 text-slate-500 hover:bg-slate-50 rounded-full"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Profile in Mobile */}
              {isAuthenticated && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl mb-4">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-accent font-bold">
                    {user?.fullName?.charAt(0).toUpperCase() ?? user?.email.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {user?.fullName || user?.email}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                      {user?.role}
                    </p>
                  </div>
                </div>
              )}

              {/* Mobile Search */}
              <div ref={searchRef} className="relative">
                <input
                  type="text"
                  placeholder="Search products…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-2xl bg-slate-100 border-none px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2">🔍</span>

                {showResults && results.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-100 z-[60] max-h-60 overflow-y-auto">
                    {results.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0"
                        onClick={() => {
                          setOpen(false);
                          setShowResults(false);
                          setQuery('');
                          navigate(`/products?search=${encodeURIComponent(p.name)}`);
                        }}
                      >
                        <div className="h-10 w-10 rounded-lg bg-slate-100 shrink-0 overflow-hidden">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[10px] text-slate-400">IMG</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">{p.name}</p>
                          <p className="text-[10px] text-accent font-bold">{formatRwf(p.price)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation Links */}
              <div className="space-y-1">
                <NavLink
                  to="/"
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 p-3 rounded-xl transition-colors ${isActive ? 'bg-accent/10 text-accent' : 'text-slate-600 hover:bg-slate-50'
                    }`
                  }
                >
                  <span className="text-sm font-semibold">Home</span>
                </NavLink>

                <div className="space-y-1">
                  <p className="px-3 pt-4 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Categories
                  </p>
                  {categories.map((c) => (
                    <NavLink
                      key={c.id}
                      to={`/products?category=${c.slug}`}
                      onClick={() => setOpen(false)}
                      className="block p-3 rounded-xl text-slate-600 hover:bg-slate-50"
                    >
                      <span className="text-sm font-medium">{c.name}</span>
                    </NavLink>
                  ))}
                </div>

                <NavLink
                  to="/cart"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  <span className="text-sm font-semibold">Shopping Cart</span>
                  {totalItems > 0 && (
                    <span className="h-5 w-5 rounded-full bg-accent text-[10px] text-white flex items-center justify-center font-bold">
                      {totalItems}
                    </span>
                  )}
                </NavLink>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100">
              {!isAuthenticated ? (
                <button
                  onClick={() => { setOpen(false); navigate('/login'); }}
                  className="w-full bg-slate-900 text-white rounded-xl py-3.5 text-sm font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-[0.98]"
                >
                  Sign In
                </button>
              ) : (
                <div className="space-y-2">
                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <button
                      onClick={() => { setOpen(false); navigate('/admin/dashboard'); }}
                      className="w-full bg-accent text-white rounded-xl py-3.5 text-sm font-bold shadow-lg shadow-accent/10 hover:opacity-90 transition-all"
                    >
                      Admin Dashboard
                    </button>
                  )}
                  <button
                    onClick={() => { setOpen(false); handleLogout(); }}
                    className="w-full bg-white border border-slate-200 text-slate-600 rounded-xl py-3.5 text-sm font-bold hover:bg-slate-100 transition-all"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Modal removed: login/register is now a full page at /login and /register */}
    </header>
  );
}
