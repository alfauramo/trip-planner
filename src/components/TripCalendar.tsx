import { CalendarDays } from 'lucide-react';
import { type Day, type TripEvent } from '../types';
import { useTranslation } from 'react-i18next';

export function TripCalendar({
  days,
  onDayClick,
}: {
  days: (Day & { events: TripEvent[] })[];
  onDayClick: (day: Day & { events: TripEvent[] }) => void;
}) {
  const { t } = useTranslation();

  if (days.length === 0) return null;

  const dayMap = new Map<string, Day & { events: TripEvent[] }>();
  for (const d of days) {
    dayMap.set(d.date, d);
  }

  const dates = days.map((d) => {
    const [y, m, day] = d.date.split('-').map(Number);
    return new Date(y, m - 1, day);
  });
  const firstDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const lastDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  const monthStart = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
  const monthEnd = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0);

  const startDay = monthStart.getDay();
  const totalDays = monthEnd.getDate();

  const formatKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    cells.push(d);
  }

  return (
    <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm overflow-hidden border border-stone-100 dark:border-stone-700/50">
      <div className="px-4 py-3.5 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-emerald-50/50 dark:from-stone-800 dark:to-stone-800 border-b border-stone-100 dark:border-stone-700/50">
        <h3 className="font-semibold text-stone-800 dark:text-white flex items-center gap-2 text-sm">
          <CalendarDays className="w-4 h-4 text-emerald-600" />
          {monthNames[monthStart.getMonth()]} {monthStart.getFullYear()}
        </h3>
        <span className="text-xs text-stone-400">
          {days.length} {t('day.title')}
        </span>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
            <div key={i} className="text-center text-xs font-medium text-stone-400 py-1">
              {day}
            </div>
          ))}
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="aspect-square" />;
            }
            const cellDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
            const key = formatKey(cellDate);
            const tripDay = dayMap.get(key);
            const isTripDay = !!tripDay;
            const eventCount = tripDay?.events.length ?? 0;

            return (
              <button
                key={i}
                onClick={() => tripDay && onDayClick(tripDay)}
                disabled={!tripDay}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all ${
                  isTripDay
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 font-semibold hover:bg-emerald-200 dark:hover:bg-emerald-900/50 cursor-pointer'
                    : 'text-stone-300 dark:text-stone-600 cursor-default'
                }`}
              >
                <span>{day}</span>
                {eventCount > 0 && (
                  <span className="text-[10px] leading-none text-emerald-600/70 dark:text-emerald-400/70">
                    {eventCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
