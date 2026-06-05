'use client';

import { useRef, useEffect, useState } from 'react';
import { FileText, GitBranch, ListChecks, CheckCircle2, Loader2, ChevronDown, Sparkles } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

export type FileStage = 'requirements' | 'design' | 'tasks';
export type FileStatus = 'pending' | 'streaming' | 'saving' | 'done';

export interface StreamingFile {
  stage: FileStage;
  filename: string;
  status: FileStatus;
  content: string;
}

interface StreamingProgressProps {
  files: StreamingFile[];
  progress: number;
  message: string;
}

// ─── Stage config ───────────────────────────────────────────────────────────

const STAGE_META: Record<FileStage, { label: string; icon: typeof FileText; gradient: string; bgTint: string }> = {
  requirements: {
    label: 'Requirements',
    icon: FileText,
    gradient: 'from-blue-500 to-indigo-500',
    bgTint: 'bg-blue-500/5',
  },
  design: {
    label: 'System Design',
    icon: GitBranch,
    gradient: 'from-violet-500 to-purple-500',
    bgTint: 'bg-violet-500/5',
  },
  tasks: {
    label: 'Tasks',
    icon: ListChecks,
    gradient: 'from-emerald-500 to-teal-500',
    bgTint: 'bg-emerald-500/5',
  },
};

// ─── File entry row ─────────────────────────────────────────────────────────

function FileEntry({ file }: { file: StreamingFile }) {
  const meta = STAGE_META[file.stage];
  const Icon = meta.icon;
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(file.status === 'streaming');

  // Auto-expand when streaming starts, auto-collapse when done
  useEffect(() => {
    if (file.status === 'streaming') setIsExpanded(true);
  }, [file.status]);

  // Auto-scroll content as new text arrives
  useEffect(() => {
    if (contentRef.current && file.status === 'streaming') {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [file.content, file.status]);

  const statusBadge = () => {
    switch (file.status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            Pending
          </span>
        );
      case 'streaming':
        return (
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-primary">
            <Loader2 size={12} className="animate-spin" />
            Generating
          </span>
        );
      case 'saving':
        return (
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-500">
            <Loader2 size={12} className="animate-spin" />
            Saving
          </span>
        );
      case 'done':
        return (
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-500">
            <CheckCircle2 size={13} />
            Complete
          </span>
        );
    }
  };

  const canExpand = file.content.length > 0;

  return (
    <div
      className={`rounded-xl border transition-all duration-300 overflow-hidden ${
        file.status === 'streaming'
          ? 'border-primary/30 shadow-[0_0_20px_rgba(74,107,255,0.08)]'
          : file.status === 'done'
          ? 'border-emerald-200/60'
          : 'border-white/40'
      }`}
    >
      {/* File header */}
      <button
        onClick={() => canExpand && setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
          canExpand ? 'cursor-pointer hover:bg-white/30' : 'cursor-default'
        } ${file.status === 'streaming' ? meta.bgTint : ''}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br ${meta.gradient} shadow-sm`}>
            <Icon size={14} className="text-white" strokeWidth={2} />
          </div>
          <div className="text-left">
            <p className="text-[14px] font-semibold text-text-primary leading-tight">
              {file.filename}
            </p>
            {file.status === 'done' && !isExpanded && (
              <p className="text-[11px] text-text-muted mt-0.5">
                {file.content.split('\n').length} lines generated
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {statusBadge()}
          {canExpand && (
            <ChevronDown
              size={16}
              className={`text-text-muted transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          )}
        </div>
      </button>

      {/* Expandable content preview */}
      <div
        className={`transition-all duration-300 ease-out overflow-hidden ${
          isExpanded && canExpand ? 'max-h-[260px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-t border-white/30">
          <div
            ref={contentRef}
            className="px-4 py-3 max-h-[240px] overflow-y-auto custom-scrollbar"
          >
            <pre className="text-[12px] leading-[1.7] text-text-secondary font-mono whitespace-pre-wrap break-words">
              {file.content}
              {file.status === 'streaming' && (
                <span className="inline-block w-[2px] h-[14px] bg-primary ml-[1px] align-middle animate-blink" />
              )}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function StreamingProgress({ files, progress, message }: StreamingProgressProps) {
  return (
    <div className="mt-6 animate-fade-in w-full">
      <div
        className="rounded-2xl border border-white/60 overflow-hidden shadow-lg"
        style={{ background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(24px)' }}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary animate-pulse" />
            <span className="text-[15px] font-semibold text-text-primary">
              {message || 'Generating your project…'}
            </span>
          </div>
          <span className="text-[14px] font-bold text-primary tabular-nums">
            {Math.round(progress)}%
          </span>
        </div>

        {/* File entries */}
        <div className="px-4 pb-3 flex flex-col gap-2">
          {files.map((file) => (
            <FileEntry key={file.stage} file={file} />
          ))}
        </div>

        {/* Bottom progress bar */}
        <div className="h-1.5 bg-gray-100 w-full">
          <div
            className="h-full bg-gradient-to-r from-primary via-violet-500 to-primary rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.max(progress, 2)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
