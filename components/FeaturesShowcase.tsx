'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  LayoutTemplate,
  FileText,
  GitBranch,
  Code2,
  Share2,
  type LucideIcon,
} from 'lucide-react';

type Feature = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string; // tailwind text color for icon
  ring: string; // tailwind ring/border tint (used in preview)
  soft: string; // soft background tint for the active accordion row
  bar: string; // colored accent bar for the active row
  chip: string; // icon chip background for the active row
  glow: string; // rgba for soft glow behind preview
};

const FEATURES: Feature[] = [
  {
    id: 'workflow',
    title: 'Interactive Workflow',
    description: 'Answer a few questions, refine by chat.',
    icon: Sparkles,
    accent: 'text-blue-600',
    ring: 'ring-blue-200',
    soft: 'bg-blue-50/80',
    bar: 'bg-blue-500',
    chip: 'bg-blue-100',
    glow: 'rgba(74,107,255,0.18)',
  },
  {
    id: 'modes',
    title: 'Fast & Detailed Modes',
    description: 'Generate it all at once, or step by step.',
    icon: LayoutTemplate,
    accent: 'text-emerald-600',
    ring: 'ring-emerald-200',
    soft: 'bg-emerald-50/80',
    bar: 'bg-emerald-500',
    chip: 'bg-emerald-100',
    glow: 'rgba(16,185,129,0.16)',
  },
  {
    id: 'docs',
    title: 'Requirements, Design & Tasks',
    description: 'Three developer-ready docs, instantly.',
    icon: FileText,
    accent: 'text-pink-600',
    ring: 'ring-pink-200',
    soft: 'bg-pink-50/80',
    bar: 'bg-pink-500',
    chip: 'bg-pink-100',
    glow: 'rgba(236,72,153,0.16)',
  },
  {
    id: 'diagrams',
    title: 'Architecture Diagrams',
    description: 'Auto-generated diagrams of your system.',
    icon: GitBranch,
    accent: 'text-violet-600',
    ring: 'ring-violet-200',
    soft: 'bg-violet-50/80',
    bar: 'bg-violet-500',
    chip: 'bg-violet-100',
    glow: 'rgba(139,92,246,0.16)',
  },
  {
    id: 'code',
    title: 'Starter Code',
    description: 'A runnable starter project from your plan.',
    icon: Code2,
    accent: 'text-sky-600',
    ring: 'ring-sky-200',
    soft: 'bg-sky-50/80',
    bar: 'bg-sky-500',
    chip: 'bg-sky-100',
    glow: 'rgba(14,165,233,0.16)',
  },
  {
    id: 'share',
    title: 'Share & Export',
    description: 'Export as a ZIP or share a link.',
    icon: Share2,
    accent: 'text-amber-600',
    ring: 'ring-amber-200',
    soft: 'bg-amber-50/80',
    bar: 'bg-amber-500',
    chip: 'bg-amber-100',
    glow: 'rgba(245,158,11,0.18)',
  },
];

