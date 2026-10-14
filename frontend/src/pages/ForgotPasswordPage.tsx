import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { BrandLogo } from '../components/layout/BrandLogo';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/auth/forgot-password', { email: email.trim() });
      setDone(true);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : null;
      setError(typeof msg === 'string' ? msg : 'Could not send reset email. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <BrandLogo size="nav" to="/" />
      <h1 className="mt-8 text-2xl font-bold tracking-tight">Forgot password</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Enter your account email and we will send a reset link (expires in 30 minutes).
      </p>

      {done ? (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700">
          If an account exists for that email, a reset link has been sent. Check your inbox and spam folder.
          <Link to="/login" className="mt-4 block font-semibold text-black underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-neutral-400">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-black focus:outline-none"
              placeholder="you@email.com"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-xs font-medium text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
          <p className="text-center text-sm text-neutral-500">
            <Link to="/login" className="font-semibold text-black underline">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
