import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

type Props = {
  onSuccess?: (payload: {
    user: { id: string; email: string; role: string; fullName?: string };
    accessToken: string;
  }) => void;
  onNeedAccount?: () => void;
  onForgotPassword?: () => void;
  variant?: 'dark' | 'light';
  initialEmail?: string;
  bannerMessage?: string;
};

export function LoginForm({
  onSuccess,
  onNeedAccount,
  onForgotPassword,
  variant = 'light',
  initialEmail = '',
  bannerMessage = '',
}: Props) {
  const [email, setEmail] = useState(initialEmail);
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
      localStorage.removeItem('demo_mode');
      onSuccess?.({ user, accessToken });
    } catch (err: unknown) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 401 || status === 403) {
        setError('Invalid email or password. Create an account if you do not have one.');
      } else if (!err || (axios.isAxiosError(err) && !err.response)) {
        setError('Cannot reach the server. Check your connection and try again.');
      } else {
        setError('Invalid email or password. Create an account if you do not have one.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inpLight =
    'w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all';
  const inpDark =
    'w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all';
  const inp = variant === 'dark' ? inpDark : inpLight;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {bannerMessage && (
        <div
          className={
            variant === 'dark'
              ? 'rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-center text-[12px] font-medium text-emerald-300'
              : 'rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-center text-[12px] font-medium text-emerald-800'
          }
        >
          {bannerMessage}
        </div>
      )}
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
            autoComplete="email"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-end px-1">
          <label className="text-[11px] font-medium text-slate-400">Password</label>
          {onForgotPassword ? (
            <button
              type="button"
              onClick={onForgotPassword}
              className={`text-[11px] font-semibold ${variant === 'dark' ? 'text-amber-300' : 'text-neutral-600'} hover:underline`}
            >
              Forgot password?
            </button>
          ) : (
            <Link
              to="/forgot-password"
              className={`text-[11px] font-semibold ${variant === 'dark' ? 'text-amber-300' : 'text-neutral-600'} hover:underline`}
            >
              Forgot password?
            </Link>
          )}
        </div>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            className={`${inp} pr-12`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            aria-label="Password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-100"
          >
            {showPassword ? 'Hide' : 'Show'}
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
            : 'w-full py-3 bg-black text-white rounded-xl text-sm font-semibold shadow transition-transform active:scale-95 disabled:opacity-50'
        }
      >
        {loading ? 'Signing in…' : 'Sign In'}
      </button>

      {onNeedAccount && (
        <p className={`text-center text-[12px] ${variant === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>
          No account?{' '}
          <button
            type="button"
            onClick={onNeedAccount}
            className={
              variant === 'dark'
                ? 'font-semibold text-amber-300 hover:underline'
                : 'font-semibold text-black hover:underline'
            }
          >
            Create one
          </button>
        </p>
      )}
    </form>
  );
}
