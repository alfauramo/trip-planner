import { ReactNode, useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { useIsMobile } from '../hooks/useMediaQuery';
import { hapticMedium } from '../lib/haptic';
import { useTranslation } from 'react-i18next';

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
  const offsetYRef = useRef(0);
  const draggingRef = useRef(false);
  const startY = useRef(0);
  const { t } = useTranslation();
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    previousFocus.current = document.activeElement as HTMLElement;
    const timer = setTimeout(() => {
      if (sheetRef.current) {
        const firstInput = sheetRef.current.querySelector<HTMLElement>(
          'input:not([type="hidden"]), textarea, select, button, [tabindex]:not([tabindex="-1"])',
        );
        firstInput?.focus();
      }
    }, 100);
    return () => {
      document.body.style.overflow = '';
      clearTimeout(timer);
      previousFocus.current?.focus();
    };
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (sheetRef.current && sheetRef.current.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    draggingRef.current = true;
    setDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!draggingRef.current) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      const clamped = Math.min(diff, 200);
      offsetYRef.current = clamped;
      setOffsetY(clamped);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    if (offsetYRef.current > 120) {
      hapticMedium();
      onClose();
    } else {
      offsetYRef.current = 0;
      setOffsetY(0);
    }
  }, []);

  if (isMobile) {
    return (
      <div
        className="overlay-backdrop flex flex-col justify-end"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          ref={sheetRef}
          className="sheet-mobile"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          style={{
            transform: dragging ? `translateY(${offsetY}px)` : offsetY > 0 ? `translateY(${offsetY}px)` : '',
            transition: dragging ? 'none' : 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="shrink-0 flex items-center justify-center px-5 py-2">
            <div
              className="sheet-handle"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          </div>
          {title && (
            <div className="shrink-0 flex items-center justify-between px-5 pb-3 border-b border-stone-100 dark:border-stone-800">
              <h2 className="overlay-title">{title}</h2>
              <button type="button" onClick={onClose} aria-label={t('common.close')} className="sheet-close-btn">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          <div className="overflow-y-auto p-5 flex-1">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="overlay-backdrop flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="sheet-desktop" role="dialog" aria-modal="true" aria-label={title}>
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="overlay-title">{title}</h2>
            <button type="button" onClick={onClose} aria-label={t('common.close')} className="btn-icon">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
