import { useState, useRef, useCallback, useEffect } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

export function usePullToRefresh({ onRefresh, threshold = 60, disabled }: PullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const currentPull = useRef(0);
  const onRefreshRef = useRef(onRefresh);
  const thresholdRef = useRef(threshold);
  const disabledRef = useRef(disabled);
  const refreshingRef = useRef(refreshing);
  const containerRef = useRef<HTMLDivElement>(null);

  onRefreshRef.current = onRefresh;
  thresholdRef.current = threshold;
  disabledRef.current = disabled;
  refreshingRef.current = refreshing;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabledRef.current || refreshingRef.current) return;
    if (containerRef.current && containerRef.current.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling.current || disabledRef.current || refreshingRef.current) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      const resistance = Math.min(diff * 0.4, 120);
      currentPull.current = resistance;
      setPullDistance(resistance);
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current || disabledRef.current) return;
    pulling.current = false;
    if (currentPull.current >= thresholdRef.current) {
      setRefreshing(true);
      setPullDistance(thresholdRef.current);
      try {
        await onRefreshRef.current();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || disabled) return;
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd);
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, disabled]);

  return { containerRef, pullDistance, refreshing };
}
