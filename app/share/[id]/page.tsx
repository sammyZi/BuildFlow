'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import ResultsViewer from '@/components/ResultsViewer';
import { Artifact } from '@/types';
import { Loader2, AlertCircle } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function PublicSharePage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPublicProject() {
      if (!projectId) return;
      setIsLoading(true);
      setError(null);
      
      try {
        // Since we're accessing anonymously, we just use supabase standard client
        // It will rely on RLS policies (is_public = true) to allow access.
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('id, prompt, is_public')
          .eq('id', projectId)
          .single();

        if (projectError || !projectData || !projectData.is_public) {
          throw new Error('Project not found or is not public.');
        }

        const { data: artifactsData, error: artifactsError } = await supabase
          .from('artifacts')
          .select('*')
          .eq('project_id', projectId);

        if (artifactsError) throw new Error('Failed to load artifacts.');

        // Sort artifacts
        const sorted = (artifactsData || []).sort((a, b) => {
          const order = { requirements: 0, design: 1, tasks: 2 };
          return (order[a.artifact_type as keyof typeof order] || 99) - (order[b.artifact_type as keyof typeof order] || 99);
        });

        setArtifacts(sorted);
      } catch (err: any) {
        console.error('Failed to load public project:', err);
        setError(err.message || 'Failed to load project.');
      } finally {
        setIsLoading(false);
      }
    }

    loadPublicProject();
  }, [projectId]);

  const handleDownloadBundle = async () => {
    try {
      const { downloadBundle } = await import('@/lib/downloadBundle');
      await downloadBundle(artifacts, projectId);
    } catch (err) {
      console.error('Failed to download bundle:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-bg">
        <div className="flex items-center gap-2 mb-6 opacity-50">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Logo className="w-5 h-5 text-primary" />
          </div>
          <span className="text-[17px] font-extrabold text-text-primary tracking-tight">BuildFlow</span>
        </div>
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="text-text-muted mt-4 font-medium animate-pulse">Loading shared project...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-bg">
        <AlertCircle size={48} className="text-error mb-4" />
        <h1 className="text-2xl font-bold text-text-primary mb-2">Access Denied</h1>
        <p className="text-text-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-bg">
      {/* Read-only Header */}
      <div className="flex-shrink-0 h-14 border-b border-border bg-surface flex items-center justify-between px-6 print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shadow-sm">
            <Logo className="w-5 h-5 text-primary" />
          </div>
          <span className="text-[17px] font-extrabold text-text-primary tracking-tight">BuildFlow</span>
          <span className="ml-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-alt border border-border text-text-muted">
            Read Only
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ResultsViewer
          artifacts={artifacts}
          isLoading={false}
          onDownloadBundle={handleDownloadBundle}
          projectId={projectId}
          readOnly={true}
        />
      </div>
    </div>
  );
}
