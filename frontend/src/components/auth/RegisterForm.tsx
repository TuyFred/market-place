import { useState } from 'react';
import axios from 'axios';

type Props = {
  onRegistered?: (payload?: { email: string }) => void;
  variant?: 'dark' | 'light';
};

export function RegisterForm({ onRegistered, variant = 'light' }: Props) {
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const inpLight =
    'w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all';
  const inpDark =
    'w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all';
  const inp = variant === 'dark' ? inpDark : inpLight;

  const goToLogin = () => onRegistered?.({ email: email.trim() });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords mismatch');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/auth/register', {
        fullName,
        contactNumber,
        address,
        email,
        password,
        confirmPassword,
      });
      setDone(true);
      setTimeout(() => goToLogin(), 2200);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message || err.response?.data?.error || err.message
        : '';
      if (!err || (axios.isAxiosError(err) && !err.response)) {
        setError('Cannot reach the server. Start the backend and check Supabase keys.');
      } else {
        setError(typeof msg === 'string' && msg ? msg : 'Could not create account. Check your details.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-4 py-2 text-center">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
            variant === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h3
            className={`text-base font-bold ${variant === 'dark' ? 'text-white' : 'text-black'}`}
          >
            Your account has been created successfully
          </h3>
          <p className={`mt-2 text-sm ${variant === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>
            Redirecting you to sign in…
          </p>
        </div>
        <button
          type="button"
          onClick={goToLogin}
          className={
            variant === 'dark'
              ? 'w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-slate-900'
              : 'w-full rounded-xl bg-black py-3 text-sm font-semibold text-white'
          }
        >
          Continue to login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="ml-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">Name</label>
          <input className={inp} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="ml-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">Phone</label>
          <input
            className={inp}
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="ml-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">Email</label>
        <input
          type="email"
          className={inp}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="ml-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">Address</label>
        <input
          className={inp}
          placeholder="Your delivery address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="relative space-y-1">
          <label className="ml-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            className={`${inp} pr-10`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-label="Password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        <div className="relative space-y-1">
          <label className="ml-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">Confirm</label>
          <input
            type={showConfirm ? 'text' : 'password'}
            className={`${inp} pr-10`}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            aria-label="Confirm password"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((s) => !s)}
            aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
          >
            {showConfirm ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/10 bg-red-500/10 py-1.5 text-center text-[10px] text-red-500">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={
          variant === 'dark'
            ? 'w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-slate-900 shadow-lg transition-all disabled:opacity-50'
            : 'w-full rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 py-3 text-sm font-bold text-white shadow-lg transition-all hover:from-amber-500 disabled:opacity-50'
        }
      >
        {loading ? 'Creating…' : 'Create Account'}
      </button>
    </form>
  );
}
