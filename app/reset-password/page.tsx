'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updatePassword } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setUserEmail(user.email);
      }
    });
  }, []);

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
    
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 8 characters long and contain at least one number and one special character (!@#$%^&*).');
      setLoading(false);
      return;
    }

    try {
      await updatePassword(password);
      setSuccessMessage('Password updated successfully. Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
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
                Set New Password
              </h1>
              <p className="text-[15px] text-text-secondary">
                {userEmail ? (
                  <>Resetting password for <strong className="text-text-primary">{userEmail}</strong></>
                ) : (
                  'Enter your new password below'
                )}
              </p>
            </div>
          </div>

        {successMessage ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-success/30 text-success text-[15px] font-medium text-center">
            {successMessage}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-[14px] font-bold text-text-primary tracking-wide uppercase">
                New Password
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
                Confirm New Password
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
                  Updating…
                </span>
              ) : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
