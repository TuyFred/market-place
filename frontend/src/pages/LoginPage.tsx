import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { handleLoginSuccess } = useAuth();

  return (
    <div className="min-h-screen bg-[#0f2540] flex items-center justify-center p-6">
      <div className="relative w-full max-w-[420px]">
        {/* animated tick ring (hidden on small screens) */}
        <div className="absolute inset-0 hidden sm:flex items-center justify-center pointer-events-none">
          <div className="relative w-[380px] h-[380px]">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* center circle for subtle glow */}
              <div className="w-[320px] h-[320px] rounded-full bg-transparent" />
            </div>
            <div className="absolute inset-0 transform-gpu animate-spin-slow">
              {Array.from({ length: 36 }).map((_, i) => {
                const angle = (360 / 36) * i;
                const isHighlight = i >= 28 && i <= 33; // small amber segment
                return (
                  <div
                    key={i}
                    style={{ transform: `rotate(${angle}deg) translateY(-170px)` }}
                    className="origin-center absolute left-1/2 top-1/2"
                  >
                    <div
                      className={`w-1.5 h-6 rounded-md ${isHighlight ? 'bg-amber-400 shadow-[0_0_8px_rgba(249,115,22,0.7)]' : 'bg-slate-600/50'}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="relative mx-auto bg-[#0b1726]/95 border border-slate-800 rounded-2xl shadow-2xl px-8 py-8 backdrop-blur-md w-full">
          <h2 className="text-2xl text-amber-400 font-bold text-center mb-3">LOGIN</h2>
          <p className="text-center text-sm text-slate-300 mb-4">Sign in to your account</p>

          <LoginForm
            variant="dark"
            onSuccess={({ user, accessToken }) => {
              handleLoginSuccess({ user, token: accessToken });
              if (user.role === 'admin' || user.role === 'manager') {
                navigate('/admin/dashboard');
              } else {
                navigate('/');
              }
            }}
          />

          <div className="mt-5 text-center text-sm text-slate-300">Forget Your Password ?</div>

          <div className="mt-6 text-center text-sm text-slate-300">log in with</div>
          <div className="mt-3 flex items-center justify-center gap-4">
            <button className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">F</button>
            <button className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center">X</button>
            <button className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center">G</button>
          </div>

          <div className="mt-5 text-center text-sm">
            <a href="/register" className="text-amber-400 font-semibold">Sign Up</a>
          </div>
        </div>
      </div>
    </div>
  );
}
