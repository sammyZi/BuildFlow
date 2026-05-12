import React from 'react';
import ReactMarkdown from 'react-markdown';
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
      <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b border-gray-300 pb-2">
        {heading}
      </h2>
      <div className="prose prose-sm max-w-none text-gray-700">
        <ReactMarkdown
          components={{
            // Style headings with light theme colors
            h1: ({ node, ...props }) => (
              <h1 className="text-xl font-bold text-gray-900 mt-4 mb-2" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="text-lg font-semibold text-gray-800 mt-3 mb-2" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-base font-semibold text-gray-700 mt-2 mb-1" {...props} />
            ),
            // Style paragraphs
            p: ({ node, ...props }) => (
              <p className="text-gray-700 mb-2 leading-relaxed" {...props} />
            ),
            // Style lists
            ul: ({ node, ...props }) => (
              <ul className="list-disc list-inside text-gray-700 mb-2 space-y-1" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal list-inside text-gray-700 mb-2 space-y-1" {...props} />
            ),
            li: ({ node, ...props }) => (
              <li className="text-gray-700" {...props} />
            ),
            // Style code blocks
            code: ({ node, className, ...props }) => {
              const isInline = !className?.includes('language-');
              return isInline ? (
                <code className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-sm" {...props} />
              ) : (
                <code className="block bg-gray-100 text-gray-800 p-3 rounded-md overflow-x-auto text-sm" {...props} />
              );
            },
            // Style blockquotes
            blockquote: ({ node, ...props }) => (
              <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-2" {...props} />
            ),
            // Style links
            a: ({ node, ...props }) => (
              <a className="text-blue-600 hover:text-blue-800 underline" {...props} />
            ),
          }}
        >
          {artifact.content}
        </ReactMarkdown>
      </div>
    </GlassmorphismCard>
  );
}
