'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase/client';
import DiffViewer from './DiffViewer';
import {
  X, Clock, GitCommit, ChevronRight, Loader2, ArrowLeftRight
} from 'lucide-react';

interface Version {
  id: string;
  artifact_id: string;
  version_number: number;
  content: string;
  change_prompt: string | null;
  created_at: string;
}

interface VersionHistoryProps {
  artifactId: string;
  artifactType: string;
  currentContent: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function VersionHistory({
  artifactId,
  artifactType,
  currentContent,
  isOpen,
  onClose,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [compareWith, setCompareWith] = useState<'current' | string>('current');

  useEffect(() => {
    if (!isOpen || !artifactId) return;

    async function fetchVersions() {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const res = await fetch(`/api/artifacts/versions?artifactId=${artifactId}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });

        const data = await res.json();
        if (data.success) {
          setVersions(data.versions || []);
          if (data.versions?.length > 0) {
            setSelectedVersion(data.versions[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch versions:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchVersions();
  }, [isOpen, artifactId]);

  if (!isOpen) return null;

  const fileLabel = `${artifactType}.md`;

  // Determine what we're comparing
  const getCompareContent = () => {
    if (!selectedVersion) return { oldContent: '', newContent: currentContent, oldLabel: '', newLabel: 'Current' };

    if (compareWith === 'current') {
      return {
        oldContent: selectedVersion.content,
        newContent: currentContent,
        oldLabel: `v${selectedVersion.version_number}`,
        newLabel: 'Current',
      };
    }

    const compareVersion = versions.find(v => v.id === compareWith);
    if (!compareVersion) return { oldContent: selectedVersion.content, newContent: currentContent, oldLabel: `v${selectedVersion.version_number}`, newLabel: 'Current' };

    // Determine order (older first)
    const [older, newer] = selectedVersion.version_number < compareVersion.version_number
      ? [selectedVersion, compareVersion]
      : [compareVersion, selectedVersion];

    return {
      oldContent: older.content,
      newContent: newer.content,
      oldLabel: `v${older.version_number}`,
      newLabel: `v${newer.version_number}`,
    };
  };

  const { oldContent, newContent, oldLabel, newLabel } = getCompareContent();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8 animate-fade-in">
      <div className="bg-surface rounded-2xl shadow-2xl border border-border w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-alt shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-text-primary">Version History</h2>
              <p className="text-[13px] text-text-muted">{fileLabel} · {versions.length} version{versions.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-text-primary"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : versions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-text-muted gap-3 p-8">
              <GitCommit size={32} className="text-text-faint" />
              <p className="text-[15px] font-medium">No changes yet</p>
              <p className="text-[13px] text-text-muted">Versions will appear here when you refine this document.</p>
            </div>
          ) : (
            <>
              {/* Version list sidebar */}
              <div className="w-64 border-r border-border bg-bg overflow-y-auto shrink-0">
                <div className="p-3">
                  <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 px-2">Versions</p>

                  {/* Current (live) */}
                  <button
                    onClick={() => { setSelectedVersion(null); setCompareWith('current'); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-all ${
                      !selectedVersion ? 'bg-primary/10 border border-primary/30' : 'hover:bg-surface-alt border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-success shrink-0" />
                      <span className="text-[13px] font-semibold text-text-primary">Current</span>
                    </div>
                    <p className="text-[11px] text-text-muted mt-0.5 ml-4">Live version</p>
                  </button>

                  {versions.map((version) => (
                    <button
                      key={version.id}
                      onClick={() => { setSelectedVersion(version); setCompareWith('current'); }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-all ${
                        selectedVersion?.id === version.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-surface-alt border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <GitCommit size={12} className="text-text-muted shrink-0" />
                        <span className="text-[13px] font-semibold text-text-primary">v{version.version_number}</span>
                        <ChevronRight size={12} className="text-text-faint ml-auto" />
                      </div>
                      {version.change_prompt && (
                        <p className="text-[11px] text-text-muted mt-0.5 ml-5 truncate">
                          {version.change_prompt}
                        </p>
                      )}
                      <p className="text-[10px] text-text-faint mt-0.5 ml-5">
                        {formatDate(version.created_at)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Diff pane */}
              <div className="flex-1 overflow-y-auto p-6">
                {selectedVersion ? (
                  <div className="space-y-4">
                    {/* Compare selector */}
                    <div className="flex items-center gap-3 text-[13px]">
                      <ArrowLeftRight size={14} className="text-text-muted" />
                      <span className="text-text-muted">Comparing</span>
                      <span className="font-semibold text-text-primary bg-surface-alt px-2 py-0.5 rounded">
                        v{selectedVersion.version_number}
                      </span>
                      <span className="text-text-muted">with</span>
                      <select
                        value={compareWith}
                        onChange={(e) => setCompareWith(e.target.value)}
                        className="px-2 py-0.5 rounded border border-border bg-bg text-text-primary text-[13px] font-semibold"
                      >
                        <option value="current">Current (live)</option>
                        {versions
                          .filter(v => v.id !== selectedVersion.id)
                          .map(v => (
                            <option key={v.id} value={v.id}>v{v.version_number}</option>
                          ))
                        }
                      </select>
                    </div>

                    {/* Change prompt */}
                    {selectedVersion.change_prompt && (
                      <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[13px]">
                        <span className="font-semibold">Change: </span>
                        {selectedVersion.change_prompt}
                      </div>
                    )}

                    {/* Diff */}
                    <DiffViewer
                      oldContent={oldContent}
                      newContent={newContent}
                      oldLabel={oldLabel}
                      newLabel={newLabel}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-text-muted gap-2">
                    <p className="text-[15px] font-medium">Current version selected</p>
                    <p className="text-[13px]">Select a previous version to compare changes.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
