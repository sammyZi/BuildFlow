import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Project } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { SupabaseService } from '@/lib/supabase/service';
import { Layers, Plus, FileText, Clock, FolderOpen, ChevronsLeft, LogOut, Trash2, Loader2, Edit3 } from 'lucide-react';

import { Logo } from '@/components/ui/Logo';

interface ProjectHistoryProps {
  onSelectProject: (projectId: string) => void;
  currentProjectId?: string;
  onCollapse?: () => void;
  onSignOut?: () => void;
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

export default function ProjectHistory({ onSelectProject, currentProjectId, onCollapse, onSignOut }: ProjectHistoryProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

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

  const handleDeleteClick = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation(); // Prevent triggering onSelectProject
    setProjectToDelete(projectId);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    setDeletingId(projectToDelete);
    try {
      await SupabaseService.deleteProject(projectToDelete);
      setProjects(prev => prev.filter(p => p.id !== projectToDelete));
      if (currentProjectId === projectToDelete) {
        onSelectProject('');
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project');
    } finally {
      setDeletingId(null);
      setProjectToDelete(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-sidebar-bg font-sans">
      {/* Logo + collapse */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
            <Logo className="w-6 h-6" />
          </div>
          <span className="text-[17px] font-extrabold text-white tracking-tight">BuildFlow</span>
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
              <p className="text-[13px] text-sidebar-text-muted">No projects yet</p>
            </div>
          ) : (
            projects.map(project => {
              const isActive = currentProjectId === project.id;
              const isDeleting = deletingId === project.id;
              
              return (
                <button
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all group relative ${
                    isActive
                      ? 'bg-sidebar-active text-white'
                      : 'text-sidebar-text hover:bg-sidebar-active/60 hover:text-white'
                  }`}
                  disabled={isDeleting}
                >
                  <div className="flex items-start gap-2 pr-6">
                    {project.status === 'draft' ? (
                      <Edit3
                        size={13}
                        className={`mt-0.5 shrink-0 ${
                          isActive ? 'text-primary' : 'text-sidebar-text-muted group-hover:text-sidebar-text'
                        }`}
                        strokeWidth={1.5}
                      />
                    ) : (
                      <FileText
                        size={13}
                        className={`mt-0.5 shrink-0 ${
                          isActive ? 'text-primary' : 'text-sidebar-text-muted group-hover:text-sidebar-text'
                        }`}
                        strokeWidth={1.5}
                      />
                    )}
                    <div className="min-w-0">
                      <div className="text-[14px] leading-snug line-clamp-2 break-words">
                        {getPreview(project.prompt)}
                      </div>
                      <div className={`flex items-center gap-1.5 text-[10px] mt-0.5 ${isActive ? 'text-sidebar-text' : 'text-sidebar-text-muted'}`}>
                        {project.status === 'draft' && (
                          <span className="px-1 py-0.5 rounded-[4px] bg-primary/20 text-primary uppercase font-bold tracking-wider text-[8px] leading-none">Draft</span>
                        )}
                        <span>{formatDate(project.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Delete Button */}
                  <div 
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-sidebar-text-muted hover:text-error hover:bg-error/10 transition-colors ${
                      isDeleting ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    onClick={(e) => handleDeleteClick(e, project.id)}
                  >
                    {isDeleting ? (
                      <Loader2 size={13} className="animate-spin text-error" />
                    ) : (
                      <Trash2 size={13} strokeWidth={2} />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Sign out button at bottom */}
      {onSignOut && (
        <>
          <div className="mx-3 border-t border-sidebar-border" />
          <div className="px-3 py-3">
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-[14px] font-medium text-sidebar-text hover:text-white hover:bg-sidebar-active rounded-lg transition-colors"
            >
              <LogOut size={14} strokeWidth={1.5} />
              Sign out
            </button>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {projectToDelete && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg border border-border w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6 mx-4 animate-fade-in-up">
            <h3 className="text-lg font-bold text-text-primary mb-2">Delete Project</h3>
            <p className="text-[15px] text-text-secondary mb-6">
              Are you sure you want to delete this project? All generated artifacts and history will be permanently lost. This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setProjectToDelete(null)}
                disabled={deletingId !== null}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary font-bold hover:bg-surface-alt transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingId !== null}
                className="flex-1 px-4 py-2.5 rounded-xl bg-error text-white font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deletingId !== null ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
