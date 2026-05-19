import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Euro, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CURRENCIES } from '../lib/currencies';
import { useToast } from './Toast';

const tripSchema = z
  .object({
    title: z.string().min(1, 'El título es requerido'),
    description: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    total_budget: z.string().optional(),
    currency: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return new Date(data.end_date) >= new Date(data.start_date);
      }
      return true;
    },
    {
      message: 'La fecha fin no puede ser anterior a la fecha de inicio',
      path: ['end_date'],
    },
  );

type TripForm = z.infer<typeof tripSchema>;

export function EditTripForm({
  trip,
  onSave,
}: {
  trip: {
    id: string;
    title: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    total_budget?: number;
    currency?: string;
  };
  onSave: (data: Record<string, unknown>) => void;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<TripForm>({
    resolver: zodResolver(tripSchema),
    mode: 'onChange',
    defaultValues: {
      title: trip.title,
      description: trip.description || '',
      start_date: trip.start_date || '',
      end_date: trip.end_date || '',
      total_budget: trip.total_budget?.toString() || '',
      currency: trip.currency || 'EUR',
    },
  });
  const startDate = watch('start_date');

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        setSaving(true);
        try {
          setError('');
          await onSave({
            title: data.title,
            description: data.description || undefined,
            start_date: data.start_date || undefined,
            end_date: data.end_date || undefined,
            total_budget: data.total_budget ? parseFloat(data.total_budget) : undefined,
            currency: data.currency || 'EUR',
          });
          showToast(t('trip.updated') || 'Viaje actualizado');
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : t('common.error');
          setError(msg);
          showToast(msg, 'error');
        } finally {
          setSaving(false);
        }
      })}
      className="space-y-4"
    >
      {error && <div className="form-error">{error}</div>}
      <div>
        <label className="form-label">
          {t('trip.title')} <span className="form-required">*</span>
        </label>
        <input {...register('title')} className="input" />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <label className="form-label">{t('trip.description')}</label>
        <textarea {...register('description')} rows={3} className="textarea" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">{t('trip.startDate')}</label>
          <input {...register('start_date')} type="date" className="input" />
        </div>
        <div>
          <label className="form-label">{t('trip.endDate')}</label>
          <input {...register('end_date')} type="date" min={startDate || ''} className="input" />
          {errors.end_date && <p className="text-red-500 text-xs mt-1">{errors.end_date.message}</p>}
        </div>
      </div>
      <div>
        <label className="form-label">{t('trip.budget')}</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              {...register('total_budget')}
              type="number"
              step="0.01"
              min="0"
              placeholder={t('trip.budgetPlaceholder')}
              className="input pl-10"
            />
          </div>
          <select {...register('currency')} className="input px-3 py-3">
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || !isValid}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? t('common.saving') : t('common.save')}
        </button>
      </div>
    </form>
  );
}
