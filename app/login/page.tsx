'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { Layers, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard');
      }
    });
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg font-sans px-4 relative overflow-hidden">
      {/* Premium Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-pulse duration-1000" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse duration-1000" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-[420px] relative z-10 px-6">
        {/* Header */}
        <div className="flex flex-col items-center mb-10 gap-4">
            <div className="p-3 bg-white/5 rounded-2xl shadow-inner border border-white/10">
              <Logo className="w-12 h-12" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-extrabold text-text-primary tracking-tight mb-2">
                Welcome back
              </h1>
              <p className="text-[15px] text-text-secondary">
                Sign in to BuildFlow
              </p>
            </div>
          </div>

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
                minLength={6}
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

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-error text-[15px] font-medium text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 mt-2 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Processing…
              </span>
            ) : 'Sign in'}
          </button>
        </form>

        <div className="mt-8 text-center relative z-10">
          <Link
            href="/signup"
            className="text-[14px] font-medium text-text-secondary hover:text-primary transition-colors"
          >
            Don't have an account? Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
