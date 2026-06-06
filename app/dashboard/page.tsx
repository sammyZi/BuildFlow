'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { startSSEStream } from '@/lib/hooks/useSSE';
import ChatInput from '@/components/ui/chat-input';

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

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error('Authentication error. Please sign in again.');

      if (currentMode === 'detailed') {
        // Create the draft project directly via the client (RLS) and redirect
        // immediately — no slow server round-trip before navigation.
        const { data: newProject, error: createError } = await supabase
          .from('projects')
          .insert({
            user_id: session.user.id,
            prompt: idea,
            status: 'draft',
            current_step: 'questions',
            state_data: {},
          })
          .select('id')
          .single();

        if (createError || !newProject) {
          throw new Error(createError?.message || 'Failed to create project');
        }

        router.push(`/dashboard/project/${newProject.id}`);
        return;
      }

      // Fast mode — create the project client-side, redirect instantly, then
      // kick off generation in the background. The project page picks up the
      // streamed artifacts via realtime + polling.
      const { data: newProject, error: createError } = await supabase
        .from('projects')
        .insert({
          user_id: session.user.id,
          prompt: idea,
          status: 'generating',
        })
        .select('id')
        .single();

      if (createError || !newProject) {
        throw new Error(createError?.message || 'Failed to create project');
      }

      const newProjectId = newProject.id;

      // Fire-and-forget; generation runs server-side independent of this page.
      startSSEStream(
        '/api/generate',
        { appIdea: idea, userId: session.user.id, projectId: newProjectId },
        { onEvent: () => {}, onError: () => {}, onDone: () => {} }
      );

      router.push(`/dashboard/project/${newProjectId}`);
      return;
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
      setIsLoading(false);
    }
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
        </div>
      </div>
    </div>
  );
}
