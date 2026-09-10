import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import { formatRwf } from '../../utils/format';
import { BRAND } from '../../config/brand';

type SearchResult = {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
};

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, handleLogout, openAuthModal } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  /* ── Search ── */
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [catOpen, setCatOpen] = useState(false);

  useEffect(() => {
    if (!open) setCatOpen(false);
  }, [open]);

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

  // lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const navTo = (path: string) => { setOpen(false); navigate(path); };

  return (
    <header className="bg-stone/90 backdrop-blur-xl border-b border-ink/5 sticky top-0 z-30">
      <nav className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-10 flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group min-w-0">
          <span className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-ink text-white font-display font-bold text-[10px] sm:text-xs group-hover:bg-forest transition-colors shrink-0">
            {BRAND.initials}
          </span>
          <span className="font-display font-bold text-ink tracking-tight leading-tight min-w-0">
            <span className="block text-[13px] xs:text-sm sm:text-lg truncate">
              {BRAND.shortName}
              <span className="ml-1 text-[10px] xs:text-xs sm:text-sm font-semibold tracking-[0.12em] text-forest">
                {BRAND.byline}
              </span>
            </span>
          </span>
        </Link>

        {/* search bar – desktop */}
        <div ref={searchRef} className="relative flex-1 max-w-sm hidden md:block px-6">
          <div className="relative group">
            <input
              type="text"
              placeholder="Search clothes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setShowResults(true)}
              className="w-full rounded-full bg-white border border-ink/10 px-5 py-2.5 text-xs font-medium text-ink placeholder:text-ink/40 focus:outline-none focus:ring-4 focus:ring-forest/10 focus:border-forest/40 transition-all"
              id="product-search-input"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none group-focus-within:text-forest transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
          </div>

          {showResults && results.length > 0 && (
            <div className="absolute top-full mt-3 w-[calc(100%-3rem)] left-6 rounded-[2rem] bg-white border border-slate-100 shadow-2xl py-3 z-50 max-h-[400px] overflow-auto animate-in fade-in slide-in-from-top-2 duration-300">
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="w-full flex items-center gap-4 px-5 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                  onClick={() => {
                    setShowResults(false);
                    setQuery('');
                    navigate(`/products?search=${encodeURIComponent(p.name)}`);
                  }}
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">IMG</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate">{p.name}</p>
                    <p className="text-[10px] text-forest font-bold tracking-widest uppercase">{p.category} · {formatRwf(p.price)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {showResults && query.trim() && results.length === 0 && (
            <div className="glass absolute top-full mt-4 w-[calc(100%-3rem)] left-6 rounded-[2rem] shadow-xl py-8 z-50 text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] animate-reveal">
              No results found for your search
            </div>
          )}
        </div>

        {/* Mobile: cart icon + hamburger */}
        <div className="flex items-center gap-2 sm:hidden">
          <NavLink
            to="/cart"
            className="relative inline-flex items-center justify-center w-9 h-9 rounded-full bg-stone text-ink"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 flex items-center justify-center rounded-full bg-forest text-[9px] text-white font-bold px-1">
                {totalItems}
              </span>
            )}
          </NavLink>

          {/* Animated hamburger */}
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-stone text-ink"
            onClick={() => setOpen(!open)}
          >
            <div className="flex flex-col justify-center items-center w-5 h-5 relative">
              <span className={`block h-0.5 w-5 bg-ink rounded-full transition-all duration-300 absolute ${open ? 'rotate-45 top-[9px]' : 'top-[4px]'}`} />
              <span className={`block h-0.5 w-5 bg-ink rounded-full transition-all duration-300 absolute top-[9px] ${open ? 'opacity-0 scale-0' : 'opacity-100'}`} />
              <span className={`block h-0.5 w-5 bg-ink rounded-full transition-all duration-300 absolute ${open ? '-rotate-45 top-[9px]' : 'top-[14px]'}`} />
            </div>
          </button>
        </div>

        {/* desktop nav */}
        <div className="hidden sm:flex items-center gap-4 text-sm font-medium shrink-0">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${isActive ? 'text-forest' : 'text-ink/60 hover:text-forest'}`
            }
          >
            Home
          </NavLink>

          <div className="relative group">
            <button
              type="button"
              className="text-ink/60 hover:text-forest inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors"
            >
              Clothes
              <svg className="w-2.5 h-2.5 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-300 absolute top-full left-0 mt-3 w-60 rounded-2xl bg-white shadow-xl border border-ink/5 py-3 z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
              <NavLink to="/products" className="block px-4 py-2 text-sm font-semibold text-forest hover:bg-stone">All Clothes</NavLink>
              <div className="h-px bg-ink/5 my-1" />
              {categories && categories.length > 0 ? (
                categories.map((c) => (
                  <NavLink key={c.id} to={`/products?category=${c.slug}`} className="block px-4 py-2 text-sm text-ink/80 hover:bg-stone">{c.name}</NavLink>
                ))
              ) : (
                <>
                  <NavLink to="/products?category=african-traditional" className="block px-4 py-2 text-sm text-ink/80 hover:bg-stone">African Traditional</NavLink>
                  <NavLink to="/products?category=ankara-prints" className="block px-4 py-2 text-sm text-ink/80 hover:bg-stone">Ankara & Prints</NavLink>
                  <NavLink to="/products?category=modern-casual" className="block px-4 py-2 text-sm text-ink/80 hover:bg-stone">Modern Casual</NavLink>
                  <NavLink to="/products?category=women-wear" className="block px-4 py-2 text-sm text-ink/80 hover:bg-stone">Women Wear</NavLink>
                  <NavLink to="/products?category=men-wear" className="block px-4 py-2 text-sm text-ink/80 hover:bg-stone">Men Wear</NavLink>
                  <NavLink to="/products?category=kids-wear" className="block px-4 py-2 text-sm text-ink/80 hover:bg-stone">Kids Wear</NavLink>
                  <NavLink to="/products?category=formal-occasion" className="block px-4 py-2 text-sm text-ink/80 hover:bg-stone">Formal & Occasion</NavLink>
                  <NavLink to="/products?category=street-style" className="block px-4 py-2 text-sm text-ink/80 hover:bg-stone">Street Style</NavLink>
                </>
              )}
            </div>
          </div>

          <NavLink
            to="/cart"
            className="relative inline-flex items-center gap-2.5 rounded-full bg-ink px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-forest transition-colors active:scale-95"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            Cart
            {totalItems > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-forest text-[10px] text-white font-bold">
                {totalItems}
              </span>
            )}
          </NavLink>

          {!isAuthenticated ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="btn-premium-primary !px-6 !py-2.5 !text-[10px]"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('register')}
                className="btn-premium-secondary !px-6 !py-2.5 !text-[10px]"
              >
                Join
              </button>
            </div>
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

      {/* ── Mobile menu drawer ── */}
      <div
        className={`fixed inset-0 z-50 transition-visibility duration-300 ${open ? 'visible' : 'invisible'}`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-stone/70 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setOpen(false)}
        />

        {/* Drawer */}
        <div
          className={`absolute right-0 top-0 h-full w-[300px] max-w-[85vw] bg-white shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-forest/10 text-forest font-bold text-sm">{BRAND.initials}</span>
                <div className="leading-tight">
                  <span className="block font-bold text-slate-900 text-sm">{BRAND.shortName}</span>
                  <span className="block text-[10px] font-semibold tracking-[0.14em] text-forest">{BRAND.byline}</span>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                aria-label="Close menu"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Profile Section */}
              {isAuthenticated && (
                <div className="px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-accent to-orange-400 text-white font-bold text-lg shadow-md">
                      {user?.fullName?.charAt(0).toUpperCase() ?? user?.email.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate text-sm">
                        {user?.fullName || user?.email}
                      </p>
                      <p className="text-[10px] text-accent uppercase tracking-wider font-bold">
                        {user?.role}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Search Bar - Mobile */}
              <div className="px-5 py-3 border-b border-slate-100">
                <div ref={searchRef} className="relative">
                  <input
                    type="text"
                    placeholder="Search clothes…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-forest/30 focus:border-forest focus:outline-none transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </span>

                  {showResults && results.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-[60] max-h-60 overflow-y-auto">
                      {results.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0"
                          onClick={() => {
                            setShowResults(false);
                            setQuery('');
                            navTo(`/products?search=${encodeURIComponent(p.name)}`);
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
              </div>

              {/* Navigation Links */}
              <div className="px-3 py-3 space-y-1">
                <NavLink
                  to="/"
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${isActive ? 'bg-forest/10 text-forest' : 'text-slate-700 hover:bg-stone'}`
                  }
                >
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                  <span className="text-sm font-semibold">Home</span>
                </NavLink>

                <NavLink
                  to="/products"
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all border ${isActive ? 'bg-forest text-white border-forest' : 'bg-stone text-ink border-ink/5 hover:border-forest/30'}`
                  }
                >
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  <span className="text-sm font-bold">Clothes</span>
                </NavLink>

                <div className="rounded-xl border border-ink/5 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setCatOpen(!catOpen)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-3 text-slate-700 hover:bg-stone transition-all"
                    aria-expanded={catOpen}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                      <span className="text-sm font-semibold">Categories</span>
                    </div>
                    <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${catOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ease-out ${catOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-2 pb-2 space-y-0.5 bg-stone/60">
                      {(categories.length > 0 ? categories : [
                        { id: '1', slug: 'african-traditional', name: 'African Traditional' },
                        { id: '2', slug: 'ankara-prints', name: 'Ankara & Prints' },
                        { id: '3', slug: 'modern-casual', name: 'Modern Casual' },
                        { id: '4', slug: 'women-wear', name: 'Women Wear' },
                        { id: '5', slug: 'men-wear', name: 'Men Wear' },
                        { id: '6', slug: 'kids-wear', name: 'Kids Wear' },
                        { id: '7', slug: 'formal-occasion', name: 'Formal & Occasion' },
                        { id: '8', slug: 'street-style', name: 'Street Style' },
                      ]).map((c) => (
                        <NavLink
                          key={c.id}
                          to={`/products?category=${c.slug}`}
                          onClick={() => { setOpen(false); setCatOpen(false); }}
                          className="block py-2.5 px-3 rounded-lg text-sm text-slate-600 hover:bg-white hover:text-forest transition-colors font-medium"
                        >
                          {c.name}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>

                <NavLink
                  to="/cart"
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-3 rounded-xl transition-all ${isActive ? 'bg-forest/10 text-forest' : 'text-slate-700 hover:bg-stone'}`
                  }
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    <span className="text-sm font-semibold">Cart</span>
                  </div>
                  {totalItems > 0 && (
                    <span className="h-6 min-w-6 px-1.5 rounded-full bg-forest text-[11px] text-white flex items-center justify-center font-bold">
                      {totalItems}
                    </span>
                  )}
                </NavLink>

                {isAuthenticated && (
                  <NavLink
                    to="/customer/dashboard"
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${isActive ? 'bg-forest/10 text-forest' : 'text-slate-700 hover:bg-stone'}`
                    }
                  >
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    <span className="text-sm font-semibold">My Orders</span>
                  </NavLink>
                )}

                {isAuthenticated && (user?.role === 'admin' || user?.role === 'manager') && (
                  <NavLink
                    to="/admin/dashboard"
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${isActive ? 'bg-forest/10 text-forest' : 'text-slate-700 hover:bg-stone'}`
                    }
                  >
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 01-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="text-sm font-semibold">Dashboard</span>
                  </NavLink>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-stone/40 space-y-2">
              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => { setOpen(false); openAuthModal('login'); }}
                    className="w-full flex items-center justify-center gap-2 bg-forest text-white rounded-xl py-3 text-sm font-bold shadow-md shadow-forest/20 hover:bg-ink transition-all active:scale-[0.98]"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { setOpen(false); openAuthModal('register'); }}
                    className="w-full flex items-center justify-center gap-2 bg-white border border-ink/10 text-ink rounded-xl py-3 text-sm font-bold hover:bg-stone transition-all active:scale-[0.98]"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setOpen(false); handleLogout(); }}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-ink/10 text-slate-600 rounded-xl py-3 text-sm font-bold hover:bg-red-50 hover:text-red-600 transition-all"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Auth popup handled by AuthModal in Layout */}
    </header>
  );
}
