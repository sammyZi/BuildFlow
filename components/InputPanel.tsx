'use client';

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface InputPanelProps {
  onSubmit: (appIdea: string) => Promise<void>;
  isLoading?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

type DetailedStage = 'idea' | 'requirements' | 'design' | 'generating';

const STAGE_INFO: Record<DetailedStage, { label: string; placeholder: string; description: string }> = {
  idea: { label: 'App Idea', placeholder: 'Describe your app idea...', description: 'Start by telling the AI about your app concept' },
  requirements: { label: 'Requirements', placeholder: 'Answer the questions...', description: 'AI is refining your requirements' },
  design: { label: 'Design', placeholder: 'Answer the questions...', description: 'AI is refining your technical design' },
  generating: { label: 'Generating', placeholder: '', description: 'Creating your artifacts...' },
};

export default function InputPanel({ onSubmit, isLoading = false }: InputPanelProps) {
  const [mode, setMode] = useState<'fast' | 'detailed'>('fast');
  const [detailedStage, setDetailedStage] = useState<DetailedStage>('idea');

  const [appIdea, setAppIdea] = useState('');
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const adjustHeight = () => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = '24px'; ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`; }
  };

  useEffect(() => { adjustHeight(); }, [appIdea, chatInput]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  // --- Detailed mode chat ---
  const sendChat = async (text: string, stage: string) => {
    const msg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text };
    const all = [...chatMessages, msg];
    setChatMessages(all);
    setChatInput('');
    setIsChatLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ messages: all.map(m => ({ role: m.role, content: m.content })), stage }),
      });
      if (!res.ok) throw new Error('Failed');
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let txt = '';
      const aId = (Date.now() + 1).toString();
      setChatMessages(prev => [...prev, { id: aId, role: 'assistant', content: '' }]);
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          txt += decoder.decode(value, { stream: true });
          setChatMessages(prev => prev.map(m => m.id === aId ? { ...m, content: txt } : m));
        }
      }
    } catch {
      setChatMessages(prev => [...prev, { id: (Date.now() + 2).toString(), role: 'assistant', content: 'Something went wrong. Try again.' }]);
    } finally { setIsChatLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'fast') {
      if (!appIdea.trim() || isLoading) return;
      if (appIdea.trim().length < 10) { setError('Please write at least 10 characters'); return; }
      try { setError(null); await onSubmit(appIdea.trim()); setAppIdea(''); } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    } else {
      if (!chatInput.trim() || isChatLoading) return;
      if (detailedStage === 'idea') {
        setDetailedStage('requirements');
        await sendChat(chatInput.trim(), 'requirements');
      } else {
        await sendChat(chatInput.trim(), detailedStage);
      }
    }
  };

  const advanceStage = () => {
    if (detailedStage === 'requirements') {
      setDetailedStage('design');
      setChatMessages([]);
      // Send context about moving to design
      setTimeout(() => {
        sendChat('Now let\'s discuss the technical design. Here is what we discussed for requirements:\n' +
          chatMessages.filter(m => m.role === 'assistant').map(m => m.content).join('\n'), 'design');
      }, 100);
    } else if (detailedStage === 'design') {
      setDetailedStage('generating');
      const fullContext = chatMessages.map(m => `${m.role}: ${m.content}`).join('\n');
      onSubmit(fullContext);
    }
  };

  const val = mode === 'fast' ? appIdea : chatInput;
  const stageInfo = STAGE_INFO[detailedStage];

  return (
    <div className="w-full flex flex-col gap-2">
      {error && (
        <div className="mx-auto w-full max-w-lg p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[13px] text-center shadow-sm">{error}</div>
      )}

      {/* Detailed mode chat panel */}
      {mode === 'detailed' && chatMessages.length > 0 && detailedStage !== 'generating' && (
        <div className="w-full flex flex-col bg-white border border-chat-border rounded-2xl shadow-sm overflow-hidden mb-1" style={{ height: '340px' }}>
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-chat-border bg-gray-50/80 shrink-0">
            <div className="flex items-center gap-3">
              {/* Stage pills */}
              {(['requirements', 'design'] as const).map((s) => (
                <div key={s} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                  detailedStage === s ? 'bg-chat-accent text-white' : 'bg-gray-200 text-chat-textMuted'
                }`}>
                  <span className="capitalize">{s}</span>
                </div>
              ))}
            </div>
            {chatMessages.length > 2 && !isChatLoading && (
              <button
                onClick={advanceStage}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-chat-accent text-white hover:bg-chat-accentHover transition-colors"
              >
                {detailedStage === 'requirements' ? 'Next: Design' : 'Generate Files'}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 p-4">
            {chatMessages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-chat-accent text-white rounded-br-md'
                    : 'bg-gray-100 text-chat-text rounded-bl-md'
                }`}>
                  {m.content || <span className="animate-pulse text-chat-textMuted">Thinking...</span>}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="bg-white border border-chat-border shadow-sm rounded-2xl flex flex-col transition-shadow focus-within:ring-2 focus-within:ring-chat-accent/15 focus-within:border-chat-accent/40 focus-within:shadow-md w-full overflow-hidden">
        {/* Text + send */}
        <div className="flex items-end w-full gap-2 px-4 pt-3 pb-1">
          <textarea
            ref={textareaRef}
            value={val}
            onChange={(e) => { if (mode === 'fast') setAppIdea(e.target.value); else setChatInput(e.target.value); if (error) setError(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
            disabled={isLoading || isChatLoading || detailedStage === 'generating'}
            placeholder={mode === 'fast' ? 'Describe your app idea...' : stageInfo.placeholder}
            className="flex-1 max-h-[200px] bg-transparent border-0 focus:ring-0 resize-none py-1.5 text-[15px] leading-relaxed text-chat-text placeholder:text-chat-textMuted overflow-y-auto outline-none custom-scrollbar"
            rows={1}
            style={{ minHeight: '24px' }}
          />
          <button
            type="submit"
            disabled={isLoading || isChatLoading || !val.trim() || detailedStage === 'generating'}
            className={`p-2 rounded-lg flex items-center justify-center transition-all shrink-0 mb-0.5 ${
              val.trim() && !isLoading && !isChatLoading ? 'bg-chat-accent text-white hover:bg-chat-accentHover' : 'bg-gray-100 text-gray-300'
            }`}
          >
            {isLoading || isChatLoading ? (
              <svg className="animate-spin h-[18px] w-[18px]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            ) : (
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            )}
          </button>
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center gap-1 px-3 py-1.5 border-t border-gray-100">
          {/* Mode toggle pill */}
          <div className="inline-flex bg-gray-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => { setMode('fast'); setChatMessages([]); setDetailedStage('idea'); }}
              className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                mode === 'fast' ? 'bg-white text-chat-text shadow-sm' : 'text-chat-textMuted hover:text-chat-text'
              }`}
            >
              Fast
            </button>
            <button
              type="button"
              onClick={() => { setMode('detailed'); setDetailedStage('idea'); }}
              className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                mode === 'detailed' ? 'bg-white text-chat-text shadow-sm' : 'text-chat-textMuted hover:text-chat-text'
              }`}
            >
              Detailed
            </button>
          </div>
          {mode === 'detailed' && detailedStage !== 'idea' && (
            <span className="text-[10px] text-chat-textMuted ml-2">{stageInfo.description}</span>
          )}
        </div>
      </form>
    </div>
  );
}
