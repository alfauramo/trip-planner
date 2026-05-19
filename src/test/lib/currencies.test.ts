import { describe, it, expect } from 'vitest';
import { CURRENCIES, getCurrencyInfo, formatCurrency } from '../../lib/currencies';

describe('CURRENCIES', () => {
  it('contains all major currencies', () => {
    const codes = CURRENCIES.map((c) => c.code);
    expect(codes).toContain('EUR');
    expect(codes).toContain('USD');
    expect(codes).toContain('GBP');
    expect(codes).toContain('JPY');
    expect(codes).toContain('THB');
    expect(codes).toContain('IDR');
  });

  it('each entry has required fields', () => {
    for (const c of CURRENCIES) {
      expect(c.code).toBeTruthy();
      expect(c.symbol).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.locale).toBeTruthy();
    }
  });

  it('has unique codes', () => {
    const codes = CURRENCIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('getCurrencyInfo', () => {
  it('returns info for existing currency', () => {
    const info = getCurrencyInfo('EUR');
    expect(info.code).toBe('EUR');
    expect(info.symbol).toBe('€');
    expect(info.locale).toBe('es-ES');
  });

  it('falls back to defaults for unknown currency', () => {
    const info = getCurrencyInfo('XYZ');
    expect(info.code).toBe('XYZ');
    expect(info.symbol).toBe('XYZ');
    expect(info.locale).toBe('es-ES');
  });
});

describe('formatCurrency', () => {
  it('formats EUR with es-ES locale', () => {
    const result = formatCurrency(1234.56, 'EUR');
    expect(result).toContain('1234');
    expect(result).toContain('56');
    expect(result).toContain('€');
  });

  it('formats USD with en-US locale', () => {
    const result = formatCurrency(99.99, 'USD');
    expect(result).toContain('99');
    expect(result).toContain('99');
  });

  it('defaults to EUR', () => {
    const result = formatCurrency(100);
    expect(result).toContain('100');
  });

  it('handles zero', () => {
    const result = formatCurrency(0, 'EUR');
    expect(result).toContain('0');
  });
});
