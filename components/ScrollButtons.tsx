'use client';

import { ChevronUp, ChevronDown } from 'lucide-react';
import { RefObject, useEffect, useState } from 'react';

export default function ScrollButtons({ 
  containerRef,
  className = "fixed bottom-8 right-8"
}: { 
  containerRef: RefObject<HTMLElement | null>;
  className?: string;
}) {
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    const handleScroll = () => {
      setShowTop(el.scrollTop > 200);
      // Check if we are near bottom (within 100px)
      setShowBottom(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
    };
    
    handleScroll();
    
    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    const observer = new MutationObserver(handleScroll);
    observer.observe(el, { childList: true, subtree: true, characterData: true });
    
    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      observer.disconnect();
    };
  }, [containerRef]);

  const scrollToTop = () => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () => containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });

  // If there isn't enough scrollable content, hide both
  if (!showTop && !showBottom) return null;

  return (
    <div className={`${className} flex flex-col gap-3 z-40`}>
      <button 
        onClick={scrollToTop}
        title="Scroll to top"
        className={`p-3 bg-white border border-border/60 text-primary shadow-xl hover:shadow-2xl hover:bg-surface-alt rounded-full hover:-translate-y-1 transition-all duration-300 flex items-center justify-center ${showTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        <ChevronUp size={24} strokeWidth={2.5} />
      </button>
      <button 
        onClick={scrollToBottom}
        title="Scroll to bottom"
        className={`p-3 bg-white border border-border/60 text-primary shadow-xl hover:shadow-2xl hover:bg-surface-alt rounded-full hover:translate-y-1 transition-all duration-300 flex items-center justify-center ${showBottom ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
      >
        <ChevronDown size={24} strokeWidth={2.5} />
      </button>
    </div>
  );
}
