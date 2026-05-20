import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TripEvent, TripMember } from '../types';

interface ExpenseChartsProps {
  events: TripEvent[];
  members: TripMember[];
}

const CATEGORY_COLORS: Record<string, string> = {
  food: '#f97316',
  transport: '#3b82f6',
  accommodation: '#a855f7',
  activities: '#22c55e',
  shopping: '#ec4899',
  other: '#6b7280',
};

function getMemberName(memberId: string | undefined, members: TripMember[], t: (key: string) => string): string {
  if (!memberId) return t('expenses.category.unknown');
  const member = members.find((m) => m.user_id === memberId);
  if (!member) return t('expenses.category.unknown');
  if (member.profile?.full_name) return member.profile.full_name;
  if (member.profile?.alias) return member.profile.alias;
  return member.email.split('@')[0];
}

export function ExpenseCharts({ events, members }: ExpenseChartsProps) {
  const { t } = useTranslation();
  const currency = events.find((e) => e.cost_currency)?.cost_currency || 'EUR';

  const CATEGORY_LABELS: Record<string, string> = {
    food: t('expenses.category.food'),
    transport: t('expenses.category.transport'),
    accommodation: t('expenses.category.accommodation'),
    activities: t('expenses.category.activities'),
    shopping: t('expenses.category.shopping'),
    other: t('expenses.category.other'),
  };

  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {};
    events.forEach((event) => {
      if (event.cost_amount && event.expense_category) {
        const cat = event.expense_category;
        totals[cat] = (totals[cat] || 0) + event.cost_amount;
      }
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name: CATEGORY_LABELS[name] || name, value, rawName: name }))
      .filter((d) => d.value > 0);
  }, [events]);

  const memberData = useMemo(() => {
    const totals: Record<string, number> = {};
    events.forEach((event) => {
      if (event.cost_amount && event.payer_id) {
        totals[event.payer_id] = (totals[event.payer_id] || 0) + event.cost_amount;
      }
    });
    return Object.entries(totals)
      .map(([id, value]) => ({ name: getMemberName(id, members, t), value }))
      .filter((d) => d.value > 0);
  }, [events, members]);

  const hasCategoryData = categoryData.length > 0;
  const hasMemberData = memberData.length > 0;

  const totalSpent = useMemo(() => {
    return events.reduce((sum, e) => sum + (e.cost_amount || 0), 0);
  }, [events]);

  if (!hasCategoryData && !hasMemberData) {
    return (
      <div className="card p-6">
        <p className="text-stone-400 dark:text-stone-500 text-center text-sm">{t('expenses.none')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {totalSpent > 0 && (
        <div className="card p-5">
          <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wide font-medium mb-1">
            {t('expenses.total')}
          </p>
          <p className="text-2xl font-bold text-stone-800 dark:text-white">
            {new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(totalSpent)}
          </p>
        </div>
      )}

      {hasCategoryData && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-stone-800 dark:text-white mb-4">{t('expenses.byCategory')}</h3>
          <div className="relative w-40 h-40 mx-auto">
            <svg viewBox="0 0 36 36" className="w-full h-full">
              {categoryData.map((entry, i) => {
                const total = categoryData.reduce((s, d) => s + d.value, 0);
                const pct = (entry.value / total) * 100;
                const circumference = 100;
                const offset = categoryData.slice(0, i).reduce((s, d) => s + (d.value / total) * circumference, 0);
                return (
                  <circle
                    key={entry.rawName}
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke={CATEGORY_COLORS[entry.rawName] || '#6b7280'}
                    strokeWidth="4"
                    strokeDasharray={`${(pct * circumference) / 100} ${circumference - (pct * circumference) / 100}`}
                    strokeDashoffset={-offset}
                    className="transition-all duration-500"
                  />
                );
              })}
              <text x="18" y="17" textAnchor="middle" className="text-[6px] fill-stone-400">
                Total
              </text>
              <text x="18" y="22" textAnchor="middle" className="text-[8px] font-bold fill-stone-800 dark:fill-white">
                {new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(totalSpent)}
              </text>
            </svg>
            <div className="mt-3 space-y-1">
              {categoryData.map((entry) => (
                <div key={entry.rawName} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded" style={{ background: CATEGORY_COLORS[entry.rawName] }} />
                  <span className="text-stone-600 dark:text-stone-300">{entry.name}</span>
                  <span className="ml-auto text-stone-400">
                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(entry.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {hasMemberData && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-stone-800 dark:text-white mb-4">{t('expenses.byMember')}</h3>
          <div className="space-y-2">
            {memberData.map((entry) => {
              const max = Math.max(...memberData.map((d) => d.value), 1);
              const pct = (entry.value / max) * 100;
              return (
                <div key={entry.name} className="flex items-center gap-2">
                  <span className="text-xs text-stone-600 dark:text-stone-300 w-24 truncate">{entry.name}</span>
                  <div className="flex-1 h-5 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-stone-500 w-16 text-right">
                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(entry.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
