'use client';

import React, { useState, useRef, useEffect } from 'react';

interface InputPanelProps {
  onSubmit: (appIdea: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * InputPanel — handles the fast mode text input for submitting an app idea.
 * The detailed pipeline is handled separately via the /dashboard/questionnaire route.
 */
export default function InputPanel({ onSubmit, isLoading = false }: InputPanelProps) {
  const [appIdea, setAppIdea] = useState('');
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = '24px'; ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`; }
  };

  useEffect(() => { adjustHeight(); }, [appIdea]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appIdea.trim() || isLoading) return;
    if (appIdea.trim().length < 10) { setError('Please write at least 10 characters'); return; }
    try { setError(null); await onSubmit(appIdea.trim()); setAppIdea(''); } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {error && (
        <div className="mx-auto w-full max-w-lg p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[15px] text-center shadow-sm">{error}</div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="bg-white border border-chat-border shadow-sm rounded-2xl flex flex-col transition-shadow focus-within:ring-2 focus-within:ring-chat-accent/15 focus-within:border-chat-accent/40 focus-within:shadow-md w-full overflow-hidden">
        {/* Text + send */}
        <div className="flex items-end w-full gap-2 px-4 pt-3 pb-1">
          <textarea
            ref={textareaRef}
            value={appIdea}
            onChange={(e) => { setAppIdea(e.target.value); if (error) setError(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
            disabled={isLoading}
            placeholder="Describe your app idea..."
            className="flex-1 max-h-[200px] bg-transparent border-0 focus:ring-0 resize-none py-1.5 text-[17px] leading-relaxed text-chat-text placeholder:text-chat-textMuted overflow-y-auto outline-none custom-scrollbar"
            rows={1}
            style={{ minHeight: '24px' }}
          />
          <button
            type="submit"
            disabled={isLoading || !appIdea.trim()}
            className={`p-2 rounded-lg flex items-center justify-center transition-all shrink-0 mb-0.5 ${
              appIdea.trim() && !isLoading ? 'bg-chat-accent text-white hover:bg-chat-accentHover' : 'bg-gray-100 text-gray-300'
            }`}
          >
            {isLoading ? (
              <svg className="animate-spin h-[18px] w-[18px]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            ) : (
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
