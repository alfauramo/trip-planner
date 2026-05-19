import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';

describe('usePullToRefresh', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => usePullToRefresh({ onRefresh: vi.fn() }));

    expect(result.current.pullDistance).toBe(0);
    expect(result.current.refreshing).toBe(false);
    expect(result.current.containerRef.current).toBeNull();
  });

  it('does not refresh when pull distance is below threshold', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePullToRefresh({ onRefresh, threshold: 60 }));

    act(() => {
      result.current.containerRef.current = document.createElement('div');
    });

    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientY: 0 } as Touch],
    });
    const touchMove = new TouchEvent('touchmove', {
      touches: [{ clientY: 20 } as Touch],
    });
    const touchEnd = new TouchEvent('touchend');

    act(() => {
      result.current.containerRef.current?.dispatchEvent(touchStart);
    });
    act(() => {
      result.current.containerRef.current?.dispatchEvent(touchMove);
    });
    act(() => {
      result.current.containerRef.current?.dispatchEvent(touchEnd);
    });

    expect(onRefresh).not.toHaveBeenCalled();
    expect(result.current.refreshing).toBe(false);
  });

  it('does not refresh when disabled', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePullToRefresh({ onRefresh, disabled: true }));

    act(() => {
      result.current.containerRef.current = document.createElement('div');
    });

    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientY: 0 } as Touch],
    });
    const touchEnd = new TouchEvent('touchend');

    act(() => {
      result.current.containerRef.current?.dispatchEvent(touchStart);
    });
    act(() => {
      result.current.containerRef.current?.dispatchEvent(touchEnd);
    });

    expect(onRefresh).not.toHaveBeenCalled();
  });
});
