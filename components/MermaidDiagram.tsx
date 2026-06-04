'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import mermaid from 'mermaid';
import { Maximize2, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

function sanitizeMermaidChart(chart: string): string {
  let cleaned = chart;

  // 0. Fix subgraph closing: Mermaid uses `end`, not `}`. AI models often
  //    generate `}` from programming-language habits.
  //    Protect valid Mermaid double-brace shapes ({{ and }}) first,
  //    then replace any remaining lone `}` with `end`.
  cleaned = cleaned.replace(/\{\{/g, '\x00DBLOPEN\x00');
  cleaned = cleaned.replace(/\}\}/g, '\x00DBLCLOSE\x00');
  // Replace `}` that is either on its own line OR inline between content
  cleaned = cleaned.replace(/\}/g, 'end');
  cleaned = cleaned.replace(/\x00DBLOPEN\x00/g, '{{');
  cleaned = cleaned.replace(/\x00DBLCLOSE\x00/g, '}}');

  // 1. Replace edge labels syntax if they are not in quotes:
  // e.g. -->|some text| or -->|some "text"| -> -->|"some text"|
  cleaned = cleaned.replace(/-->\s*\|([^"|]+)\|/g, '-->|"$1"|');
  
  // Also handle old syntax like --(label)--> or -- label -->
  cleaned = cleaned.replace(/--\((.*?)\)-->/g, '-->|"$1"|');
  cleaned = cleaned.replace(/--\s*([^-\s>][^-]*?)\s*-->/g, '-->|"$1"|');

  // 2. Fix node definitions: NodeId[Label] where Label might contain special characters.
  // We match node ID, open brackets, label content, and close brackets.
  // Brackets can be: [, (, ([, [[, [((, ((, {, {{, >, [/, [\
  const shapes = [
    { open: '\\[\\[', close: '\\]\\]' },
    { open: '\\(\\[', close: '\\]\\)' },
    { open: '\\[\\(', close: '\\)\\]' },
    { open: '\\(\\(', close: '\\)\\)' },
    { open: '\\{\\{', close: '\\}\\}' },
    { open: '\\[\\/', close: '\\/\\]' },
    { open: '\\[\\\\', close: '\\\\\\]' },
    { open: '\\[\\\\', close: '\\/\\]' },
    { open: '\\[\\/', close: '\\\\\\]' },
    { open: '\\[', close: '\\]' }
  ];

  for (const shape of shapes) {
    const regex = new RegExp(`\\b([a-zA-Z0-9_-]+)\\s*(${shape.open})\\s*(.*?)\\s*(${shape.close})`, 'g');
    cleaned = cleaned.replace(regex, (match, nodeId, openBr, labelText, closeBr) => {
      const trimmed = labelText.trim();
      // If it's already wrapped in quotes, do nothing
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        return match;
      }
      // Replace internal double quotes with single quotes and wrap the whole label in double quotes
      const safeLabel = trimmed.replace(/"/g, "'");
      return `${nodeId}${openBr}"${safeLabel}"${closeBr}`;
    });
  }

  return cleaned;
}

function prepareSvgForFullscreen(svgString: string): string {
  // Mermaid sets explicit width/height attributes and inline max-width styles
  // on the <svg> element. These prevent CSS from scaling it down to fit.
  // Strip them and let the viewBox handle scaling.
  return svgString
    .replace(/(<svg[^>]*)\s+width="[^"]*"/gi, '$1')
    .replace(/(<svg[^>]*)\s+height="[^"]*"/gi, '$1')
    .replace(/(<svg[^>]*)\s+style="[^"]*"/gi, '$1 style="width:100%;height:100%;"');
}

export default function MermaidDiagram({ chart, className = '' }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isFullscreen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isFullscreen]);

  const handleWheel = (e: React.WheelEvent) => {
    if (!isFullscreen) return;
    const zoomSensitivity = 0.001;
    setZoom((prevZoom) => {
      const newZoom = prevZoom - e.deltaY * zoomSensitivity;
      return Math.min(Math.max(0.1, newZoom), 10);
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isFullscreen) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isFullscreen || !isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

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
          console.warn('Initial Mermaid render failed, attempting sanitization...', initialErr);
          // Try our advanced sanitization helper
          chartToRender = sanitizeMermaidChart(chart);
          
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
      <div className={`group relative flex flex-col w-full border border-border/50 rounded-xl bg-surface overflow-hidden ${className}`}>
        <div 
          ref={containerRef} 
          className="w-full overflow-x-auto custom-scrollbar p-4"
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

      {isFullscreen && createPortal(
        <div className="fixed inset-0 z-[9999] flex flex-col bg-black/80 backdrop-blur-sm p-4 sm:p-8 animate-fade-in overflow-hidden" style={{ height: '100vh', maxHeight: '100vh' }}>
          <div className="flex justify-between items-center mb-4 shrink-0">
            <div className="flex gap-2">
              <button 
                onClick={() => setZoom(z => Math.min(z + 0.2, 10))}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center"
                title="Zoom In"
              >
                <ZoomIn size={20} />
              </button>
              <button 
                onClick={() => setZoom(z => Math.max(z - 0.2, 0.1))}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center"
                title="Zoom Out"
              >
                <ZoomOut size={20} />
              </button>
              <button 
                onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center"
                title="Reset Zoom"
              >
                <RotateCcw size={20} />
              </button>
            </div>
            <button 
              onClick={() => setIsFullscreen(false)} 
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center justify-center"
              title="Close fullscreen"
            >
              <X size={24} />
            </button>
          </div>
          <div 
            className="flex-1 min-h-0 overflow-hidden bg-white rounded-xl shadow-2xl relative cursor-grab active:cursor-grabbing"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none p-8"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
              }}
              dangerouslySetInnerHTML={{ __html: prepareSvgForFullscreen(svg) }} 
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
