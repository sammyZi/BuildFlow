'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MermaidDiagram from './MermaidDiagram';

interface MarkdownRendererProps {
  content: string;
  /** Additional Tailwind prose classes to customize the renderer's look. */
  className?: string;
}

/**
 * Shared markdown renderer with Mermaid diagram support.
 * Used across ResultsViewer, ResultsGrid, and the Questionnaire page.
 *
 * Handles:
 * - GitHub Flavored Markdown (tables, strikethrough, task lists)
 * - Mermaid diagram code blocks → rendered SVG
 * - Regular code blocks with language detection
 * - Inline code
 */
export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div
      className={`prose prose-sm md:prose-base max-w-none
        prose-headings:text-text-primary prose-headings:font-bold prose-headings:tracking-tight
        prose-h1:text-[26px] prose-h1:mb-6 prose-h1:pb-3 prose-h1:border-b prose-h1:border-border
        prose-h2:text-[21px] prose-h2:mt-10 prose-h2:mb-4
        prose-h3:text-[17px] prose-h3:mt-8
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-p:text-text-secondary prose-p:leading-[1.8] prose-p:mb-6
        prose-ul:my-5 prose-ul:space-y-2
        prose-li:text-text-secondary prose-li:leading-[1.7]
        prose-table:w-full prose-table:my-6 prose-table:text-left
        prose-th:bg-surface-alt prose-th:px-4 prose-th:py-2 prose-th:border-b-2 prose-th:border-border
        prose-td:px-4 prose-td:py-2 prose-td:border-b prose-td:border-border
        prose-code:text-pink-600 prose-code:bg-pink-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[15px]
        prose-pre:bg-[#1a1a2e] prose-pre:text-gray-200 prose-pre:rounded-xl prose-pre:border-0
        prose-hr:border-border
        prose-strong:text-text-primary prose-strong:font-bold
        prose-blockquote:border-primary/30 prose-blockquote:bg-primary-faint prose-blockquote:rounded-r-lg prose-blockquote:py-1
        ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, className: codeClassName, children, ...props }) {
            const match = /language-(\w+)/.exec(codeClassName || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');

            // Render Mermaid diagrams
            if (language === 'mermaid') {
              return (
                <div className="my-6 p-4 bg-white rounded-lg border border-border overflow-x-auto hide-scrollbar">
                  <div className="min-w-fit flex justify-center">
                    <MermaidDiagram chart={codeString} />
                  </div>
                </div>
              );
            }

            // Regular code blocks
            if (match) {
              return (
                <pre className={codeClassName}>
                  <code className={codeClassName} {...props}>
                    {children}
                  </code>
                </pre>
              );
            }

            // Inline code
            return (
              <code className={codeClassName} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
