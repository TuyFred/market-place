import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { BrandLogo } from '../components/layout/BrandLogo';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => params.get('token') || '', [params]);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('This reset link is invalid. Request a new one.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 1800);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : null;
      setError(typeof msg === 'string' ? msg : 'Could not update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <BrandLogo size="nav" to="/" />
      <h1 className="mt-8 text-2xl font-bold tracking-tight">Set new password</h1>
      <p className="mt-2 text-sm text-neutral-500">Choose a strong password for your AFROLUXO account.</p>

      {done ? (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm">
          Password updated. Redirecting to sign in…
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-neutral-400">New password</label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-black focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-neutral-400">Confirm password</label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-black focus:outline-none"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-xs font-medium text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !token}
            className="w-full rounded-xl bg-black py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Update password'}
          </button>
          <p className="text-center text-sm text-neutral-500">
            <Link to="/forgot-password" className="font-semibold text-black underline">
              Request a new link
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
