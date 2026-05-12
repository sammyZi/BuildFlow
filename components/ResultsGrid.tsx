'use client';

import React from 'react';
import GlassmorphismCard from './GlassmorphismCard';
import { Artifact } from '@/types';

interface ResultsGridProps {
  artifacts: Artifact[];
  isLoading?: boolean;
  onDownloadBundle?: () => void;
}

export default function ResultsGrid({ 
  artifacts, 
  isLoading = false,
  onDownloadBundle 
}: ResultsGridProps) {
  // Check if all 3 artifacts are complete
  const hasAllArtifacts = artifacts.length === 3;
  const artifactTypes = new Set(artifacts.map(a => a.artifact_type));
  const isComplete = hasAllArtifacts && 
    artifactTypes.has('requirements') && 
    artifactTypes.has('design') && 
    artifactTypes.has('tasks');

  // Sort artifacts in the correct order
  const sortedArtifacts = [...artifacts].sort((a, b) => {
    const order = { requirements: 0, design: 1, tasks: 2 };
    return order[a.artifact_type] - order[b.artifact_type];
  });

  return (
    <div className="space-y-4">
      <GlassmorphismCard>
        <h2 className="text-2xl font-bold text-light-text mb-4">
          Generated Artifacts
        </h2>
        
        {/* Empty State */}
        {!isLoading && artifacts.length === 0 && (
          <div className="text-center py-12">
            <svg 
              className="mx-auto h-12 w-12 text-light-textSecondary/40" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
            <p className="mt-4 text-light-textSecondary">
              No artifacts yet. Submit your app idea to get started.
            </p>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && artifacts.length === 0 && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div 
                key={i}
                className="animate-pulse bg-white/40 rounded-lg p-4 border border-light-border"
              >
                <div className="h-6 bg-light-textSecondary/20 rounded w-1/3 mb-3" />
                <div className="space-y-2">
                  <div className="h-4 bg-light-textSecondary/20 rounded" />
                  <div className="h-4 bg-light-textSecondary/20 rounded w-5/6" />
                  <div className="h-4 bg-light-textSecondary/20 rounded w-4/6" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Artifacts List */}
        {artifacts.length > 0 && (
          <div className="space-y-4">
            {sortedArtifacts.map((artifact) => (
              <ArtifactPreviewCard key={artifact.id} artifact={artifact} />
            ))}
          </div>
        )}

        {/* Loading indicator when generating additional artifacts */}
        {isLoading && artifacts.length > 0 && artifacts.length < 3 && (
          <div className="mt-4 p-4 bg-light-accentLight rounded-lg border border-light-accent/30">
            <div className="flex items-center gap-3">
              <svg 
                className="animate-spin h-5 w-5 text-light-accent" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-light-accent font-medium">
                Generating artifact {artifacts.length + 1} of 3...
              </span>
            </div>
          </div>
        )}

        {/* Download Bundle Button */}
        {isComplete && onDownloadBundle && (
          <div className="mt-6 pt-6 border-t border-light-border">
            <button
              onClick={onDownloadBundle}
              className="
                w-full 
                py-3 
                px-6 
                rounded-lg 
                bg-green-600 
                hover:bg-green-700
                text-white 
                font-semibold
                transition-all
                shadow-md
                hover:shadow-lg
                focus:outline-none
                focus:ring-2
                focus:ring-green-600
                focus:ring-offset-2
                min-h-[44px]
                flex
                items-center
                justify-center
                gap-2
              "
            >
              <svg 
                className="h-5 w-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                />
              </svg>
              Download Bundle
            </button>
          </div>
        )}
      </GlassmorphismCard>
    </div>
  );
}

// Artifact Preview Card Component
function ArtifactPreviewCard({ artifact }: { artifact: Artifact }) {
  const typeLabels = {
    requirements: 'Requirements',
    design: 'Design',
    tasks: 'Tasks'
  };

  const typeColors = {
    requirements: 'bg-blue-50 border-blue-200 text-blue-700',
    design: 'bg-purple-50 border-purple-200 text-purple-700',
    tasks: 'bg-green-50 border-green-200 text-green-700'
  };

  // Get first 200 characters as preview
  const preview = artifact.content.substring(0, 200) + (artifact.content.length > 200 ? '...' : '');

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-light-border hover:shadow-glow-sm transition-all">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-light-text">
          {typeLabels[artifact.artifact_type]}
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${typeColors[artifact.artifact_type]}`}>
          ✓ Complete
        </span>
      </div>
      
      <div className="text-sm text-light-textSecondary whitespace-pre-wrap font-mono bg-white/40 p-3 rounded border border-light-border/50">
        {preview}
      </div>
    </div>
  );
}
