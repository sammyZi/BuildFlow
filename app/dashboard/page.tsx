'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Sparkles, ArrowUp, Loader2, Zap, SlidersHorizontal } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [appIdea, setAppIdea] = useState('');
  const [mode, setMode] = useState<'fast' | 'detailed'>('fast');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const idea = appIdea.trim();
    if (!idea || isLoading) return;
    if (idea.length < 10) {
      setError('Please describe your idea in at least 10 characters');
      return;
    }

    if (mode === 'detailed') {
      // Go to questionnaire page
      router.push(`/dashboard/questionnaire?idea=${encodeURIComponent(idea)}`);
      return;
    }

    // Fast mode — generate immediately
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error('Authentication error. Please sign in again.');

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ appIdea: idea, userId: session.user.id })
      });

      if (!response.ok) {
        let msg = 'Failed to generate artifacts';
        try { const d = await response.json(); msg = d.error || msg; } catch { }
        throw new Error(msg);
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Generation failed');

      router.push(`/dashboard/results/${data.projectId}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-bg">
      <div className="min-h-full flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-[620px] mx-auto">

          {/* Icon */}
          <div className="flex justify-center mb-5 animate-fade-in-up">

          </div>

          {/* Heading */}
          <div className="text-center mb-8 animate-fade-in-up anim-delay-1">
            <h1 className="text-[34px] md:text-[42px] font-extrabold text-text-primary tracking-tight leading-[1.1] mb-2">
              What would you like
              <br />
              <span className="text-primary">to build?</span>
            </h1>
            <p className="text-[14px] text-text-muted max-w-sm mx-auto leading-relaxed">
              Describe your app idea. Choose Fast for instant results or Detailed for a guided questionnaire.
            </p>
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="w-full animate-fade-in-up anim-delay-2">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={appIdea}
                onChange={(e) => { setAppIdea(e.target.value); if (error) setError(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                disabled={isLoading}
                placeholder="e.g. A social media analytics dashboard that tracks engagement across platforms..."
                className="w-full min-h-[120px] p-4 pr-14 rounded-xl border border-border bg-surface text-[14px] text-text-secondary placeholder:text-text-faint resize-none focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                rows={4}
              />
              <button
                type="submit"
                disabled={!appIdea.trim() || isLoading}
                className="absolute bottom-3 right-3 w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary-hover disabled:opacity-20 disabled:cursor-not-allowed transition-colors active:scale-95"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ArrowUp size={16} strokeWidth={2.5} />
                )}
              </button>
            </div>

            {/* Mode toggle */}
            <div className="mt-3 flex items-center gap-1 animate-fade-in-up anim-delay-3">
              <div className="inline-flex bg-surface-alt rounded-lg p-0.5 border border-border-light">
                <button
                  type="button"
                  onClick={() => setMode('fast')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all ${mode === 'fast'
                      ? 'bg-surface text-text-primary border border-border'
                      : 'text-text-muted hover:text-text-secondary border border-transparent'
                    }`}
                >
                  <Zap size={13} strokeWidth={2} />
                  Fast
                </button>
                <button
                  type="button"
                  onClick={() => setMode('detailed')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all ${mode === 'detailed'
                      ? 'bg-surface text-text-primary border border-border'
                      : 'text-text-muted hover:text-text-secondary border border-transparent'
                    }`}
                >
                  <SlidersHorizontal size={13} strokeWidth={2} />
                  Detailed
                </button>
              </div>
              <span className="text-[11px] text-text-faint ml-2">
                {mode === 'fast' ? 'Generate instantly' : 'Answer questions first'}
              </span>
            </div>

            {error && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-error text-[12px] font-medium text-center animate-fade-in">
                {error}
              </div>
            )}

            {isLoading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-primary text-[12px] font-medium animate-fade-in">
                <Loader2 size={14} className="animate-spin" />
                Generating your architecture docs…
              </div>
            )}
          </form>

        </div>
      </div>
    </div>
  );
}
