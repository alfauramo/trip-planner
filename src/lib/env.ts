function requireEnv(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`⚠️ Variable de entorno ${key} no configurada. Crea un archivo .env con ${key}=tu_valor`);
  }
  return value;
}

export const SUPABASE_URL = requireEnv('VITE_SUPABASE_URL');
export const SUPABASE_ANON_KEY = requireEnv('VITE_SUPABASE_ANON_KEY');
