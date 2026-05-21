import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useIsMobile } from '../hooks/useMediaQuery';

interface ToastOptions {
  undoLabel?: string;
  undoAction?: () => void;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
  undoLabel?: string;
  undoAction?: () => void;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error', options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const isMobile = useIsMobile();

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success', options?: ToastOptions) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type, ...options }]);
    if (!options?.undoAction) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className={`fixed ${isMobile ? 'bottom-20 left-4 right-4' : 'top-4 left-1/2 -translate-x-1/2'} z-[200] flex flex-col gap-2`}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-xl shadow-lg shadow-elevated text-white flex items-center gap-2 animate-slide-in ${
              toast.type === 'success' ? 'bg-brand-500' : 'bg-red-500'
            } ${isMobile ? 'w-full' : ''}`}
          >
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            {toast.undoAction && (
              <button
                onClick={() => {
                  toast.undoAction?.();
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                }}
                className="ml-auto shrink-0 px-2 py-1 text-xs font-semibold bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                {toast.undoLabel || 'Undo'}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
