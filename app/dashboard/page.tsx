'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { startSSEStream } from '@/lib/hooks/useSSE';
import { ArrowUp, Loader2, Zap, SlidersHorizontal, FileText, GitBranch, ListChecks, CheckCircle2, Sparkles } from 'lucide-react';
import ChatInput from '@/components/ui/chat-input';

interface ProgressState {
  stage: string;
  status: string;
  progress: number;
  message: string;
  projectId?: string;
}

const STAGE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  requirements: { label: 'Requirements', icon: FileText, color: 'text-blue-500' },
  design: { label: 'System Design', icon: GitBranch, color: 'text-violet-500' },
  tasks: { label: 'Tasks', icon: ListChecks, color: 'text-emerald-500' },
  complete: { label: 'Complete', icon: CheckCircle2, color: 'text-success' },
};

export default function DashboardPage() {
  const router = useRouter();
  const [appIdea, setAppIdea] = useState('');
  const [mode, setMode] = useState<'fast' | 'detailed'>('fast');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
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

  const handleSubmit = async (e?: React.FormEvent, ideaOverride?: string, modeOverride?: string) => {
    if (e) e.preventDefault();
    const idea = (ideaOverride ?? appIdea).trim();
    const currentMode = modeOverride ?? mode;
    if (!idea || isLoading) return;
    if (idea.length < 10) {
      setError('Please describe your idea in at least 10 characters');
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error('Authentication error. Please sign in again.');

      if (currentMode === 'detailed') {
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

      // Fast mode — use SSE streaming
      let projectId: string | null = null;

      await startSSEStream(
        '/api/generate',
        { appIdea: idea, userId: session.user.id },
        {
          onEvent: (event, data: any) => {
            if (event === 'init') {
              projectId = data.projectId;
              setProgress(prev => ({ ...(prev || { stage: '', status: '', progress: 0, message: '' }), projectId: data.projectId }));
            } else if (event === 'progress') {
              setProgress({
                stage: data.stage,
                status: data.status,
                progress: data.progress,
                message: data.message,
                projectId: projectId || undefined,
              });
            } else if (event === 'error') {
              throw new Error(data.message);
            }
          },
          onError: (err) => {
            setError(err.message || 'Something went wrong.');
            setIsLoading(false);
          },
          onDone: () => {
            if (projectId) {
              router.push(`/dashboard/project/${projectId}`);
            } else {
              setError('Generation completed but no project was created.');
              setIsLoading(false);
            }
          },
        }
      );
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
      setIsLoading(false);
    }
  };

  // Determine which stages are done, active, or pending
  const getStageStatus = (stage: string): 'done' | 'active' | 'pending' => {
    if (!progress) return 'pending';
    const stageOrder = ['requirements', 'design', 'tasks', 'complete'];
    const currentIdx = stageOrder.indexOf(progress.stage);
    const stageIdx = stageOrder.indexOf(stage);
    if (stageIdx < currentIdx) return 'done';
    if (stageIdx === currentIdx) {
      return progress.status === 'done' ? 'done' : 'active';
    }
    return 'pending';
  };

  const handleChatSendMessage = (data: { message: string, files: any[], pastedContent: any[], model: string, isThinkingEnabled: boolean }) => {
    setAppIdea(data.message);
    setMode(data.model as 'fast' | 'detailed');
    handleSubmit(undefined, data.message, data.model);
  };

  return (
    <div className="h-full overflow-y-auto relative bg-gradient-to-b from-[#4A6BFF] via-[#7DA4FF] to-[#FDE8D0]">
      {/* Premium Landing-Page Inspired Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated Floating Orbs matching landing page */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full bg-white/10 blur-2xl -top-20 -left-40"
          style={{ animation: 'floatOrb1 12s ease-in-out infinite', willChange: 'transform' }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full bg-indigo-300/15 blur-2xl top-[20%] right-[-10%]"
          style={{ animation: 'floatOrb2 15s ease-in-out infinite', willChange: 'transform' }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full bg-pink-200/10 blur-2xl bottom-[10%] left-[30%]"
          style={{ animation: 'floatOrb3 18s ease-in-out infinite', willChange: 'transform' }}
        />
        <div
          className="absolute w-[200px] h-[200px] rounded-full bg-white/15 blur-xl top-[50%] left-[10%]"
          style={{ animation: 'floatOrb2 10s ease-in-out infinite reverse', willChange: 'transform' }}
        />
        <div
          className="absolute w-[350px] h-[350px] rounded-full bg-sky-200/10 blur-2xl top-[10%] left-[50%]"
          style={{ animation: 'floatOrb1 20s ease-in-out infinite reverse', willChange: 'transform' }}
        />

        {/* Optimized Premium Noise Texture */}
        <div
          className="absolute inset-0 opacity-[0.15] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            transform: 'translateZ(0)',
            willChange: 'transform'
          }}
        />
      </div>

      <div className="min-h-full flex flex-col items-center justify-center px-6 py-16 relative z-10">
        <div className="w-full max-w-[720px] mx-auto">
          <div className="text-center mb-10 animate-fade-in-up">
            <h1 className="text-[38px] md:text-[48px] font-extrabold text-white tracking-tight leading-[1.1] mb-3" style={{ fontFamily: 'Georgia, serif' }}>
              What would you like
              <br />
              <span className="relative inline-block">
                <span className="text-[#4C1D95] relative z-10">to build?</span>
                <svg className="absolute w-full h-4 -bottom-1 left-0 text-[#4C1D95] z-0 opacity-80" viewBox="0 0 100 15" preserveAspectRatio="none">
                  <path d="M 2 12 C 20 5, 35 14, 60 7 C 75 2, 88 11, 98 8" stroke="currentColor" strokeWidth="2.5" fill="transparent" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="text-[17px] text-white/90 max-w-md mx-auto leading-relaxed">
              Describe your app idea and choose your generation mode
            </p>
          </div>

          <div className="w-full animate-fade-in-up anim-delay-1 relative z-20 group">
            <ChatInput onSendMessage={handleChatSendMessage} />
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-error text-[15px] font-medium text-center animate-fade-in max-w-2xl mx-auto">
              {error}
            </div>
          )}

          {/* SSE Progress Display */}
          {isLoading && (
            <div className="mt-6 animate-fade-in">
              <div className="rounded-2xl border border-white/60 overflow-hidden shadow-lg" style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(20px)' }}>
                {/* Progress bar */}
                <div className="h-1.5 bg-gray-100 w-full">
                  <div
                    className="h-full bg-gradient-to-r from-primary via-violet-500 to-primary transition-all duration-700 ease-out rounded-full"
                    style={{ width: `${progress?.progress || 2}%` }}
                  />
                </div>

                <div className="px-5 py-4">
                  {/* Stage message */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-primary animate-pulse" />
                      <span className="text-[15px] font-semibold text-text-primary">
                        {progress?.message || 'Starting generation…'}
                      </span>
                    </div>
                    <span className="text-[14px] font-bold text-primary tabular-nums">
                      {progress?.progress || 0}%
                    </span>
                  </div>

                  {/* Stage indicators */}
                  <div className="flex items-center gap-3">
                    {(['requirements', 'design', 'tasks'] as const).map((stage, idx) => {
                      const status = getStageStatus(stage);
                      const config = STAGE_CONFIG[stage];
                      const Icon = config.icon;
                      return (
                        <div key={stage} className="flex items-center gap-3">
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-500 ${status === 'done'
                            ? 'bg-emerald-50 border border-emerald-200'
                            : status === 'active'
                              ? 'bg-primary/5 border border-primary/30 shadow-sm'
                              : 'bg-gray-50 border border-gray-200 opacity-50'
                            }`}>
                            {status === 'done' ? (
                              <CheckCircle2 size={13} className="text-emerald-500" />
                            ) : status === 'active' ? (
                              <Loader2 size={13} className="text-primary animate-spin" />
                            ) : (
                              <Icon size={13} className="text-gray-400" />
                            )}
                            <span className={`text-[13px] font-semibold ${status === 'done' ? 'text-emerald-600' : status === 'active' ? 'text-primary' : 'text-gray-400'
                              }`}>
                              {config.label}
                            </span>
                          </div>
                          {idx < 2 && (
                            <div className={`w-4 h-px ${status === 'done' ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
