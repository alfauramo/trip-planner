import { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  title?: string;
}

export function Modal({ children, onClose, title }: ModalProps) {
  const { t } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement;
    const timer = setTimeout(() => {
      if (contentRef.current) {
        const firstInput = contentRef.current.querySelector<HTMLElement>(
          'input:not([type="hidden"]), textarea, select, button, [tabindex]:not([tabindex="-1"])',
        );
        firstInput?.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !contentRef.current) return;
      const focusable = contentRef.current.querySelectorAll<HTMLElement>(
        'input:not([type="hidden"]), textarea, select, button, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
      previousFocus.current?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="overlay-backdrop flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={contentRef}
        className="sheet-desktop animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
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
