'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ArtifactType } from '@/types';
import { supabase } from '@/lib/supabase/client';
import {
  X, Send, Loader2, Sparkles, User, Wand2,
  FileText, GitBranch, ListChecks, MessageSquare
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ArtifactChatProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ArtifactType;
  artifactContent: string | null;
  projectId?: string;
  onApplyChanges?: (prompt: string) => Promise<void> | void;
  isApplying?: boolean;
}

const TAB_META: Record<ArtifactType, { label: string; Icon: React.ComponentType<any>; color: string }> = {
  requirements: { label: 'Requirements', Icon: FileText, color: 'text-blue-600' },
  design: { label: 'System Design', Icon: GitBranch, color: 'text-violet-600' },
  tasks: { label: 'Tasks', Icon: ListChecks, color: 'text-emerald-600' },
};



export default function ArtifactChat({
  isOpen,
  onClose,
  activeTab,
  artifactContent,
  projectId,
  onApplyChanges,
  isApplying = false,
}: ArtifactChatProps) {
  // Single unified project chat history, persisted to sessionStorage
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined' && projectId) {
      const saved = sessionStorage.getItem(`chat_history_${projectId}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved chat history", e);
        }
      }
    }
    return [];
  });

  // Save to sessionStorage whenever messages change
  useEffect(() => {
    if (typeof window !== 'undefined' && projectId && messages.length > 0) {
      sessionStorage.setItem(`chat_history_${projectId}`, JSON.stringify(messages));
    }
  }, [messages, projectId]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);


  const meta = TAB_META[activeTab];
  const TabIcon = meta.Icon;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, activeTab]);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const updateLastAssistant = useCallback((content: string) => {
    setMessages(prev => {
      const msgs = [...prev];
      const lastIdx = msgs.length - 1;
      if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
        msgs[lastIdx] = { ...msgs[lastIdx], content };
      }
      return msgs;
    });
  }, []);

  const handleSend = async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text || isStreaming) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };

    addMessage(userMsg);
    setInput('');
    setIsStreaming(true);

    // Create placeholder for assistant response
    const assistantMsg: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
    };
    addMessage(assistantMsg);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please sign in again.');

      // Build messages array for the API (all history for this tab)
      const apiMessages = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: text },
      ];

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          stage: activeTab,
          artifactContent: artifactContent || undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error('Failed to get AI response');
      }

      // Stream the response
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulated += decoder.decode(value, { stream: true });
        updateLastAssistant(accumulated);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      updateLastAssistant(`⚠️ ${err.message || 'Something went wrong. Please try again.'}`);
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  const handleApply = async (messageContent: string) => {
    if (onApplyChanges && !isApplying) {
      const applyMsgId = `apply-${Date.now()}`;
      addMessage({
        id: applyMsgId,
        role: 'assistant',
        content: `Applying changes to your project... ⏳`,
      });

      try {
        await onApplyChanges(messageContent);
        setMessages(prev => {
          const msgs = [...prev];
          const applyMsg = msgs.find(m => m.id === applyMsgId);
          if (applyMsg) {
            applyMsg.content = `✨ Successfully applied changes! The document has been updated.\n\nYou can review these changes and restore previous versions at any time using the **History** button.`;
          }
          return msgs;
        });
      } catch (err) {
        setMessages(prev => {
          const msgs = [...prev];
          const applyMsg = msgs.find(m => m.id === applyMsgId);
          if (applyMsg) {
            applyMsg.content = `❌ Failed to apply changes. Please try again.`;
          }
          return msgs;
        });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="animate-slide-in-right h-full flex flex-col bg-surface border-l border-border w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 border-b border-border bg-surface flex-shrink-0 h-[53px]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare size={14} className="text-primary" />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-text-primary leading-tight">
              Project Chat
            </h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-surface-alt rounded-lg transition-colors text-text-muted hover:text-text-primary"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles size={20} className="text-primary" />
            </div>
            <h4 className="text-[15px] font-bold text-text-primary mb-1">
              Ask anything about your project
            </h4>
            <p className="text-[13px] text-text-muted mb-6 max-w-[260px]">
              Discuss requirements, architecture, or tasks. Your conversation history stays unified across the project.
            </p>

            {/* Suggestion chips */}
            <div className="space-y-2 w-full max-w-[280px]">
              {[
                'What features am I missing?',
                'How would this architecture scale?',
                'Are there any security concerns here?',
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 text-[13px] text-text-secondary hover:text-primary transition-all group"
                >
                  <span className="opacity-70 group-hover:opacity-100 transition-opacity">{suggestion}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles size={12} className="text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-md'
                      : 'bg-surface-alt border border-border rounded-bl-md'
                    }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="text-[13px] text-text-primary leading-relaxed">
                      {msg.content ? (
                        <>
                          <MarkdownRenderer
                            content={msg.content}
                            className="prose-sm prose-p:text-[13px] prose-p:leading-relaxed prose-li:text-[13px] prose-headings:text-[14px] prose-code:text-[12px]"
                          />
                          {/* Apply Changes button */}
                          {!isStreaming && msg.content.length > 20 && onApplyChanges && (
                            <button
                              onClick={() => handleApply(msg.content)}
                              disabled={isApplying}
                              className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isApplying ? (
                                <>
                                  <Loader2 size={11} className="animate-spin" />
                                  Applying...
                                </>
                              ) : (
                                <>
                                  <Wand2 size={11} />
                                  Apply Changes
                                </>
                              )}
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 py-1">
                          <Loader2 size={13} className="animate-spin text-primary" />
                          <span className="text-text-muted text-[12px]">Thinking...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[13px] leading-relaxed">{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-lg bg-text-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User size={12} className="text-text-secondary" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-border bg-surface">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            placeholder="Ask about this document..."
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-bg text-[13px] text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="w-9 h-9 rounded-xl bg-primary hover:bg-primary-hover text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex-shrink-0"
          >
            {isStreaming ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
