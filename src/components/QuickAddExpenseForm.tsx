import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EXPENSE_CATEGORIES, ExpenseCategory } from '../types';
import { getMemberDisplayName } from './EventHelpers';
import { useToast } from './Toast';
import { formatDate } from '../lib/date-utils';

export function QuickAddExpenseForm({
  days,
  members,
  onSave,
  currency = 'EUR',
}: {
  days: { id: string; day_number: number; date: string }[];
  members: { id: string; user_id?: string; email: string; profile?: { full_name?: string; alias?: string } }[];
  onSave: (
    dayId: string,
    data: {
      name: string;
      event_type: string;
      cost_amount: number;
      cost_currency: string;
      expense_category: ExpenseCategory;
      payer_id: string;
      participants?: string[];
    },
  ) => void;
  currency?: string;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState(days[0]?.id || '');
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const toggleParticipant = (id: string) => {
    setSelectedParticipants((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="form-label">
          {t('expenses.concept')} <span className="form-required">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('expenses.conceptPlaceholder')}
          className="input"
        />
      </div>
      <div>
        <label className="form-label">
          {t('expenses.amount')} <span className="form-required">*</span>
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0"
          className="input"
        />
      </div>
      <div>
        <label className="form-label">
          {t('expenses.day')} <span className="form-required">*</span>
        </label>
        <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="input">
          {days.map((day) => (
            <option key={day.id} value={day.id}>
              Día {day.day_number} - {formatDate(day.date)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="form-label">
          {t('expenses.paidBy')} <span className="form-required">*</span>
        </label>
        <select value={payerId} onChange={(e) => setPayerId(e.target.value)} className="input">
          <option value="">{t('common.select')}</option>
          {members.map((m) => (
            <option key={m.id} value={m.user_id || m.id}>
              {getMemberDisplayName(m)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="form-label">{t('expenses.category')}</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(EXPENSE_CATEGORIES) as ExpenseCategory[]).map((cat) => {
            const catInfo = EXPENSE_CATEGORIES[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1 ${category === cat ? `${catInfo.color} ring-2 ring-emerald-500` : 'bg-stone-50 dark:bg-stone-700 text-stone-600 dark:text-stone-300'}`}
              >
                <span>{catInfo.icon}</span>
                <span>{catInfo.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="form-label">{t('expenses.sharedBetween')}</label>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => {
            const id = m.user_id || m.id;
            const isSelected = selectedParticipants.includes(id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleParticipant(id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${isSelected ? 'bg-emerald-500 text-white' : 'bg-white text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700'}`}
              >
                {getMemberDisplayName(m)}
              </button>
            );
          })}
        </div>
        {selectedParticipants.length > 0 && amount && (
          <p className="text-xs text-stone-500 mt-2">
            {parseFloat(amount) / selectedParticipants.length}
            {t('expenses.perPersonAmount')}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={async () => {
          const parsedAmount = parseFloat(amount);
          if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
            showToast(t('expenses.invalidAmount'), 'error');
            return;
          }
          setSaving(true);
          try {
            await onSave(selectedDay, {
              name,
              event_type: 'activity',
              cost_amount: parsedAmount,
              cost_currency: currency,
              expense_category: category,
              payer_id: payerId,
              participants: selectedParticipants.length > 0 ? selectedParticipants : undefined,
            });
            showToast(t('expenses.added'), 'success');
          } catch {
            showToast(t('expenses.saveError'), 'error');
          } finally {
            setSaving(false);
          }
        }}
        disabled={!name || !amount || !selectedDay || !payerId || saving}
        className="btn-primary w-full"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('expenses.addExpense')}
      </button>
    </div>
  );
}
