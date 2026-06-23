import React from 'react';

interface LogoProps {
  className?: string;
  /** Force the block paths to always render white (e.g. inside a dark sidebar) */
  alwaysLight?: boolean;
}

export function Logo({ className = 'w-8 h-8', alwaysLight = false }: LogoProps) {
  const blockClass = alwaysLight
    ? 'fill-white'
    : 'fill-text-primary dark:fill-white';

  return (
    <svg
      className={className}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Star */}
      <path
        d="M200 40C200 90 250 90 250 90C250 90 200 90 200 140C200 90 150 90 150 90C150 90 200 90 200 40Z"
        className="fill-primary"
      />
      {/* Level 1 */}
      <path d="M100 140L190 185V225L100 180V140Z" className={blockClass} />
      <path d="M210 185L300 140V180L210 225V185Z" className={blockClass} />
      {/* Level 2 */}
      <path d="M100 200L190 245V285L100 240V200Z" className={blockClass} />
      <path d="M210 245L300 200V240L210 285V245Z" className={blockClass} />
      {/* Level 3 */}
      <path d="M100 260L190 305V345L100 300V260Z" className={blockClass} />
      <path d="M210 305L300 260V300L210 345V305Z" className={blockClass} />
    </svg>
  );
}
