import { useMemo } from 'react';
import { type TripEvent, type Day } from '../types';

const EVENT_COLORS: Record<string, string> = {
  activity: 'bg-blue-500',
  accommodation: 'bg-purple-500',
  transport: 'bg-orange-500',
  restaurant: 'bg-green-500',
  shopping: 'bg-pink-500',
  todo: 'bg-yellow-500',
};
const DEFAULT_COLOR = 'bg-stone-400';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonthName(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  const weeks: (Date | null)[][] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  let currentRow: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) {
    currentRow.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    currentRow.push(new Date(year, month, d));
    if (currentRow.length === 7) {
      weeks.push(currentRow);
      currentRow = [];
    }
  }
  if (currentRow.length > 0) {
    while (currentRow.length < 7) {
      currentRow.push(null);
    }
    weeks.push(currentRow);
  }
  return weeks;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function TripCalendar({
  days,
  onDayClick,
}: {
  days: (Day & { events: TripEvent[] })[];
  onDayClick?: (day: Day & { events: TripEvent[] }) => void;
}) {
  const months = useMemo(() => {
    const dateMap = new Map<string, (Day & { events: TripEvent[] })[]>();
    const allDates: Date[] = [];
    for (const day of days) {
      const d = new Date(day.date + 'T00:00:00');
      if (isNaN(d.getTime())) continue;
      allDates.push(d);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const existing = dateMap.get(key) || [];
      existing.push(day);
      dateMap.set(key, existing);
    }
    if (allDates.length === 0) return [];

    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

    const result: { label: string; grid: (Date | null)[][]; year: number; month: number }[] = [];
    const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

    while (current <= end) {
      const y = current.getFullYear();
      const m = current.getMonth();
      result.push({
        label: getMonthName(current),
        grid: buildMonthGrid(y, m),
        year: y,
        month: m,
      });
      current.setMonth(current.getMonth() + 1);
    }
    return result;
  }, [days]);

  const dayMap = useMemo(() => {
    const map = new Map<string, (Day & { events: TripEvent[] })[]>();
    for (const day of days) {
      const d = new Date(day.date + 'T00:00:00');
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const existing = map.get(key) || [];
      existing.push(day);
      map.set(key, existing);
    }
    return map;
  }, [days]);

  if (months.length === 0) {
    return (
      <div className="text-center py-12 text-stone-400 dark:text-stone-500">
        <p className="text-sm">No hay fechas en el itinerario</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {months.map((month) => (
        <div key={`${month.year}-${month.month}`} className="w-full">
          <h3 className="text-base font-semibold text-stone-800 dark:text-white mb-3">{month.label}</h3>
          <div className="grid grid-cols-7 gap-px bg-stone-200 dark:bg-stone-700 rounded-lg overflow-hidden text-center text-xs sm:text-sm">
            {WEEKDAYS.map((wd) => (
              <div
                key={wd}
                className="py-1.5 sm:py-2 bg-stone-100 dark:bg-stone-800 font-medium text-stone-500 dark:text-stone-400"
              >
                {wd}
              </div>
            ))}
            {month.grid.flat().map((cell, idx) => {
              if (!cell) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="py-2 sm:py-3 bg-white dark:bg-stone-900 text-stone-300 dark:text-stone-700"
                  />
                );
              }
              const key = `${cell.getFullYear()}-${cell.getMonth()}-${cell.getDate()}`;
              const dayEntries = dayMap.get(key) || [];
              const allEvents = dayEntries.flatMap((d) => d.events);
              const uniqueTypes = [...new Set(allEvents.map((e) => e.event_type))];
              const isToday = sameDay(cell, new Date());

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (dayEntries.length > 0 && onDayClick) {
                      onDayClick(dayEntries[0]);
                    }
                  }}
                  className={`py-2 sm:py-3 bg-white dark:bg-stone-900 relative transition-colors ${
                    dayEntries.length > 0
                      ? 'cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                      : 'cursor-default'
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs sm:text-sm ${
                      isToday ? 'bg-emerald-600 text-white font-bold' : 'text-stone-700 dark:text-stone-300'
                    } ${allEvents.length > 0 && !isToday ? 'font-semibold' : ''}`}
                  >
                    {cell.getDate()}
                  </span>
                  {uniqueTypes.length > 0 && (
                    <div className="flex gap-0.5 justify-center mt-0.5">
                      {uniqueTypes.slice(0, 3).map((type) => (
                        <span
                          key={type}
                          className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${EVENT_COLORS[type] || DEFAULT_COLOR}`}
                          title={type}
                        />
                      ))}
                      {uniqueTypes.length > 3 && (
                        <span className="text-[9px] sm:text-[10px] text-stone-400 leading-none">
                          +{uniqueTypes.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
