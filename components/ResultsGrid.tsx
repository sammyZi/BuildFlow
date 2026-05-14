'use client';

import { useEffect, useState, useCallback } from 'react';
import { Artifact, ArtifactType } from '@/types';
import { SupabaseService } from '@/lib/supabase/service';
import ReactMarkdown from 'react-markdown';

interface ResultsGridProps {
  artifacts: Artifact[];
  isLoading?: boolean;
  onDownloadBundle?: () => void;
  projectId?: string;
}

const MAX_RECONNECTION_ATTEMPTS = 5;

const TABS: Array<{ id: ArtifactType; label: string; icon: string }> = [
  { id: 'requirements', label: 'requirements.md', icon: 'description' },
  { id: 'design', label: 'design.md', icon: 'account_tree' },
  { id: 'tasks', label: 'tasks.md', icon: 'checklist' },
];

export default function ResultsGrid({ 
  artifacts: initialArtifacts, 
  isLoading = false,
  onDownloadBundle,
  projectId
}: ResultsGridProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>(initialArtifacts);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [showRefreshPrompt, setShowRefreshPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('requirements');

  useEffect(() => {
    setArtifacts(initialArtifacts);
  }, [initialArtifacts]);

  const handleNewArtifact = useCallback((newArtifact: Artifact) => {
    setArtifacts((prev) => {
      const exists = prev.some((a) => a.id === newArtifact.id);
      if (exists) return prev;
      
      const updated = [...prev, newArtifact];
      return updated.sort((a, b) => {
        const order = { requirements: 0, design: 1, tasks: 2 };
        return order[a.artifact_type] - order[b.artifact_type];
      });
    });
  }, []);

  const handleDisconnect = useCallback(() => {
    setReconnectAttempts((prev) => {
      const newAttempts = prev + 1;
      if (newAttempts >= MAX_RECONNECTION_ATTEMPTS) {
        setShowRefreshPrompt(true);
      }
      return newAttempts;
    });
  }, []);

  useEffect(() => {
    if (!projectId) return;
    const subscription = SupabaseService.subscribeToArtifacts(projectId, handleNewArtifact, handleDisconnect);
    setReconnectAttempts(0);
    setShowRefreshPrompt(false);
    return () => { subscription.unsubscribe(); };
  }, [projectId, handleNewArtifact, handleDisconnect, reconnectAttempts]);

  const artifactTypes = new Set(artifacts.map(a => a.artifact_type));
  const isComplete = artifacts.length === 3 && artifactTypes.has('requirements') && artifactTypes.has('design') && artifactTypes.has('tasks');
  const showEmptyState = !isLoading && artifacts.length === 0 && !projectId;

  const getArtifactContent = (type: string) => {
    const artifact = artifacts.find(a => a.artifact_type === type);
    return artifact ? artifact.content : null;
  };

  const activeContent = getArtifactContent(activeTab);

  if (showEmptyState) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-32 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-chat-accent/10 text-chat-accent flex items-center justify-center">
          <span className="material-symbols-outlined text-[32px]">architecture</span>
        </div>
        <h1 className="text-2xl font-bold text-chat-text tracking-tight">BuildFlow</h1>
        <p className="text-chat-textMuted max-w-sm mx-auto text-sm leading-relaxed">
          Select a mode below, describe your app idea, and get comprehensive requirements, system design, and engineering tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4 pb-4">
      {showRefreshPrompt && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex-shrink-0 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">wifi_off</span>
          Connection lost. <button onClick={() => window.location.reload()} className="underline font-semibold">Refresh</button>
        </div>
      )}

      {/* File Viewer */}
      <div className="flex flex-1 border border-chat-border rounded-xl overflow-hidden bg-white shadow-sm min-h-[500px]">
        
        {/* Sidebar file tree */}
        <div className="w-[200px] bg-gray-50 border-r border-chat-border flex flex-col shrink-0">
          <div className="px-3 py-2.5 border-b border-chat-border">
            <p className="text-[11px] font-semibold text-chat-textMuted uppercase tracking-wider">Files</p>
          </div>
          <div className="flex-1 py-1">
            {TABS.map((tab) => {
              const isReady = artifactTypes.has(tab.id);
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] transition-colors ${
                    isActive 
                      ? 'bg-chat-accent/10 text-chat-accent font-medium' 
                      : 'text-chat-text hover:bg-gray-100'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[16px] ${isActive ? 'text-chat-accent' : 'text-chat-textMuted'}`}>{tab.icon}</span>
                  <span className="truncate">{tab.label}</span>
                  {!isReady && isLoading && (
                    <svg className="animate-spin h-3 w-3 text-chat-accent ml-auto shrink-0" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {isReady && (
                    <span className="material-symbols-outlined text-[14px] text-green-500 ml-auto shrink-0">check_circle</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Download */}
          {isComplete && onDownloadBundle && (
            <div className="p-2 border-t border-chat-border">
              <button
                onClick={onDownloadBundle}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-chat-accent hover:bg-chat-accentHover rounded-lg text-white text-[12px] font-semibold transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Download All
              </button>
            </div>
          )}
        </div>

        {/* Content pane */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Breadcrumb bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-chat-border bg-white shrink-0">
            <div className="flex items-center gap-1.5 text-[12px] text-chat-textMuted">
              <span className="material-symbols-outlined text-[14px]">folder</span>
              <span>output</span>
              <span>/</span>
              <span className="text-chat-text font-medium">{TABS.find(t => t.id === activeTab)?.label}</span>
            </div>
            {activeContent && (
              <button
                onClick={() => { navigator.clipboard.writeText(activeContent); }}
                className="flex items-center gap-1 text-[11px] text-chat-textMuted hover:text-chat-text transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">content_copy</span>
                Copy
              </button>
            )}
          </div>

          {/* Markdown content */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar relative">
            {activeContent ? (
              <div className="prose prose-sm md:prose-base max-w-none
                prose-headings:text-chat-text prose-headings:font-bold 
                prose-a:text-chat-accent prose-p:text-chat-text/80 prose-li:text-chat-text/80
                prose-code:text-pink-600 prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px]
                prose-pre:bg-gray-50 prose-pre:border prose-pre:border-chat-border prose-pre:rounded-lg
                prose-hr:border-chat-border
                prose-strong:text-chat-text"
              >
                <ReactMarkdown>{activeContent}</ReactMarkdown>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-chat-textMuted space-y-3">
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-chat-accent" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-sm animate-pulse">Generating {TABS.find(t => t.id === activeTab)?.label}...</p>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[28px] text-chat-textMuted/50">hourglass_empty</span>
                    <p className="text-sm">Waiting for generation...</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
