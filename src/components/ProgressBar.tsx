interface Props {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  size?: 'sm' | 'md';
}

export function ProgressBar({ value, max = 100, className = '', barClassName = '', size = 'md' }: Props) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5';
  return (
    <div className={`w-full bg-stone-200 dark:bg-stone-700 rounded-full ${height} ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-300 ${barClassName || 'bg-brand-500'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
