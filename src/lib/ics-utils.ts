interface CalendarEvent {
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
}

function formatICSDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

function escapeICS(text: string): string {
  return text.replace(/[\\;,]/g, '\\$&').replace(/\n/g, '\\n');
}

export function generateICS(events: CalendarEvent[], calendarName: string): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Trip Planner//EN',
    `X-WR-CALNAME:${escapeICS(calendarName)}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const event of events) {
    let endDate: Date;
    if (event.endDate) {
      endDate = event.endDate;
    } else {
      endDate = new Date(event.startDate);
      endDate.setHours(endDate.getHours() + 1);
    }

    lines.push(
      'BEGIN:VEVENT',
      `DTSTART:${formatICSDate(event.startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${escapeICS(event.title)}`,
    );
    if (event.description) lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
    if (event.location) lines.push(`LOCATION:${escapeICS(event.location)}`);
    lines.push(`DTSTAMP:${formatICSDate(new Date())}`, `UID:${crypto.randomUUID()}`, 'END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadICS(events: CalendarEvent[], calendarName: string, filename: string): void {
  const ics = generateICS(events, calendarName);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
