import { useState, useCallback, useRef, useEffect } from 'react';
import { Loader2, Check, AlertTriangle } from 'lucide-react';

interface Props {
  onClick: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  successLabel?: string;
  errorLabel?: string;
}

export function AsyncButton({ onClick, children, className = '', disabled, successLabel, errorLabel }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (state === 'success' || state === 'error') {
      const timer = setTimeout(() => {
        if (mounted.current) setState('idle');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const handleClick = useCallback(async () => {
    if (state !== 'idle') return;
    setState('loading');
    try {
      await onClick();
      if (mounted.current) setState('success');
    } catch {
      if (mounted.current) setState('error');
    }
  }, [onClick, state]);

  const isDisabled = disabled || state === 'loading';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={`flex items-center justify-center gap-2 transition-all ${className} ${
        isDisabled ? 'opacity-70 cursor-not-allowed' : ''
      } ${state === 'success' ? 'bg-green-500 text-white' : ''} ${state === 'error' ? 'bg-red-500 text-white' : ''}`}
    >
      {state === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
      {state === 'success' && <Check className="w-4 h-4" />}
      {state === 'error' && <AlertTriangle className="w-4 h-4" />}
      {state === 'success' && successLabel ? successLabel : state === 'error' && errorLabel ? errorLabel : children}
    </button>
  );
}
