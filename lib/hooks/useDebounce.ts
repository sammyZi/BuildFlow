import { useEffect, useRef, useState } from 'react';

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms
 * have passed without `value` changing. Ideal for filtering a list as the
 * user types — the filter runs once typing pauses, not on every keystroke.
 */
export function useDebounce<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

/**
 * Returns a throttled copy of `value` that updates at most once per
 * `interval` ms. Useful for high-frequency sources (scroll, resize, live
 * metrics) where you want steady updates rather than a single trailing one.
 */
export function useThrottle<T>(value: T, interval = 250): T {
  const [throttled, setThrottled] = useState(value);
  const lastRun = useRef(Date.now());

  useEffect(() => {
    const elapsed = Date.now() - lastRun.current;
    if (elapsed >= interval) {
      lastRun.current = Date.now();
      setThrottled(value);
      return;
    }
    const id = setTimeout(() => {
      lastRun.current = Date.now();
      setThrottled(value);
    }, interval - elapsed);
    return () => clearTimeout(id);
  }, [value, interval]);

  return throttled;
}
