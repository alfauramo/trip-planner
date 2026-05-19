import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hapticLight, hapticMedium, hapticHeavy, hapticSelection } from '../../lib/haptic';

beforeEach(() => {
  const vibrate = vi.fn<[number], boolean>().mockReturnValue(true);
  Object.defineProperty(navigator, 'vibrate', { value: vibrate, writable: true, configurable: true });
});

describe('haptic', () => {
  it('hapticLight calls vibrate with 10', () => {
    hapticLight();
    expect(navigator.vibrate).toHaveBeenCalledWith(10);
  });

  it('hapticMedium calls vibrate with 20', () => {
    hapticMedium();
    expect(navigator.vibrate).toHaveBeenCalledWith(20);
  });

  it('hapticHeavy calls vibrate with 40', () => {
    hapticHeavy();
    expect(navigator.vibrate).toHaveBeenCalledWith(40);
  });

  it('hapticSelection calls vibrate with 15', () => {
    hapticSelection();
    expect(navigator.vibrate).toHaveBeenCalledWith(15);
  });

  it('does not throw when vibrate is undefined', () => {
    Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true });
    expect(() => hapticLight()).not.toThrow();
  });
});
