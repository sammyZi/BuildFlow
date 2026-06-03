'use client';

import { useState, useRef } from 'react';
import { Artifact, ArtifactType } from '@/types';
import MarkdownRenderer from './MarkdownRenderer';
import ScrollButtons from './ScrollButtons';
import VersionHistory from './VersionHistory';
import { supabase } from '@/lib/supabase/client';
import {
  FileText, GitBranch, ListChecks, Download,
  Folder, Copy, Check, Loader2, Clock, WifiOff, CheckCircle2,
  Send, Edit3, Sparkles, History, Share2, Printer, Link as LinkIcon
} from 'lucide-react';
import { ShiningText } from '@/components/ui/shining-text';

interface ResultsViewerProps {
  artifacts: Artifact[];
  isLoading?: boolean;
  onDownloadBundle?: () => void;
  projectId?: string;
  showRefreshPrompt?: boolean;
  onArtifactUpdate?: (updated: Artifact) => void;
  isPublic?: boolean;
  onTogglePublic?: (isPublic: boolean) => void;
  readOnly?: boolean;
}

const TABS: Array<{ id: ArtifactType; label: string; filename: string; Icon: React.ComponentType<any> }> = [
  { id: 'requirements', label: 'Requirements', filename: 'requirements.md', Icon: FileText },
  { id: 'design', label: 'System Design', filename: 'design.md', Icon: GitBranch },
  { id: 'tasks', label: 'Tasks', filename: 'tasks.md', Icon: ListChecks },
];

