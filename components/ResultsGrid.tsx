'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Artifact } from '@/types';
import { SupabaseService } from '@/lib/supabase/service';
import ReactMarkdown from 'react-markdown';

interface ResultsGridProps {
  artifacts: Artifact[];
  isLoading?: boolean;
  onDownloadBundle?: () => void;
  projectId?: string;
}

const MAX_RECONNECTION_ATTEMPTS = 5;

const TABS = [
  { id: 'requirements', label: 'requirements.md', icon: '📝' },
  { id: 'design', label: 'design.md', icon: '🏗️' },
  { id: 'tasks', label: 'tasks.md', icon: '✅' },
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

  // Compute states
  const hasAllArtifacts = artifacts.length === 3;
  const artifactTypes = new Set(artifacts.map(a => a.artifact_type));
  const isComplete = hasAllArtifacts && artifactTypes.has('requirements') && artifactTypes.has('design') && artifactTypes.has('tasks');
  const showEmptyState = !isLoading && artifacts.length === 0 && !projectId;

  const getArtifactContent = (type: string) => {
    const artifact = artifacts.find(a => a.artifact_type === type);
    return artifact ? artifact.content : null;
  };

  const activeContent = getArtifactContent(activeTab);

  if (showEmptyState) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-32 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-chat-accent text-white flex items-center justify-center shadow-lg">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
        </div>
        <h1 className="text-3xl font-extrabold text-chat-text tracking-tight">How can I help you architect today?</h1>
        <p className="text-chat-textMuted max-w-md mx-auto text-sm">
          Describe your application idea below, and I will generate comprehensive requirements, technical designs, and engineering tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4 pb-4">
      {/* Manual Refresh Prompt */}
      {showRefreshPrompt && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm flex-shrink-0">
          Connection lost. Please <button onClick={() => window.location.reload()} className="underline font-semibold">refresh the page</button>.
        </div>
      )}

      {/* VSCode-style Editor Window */}
      <div className="flex flex-col flex-1 border border-chat-border rounded-xl overflow-hidden bg-[#1E1E1E] shadow-2xl min-h-[500px]">
        
        {/* Editor Tabs */}
        <div className="flex bg-[#252526] overflow-x-auto custom-scrollbar flex-shrink-0">
          {TABS.map((tab) => {
            const isReady = artifactTypes.has(tab.id);
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 text-[13px] transition-colors border-r border-[#1E1E1E] ${
                  isActive 
                    ? 'bg-[#1E1E1E] text-white border-t-2 border-t-blue-500' 
                    : 'bg-[#2D2D2D] text-gray-400 hover:bg-[#2D2D2D]/80 border-t-2 border-t-transparent'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="font-mono">{tab.label}</span>
                {!isReady && isLoading && (
                  <svg className="animate-spin h-3 w-3 text-blue-400 ml-1" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
              </button>
            );
          })}
          
          <div className="flex-1 bg-[#252526]" /> {/* Empty space filler */}

          {/* Download Action */}
          {isComplete && onDownloadBundle && (
            <button
              onClick={onDownloadBundle}
              className="flex items-center gap-2 px-4 py-1.5 my-1 mr-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-[12px] font-medium transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download Bundle
            </button>
          )}
        </div>

        {/* Editor Content Area */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar relative bg-[#1E1E1E]">
          {activeContent ? (
            <div className="prose prose-invert prose-sm md:prose-base max-w-none font-sans
              prose-headings:text-gray-100 prose-headings:font-bold 
              prose-a:text-blue-400 prose-p:text-gray-300 prose-li:text-gray-300
              prose-code:text-pink-400 prose-code:bg-[#2D2D2D] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-[#151515] prose-pre:border prose-pre:border-gray-800"
            >
              <ReactMarkdown>{activeContent}</ReactMarkdown>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 space-y-4">
              {isLoading ? (
                <>
                  <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-sm font-mono animate-pulse">Generating {TABS.find(t => t.id === activeTab)?.label}...</p>
                </>
              ) : (
                <p className="text-sm font-mono">Waiting for generation to begin...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
