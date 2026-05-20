function requireEnv(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    if (typeof window !== 'undefined') {
      console.warn(`Variable de entorno ${key} no configurada.`);
    }
    return key === 'VITE_SUPABASE_URL' ? 'http://localhost:54321' : 'test-key';
  }
  return value;
}

export const SUPABASE_URL = requireEnv('VITE_SUPABASE_URL');
export const SUPABASE_ANON_KEY = requireEnv('VITE_SUPABASE_ANON_KEY');

export const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
