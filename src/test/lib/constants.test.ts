import { describe, it, expect } from 'vitest';
import { Z_INDEX } from '../../lib/constants';

describe('Z_INDEX', () => {
  it('has all expected tokens', () => {
    expect(Z_INDEX.MODAL).toBe(50);
    expect(Z_INDEX.BOTTOM_SHEET).toBe(50);
    expect(Z_INDEX.MOBILE_NAV).toBe(40);
    expect(Z_INDEX.TOAST).toBe(200);
    expect(Z_INDEX.CONFIRM_MODAL).toBe(100);
    expect(Z_INDEX.TOOLTIP).toBe(300);
    expect(Z_INDEX.NOTIFICATION_DROPDOWN).toBe(45);
    expect(Z_INDEX.FAB).toBe(30);
  });

  it('toast is highest among overlays', () => {
    expect(Z_INDEX.TOAST).toBeGreaterThan(Z_INDEX.CONFIRM_MODAL);
  });

  it('tooltip is highest of all', () => {
    const values = Object.values(Z_INDEX);
    const max = Math.max(...values);
    expect(Z_INDEX.TOOLTIP).toBe(max);
  });
});
