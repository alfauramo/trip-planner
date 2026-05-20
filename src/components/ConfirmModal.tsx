import { useState, createContext, useContext, ReactNode, useRef } from 'react';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useTranslation } from 'react-i18next';

interface ConfirmContextType {
  confirm: (message: string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col justify-end">
        <div className="overlay-backdrop z-auto" onClick={onCancel} />
        <div className="sheet-mobile">
          <div className="shrink-0 flex items-center justify-center px-5 pt-6 pb-2">
            <div className="sheet-handle mb-2" />
          </div>
          <div className="px-5">
            <h3 className="overlay-title mb-2">{t('common.confirm')}</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">{message}</p>
          </div>
          <div className="flex flex-col gap-2 px-5 pb-6 pt-4">
            <button onClick={onConfirm} className="btn-danger w-full justify-center">
              {t('common.delete')}
            </button>
            <button onClick={onCancel} className="btn-secondary w-full justify-center">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay-backdrop flex items-center justify-center p-4 z-[100]">
      <div className="card p-6 max-w-sm animate-fade-in">
        <h3 className="overlay-title mb-2">{t('common.confirm')}</h3>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1 justify-center">
            {t('common.cancel')}
          </button>
          <button onClick={onConfirm} className="btn-danger flex-1 justify-center">
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = (msg: string): Promise<boolean> => {
    return new Promise((res) => {
      setMessage(msg);
      resolveRef.current = res;
      setIsOpen(true);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    resolveRef.current?.(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolveRef.current?.(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && <ConfirmDialog message={message} onConfirm={handleConfirm} onCancel={handleCancel} />}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}
