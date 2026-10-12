import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import { formatRwf } from '../../utils/format';
import { BRAND } from '../../config/brand';
import { BrandLogo } from './BrandLogo';

type SearchResult = {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
};

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, isAuthenticated, handleLogout, openAuthModal } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      try {
        const res = await axios.get<SearchResult[]>('/api/products', { params: { search: query } });
        setResults(res.data.slice(0, 8));
        setShowResults(true);
      } catch {
        setResults([]);
      }
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm text-black transition-opacity hover:opacity-60 ${isActive ? 'opacity-100' : 'opacity-80'}`;

  return (
    <header className="sticky top-0 z-30 bg-white pt-[env(safe-area-inset-top)]">
      <div className="border-b border-neutral-200 bg-neutral-100">
        <p className="px-3 py-1.5 text-center text-[11px] text-neutral-700 tracking-wide sm:py-2.5 sm:text-[13px]">
          Welcome to AFROLUXO · afroluxo.com
        </p>
      </div>

      <nav className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-1 px-2 py-2 xs:gap-2 xs:px-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-10">
          <div className="flex min-w-0 items-center gap-3 sm:gap-6 lg:gap-10">
            <BrandLogo size="nav" />

            <div className="hidden items-center gap-5 sm:flex">
              <NavLink to="/" end className={linkClass}>
                Home
              </NavLink>
              <NavLink to="/products" className={linkClass}>
                Catalog
              </NavLink>
              <NavLink to="/contact" className={linkClass}>
                Contact
              </NavLink>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <div ref={searchRef} className="relative">
              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                className="inline-flex h-10 w-10 items-center justify-center text-black hover:opacity-60"
                aria-label="Search"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </button>

              {searchOpen && (
                <div className="fixed inset-x-2 top-[calc(env(safe-area-inset-top)+5.5rem)] z-50 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[min(92vw,22rem)] sm:rounded-sm">
                  <input
                    ref={searchInputRef}
                    type="search"
                    enterKeyHint="search"
                    placeholder="Search products…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full border border-neutral-200 px-3 py-3 text-base text-black placeholder:text-neutral-400 focus:border-black focus:outline-none sm:py-2 sm:text-sm"
                  />
                  {showResults && results.length > 0 && (
                    <div className="mt-2 max-h-64 overflow-auto border-t border-neutral-100 pt-2">
                      {results.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="flex w-full items-center gap-3 px-1 py-2 text-left hover:bg-neutral-50"
                          onClick={() => {
                            setShowResults(false);
                            setSearchOpen(false);
                            setQuery('');
                            navigate(`/products?search=${encodeURIComponent(p.name)}`);
                          }}
                        >
                          <div className="h-10 w-10 shrink-0 overflow-hidden bg-neutral-100">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm text-black">{p.name}</p>
                            <p className="text-xs text-neutral-500">{formatRwf(p.price)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showResults && query.trim() && results.length === 0 && (
                    <p className="mt-2 text-center text-xs text-neutral-400">No results</p>
                  )}
                </div>
              )}
            </div>

            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    openAuthModal('login');
                    return;
                  }
                  setAccountOpen((v) => !v);
                }}
                className="inline-flex h-10 w-10 items-center justify-center text-black hover:opacity-60"
                aria-label="Account"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </button>
              {isAuthenticated && accountOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-44 border border-neutral-200 bg-white py-2 text-sm shadow-lg">
                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <NavLink
                      to="/admin/dashboard"
                      onClick={() => setAccountOpen(false)}
                      className="block px-4 py-2 text-black hover:bg-neutral-50"
                    >
                      Dashboard
                    </NavLink>
                  )}
                  <NavLink
                    to="/customer/dashboard"
                    onClick={() => setAccountOpen(false)}
                    className="block px-4 py-2 text-black hover:bg-neutral-50"
                  >
                    My orders
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountOpen(false);
                      handleLogout();
                    }}
                    className="w-full px-4 py-2 text-left text-neutral-600 hover:bg-neutral-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>

            <NavLink
              to="/cart"
              className="relative inline-flex h-10 w-10 items-center justify-center text-black hover:opacity-60"
              aria-label="Cart"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] font-medium text-white">
                  {totalItems}
                </span>
              )}
            </NavLink>

            <button
              type="button"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label="Toggle navigation"
              className="inline-flex h-10 w-10 items-center justify-center text-black sm:hidden"
              onClick={() => setOpen(!open)}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <div className={`fixed inset-0 z-50 transition-visibility duration-300 sm:hidden ${open ? 'visible' : 'invisible'}`}>
        <div
          className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setOpen(false)}
        />
        <div
          className={`absolute right-0 top-0 flex h-full w-[280px] max-w-[85vw] flex-col bg-white shadow-xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
            <BrandLogo size="nav" to="/" />
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="p-1">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex flex-col gap-1 p-3">
            <NavLink to="/" end onClick={() => setOpen(false)} className="px-3 py-3 text-sm text-black">
              Home
            </NavLink>
            <NavLink to="/products" onClick={() => setOpen(false)} className="px-3 py-3 text-sm text-black">
              Catalog
            </NavLink>
            <NavLink to="/contact" onClick={() => setOpen(false)} className="px-3 py-3 text-sm text-black">
              Contact
            </NavLink>
            {!isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  openAuthModal('login');
                }}
                className="px-3 py-3 text-left text-sm text-black"
              >
                Account
              </button>
            ) : (
              <>
                <NavLink to="/customer/dashboard" onClick={() => setOpen(false)} className="px-3 py-3 text-sm text-black">
                  My orders
                </NavLink>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                  className="px-3 py-3 text-left text-sm text-neutral-600"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
