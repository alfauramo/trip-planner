import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appUrl, appPath } from '../../lib/urls';

describe('appUrl', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://example.com' },
      writable: true,
    });
  });

  it('builds URL with BASE_URL', () => {
    const url = appUrl('/invite/abc');
    expect(url).toContain('https://example.com');
    expect(url).toContain('/invite/abc');
  });

  it('adds leading slash if missing', () => {
    const url = appUrl('invite/abc');
    expect(url).toContain('/invite/abc');
  });

  it('builds trip URL correctly', () => {
    const url = appUrl('/trips/123');
    expect(url).toContain('/trips/123');
  });
});

describe('appPath', () => {
  it('returns path with BASE_URL prefix', () => {
    const path = appPath('/trips/123');
    expect(path).toContain('/trips/123');
  });

  it('handles missing leading slash', () => {
    const path = appPath('trips/123');
    expect(path.startsWith('/')).toBe(true);
  });
});
