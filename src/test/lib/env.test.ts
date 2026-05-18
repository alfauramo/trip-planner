import { describe, it, expect } from 'vitest';

describe('env configuration', () => {
  it('has SUPABASE_URL from stubbed env', () => {
    expect(import.meta.env.VITE_SUPABASE_URL).toBe('https://test.supabase.co');
  });

  it('has SUPABASE_ANON_KEY from stubbed env', () => {
    expect(import.meta.env.VITE_SUPABASE_ANON_KEY).toBe('test-anon-key');
  });
});
