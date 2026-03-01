import { useState } from 'react';
import axios from 'axios';

type Props = {
  onSuccess?: (payload: { user: { id: string; email: string; role: string; fullName?: string }; accessToken: string }) => void;
  variant?: 'dark' | 'light';
};

export function LoginForm({ onSuccess, variant = 'light' }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { user, accessToken } = res.data;
      onSuccess?.({ user, accessToken });
    } catch {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const inpLight = "w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all";
  const inpDark = "w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all";
  const inp = variant === 'dark' ? inpDark : inpLight;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-slate-400 ml-1">Email Address</label>
        <div className="relative">
          <input
            type="email"
            placeholder="Email"
            className={`${inp} pr-10`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg width="16" height="12" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 2.5C1 1.67 1.67 1 2.5 1H17.5C18.33 1 19 1.67 19 2.5V11.5C19 12.33 18.33 13 17.5 13H2.5C1.67 13 1 12.33 1 11.5V2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-end px-1">
          <label className="text-[11px] font-medium text-slate-400">Password</label>
          <button type="button" className="text-[11px] text-amber-300/90 hover:text-amber-300 font-semibold">Forgot?</button>
        </div>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            className={`${inp} pr-12`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-label="Password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-100"
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.58 10.58a3 3 0 004.24 4.24" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.88 5.79c1.22-.28 2.48-.28 3.7 0 4.66 1.07 7.7 5.34 7.7 5.34a15.35 15.35 0 01-3.98 3.44" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-[11px] text-red-500 text-center font-medium bg-red-500/10 py-1.5 rounded-lg border border-red-500/20">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={
          variant === 'dark'
            ? 'w-full py-3 bg-amber-500 text-slate-900 rounded-xl text-sm font-bold shadow-lg transition-transform active:scale-95 disabled:opacity-50'
            : 'w-full py-3 bg-accent text-white rounded-xl text-sm font-semibold shadow transition-transform active:scale-95 disabled:opacity-50'
        }
      >
        {loading ? 'Signing in…' : 'Sign In'}
      </button>

      {/* social minimal */}
      <div className="pt-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="text-[9px] uppercase tracking-tighter text-slate-600">Quick sign in</span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>
        <div className="flex gap-2">
          <button type="button" aria-label="Sign in with Google" className="flex-1 py-3 bg-slate-800/30 border border-slate-700/30 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-800/50 transition-colors">Google</button>
          <button type="button" aria-label="Sign in with Facebook" className="flex-1 py-3 bg-slate-800/30 border border-slate-700/30 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-800/50 transition-colors">Facebook</button>
        </div>
      </div>
    </form>
  );
}
