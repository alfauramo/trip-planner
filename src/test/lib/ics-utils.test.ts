import { describe, it, expect } from 'vitest';
import { generateICS } from '../../lib/ics-utils';

describe('generateICS', () => {
  it('generates valid ICS for empty event list', () => {
    const ics = generateICS([], 'Test Calendar');
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).not.toContain('BEGIN:VEVENT');
  });

  it('generates ICS with a single event', () => {
    const start = new Date('2025-06-15T09:00:00');
    const events = [{ title: 'Tour Eiffel', startDate: start }];
    const ics = generateICS(events, 'Paris Trip');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:Tour Eiffel');
    expect(ics).toContain('DTSTART:');
    expect(ics).toContain('DTEND:');
    expect(ics).toContain('END:VEVENT');
  });

  it('auto-calculates end time 1 hour after start if not provided', () => {
    const start = new Date('2025-06-15T09:00:00');
    const events = [{ title: 'Lunch', startDate: start }];
    const ics = generateICS(events, 'Trip');
    expect(ics).toContain('SUMMARY:Lunch');
  });

  it('includes description and location when provided', () => {
    const start = new Date('2025-06-15T14:00:00');
    const end = new Date('2025-06-15T16:00:00');
    const events = [
      {
        title: 'Museum',
        startDate: start,
        endDate: end,
        description: 'Louvre visit',
        location: 'Paris, France',
      },
    ];
    const ics = generateICS(events, 'Trip');
    expect(ics).toContain('DESCRIPTION:Louvre visit');
    expect(ics).toContain('LOCATION:Paris\\, France');
  });

  it('generates UID for each event', () => {
    const events = [
      { title: 'A', startDate: new Date('2025-01-01') },
      { title: 'B', startDate: new Date('2025-01-02') },
    ];
    const ics = generateICS(events, 'Trip');
    const uidCount = (ics.match(/UID:/g) || []).length;
    expect(uidCount).toBe(2);
  });
});
