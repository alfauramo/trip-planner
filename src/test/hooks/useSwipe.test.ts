import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSwipe } from '../../hooks/useSwipe';

describe('useSwipe', () => {
  it('returns ref and bind', () => {
    const { result } = renderHook(() => useSwipe({ onSwipeLeft: vi.fn() }));
    expect(result.current.ref).toBeDefined();
    expect(result.current.bind).toBeInstanceOf(Function);
  });
});
