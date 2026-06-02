'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { ArrowUp, Loader2, Zap, SlidersHorizontal } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [appIdea, setAppIdea] = useState('');
  const [mode, setMode] = useState<'fast' | 'detailed'>('fast');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const idea = appIdea.trim();
    if (!idea || isLoading) return;
    if (idea.length < 10) {
      setError('Please describe your idea in at least 10 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error('Authentication error. Please sign in again.');

      if (mode === 'detailed') {
        // Create project upfront for detailed mode
        const response = await fetch('/api/projects/autosave', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            idea,
            status: 'draft',
            current_step: 'questions',
            state_data: {}
          })
        });

        if (!response.ok) {
          let msg = 'Failed to create project';
          try { const d = await response.json(); msg = d.error || msg; } catch { }
          throw new Error(msg);
        }

        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Failed to create project');

        router.push(`/dashboard/project/${data.projectId}`);
        return;
      }

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

      router.push(`/dashboard/project/${data.projectId}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto relative" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 25%, #f0fdfa 50%, #eff6ff 75%, #fdf4ff 100%)' }}>
      {/* Animated floating gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute rounded-full blur-3xl opacity-30"
          style={{
            width: '500px', height: '500px',
            background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)',
            top: '-10%', left: '-5%',
            animation: 'floatOrb1 18s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full blur-3xl opacity-25"
          style={{
            width: '450px', height: '450px',
            background: 'radial-gradient(circle, #60a5fa 0%, transparent 70%)',
            top: '50%', right: '-8%',
            animation: 'floatOrb2 22s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full blur-3xl opacity-20"
          style={{
            width: '400px', height: '400px',
            background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)',
            bottom: '-5%', left: '30%',
            animation: 'floatOrb3 20s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full blur-3xl opacity-15"
          style={{
            width: '350px', height: '350px',
            background: 'radial-gradient(circle, #67e8f9 0%, transparent 70%)',
            top: '20%', left: '50%',
            animation: 'floatOrb4 25s ease-in-out infinite',
          }}
        />
        {/* Subtle dot grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #4A6BFF 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="min-h-full flex flex-col items-center justify-center px-6 py-16 relative z-10">
        <div className="w-full max-w-[720px] mx-auto">
          <div className="text-center mb-10 animate-fade-in-up">
            <h1 className="text-[38px] md:text-[48px] font-extrabold text-text-primary tracking-tight leading-[1.1] mb-3">
              What would you like
              <br />
              <span className="text-primary">to build?</span>
            </h1>
            <p className="text-[17px] text-text-muted max-w-md mx-auto leading-relaxed">
              Describe your app idea and choose your generation mode
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full animate-fade-in-up anim-delay-1">
            <div className="relative rounded-[26px] border border-white/60 transition-all focus-within:border-primary/30 shadow-lg shadow-primary/5 focus-within:shadow-xl focus-within:shadow-primary/10" style={{ background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
              <textarea
                ref={textareaRef}
                value={appIdea}
                onChange={(e) => { setAppIdea(e.target.value); if (error) setError(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                disabled={isLoading}
                placeholder="Describe your app idea..."
                className="w-full min-h-[120px] max-h-[400px] p-4 pl-5 pr-32 pt-5 rounded-[26px] bg-transparent text-[17px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none disabled:opacity-50"
                rows={4}
              />

              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface/80 hover:bg-surface border border-border/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group backdrop-blur-sm"
                  >
                    {mode === 'fast' ? (
                      <>
                        <Zap size={14} className="text-primary" strokeWidth={2.5} />
                        <span className="text-[15px] font-semibold text-text-primary">Fast</span>
                      </>
                    ) : (
                      <>
                        <SlidersHorizontal size={14} className="text-primary" strokeWidth={2.5} />
                        <span className="text-[15px] font-semibold text-text-primary">Detailed</span>
                      </>
                    )}
                    <svg
                      width="10"
                      height="6"
                      viewBox="0 0 10 6"
                      fill="none"
                      className={`text-text-muted transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
                    >
                      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {showDropdown && (
                    <div className="absolute top-full right-0 mt-2 py-1 rounded-xl border border-white/60 overflow-hidden animate-fade-in-up z-10 shadow-lg shadow-primary/5" style={{ background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
                      <button
                        type="button"
                        onClick={() => { setMode('fast'); setShowDropdown(false); }}
                        className={`w-full px-4 py-2 text-[15px] font-medium transition-colors text-left ${mode === 'fast'
                            ? 'text-primary bg-primary/5'
                            : 'text-text-primary hover:bg-surface/50'
                          }`}
                      >
                        Fast
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMode('detailed'); setShowDropdown(false); }}
                        className={`w-full px-4 py-2 text-[15px] font-medium transition-colors text-left ${mode === 'detailed'
                            ? 'text-primary bg-primary/5'
                            : 'text-text-primary hover:bg-surface/50'
                          }`}
                      >
                        Detailed
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!appIdea.trim() || isLoading}
                  className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ArrowUp size={16} strokeWidth={2.5} />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-error text-[15px] font-medium text-center animate-fade-in">
                {error}
              </div>
            )}

            {isLoading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-primary text-[15px] font-semibold animate-fade-in">
                <Loader2 size={16} className="animate-spin" />
                Generating your architecture docs…
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
