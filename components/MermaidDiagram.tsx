'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export default function MermaidDiagram({ chart, className = '' }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter, system-ui, sans-serif',
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
        
        // Sanitize the chart to handle special characters in labels
        let sanitizedChart = chart
          // Replace parentheses in edge labels with quotes
          .replace(/\|([^|]*)\(/g, '|"$1(')
          .replace(/\)([^|]*)\|/g, ')$1"|')
          // Ensure all edge labels are properly quoted if they contain special chars
          .replace(/\|([^"|][^|]*[/()\[\]{}].*?)\|/g, '|"$1"|');
        
        const { svg } = await mermaid.render(`mermaid-${Date.now()}`, sanitizedChart);
        setSvg(svg);
      } catch (err: any) {
        console.error('Mermaid rendering error:', err);
        
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
    <div 
      ref={containerRef} 
      className={className}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