export default function FeaturesShowcase() {
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Reveal the section once it scrolls into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const activeFeature = FEATURES[active];

  return (
    <div id="features" ref={sectionRef} className="relative overflow-hidden py-24">
      {/* Soft accent glows — page gradient shows through behind them */}
      <div className="absolute -top-32 left-1/2 -z-10 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-[#4A6BFF]/10 blur-[120px]" />
      <div className="absolute bottom-0 right-[-10%] -z-10 h-[360px] w-[520px] rounded-full bg-[#A78BFA]/10 blur-[120px]" />
      <div className="absolute bottom-[10%] left-[-8%] -z-10 h-[320px] w-[460px] rounded-full bg-[#34D399]/10 blur-[120px]" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`mb-16 flex flex-col items-center text-center transition-all duration-700 ease-out ${
            inView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <span className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-[#4A6BFF]">
            Features
          </span>

          <h2
            className="text-balance text-4xl font-normal leading-[1.1] tracking-[-0.02em] text-[#0F172A] md:text-[2.85rem]"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Everything you need{' '}
            <span className="italic text-[#4A6BFF]">to plan.</span>
          </h2>

          <p className="mt-5 max-w-xl text-pretty text-[17px] leading-relaxed text-[#64748B]">
            A single, intelligent workspace that turns a rough idea into
            documents your developers can build from.
          </p>
        </div>

        <div
          className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center transition-all duration-700 ease-out delay-150 ${
            inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          {/* Left: timeline-style list — activates on hover, no cards */}
          <div
            className="relative flex flex-col"
            onMouseLeave={() => setActive(0)}
          >
            {/* vertical guide rail behind the nodes */}
            <span
              aria-hidden
              className="absolute left-[22px] top-7 bottom-7 w-px bg-gradient-to-b from-transparent via-[#DCE3F0] to-transparent"
            />

            {FEATURES.map((feature, index) => {
              const isActive = index === active;
              const Icon = feature.icon;
              return (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => setActive(index)}
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  aria-expanded={isActive}
                  className="group block w-full py-3.5 text-left"
                >
                  {/* icon + title on the same row, vertically centered */}
                  <div className="flex items-center gap-4">
                    <span
                      className={`relative z-10 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-500 ease-out ${
                        isActive
                          ? `${feature.chip} ${feature.accent} shadow-[0_8px_24px_-8px_rgba(17,24,39,0.25)] ring-4 ring-[#F4F7FE]`
                          : 'bg-white text-[#94A3B8] ring-1 ring-[#E5E9F2] group-hover:text-[#475569] group-hover:ring-[#CBD5E1]'
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>

                    <h3
                      className={`text-[17px] font-semibold tracking-tight transition-colors duration-500 ease-out ${
                        isActive
                          ? 'text-[#0F172A]'
                          : 'text-[#94A3B8] group-hover:text-[#475569]'
                      }`}
                    >
                      {feature.title}
                    </h3>
                  </div>

                  {/* description expands smoothly, aligned under the title */}
                  <div
                    className={`grid pl-[60px] transition-all duration-500 ease-out ${
                      isActive ? 'mt-2 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <p className="overflow-hidden pr-2 text-sm leading-relaxed text-[#64748B]">
                      {feature.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: frameless morphing preview */}
          <div className="relative flex min-h-[360px] items-center justify-center">
            {/* Soft color glow that shifts with the active feature */}
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[380px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px] transition-colors duration-700"
              style={{ background: activeFeature.glow }}
            />
            {/* faint dotted grid, no card */}
            <div
              className="pointer-events-none absolute inset-0 -z-10 opacity-60"
              style={{
                backgroundImage:
                  'radial-gradient(rgba(17,24,39,0.06) 1px, transparent 1px)',
                backgroundSize: '22px 22px',
                maskImage:
                  'radial-gradient(ellipse 70% 70% at 50% 50%, black 40%, transparent 100%)',
                WebkitMaskImage:
                  'radial-gradient(ellipse 70% 70% at 50% 50%, black 40%, transparent 100%)',
              }}
            />

            <div key={active} className="feature-enter w-full px-2 sm:px-6">
              <FeaturePreview feature={activeFeature} />
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes feature-progress {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
        @keyframes featureRise {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .feature-rise-item {
          opacity: 0;
          animation: featureRise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .feature-stagger > * {
          opacity: 0;
          animation: featureRise 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .feature-stagger > *:nth-child(1) {
          animation-delay: 0.08s;
        }
        .feature-stagger > *:nth-child(2) {
          animation-delay: 0.16s;
        }
        .feature-stagger > *:nth-child(3) {
          animation-delay: 0.24s;
        }
        .feature-stagger > *:nth-child(4) {
          animation-delay: 0.32s;
        }
        .feature-stagger > *:nth-child(5) {
          animation-delay: 0.4s;
        }
        .feature-stagger > *:nth-child(6) {
          animation-delay: 0.48s;
        }
        @media (prefers-reduced-motion: reduce) {
          .feature-rise-item,
          .feature-stagger > * {
            animation: none;
            opacity: 1;
          }
        }

        /* Docs: auto-shuffling stacked cards */
        @keyframes docStack {
          0%,
          28% {
            transform: translate(-50%, 0) scale(1);
            opacity: 1;
            z-index: 3;
          }
          36% {
            transform: translate(-50%, -46px) scale(1.03);
            opacity: 0;
            z-index: 3;
          }
          37% {
            transform: translate(-50%, 44px) scale(0.9);
            opacity: 0;
            z-index: 1;
          }
          46%,
          63% {
            transform: translate(calc(-50% + 26px), 34px) scale(0.92);
            opacity: 0.6;
            z-index: 1;
          }
          81%,
          90% {
            transform: translate(calc(-50% + 13px), 17px) scale(0.96);
            opacity: 0.85;
            z-index: 2;
          }
          100% {
            transform: translate(-50%, 0) scale(1);
            opacity: 1;
            z-index: 3;
          }
        }
        .doc-card {
          animation: docStack 9s cubic-bezier(0.65, 0, 0.35, 1) infinite;
          will-change: transform, opacity;
        }

        /* Diagrams: flowing connectors + pulsing nodes */
        @keyframes dashFlow {
          to {
            stroke-dashoffset: -28;
          }
        }
        @keyframes nodePulse {
          0%,
          100% {
            opacity: 0.35;
            transform: scale(0.85);
          }
          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }
        .diag-line {
          stroke-dasharray: 6 8;
          animation: dashFlow 1.1s linear infinite;
        }
        .diag-halo {
          transform-box: fill-box;
          transform-origin: center;
          animation: nodePulse 2.4s ease-in-out infinite;
        }

        /* Code: typing reveal + blinking cursor */
        @keyframes typeLine {
          0% {
            width: 0;
          }
          55% {
            width: var(--cw, 100%);
          }
          92% {
            width: var(--cw, 100%);
          }
          100% {
            width: 0;
          }
        }
        @keyframes blink {
          0%,
          49% {
            opacity: 1;
          }
          50%,
          100% {
            opacity: 0;
          }
        }
        .code-line {
          overflow: hidden;
          white-space: nowrap;
          width: 0;
          animation: typeLine 5.5s steps(24, end) infinite;
        }
        .code-cursor {
          animation: blink 1s steps(1) infinite;
        }

        /* Share: download progress fill */
        @keyframes fillBar {
          0%,
          10% {
            width: 0%;
          }
          70%,
          100% {
            width: 100%;
          }
        }
        .fill-bar {
          animation: fillBar 3s ease-in-out infinite;
        }
        @keyframes popIn {
          0%,
          60% {
            opacity: 0;
            transform: scale(0.6);
          }
          75% {
            opacity: 1;
            transform: scale(1.1);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .pop-in {
          animation: popIn 3s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .doc-card,
          .diag-line,
          .diag-halo,
          .code-line,
          .code-cursor,
          .fill-bar,
          .pop-in {
            animation: none;
          }
          .code-line {
            width: var(--cw, 100%);
          }
          .fill-bar {
            width: 70%;
          }
        }
      `}</style>
    </div>
  );
}

/* ---------- Per-feature mini visualisations ---------- */

function FeaturePreview({ feature }: { feature: Feature }) {
  const Icon = feature.icon;

  return (
    <div className="w-full max-w-sm">
      {/* Header chip shared by all previews */}
      <div className="feature-rise-item mb-5 flex items-center gap-2.5">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ${feature.ring} ${feature.accent}`}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="text-sm font-semibold text-[#374151]">{feature.title}</span>
      </div>

      {feature.id === 'workflow' && <WorkflowPreview />}
      {feature.id === 'modes' && <ModesPreview />}
      {feature.id === 'docs' && <DocsPreview />}
      {feature.id === 'diagrams' && <DiagramsPreview />}
      {feature.id === 'code' && <CodePreview />}
      {feature.id === 'share' && <SharePreview />}
    </div>
  );
}

function Bar({ w, className = '' }: { w: string; className?: string }) {
  return <div className={`h-2.5 rounded-full ${className}`} style={{ width: w }} />;
}

function WorkflowPreview() {
  return (
    <div className="feature-stagger space-y-3">
      <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-tr-sm bg-[#4A6BFF] px-4 py-2.5 text-xs font-medium text-white shadow-sm">
        A task app for small teams
      </div>
      <div className="w-fit max-w-[85%] space-y-2 rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-[#EEF0F3]">
        <Bar w="140px" className="bg-[#E5E7EB]" />
        <Bar w="110px" className="bg-[#EEF0F3]" />
      </div>
      <div className="ml-auto w-fit rounded-2xl rounded-tr-sm bg-[#EEF2FF] px-4 py-2.5 text-xs font-medium text-[#4338CA] shadow-sm">
        Add roles & permissions
      </div>
    </div>
  );
}

function ModesPreview() {
  return (
    <div className="feature-stagger space-y-4">
      <div className="flex gap-3">
        <div className="flex-1 rounded-2xl bg-white p-4 shadow-sm ring-2 ring-emerald-300">
          <div className="mb-2 text-xs font-semibold text-emerald-700">Fast</div>
          <div className="space-y-1.5">
            <Bar w="100%" className="bg-emerald-100" />
            <Bar w="70%" className="bg-[#EEF0F3]" />
          </div>
        </div>
        <div className="flex-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#EEF0F3]">
          <div className="mb-2 text-xs font-semibold text-[#6B7280]">Detailed</div>
          <div className="space-y-1.5">
            <Bar w="100%" className="bg-[#EEF0F3]" />
            <Bar w="85%" className="bg-[#EEF0F3]" />
          </div>
        </div>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#EEF0F3]">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
          <Bar w="60%" className="bg-[#EEF0F3]" />
        </div>
      </div>
    </div>
  );
}

function DocsPreview() {
  const docs = [
    { label: 'requirements.md', dot: 'text-pink-600', bar: 'bg-pink-100' },
    { label: 'design.md', dot: 'text-violet-600', bar: 'bg-violet-100' },
    { label: 'tasks.md', dot: 'text-blue-600', bar: 'bg-blue-100' },
  ];
  return (
    <div className="relative h-[180px] w-full">
      {docs.map((doc, i) => (
        <div
          key={doc.label}
          className="doc-card absolute left-1/2 top-3 w-[235px] rounded-2xl bg-white p-4 shadow-[0_16px_40px_-16px_rgba(17,24,39,0.3)] ring-1 ring-[#EEF0F3]"
          style={{ animationDelay: `${-i * 3}s` }}
        >
          <div className="mb-3 flex items-center gap-2">
            <FileText className={`h-4 w-4 ${doc.dot}`} />
            <span className="font-mono text-xs font-semibold text-[#374151]">{doc.label}</span>
          </div>
          <div className="space-y-2">
            <Bar w="100%" className={doc.bar} />
            <Bar w="82%" className="bg-[#F1F3F6]" />
            <Bar w="92%" className="bg-[#F1F3F6]" />
            <Bar w="64%" className="bg-[#F1F3F6]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DiagramsPreview() {
  return (
    <svg viewBox="0 0 320 160" className="feature-stagger w-full" fill="none">
      <line x1="160" y1="44" x2="80" y2="110" stroke="#DDD6FE" strokeWidth="2" />
      <line x1="160" y1="44" x2="240" y2="110" stroke="#DDD6FE" strokeWidth="2" />
      <line x1="80" y1="110" x2="240" y2="110" stroke="#EDE9FE" strokeWidth="2" strokeDasharray="4 4" />
      <g>
        <rect x="120" y="20" width="80" height="32" rx="9" fill="white" stroke="#C4B5FD" strokeWidth="1.5" />
        <rect x="138" y="33" width="44" height="6" rx="3" fill="#DDD6FE" />
      </g>
      <g>
        <rect x="40" y="96" width="80" height="32" rx="9" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
        <rect x="58" y="109" width="44" height="6" rx="3" fill="#EEF0F3" />
      </g>
      <g>
        <rect x="200" y="96" width="80" height="32" rx="9" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
        <rect x="218" y="109" width="44" height="6" rx="3" fill="#EEF0F3" />
      </g>
    </svg>
  );
}

function CodePreview() {
  const lines: [string, string][] = [
    ['28px', '#7DD3FC'],
    ['64px', '#E5E7EB'],
    ['96px', '#BAE6FD'],
    ['52px', '#E5E7EB'],
    ['80px', '#7DD3FC'],
  ];
  return (
    <div className="feature-stagger overflow-hidden rounded-2xl bg-[#0F172A] p-4 shadow-sm">
      <div className="mb-3 flex gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
      </div>
      <div className="space-y-2 font-mono">
        {lines.map((line, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[10px] text-[#475569]">{i + 1}</span>
            <div className="flex gap-1.5" style={{ marginLeft: `${(i % 3) * 12}px` }}>
              <div className="h-2 rounded bg-[#334155]" style={{ width: '20px' }} />
              <div className="h-2 rounded" style={{ width: line[0], background: line[1] }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SharePreview() {
  return (
    <div className="feature-stagger space-y-3">
      <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-[#EEF0F3]">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600 text-xs font-bold">
          ZIP
        </span>
        <div className="flex-1 space-y-1.5">
          <Bar w="120px" className="bg-[#EEF0F3]" />
          <Bar w="80px" className="bg-[#F1F3F6]" />
        </div>
        <div className="h-7 rounded-lg bg-[#111827] px-3 text-[10px] font-semibold leading-7 text-white">
          Download
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-[#EEF0F3]">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          <Share2 className="h-4 w-4" />
        </span>
        <div className="flex-1 rounded-lg bg-[#F8FAFC] px-3 py-1.5 text-[10px] text-[#6B7280] ring-1 ring-[#EEF0F3]">
          buildflow.app/share/3f9a…
        </div>
      </div>
    </div>
  );
}
