'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '@/lib/supabase/auth';

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
    <main className="min-h-screen flex items-center justify-center bg-chat-sidebar1 font-sans selection:bg-chat-accent/20 px-4">
      <div className="w-full max-w-[420px] bg-white rounded-3xl p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-chat-border">
        
        {/* Logo / Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-chat-accent text-white flex items-center justify-center shadow-lg shadow-chat-accent/30 mb-5">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
          </div>
          <h1 className="text-2xl font-extrabold text-chat-text tracking-tight mb-1">
            Welcome back
          </h1>
          <p className="text-[15px] text-chat-textMuted text-center">
            {isSignUp ? 'Enter your details to create an account' : 'Sign in to AI Architect Hub to continue'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-[13px] font-bold text-chat-text tracking-wide">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-chat-border bg-chat-sidebar1 focus:bg-white focus:outline-none focus:ring-2 focus:ring-chat-accent/20 focus:border-chat-accent text-[15px] text-chat-text placeholder:text-chat-textMuted/60 transition-all"
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-[13px] font-bold text-chat-text tracking-wide">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border border-chat-border bg-chat-sidebar1 focus:bg-white focus:outline-none focus:ring-2 focus:ring-chat-accent/20 focus:border-chat-accent text-[15px] text-chat-text placeholder:text-chat-textMuted/60 transition-all"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] font-medium text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 mt-2 rounded-xl bg-chat-accent text-white font-bold hover:bg-chat-accentHover focus:outline-none focus:ring-4 focus:ring-chat-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-chat-accent/20"
          >
            {loading ? (
               <span className="flex items-center justify-center gap-2">
                 <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                 </svg>
                 Processing...
               </span>
            ) : isSignUp ? 'Create account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="text-[14px] font-semibold text-chat-textMuted hover:text-chat-accent transition-colors"
            disabled={loading}
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </main>
  );
}
