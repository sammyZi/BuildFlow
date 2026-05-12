import React, { useEffect, useState } from 'react';
import { Project } from '@/types';
import { supabase } from '@/lib/supabase/client';

interface ProjectHistoryProps {
  onSelectProject: (projectId: string) => void;
  currentProjectId?: string;
}

export default function ProjectHistory({ onSelectProject, currentProjectId }: ProjectHistoryProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

          if (!error && data) {
            setProjects(data);
          }
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
    <div className="h-full flex flex-col bg-chat-sidebar1 font-sans border-r border-chat-border">
      {/* Top logo area */}
      <div className="p-4 flex items-center justify-between mt-2 mb-2">
        <h2 className="text-lg font-extrabold text-chat-text flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-chat-accent text-white flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
          </div>
          Architect Hub
        </h2>
        <button 
          onClick={() => onSelectProject('')} 
          className="text-chat-textMuted hover:text-chat-text p-1.5 border border-chat-border bg-white rounded-full hover:bg-gray-50 transition-colors shadow-sm"
          title="New Project"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>
      
      {/* Projects List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
        <div>
          <div className="text-[11px] font-bold tracking-wider text-chat-textMuted mb-3 px-2 flex justify-between items-center uppercase">
            Previous Projects
            <span className="text-chat-textMuted/50 font-normal normal-case">{projects.length} Total</span>
          </div>
          
          <div className="space-y-[2px]">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-chat-textMuted animate-pulse">Loading...</div>
            ) : projects.length === 0 ? (
              <div className="p-4 text-center text-sm text-chat-textMuted">
                No projects yet. Generate your first one!
              </div>
            ) : (
              projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-[13.5px] truncate transition-colors border-l-2 ${
                    currentProjectId === project.id 
                      ? 'bg-chat-bubbleUser text-chat-text font-semibold border-chat-accent' 
                      : 'text-chat-text hover:bg-chat-bubbleUser border-transparent font-medium'
                  }`}
                >
                  {project.prompt || 'Untitled Project'}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
