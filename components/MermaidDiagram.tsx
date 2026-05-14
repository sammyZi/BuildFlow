'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Maximize2, X } from 'lucide-react';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export default function MermaidDiagram({ chart, className = '' }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      suppressErrorRendering: true,
      fontFamily: 'Inter, system-ui, sans-serif',
      // Force natural size to prevent text from being shrunk to illegibility
      // @ts-expect-error - useMaxWidth is valid at runtime but missing from type config
      useMaxWidth: false,
      themeVariables: {
        primaryColor: '#6366f1',
        primaryTextColor: '#fff',
        primaryBorderColor: '#4f46e5',
        lineColor: '#6366f1',
        secondaryColor: '#f3f4f6',
        tertiaryColor: '#e5e7eb',
      },
    });
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!chart) return;
      
      try {
        setError('');
        
        // Try rendering raw chart first
        let chartToRender = chart;
        
        try {
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await mermaid.render(id, chartToRender);
          setSvg(svg);
        } catch (initialErr) {
          // If it fails, try a basic sanitization for common issues
          chartToRender = chart
            .replace(/--\((.*?)\)-->/g, '-->|"$1"|')
            .replace(/\|([^"|]+)\|/g, '\|"$1"\|');
          
          const fallbackId = `mermaid-fallback-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await mermaid.render(fallbackId, chartToRender);
          setSvg(svg);
        }
      } catch (err: any) {
        console.error('Mermaid rendering error:', err);
        
        // Remove any orphaned error SVGs injected by Mermaid into the DOM body
        document.querySelectorAll('svg[id^="dmermaid-"]').forEach(el => el.remove());
        
        // Try to render as plain text fallback
        setError('Unable to render diagram. Showing source code instead.');
        setSvg(`<pre class="text-xs text-gray-700 whitespace-pre-wrap">${chart}</pre>`);
      }
    };

    renderDiagram();
  }, [chart]);

  if (error) {
    return (
      <div>
        <div className="p-3 mb-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          <p className="font-semibold">Diagram rendering issue</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
    );
  }

  return (
    <>
      <div className={`group relative inline-block w-full ${className}`}>
        <div 
          ref={containerRef} 
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute top-2 right-2 p-2 bg-white shadow-md text-text-muted hover:text-text-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-border"
          title="View full screen"
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/80 backdrop-blur-sm p-4 sm:p-8 animate-fade-in">
          <div className="flex justify-end mb-4">
            <button 
              onClick={() => setIsFullscreen(false)} 
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center justify-center"
              title="Close fullscreen"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-auto bg-white rounded-xl shadow-2xl p-8">
            <div 
              className="min-w-full flex justify-center"
              dangerouslySetInnerHTML={{ __html: svg }} 
            />
          </div>
        </div>
      )}
    </>
  );
}
