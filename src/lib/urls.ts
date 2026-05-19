const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function appUrl(path: string): string {
  return `${window.location.origin}${BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

export function appPath(path: string): string {
  return `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
}
