import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  User,
  Building2,
  GraduationCap,
  Calendar,
  Book,
  Calculator,
  Recycle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';

export function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    college: '',
    department: '',
    yearOfStudy: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate(): string | null {
    if (!form.fullName.trim()) return 'Full name is required';
    if (!form.email.trim()) return 'Email is required';
    if (!form.email.includes('@')) return 'Please enter a valid email';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    if (!form.college.trim()) return 'College name is required';
    if (!form.department.trim()) return 'Department is required';
    if (!form.yearOfStudy.trim()) return 'Year of study is required';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.fullName, form.college, form.department, form.yearOfStudy);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  }

  return (
    <div className="min-h-screen flex bg-navy-950">
      {/* LEFT — Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-brand-900 flex-col justify-between p-12 xl:p-16">
        {/* Decorative blobs */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-brand-500 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-navy-500 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        {/* Floating icon grid */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <div className="grid grid-cols-4 gap-6">
            {[
              { icon: Book, color: 'text-blue-400' },
              { icon: Calculator, color: 'text-emerald-400' },
              { icon: Recycle, color: 'text-pink-400' },
              { icon: Book, color: 'text-amber-400' },
              { icon: Calculator, color: 'text-cyan-400' },
              { icon: Recycle, color: 'text-purple-400' },
              { icon: Book, color: 'text-orange-400' },
              { icon: Calculator, color: 'text-teal-400' },
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

        {/* Center — Headline + feature cards */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-white mb-6">
            <Sparkles size={14} className="text-brand-300" />
            Join the community
          </div>
          <h1 className="font-display font-bold text-4xl xl:text-5xl text-white leading-tight tracking-tight">
            Join your campus<br />marketplace
          </h1>
          <p className="mt-5 text-lg text-slate-300 max-w-md leading-relaxed">
            Buy what you need. Sell what you no longer use. Give useful items a second life.
          </p>

          {/* Feature cards */}
          <div className="mt-8 space-y-3">
            {[
              { icon: Book, title: 'Buy & Sell Books', color: 'bg-blue-500/20 border-blue-400/30 text-blue-300' },
              { icon: Calculator, title: 'Academic Essentials', color: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300' },
              { icon: Recycle, title: 'Swap & Reuse', color: 'bg-pink-500/20 border-pink-400/30 text-pink-300' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${feature.color}`}>
                  <feature.icon size={18} />
                </div>
                <span className="text-sm font-medium text-slate-200">{feature.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — testimonial-style stat */}
        <div className="relative z-10 glass-dark rounded-2xl p-5 border border-white/10 max-w-md">
          <p className="text-sm text-slate-300 leading-relaxed">
            "I sold my old textbooks and bought a calculator for half the price. CampusCart saved me over ₹2,000 this semester."
          </p>
          <p className="mt-3 text-xs text-slate-400 font-medium">— Pragnya, 3rd Year, NIT Trichy</p>
        </div>
      </div>

      {/* RIGHT — Signup form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-10 sm:px-12 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-lg animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <Link to="/" className="inline-block"><Logo size="lg" /></Link>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-10">
            <div className="mb-7">
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-navy-900">
                Join CampusCart
              </h1>
              <p className="text-slate-500 mt-2 text-sm">
                Create your student marketplace account
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2 animate-slide-down">
                <AlertCircle size={18} className="flex-shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => update('fullName', e.target.value)}
                    required
                    placeholder="John Doe"
                    className="input pl-11"
                  />
                </div>
              </div>

              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    required
                    placeholder="you@college.edu"
                    className="input pl-11"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => update('password', e.target.value)}
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
                <div>
                  <label className="label">Confirm Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={(e) => update('confirmPassword', e.target.value)}
                      required
                      placeholder="••••••••"
                      className="input pl-11"
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">College Name</label>
                  <div className="relative">
                    <Building2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={form.college}
                      onChange={(e) => update('college', e.target.value)}
                      required
                      placeholder="Your College"
                      className="input pl-11"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Department/Course</label>
                  <div className="relative">
                    <GraduationCap size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={form.department}
                      onChange={(e) => update('department', e.target.value)}
                      required
                      placeholder="Computer Science"
                      className="input pl-11"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Year of Study</label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={form.yearOfStudy}
                    onChange={(e) => update('yearOfStudy', e.target.value)}
                    required
                    className="input pl-11"
                  >
                    <option value="">Select year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="5th Year">5th Year</option>
                    <option value="Postgraduate">Postgraduate</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Create Account <ArrowRight size={18} /></>
                )}
              </button>
            </form>

            <div className="mt-7 pt-6 border-t border-slate-100 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-navy-600 hover:text-navy-700 font-semibold hover:underline">
                Login &rarr;
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            By creating an account, you agree to CampusCart's Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
