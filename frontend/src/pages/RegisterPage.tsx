import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '../components/auth/RegisterForm';

export default function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f2540] flex items-center justify-center p-6">
      <div className="relative w-full max-w-[420px]">
        {/* reuse ring but static (hidden on small screens) */}
        <div className="absolute inset-0 hidden sm:flex items-center justify-center pointer-events-none">
          <div className="relative w-[380px] h-[380px]">
            <div className="absolute inset-0 transform-gpu animate-spin-slow">
              {Array.from({ length: 36 }).map((_, i) => {
                const angle = (360 / 36) * i;
                const isHighlight = i >= 28 && i <= 33;
                return (
                  <div
                    key={i}
                    style={{ transform: `rotate(${angle}deg) translateY(-170px)` }}
                    className="origin-center absolute left-1/2 top-1/2"
                  >
                    <div
                      className={`w-1.5 h-6 rounded-md ${isHighlight ? 'bg-amber-400 shadow-[0_0_8px_rgba(249,115,22,0.7)]' : 'bg-slate-600/40'}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="relative mx-auto bg-[#0b1726]/95 border border-slate-800 rounded-2xl shadow-2xl px-8 py-8 w-full">
          <div className="mb-6">
            <a href="/" className="text-slate-400 hover:text-amber-400 text-xs flex items-center gap-1 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Back to Home
            </a>
          </div>
          <h2 className="text-2xl text-amber-400 font-bold text-center mb-3">CREATE ACCOUNT</h2>
          <p className="text-center text-sm text-slate-300 mb-4">Sign up to track orders and save your details.</p>

          <RegisterForm variant="dark" onRegistered={() => navigate('/login')} />

          <div className="mt-5 text-center text-sm">
            <a href="/login" className="text-amber-400 font-semibold">Sign in</a>
          </div>
        </div>
      </div>
    </div>
  );
}
