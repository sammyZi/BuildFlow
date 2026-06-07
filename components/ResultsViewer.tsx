'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Artifact, ArtifactType } from '@/types';
import MarkdownRenderer from './MarkdownRenderer';
import ScrollButtons from './ScrollButtons';
import VersionHistory from './VersionHistory';
import ArtifactChat from './ArtifactChat';
import CodeViewer from './CodeViewer';
import { supabase } from '@/lib/supabase/client';
import {
  FileText, GitBranch, ListChecks, Download,
  Folder, Copy, Check, Loader2, Clock, WifiOff, CheckCircle2,
  Send, Edit3, Sparkles, History, Share2, Printer, Link as LinkIcon,
  MessageSquare, ChevronDown, Code2
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

const TABS: Array<{ id: ArtifactType | 'code'; label: string; filename: string; Icon: React.ComponentType<any> }> = [
  { id: 'requirements', label: 'Requirements', filename: 'requirements.md', Icon: FileText },
  { id: 'design', label: 'System Design', filename: 'design.md', Icon: GitBranch },
  { id: 'tasks', label: 'Tasks', filename: 'tasks.md', Icon: ListChecks },
  { id: 'code', label: 'Starter Code', filename: 'code viewer', Icon: Code2 },
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('requirements');
  const [copied, setCopied] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);


  const [showHistory, setShowHistory] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isApplyingChat, setIsApplyingChat] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

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

  // Only count artifacts that actually have content — an empty artifact means
  // generation never completed for that file, so it must not look "ready".
  const readyTypes = new Set(
    artifacts.filter(a => a.content && a.content.trim().length > 0).map(a => a.artifact_type)
  );
  const artifactTypes = readyTypes;
  const isComplete = readyTypes.has('requirements')
    && readyTypes.has('design')
    && readyTypes.has('tasks');

  const activeArtifact = artifacts.find(a => a.artifact_type === activeTab);
  const activeContent = activeArtifact?.content || null;
  const activeFile = TABS.find(t => t.id === activeTab);
  const readyCount = readyTypes.size;

  const handleCopy = () => {
    if (!activeContent) return;
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateCode = () => {
    setShowExportMenu(false);
    setActiveTab('code');
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
              const isReady = artifactTypes.has(tab.id as any);
              const isActive = activeTab === tab.id;
              const TabIcon = tab.Icon;

              // Only show code tab if the rest is generated
              if (tab.id === 'code' && !isComplete) return null;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'code') {
                      handleGenerateCode();
                    } else {
                      setActiveTab(tab.id);
                    }
                  }}
                  className={`flex items-center gap-2.5 px-4 py-3 text-[15px] transition-all border-b-2 whitespace-nowrap ${isActive
                    ? 'bg-surface border-primary text-primary font-semibold'
                    : 'border-transparent text-text-secondary hover:bg-surface hover:text-text-primary'
                    }`}
                >
                  <TabIcon size={16} className={isActive ? 'text-primary' : 'text-text-muted'} strokeWidth={1.5} />
                  <span>{tab.filename}</span>
                  {!isReady && isLoading && tab.id !== 'code' && (
                    <Loader2 size={13} className="animate-spin text-primary shrink-0" />
                  )}
                  {isReady && tab.id !== 'code' && (
                    <CheckCircle2 size={15} className="text-success shrink-0" strokeWidth={2} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          {isComplete && (
            <div className="p-2 sm:border-l border-border shrink-0 flex items-center gap-2 print:hidden relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                onBlur={() => setTimeout(() => setShowExportMenu(false), 200)}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-alt text-text-secondary hover:text-text-primary text-[13px] font-semibold transition-colors"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>

              {showExportMenu && (
                <div className="absolute top-full mt-1 right-2 w-48 bg-surface border border-border rounded-xl shadow-xl flex flex-col p-1.5 z-50 animate-fade-in">
                  {!readOnly && onTogglePublic && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleShareClick(); }}
                      className="flex items-center gap-2.5 px-3 py-2 w-full text-left rounded-lg hover:bg-surface-alt text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {showShareTooltip ? <LinkIcon size={14} className="text-success" /> : <Share2 size={14} />}
                      {showShareTooltip ? 'Copied Link!' : 'Share Project'}
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePrint(); }}
                    className="flex items-center gap-2.5 px-3 py-2 w-full text-left rounded-lg hover:bg-surface-alt text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <Printer size={14} />
                    Export as PDF
                  </button>
                  {onDownloadBundle && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDownloadBundle(); }}
                      className="flex items-center gap-2.5 px-3 py-2 w-full text-left rounded-lg hover:bg-surface-alt text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <Folder size={14} />
                      Download Zip
                    </button>
                  )}
                  {!readOnly && projectId && (
                    <>
                      <div className="my-1 border-t border-border" />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleGenerateCode(); }}
                        className="flex items-center gap-2.5 px-3 py-2 w-full text-left rounded-lg hover:bg-primary/10 text-[13px] font-semibold text-primary hover:text-primary-hover transition-colors"
                      >
                        <Code2 size={14} />
                        Generate Starter Code
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content + Chat layout */}
        <div className="flex-1 flex min-w-0 min-h-0">
          {/* Content pane */}
          <div className={`flex-1 flex flex-col min-w-0 min-h-0 bg-surface print:bg-white print:overflow-visible transition-all duration-300 relative ${showChat ? 'hidden sm:flex' : ''}`}>
            {activeTab === 'code' && projectId ? (
              <CodeViewer projectId={projectId} />
            ) : (
              <>
                {/* Document Toolbar */}
                <div className="flex items-center justify-between px-6 border-b border-border flex-shrink-0 print:hidden h-[53px]">
                  <div className="flex items-center gap-2 text-[14px] text-text-primary font-semibold">
                    {activeTab === 'requirements' && <FileText size={15} className="text-blue-600" />}
                    {activeTab === 'design' && <GitBranch size={15} className="text-violet-600" />}
                    {activeTab === 'tasks' && <ListChecks size={15} className="text-emerald-600" />}
                    {activeFile?.filename}
                  </div>
                  {activeContent && (
                    <div className="flex items-center gap-1">
                      {!readOnly && (
                        <button
                          onClick={() => setShowChat(!showChat)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${showChat
                            ? 'bg-primary/10 text-primary'
                            : 'text-text-muted hover:text-text-primary hover:bg-surface-alt'
                            }`}
                        >
                          <MessageSquare size={14} />
                          Chat
                        </button>
                      )}
                      {isComplete && !readOnly && (
                        <button
                          onClick={() => setShowHistory(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium text-text-muted hover:text-text-primary hover:bg-surface-alt transition-colors"
                        >
                          <History size={14} />
                          History
                        </button>
                      )}
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium text-text-muted hover:text-text-primary hover:bg-surface-alt transition-colors"
                      >
                        {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                        {copied ? 'Copied' : 'Copy'}
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

                <ScrollButtons
                  containerRef={scrollContainerRef}
                  className="absolute bottom-8 right-8"
                />
              </>
            )}
          </div>

          {/* Chat sidebar */}
          {showChat && (
            <div className="w-full sm:w-[380px] sm:min-w-[340px] sm:max-w-[420px] flex-shrink-0">
              <ArtifactChat
                isOpen={showChat}
                onClose={() => setShowChat(false)}
                activeTab={activeTab as ArtifactType}
                artifactContent={activeContent}
                projectId={projectId}
                isApplying={isApplyingChat}
                onApplyChanges={async (suggestion) => {
                  if (!activeArtifact || !projectId || isApplyingChat) return;
                  setIsApplyingChat(true);
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) throw new Error('Please sign in again.');

                    // Apply the change to the artifact the user is currently
                    // viewing; the backend then surgically propagates it to the
                    // other documents (e.g. a design tech-stack change updates
                    // the impacted tasks) without overwriting unaffected parts.
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
                        prompt: `Apply the following changes from our conversation:\n\n${suggestion}`,
                        artifactType: activeTab,
                      }),
                    });

                    const data = await res.json();
                    if (!data.success) throw new Error(data.error || 'Failed to apply changes');

                    if (onArtifactUpdate && data.updatedArtifacts) {
                      for (const updated of data.updatedArtifacts) {
                        onArtifactUpdate(updated);
                      }
                    }
                  } catch (err: any) {
                    console.error('Apply changes failed:', err);
                    throw err;
                  } finally {
                    setIsApplyingChat(false);
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>



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
