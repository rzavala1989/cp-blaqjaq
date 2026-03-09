import { useState, useEffect } from 'react';

const query = '(prefers-reduced-motion: reduce)';
const getMatch = (): MediaQueryList | null =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(query)
    : null;

export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(
    () => getMatch()?.matches ?? false
  );

  useEffect(() => {
    const mql = getMatch();
    if (!mql) return;
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}
