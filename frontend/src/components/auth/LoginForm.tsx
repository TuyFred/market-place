import { useState } from 'react';
import axios from 'axios';
import { DEMO_ADMIN, enterDemoAdminSession, tryDemoLogin } from '../../config/demoAuth';

type Props = {
  onSuccess?: (payload: {
    user: { id: string; email: string; role: string; fullName?: string };
    accessToken: string;
  }) => void;
  variant?: 'dark' | 'light';
};

export function LoginForm({ onSuccess, variant = 'light' }: Props) {
  const [email, setEmail] = useState(DEMO_ADMIN.email);
  const [password, setPassword] = useState(DEMO_ADMIN.password);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const finishDemo = () => {
    enterDemoAdminSession();
    onSuccess?.({
      user: { ...DEMO_ADMIN.user },
      accessToken: DEMO_ADMIN.token,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const demo = tryDemoLogin(email, password);
    if (demo) {
      enterDemoAdminSession();
      onSuccess?.(demo);
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { user, accessToken } = res.data;
      localStorage.removeItem('demo_mode');
      onSuccess?.({ user, accessToken });
    } catch {
      setError('Invalid credentials. For demo use admin@system.com / admin123@');
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
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-end px-1">
          <label className="text-[11px] font-medium text-slate-400">Password</label>
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

      <button
        type="button"
        onClick={finishDemo}
        className={
          variant === 'dark'
            ? 'w-full py-3 rounded-xl text-sm font-semibold border border-amber-400/40 text-amber-300 hover:bg-amber-400/10'
            : 'w-full py-3 rounded-xl text-sm font-semibold border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
        }
      >
        Enter demo admin (no database)
      </button>

      <p
        className={`text-center text-[11px] ${variant === 'dark' ? 'text-slate-500' : 'text-neutral-400'}`}
      >
        Demo: {DEMO_ADMIN.email} / {DEMO_ADMIN.password}
      </p>
    </form>
  );
}
