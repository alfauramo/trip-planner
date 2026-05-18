import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMediaQuery, useIsMobile } from '../../hooks/useMediaQuery';

describe('useMediaQuery', () => {
  it('returns false by default', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(false);
  });

  it('returns true when query matches', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(max-width: 767px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });
});
