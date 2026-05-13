'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Artifact, ArtifactType } from '@/types';
import { SupabaseService } from '@/lib/supabase/service';
import ResultsViewer from '@/components/ResultsViewer';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [showRefreshPrompt, setShowRefreshPrompt] = useState(false);

  // Load existing artifacts
  useEffect(() => {
    if (!projectId) return;
    async function load() {
      setIsLoading(true);
      try {
        const data = await SupabaseService.getArtifactsByProject(projectId);
        setArtifacts(data);
      } catch (err) {
        console.error('Failed to load artifacts:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [projectId]);

  // Real-time subscription for new artifacts
  const handleNewArtifact = useCallback((newArtifact: Artifact) => {
    setArtifacts(prev => {
      if (prev.some(a => a.id === newArtifact.id)) return prev;
      const updated = [...prev, newArtifact];
      return updated.sort((a, b) => {
        const order: Record<ArtifactType, number> = { requirements: 0, design: 1, tasks: 2 };
        return order[a.artifact_type] - order[b.artifact_type];
      });
    });
  }, []);

  const handleDisconnect = useCallback(() => {
    setReconnectAttempts(prev => {
      const n = prev + 1;
      if (n >= 5) setShowRefreshPrompt(true);
      return n;
    });
  }, []);

  useEffect(() => {
    if (!projectId) return;
    const sub = SupabaseService.subscribeToArtifacts(projectId, handleNewArtifact, handleDisconnect);
    setReconnectAttempts(0);
    setShowRefreshPrompt(false);
    return () => { sub.unsubscribe(); };
  }, [projectId, handleNewArtifact, handleDisconnect]);

  // Download bundle
  const handleDownloadBundle = async () => {
    try {
      const { downloadBundle } = await import('@/lib/downloadBundle');
      await downloadBundle(artifacts, projectId);
    } catch (err) {
      console.error('Failed to download bundle:', err);
    }
  };

  return (
    <ResultsViewer
      artifacts={artifacts}
      isLoading={isLoading}
      onDownloadBundle={handleDownloadBundle}
      projectId={projectId}
      showRefreshPrompt={showRefreshPrompt}
    />
  );
}
