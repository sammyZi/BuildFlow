'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, LayoutTemplate, SplitSquareHorizontal, FileText, Blocks, ListTodo, ChevronRight, ChevronLeft } from 'lucide-react';

export default function LandingPage() {
  const starsContainerRef = useRef<HTMLDivElement>(null);
  const shootingStarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = starsContainerRef.current;
    if (!container) return;

    // Build stars imperatively — zero React state, zero re-renders ever.
    // Previously: 45 items in useState + onAnimationIteration firing setStars
    // on every cycle = constant full component re-renders. Now: create DOM nodes
    // once, animate entirely in CSS, never touch React state again.
    const fragment = document.createDocumentFragment();
    const COUNT = 45;

    for (let i = 0; i < COUNT; i++) {
      const topVal = Math.random() * 100;
      const leftVal = Math.random() * 100;
      const dx = (leftVal - 50) / 100;
      const dy = (topVal - 50) / 100;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let opacity = 0;
      if (dist > 0.2) {
        opacity = Math.min((dist - 0.2) / 0.35, 1) * 0.8;
      }

      const size = Math.random() * 2.5 + 5.6;
      const delay = Math.random() * 5;
      const duration = 3 + Math.random() * 4;

      const outer = document.createElement('div');
      outer.style.cssText = `
        position:absolute;
        top:${topVal.toFixed(2)}%;
        left:${leftVal.toFixed(2)}%;
        width:${size}px;
        height:${size}px;
        opacity:${opacity};
        pointer-events:none;
        will-change:transform,opacity;
        transform:translate3d(0,0,0);
      `;

      const inner = document.createElement('div');
      inner.style.cssText = `
        width:100%;
        height:100%;
        background:white;
        clip-path:polygon(50% 0%,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0% 50%,40% 40%);
        animation:twinkle ${duration}s ease-in-out infinite ${delay}s;
        will-change:transform,opacity;
        transform:translate3d(0,0,0);
      `;

      outer.appendChild(inner);
      fragment.appendChild(outer);
    }

    container.appendChild(fragment);

    return () => {
      while (container.firstChild) container.removeChild(container.firstChild);
    };
  }, []);

  // Shooting stars — imperative DOM, random color, 2-3 per minute
  useEffect(() => {
    const container = shootingStarRef.current;
    if (!container) return;

    const COLORS = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFEAA7',
      '#DDA0DD', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#AED6F1', '#D2B4DE',
    ];

    let timeoutId: ReturnType<typeof setTimeout>;
    let active = true;

    const spawnStar = () => {
      if (!active || !container) return;

      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const startLeft = Math.random() * 50 + 5;   // 5-55%
      const startTop = Math.random() * 20 + 2;    // 2-22% — upper sky
      const angle = 25 + Math.random() * 20;       // 25-45 deg
      const duration = 1.6 + Math.random() * 0.8;  // 1.6-2.4s

      // Wrapper — moves diagonally across the sky
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        position:absolute;
        top:${startTop}%;
        left:${startLeft}%;
        width:0;height:0;
        transform:rotate(${angle}deg);
        pointer-events:none;
        z-index:2;
      `;

      // Trail — long gradient tail fading behind the head
      const trail = document.createElement('div');
      trail.style.cssText = `
        position:absolute;
        top:0;
        right:4px;
        width:120px;
        height:2px;
        border-radius:1px;
        background:linear-gradient(90deg, transparent 0%, ${color}44 20%, ${color}aa 60%, ${color} 100%);
        opacity:0;
        animation:shootingTrail ${duration}s ease-out forwards;
        will-change:transform,opacity;
      `;

      // Head — bright glowing dot at the front
      const head = document.createElement('div');
      head.style.cssText = `
        position:absolute;
        top:-2px;
        left:0;
        width:5px;
        height:5px;
        border-radius:50%;
        background:${color};
        box-shadow:0 0 8px 3px ${color}, 0 0 20px 6px ${color}88;
        opacity:0;
        animation:shootingHead ${duration}s ease-out forwards;
        will-change:transform,opacity;
      `;

      wrapper.appendChild(trail);
      wrapper.appendChild(head);
      container.appendChild(wrapper);

      // Self-cleanup
      setTimeout(() => {
        if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
      }, (duration + 0.3) * 1000);

      // Next star in 3-7s → ~2 per 10 seconds
      const nextDelay = 3000 + Math.random() * 4000;
      timeoutId = setTimeout(spawnStar, nextDelay);
    };

    // First star within 1-2s
    timeoutId = setTimeout(spawnStar, 1000 + Math.random() * 1000);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Hero Section */}
      <div className="relative pt-6 pb-32 lg:pt-10 lg:pb-48 overflow-hidden">
        {/* Sky / Sunset Gradient Background */}
        <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-[#4A6BFF] via-[#7DA4FF] to-[#FDE8D0]" />

        {/* Stars — rendered once via imperative DOM, animated purely in CSS */}
        <div
          ref={starsContainerRef}
          className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
        />

        {/* Shooting stars — random color streaks, 2-3 per minute */}
        <div
          ref={shootingStarRef}
          className="absolute inset-0 z-[1] pointer-events-none overflow-hidden"
        />

        {/* Animated Floating Orbs — downgraded blur-3xl → blur-2xl for perf */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div
            className="absolute w-[500px] h-[500px] rounded-full bg-white/10 blur-2xl -top-20 -left-40 animate-[float1_12s_ease-in-out_infinite]"
            style={{ willChange: 'transform', transform: 'translate3d(0,0,0)' }}
          />
          <div
            className="absolute w-[400px] h-[400px] rounded-full bg-indigo-300/15 blur-2xl top-[20%] right-[-10%] animate-[float2_15s_ease-in-out_infinite]"
            style={{ willChange: 'transform', transform: 'translate3d(0,0,0)' }}
          />
          <div
            className="absolute w-[300px] h-[300px] rounded-full bg-pink-200/10 blur-2xl bottom-[10%] left-[30%] animate-[float3_18s_ease-in-out_infinite]"
            style={{ willChange: 'transform', transform: 'translate3d(0,0,0)' }}
          />
          <div
            className="absolute w-[200px] h-[200px] rounded-full bg-white/15 blur-xl top-[50%] left-[10%] animate-[float2_10s_ease-in-out_infinite_reverse]"
            style={{ willChange: 'transform', transform: 'translate3d(0,0,0)' }}
          />
          <div
            className="absolute w-[350px] h-[350px] rounded-full bg-sky-200/10 blur-2xl top-[10%] left-[50%] animate-[float1_20s_ease-in-out_infinite_reverse]"
            style={{ willChange: 'transform', transform: 'translate3d(0,0,0)' }}
          />
        </div>

        {/* CSS Keyframes */}
        <style jsx>{`
          @keyframes float1 {
            0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
            33% { transform: translate3d(60px, -40px, 0) scale(1.05); }
            66% { transform: translate3d(-30px, 30px, 0) scale(0.95); }
          }
          @keyframes float2 {
            0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
            33% { transform: translate3d(-50px, 50px, 0) scale(1.08); }
            66% { transform: translate3d(40px, -20px, 0) scale(0.92); }
          }
          @keyframes float3 {
            0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
            50% { transform: translate3d(70px, -60px, 0) scale(1.1); }
          }
          @keyframes twinkle {
            0%, 100% { opacity: 0; transform: scale(0) translate3d(0, 0, 0); }
            50% { opacity: 1; transform: scale(1.35) translate3d(0, 0, 0); }
          }
          @keyframes shootingHead {
            0% { opacity: 0; transform: translate3d(0,0,0); }
            5% { opacity: 1; }
            70% { opacity: 1; }
            100% { opacity: 0; transform: translate3d(420px,0,0); }
          }
          @keyframes shootingTrail {
            0% { opacity: 0; transform: translate3d(0,0,0); }
            5% { opacity: 0.9; }
            60% { opacity: 0.7; }
            100% { opacity: 0; transform: translate3d(420px,0,0); }
          }
        `}</style>

        {/* Smooth Sunset Color Blend */}
        <div className="absolute bottom-0 left-0 right-0 h-[400px] bg-gradient-to-t from-white via-[#FF7E67]/40 15% via-[#FF7E67]/20 45% via-[#FF7E67]/5 75% to-transparent z-0 pointer-events-none" />

        {/* Navigation */}
        <nav className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white font-bold text-xl tracking-tight">
            <svg className="w-9 h-9" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M200 40C200 90 250 90 250 90C250 90 200 90 200 140C200 90 150 90 150 90C150 90 200 90 200 40Z" fill="#FDE68A" />
              <path d="M100 140L190 185V225L100 180V140Z" fill="white" />
              <path d="M210 185L300 140V180L210 225V185Z" fill="white" />
              <path d="M100 200L190 245V285L100 240V200Z" fill="rgba(255,255,255,0.85)" />
              <path d="M210 245L300 200V240L210 285V245Z" fill="rgba(255,255,255,0.85)" />
              <path d="M100 260L190 305V345L100 300V260Z" fill="rgba(255,255,255,0.7)" />
              <path d="M210 305L300 260V300L210 345V305Z" fill="rgba(255,255,255,0.7)" />
            </svg>
            BuildFlow
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-white/90">
            <a
              href="#product"
              onClick={(e) => { e.preventDefault(); document.getElementById('product')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="hover:text-white transition-colors hidden sm:block cursor-pointer"
            >
              Product
            </a>
            <a
              href="#features"
              onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="hover:text-white transition-colors hidden sm:block cursor-pointer"
            >
              Features
            </a>
            <Link href="/login" className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-5 py-2 rounded-full transition-all">
              Login
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto mt-20 lg:mt-28 px-4 text-center sm:translate-x-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-white mb-6" style={{ fontFamily: 'Georgia, serif' }}>
            Your <span className="relative inline-block">
              <span className="text-[#4C1D95] relative z-10">beautiful</span>
              <svg className="absolute w-full h-4 -bottom-1 left-0 text-[#4C1D95] z-0 opacity-80" viewBox="0 0 100 15" preserveAspectRatio="none">
                <path d="M 2 12 C 20 5, 35 14, 60 7 C 75 2, 88 11, 98 8" stroke="currentColor" strokeWidth="2.5" fill="transparent" strokeLinecap="round" />
              </svg>
            </span> generative workspace.<br className="hidden sm:block" />
            <div className="h-3 sm:h-5"></div>
            From an idea to <span className="relative inline-block">
              <span className="text-[#4C1D95] relative z-10">developer-ready docs.</span>
              <svg className="absolute w-full h-4 -bottom-1 left-0 text-[#4C1D95] z-0 opacity-80" viewBox="0 0 100 15" preserveAspectRatio="none">
                <path d="M 2 12 C 20 5, 35 14, 60 7 C 75 2, 88 11, 98 8" stroke="currentColor" strokeWidth="2.5" fill="transparent" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Make your app ideas stand out by building them with finesse.<br className="hidden md:block" />
            Transform your visions into comprehensive requirements, technical architecture, and granular task breakdowns instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="group relative inline-flex items-center gap-2.5 bg-[#111827] text-white font-semibold text-base px-9 py-4 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 hover:scale-[1.03] transition-all duration-300 overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#1E3A8A] to-[#60A5FA] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out rounded-full" />
              <span className="relative z-10 flex items-center gap-2.5">
                Start Building
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </span>
            </Link>

            <a
              href="https://github.com/sammyZi/BuildFlow"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center gap-2.5 bg-[#111827] text-white font-semibold text-base px-9 py-4 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 hover:scale-[1.03] transition-all duration-300 overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-l from-[#1E3A8A] to-[#60A5FA] origin-right scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out rounded-full" />
              <span className="relative z-10 flex items-center gap-2.5">
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                Open Source
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* Main App Screenshot — removed backdrop-blur-xl, kept static bg */}
      <div id="product" className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 lg:-mt-40 mb-32">
        <div
          className="rounded-2xl p-2 bg-white/30 border border-white/40 border-x-[#FF7E67]/20 border-b-[#FF7E67]/20"
          style={{ transform: 'translate3d(0, 0, 0)' }}
        >
          <div className="rounded-xl overflow-hidden relative bg-[#1E1E2E]">
            <Image
              src="/dash.png"
              alt="BuildFlow Dashboard"
              width={2400}
              height={1400}
              className="w-full h-auto object-cover"
              priority
            />
          </div>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-24">
        <h2 className="text-3xl md:text-4xl font-medium text-[#111827] mb-6 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
          Your projects deserve a beautiful home.
        </h2>
        <p className="text-[#4B5563] text-xl leading-relaxed max-w-2xl mx-auto">
          BuildFlow gives you an efficient, interactive way to generate software requirements and architecture. Forget chaotic notes—plan with finesse and build faster.
        </p>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-[#F8FAFC] py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold tracking-widest uppercase text-[#4A6BFF] mb-3">Features</p>
          <h2 className="text-center text-3xl md:text-4xl font-medium text-[#111827] mb-16" style={{ fontFamily: 'Georgia, serif' }}>
            Everything you need to plan, design, and ship.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-200">

            {/* Col 1 */}
            <div className="flex flex-col gap-10 py-8 md:py-0 md:pr-10">
              <div className="group">
                <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-[#111827] font-semibold text-lg mb-1.5">Interactive Workflow</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">Iterate via a conversational chat to shape and refine your requirements.</p>
              </div>
              <div className="group">
                <div className="w-11 h-11 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-[#111827] font-semibold text-lg mb-1.5">Requirements Generation</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">Produce comprehensive, actionable product specs automatically.</p>
              </div>
            </div>

            {/* Col 2 */}
            <div className="flex flex-col gap-10 py-8 md:py-0 md:px-10">
              <div className="group">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <LayoutTemplate className="w-5 h-5" />
                </div>
                <h3 className="text-[#111827] font-semibold text-lg mb-1.5">Fast vs. Detailed</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">One-shot generation or deep multi-stage architectural planning.</p>
              </div>
              <div className="group">
                <div className="w-11 h-11 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Blocks className="w-5 h-5" />
                </div>
                <h3 className="text-[#111827] font-semibold text-lg mb-1.5">System Architecture</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">Design robust technical foundations and component structures instantly.</p>
              </div>
            </div>

            {/* Col 3 */}
            <div className="flex flex-col gap-10 py-8 md:py-0 md:pl-10">
              <div className="group">
                <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <SplitSquareHorizontal className="w-5 h-5" />
                </div>
                <h3 className="text-[#111827] font-semibold text-lg mb-1.5">VSCode-Style Viewer</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">Review generated markdown artifacts in a professional split-pane UI.</p>
              </div>
              <div className="group">
                <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <ListTodo className="w-5 h-5" />
                </div>
                <h3 className="text-[#111827] font-semibold text-lg mb-1.5">Task Breakdown</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">Get granular, ready-to-code development tickets generated effortlessly.</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#111827] py-16 border-t border-[#1F2937] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 font-semibold text-xl">
              <Blocks className="w-6 h-6 text-[#60A5FA]" />
              BuildFlow
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Your beautiful generative workspace. From an idea to developer-ready docs.
            </p>
          </div>

          {/* Empty middle column */}
          <div />

          {/* Connect */}
          <div>
            <h4 className="font-bold text-lg mb-4">Connect</h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li><a href="https://github.com/sammyZi" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a></li>
              <li><a href="https://www.linkedin.com/in/samarth-bhinge/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a></li>
              <li><a href="https://www.instagram.com/sammyi_57/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a></li>
              <li><a href="mailto:bhingesamarth@gmail.com" className="hover:text-white transition-colors">Email - bhingesamarth@gmail.com</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-500 text-sm">
            © {new Date().getFullYear()} BuildFlow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}