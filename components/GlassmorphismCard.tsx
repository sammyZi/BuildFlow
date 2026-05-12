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
        backdrop-blur-md 
        rounded-lg 
        p-6 
        shadow-[0_0_15px_rgba(255,255,255,0.5),0_0_30px_rgba(200,200,255,0.3)] 
        border 
        border-white/60
        ${className}
      `}
    >
      {children}
    </div>
  );
}
