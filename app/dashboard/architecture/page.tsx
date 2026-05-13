'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import MermaidDiagram from '@/components/MermaidDiagram';

function ArchitectureContent() {
  const searchParams = useSearchParams();
  const diagram = searchParams.get('diagram') || '';
  const title = searchParams.get('title') || 'Architecture Diagram';
  const description = searchParams.get('description') || '';

  if (!diagram) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-2">No Diagram Provided</h2>
          <p className="text-text-muted">Please provide a diagram parameter in the URL</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-bg via-bg to-surface">
      <div className="min-h-full px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary tracking-tight mb-3">
              {title}
            </h1>
            {description && (
              <p className="text-text-muted">
                {description}
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-border/60 p-8 shadow-sm">
            <MermaidDiagram 
              chart={decodeURIComponent(diagram)}
              className="flex justify-center items-center"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ArchitecturePage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center">
        <div className="text-text-muted">Loading diagram...</div>
      </div>
    }>
      <ArchitectureContent />
    </Suspense>
  );
}
