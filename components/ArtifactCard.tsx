import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import GlassmorphismCard from './GlassmorphismCard';
import { Artifact, ArtifactType } from '@/types';

interface ArtifactCardProps {
  artifact: Artifact;
}

// Map artifact types to display-friendly headings
const artifactTypeHeadings: Record<ArtifactType, string> = {
  requirements: 'Requirements',
  design: 'Design',
  tasks: 'Tasks',
};

export default function ArtifactCard({ artifact }: ArtifactCardProps) {
  const heading = artifactTypeHeadings[artifact.artifact_type];

  return (
    <GlassmorphismCard className="mb-4">
      <h2 className="text-2xl font-bold text-text-secondary mb-4 border-b border-border pb-2">
        {heading}
      </h2>
      <div className="prose prose-sm max-w-none text-text-secondary">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Style headings with light theme colors
            h1: ({ node, ...props }) => (
              <h1 className="text-xl font-bold text-text-primary mt-4 mb-2" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="text-lg font-semibold text-text-secondary mt-3 mb-2" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-base font-semibold text-text-secondary mt-2 mb-1" {...props} />
            ),
            // Style paragraphs
            p: ({ node, ...props }) => (
              <p className="text-text-secondary mb-2 leading-relaxed" {...props} />
            ),
            // Style lists
            ul: ({ node, ...props }) => (
              <ul className="list-disc list-inside text-text-secondary mb-2 space-y-1" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal list-inside text-text-secondary mb-2 space-y-1" {...props} />
            ),
            li: ({ node, ...props }) => (
              <li className="text-text-secondary" {...props} />
            ),
            // Style code blocks
            code: ({ node, className, ...props }) => {
              const isInline = !className?.includes('language-');
              return isInline ? (
                <code className="bg-surface-alt text-text-secondary px-1 py-0.5 rounded text-sm" {...props} />
              ) : (
                <code className="block bg-surface-alt text-text-secondary p-3 rounded-md overflow-x-auto text-sm" {...props} />
              );
            },
            // Style blockquotes
            blockquote: ({ node, ...props }) => (
              <blockquote className="border-l-4 border-border pl-4 italic text-text-muted my-2" {...props} />
            ),
            // Style links
            a: ({ node, ...props }) => (
              <a className="text-blue-600 hover:text-blue-800 underline" {...props} />
            ),
            // Style tables
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto my-4"><table className="w-full text-left border-collapse" {...props} /></div>
            ),
            th: ({ node, ...props }) => (
              <th className="bg-surface-alt px-4 py-2 border-b-2 border-border font-semibold text-text-secondary" {...props} />
            ),
            td: ({ node, ...props }) => (
              <td className="px-4 py-2 border-b border-border text-text-secondary" {...props} />
            ),
          }}
        >
          {artifact.content}
        </ReactMarkdown>
      </div>
    </GlassmorphismCard>
  );
}
