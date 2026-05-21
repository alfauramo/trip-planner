import { useTranslation } from 'react-i18next';

export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-3', lg: 'w-12 h-12 border-4' };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} border-brand-500 border-t-transparent rounded-full animate-spin`} />
    </div>
  );
}

export function LoadingOverlay({ message }: { message?: string }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-stone-900/80 flex flex-col items-center justify-center z-50">
      <Spinner size="lg" />
      <p className="mt-4 text-stone-600 dark:text-stone-300">{message ?? t('common.loading')}</p>
    </div>
  );
}

function ShimmerBar({ className = '' }: { className?: string }) {
  return <div className={`bg-stone-200 dark:bg-stone-700 rounded shimmer ${className}`} />;
}

export function LoadingCard({ variant }: { variant?: 'trip' | 'compact' }) {
  if (variant === 'compact') {
    return (
      <div className="flex gap-3 p-3 bg-white dark:bg-stone-800 rounded-xl">
        <ShimmerBar className="w-20 h-20 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <ShimmerBar className="h-4 w-3/4" />
          <ShimmerBar className="h-3 w-1/2" />
          <ShimmerBar className="h-3 w-1/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl overflow-hidden shadow-soft">
      <ShimmerBar className="aspect-video w-full" />
      <div className="p-5 space-y-3">
        <ShimmerBar className="h-5 w-2/3" />
        <ShimmerBar className="h-3 w-full" />
        <ShimmerBar className="h-3 w-1/2" />
        <div className="flex gap-4 mt-2">
          <ShimmerBar className="h-3 w-24" />
          <ShimmerBar className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <div className="bg-white dark:bg-stone-800 p-6 mb-6">
        <div className="max-w-4xl mx-auto space-y-3">
          <ShimmerBar className="h-8 w-1/4" />
          <ShimmerBar className="h-4 w-1/3" />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 space-y-4">
        <LoadingCard variant="compact" />
        <LoadingCard variant="compact" />
        <LoadingCard variant="compact" />
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <div className="bg-white dark:bg-stone-800">
        <div className="px-4 py-3 flex items-center gap-3">
          <ShimmerBar className="w-8 h-8 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <ShimmerBar className="h-5 w-1/2" />
            <ShimmerBar className="h-3 w-1/3" />
          </div>
        </div>
        <ShimmerBar className="h-36 w-full" />
        <div className="px-4 py-3 flex gap-2 overflow-x-auto">
          {[1, 2, 3, 4].map((i) => (
            <ShimmerBar key={i} className="h-8 w-24 rounded-full shrink-0" />
          ))}
        </div>
      </div>
      <div className="px-4 py-4 space-y-3">
        <ShimmerBar className="h-40 w-full rounded-xl" />
        <ShimmerBar className="h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}
