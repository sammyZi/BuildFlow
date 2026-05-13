'use client';

import { useState } from 'react';
import { Artifact, ArtifactType } from '@/types';
import ReactMarkdown from 'react-markdown';
import MermaidDiagram from './MermaidDiagram';
import {
  FileText, GitBranch, ListChecks, Download,
  Folder, Copy, Check, Loader2, Clock, WifiOff, CheckCircle2
} from 'lucide-react';

interface ResultsViewerProps {
  artifacts: Artifact[];
  isLoading?: boolean;
  onDownloadBundle?: () => void;
  projectId?: string;
  showRefreshPrompt?: boolean;
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
}: ResultsViewerProps) {
  const [activeTab, setActiveTab] = useState<string>('requirements');
  const [copied, setCopied] = useState(false);

  const artifactTypes = new Set(artifacts.map(a => a.artifact_type));
  const isComplete = artifacts.length === 3
    && artifactTypes.has('requirements')
    && artifactTypes.has('design')
    && artifactTypes.has('tasks');

  const activeContent = artifacts.find(a => a.artifact_type === activeTab)?.content || null;
  const activeFile = TABS.find(t => t.id === activeTab);
  const readyCount = artifacts.length;

  const handleCopy = () => {
    if (!activeContent) return;
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Connection warning */}
      {showRefreshPrompt && (
        <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-[13px] flex items-center gap-2 flex-shrink-0">
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
      <div className="flex-1 flex overflow-hidden">
        {/* File sidebar */}
        <div className="w-[220px] bg-surface-alt border-r border-border flex flex-col flex-shrink-0">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Folder size={14} className="text-text-muted" strokeWidth={1.5} />
              <span className="text-[12px] font-bold text-text-primary tracking-wide uppercase">Output</span>
            </div>
            {!isComplete && artifacts.length > 0 && (
              <p className="text-[11px] text-text-muted mt-1">{readyCount}/3 generated</p>
            )}
          </div>

          <div className="flex-1 py-1.5 overflow-y-auto">
            {TABS.map(tab => {
              const isReady = artifactTypes.has(tab.id);
              const isActive = activeTab === tab.id;
              const TabIcon = tab.Icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-all border-l-2 ${
                    isActive
                      ? 'bg-surface border-primary text-primary font-semibold'
                      : 'border-transparent text-text-secondary hover:bg-surface hover:text-text-primary'
                  }`}
                >
                  <TabIcon size={16} className={isActive ? 'text-primary' : 'text-text-muted'} strokeWidth={1.5} />
                  <span className="truncate flex-1 text-left">{tab.filename}</span>
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

          {isComplete && onDownloadBundle && (
            <div className="p-3 border-t border-border">
              <button
                onClick={onDownloadBundle}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-[12px] font-bold transition-colors active:scale-[0.98]"
              >
                <Download size={15} strokeWidth={2} />
                Download All
              </button>
            </div>
          )}
        </div>

        {/* Content pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-surface">
          {/* Breadcrumb */}
          <div className="flex items-center justify-between px-6 py-2.5 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-1.5 text-[12px] text-text-muted">
              <Folder size={13} strokeWidth={1.5} />
              <span>output</span>
              <span className="text-text-faint">/</span>
              <span className="text-text-primary font-semibold">{activeFile?.filename}</span>
              {artifactTypes.has(activeTab as ArtifactType) && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-50 text-success text-[10px] font-bold">
                  Ready
                </span>
              )}
            </div>
            {activeContent && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] text-text-muted hover:text-text-primary hover:bg-surface-alt transition-colors"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>

          {/* Markdown content */}
          <div className="flex-1 overflow-y-auto">
            {activeContent ? (
              <div className="p-8 md:p-10 lg:p-12 max-w-4xl">
                <div className="prose prose-sm md:prose-base max-w-none
                  prose-headings:text-text-primary prose-headings:font-bold prose-headings:tracking-tight
                  prose-h1:text-[26px] prose-h1:mb-6 prose-h1:pb-3 prose-h1:border-b prose-h1:border-border
                  prose-h2:text-[21px] prose-h2:mt-10 prose-h2:mb-4
                  prose-h3:text-[17px] prose-h3:mt-8
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-p:text-text-secondary prose-p:leading-[1.8]
                  prose-li:text-text-secondary prose-li:leading-[1.7]
                  prose-code:text-pink-600 prose-code:bg-pink-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[13px]
                  prose-pre:bg-[#1a1a2e] prose-pre:text-gray-200 prose-pre:rounded-xl prose-pre:border-0
                  prose-hr:border-border
                  prose-strong:text-text-primary prose-strong:font-bold
                  prose-blockquote:border-primary/30 prose-blockquote:bg-primary-faint prose-blockquote:rounded-r-lg prose-blockquote:py-1"
                >
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : '';
                        const codeString = String(children).replace(/\n$/, '');

                        // Render Mermaid diagrams
                        if (language === 'mermaid') {
                          return (
                            <div className="my-6 p-4 bg-white rounded-lg border border-border">
                              <MermaidDiagram chart={codeString} />
                            </div>
                          );
                        }

                        // Regular code blocks
                        if (!inline && match) {
                          return (
                            <pre className={className}>
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                          );
                        }

                        // Inline code
                        return (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {activeContent}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-text-muted">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-4 animate-fade-in">
                    <div className="w-12 h-12 rounded-2xl bg-primary-muted flex items-center justify-center">
                      <Loader2 size={22} className="animate-spin text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-[15px] font-semibold text-text-primary mb-1">
                        Generating {activeFile?.label}
                      </p>
                      <p className="text-[13px] text-text-muted">This usually takes 15–30 seconds…</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 animate-fade-in">
                    <Clock size={28} className="text-text-faint" strokeWidth={1.2} />
                    <p className="text-[14px] text-text-muted">Waiting for generation…</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
