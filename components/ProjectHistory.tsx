import React, { useEffect, useState } from 'react';
import { Project } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { SupabaseService } from '@/lib/supabase/service';
import { Layers, Plus, FileText, Clock, FolderOpen, ChevronsLeft } from 'lucide-react';

interface ProjectHistoryProps {
  onSelectProject: (projectId: string) => void;
  currentProjectId?: string;
  onCollapse?: () => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getPreview(prompt: string): string {
  if (!prompt) return 'Untitled Project';
  return prompt.length > 70 ? prompt.substring(0, 70) + '…' : prompt;
}

export default function ProjectHistory({ onSelectProject, currentProjectId, onCollapse }: ProjectHistoryProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const data = await SupabaseService.getProjectsByUser(session.user.id);
          const sorted = [...data].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setProjects(sorted);
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadProjects();
  }, [currentProjectId]);

  return (
    <div className="h-full flex flex-col bg-sidebar-bg font-sans">
      {/* Logo + collapse */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <Layers size={13} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[14px] font-extrabold text-white tracking-tight">Architect</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSelectProject('')}
            className="p-1.5 text-sidebar-text-muted hover:text-white hover:bg-sidebar-active rounded-lg transition-colors"
            title="New Project"
          >
            <Plus size={15} strokeWidth={2} />
          </button>
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="p-1.5 text-sidebar-text-muted hover:text-white hover:bg-sidebar-active rounded-lg transition-colors"
              title="Collapse sidebar"
            >
              <ChevronsLeft size={15} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      <div className="mx-3 border-t border-sidebar-border" />

      {/* History label */}
      <div className="px-4 pt-3 pb-1.5 flex items-center gap-1.5">
        <Clock size={10} className="text-sidebar-text-muted" strokeWidth={2} />
        <p className="text-[10px] font-bold tracking-[0.1em] text-sidebar-text-muted uppercase">History</p>
      </div>

      {/* Projects */}
      <div className="flex-1 overflow-y-auto px-2 pb-3 dark-scroll">
        <div className="space-y-px">
          {isLoading ? (
            <div className="space-y-2 px-2 pt-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 rounded-lg shimmer-bg opacity-10" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <FolderOpen size={20} className="mx-auto text-sidebar-text-muted/40 mb-2" strokeWidth={1.5} />
              <p className="text-[11px] text-sidebar-text-muted">No projects yet</p>
            </div>
          ) : (
            projects.map(project => {
              const isActive = currentProjectId === project.id;
              return (
                <button
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all group ${
                    isActive
                      ? 'bg-sidebar-active text-white'
                      : 'text-sidebar-text hover:bg-sidebar-active/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <FileText
                      size={13}
                      className={`mt-0.5 shrink-0 ${
                        isActive ? 'text-primary' : 'text-sidebar-text-muted group-hover:text-sidebar-text'
                      }`}
                      strokeWidth={1.5}
                    />
                    <div className="min-w-0">
                      <div className="text-[12px] leading-snug line-clamp-2 break-words">
                        {getPreview(project.prompt)}
                      </div>
                      <div className={`text-[10px] mt-0.5 ${isActive ? 'text-sidebar-text' : 'text-sidebar-text-muted'}`}>
                        {formatDate(project.created_at)}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
