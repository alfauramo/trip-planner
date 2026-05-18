import { ReactNode, useEffect, useRef, useState, useCallback } from 'react';
import { useIsMobile } from '../hooks/useMediaQuery';
import { hapticMedium } from '../lib/haptic';

interface BottomSheetProps {
  children: ReactNode;
  onClose: () => void;
  title?: string;
}

export function BottomSheet({ children, onClose, title }: BottomSheetProps) {
  const isMobile = useIsMobile();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [offsetY, setOffsetY] = useState(0);
  const startY = useRef(0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = '' };
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (sheetRef.current && sheetRef.current.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    setDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) setOffsetY(Math.min(diff, 200));
  }, [dragging]);

  const handleTouchEnd = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    if (offsetY > 120) {
      hapticMedium();
      onClose();
    } else {
      setOffsetY(0);
    }
  }, [dragging, offsetY, onClose]);

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
        <div
          ref={sheetRef}
          className="relative bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up overflow-hidden"
          style={{ transform: dragging ? `translateY(${offsetY}px)` : offsetY > 0 ? `translateY(${offsetY}px)` : '', transition: dragging ? 'none' : 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="shrink-0 flex items-center justify-between px-5 pt-2 pb-1">
            <div
              className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto cursor-grab active:cursor-grabbing"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          </div>
          {title && (
            <div className="shrink-0 flex items-center justify-between px-5 pb-3 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
              <button onClick={onClose} className="p-1.5 -mr-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <div className="overflow-y-auto p-5 flex-1">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
