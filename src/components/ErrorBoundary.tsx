import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';
import i18n from '../lib/i18n';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-[200px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-14 h-14 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-white mb-1">
              {i18n.t('errors.somethingWentWrong')}
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
              {this.state.error?.message || i18n.t('errors.unexpected')}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="btn-primary px-4 py-2 text-sm rounded-lg"
            >
              {i18n.t('common.retry')}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
