type AvatarSize = 'sm' | 'md' | 'lg';

const sizeMap: Record<AvatarSize, { outer: string; inner: string }> = {
  sm: { outer: 'w-7 h-7', inner: 'w-6 h-6' },
  md: { outer: 'w-8 h-8', inner: 'w-7 h-7' },
  lg: { outer: 'w-20 h-20', inner: 'w-18 h-18' },
};

interface Props {
  name: string;
  url?: string | null;
  size?: AvatarSize;
  className?: string;
}

export function Avatar({ name, url, size = 'md', className = '' }: Props) {
  const initial = name.charAt(0).toUpperCase();
  const dims = sizeMap[size];

  const imgCls = `${dims.outer} rounded-full object-cover ring-2 ring-stone-100 dark:ring-stone-700 ${className}`;
  const fallbackCls = `${dims.outer} rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-medium ring-2 ring-stone-100 dark:ring-stone-700 ${className}`;

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        loading="lazy"
        className={imgCls}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }
  return <div className={fallbackCls}>{initial}</div>;
}

export function AvatarMini({ name, className = '' }: { name: string; className?: string }) {
  return (
    <div
      className={`w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-[9px] font-medium shadow-sm ring-2 ring-white dark:ring-stone-900 ${className}`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function AvatarMore({ count }: { count: number }) {
  return (
    <div className="w-7 h-7 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-[10px] font-medium text-stone-500 dark:text-stone-400 shadow-sm">
      +{count}
    </div>
  );
}
