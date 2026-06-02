'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { Loader2, Mail, Lock, Sparkles, Blocks, Eye, EyeOff } from 'lucide-react';
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

  return (
    <main className="min-h-screen flex font-sans bg-bg">
      {/* Left Pane - Visual / Marketing */}
      <div className="hidden lg:flex w-1/2 bg-[#0A0A0B] relative flex-col justify-between p-12 overflow-hidden border-r border-border">
        {/* Dynamic Background */}
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3 text-white font-bold text-xl">
          <Blocks className="w-8 h-8 text-indigo-400" />
          BuildFlow
        </div>

        {/* Messaging */}
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-semibold text-white mb-6 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Bring your software ideas to life.
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed mb-10">
            Generate comprehensive requirements, scalable architecture, and step-by-step developer tasks in minutes.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
            <div className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-indigo-400" /> Fast AI generation</div>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-700" />
            <div className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-teal-400" /> Granular task breakdown</div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-gray-600 font-medium">
          © {new Date().getFullYear()} BuildFlow. Generative workspace.
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-[420px]">
          {/* Mobile Logo (hidden on desktop) */}
          <div className="flex lg:hidden justify-center mb-8">
            <Logo className="w-12 h-12" />
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-text-primary tracking-tight mb-2">Create an account</h2>
            <p className="text-text-secondary text-[15px]">Join us to start building your next great app.</p>
          </div>

          {successMessage ? (
            <div className="bg-emerald-50 border border-success/30 rounded-2xl p-6 text-center animate-fade-in-up">
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={24} className="text-success" />
              </div>
              <h2 className="text-[18px] font-bold text-text-primary mb-2">Check your email</h2>
              <p className="text-[15px] text-text-secondary leading-relaxed mb-6">
                {successMessage}
              </p>
              <Link
                href="/login"
                className="block w-full py-3 px-4 rounded-xl bg-surface border border-border text-text-primary font-bold hover:bg-surface-alt transition-colors"
              >
                Go to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-[14px] font-bold text-text-primary tracking-wide uppercase">
                  Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-faint" strokeWidth={1.5} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-bg focus:bg-surface focus:outline-none focus:ring-0 focus:border-primary text-[16px] text-text-secondary placeholder:text-text-faint transition-colors"
                    placeholder="you@example.com"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-[14px] font-bold text-text-primary tracking-wide uppercase">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-faint" strokeWidth={1.5} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-border bg-bg focus:bg-surface focus:outline-none focus:ring-0 focus:border-primary text-[16px] text-text-secondary placeholder:text-text-faint transition-colors"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-secondary transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-[14px] font-bold text-text-primary tracking-wide uppercase">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-faint" strokeWidth={1.5} />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-border bg-bg focus:bg-surface focus:outline-none focus:ring-0 focus:border-primary text-[16px] text-text-secondary placeholder:text-text-faint transition-colors"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-secondary transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 mt-4 bg-surface p-4 rounded-xl border border-border/50">
                <input
                  id="privacy"
                  type="checkbox"
                  required
                  className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-bg bg-bg"
                />
                <label htmlFor="privacy" className="text-[13px] text-text-secondary leading-tight">
                  By creating an account, you agree to our{' '}
                  <Link href="/privacy" className="text-primary hover:underline hover:text-primary-hover font-bold" target="_blank">
                    Privacy Policy
                  </Link>
                  . We'll use your email to secure your account.
                </label>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-error text-[15px] font-medium text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 mt-4 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
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
            <div className="mt-8 text-center">
              <p className="text-[14px] text-text-secondary">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-bold text-primary hover:text-primary-hover transition-colors"
                >
                  Sign in instead
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
