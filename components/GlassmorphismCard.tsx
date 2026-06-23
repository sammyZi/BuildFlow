import React from 'react';

interface GlassmorphismCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function GlassmorphismCard({ children, className = '' }: GlassmorphismCardProps) {
  return (
    <div
      className={`
        bg-white/40 
        dark:bg-white/[0.04]
        backdrop-blur-md 
        rounded-lg 
        p-6 
        shadow-[0_0_15px_rgba(255,255,255,0.5),0_0_30px_rgba(200,200,255,0.3)] 
        dark:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]
        border 
        border-white/60
        dark:border-white/10
        ${className}
      `}
    >
      {children}
    </div>
  );
}
