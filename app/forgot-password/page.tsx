'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { resetPassword } from '@/lib/supabase/auth';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccessMessage('If an account exists with this email, we have sent a password reset link.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link');
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
                Reset Password
              </h1>
              <p className="text-[15px] text-text-secondary">
                Enter your email to receive a reset link
              </p>
            </div>
          </div>

        {successMessage ? (
          <div className="bg-emerald-50 border border-success/30 rounded-2xl p-6 text-center animate-fade-in-up">
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={24} className="text-success" />
            </div>
            <h2 className="text-[18px] font-bold text-text-primary mb-2">Check your email</h2>
            <p className="text-[15px] text-text-secondary leading-relaxed mb-6">
              {successMessage}
            </p>
            <Link
              href="/login"
              className="block w-full py-3 px-4 rounded-xl bg-surface border border-border text-text-primary font-bold hover:bg-surface-alt transition-colors"
            >
              Back to Sign In
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
                  Sending…
                </span>
              ) : 'Send reset link'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center relative z-10">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
