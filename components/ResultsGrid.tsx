'use client';

import { useEffect, useState, useCallback } from 'react';
import { Artifact, ArtifactType } from '@/types';
import { SupabaseService } from '@/lib/supabase/service';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { ShiningText } from '@/components/ui/shining-text';
import {
  FileText, GitBranch, ListChecks, Download, Folder, Copy,
  CheckCircle2, Loader2, WifiOff, Hourglass
} from 'lucide-react';

interface ResultsGridProps {
  artifacts: Artifact[];
  isLoading?: boolean;
  onDownloadBundle?: () => void;
  projectId?: string;
}

const MAX_RECONNECTION_ATTEMPTS = 5;

const TABS: Array<{ id: ArtifactType; label: string; Icon: React.ComponentType<any> }> = [
  { id: 'requirements', label: 'requirements.md', Icon: FileText },
  { id: 'design', label: 'design.md', Icon: GitBranch },
  { id: 'tasks', label: 'tasks.md', Icon: ListChecks },
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
          <GitBranch size={32} />
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
          <WifiOff size={20} />
          Connection lost. <button onClick={() => window.location.reload()} className="underline font-semibold">Refresh</button>
        </div>
      )}

      {/* File Viewer */}
      <div className="flex flex-col md:flex-row flex-1 border border-chat-border rounded-xl overflow-hidden bg-surface shadow-sm min-h-[400px] md:min-h-[500px]">
        
        {/* Sidebar file tree */}
        <div className="w-full md:w-[200px] bg-surface-alt border-b md:border-b-0 md:border-r border-chat-border flex flex-col shrink-0">
          <div className="px-3 py-2.5 border-b border-chat-border hidden md:block">
            <p className="text-[13px] font-semibold text-chat-textMuted uppercase tracking-wider">Files</p>
          </div>
          <div className="flex md:flex-col overflow-x-auto md:overflow-visible flex-1 py-1 custom-scrollbar">
            {TABS.map((tab) => {
              const isReady = artifactTypes.has(tab.id);
              const isActive = activeTab === tab.id;
              const TabIcon = tab.Icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 md:w-full flex items-center gap-2 px-3 py-2 text-[15px] whitespace-nowrap transition-colors ${
                    isActive 
                      ? 'bg-chat-accent/10 text-chat-accent font-medium' 
                      : 'text-chat-text hover:bg-surface-alt'
                  }`}
                >
                  <TabIcon size={20} className={isActive ? 'text-chat-accent' : 'text-chat-textMuted'} strokeWidth={1.5} />
                  <span className="truncate">{tab.label}</span>
                  {!isReady && isLoading && (
                    <Loader2 size={13} className="animate-spin text-chat-accent ml-auto shrink-0" />
                  )}
                  {isReady && (
                    <CheckCircle2 size={16} className="text-green-500 ml-auto shrink-0" />
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
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-chat-accent hover:bg-chat-accentHover rounded-lg text-white text-[14px] font-semibold transition-colors"
              >
                <Download size={20} />
                Download All
              </button>
            </div>
          )}
        </div>

        {/* Content pane */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Breadcrumb bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-chat-border bg-surface shrink-0">
            <div className="flex items-center gap-1.5 text-[14px] text-chat-textMuted">
              <Folder size={16} />
              <span>output</span>
              <span>/</span>
              <span className="text-chat-text font-medium">{TABS.find(t => t.id === activeTab)?.label}</span>
            </div>
            {activeContent && (
              <button
                onClick={() => { navigator.clipboard.writeText(activeContent); }}
                className="flex items-center gap-1 text-[13px] text-chat-textMuted hover:text-chat-text transition-colors"
              >
                <Copy size={16} />
                Copy
              </button>
            )}
          </div>

          {/* Markdown content */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar relative">
            {activeContent ? (
              <MarkdownRenderer content={activeContent} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-chat-textMuted space-y-3">
                {isLoading ? (
                  <>
                    <Loader2 size={24} className="animate-spin text-chat-accent" />
                    <p className="text-sm animate-pulse">Generating {TABS.find(t => t.id === activeTab)?.label}...</p>
                  </>
                ) : (
                  <>
                    <Hourglass size={28} className="text-chat-textMuted/50" strokeWidth={1.2} />
                    <ShiningText text="BuildFlow is thinking..." />
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
