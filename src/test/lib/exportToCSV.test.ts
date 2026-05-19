import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToCSV } from '../../lib/exportToCSV';

describe('exportToCSV', () => {
  const mockMembers = [
    {
      id: 'm1',
      user_id: 'u1',
      full_name: 'Alice',
      alias: null,
      email: 'alice@test.com',
      role: 'member',
      created_at: '',
    },
    { id: 'm2', user_id: 'u2', full_name: null, alias: 'Bob', email: 'bob@test.com', role: 'member', created_at: '' },
  ];
  const mockDays = [
    { id: 'd1', date: '2026-05-01' },
    { id: 'd2', date: '2026-05-02' },
  ];
  const mockEvents = [
    {
      id: 'e1',
      day_id: 'd1',
      name: 'Hotel',
      event_type: 'accommodation' as const,
      cost_amount: 200,
      cost_currency: 'EUR',
      expense_category: 'accommodation' as const,
      payer_id: 'u1',
      participants: ['u1', 'u2'],
      notes: 'Reservation',
      order: 0,
    },
    {
      id: 'e2',
      day_id: 'd2',
      name: 'Dinner',
      event_type: 'restaurant' as const,
      cost_amount: 50,
      cost_currency: 'USD',
      expense_category: 'food' as const,
      payer_id: 'u2',
      participants: ['u1'],
      notes: '',
      order: 1,
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    URL.createObjectURL = vi.fn(() => 'blob:test');
    URL.revokeObjectURL = vi.fn();
  });

  it('creates a download link and clicks it', () => {
    const clickSpy = vi.fn();
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickSpy,
    } as unknown as HTMLAnchorElement);

    exportToCSV(mockEvents, mockMembers, mockDays);

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(clickSpy).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
  });

  it('handles empty events array', () => {
    const clickSpy = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickSpy,
    } as unknown as HTMLAnchorElement);

    expect(() => exportToCSV([], mockMembers, mockDays)).not.toThrow();
    expect(clickSpy).toHaveBeenCalled();
  });

  it('falls back to window.open when click fails', () => {
    const clickSpy = vi.fn(() => {
      throw new Error('click failed');
    });
    const openSpy = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickSpy,
    } as unknown as HTMLAnchorElement);
    vi.spyOn(window, 'open').mockImplementation(openSpy);

    exportToCSV(mockEvents, mockMembers, mockDays);
    expect(openSpy).toHaveBeenCalled();
  });
});
