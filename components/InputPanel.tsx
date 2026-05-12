'use client';

import React, { useState, useRef, useEffect } from 'react';

interface InputPanelProps {
  onSubmit: (appIdea: string) => Promise<void>;
  isLoading?: boolean;
}

export default function InputPanel({ onSubmit, isLoading = false }: InputPanelProps) {
  const [appIdea, setAppIdea] = useState('');
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '24px';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [appIdea]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAppIdea(e.target.value);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appIdea.trim() || isLoading) return;

    if (appIdea.trim().length < 10) {
      setError('App idea must be at least 10 characters');
      return;
    }

    try {
      setError(null);
      await onSubmit(appIdea.trim());
      setAppIdea(''); // Clear input after submit
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit app idea');
    }
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {error && (
        <div className="mx-auto w-full max-w-lg p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[13px] text-center shadow-sm">
          {error}
        </div>
      )}
      
      <form 
        onSubmit={handleSubmit} 
        className="relative bg-white border border-chat-border shadow-sm rounded-3xl flex items-end p-2 px-4 transition-shadow focus-within:ring-2 focus-within:ring-chat-accent/20 focus-within:border-chat-accent focus-within:shadow-md w-full"
      >
        <textarea
          ref={textareaRef}
          value={appIdea}
          onChange={handleTextChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          disabled={isLoading}
          placeholder="Message AI Architect..."
          className="flex-1 max-h-[200px] bg-transparent border-0 focus:ring-0 resize-none py-3 px-2 text-[15px] leading-relaxed text-chat-text placeholder:text-chat-textMuted overflow-y-auto outline-none custom-scrollbar"
          rows={1}
          style={{ minHeight: '24px' }}
        />

        <button
          type="submit"
          disabled={isLoading || !appIdea.trim()}
          className={`p-2.5 mb-[1px] ml-2 rounded-full flex items-center justify-center transition-all shadow-sm ${
            appIdea.trim() && !isLoading 
              ? 'bg-chat-accent text-white hover:bg-chat-accentHover hover:shadow-md' 
              : 'bg-gray-100 text-gray-300'
          }`}
        >
          {isLoading ? (
            <svg className="animate-spin h-[18px] w-[18px]" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
