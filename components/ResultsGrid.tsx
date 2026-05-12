'use client';

import { useEffect, useState, useCallback } from 'react';
import { Artifact } from '@/types';
import { SupabaseService } from '@/lib/supabase/service';

interface ResultsGridProps {
  artifacts: Artifact[];
  isLoading?: boolean;
  onDownloadBundle?: () => void;
  projectId?: string;
}

const MAX_RECONNECTION_ATTEMPTS = 5;

export default function ResultsGrid({ 
  artifacts: initialArtifacts, 
  isLoading = false,
  onDownloadBundle,
  projectId
}: ResultsGridProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>(initialArtifacts);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [showRefreshPrompt, setShowRefreshPrompt] = useState(false);

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

  const hasAllArtifacts = artifacts.length === 3;
  const artifactTypes = new Set(artifacts.map(a => a.artifact_type));
  const isComplete = hasAllArtifacts && artifactTypes.has('requirements') && artifactTypes.has('design') && artifactTypes.has('tasks');

  const sortedArtifacts = [...artifacts].sort((a, b) => {
    const order = { requirements: 0, design: 1, tasks: 2 };
    return order[a.artifact_type] - order[b.artifact_type];
  });

  return (
    <div className="flex flex-col gap-8 pb-12">
      
      {/* Empty State / Welcome */}
      {!isLoading && artifacts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-chat-accent text-white flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          </div>
          <h1 className="text-3xl font-extrabold text-chat-text tracking-tight">How can I help you architect today?</h1>
          <p className="text-chat-textMuted max-w-md mx-auto text-sm">
            Describe your application idea, and I will generate comprehensive requirements, technical designs, and engineering tasks.
          </p>
        </div>
      )}

      {/* Manual Refresh Prompt */}
      {showRefreshPrompt && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
          Connection lost. Please <button onClick={() => window.location.reload()} className="underline font-semibold">refresh the page</button>.
        </div>
      )}

      {/* User Prompt Bubble (Mocked or actual if we fetch project data) */}
      {(isLoading || artifacts.length > 0) && (
        <div className="flex gap-4 justify-end mb-4 group">
          <div className="flex-1" />
          <div className="bg-chat-bubbleUser text-chat-text px-5 py-3.5 rounded-2xl rounded-tr-sm max-w-[85%] text-[15px] leading-relaxed shadow-sm">
             {projectId ? 'Generating architecture for your project...' : 'Generating documentation...'}
          </div>
          <div className="w-9 h-9 rounded-full bg-chat-textMuted flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            US
          </div>
        </div>
      )}

      {/* AI Response Bubble */}
      {(isLoading || artifacts.length > 0) && (
        <div className="flex gap-4 group">
          <div className="w-9 h-9 rounded-full bg-chat-accent/10 border border-chat-accent/20 flex items-center justify-center text-chat-accent flex-shrink-0 shadow-sm">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          
          <div className="flex-1 bg-white text-chat-text text-[15px] leading-relaxed space-y-5 rounded-2xl rounded-tl-sm max-w-[85%]">
            <p>
              I am generating the architectural documentation for your application. 
              Here are the artifacts produced so far:
            </p>
            
            <div className="space-y-4">
              {sortedArtifacts.map((artifact) => (
                <ArtifactPreviewCard key={artifact.id} artifact={artifact} />
              ))}

              {/* Loading Skeleton inside AI bubble */}
              {isLoading && artifacts.length < 3 && (
                <div className="animate-pulse bg-chat-bubbleUser rounded-xl p-4 border border-chat-border">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="animate-spin h-4 w-4 text-chat-accent" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm font-medium text-chat-textMuted">
                      Generating artifact {artifacts.length + 1} of 3...
                    </span>
                  </div>
                  <div className="h-4 bg-chat-textMuted/10 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-chat-textMuted/10 rounded w-5/6" />
                </div>
              )}
            </div>

            {/* AI Action Area: Download */}
            {isComplete && onDownloadBundle && (
              <div className="pt-2">
                <p className="mb-4">The generation pipeline is complete. You can now download the full documentation bundle.</p>
                <button
                  onClick={onDownloadBundle}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-chat-border hover:bg-chat-bubbleUser rounded-xl text-chat-text font-medium text-sm transition-colors shadow-sm"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download Bundle (.zip)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ArtifactPreviewCard({ artifact }: { artifact: Artifact }) {
  const typeLabels = { requirements: 'Product Requirements', design: 'Technical Design', tasks: 'Engineering Tasks' };
  const typeColors = { requirements: 'bg-blue-50 text-blue-700', design: 'bg-purple-50 text-purple-700', tasks: 'bg-emerald-50 text-emerald-700' };
  const preview = artifact.content.substring(0, 300) + (artifact.content.length > 300 ? '...' : '');

  return (
    <div className="bg-white rounded-xl p-5 border border-chat-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[15px] font-bold text-chat-text flex items-center gap-2">
          {typeLabels[artifact.artifact_type]}
        </h3>
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${typeColors[artifact.artifact_type]}`}>
          ✓ Ready
        </span>
      </div>
      <div className="text-[13px] text-chat-textMuted/90 whitespace-pre-wrap font-mono bg-chat-bubbleUser p-4 rounded-lg border border-chat-border/50 leading-relaxed overflow-x-auto">
        {preview}
      </div>
    </div>
  );
}
