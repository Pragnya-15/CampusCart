import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/Logo';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        setError(error.message);
      } else {
        setSent(true);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-navy-950 via-navy-900 to-brand-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/"><Logo size="lg" light /></Link>
        </div>
        <div className="glass rounded-3xl p-8 shadow-2xl">
          <h1 className="font-display font-bold text-2xl text-white text-center">Reset Password</h1>
          <p className="text-slate-300 text-center mt-2 text-sm">
            Enter your email and we'll send you a reset link.
          </p>

          {sent ? (
            <div className="mt-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-sm flex items-center gap-2">
              <CheckCircle2 size={18} />
              Reset link sent! Check your email inbox.
            </div>
          ) : (
            <>
              {error && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm flex items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="label text-slate-200">Email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@college.edu"
                      className="input bg-white/10 border-white/20 text-white placeholder-slate-400 pl-10"
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full bg-white text-navy-700 hover:bg-slate-100">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-navy-300 border-t-navy-700 rounded-full animate-spin" />
                  ) : (
                    <>Send Reset Link <ArrowRight size={18} /></>
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center text-sm text-slate-300">
            <Link to="/login" className="text-brand-300 hover:text-brand-200">Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
