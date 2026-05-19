const locale = 'es-ES';

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(dateString: string): string {
  return new Date(dateString).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateFull(dateString: string): string {
  return new Date(dateString).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatTime(time?: string): string {
  return time || '-';
}

export function formatTimeRange(start?: string, end?: string): string {
  if (!start && !end) return '-';
  if (!end) return start || '-';
  if (!start) return end;
  return `${start} - ${end}`;
}

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;

export function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < MINUTE) return 'ahora';
  if (seconds < HOUR) {
    const m = Math.floor(seconds / MINUTE);
    return `hace ${m} min`;
  }
  if (seconds < DAY) {
    const h = Math.floor(seconds / HOUR);
    return `hace ${h}h`;
  }
  const d = Math.floor(seconds / DAY);
  if (d === 1) return 'ayer';
  return `hace ${d} días`;
}
