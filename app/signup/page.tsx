'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { Loader2, Mail, Lock, Sparkles, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard');
      }
    });
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Constraint: at least 8 chars, 1 number, 1 special char
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 8 characters long and contain at least one number and one special character (!@#$%^&*).');
      setLoading(false);
      return;
    }

    try {
      const data = await signUp(email, password);
      if (data.user && !data.session) {
        setSuccessMessage('Please check your email (and spam folder) for a verification link to complete your registration.');
        return;
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-bg focus:bg-surface focus:outline-none focus:ring-0 focus:border-primary text-[16px] text-text-secondary placeholder:text-text-faint transition-colors dark:border-[#2A3142] dark:bg-[#0E1320] dark:focus:bg-[#161B29] dark:text-slate-200 dark:placeholder:text-slate-500';

  return (
    <main className="auth-shell min-h-screen flex items-center justify-center bg-bg dark:bg-[#0E1320] font-sans px-4 py-10 relative overflow-hidden">
      {/* Premium Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 dark:bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-1000" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/20 dark:bg-indigo-400/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-1000" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-[440px] relative z-10 px-6">
        {/* Header */}
        <div className="flex flex-col items-center mb-8 gap-4">
          <div className="p-3 bg-surface dark:bg-[#161B29] rounded-2xl shadow-sm border border-border dark:border-white/5">
            <Logo className="w-11 h-11" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-text-primary dark:text-slate-100 tracking-tight mb-2">
              Create your account
            </h1>
            <p className="text-[15px] text-text-secondary dark:text-slate-400">
              Start building with BuildFlow
            </p>
          </div>
        </div>

        {successMessage ? (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-success/30 dark:border-emerald-500/20 rounded-2xl p-6 text-center animate-fade-in-up">
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={24} className="text-success" />
            </div>
            <h2 className="text-[18px] font-bold text-text-primary dark:text-slate-100 mb-2">Check your email</h2>
            <p className="text-[15px] text-text-secondary dark:text-slate-400 leading-relaxed mb-6">
              {successMessage}
            </p>
            <Link
              href="/login"
              className="block w-full py-3 px-4 rounded-xl bg-surface dark:bg-[#161B29] border border-border dark:border-white/10 text-text-primary dark:text-slate-100 font-bold hover:bg-surface-alt dark:hover:bg-[#1B2233] transition-colors"
            >
              Go to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[14px] font-bold text-text-primary dark:text-slate-200 tracking-wide uppercase">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-faint dark:text-slate-500" strokeWidth={1.5} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-[14px] font-bold text-text-primary dark:text-slate-200 tracking-wide uppercase">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-faint dark:text-slate-500" strokeWidth={1.5} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={inputClass.replace('pr-4', 'pr-11')}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-secondary transition-colors dark:text-slate-500 dark:hover:text-slate-300"
                    tabIndex={-1}
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-[14px] font-bold text-text-primary dark:text-slate-200 tracking-wide uppercase">
                  Confirm
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-faint dark:text-slate-500" strokeWidth={1.5} />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={inputClass.replace('pr-4', 'pr-11')}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-secondary transition-colors dark:text-slate-500 dark:hover:text-slate-300"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[12px] text-text-faint dark:text-slate-500 leading-relaxed">
              Use at least 8 characters with a number and a special character (!@#$%^&amp;*).
            </p>

            <div className="flex items-start gap-2.5 bg-surface dark:bg-[#161B29] p-3.5 rounded-xl border border-border/60 dark:border-white/5">
              <input
                id="privacy"
                type="checkbox"
                required
                className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-bg bg-bg dark:border-[#2A3142] dark:bg-[#0E1320]"
              />
              <label htmlFor="privacy" className="text-[13px] text-text-secondary dark:text-slate-400 leading-tight">
                I agree to the{' '}
                <Link href="/privacy" className="text-primary hover:underline hover:text-primary-hover font-bold" target="_blank">
                  Privacy Policy
                </Link>
                .
              </label>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-error dark:text-red-300 text-[14px] font-medium text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 mt-1 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Creating account…
                </span>
              ) : 'Create account'}
            </button>
          </form>
        )}

        {!successMessage && (
          <>
            <div className="mt-7 text-center">
              <p className="text-[14px] text-text-secondary dark:text-slate-400">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-bold text-primary hover:text-primary-hover transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>

            {/* Trust / feature highlights */}
            <div className="mt-8 flex items-center justify-center gap-4 text-[12.5px] font-medium text-text-muted dark:text-slate-500">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> Fast AI generation
              </span>
              <span className="w-1 h-1 rounded-full bg-border dark:bg-slate-600" />
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Private &amp; secure
              </span>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
