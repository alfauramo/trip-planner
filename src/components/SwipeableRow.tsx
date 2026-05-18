import { useRef, useState, useCallback, ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import { hapticMedium } from '../lib/haptic';

interface SwipeableRowProps {
  children: ReactNode;
  onDelete: () => void;
  disabled?: boolean;
}

export function SwipeableRow({ children, onDelete, disabled }: SwipeableRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [swiping, setSwiping] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [deleteRevealed, setDeleteRevealed] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);

  const reset = useCallback(() => {
    setSwiping(false);
    setOffsetX(0);
    setDeleteRevealed(false);
    currentX.current = 0;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    setSwiping(true);
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping || disabled) return;
    const diffX = e.touches[0].clientX - startX.current;
    const diffY = e.touches[0].clientY - startY.current;
    if (Math.abs(diffY) > Math.abs(diffX) * 1.5 && Math.abs(diffY) > 10) {
      setSwiping(false);
      reset();
      return;
    }
    if (diffX > 10) { reset(); return; }
    const clamped = Math.max(diffX, -120);
    setOffsetX(clamped);
    currentX.current = clamped;
  }, [swiping, disabled, reset]);

  const handleTouchEnd = useCallback(() => {
    if (!swiping || disabled) return;
    setSwiping(false);
    if (currentX.current < -70) {
      hapticMedium();
      setDeleteRevealed(true);
      setOffsetX(-80);
    } else {
      reset();
    }
  }, [swiping, disabled, reset]);

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden rounded-xl" ref={containerRef}>
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-red-500 rounded-xl transition-opacity"
        style={{ width: 80, opacity: deleteRevealed ? 1 : 0 }}
      >
        <button
          onClick={() => { reset(); onDelete(); }}
          className="w-10 h-10 flex items-center justify-center text-white"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
      <div
        className="relative bg-white dark:bg-gray-800 z-10"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: swiping ? 'none' : 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
          touchAction: 'pan-y',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
