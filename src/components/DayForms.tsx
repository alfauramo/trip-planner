import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from './Toast';

export function AddDayForm({
  startDate,
  lastDate,
  onSave,
}: {
  startDate?: string;
  lastDate?: string;
  onSave: (date: string, notes?: string) => void;
}) {
  const getDefaultDate = () => {
    if (lastDate) {
      const d = new Date(lastDate);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    }
    if (startDate) return startDate;
    return new Date().toISOString().split('T')[0];
  };
  const { t } = useTranslation();
  const [date, setDate] = useState(getDefaultDate());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  return (
    <div className="space-y-4">
      <div>
        <label className="form-label">{t('day.date')}</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input"
          min={startDate || undefined}
        />
      </div>
      <div>
        <label className="form-label">{t('day.description')}</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="textarea"
          placeholder={t('day.notes')}
        />
      </div>
      <button
        onClick={async () => {
          if (!date) {
            showToast(t('errors.dateRequired'), 'error');
            return;
          }
          setSaving(true);
          try {
            await onSave(date, notes || undefined);
            showToast(t('common.saved'), 'success');
          } catch {
            showToast(t('errors.save'), 'error');
          } finally {
            setSaving(false);
          }
        }}
        disabled={saving}
        className="btn-primary w-full"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('day.add')}
      </button>
    </div>
  );
}

export function EditDayForm({
  day,
  onSave,
}: {
  day: { id: string; date: string; notes?: string };
  onSave: (updates: { date: string; notes?: string }) => void;
}) {
  const { t } = useTranslation();
  const [date, setDate] = useState(day.date);
  const [notes, setNotes] = useState(day.notes || '');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  return (
    <div className="space-y-4">
      <div>
        <label className="form-label">{t('day.date')}</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
      </div>
      <div>
        <label className="form-label">{t('day.description')}</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="textarea"
          placeholder={t('day.notes')}
        />
      </div>
      <button
        onClick={async () => {
          setSaving(true);
          try {
            await onSave({ date, notes: notes || undefined });
            showToast(t('common.saved'), 'success');
          } catch {
            showToast(t('errors.save'), 'error');
          } finally {
            setSaving(false);
          }
        }}
        disabled={saving}
        className="btn-primary w-full"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('common.save')}
      </button>
    </div>
  );
}
