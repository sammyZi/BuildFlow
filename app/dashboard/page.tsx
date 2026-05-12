'use client';

import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import InputPanel from '@/components/InputPanel';
import ResultsGrid from '@/components/ResultsGrid';
import { Artifact } from '@/types';

export default function DashboardPage() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (appIdea: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to /api/generate
      console.log('Submitting app idea:', appIdea);
      
      // Placeholder - will be implemented in later tasks
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Failed to generate artifacts:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadBundle = () => {
    // TODO: Implement download bundle functionality
    console.log('Downloading bundle...');
  };

  return (
    <AuthGuard>
      <DashboardLayout
        leftPanel={
          <InputPanel 
            onSubmit={handleSubmit} 
            isLoading={isLoading}
          />
        }
        rightPanel={
          <ResultsGrid 
            artifacts={artifacts}
            isLoading={isLoading}
            onDownloadBundle={handleDownloadBundle}
          />
        }
      />
    </AuthGuard>
  );
}