export default function ResultsViewer({
  artifacts,
  isLoading = false,
  onDownloadBundle,
  projectId,
  showRefreshPrompt = false,
  onArtifactUpdate,
  isPublic = false,
  onTogglePublic,
  readOnly = false,
}: ResultsViewerProps) {
  const [activeTab, setActiveTab] = useState<string>('requirements');
  const [copied, setCopied] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Refine state
  const [refinePrompt, setRefinePrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);
  const [refineStatus, setRefineStatus] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleShareClick = () => {
    if (!isPublic && onTogglePublic) {
      onTogglePublic(true);
    }
    const url = `${window.location.origin}/share/${projectId}`;
    navigator.clipboard.writeText(url);
    setShowShareTooltip(true);
    setTimeout(() => setShowShareTooltip(false), 2000);
  };

  const artifactTypes = new Set(artifacts.map(a => a.artifact_type));
  const isComplete = artifacts.length === 3
    && artifactTypes.has('requirements')
    && artifactTypes.has('design')
    && artifactTypes.has('tasks');

  const activeArtifact = artifacts.find(a => a.artifact_type === activeTab);
  const activeContent = activeArtifact?.content || null;
  const activeFile = TABS.find(t => t.id === activeTab);
  const readyCount = artifacts.length;

  const handleCopy = () => {
    if (!activeContent) return;
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refinePrompt.trim() || isRefining || !activeArtifact || !projectId) return;

    setIsRefining(true);
    setRefineError(null);
    setRefineStatus(`Refining ${activeFile?.filename}...`);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please sign in again.');

      // Show cascade hint
      if (activeTab === 'requirements') {
        setRefineStatus('Refining requirements... Design & Tasks will update automatically.');
      } else if (activeTab === 'design') {
        setRefineStatus('Refining design... Tasks will update automatically.');
      }

      const res = await fetch('/api/artifacts/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          artifactId: activeArtifact.id,
          projectId,
          currentContent: activeArtifact.content,
          prompt: refinePrompt,
          artifactType: activeTab,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Refinement failed');

      // Update all cascaded artifacts in the parent state
      if (onArtifactUpdate && data.updatedArtifacts) {
        for (const updated of data.updatedArtifacts) {
          onArtifactUpdate(updated);
        }
      }

      setRefinePrompt('');
      const cascadeCount = (data.updatedArtifacts?.length || 1) - 1;
      if (cascadeCount > 0) {
        setRefineStatus(`Done! Updated ${activeFile?.filename} + ${cascadeCount} dependent file${cascadeCount > 1 ? 's' : ''}.`);
      } else {
        setRefineStatus('Done! Changes saved.');
      }
      setTimeout(() => setRefineStatus(null), 4000);
    } catch (err: any) {
      setRefineError(err.message || 'Something went wrong.');
      setRefineStatus(null);
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Connection warning */}
      {showRefreshPrompt && (
        <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-[15px] flex items-center gap-2 flex-shrink-0">
          <WifiOff size={14} />
          Connection lost.{' '}
          <button onClick={() => window.location.reload()} className="underline font-semibold">Refresh</button>
        </div>
      )}

      {/* Progress bar */}
      {!isComplete && (isLoading || artifacts.length > 0) && (
        <div className="flex-shrink-0">
          <div className="h-[3px] bg-border-light w-full">
            <div
              className="h-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${(readyCount / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Main file viewer */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Top tabs */}
        <div className="bg-surface-alt border-b border-border flex flex-col sm:flex-row sm:items-center justify-between flex-shrink-0">
          {!isComplete && artifacts.length > 0 && (
            <div className="flex items-center gap-4 px-4 py-2 sm:py-0 border-b sm:border-b-0 sm:border-r border-border shrink-0">
              <p className="text-[13px] text-text-muted font-medium">{readyCount}/3 generated</p>
            </div>
          )}

          <div className="flex flex-1 overflow-x-auto hide-scrollbar">
            {TABS.map(tab => {
              const isReady = artifactTypes.has(tab.id);
              const isActive = activeTab === tab.id;
              const TabIcon = tab.Icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-4 py-3 text-[15px] transition-all border-b-2 whitespace-nowrap ${
                    isActive
                      ? 'bg-surface border-primary text-primary font-semibold'
                      : 'border-transparent text-text-secondary hover:bg-surface hover:text-text-primary'
                  }`}
                >
                  <TabIcon size={16} className={isActive ? 'text-primary' : 'text-text-muted'} strokeWidth={1.5} />
                  <span>{tab.filename}</span>
                  {!isReady && isLoading && (
                    <Loader2 size={13} className="animate-spin text-primary shrink-0" />
                  )}
                  {isReady && (
                    <CheckCircle2 size={15} className="text-success shrink-0" strokeWidth={2} />
                  )}
                </button>
              );
            })}
          </div>

          {isComplete && (
            <div className="p-2 sm:border-l border-border shrink-0 flex flex-wrap items-center gap-2 print:hidden">
              {!readOnly && onTogglePublic && (
                <button
                  onClick={handleShareClick}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors border ${
                    showShareTooltip
                      ? 'bg-emerald-50 text-success border-emerald-200'
                      : 'bg-surface text-text-secondary border-border hover:bg-surface-alt hover:text-text-primary'
                  }`}
                >
                  {showShareTooltip ? <LinkIcon size={14} className="text-success" /> : <Share2 size={14} />}
                  {showShareTooltip ? 'Copied Link!' : 'Share'}
                </button>
              )}
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-alt text-text-secondary hover:text-text-primary text-[13px] font-semibold transition-colors"
                title="Export to PDF"
              >
                <Printer size={14} />
                <span className="hidden sm:inline">PDF</span>
              </button>
              {onDownloadBundle && (
                <button
                  onClick={onDownloadBundle}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-[13px] font-bold transition-colors shadow-sm"
                >
                  <Download size={14} strokeWidth={2} />
                  <span className="hidden sm:inline">Download</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content pane */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-surface print:bg-white print:overflow-visible">
          {/* Breadcrumb */}
          <div className="flex items-center justify-between px-6 py-2.5 border-b border-border flex-shrink-0 print:hidden">
            <div className="flex items-center gap-1.5 text-[14px] text-text-muted">
              <span className="text-text-primary font-semibold">{activeFile?.filename}</span>
              {artifactTypes.has(activeTab as ArtifactType) && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-50 text-success text-[10px] font-bold">
                  Ready
                </span>
              )}
            </div>
            {activeContent && (
              <div className="flex items-center gap-1">
                {isComplete && !readOnly && (
                  <button
                    onClick={() => setShowHistory(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[13px] text-text-muted hover:text-text-primary hover:bg-surface-alt transition-colors"
                  >
                    <History size={13} />
                    History
                  </button>
                )}
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[13px] text-text-muted hover:text-text-primary hover:bg-surface-alt transition-colors"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
          </div>

          {/* Markdown content */}
          <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-10 print:px-0 print:py-0 print:overflow-visible" ref={scrollContainerRef}>
            {activeContent ? (
              <div className="max-w-4xl mx-auto min-h-full">
                <MarkdownRenderer content={activeContent} />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-text-muted">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-4 animate-fade-in">
                    <div className="w-12 h-12 rounded-2xl bg-primary-muted flex items-center justify-center">
                      <Loader2 size={22} className="animate-spin text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-[17px] font-semibold text-text-primary mb-1">
                        Generating {activeFile?.label}
                      </p>
                      <ShiningText text="BuildFlow is thinking..." />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 animate-fade-in">
                    <Clock size={28} className="text-text-faint" strokeWidth={1.2} />
                    <ShiningText text="BuildFlow is thinking..." />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Refine chat bar — only show when project is complete and has content */}
      {isComplete && activeContent && !readOnly && (
        <div className="flex-shrink-0 border-t border-border bg-surface px-4 py-3 print:hidden">
          <form onSubmit={handleRefine} className="max-w-5xl mx-auto">
            {refineError && (
              <div className="mb-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-error text-[13px] font-medium">
                {refineError}
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-text-muted shrink-0">
                <Sparkles size={14} className="text-primary" />
                <span className="text-[12px] font-semibold text-text-muted hidden sm:inline">Edit {activeFile?.filename}</span>
                {activeTab === 'requirements' && (
                  <span className="text-[11px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded hidden md:inline">cascades to design + tasks</span>
                )}
                {activeTab === 'design' && (
                  <span className="text-[11px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded hidden md:inline">cascades to tasks</span>
                )}
              </div>
              <input
                type="text"
                value={refinePrompt}
                onChange={(e) => setRefinePrompt(e.target.value)}
                disabled={isRefining}
                placeholder={`What do you want to change?`}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-bg text-[14px] text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
              <button
                type="submit"
                disabled={!refinePrompt.trim() || isRefining}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.97]"
              >
                {isRefining ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span className="hidden sm:inline">Refining...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span className="hidden sm:inline">Refine</span>
                  </>
                )}
              </button>
            </div>
            {(refineStatus && !refineError) && (
              <div className="mt-2 flex items-center gap-2 text-[12px] text-primary font-medium animate-fade-in">
                {isRefining && <Loader2 size={12} className="animate-spin" />}
                {!isRefining && <CheckCircle2 size={12} className="text-success" />}
                {refineStatus}
              </div>
            )}
          </form>
        </div>
      )}

      <ScrollButtons containerRef={scrollContainerRef} />

      {/* Version History Modal */}
      {activeArtifact && (
        <VersionHistory
          artifactId={activeArtifact.id}
          artifactType={activeTab}
          currentContent={activeArtifact.content}
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
