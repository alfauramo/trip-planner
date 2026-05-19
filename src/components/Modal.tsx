import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  title?: string;
}

export function Modal({ children, onClose, title }: ModalProps) {
  const { t } = useTranslation();

  return (
    <div
      className="overlay-backdrop flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="sheet-desktop animate-scale-in">
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
