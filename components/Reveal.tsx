'use client';

import { useEffect, useRef, useState, type ReactNode, type ElementType } from 'react';

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** delay in ms before the reveal transition starts */
  delay?: number;
  /** vertical offset to rise from, in px */
  y?: number;
  as?: ElementType;
};

export default function Reveal({
  children,
  className = '',
  delay = 0,
  y = 24,
  as = 'div',
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Tag = as;

  return (
    <Tag
      ref={ref}
      className={`transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        shown ? 'translate-y-0 opacity-100' : 'opacity-0'
      } ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        transform: shown ? 'translateY(0)' : `translateY(${y}px)`,
      }}
    >
      {children}
    </Tag>
  );
}
