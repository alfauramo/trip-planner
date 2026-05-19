import { describe, it, expect } from 'vitest';
import { formatDate, formatTime, formatTimeRange, formatRelativeTime } from '../../lib/date-utils';

describe('formatDate', () => {
  it('formats a valid date string', () => {
    const result = formatDate('2024-06-15');
    expect(result).toContain('2024');
    expect(result).toContain('jun');
  });
});

describe('formatTime', () => {
  it('returns time string as-is', () => {
    expect(formatTime('14:30')).toBe('14:30');
  });

  it('returns dash for undefined', () => {
    expect(formatTime()).toBe('-');
  });
});

describe('formatTimeRange', () => {
  it('returns single time if end is missing', () => {
    expect(formatTimeRange('09:00')).toBe('09:00');
  });

  it('returns single time if start is missing', () => {
    expect(formatTimeRange(undefined, '18:00')).toBe('18:00');
  });

  it('returns dash for both missing', () => {
    expect(formatTimeRange()).toBe('-');
  });

  it('returns formatted range for both times', () => {
    expect(formatTimeRange('09:00', '17:00')).toBe('09:00 - 17:00');
  });
});

describe('formatRelativeTime', () => {
  it('returns "ahora" for very recent times', () => {
    const now = new Date();
    const result = formatRelativeTime(now.toISOString());
    expect(result).toBe('ahora');
  });

  it('returns minutes ago', () => {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const result = formatRelativeTime(tenMinAgo.toISOString());
    expect(result).toMatch(/hace \d+ min/);
  });

  it('returns hours ago', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const result = formatRelativeTime(threeHoursAgo.toISOString());
    expect(result).toMatch(/hace \d+h/);
  });

  it('returns days ago', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const result = formatRelativeTime(twoDaysAgo.toISOString());
    expect(result).toMatch(/hace \d+ días/);
  });

  it('returns "ayer" for exactly one day', () => {
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const result = formatRelativeTime(yesterday.toISOString());
    expect(result).toBe('ayer');
  });
});
