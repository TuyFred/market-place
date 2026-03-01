import { useState } from 'react';
import axios from 'axios';

type Props = { onRegistered?: () => void; variant?: 'dark' | 'light' };

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
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const inpLight = "w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all";
  const inpDark = "w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all";
  const inp = variant === 'dark' ? inpDark : inpLight;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (password !== confirmPassword) { setError('Passwords mismatch'); return; }
    setLoading(true);
    try {
      await axios.post('/api/auth/register', { fullName, contactNumber, address, email, password, confirmPassword });
      setSuccess('Account ready!');
      setTimeout(() => onRegistered?.(), 1000);
    } catch {
      setError('Check your details');
    } finally {
      setLoading(false);
    }
  };

  return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold ml-1">Name</label>
          <input className={inp} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold ml-1">Phone</label>
          <input className={inp} value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} required />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold ml-1">Email</label>
        <input type="email" className={inp} value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 relative">
          <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold ml-1">Password</label>
          <input type={showPassword ? 'text' : 'password'} className={`${inp} pr-10`} value={password} onChange={(e) => setPassword(e.target.value)} required aria-label="Password" />
          <button type="button" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
            {showPassword ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
          </button>
        </div>
        <div className="space-y-1 relative">
          <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold ml-1">Confirm</label>
          <input type={showConfirm ? 'text' : 'password'} className={`${inp} pr-10`} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required aria-label="Confirm password" />
          <button type="button" onClick={() => setShowConfirm(s => !s)} aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
            {showConfirm ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
          </button>
        </div>
      </div>

      {error && <div className="text-[10px] text-red-500 text-center bg-red-500/10 py-1 rounded-lg border border-red-500/10">{error}</div>}
      {success && <div className="text-[10px] text-emerald-500 text-center bg-emerald-500/10 py-1 rounded-lg border border-emerald-500/10">{success}</div>}

      <button
        type="submit"
        disabled={loading}
        className={
          variant === 'dark'
            ? 'w-full py-3 bg-amber-500 text-slate-900 rounded-xl text-sm font-bold shadow-lg transition-all'
            : 'w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 text-white rounded-xl text-sm font-bold shadow-lg transition-all'
        }
      >
        {loading ? 'Creating...' : 'Create Account'}
      </button>
    </form>
  );
}
