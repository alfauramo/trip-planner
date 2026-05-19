import { useState } from 'react';

interface Props {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  loading?: 'lazy' | 'eager';
}

export function ImageWithFallback({ src, alt, className, fallback, loading = 'lazy' }: Props) {
  const [hasError, setHasError] = useState(false);
  if (hasError) return <>{fallback}</>;
  return <img src={src} alt={alt} loading={loading} className={className} onError={() => setHasError(true)} />;
}
