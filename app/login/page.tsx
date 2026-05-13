'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '@/lib/supabase/auth';
import { Layers, Loader2, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg font-sans px-4">
      <div className="w-full max-w-[400px] bg-surface rounded-2xl p-8 md:p-10 border border-border"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center mb-5"
            style={{ boxShadow: '0 6px 20px rgba(124,92,252,0.2)' }}
          >
            <Layers size={22} strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight mb-1">
            {isSignUp ? 'Create account' : 'Welcome back'}
          </h1>
          <p className="text-[14px] text-text-muted text-center">
            {isSignUp ? 'Enter your details to get started' : 'Sign in to AI Architect Hub'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-[12px] font-bold text-text-primary tracking-wide uppercase">
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
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-bg focus:bg-surface focus:outline-none focus:ring-0 focus:border-primary text-[14px] text-text-secondary placeholder:text-text-faint transition-colors"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-[12px] font-bold text-text-primary tracking-wide uppercase">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-faint" strokeWidth={1.5} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-bg focus:bg-surface focus:outline-none focus:ring-0 focus:border-primary text-[14px] text-text-secondary placeholder:text-text-faint transition-colors"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-error text-[13px] font-medium text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 mt-2 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ boxShadow: '0 4px 12px rgba(124,92,252,0.15)' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Processing…
              </span>
            ) : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="text-[13px] font-semibold text-text-muted hover:text-primary transition-colors"
            disabled={loading}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </main>
  );
}
