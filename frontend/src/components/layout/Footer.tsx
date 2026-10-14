import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { BRAND } from '../../config/brand';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from './BrandLogo';

export function Footer() {
  const { openAuthModal } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [msg, setMsg] = useState('');

  const onSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMsg('');
    try {
      const res = await axios.post('/api/newsletter/subscribe', { email: email.trim() });
      setStatus('ok');
      setMsg(res.data?.message || 'Thanks for subscribing!');
      setEmail('');
    } catch (err: unknown) {
      setStatus('err');
      const m = axios.isAxiosError(err) ? err.response?.data?.message : null;
      setMsg(typeof m === 'string' ? m : 'Could not subscribe. Try again.');
    }
  };

  return (
    <footer className="mt-auto border-t border-neutral-200 bg-gradient-to-b from-neutral-50 to-white text-black pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1.3fr]">
          <div>
            <BrandLogo size="nav" to="/" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-500">{BRAND.tagline}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
              {BRAND.location}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">Shop</p>
            <ul className="mt-4 space-y-2.5 text-sm">
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
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">Account</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <button type="button" onClick={() => openAuthModal('login')} className="hover:opacity-60">
                  Sign in
                </button>
              </li>
              <li>
                <Link to="/forgot-password" className="hover:opacity-60">
                  Forgot password
                </Link>
              </li>
              <li>
                <Link to="/customer/dashboard" className="hover:opacity-60">
                  My orders
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">Newsletter</p>
            <p className="mt-3 text-sm text-neutral-500">New drops and offers — straight to your inbox.</p>
            <form onSubmit={onSubscribe} className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="min-h-[44px] flex-1 rounded-full border border-neutral-200 bg-white px-4 text-sm focus:border-black focus:outline-none"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="min-h-[44px] rounded-full bg-black px-5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {status === 'loading' ? '…' : 'Subscribe'}
              </button>
            </form>
            {msg && (
              <p className={`mt-2 text-xs ${status === 'err' ? 'text-red-600' : 'text-neutral-600'}`}>{msg}</p>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-neutral-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>
          <p className="text-xs text-neutral-500">
            Developed by{' '}
            <a
              href="https://github.com/TuyFred"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-black underline-offset-2 hover:underline"
            >
              Cyberfred
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
