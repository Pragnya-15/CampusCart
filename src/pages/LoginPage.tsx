import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Book, Calculator, Laptop, Recycle, ShieldCheck, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string })?.from || '/dashboard';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      navigate(from);
    }
  }

  return (
    <div className="min-h-screen flex bg-navy-950">
      {/* LEFT — Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-brand-900 flex-col justify-between p-12 xl:p-16">
        {/* Decorative blobs */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-brand-500 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-navy-500 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        {/* Floating icon grid */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <div className="grid grid-cols-4 gap-6">
            {[
              { icon: Book, color: 'text-blue-400' },
              { icon: Calculator, color: 'text-emerald-400' },
              { icon: Laptop, color: 'text-amber-400' },
              { icon: Recycle, color: 'text-pink-400' },
              { icon: Laptop, color: 'text-cyan-400' },
              { icon: Book, color: 'text-orange-400' },
              { icon: Calculator, color: 'text-purple-400' },
              { icon: Recycle, color: 'text-teal-400' },
            ].map((item, i) => (
              <div key={i} className={`w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center ${item.color} animate-float`} style={{ animationDelay: `${i * 0.4}s` }}>
                <item.icon size={28} strokeWidth={1.5} />
              </div>
            ))}
          </div>
        </div>

        {/* Top — Logo */}
        <div className="relative z-10">
          <Link to="/"><Logo size="lg" light /></Link>
        </div>

        {/* Center — Headline */}
        <div className="relative z-10">
          <h1 className="font-display font-bold text-4xl xl:text-5xl text-white leading-tight tracking-tight">
            Buy. Sell.<br />
            Rent. Swap.
          </h1>
          <p className="mt-5 text-lg text-slate-300 max-w-md leading-relaxed">
            Your trusted student marketplace for affordable academic and everyday essentials.
          </p>

          {/* Benefits */}
          <div className="mt-8 space-y-3">
            {[
              { icon: ShieldCheck, text: 'Student-focused marketplace' },
              { icon: TrendingUp, text: 'Affordable second-hand items' },
              { icon: Recycle, text: 'Safe campus exchange' },
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-200">
                <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-400/30 flex items-center justify-center flex-shrink-0">
                  <benefit.icon size={16} className="text-brand-300" />
                </div>
                <span className="text-sm font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — Stats */}
        <div className="relative z-10 flex items-center gap-8">
          <div>
            <p className="font-display font-bold text-2xl text-white">500+</p>
            <p className="text-xs text-slate-400">Active Listings</p>
          </div>
          <div className="w-px h-10 bg-white/15" />
          <div>
            <p className="font-display font-bold text-2xl text-white">1,200+</p>
            <p className="text-xs text-slate-400">Students</p>
          </div>
          <div className="w-px h-10 bg-white/15" />
          <div>
            <p className="font-display font-bold text-2xl text-white">300+</p>
            <p className="text-xs text-slate-400">Exchanges</p>
          </div>
        </div>
      </div>

      {/* RIGHT — Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 sm:px-12 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-block"><Logo size="lg" /></Link>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-10">
            <div className="mb-8">
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-navy-900">
                Welcome back
              </h1>
              <p className="text-slate-500 mt-2 text-sm">
                Sign in to continue to CampusCart
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2 animate-slide-down">
                <AlertCircle size={18} className="flex-shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@college.edu"
                    className="input pl-11"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Password</label>
                  <Link to="/forgot-password" className="text-xs font-medium text-navy-600 hover:text-navy-700 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="input pl-11 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Sign In <ArrowRight size={18} /></>
                )}
              </button>
            </form>

            <div className="mt-7 pt-6 border-t border-slate-100 text-center text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/signup" className="text-navy-600 hover:text-navy-700 font-semibold hover:underline">
                Create Account &rarr;
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            By signing in, you agree to CampusCart's Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
