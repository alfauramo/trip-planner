import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Receipt, Plus, Download, TrendingUp, ArrowRight } from 'lucide-react';
import { Day, TripEvent, TripMember, ExpenseCategory, EXPENSE_CATEGORIES } from '../types';
import { formatCurrency } from '../lib/currencies';
import { exportToCSV } from '../lib/exportToCSV';
import { ExpenseCharts } from './ExpenseCharts';
import { getMemberDisplayName } from './EventHelpers';
import { computeSettlements } from '../lib/expense-utils';
import { ProgressBar } from './ProgressBar';

export function ExpensesSection({
  days,
  members,
  onAddExpense,
  onAddDay,
  tripBudget,
  tripCurrency,
  isMobile,
  isViewer,
}: {
  days: (Day & { events: TripEvent[] })[];
  members: TripMember[];
  onAddExpense: () => void;
  onAddDay: () => void;
  tripBudget?: number;
  tripCurrency?: string;
  isMobile?: boolean;
  isViewer?: boolean;
}) {
  const { t } = useTranslation();
  const allEvents = useMemo(() => days.flatMap((d) => d.events), [days]);
  const eventsWithCost = useMemo(() => allEvents.filter((e) => e.cost_amount && e.cost_amount > 0), [allEvents]);

  const settlementResult = useMemo(() => {
    const mappedMembers = members
      .filter((m) => m.status === 'accepted' && m.user_id)
      .map((m) => ({ id: m.user_id!, email: m.email }));
    return computeSettlements(eventsWithCost, mappedMembers);
  }, [eventsWithCost, members]);
  const { totalExpenses, memberBalances, settlements: rawSettlements } = settlementResult;

  const categoryStats = useMemo(
    () =>
      eventsWithCost.reduce(
        (acc, e) => {
          const cat = e.expense_category || 'other';
          acc[cat] = (acc[cat] || 0) + (e.cost_amount || 0);
          return acc;
        },
        {} as Record<string, number>,
      ),
    [eventsWithCost],
  );

  const sortedCategories = useMemo(() => {
    const catEntries = Object.entries(categoryStats) as [string, number][];
    return catEntries
      .sort((entryA, entryB) => entryB[1] - entryA[1])
      .map(([cat, expenseAmt]) => ({
        category: cat as ExpenseCategory,
        amount: expenseAmt,
        percentage: totalExpenses > 0 ? (expenseAmt / totalExpenses) * 100 : 0,
      }));
  }, [categoryStats, totalExpenses]);

  const memberStats = useMemo(
    () =>
      memberBalances.map((mb) => {
        const member = members.find((m) => m.user_id === mb.memberId);
        return {
          userId: mb.memberId,
          email: mb.email,
          displayName: member ? getMemberDisplayName(member) : mb.email,
          paid: mb.paid,
          owed: mb.owes,
          balance: mb.balance,
        };
      }),
    [memberBalances, members],
  );

  const settlements = useMemo(
    () =>
      rawSettlements.map((s) => {
        const fromMember = members.find((m) => m.user_id === s.fromId);
        const toMember = members.find((m) => m.user_id === s.toId);
        return {
          from: s.fromId,
          fromName: fromMember ? getMemberDisplayName(fromMember) : s.fromEmail,
          to: s.toId,
          toName: toMember ? getMemberDisplayName(toMember) : s.toEmail,
          amount: s.amount,
        };
      }),
    [rawSettlements, members],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title flex items-center gap-2">
          <Receipt className="w-5 h-5" /> {t('expenses.title')}
        </h2>
        <div className="flex items-center gap-2">
          {!isViewer && days.length === 0 ? (
            <button
              type="button"
              onClick={onAddDay}
              className="flex items-center gap-1 text-brand-600 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> {t('day.add')}
            </button>
          ) : !isViewer ? (
            <>
              <button
                type="button"
                onClick={onAddExpense}
                aria-label={t('expenses.add')}
                className="btn-primary px-4 py-2 text-sm"
              >
                <Plus className="w-4 h-4" /> {isMobile ? '' : t('expenses.add')}
              </button>
              {!isMobile && (
                <button
                  type="button"
                  onClick={() => exportToCSV(eventsWithCost, members, days)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${eventsWithCost.length > 0 ? 'bg-stone-100 text-stone-700 hover:bg-stone-200' : 'bg-stone-50 text-stone-400 cursor-not-allowed opacity-50'}`}
                  disabled={eventsWithCost.length === 0}
                >
                  <Download className="w-4 h-4" /> {t('common.export')}
                </button>
              )}
            </>
          ) : null}
        </div>
      </div>

      <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs opacity-80">{t('expenses.total')}</span>
          </div>
          <span className="text-xs opacity-80">{t('expenses.count', { count: eventsWithCost.length })}</span>
        </div>
        <p className="text-2xl font-bold">{formatCurrency(totalExpenses, tripCurrency || 'EUR')}</p>
        {tripBudget && tripBudget > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="opacity-80">
                {t('expenses.budget')}: {formatCurrency(tripBudget, tripCurrency || 'EUR')}
              </span>
              <span className="opacity-80">{Math.round((totalExpenses / tripBudget) * 100)}%</span>
            </div>
            <ProgressBar
              value={totalExpenses}
              max={tripBudget}
              className="bg-white/30"
              barClassName={totalExpenses > tripBudget ? 'bg-red-400' : 'bg-white'}
            />
            <p className={`text-xs mt-1 ${totalExpenses > tripBudget ? 'text-red-200' : 'opacity-80'}`}>
              {totalExpenses > tripBudget
                ? t('trip.budget.exceeded', { amount: formatCurrency(totalExpenses - tripBudget) })
                : t('trip.budget.remaining', { amount: formatCurrency(tripBudget - totalExpenses) })}
            </p>
          </div>
        )}
      </div>

      {eventsWithCost.length > 0 && isMobile && (
        <div className="card overflow-hidden">
          <div className="list-header">{t('expenses.visualSummary')}</div>
          <div className="p-3">
            <ExpenseCharts events={allEvents} members={members} />
          </div>
        </div>
      )}

      {eventsWithCost.length > 0 && (
        <div className="card overflow-hidden">
          <div className="list-header">{t('expenses.byCategory')}</div>
          <div className={`${isMobile ? 'p-4' : 'p-5'} space-y-3`}>
            {sortedCategories.map(({ category, amount, percentage }) => {
              const catInfo = EXPENSE_CATEGORIES[category];
              return (
                <div key={category}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="flex items-center gap-1.5">
                      <span>{catInfo.icon}</span>
                      <span className="text-xs font-medium text-stone-700 dark:text-stone-300">{catInfo.label}</span>
                    </span>
                    <span className="text-xs font-medium text-stone-800 dark:text-white">
                      {formatCurrency(amount)} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <ProgressBar
                    value={percentage}
                    size="sm"
                    barClassName={
                      category === 'food'
                        ? 'bg-orange-500'
                        : category === 'transport'
                          ? 'bg-blue-500'
                          : category === 'accommodation'
                            ? 'bg-purple-500'
                            : category === 'activities'
                              ? 'bg-green-500'
                              : category === 'shopping'
                                ? 'bg-pink-500'
                                : 'bg-gray-500'
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="list-header">{t('expenses.perPerson')}</div>
        {memberStats.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">{t('expenses.noData')}</p>
          </div>
        ) : (
          <div className="list-item-divider">
            {memberStats.map((stat) => (
              <div key={stat.userId} className="list-item list-enter">
                <div>
                  <p className="text-sm font-medium text-stone-800 dark:text-white">{stat.displayName}</p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {t('expenses.paidLabel')}: {formatCurrency(stat.paid)} · {t('expenses.owesLabel')}:{' '}
                    {formatCurrency(stat.owed)}
                  </p>
                </div>
                <div className={`text-right ${stat.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <p className="font-semibold text-sm">
                    {stat.balance >= 0 ? '+' : ''}
                    {formatCurrency(stat.balance)}
                  </p>
                  <p className="text-xs">{stat.balance >= 0 ? t('expenses.isOwed') : t('expenses.owesLabel')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {settlements.length > 0 && (
        <div className="card overflow-hidden">
          <div className="list-header">{t('expenses.settlement')}</div>
          <div className="list-item-divider">
            {settlements.map((s, idx) => (
              <div key={idx} className="list-item list-enter">
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="text-red-600 font-medium">{s.fromName}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-green-600 font-medium">{s.toName}</span>
                </div>
                <span className="font-semibold text-sm text-stone-800 dark:text-white">{formatCurrency(s.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {eventsWithCost.length > 0 && (
        <div className="card overflow-hidden">
          <div className="list-header">{t('expenses.breakdown')}</div>
          <div className="list-item-divider">
            {eventsWithCost.map((event) => {
              const payer = members.find((m) => m.user_id === event.payer_id);
              const participants = event.participants || [];
              return (
                <div key={event.id} className="list-item list-enter">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-stone-800 dark:text-white">{event.name}</p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {payer
                          ? t('expenses.paidByName', { name: getMemberDisplayName(payer) })
                          : t('expenses.noPayer')}
                        {participants.length > 0 && ` · ${t('expenses.people', { count: participants.length })}`}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-stone-800 dark:text-white shrink-0">
                      {formatCurrency(event.cost_amount!, event.cost_currency)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
