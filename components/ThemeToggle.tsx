'use client';

import { useEffect, useRef, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

// ─── tiny imperative cube flyout ──────────────────────────────────────────────
function spawnCube(
  startX: number,
  startY: number,
  isDark: boolean,
  onLand: (x: number, y: number) => void
) {
  const cube = document.createElement('div');

  // Destination: random point in the middle 60% of the viewport
  const destX = window.innerWidth * (0.2 + Math.random() * 0.6);
  const destY = window.innerHeight * (0.2 + Math.random() * 0.6);
  const dx = destX - startX;
  const dy = destY - startY;
  const dist = Math.hypot(dx, dy);
  const duration = 320 + dist * 0.22; // proportional to distance

  // Cube colours echoing the theme being entered
  const faceColor = isDark
    ? 'rgba(14,35,83,0.92)'   // entering dark → deep navy
    : 'rgba(99,132,255,0.92)'; // entering light → brand blue
  const edgeColor = isDark
    ? 'rgba(125,164,255,0.55)'
    : 'rgba(255,255,255,0.55)';

  const size = 28;

  cube.style.cssText = `
    position: fixed;
    z-index: 99999;
    width: ${size}px;
    height: ${size}px;
    left: ${startX - size / 2}px;
    top: ${startY - size / 2}px;
    pointer-events: none;
    transform-style: preserve-3d;
    perspective: 400px;
    will-change: transform, opacity;
  `;

  // Six faces of the cube using outline-box trick with borders
  const faceStyles = [
    // front
    `position:absolute;width:100%;height:100%;background:${faceColor};border:1.5px solid ${edgeColor};transform:translateZ(${size / 2}px);`,
    // back
    `position:absolute;width:100%;height:100%;background:${faceColor};border:1.5px solid ${edgeColor};transform:rotateY(180deg) translateZ(${size / 2}px);`,
    // left
    `position:absolute;width:${size}px;height:100%;background:${faceColor};border:1.5px solid ${edgeColor};transform:rotateY(-90deg) translateZ(${size / 2}px);`,
    // right
    `position:absolute;width:${size}px;height:100%;background:${faceColor};border:1.5px solid ${edgeColor};transform:rotateY(90deg) translateZ(${size / 2}px);`,
    // top
    `position:absolute;width:100%;height:${size}px;background:${faceColor};border:1.5px solid ${edgeColor};transform:rotateX(90deg) translateZ(${size / 2}px);`,
    // bottom
    `position:absolute;width:100%;height:${size}px;background:${faceColor};border:1.5px solid ${edgeColor};transform:rotateX(-90deg) translateZ(${size / 2}px);`,
  ];

  faceStyles.forEach((s) => {
    const face = document.createElement('div');
    face.style.cssText = s;
    cube.appendChild(face);
  });

  document.body.appendChild(cube);

  const start = performance.now();

  const tick = (now: number) => {
    const t = Math.min((now - start) / duration, 1);
    // fast-slow-fast easing: sin²(πt/2) for first half then cos² for second
    const eased =
      t < 0.5
        ? 2 * t * t                     // fast start
        : 1 - Math.pow(-2 * t + 2, 2) / 2; // slow middle then fast end

    const curX = startX + dx * eased - size / 2;
    const curY = startY + dy * eased - size / 2;
    const rotX = eased * 540;
    const rotY = eased * 360;
    const scale = t < 0.5 ? 1 + t * 0.8 : 1.4 - (t - 0.5) * 0.8;
    const opacity = t > 0.78 ? 1 - (t - 0.78) / 0.22 : 1;

    cube.style.left = `${curX}px`;
    cube.style.top = `${curY}px`;
    cube.style.opacity = String(opacity);
    cube.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`;

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      cube.remove();
      onLand(destX, destY);
    }
  };

  requestAnimationFrame(tick);
}

// ─── component ────────────────────────────────────────────────────────────────
export default function ThemeToggle({
  className = '',
  variant = 'hero',
}: {
  className?: string;
  variant?: 'hero' | 'surface';
}) {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !dark;
    const root = document.documentElement;

    const persist = () => {
      try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch { /* */ }
    };
    const applyTheme = () => {
      root.classList.toggle('dark', next);
      setDark(next);
    };

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const startViewTransition = (document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    }).startViewTransition?.bind(document);

    if (!btnRef.current || reduceMotion) {
      applyTheme();
      persist();
      return;
    }

    const rect = btnRef.current.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    // 1. Spawn the cube — when it lands, trigger the circle reveal from its
    //    landing spot so the circle "bursts" from where the cube hits.
    spawnCube(originX, originY, next, (landX, landY) => {
      if (!startViewTransition) {
        applyTheme();
        persist();
        return;
      }

      const endRadius = Math.hypot(
        Math.max(landX, window.innerWidth - landX),
        Math.max(landY, window.innerHeight - landY)
      );

      const transition = startViewTransition(() => { applyTheme(); });
      persist();

      transition.ready.then(() => {
        root.animate(
          [
            { clipPath: `circle(0px at ${landX}px ${landY}px)`,              opacity: 0.9, filter: 'blur(8px)', offset: 0    },
            { clipPath: `circle(${endRadius * 0.25}px at ${landX}px ${landY}px)`, opacity: 1,   filter: 'blur(2px)', offset: 0.28 },
            { clipPath: `circle(${endRadius * 0.62}px at ${landX}px ${landY}px)`, opacity: 1,   filter: 'blur(0px)', offset: 0.68 },
            { clipPath: `circle(${endRadius}px at ${landX}px ${landY}px)`,    opacity: 1,   filter: 'blur(0px)', offset: 1    },
          ],
          {
            duration: 600,
            easing: 'linear',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      });
    });
  };

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full backdrop-blur-md transition-all ${
        variant === 'hero'
          ? 'bg-white/20 text-white hover:bg-white/30'
          : 'bg-black/5 text-slate-600 hover:bg-black/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20'
      } ${className}`}
    >
      <span
        className={`absolute transition-all duration-500 ease-out ${
          mounted && dark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
        }`}
      >
        <Sun className="h-[18px] w-[18px]" />
      </span>
      <span
        className={`absolute transition-all duration-500 ease-out ${
          mounted && !dark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        }`}
      >
        <Moon className="h-[18px] w-[18px]" />
      </span>
    </button>
  );
}
