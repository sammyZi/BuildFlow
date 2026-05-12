'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import InputPanel from '@/components/InputPanel';
import ResultsGrid from '@/components/ResultsGrid';
import ProjectHistory from '@/components/ProjectHistory';
import { Artifact } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { SupabaseService } from '@/lib/supabase/service';

export default function DashboardPage() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>();

  useEffect(() => {
    if (!currentProjectId) {
      setArtifacts([]);
      return;
    }
    
    async function loadArtifacts() {
      setIsLoading(true);
      try {
        const data = await SupabaseService.getArtifactsByProject(currentProjectId!);
        setArtifacts(data);
      } catch (err) {
        console.error('Failed to load artifacts:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadArtifacts();
  }, [currentProjectId]);

  const handleSubmit = async (appIdea: string) => {
    setIsLoading(true);
    setArtifacts([]);
    setCurrentProjectId(undefined);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Authentication error: Unable to get session token. Please log in again.');
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          appIdea,
          userId: session.user.id
        })
      });

      if (!response.ok) {
        let errorMsg = 'Failed to generate artifacts';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          errorMsg = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Generation pipeline error');
      }

      console.log('Successfully started generation for project:', data.projectId);
      setCurrentProjectId(data.projectId);
    } catch (error: any) {
      console.error('Failed to submit app idea:', error);
      throw new Error(error.message || 'Network connectivity error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadBundle = async () => {
    if (!currentProjectId) return;
    try {
      // Dynamic import to avoid SSR issues if it uses browser APIs
      const { downloadBundle } = await import('@/lib/downloadBundle');
      await downloadBundle(artifacts, currentProjectId);
    } catch (error) {
      console.error('Failed to download bundle:', error);
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout
        sidebar={
          <ProjectHistory 
            onSelectProject={setCurrentProjectId} 
            currentProjectId={currentProjectId} 
          />
        }
        leftPanel={
          <InputPanel 
            onSubmit={handleSubmit} 
            isLoading={isLoading && !currentProjectId}
          />
        }
        rightPanel={
          <ResultsGrid 
            artifacts={artifacts}
            isLoading={isLoading && !!currentProjectId}
            onDownloadBundle={handleDownloadBundle}
            projectId={currentProjectId}
          />
        }
      />
    </AuthGuard>
  );
}
